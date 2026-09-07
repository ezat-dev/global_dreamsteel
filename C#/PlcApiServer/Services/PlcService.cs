// ============================================================================
// PlcService.cs  (partial class 공통부 — 타입 분기 진입점 + TCP 연결 관리)
// ============================================================================
// [파일 역할]
//   PLC 1대와의 실제 통신을 담당하는 클래스의 "공통 부분". 이 클래스 인스턴스 1개가
//   물리적인 PLC 1대(하나의 ip:port)에 대응하며, PlcServiceCache가 이 인스턴스를 캐싱해서
//   재사용한다 (PlcServiceCache.cs 참고).
//
//   지원 프로토콜 3종 (PlcType 값으로 구분):
//     - "LS"          : LS산전 XGT 시리즈, FEnet 프로토콜        → PlcService.Ls.cs
//     - "MITSUBISHI"  : 미쓰비시 Q시리즈, MC Protocol 3E Binary  → PlcService.Mitsubishi.cs
//     - "MODBUS_TCP"  : 범용 Modbus TCP                         → PlcService.Modbus.cs
//   프로토콜별 실제 패킷 조립/파싱 코드는 위 3개 파일(같은 클래스의 partial 파일)에 나눠져 있고,
//   이 파일은 "어느 프로토콜로 보낼지 분기"와 "TCP 소켓 연결/재연결 관리"만 담당한다.
//
// [처리 흐름 — 웹 요청이 이 클래스까지 오는 경로 및 DB와의 관계]
//   웹 → 5050 → Program.cs 핸들러
//     → PlcRegistry 또는 PlcRepository(DB 조회)를 거쳐 PlcServiceCache.GetOrCreate()로
//       "이 PLC 전용" PlcService 인스턴스를 얻는다.
//     → Program.cs가 이 인스턴스의 ReadWordsAsync/WriteWordAsync/ReadBitsAsync/WriteBitAsync
//       (전부 이 파일에 정의) 를 호출한다.
//     → 이 메서드들이 PlcType에 따라 Ls/Mitsubishi/Modbus 중 하나의 실제 구현으로 위임한다.
//     → 그 구현이 WithConnectionAsync(이 파일)를 통해 TCP 소켓으로 PLC와 직접 통신한다.
//     → 결과(ushort[]/bool[])가 그대로 Program.cs까지 돌아가 JSON으로 응답된다.
//   ※ 이 클래스는 DB를 전혀 모른다 — DB(MariaDB) 접근은 항상 호출하는 쪽(Program.cs, Repositories)의
//     책임이고, PlcService는 순수하게 "PLC와의 TCP 통신"만 담당한다.
// ============================================================================

using System.Net.Sockets;
using PlcApiServer.Logging;

namespace PlcApiServer.Services;

public partial class PlcService
{
    // ── 런타임 설정 (PlcServiceCache.CacheItem.Create/Update 에서 채워짐, API로 변경 가능) ──
    public string PlcIp   { get; set; } = "192.168.1.238";
    public int PlcPort    { get; set; } = 2004;
    public string PlcType { get; set; } = "LS";   // "LS" | "MITSUBISHI" | "MODBUS_TCP"
    public string Label   { get; set; } = "";

    // Modbus/LS 트랜잭션 ID 채번용 카운터 (요청-응답 매칭에 사용, 스레드 안전하게 Interlocked로 증가)
    private int _invokeId = 1;
    // 이 PLC 인스턴스에 대한 요청 직렬화 락 — 동시에 여러 요청이 같은 TCP 연결을 건드리지 않도록 보장
    private readonly SemaphoreSlim _lock = new(1, 1);

    // ── 우선순위 힌트: START/END/MOVE 서비스가 읽기 직전에 증가, 완료 후 감소 ──
    // (현재 해당 서비스들은 비활성화 상태지만, AlarmMonitorService 등 다른 폴러가
    //  이 힌트를 보고 자리를 양보하도록 설계된 값이라 그대로 유지)
    private int _priorityWaiting = 0;
    public void IncrementPriority() => Interlocked.Increment(ref _priorityWaiting);
    public void DecrementPriority() => Interlocked.Decrement(ref _priorityWaiting);
    public bool HasPriorityWaiting => Volatile.Read(ref _priorityWaiting) > 0;

    // 이 PLC와 마지막으로 통신에 성공한 시각(UTC). Program.cs의 /api/plc/ping·/ping/{id}·/status-all이
    // 새 TCP 연결 없이 "최근에 정상 통신했는지"만 빠르게 확인할 때 사용한다.
    public DateTime? LastSuccessAt { get; private set; }

    // 1차 재연결 로그 쿨다운 — 같은 PLC의 반복 reconnect 노이즈 억제
    // 2차 실패(진짜 장애) / 락 타임아웃은 쿨다운 없이 항상 기록
    private DateTime _lastReconnectLogAt = DateTime.MinValue;
    private static readonly TimeSpan ReconnectLogCooldown = TimeSpan.FromSeconds(60);
    private bool TryLogReconnect(string msg)
    {
        var now = DateTime.Now;
        if (now - _lastReconnectLogAt < ReconnectLogCooldown) return false;
        _lastReconnectLogAt = now;
        ScFileLogger.Write("COMM", msg);   // D:\SC_LOG\YYYYMMDD.log 에 통신 로그 기록
        return true;
    }

    // 영구 연결 (재사용) — LS/Modbus/Mitsubishi 전부 이 TCP 연결을 계속 붙들고 재사용한다
    // (연결/재연결 정책은 WithConnectionAsync/EnsureConnectedAsync 참고).
    private TcpClient?     _tcp;
    private NetworkStream? _ns;

    // ========================================================================
    // [공개 API] Program.cs가 직접 호출하는 진입점 — PlcType에 따라 실제 구현으로 위임
    // ========================================================================

    //  읽기 - WORD
    //  device : 디바이스 접두어. 미쓰비시(D/W/R → 워드, M/X/Y/B/S → 비트),
    //           LS(D/M/L/P 등 영역 문자 그대로 사용, 전부 Continuous 경로). Modbus는 무시.
    public async Task<ushort[]> ReadWordsAsync(int startD, int count, string device = "D")
    {
        var type = (PlcType ?? "LS").ToUpperInvariant();
        if (type == "MITSUBISHI") return await MitsubishiReadAsync(startD, count, device);
        if (type == "MODBUS_TCP") return await ModbusReadWordsAsync(startD, count);

        return await LsReadWordsAsync(startD, count, (device ?? "D").ToUpperInvariant());
    }

    //  여러 (start,count) 구간을 한 번에 읽어 "주소 → 값" 맵으로 합쳐서 반환한다.
    //  AlarmMonitorService/TempMonitorService처럼 한 폴링 주기에 같은 PLC를 여러 청크로 나눠
    //  읽어야 하는 폴러 전용 — 미쓰비시는 청크마다 새 TCP 연결을 맺지 않고 연결 1개로 전부 처리해서
    //  (동시 접속 슬롯이 적은 FX5UC 내장 이더넷 포트 등에서) 연결이 자주 끊기는 문제를 줄인다.
    //  LS/Modbus는 이미 영구 연결(_tcp/_ns)을 재사용하므로 굳이 배치할 필요가 없어 기존 방식대로 순회한다.
    //  onRangeError: 구간 하나가 실패했을 때 호출자가 로그를 남길 수 있게 하는 콜백(선택).
    public async Task<Dictionary<int, int>> ReadWordsBatchAsync(
        List<(int Start, int Count)> ranges, string device = "D",
        Action<int, int, Exception>? onRangeError = null)
    {
        var type = (PlcType ?? "LS").ToUpperInvariant();
        if (type == "MITSUBISHI")
        {
            byte deviceCode = GetMitsubishiDeviceCode(device);
            bool isBit = IsMitsubishiBitDevice(device);
            return await MitsubishiReadWordsBatchAsync(ranges, deviceCode, isBit, onRangeError);
        }

        var result = new Dictionary<int, int>();
        foreach (var (start, count) in ranges)
        {
            try
            {
                ushort[] values = await ReadWordsAsync(start, count, device);
                for (int i = 0; i < values.Length; i++)
                    result[start + i] = values[i];
            }
            catch (Exception ex)
            {
                onRangeError?.Invoke(start, count, ex);
            }
        }
        return result;
    }

    //  읽기 - BIT
    //  device : 미쓰비시(M/L/X/Y/B 등, 기본값 "M") / LS(M/L/P, 기본값 "M" — D는 비트 불가).
    //           MODBUS_TCP는 device를 무시하고 address 자체가 영역(0x/1x/2x)을 나타낸다.
    public async Task<bool[]> ReadBitsAsync(int startAddress, int count, string device = "M")
    {
        var type = (PlcType ?? "LS").ToUpperInvariant();
        if (type == "MITSUBISHI")
            return await MitsubishiReadBitsAsync(startAddress, count, GetMitsubishiDeviceCode(device));
        if (type == "MODBUS_TCP")
            return await ModbusReadBitsAsync(startAddress, count);

        // LS — D(데이터 레지스터)는 비트 접근을 지원하지 않음 (공식 매뉴얼 명시)
        var lsDevice = (device ?? "M").ToUpperInvariant();
        if (lsDevice == "D")
            throw new Exception("LS의 D(데이터 레지스터)는 비트 접근을 지원하지 않습니다. M/L/P를 사용하세요.");
        return await LsIndividualReadBitsAsync(lsDevice, startAddress, count);
    }

    //  쓰기 - WORD (write → read-back 검증 → 최대 3회 재시도)
    //  PLC에 값을 쓴 뒤 곧바로 다시 읽어서 실제로 반영됐는지 확인하고, 실패하면 최대 3회까지 재시도한다.
    //  (PLC/네트워크가 쓰기 응답은 정상 리턴했지만 실제로는 반영이 안 되는 경우를 잡기 위한 방어 로직)
    //  device : 미쓰비시(D/W/R, 기본값 "D") / LS(D/M/L/P 등 영역 문자 그대로 사용). Modbus는 무시.
    public async Task WriteWordAsync(int dAddress, int value, string device = "D")
    {
        const int maxAttempts   = 3;
        const int verifyDelayMs = 50;   // 쓰기 후 PLC 반영 대기
        const int retryDelayMs  = 150;  // 재시도 전 대기

        var type = (PlcType ?? "LS").ToUpperInvariant();
        byte mitsuDeviceCode = GetMitsubishiDeviceCode(device);   // MITSUBISHI가 아니면 계산만 하고 쓰이지 않음
        string lsArea = (device ?? "D").ToUpperInvariant();      // LS가 아니면 계산만 하고 쓰이지 않음
        Exception? lastEx = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                // 1) 쓰기 — 타입별 실제 구현으로 위임
                if      (type == "MITSUBISHI") await MitsubishiWriteWordAsync(dAddress, value, mitsuDeviceCode);
                else if (type == "MODBUS_TCP") await ModbusWriteWordAsync(dAddress, value);
                else                           await LsWriteWordAsync(dAddress, value, lsArea);

                // 2) PLC 내부 반영 대기
                await Task.Delay(verifyDelayMs);

                // 3) 읽기 검증 — 방금 쓴 값이 실제로 들어갔는지 재확인
                ushort[] rb;
                if      (type == "MITSUBISHI") rb = await MitsubishiReadWordsAsync(dAddress, 1, mitsuDeviceCode);
                else if (type == "MODBUS_TCP") rb = await ModbusReadWordsAsync(dAddress, 1);
                else                           rb = await LsReadWordsAsync(dAddress, 1, lsArea);

                if (rb.Length > 0 && rb[0] == (ushort)value)
                    return; // 성공

                string actual = rb.Length > 0 ? $"{rb[0]}" : "읽기 실패";
                lastEx = new Exception(
                    $"Write 검증 실패 [addr={dAddress}, 기대={value}, 실제={actual}] ({attempt}/{maxAttempts})");
            }
            catch (Exception ex)
            {
                lastEx = new Exception(
                    $"Write 오류 [addr={dAddress}, attempt={attempt}/{maxAttempts}]: {ex.Message}", ex);
            }

            if (attempt < maxAttempts)
                await Task.Delay(retryDelayMs);
        }

        throw lastEx ?? new Exception($"WriteWordAsync 실패 [addr={dAddress}]");
    }

    //  쓰기 - BIT (write → read-back 검증 → 최대 3회 재시도)
    //  WriteWordAsync와 동일한 검증-재시도 패턴. MODBUS_TCP / MITSUBISHI / LS(M/L/P) 전부 지원한다.
    //  device : 미쓰비시(M/L/X/Y/B 등) / LS(M/L/P — D는 비트 불가), 기본값 "M". MODBUS_TCP는 무시.
    public async Task WriteBitAsync(int address, bool value, string device = "M")
    {
        const int maxAttempts   = 3;
        const int verifyDelayMs = 50;
        const int retryDelayMs  = 150;

        var type = (PlcType ?? "LS").ToUpperInvariant();
        byte mitsuDeviceCode = GetMitsubishiDeviceCode(device);   // MITSUBISHI가 아니면 계산만 하고 쓰이지 않음
        string lsArea = (device ?? "M").ToUpperInvariant();      // LS가 아니면 계산만 하고 쓰이지 않음
        if (type != "MODBUS_TCP" && type != "MITSUBISHI" && lsArea == "D")
            throw new Exception("LS의 D(데이터 레지스터)는 비트 접근을 지원하지 않습니다. M/L/P를 사용하세요.");
        Exception? lastEx = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                // 1) 쓰기
                if      (type == "MITSUBISHI") await MitsubishiWriteBitAsync(address, mitsuDeviceCode, value);
                else if (type == "MODBUS_TCP") await ModbusWriteBitAsync(address, value);
                else                           await LsIndividualWriteBitAsync(lsArea, address, value);

                // 2) PLC 내부 반영 대기
                await Task.Delay(verifyDelayMs);

                // 3) 읽기 검증
                bool[] rb;
                if      (type == "MITSUBISHI") rb = await MitsubishiReadBitsAsync(address, 1, mitsuDeviceCode);
                else if (type == "MODBUS_TCP") rb = await ModbusReadBitsAsync(address, 1);
                else                           rb = await LsIndividualReadBitsAsync(lsArea, address, 1);

                if (rb.Length > 0 && rb[0] == value)
                    return; // 성공

                string actual = rb.Length > 0 ? $"{rb[0]}" : "읽기 실패";
                lastEx = new Exception(
                    $"BitWrite 검증 실패 [addr={address}, 기대={value}, 실제={actual}] ({attempt}/{maxAttempts})");
            }
            catch (Exception ex)
            {
                lastEx = new Exception(
                    $"BitWrite 오류 [addr={address}, attempt={attempt}/{maxAttempts}]: {ex.Message}", ex);
            }

            if (attempt < maxAttempts)
                await Task.Delay(retryDelayMs);
        }

        throw lastEx ?? new Exception($"WriteBitAsync 실패 [addr={address}]");
    }

    // ========================================================================
    // ── 영구 연결 관리 ──────────────────────────────────────────────────────────
    //  EnsureConnectedAsync : 기존 연결이 살아있으면 재사용, 아니면 새로 연결
    //  WithConnectionAsync  : 락 획득 → 연결 확보 → 작업 수행
    //                         - 네트워크 오류 → 연결 버리고 1회 재시도
    //                         - 프로토콜 오류 → 연결 버리고 즉시 예외 전파
    //                           (스트림에 쓰레기 데이터가 남을 수 있으므로)
    //  이 두 메서드는 LS/Modbus/Mitsubishi 구현이 전부 공통으로 사용한다 (Mitsubishi도 과거엔
    //  카드 슬롯 제약 때문에 매 요청마다 새로 연결하는 별도 방식을 썼지만, 2초 주기 폴링에서
    //  연결을 계속 새로 맺고 끊는 것 자체가 오히려 카드에 부담을 줘서 응답 중간에 연결이 끊기는
    //  문제가 있었다 — 그래서 지금은 LS/Modbus와 동일하게 연결을 재사용하고, 문제가 생겼을 때만
    //  끊고 재연결하는 쪽으로 통일했다. 아래 서킷브레이커가 카드 슬롯 고갈을 막아주는 안전장치다.)
    // ========================================================================

    // ── 실패 집계 + 서킷브레이커 ────────────────────────────────────────────
    // 실패(연결 실패든, 연결은 됐지만 응답을 못 받은 경우든) 직후엔 3초 쿨다운으로 재시도를 미룬다
    // (청크가 여러 개라도 최초 1회만 타임아웃을 겪게 하기 위함 — 기존과 동일).
    // 근데 그 3초 쿨다운 사이클로도 연속 10번(=대략 30~40초) 계속 실패하면, PLC나 카드 쪽에
    // 뭔가 더 근본적인 문제가 있다고 보고 쿨다운을 30초로 늘린다 — 짧은 간격으로 계속 연결을
    // 새로 맺으려는 시도 자체가 미쓰비시 카드의 접속 슬롯을 좀비 상태로 쌓이게 할 수 있어서,
    // 그런 상황에서는 오히려 덜 자주 두드리는 쪽이 안전하다. 한 번이라도 성공하면 즉시 원상복귀.
    private static readonly TimeSpan ConnectFailCooldown    = TimeSpan.FromSeconds(3);
    private static readonly TimeSpan CircuitBreakerCooldown = TimeSpan.FromSeconds(30);
    private const int CircuitBreakerThreshold = 10;
    private DateTime? _lastFailureAt;
    private int _consecutiveFailures;

    private async Task<NetworkStream> EnsureConnectedAsync()
    {
        // 이미 연결돼 있으면 그대로 재사용 (매 요청마다 재연결하면 느리고, PLC 쪽 세션도 낭비됨)
        if (_tcp is { Connected: true } && _ns != null)
            return _ns;

        _tcp?.Dispose();
        _tcp = new TcpClient { ReceiveTimeout = 5000, SendTimeout = 5000 };
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        await _tcp.ConnectAsync(PlcIp, PlcPort, cts.Token);   // 실패하면 그대로 던짐 — 집계는 WithConnectionAsync가 담당
        // TCP Keepalive: 10s 유휴 후 감지 시작 → 스테일 소켓 조기 탐지
        _tcp.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.KeepAlive, true);
        _ns = _tcp.GetStream();
        return _ns;
    }

    // 방금 진짜로 시도했다가 실패한 경우에만 호출한다 (쿨다운 때문에 시도 자체를 건너뛴 경우는
    // 호출하면 안 됨 — 그러면 _lastFailureAt이 매번 "지금"으로 갱신되어 쿨다운이 영원히 안 끝난다).
    private void RecordFailure()
    {
        _lastFailureAt = DateTime.UtcNow;
        _consecutiveFailures++;
    }

    private void RecordSuccess()
    {
        LastSuccessAt = DateTime.UtcNow;
        _lastFailureAt = null;
        _consecutiveFailures = 0;
    }

    private void DisposeConnection()
    {
        _ns = null;
        // RST 즉시 종료 → FIN 핸드셰이크 없이 포트 해제, 장비 CLOSE_WAIT 방지
        try { _tcp?.Client?.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.Linger, new LingerOption(true, 0)); } catch { }
        _tcp?.Dispose();
        _tcp = null;
    }

    private const int ModbusReadTimeoutMs     = 10000;  // Modbus 응답 대기 (10s — 느린 PLC 대응, 영구 연결)
    private const int MitsubishiReadTimeoutMs = 4000;   // Mitsubishi 응답 대기 (4s — 매 요청 새 연결, 로컬 LAN)
    private const int LockWaitTimeoutMs       = 25000;  // 락 획득 대기 (25s — Modbus 최악 20s 보유에 여유)

    /// <summary>
    /// 락을 잡고, TCP 연결을 확보한 뒤 action(실제 패킷 송수신 로직)을 실행한다.
    /// timeoutMs: action의 응답 대기 한도 (LS/Modbus는 영구연결 기준 10s, Mitsubishi는 4s로 호출).
    /// 처리 순서:
    ///   0) 최근 실패 이후 쿨다운(평소 3초, 연속 10회 넘으면 30초) 안이면 연결 시도 자체를 생략.
    ///   1차 시도 실패 → 네트워크 오류(SocketException/IOException/ObjectDisposedException)면
    ///                    연결을 버리고 50ms 대기 후 2차(재연결) 시도.
    ///                    프로토콜 오류(그 외 예외)면 연결을 버리고 즉시 예외를 던진다
    ///                    (스트림에 이전 요청의 쓰레기 응답이 남아있을 수 있어 재사용하면 위험하기 때문).
    ///   2차 시도도 실패 → 그대로 예외를 전파한다 (더 이상 재시도하지 않음).
    /// </summary>
    private async Task<T> WithConnectionAsync<T>(Func<NetworkStream, Task<T>> action, int timeoutMs = ModbusReadTimeoutMs)
    {
        // 락 획득 타임아웃: 이전 요청이 걸려 있어도 LockWaitTimeoutMs 후 포기
        bool acquired = await _lock.WaitAsync(LockWaitTimeoutMs);
        if (!acquired)
        {
            ScFileLogger.Write("COMM", $"락 타임아웃 {Label}({PlcIp}:{PlcPort}) — {LockWaitTimeoutMs}ms 초과");
            throw new TimeoutException($"PLC 락 획득 타임아웃 ({LockWaitTimeoutMs}ms) — 이전 요청 진행 중");
        }

        try
        {
            // 최근 실패 쿨다운 중이면 연결조차 시도하지 않고 즉시 실패 처리한다.
            // (읽기만 검사하고 _lastFailureAt/_consecutiveFailures는 여기서 건드리지 않는다 —
            //  건드리면 매 폴링마다 "방금 실패함"으로 계속 갱신되어 쿨다운이 영영 안 끝난다.)
            if (_lastFailureAt.HasValue)
            {
                var cooldown = _consecutiveFailures >= CircuitBreakerThreshold ? CircuitBreakerCooldown : ConnectFailCooldown;
                var elapsed = DateTime.UtcNow - _lastFailureAt.Value;
                if (elapsed < cooldown)
                    throw new TimeoutException(
                        $"최근 연결 실패 — 쿨다운 중이라 재시도 생략 ({Label} {PlcIp}:{PlcPort}, 연속실패 {_consecutiveFailures}회)");
            }

            // 1차 시도 (기존 연결)
            try
            {
                var ns = await EnsureConnectedAsync();
                using var cts = new CancellationTokenSource(timeoutMs);
                var task = action(ns);
                var done  = await Task.WhenAny(task, Task.Delay(timeoutMs, cts.Token));
                if (done != task)
                {
                    DisposeConnection();
                    ScFileLogger.Write("COMM", $"응답 타임아웃 {Label}({PlcIp}:{PlcPort}) — {timeoutMs}ms 초과, 재연결 시도");
                    throw new TimeoutException($"PLC 응답 타임아웃 ({timeoutMs}ms)");
                }
                cts.Cancel();
                var result = await task;
                RecordSuccess();
                return result;
            }
            catch (Exception ex) when (ex is System.Net.Sockets.SocketException
                                           or IOException
                                           or ObjectDisposedException)
            {
                // 쿨다운(60s) 내 반복 reconnect 는 로그 생략 — 재연결 성공 시 노이즈 방지
                TryLogReconnect($"네트워크 오류 {Label}({PlcIp}:{PlcPort}) — {ex.GetType().Name}: {ex.Message}, 재연결 시도");
                DisposeConnection();   // 네트워크 단절 → 재연결 후 재시도
            }
            catch
            {
                DisposeConnection();   // 프로토콜/타임아웃 오류 → 스트림 오염 방지 후 전파
                RecordFailure();
                throw;
            }

            // 2차 시도 (새 연결) — RST 후 포트 정리 대기 (RST 즉시 종료로 50ms로 단축)
            await Task.Delay(50);
            try
            {
                var ns2 = await EnsureConnectedAsync();
                using var cts2 = new CancellationTokenSource(timeoutMs);
                var task2 = action(ns2);
                var done2  = await Task.WhenAny(task2, Task.Delay(timeoutMs, cts2.Token));
                if (done2 != task2)
                {
                    DisposeConnection();
                    ScFileLogger.Write("COMM", $"응답 타임아웃 재시도 {Label}({PlcIp}:{PlcPort}) — {timeoutMs}ms 초과");
                    throw new TimeoutException($"PLC 응답 타임아웃 재시도 ({timeoutMs}ms)");
                }
                cts2.Cancel();
                var result2 = await task2;
                RecordSuccess();
                return result2;
            }
            catch (Exception ex2)
            {
                if (ex2 is not TimeoutException)
                    ScFileLogger.Write("COMM", $"통신 실패 재시도 {Label}({PlcIp}:{PlcPort}) — {ex2.GetType().Name}: {ex2.Message}");
                DisposeConnection();   // 2차 실패도 소켓 정리 — dead socket 잔류 방지
                RecordFailure();
                throw;
            }
        }
        finally { _lock.Release(); }
    }

    // 반환값이 없는 작업(쓰기 등)을 위한 오버로드 — 내부적으로 bool을 반환하는 버전으로 위임
    private async Task WithConnectionAsync(Func<NetworkStream, Task> action) =>
        await WithConnectionAsync<bool>(async ns => { await action(ns); return true; });

    // 지정한 길이(buf.Length)만큼 스트림에서 다 채워질 때까지 반복해서 읽는다.
    // TCP는 한 번의 ReadAsync 호출로 원하는 바이트 수만큼 못 받을 수 있어 (짧은 read),
    // LS/Mitsubishi/Modbus 응답 파싱 코드 전부가 이 헬퍼로 헤더/바디를 정확한 길이만큼 읽는다.
    private static async Task ReadFullAsync(NetworkStream ns, byte[] buf, CancellationToken ct = default)
    {
        int offset = 0;
        while (offset < buf.Length)
        {
            int n = await ns.ReadAsync(buf, offset, buf.Length - offset, ct);
            if (n == 0) throw new IOException("PLC 연결 종료");
            offset += n;
        }
    }
}
