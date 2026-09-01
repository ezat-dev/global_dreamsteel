// ============================================================================
// TempMonitorService.cs
// ============================================================================
// [파일 역할]
//   AlarmMonitorService와 마찬가지로 웹 요청과 무관하게 동작하는 BackgroundService다.
//   Program.cs가 builder.Services.AddHostedService<TempMonitorService>()로 등록하면
//   서버 기동과 동시에 백그라운드에서 계속 돌게 된다.
//
//   AlarmMonitorService가 "상태 전환(ON/OFF)이 있을 때만" DB에 쓰는 것과 달리, 이 서비스는
//   "정해진 시각(예: 매 30초, :00/:30 경계)마다 무조건 스냅샷 1행을 DB에 남기는" 방식이다
//   (온도/전류 등 추세를 그래프로 보기 위한 시계열 데이터 적재용).
//
// [처리 흐름 — "PLC → 이 서비스 → DB" 방향. 웹 요청이 아니라 타이머가 트리거한다]
//   1) appsettings.json의 "TempMonitor" 설정(Enabled/IntervalMs/ChunkSize)을 읽는다.
//   2) 서버 기동 시각과 무관하게 항상 :00/:30(IntervalMs 배수) 같은 고정 경계에서 폴링이
//      시작되도록 최초 1회 대기 시간을 계산한다 (RoundDownToInterval/scheduledTick 로직).
//   3) 매 경계 시각마다 PollOnceAsync 실행:
//        a) DB(MariaDB ez_scada)에서 tb_temp_tag ⨝ tb_plc 조인으로 "기록할 온도 태그 목록"을 조회.
//        b) 같은 PLC(plcId)별로 묶어서 PlcServiceCache.GetOrCreate(plc) → PlcService.ReadWordsAsync로
//           실제 PLC와 TCP 통신해서 현재 값을 읽어온다.
//        c) 0값 이상치 보정(ApplyZeroCorrection) — 통신 순간 튐 등으로 0이 찍히면 직전 정상값을
//           최대 5회까지 대신 사용한다 (scale 적용 전, raw 기준으로 판단).
//        d) 태그별 scale 보정식(tb_temp_tag.scale, 예: "+50"/"-100"/"*0.01"/"/2") 적용 → double.
//        e) tb_temp_snapshot 테이블에 컬럼이 없으면 동적으로 ALTER TABLE로 추가한 뒤,
//           이번 폴링에서 읽은 전체 값을 한 행으로 INSERT한다 (ConnectionStrings:MariaDb).
// ============================================================================

using MySqlConnector;
using System.Text;
using PlcApiServer.Repositories;
using PlcApiServer.Models;

namespace PlcApiServer.Services;

public class TempMonitorService : BackgroundService
{
    private readonly ILogger<TempMonitorService> _logger;
    private readonly IConfiguration _config;
    private readonly PlcRepository _repo;       // 메인 DB 커넥션 문자열(ConnectionStrings:MariaDb) 제공용
    private readonly PlcServiceCache _cache;

    // ── DDL 최초 1회 실행 제어 ───────────────────────────────────────────────
    // EnsureTablesAsync  : 서비스 시작 후 최초 1회만 실행
    // EnsureSnapshotCols : 이미 확인한 컬럼은 _knownColumns에 기억 → information_schema 반복 조회 제거
    private bool _tablesEnsured = false;
    private readonly HashSet<string> _knownColumns = new(StringComparer.OrdinalIgnoreCase);

    // ── 온도 PV 0값 보정 (연속 5회까지) ────────────────────────────────────────
    private readonly Dictionary<string, (int lastValid, int zeroCount)> _zeroCorrection
        = new(StringComparer.OrdinalIgnoreCase);

    public TempMonitorService(ILogger<TempMonitorService> logger, IConfiguration config, PlcRepository repo, PlcServiceCache cache)
    {
        _logger = logger;
        _config = config;
        _repo = repo;
        _cache = cache;
    }

    // BackgroundService의 진입점 — 서버 기동 시 자동 실행. 웹 요청과 무관하게 자체 타이머로 동작한다.
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // appsettings.json → "TempMonitor" 섹션
        bool enabled = _config.GetValue("TempMonitor:Enabled", true);
        int intervalMs = _config.GetValue("TempMonitor:IntervalMs", 60000);
        int chunkSize = _config.GetValue("TempMonitor:ChunkSize", 100);

        if (!enabled)
        {
            _logger.LogInformation("TempMonitorService disabled by config.");
            return;
        }

        if (chunkSize < 1) chunkSize = 100;
        _logger.LogInformation("TempMonitorService started. IntervalMs={Interval}, ChunkSize={ChunkSize}", intervalMs, chunkSize);

        // 최초 기동 시 다음 경계(intervalMs 배수)에 맞춰 대기
        // 예: intervalMs=30000 이면 로컬 시각 :00 또는 :30 초에 첫 폴링 시작
        {
            long nowMs = (long)DateTime.Now.TimeOfDay.TotalMilliseconds;
            int msToFirst = intervalMs - (int)(nowMs % intervalMs);
            try { await Task.Delay(msToFirst, stoppingToken); }
            catch (TaskCanceledException) { return; }
        }

        // scheduledTick: DB record_time 으로 사용할 고정 경계 시각 (로컬)
        // poll 소요 시간과 무관하게 intervalMs 씩 정확히 증가 → 항상 :00/:30 경계
        DateTime scheduledTick = RoundDownToInterval(DateTime.Now, intervalMs);

        // ── 메인 폴링 루프: 실제 시각이 아니라 "예정된 경계 시각(scheduledTick)" 기준으로 반복 ──
        while (!stoppingToken.IsCancellationRequested)
        {
            DateTime nextScheduled = scheduledTick.AddMilliseconds(intervalMs);

            try
            {
                await PollOnceAsync(chunkSize, scheduledTick, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TempMonitorService poll error");
            }

            scheduledTick = nextScheduled;   // 다음 경계로 전진 (poll 지연과 무관)

            TimeSpan remaining = nextScheduled - DateTime.Now;
            if (remaining > TimeSpan.Zero)
            {
                try { await Task.Delay(remaining, stoppingToken); }
                catch (TaskCanceledException) { break; }
            }
        }
    }

    // 현재 시각을 intervalMs 배수의 직전 경계로 내림한다 (예: 12:00:47, interval=30000 → 12:00:30)
    private static DateTime RoundDownToInterval(DateTime dt, int intervalMs)
    {
        long totalMs = (long)dt.TimeOfDay.TotalMilliseconds;
        long boundary = (totalMs / intervalMs) * intervalMs;
        return dt.Date.AddMilliseconds(boundary);
    }

    // 폴링 1회 실행: DB에서 태그 목록 조회 → PLC 값 읽기 → 보정 → DB 저장
    private async Task PollOnceAsync(int chunkSize, DateTime scheduledTick, CancellationToken ct)
    {
        using var conn = new MySqlConnection(_repo.ConnectionString);   // 메인 DB(ez_scada) 연결
        await conn.OpenAsync(ct);

        // 테이블 존재 보장 — 최초 1회만 실행 (이후 폴링에서는 DDL 전혀 없음)
        if (!_tablesEnsured)
        {
            await EnsureTablesAsync(conn, ct);
            _tablesEnsured = true;
        }

        // ── DB에서 "이번에 읽을 온도 태그 + 소속 PLC 접속정보" 조회 ──
        var tags = new List<TempTagRow>();
        using (var cmd = new MySqlCommand(@"
SELECT t.temp_id, t.tag_name, t.address, t.col_name, t.scale,
       p.plc_id, p.ip, p.port, p.plc_type, p.label, p.enabled AS plc_enabled
  FROM tb_temp_tag t
  JOIN tb_plc p ON t.plc_id = p.plc_id
 WHERE t.enabled = 1 AND p.enabled = 1", conn))
        using (var reader = await cmd.ExecuteReaderAsync(ct))
        {
            while (await reader.ReadAsync(ct))
            {
                tags.Add(new TempTagRow
                {
                    TempId = reader.GetInt32(0),
                    TagName = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Address = reader.GetString(2),
                    ColName = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    Scale = reader.IsDBNull(4) ? null : reader.GetString(4),
                    Plc = new PlcConfigRow(
                        reader.GetString(5),
                        reader.GetString(6),
                        reader.GetInt32(7),
                        reader.GetString(8),
                        reader.GetString(9),
                        reader.GetBoolean(10)
                    )
                });
            }
        }

        var validTags = new List<TempTagRow>();
        foreach (var tag in tags)
        {
            if (string.IsNullOrWhiteSpace(tag.ColName))
            {
                _logger.LogWarning("Skip temp tag {TempId} empty col_name", tag.TempId);
                continue;
            }

            int? addr = ParseAddress(tag.Address);
            if (addr == null)
            {
                _logger.LogWarning("Skip temp tag {TempId} invalid address: {Address}", tag.TempId, tag.Address);
                continue;
            }
            tag.AddressValue = addr.Value;
            validTags.Add(tag);
        }

        if (!validTags.Any()) return;

        var valueMap = new Dictionary<string, int?>();

        // ── 모든 PLC 병렬 읽기 ───────────────────────────────────────────────
        // 각 PlcService는 독립된 TCP 연결·락을 가지므로 동시 실행 안전
        // LS / Mitsubishi / MODBUS_TCP 모두 동일하게 병렬화됨
        var perPlcResults = await Task.WhenAll(
            validTags.GroupBy(t => t.Plc.Id).Select(async group =>
            {
                var plc = group.First().Plc;
                var svc = _cache.GetOrCreate(plc);   // PlcServiceCache → 이 PLC 전용 PlcService(TCP 연결) 획득

                var addrList = group.Select(t => t.AddressValue).Distinct().OrderBy(a => a).ToList();
                var chunks   = BuildChunks(addrList, chunkSize);

                // ── 실제 PLC와의 TCP 통신이 일어나는 지점 ──
                // 청크 전체를 "연결 1개"로 순서대로 읽는다 (AlarmMonitorService와 동일한 이유).
                var localMap = await svc.ReadWordsBatchAsync(chunks, "D", (start, count, ex) =>
                {
                    _logger.LogWarning(ex,
                        "Temp PLC read failed. PlcId={PlcId}, Start={Start}, Count={Count}",
                        plc.Id, start, count);
                });

                return group.Select(tag =>
                {
                    int? val = localMap.TryGetValue(tag.AddressValue, out var raw) ? raw : (int?)null;
                    return (tag.ColName, val);
                }).ToList();
            }));

        foreach (var pairs in perPlcResults)
            foreach (var (col, val) in pairs)
                valueMap[col] = val;

        if (valueMap.Count == 0) return;

        // 통신 순간 튐으로 0이 찍힌 온도 컬럼을 직전 정상값으로 보정 (최대 5회 연속까지)
        // ※ scale은 아직 적용하지 않은 raw 값 기준으로 판단해야 "진짜 0"인지 정확히 판단된다.
        ApplyZeroCorrection(valueMap);

        // ── scale 적용: 보정된 raw → 태그별 보정식(scale) 적용 → 최종 저장값(double) ──
        var colToScale = validTags
            .GroupBy(t => t.ColName, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().Scale, StringComparer.OrdinalIgnoreCase);
        var scaledMap = ApplyScale(valueMap, colToScale);

        // ── DB(ez_scada) 저장 ──
        await EnsureSnapshotColumnsAsync(conn, scaledMap.Keys, ct);
        await InsertSnapshotAsync(conn, scaledMap, scheduledTick, ct);
    }

    // tb_temp_snapshot 테이블이 없으면 생성 (record_time 컬럼만 있는 최소 스키마 —
    // 실제 온도 컬럼들은 EnsureSnapshotColumnsAsync가 필요할 때마다 ALTER TABLE로 추가한다)
    private static async Task EnsureTablesAsync(MySqlConnection conn, CancellationToken ct)
    {
        using (var cmd = new MySqlCommand(@"
CREATE TABLE IF NOT EXISTS tb_temp_snapshot (
    snapshot_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_time DATETIME DEFAULT CURRENT_TIMESTAMP
)", conn))
        {
            await cmd.ExecuteNonQueryAsync(ct);
        }
    }

    // DB(tb_temp_snapshot)에 아직 없는 컬럼(=새로 등록된 태그)만 ALTER TABLE로 추가한다.
    // 한 번 추가/확인한 컬럼은 _knownColumns에 기억해서, 이후 폴링에서는 이 메서드가 즉시 리턴한다
    // (매 폴링마다 information_schema를 조회하는 비용을 없애기 위함).
    private async Task EnsureSnapshotColumnsAsync(MySqlConnection conn, IEnumerable<string> colNames, CancellationToken ct)
    {
        var unknown = colNames
            .Where(c => !string.IsNullOrWhiteSpace(c) && !_knownColumns.Contains(c))
            .ToList();

        if (unknown.Count == 0) return;  // 모두 알려진 컬럼 → DB 쿼리 없음

        foreach (var col in unknown)
        {
            using var alter = new MySqlCommand(
                "ALTER TABLE tb_temp_snapshot ADD COLUMN IF NOT EXISTS `" + col + "` DOUBLE", conn);
            await alter.ExecuteNonQueryAsync(ct);
            _knownColumns.Add(col);
        }
    }

    // 이번 폴링에서 읽은 전체 값(valueMap)을 tb_temp_snapshot에 한 행으로 INSERT.
    // record_time은 NOW()가 아니라 scheduledTick(고정 경계 시각)을 써서 poll 소요시간에 흔들리지 않고
    // 항상 :00/:30 같은 깔끔한 시각으로 시계열이 남도록 한다.
    private static async Task InsertSnapshotAsync(MySqlConnection conn, Dictionary<string, double?> valueMap, DateTime scheduledTick, CancellationToken ct)
    {
        var cols = valueMap.Keys.OrderBy(k => k).ToList();

        var sbCols = new StringBuilder();
        var sbVals = new StringBuilder();
        sbCols.Append("record_time");
        sbVals.Append("@rt");   // NOW() 대신 스케줄 경계 시각 → 항상 :00/:30 경계

        for (int i = 0; i < cols.Count; i++)
        {
            sbCols.Append(",`").Append(cols[i]).Append('`');
            sbVals.Append(",@v").Append(i);
        }

        string sql = "INSERT INTO tb_temp_snapshot (" + sbCols + ") VALUES (" + sbVals + ")";
        using var cmd = new MySqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@rt", scheduledTick);
        for (int i = 0; i < cols.Count; i++)
        {
            object? val = valueMap[cols[i]];
            cmd.Parameters.AddWithValue("@v" + i, val ?? (object)DBNull.Value);
        }
        await cmd.ExecuteNonQueryAsync(ct);
    }

    // AlarmMonitorService의 BuildChunks와 동일한 목적 — 인접 주소를 한 번의 PLC 요청으로 묶는다.
    private static List<(int Start, int Count)> BuildChunks(List<int> sortedAddrs, int chunkSize)
    {
        var result = new List<(int, int)>();
        if (sortedAddrs.Count == 0) return result;

        int s = sortedAddrs[0];
        int maxInChunk = sortedAddrs[0];

        foreach (var a in sortedAddrs)
        {
            if (a > s + chunkSize - 1)
            {
                int cnt = Math.Min(maxInChunk - s + 1, 65536 - s);
                if (cnt > 0) result.Add((s, cnt));
                s = a;
                maxInChunk = a;
            }
            else
            {
                maxInChunk = a;
            }
        }
        {
            int cnt = Math.Min(maxInChunk - s + 1, 65536 - s);
            if (cnt > 0) result.Add((s, cnt));
        }
        return result;
    }

    // 주소 문자열(D201, M7000, 0xC9 등)에서 디바이스 접두어를 떼고 숫자 주소만 뽑는다.
    // AlarmMonitorService.ParseAddressFull과 달리 여기서는 디바이스 접두어 자체는 버리고
    // 숫자만 쓴다 — TempMonitorService는 항상 ReadWordsAsync(device 파라미터 없이, 기본값 "D")로만
    // 읽기 때문에, 애초에 D 레지스터 태그만 등록해서 쓰는 것을 전제로 한다.
    private static int? ParseAddress(string? address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        address = address.Trim();

        // 0x hex 표기 (예: 0xC9 → 201, 0x82 → 130)
        if (address.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
        {
            if (int.TryParse(address.AsSpan(2),
                    System.Globalization.NumberStyles.HexNumber, null, out int hex))
                return hex;
            return null;
        }

        // 알파벳 접두어 제거 후 숫자 부분만 파싱 (예: D201 → 201, M7000 → 7000)
        int i = 0;
        while (i < address.Length && char.IsLetter(address[i])) i++;
        string numPart = address[i..];
        if (int.TryParse(numPart, out var v)) return v;

        return null;
    }

    // DB 조회 결과 1행(온도 태그 1개) + 파싱된 주소값을 함께 담는 내부 전용 모델
    private sealed class TempTagRow
    {
        public int TempId { get; set; }
        public string TagName { get; set; } = "";
        public string Address { get; set; } = "";
        public string ColName { get; set; } = "";
        public string? Scale { get; set; }
        public int AddressValue { get; set; }
        public PlcConfigRow Plc { get; set; } = null!;
    }

    // ── 온도 PV 컬럼 여부 판단 ──────────────────────────────────────────────────
    // 컬럼명 규칙(_TEMP_PV, _CT_PV 등)으로 "0값 보정 대상"인 온도/전류 계열 컬럼만 골라낸다.
    private static bool IsTemperaturePvColumn(string col)
    {
        var c = col.ToUpperInvariant();
        if (c.Contains("_TEMP_PV")) return true;
        return c.EndsWith("_CT_PV")  || c.EndsWith("_UJ_PV") ||
               c.EndsWith("_CT1_PV") || c.EndsWith("_CT2_PV") ||
               c.EndsWith("_QT_PV");
    }

    // ── 온도 PV 0값 보정 (연속 5회까지 lastValid 유지) ───────────────────────────
    // 통신 순간 튐/PLC 응답 지연 등으로 값이 순간적으로 0으로 찍히는 경우, 그래프에 스파이크가
    // 생기지 않도록 직전 정상값(lastValid)을 최대 5회 연속까지 대신 기록한다.
    // 5회를 넘겨도 계속 0이면 실제로 꺼진 것으로 보고 그때부터는 0을 그대로 저장한다.
    private void ApplyZeroCorrection(Dictionary<string, int?> valueMap)
    {
        const int maxZeroCount = 5;

        foreach (var col in valueMap.Keys.ToList())
        {
            if (!IsTemperaturePvColumn(col)) continue;

            int? current = valueMap[col];

            if (current.HasValue && current.Value != 0)
            {
                _zeroCorrection[col] = (current.Value, 0);   // 정상값 → 보정 카운터 리셋
            }
            else if (current.HasValue && current.Value == 0)
            {
                if (_zeroCorrection.TryGetValue(col, out var state) && state.zeroCount < maxZeroCount)
                {
                    valueMap[col] = state.lastValid;   // 0 대신 직전 정상값으로 대체 저장
                    _zeroCorrection[col] = (state.lastValid, state.zeroCount + 1);
                    _logger.LogInformation(
                        "[ZeroCorrection] {Col} 0→{Val} 보정 ({Count}/{Max}회)",
                        col, state.lastValid, state.zeroCount + 1, maxZeroCount);
                }
                // lastValid 없거나 5회 초과 → 0 그대로 저장
            }
            // current == null (통신 실패) → 손대지 않음
        }
    }

    // ── 태그별 scale 보정식 적용: 0값 보정이 끝난 raw → 최종 저장값(double) ─────────
    // tb_temp_tag.scale 컬럼(예: "+50", "-100", "*0.01", "/2")을 컬럼별로 적용한다.
    // raw가 null(통신 실패)이면 scale도 적용하지 않고 null 그대로 둔다(스냅샷엔 NULL 저장).
    private Dictionary<string, double?> ApplyScale(Dictionary<string, int?> valueMap, Dictionary<string, string?> colToScale)
    {
        var result = new Dictionary<string, double?>();
        foreach (var (col, raw) in valueMap)
        {
            if (raw == null) { result[col] = null; continue; }
            string? scale = colToScale.TryGetValue(col, out var s) ? s : null;
            result[col] = ApplyScaleOne(raw.Value, scale, col);
        }
        return result;
    }

    // scale 문자열 맨 앞 1글자가 연산자(+,-,*,/), 나머지가 피연산자 숫자.
    // NULL/빈 문자열이거나 형식이 잘못되면(맨 앞이 +,-,*,/가 아니거나 숫자 파싱 실패) 경고만 남기고
    // raw를 그대로 반환한다(안전장치 — 잘못된 설정 때문에 값이 통째로 깨지는 것을 방지).
    private double ApplyScaleOne(int raw, string? scale, string colName)
    {
        if (string.IsNullOrWhiteSpace(scale)) return raw;

        char op = scale[0];
        string numPart = scale[1..];

        if (op != '+' && op != '-' && op != '*' && op != '/')
        {
            _logger.LogWarning("[Scale] {Col} scale \"{Scale}\"의 첫 글자가 +,-,*,/ 가 아님 — 무시하고 raw 그대로 사용", colName, scale);
            return raw;
        }

        if (!double.TryParse(numPart, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out double operand))
        {
            _logger.LogWarning("[Scale] {Col} scale \"{Scale}\"의 숫자 부분을 파싱하지 못함 — 무시하고 raw 그대로 사용", colName, scale);
            return raw;
        }

        switch (op)
        {
            case '+': return raw + operand;
            case '-': return raw - operand;
            case '*': return raw * operand;
            case '/':
                if (operand == 0)
                {
                    _logger.LogWarning("[Scale] {Col} scale \"{Scale}\" — 0으로 나누기라 무시하고 raw 그대로 사용", colName, scale);
                    return raw;
                }
                return raw / operand;
            default: return raw;   // 도달하지 않음 (위에서 이미 검사)
        }
    }
}
