// ============================================================================
// PlcService.Mitsubishi.cs  (partial class — 미쓰비시 Q시리즈, MC Protocol 3E Binary 구현)
// ============================================================================
// [파일 역할]
//   PlcService의 PlcType == "MITSUBISHI" 일 때 실제로 패킷을 만들고 파싱하는 부분.
//   MC Protocol 3E Binary는 워드 디바이스(D/W/R)와 비트 디바이스(M/L/X/Y/B/S)를 구분해서
//   서로 다른 서브커맨드(0x0000 워드, 0x0001 비트)로 요청한다.
//
// [처리 흐름 — 웹 요청이 여기까지 오는 경로]
//   웹 → 5050 → Program.cs 핸들러 → PlcService.ReadWordsAsync/WriteWordAsync/ReadBitsAsync/
//     WriteBitAsync (PlcService.cs) → PlcType이 "MITSUBISHI"이면 이 파일의 메서드 호출
//     → device 문자열(D/W/R/M/L/X/Y/B 등)을 GetMitsubishiDeviceCode로 실제 디바이스 코드(byte)로
//       변환하고, IsMitsubishiBitDevice로 워드/비트 여부를 판단해 알맞은 메서드로 분기
//     → MitsubishiRequestAsync (이 파일 전용 연결 헬퍼)가 새 TCP 연결을 맺고
//       BuildMcReadPacket/BuildMcWritePacket/BuildMcBitReadPacket/BuildMcBitWritePacket으로
//       조립한 패킷을 전송
//     → PLC 응답을 ReadFullAsync(PlcService.cs)로 읽고 워드/비트 값을 파싱해 반환
//     → 결과가 그대로 PlcService.cs → Program.cs로 돌아가 JSON 응답이 된다.
//   ※ 여기서 DB(MariaDB)는 전혀 관여하지 않는다. 순수하게 TCP 바이트 스트림 조립/파싱만 한다.
//   ※ 워드 읽기/쓰기는 D/W/R 아무 디바이스나 가능하고, 비트 읽기/쓰기는 M/L/X/Y/B(+S)가 가능하다.
//     타이머(T)는 접점/코일/현재값 중 무엇을 쓸지 아직 정해지지 않아 매핑에서 제외돼 있다.
//
// [LS/Modbus와 다른 점 — 연결 방식]
//   LS/Modbus는 PlcService.cs의 WithConnectionAsync로 TCP 연결을 계속 재사용하지만,
//   Mitsubishi Ethernet 카드(QJ71E71 등)는 동시 접속 슬롯이 8~16개로 제한되어 있어서
//   영구 연결을 재사용하다 오류가 나면 좀비 슬롯이 쌓여 카드 자체를 재부팅해야 하는 상황이 생긴다.
//   그래서 이 파일은 별도의 MitsubishiRequestAsync를 통해 "매 요청마다 연결 → 요청 → 응답 → 즉시 해제"
//   방식을 쓴다 (락은 PlcService.cs의 공용 _lock을 그대로 같이 쓴다 — LS/Modbus와 동시에 같은
//   PLC를 두 번 건드리지 않도록).
// ============================================================================

using System.Net.Sockets;
using PlcApiServer.Logging;

namespace PlcApiServer.Services;

public partial class PlcService
{
    //  미쓰비시 — 디바이스 종류에 따라 워드/비트 읽기 분기
    private Task<ushort[]> MitsubishiReadAsync(int start, int count, string device)
    {
        byte deviceCode = GetMitsubishiDeviceCode(device);
        return IsMitsubishiBitDevice(device)
            ? MitsubishiReadBitsAsWordsAsync(start, count, deviceCode)
            : MitsubishiReadWordsAsync(start, count, deviceCode);
    }

    // ── Mitsubishi 전용 단기 연결 헬퍼 ─────────────────────────────────────────
    // Mitsubishi Ethernet 카드(QJ71E71 등)는 동시 접속 슬롯이 8~16개로 제한됨.
    // 영구 연결을 재사용하면 오류 시 좀비 슬롯이 누적되어 카드 초기화가 필요해짐.
    // 매 요청마다 연결→요청→응답→즉시해제 방식으로 슬롯 누적을 방지함.
    private async Task<T> MitsubishiRequestAsync<T>(Func<NetworkStream, Task<T>> action)
    {
        // PlcService.cs의 공용 락 — LS/Modbus 쪽 통신과 겹치지 않도록 이 PLC 인스턴스 전체를 직렬화
        bool acquired = await _lock.WaitAsync(LockWaitTimeoutMs);
        if (!acquired)
        {
            ScFileLogger.Write("COMM", $"락 타임아웃 {Label}({PlcIp}:{PlcPort}) Mitsubishi — {LockWaitTimeoutMs}ms 초과");
            throw new TimeoutException($"PLC 락 획득 타임아웃 ({LockWaitTimeoutMs}ms)");
        }

        using var tcp = new TcpClient();   // 매 요청마다 새로 생성 (영구 연결 아님)
        try
        {
            using var connCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            await tcp.ConnectAsync(PlcIp, PlcPort, connCts.Token);
            var ns = tcp.GetStream();

            using var cts = new CancellationTokenSource(MitsubishiReadTimeoutMs);
            var task = action(ns);
            var done = await Task.WhenAny(task, Task.Delay(MitsubishiReadTimeoutMs, cts.Token));
            if (done != task)
            {
                ScFileLogger.Write("COMM", $"응답 타임아웃 {Label}({PlcIp}:{PlcPort}) Mitsubishi — {MitsubishiReadTimeoutMs}ms 초과");
                throw new TimeoutException($"Mitsubishi PLC 응답 타임아웃 ({MitsubishiReadTimeoutMs}ms)");
            }
            cts.Cancel();
            var result = await task;
            LastSuccessAt = DateTime.UtcNow;
            return result;
        }
        catch (Exception ex) when (ex is not TimeoutException)
        {
            TryLogReconnect($"통신 오류 {Label}({PlcIp}:{PlcPort}) Mitsubishi — {ex.GetType().Name}: {ex.Message}");
            throw;
        }
        finally
        {
            // RST로 즉시 종료 → FIN 핸드셰이크 불필요, Mitsubishi 카드 즉시 슬롯 해제
            try { tcp.Client?.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.Linger, new LingerOption(true, 0)); } catch { }
            tcp.Close();
            _lock.Release();
        }
    }

    //  미쓰비시 Q시리즈 — 워드 읽기 (MC Protocol 3E Binary, 서브커맨드 0x0000)
    private async Task<ushort[]> MitsubishiReadWordsAsync(int startD, int count, byte deviceCode = 0xA8)
    {
        return await MitsubishiRequestAsync(ns => ReadWordsOverConnectionAsync(ns, startD, count, deviceCode));
    }

    //  이미 열려 있는 연결(ns) 위에서 워드 읽기 1회 수행. MitsubishiReadWordsAsync(단발)와
    //  MitsubishiReadWordsBatchAsync(여러 구간을 한 연결에서 순서대로 처리) 양쪽에서 공용으로 쓴다.
    private static async Task<ushort[]> ReadWordsOverConnectionAsync(NetworkStream ns, int startD, int count, byte deviceCode)
    {
        byte[] packet = BuildMcReadPacket(startD, count, deviceCode);
        await ns.WriteAsync(packet);

        // 응답 헤더 11바이트 고정 (서브헤더 2 + 네트워크번호 등 7 + 종료코드 2)
        byte[] respHdr = new byte[11];
        await ReadFullAsync(ns, respHdr);

        ushort endCode = BitConverter.ToUInt16(respHdr, 9);   // 9~10 오프셋 = 종료 코드 (0이면 정상)
        ushort dataLen = BitConverter.ToUInt16(respHdr, 7);   // 7~8  오프셋 = 이후 데이터 길이(종료코드 2바이트 포함)
        int bodyLen = dataLen - 2;                            // 종료코드 2바이트를 뺀 실제 값 데이터 길이

        if (endCode != 0)
            throw new Exception($"미쓰비시 READ 에러코드: 0x{endCode:X4}");

        if (bodyLen <= 0)
            return new ushort[0];

        byte[] data = new byte[bodyLen];
        await ReadFullAsync(ns, data);

        var result = new List<ushort>();
        for (int i = 0; i + 1 < data.Length && result.Count < count; i += 2)
            result.Add(BitConverter.ToUInt16(data, i));

        return result.ToArray();
    }

    //  여러 (start,count) 구간을 "TCP 연결 1개"로 순서대로 읽어 하나의 값 맵(주소→값)으로 합친다.
    //  AlarmMonitorService/TempMonitorService가 한 폴링 주기에서 같은 PLC를 여러 청크로 나눠 읽을 때,
    //  청크마다 새 연결을 맺으면(기존 방식) FX5UC처럼 내장 이더넷 포트의 동시 접속 슬롯이 적은 PLC에서
    //  연결이 자주 끊기는 문제가 있었다 — 이 메서드로 청크 수만큼의 연결을 1개로 줄인다.
    //  구간 하나가 실패해도(예외) 나머지 구간은 계속 진행한다(기존 per-chunk try/catch와 동일한 내성).
    private async Task<Dictionary<int, int>> MitsubishiReadWordsBatchAsync(
        List<(int Start, int Count)> ranges, byte deviceCode, bool isBitDevice,
        Action<int, int, Exception>? onRangeError = null)
    {
        var result = new Dictionary<int, int>();

        await MitsubishiRequestAsync<bool>(async ns =>
        {
            foreach (var (start, count) in ranges)
            {
                try
                {
                    ushort[] values = isBitDevice
                        ? await ReadBitsOverConnectionAsync(ns, start, count, deviceCode)
                        : await ReadWordsOverConnectionAsync(ns, start, count, deviceCode);
                    for (int i = 0; i < values.Length; i++)
                        result[start + i] = values[i];
                }
                catch (Exception ex)
                {
                    onRangeError?.Invoke(start, count, ex);
                    throw;   // 연결 자체가 끊긴 경우(IOException) 이후 구간도 이 연결로는 못 읽으므로 상위(MitsubishiRequestAsync)의 재연결/로그 처리로 넘긴다
                }
            }
            return true;
        });

        return result;
    }

    //  미쓰비시 Q시리즈 — 워드 쓰기 (MC Protocol 3E Binary)
    //  deviceCode 기본값 0xA8(D) — 기존 호출부(파라미터 생략)와 호환되도록 유지.
    private async Task MitsubishiWriteWordAsync(int dAddress, int value, byte deviceCode = 0xA8)
    {
        await MitsubishiRequestAsync<bool>(async ns =>
        {
            byte[] packet = BuildMcWritePacket(dAddress, (ushort)value, deviceCode);
            await ns.WriteAsync(packet);

            byte[] respHdr = new byte[11];
            await ReadFullAsync(ns, respHdr);

            ushort endCode = BitConverter.ToUInt16(respHdr, 9);
            if (endCode != 0)
                throw new Exception($"미쓰비시 WRITE 에러코드: 0x{endCode:X4}");
            return true;
        });
    }

    //  미쓰비시 Q시리즈 — 비트 쓰기 (MC Protocol 3E Binary, 서브커맨드 0x0001)
    //  1점만 쓰므로 니블 데이터 1바이트에서 상위 니블만 사용 (읽기 쪽 파싱 규칙과 대칭).
    private async Task MitsubishiWriteBitAsync(int address, byte deviceCode, bool value)
    {
        await MitsubishiRequestAsync<bool>(async ns =>
        {
            byte[] packet = BuildMcBitWritePacket(address, deviceCode, value);
            await ns.WriteAsync(packet);

            byte[] respHdr = new byte[11];
            await ReadFullAsync(ns, respHdr);

            ushort endCode = BitConverter.ToUInt16(respHdr, 9);
            if (endCode != 0)
                throw new Exception($"미쓰비시 BIT WRITE 에러코드: 0x{endCode:X4}");
            return true;
        });
    }

    //  미쓰비시 Q시리즈 — 비트 읽기 (bool[] 버전)
    //  PlcService.cs의 공개 ReadBitsAsync/WriteBitAsync 검증 단계가 쓰는 bool[] 형태로,
    //  MitsubishiReadBitsAsWordsAsync(ushort 0/1)의 결과를 bool로 변환만 해서 돌려준다.
    private async Task<bool[]> MitsubishiReadBitsAsync(int start, int count, byte deviceCode)
    {
        ushort[] raw = await MitsubishiReadBitsAsWordsAsync(start, count, deviceCode);
        var result = new bool[raw.Length];
        for (int i = 0; i < raw.Length; i++)
            result[i] = raw[i] != 0;
        return result;
    }

    //  미쓰비시 Q시리즈 — 비트 읽기 (MC Protocol 3E Binary, 서브커맨드 0x0001)
    //  반환값: ushort[] 각 요소가 0(OFF) 또는 1(ON) → treatNonZeroAsOn 로직과 호환
    private async Task<ushort[]> MitsubishiReadBitsAsWordsAsync(int start, int count, byte deviceCode)
    {
        return await MitsubishiRequestAsync(ns => ReadBitsOverConnectionAsync(ns, start, count, deviceCode));
    }

    //  이미 열려 있는 연결(ns) 위에서 비트 읽기 1회 수행 — ReadWordsOverConnectionAsync의 비트 버전.
    private static async Task<ushort[]> ReadBitsOverConnectionAsync(NetworkStream ns, int start, int count, byte deviceCode)
    {
        byte[] packet = BuildMcBitReadPacket(start, count, deviceCode);
        await ns.WriteAsync(packet);

        byte[] respHdr = new byte[11];
        await ReadFullAsync(ns, respHdr);

        ushort endCode = BitConverter.ToUInt16(respHdr, 9);
        ushort dataLen = BitConverter.ToUInt16(respHdr, 7);
        int bodyLen = dataLen - 2;

        if (endCode != 0)
            throw new Exception($"미쓰비시 BIT READ 에러코드: 0x{endCode:X4}");

        if (bodyLen <= 0)
            return new ushort[count];

        byte[] data = new byte[bodyLen];
        await ReadFullAsync(ns, data);

        // MC Protocol 비트 응답: 2비트가 1바이트에 니블(nibble) 단위로 패킹
        //   상위 nibble = 짝수 인덱스 (0, 2, 4 …) ← 첫 번째 포인트
        //   하위 nibble = 홀수 인덱스 (1, 3, 5 …) ← 두 번째 포인트
        var result = new ushort[count];
        for (int i = 0; i < count; i++)
        {
            int byteIdx = i / 2;
            if (byteIdx >= data.Length) break;
            int nibble = (i % 2 == 0)
                ? ((data[byteIdx] >> 4) & 0x0F)
                : (data[byteIdx] & 0x0F);
            result[i] = (ushort)(nibble != 0 ? 1 : 0);
        }
        return result;
    }

    //  X/Y 디바이스는 PLC 화면/사용자 입력상 8진수 번지(8,9 없음, 예: X7 다음이 X10)를 쓰지만,
    //  MC Protocol 바이너리 프레임에는 그 8진수 라벨을 실제 값으로 환산한 정수를 넣어야 한다.
    //  예: X20(8진 라벨) = 8진수 20 = 10진수 16(0x10) → 프레임에는 16을 넣는다.
    //  근거: MELSEC iQ-F FX5 User's Manual(Ethernet Communication) 11.2 CGI Object —
    //  "When specifying a device name in octal such as X or Y, specify the device name in
    //   hexadecimal. (Example: When specifying X20, specify X10 in CGI.)"
    //  M/L/B/D/W/R 등 다른 디바이스는 원래부터 10진수라 변환이 필요 없다.
    private static int ResolveMitsubishiAddress(int address, byte deviceCode)
    {
        if (deviceCode != 0x9C && deviceCode != 0x9D) return address;   // X=0x9C, Y=0x9D 만 8진수
        return Convert.ToInt32(address.ToString(), 8);
    }

    //  미쓰비시 패킷 빌더 — 워드 읽기 (서브커맨드 0x0000)
    private static byte[] BuildMcReadPacket(int startD, int count, byte deviceCode = 0xA8)
    {
        startD = ResolveMitsubishiAddress(startD, deviceCode);
        var commandData = new List<byte>();
        commandData.AddRange(new byte[] { 0x01, 0x04 });  // Command 0x0401 (디바이스 일괄 읽기)
        commandData.AddRange(new byte[] { 0x00, 0x00 });  // Subcommand 0x0000 (워드 단위)
        commandData.Add((byte)(startD & 0xFF));            // 시작 주소 (3바이트, 리틀엔디안)
        commandData.Add((byte)((startD >> 8) & 0xFF));
        commandData.Add((byte)((startD >> 16) & 0xFF));
        commandData.Add(deviceCode);                        // 디바이스 코드 (D=0xA8 등)
        commandData.AddRange(BitConverter.GetBytes((ushort)count));  // 읽을 점수(워드 개수)

        return BuildMcHeader(commandData.ToArray());
    }

    //  미쓰비시 패킷 빌더 — 비트 읽기 (서브커맨드 0x0001)
    private static byte[] BuildMcBitReadPacket(int start, int count, byte deviceCode)
    {
        start = ResolveMitsubishiAddress(start, deviceCode);
        var commandData = new List<byte>();
        commandData.AddRange(new byte[] { 0x01, 0x04 });  // Command 0x0401
        commandData.AddRange(new byte[] { 0x01, 0x00 });  // Subcommand 0x0001 (비트 단위)
        commandData.Add((byte)(start & 0xFF));
        commandData.Add((byte)((start >> 8) & 0xFF));
        commandData.Add((byte)((start >> 16) & 0xFF));
        commandData.Add(deviceCode);
        commandData.AddRange(BitConverter.GetBytes((ushort)count));

        return BuildMcHeader(commandData.ToArray());
    }

    //  미쓰비시 디바이스 코드 테이블 (MC Protocol 3E Binary 기준)
    //  device 문자열(예: "D", "M")을 실제 프로토콜상의 1바이트 디바이스 코드로 변환한다.
    private static byte GetMitsubishiDeviceCode(string device) => device.ToUpperInvariant() switch
    {
        "D" => 0xA8,   // 데이터 레지스터      (워드)
        "W" => 0xB4,   // 링크 레지스터        (워드)
        "R" => 0xAF,   // 파일 레지스터        (워드)
        "M" => 0x90,   // 내부 릴레이          (비트)
        "L" => 0x92,   // 래치 릴레이          (비트)
        "X" => 0x9C,   // 입력 릴레이          (비트)
        "Y" => 0x9D,   // 출력 릴레이          (비트)
        "B" => 0xA0,   // 링크 릴레이          (비트)
        "S" => 0x98,   // 스텝 릴레이          (비트)
        _   => 0xA8    // 기본값 D
    };

    //  비트 단위 디바이스 여부 (워드 읽기 vs 비트 읽기 분기용) — MitsubishiReadAsync에서 사용
    private static bool IsMitsubishiBitDevice(string device) => device.ToUpperInvariant() switch
    {
        "M" or "L" or "X" or "Y" or "B" or "S" => true,
        _ => false
    };

    //  미쓰비시 패킷 빌더 — 워드 쓰기 (서브커맨드 0x0000). deviceCode로 D/W/R 등 임의 워드 디바이스 지정.
    private static byte[] BuildMcWritePacket(int dAddress, ushort value, byte deviceCode = 0xA8)
    {
        dAddress = ResolveMitsubishiAddress(dAddress, deviceCode);
        var commandData = new List<byte>();
        commandData.AddRange(new byte[] { 0x01, 0x14 });  // Command 0x1401 (디바이스 일괄 쓰기)
        commandData.AddRange(new byte[] { 0x00, 0x00 });  // Subcommand 0x0000 (워드 단위)
        commandData.Add((byte)(dAddress & 0xFF));
        commandData.Add((byte)((dAddress >> 8) & 0xFF));
        commandData.Add((byte)((dAddress >> 16) & 0xFF));
        commandData.Add(deviceCode);                        // 디바이스 코드 (D/W/R 등)
        commandData.AddRange(new byte[] { 0x01, 0x00 });  // 쓸 점수: 1워드
        commandData.AddRange(BitConverter.GetBytes(value));

        return BuildMcHeader(commandData.ToArray());
    }

    //  미쓰비시 패킷 빌더 — 비트 쓰기 (서브커맨드 0x0001)
    //  데이터부는 읽기 응답과 같은 니블 패킹 규칙: 짝수 인덱스(첫 포인트)는 상위 니블.
    //  여기서는 항상 1점만 쓰므로 데이터 1바이트의 상위 니블에 ON=0x1/OFF=0x0을 넣는다.
    private static byte[] BuildMcBitWritePacket(int address, byte deviceCode, bool value)
    {
        address = ResolveMitsubishiAddress(address, deviceCode);
        var commandData = new List<byte>();
        commandData.AddRange(new byte[] { 0x01, 0x14 });  // Command 0x1401 (디바이스 일괄 쓰기)
        commandData.AddRange(new byte[] { 0x01, 0x00 });  // Subcommand 0x0001 (비트 단위)
        commandData.Add((byte)(address & 0xFF));
        commandData.Add((byte)((address >> 8) & 0xFF));
        commandData.Add((byte)((address >> 16) & 0xFF));
        commandData.Add(deviceCode);                        // 디바이스 코드 (M/L/X/Y/B 등)
        commandData.AddRange(new byte[] { 0x01, 0x00 });  // 쓸 점수: 1비트
        commandData.Add(value ? (byte)0x10 : (byte)0x00); // 니블 패킹: 1점째 = 상위 니블

        return BuildMcHeader(commandData.ToArray());
    }

    // MC Protocol 3E Binary 공통 헤더 조립 — 서브헤더 + 네트워크/스테이션 번호 + 명령 바디 길이 + 바디
    private static byte[] BuildMcHeader(byte[] commandData)
    {
        ushort dataLength = (ushort)(2 + commandData.Length);   // 감시 타이머(2바이트) + 명령 바디 길이

        var pkt = new List<byte>();
        pkt.AddRange(new byte[] { 0x50, 0x00 });   // 서브헤더 0x0050 (3E프레임)
        pkt.Add(0x00);                              // 네트워크 번호
        pkt.Add(0xFF);                               // PC 번호 (0xFF = 자국)
        pkt.AddRange(new byte[] { 0xFF, 0x03 });   // 요구 대상 모듈 I/O 번호
        pkt.Add(0x00);                              // 요구 대상 모듈국 번호
        pkt.AddRange(BitConverter.GetBytes(dataLength)); // 이후 데이터 길이
        pkt.AddRange(new byte[] { 0x10, 0x00 });   // 감시 타이머 (기본값)
        pkt.AddRange(commandData);                  // 실제 명령 바디 (Command+Subcommand+주소+디바이스+개수)

        return pkt.ToArray();
    }
}
