// ============================================================================
// LiveTagMonitorService.cs
// ============================================================================
// [파일 역할]
//   웹 요청으로 실행되는 API가 아니라, ASP.NET Core의 BackgroundService(호스트 서비스)다.
//   서버가 기동될 때 Program.cs가 등록해두면, 앱 생명주기 동안 별도의 백그라운드 태스크로
//   계속 돌면서 알아서 폴링을 반복한다.
//
//   원래 알람(tb_alarm_tag)과 폴더태그(folders_tags)는 각자 독립된 폴러로 만들 수도 있었지만,
//   그러면 같은 PLC를 보는 두 시스템이 "PLC → 각자 따로 요청"하게 되어 비효율이 생긴다
//   (예: 알람이 D1, 폴더태그가 D2를 같은 PLC에서 읽으면, 따로 돌면 왕복이 2번, 합치면 1번).
//   그래서 이 서비스는 알람 태그 + 폴더 태그를 "같은 폴링 주기 안에서 하나로 합쳐" 읽는다:
//     - PLC+디바이스 단위로 두 출처의 주소를 합쳐서 청크를 만들고, 한 번에 읽은 뒤
//     - 알람 태그는 기존처럼 "전환(ON/OFF)이 있을 때만 tb_alarm_history에 기록"
//     - 폴더 태그는 "DB에 쓰지 않고 메모리(FolderTagValues)에만 최신값 보관 → API가 즉시 응답"
//   으로 각자 다르게 처리한다. (온도/트랜드는 30초 주기로 "매번 스냅샷 행을 통째로 적재"하는
//   전혀 다른 목적이라 이 서비스에 합치지 않고 TempMonitorService로 계속 분리되어 있다.)
//
// [처리 흐름]
//   1) appsettings.json의 "PlcMonitor" 설정(Enabled/IntervalMs/ChunkSize/TreatNonZeroAsOn)을 읽는다.
//   2) 매 IntervalMs(기본 1000ms)마다 PollOnceAsync 반복:
//        a) tb_alarm_tag ⨝ tb_plc, folders_tags ⨝ tb_plc 두 테이블을 각각 조회해서 하나의
//           목록(CombinedTagRow, 출처 표시 포함)으로 합친다 (TagCacheMs 동안 메모리 캐시).
//        b) PLC(plc_id)+디바이스(D/M/L/X/Y/B/W/R)별로 묶어서, 두 출처의 주소를 합친 뒤
//           ReadWordsBatchAsync로 "연결 1개"로 순서대로 읽는다.
//        c) 알람 출처 결과는 "그 PLC 그룹의 읽기가 끝나는 즉시"(다른 PLC를 기다리지 않고)
//           _alarmState와 비교해 전환된 것만 tb_alarm_history에 기록(ProcessAlarmTransitionsAsync).
//           폴더태그 출처 결과는 FolderTagValues[tagId]에 그대로 저장(DB 미기록).
//   3) Program.cs의 /api/foldertag/values 엔드포인트가 이 인스턴스를 DI로 주입받아
//      FolderTagValues를 즉시 JSON으로 반환한다 (PLC 통신 없이 응답).
//   ※ AlarmMonitorService 시절과 달리 이 서비스는 Program.cs에서 AddSingleton으로도
//      등록해야 한다 (API 핸들러가 FolderTagValues를 직접 읽어야 하므로).
//
// [PLC 한 대가 죽었을 때 다른 PLC까지 지연되는 문제 — 두 가지 안전장치]
//   과거 구조는 모든 PLC 그룹을 Task.WhenAll로 다 읽은 "뒤에" 알람 전환 감지+DB 기록을
//   한꺼번에 처리했다. 그래서 PLC1(정상)의 알람이 0.5초만에 읽혀도, 같은 사이클에 낀
//   PLC3(응답없음)의 읽기가 15초 걸리면 PLC1의 알람 기록도 덩달아 15초 늦게 나갔다
//   (알람은 "감지" 용도라 이건 단순 성능저하가 아니라 안전 이슈로 봐야 한다).
//     1) PollOnceAsync: 각 PLC 그룹이 "자기 읽기가 끝나는 즉시" ProcessAlarmTransitionsAsync를
//        호출해서 전환 감지+DB 기록까지 마친다 — 더 이상 Task.WhenAll 전체 완료를 기다리지 않는다.
//        (폴더태그는 원래부터 그룹별 즉시반영이었고, 알람도 동일한 방식으로 맞춘 것.)
//     2) PlcService.EnsureConnectedAsync: 죽은 PLC는 "방금 연결 실패했다"를 기억해서(3초 쿨다운)
//        같은 사이클 안의 나머지 청크들이 매번 3초씩 새로 connect 타임아웃을 겪지 않도록 한다
//        (청크 5개짜리 죽은 PLC가 15초 대신 최초 1회 ~3초로 끝남).
//   두 장치를 합치면 PLC1(정상)의 알람 감지 지연은 PLC3(응답없음) 상태와 완전히 무관해지고,
//   PLC3 자신이 그 사이클에서 잡아먹는 시간도 훨씬 짧아진다.
// ============================================================================

using System.Collections.Concurrent;
using System.Globalization;
using MySqlConnector;
using PlcApiServer.Repositories;
using PlcApiServer.Models;

namespace PlcApiServer.Services;

public class LiveTagMonitorService : BackgroundService
{
    private readonly ILogger<LiveTagMonitorService> _logger;
    private readonly IConfiguration _config;
    private readonly PlcRepository _repo;
    private readonly PlcServiceCache _cache;

    // ── 폴더태그 최신값 캐시 (tagId → raw 값) — DB에 쓰지 않고 메모리에만 유지, API가 직접 참조 ──
    public ConcurrentDictionary<int, int?> FolderTagValues { get; } = new();
    public DateTime? LastPollAt { get; private set; }

    // ── 알람 상태 캐시 (tagId → 마지막 ON/OFF) — DB는 전환시에만 씀 ─────────────
    private readonly ConcurrentDictionary<int, bool> _alarmState = new();

    // ── 태그 목록 캐시 (알람/폴더태그 각각) ──────────────────────────────────
    private List<AlarmTagRow>? _cachedAlarmTags;
    private List<FolderTagRow>? _cachedFolderTags;
    private DateTime _tagsCachedAt = DateTime.MinValue;

    private bool _firstPoll = true;

    public LiveTagMonitorService(ILogger<LiveTagMonitorService> logger, IConfiguration config, PlcRepository repo, PlcServiceCache cache)
    {
        _logger = logger;
        _config = config;
        _repo = repo;
        _cache = cache;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        bool enabled          = _config.GetValue("PlcMonitor:Enabled", true);
        int intervalMs        = _config.GetValue("PlcMonitor:IntervalMs", 1000);
        int chunkSize         = _config.GetValue("PlcMonitor:ChunkSize", 100);
        bool treatNonZeroAsOn = _config.GetValue("PlcMonitor:TreatNonZeroAsOn", true);
        int tagCacheMs        = _config.GetValue("PlcMonitor:TagCacheMs", 30000);

        if (!enabled)
        {
            _logger.LogInformation("LiveTagMonitorService disabled by config.");
            return;
        }

        if (chunkSize < 1) chunkSize = 100;
        _logger.LogInformation(
            "LiveTagMonitorService started. IntervalMs={Interval}, ChunkSize={ChunkSize}, TagCacheMs={TagCache}",
            intervalMs, chunkSize, tagCacheMs);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollOnceAsync(treatNonZeroAsOn, chunkSize, tagCacheMs, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "LiveTagMonitorService poll error");
            }

            try
            {
                await Task.Delay(intervalMs, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }
    }

    private async Task PollOnceAsync(bool treatNonZeroAsOn, int chunkSize, int tagCacheMs, CancellationToken ct)
    {
        // ── [1] 태그 목록 캐시 (알람 + 폴더태그 둘 다) ──────────────────────────
        if (_cachedAlarmTags == null || _cachedFolderTags == null ||
            (DateTime.UtcNow - _tagsCachedAt).TotalMilliseconds >= tagCacheMs)
        {
            _cachedAlarmTags  = await LoadAlarmTagsAsync(ct);
            _cachedFolderTags = await LoadFolderTagsAsync(ct);
            _tagsCachedAt     = DateTime.UtcNow;
            _logger.LogDebug("Tag cache refreshed: alarm={AlarmCount}, folderTag={FolderCount}",
                _cachedAlarmTags.Count, _cachedFolderTags.Count);
        }

        // ── [2] 알람 + 폴더태그를 하나의 목록으로 합친다 (출처 표시만 다름) ──────
        var combined = new List<CombinedTagRow>(_cachedAlarmTags.Count + _cachedFolderTags.Count);
        foreach (var a in _cachedAlarmTags)
            combined.Add(new CombinedTagRow { TagId = a.TagId, DeviceType = a.DeviceType, AddressValue = a.AddressValue, Plc = a.Plc, IsAlarmSource = true });
        foreach (var f in _cachedFolderTags)
            combined.Add(new CombinedTagRow { TagId = f.TagId, DeviceType = f.DeviceType, AddressValue = f.AddressValue, Plc = f.Plc, IsAlarmSource = false });

        if (combined.Count == 0)
        {
            _logger.LogWarning("LiveTagMonitor: no valid tags configured (alarm+folderTag)");
            return;
        }

        // ── [3] PLC+디바이스 단위로 두 출처의 주소를 합쳐서 한 번에 읽고,
        //       "이 PLC 그룹이 끝나는 즉시" 알람 전환 감지+DB 반영까지 마친다.
        //       Task.WhenAll 전체가 끝나길 기다리지 않으므로, 죽은 PLC 하나가 오래 걸려도
        //       다른 PLC들의 알람 감지/기록은 지연되지 않는다 (폴더태그는 원래부터
        //       그룹별 즉시반영이었고, 알람도 동일한 방식으로 맞췄다).
        // _firstPoll은 병렬 시작 전에 한 번만 캡처해서 이번 사이클의 모든 그룹이 같은 값을
        // 보게 한다 (여러 그룹이 동시에 읽고/쓰면 사이클 중간에 값이 바뀌는 것을 방지).
        bool isFirstPollThisCycle = _firstPoll;

        await Task.WhenAll(combined.GroupBy(t => t.Plc.Id).Select(async plcGroup =>
        {
            var plc = plcGroup.First().Plc;
            var svc = _cache.GetOrCreate(plc);
            var groupAlarmResults = new List<(int TagId, bool IsOn, int Raw)>();

            foreach (var devGroup in plcGroup.GroupBy(t => t.DeviceType))
            {
                string deviceType = devGroup.Key;
                // 알람 태그의 D1 + 폴더태그의 D2가 같은 PLC/디바이스라면 여기서 합쳐져서
                // 하나의 청크로 묶인다 — 두 시스템이 따로 PLC에 왕복하지 않는다.
                var addrList = devGroup.Select(t => t.AddressValue).Distinct().OrderBy(a => a).ToList();
                var chunks   = BuildChunks(addrList, chunkSize);

                while (svc.HasPriorityWaiting)
                    await Task.Delay(50);

                var valueMap = await svc.ReadWordsBatchAsync(chunks, deviceType, (start, count, ex) =>
                {
                    _logger.LogWarning(ex,
                        "PLC read failed. PlcId={PlcId}, Device={Device}, Start={Start}, Count={Count}",
                        plc.Id, deviceType, start, count);
                });

                foreach (var tag in devGroup)
                {
                    if (!valueMap.TryGetValue(tag.AddressValue, out var raw)) continue;

                    if (tag.IsAlarmSource)
                    {
                        bool isOn = treatNonZeroAsOn ? raw != 0 : raw == 1;
                        groupAlarmResults.Add((tag.TagId, isOn, raw));
                    }
                    else
                    {
                        // 폴더태그: DB에 쓰지 않고 메모리에만 최신값 보관 (BIT/WORD 해석은 프론트 담당)
                        FolderTagValues[tag.TagId] = raw;
                    }
                }
            }

            // 이 PLC의 읽기가 끝나자마자 바로 전환 감지+DB 반영 (다른 PLC 그룹의 진행상황과 무관)
            if (groupAlarmResults.Count > 0)
                await ProcessAlarmTransitionsAsync(groupAlarmResults, isFirstPollThisCycle, ct);
        }));

        LastPollAt = DateTime.UtcNow;
        _firstPoll = false;
    }

    // PLC 그룹 하나의 알람 읽기 결과를 전환 감지 후 tb_alarm_history에 반영한다.
    // 다른 PLC 그룹을 기다리지 않고 자기 그룹이 끝나는 즉시 호출되므로, 이 태그들 전용 커넥션을 새로 연다
    // (여러 그룹이 동시에 이 메서드를 호출할 수 있어 커넥션은 그룹마다 독립적으로 열어야 한다).
    private async Task ProcessAlarmTransitionsAsync(List<(int TagId, bool IsOn, int Raw)> results, bool isFirstPoll, CancellationToken ct)
    {
        var toWrite = new List<(int TagId, bool IsOn, int Raw)>();
        foreach (var (tagId, isOn, raw) in results)
        {
            bool prev = _alarmState.GetOrAdd(tagId, _ => false);
            if (!isFirstPoll && isOn == prev) continue;
            toWrite.Add((tagId, isOn, raw));
            if (isFirstPoll)
                _logger.LogDebug("Alarm sync (startup): tagId={TagId} isOn={IsOn}", tagId, isOn);
            else
                _logger.LogInformation("Alarm transition: tagId={TagId} {Prev}→{IsOn} raw={Raw}",
                    tagId, prev ? "ON" : "OFF", isOn ? "ON" : "OFF", raw);
        }

        if (toWrite.Count == 0) return;

        using var conn = new MySqlConnection(_repo.ConnectionString);
        await conn.OpenAsync(ct);
        foreach (var (tagId, isOn, raw) in toWrite)
        {
            await ApplyAlarmTransitionAsync(conn, tagId, isOn, raw, ct);
            _alarmState[tagId] = isOn;
            _logger.LogDebug("Alarm DB updated: tagId={TagId} isOn={IsOn}", tagId, isOn);
        }
    }

    private async Task<List<AlarmTagRow>> LoadAlarmTagsAsync(CancellationToken ct)
    {
        using var conn = new MySqlConnection(_repo.ConnectionString);
        await conn.OpenAsync(ct);

        var tags = new List<AlarmTagRow>();
        using (var cmd = new MySqlCommand(@"
SELECT t.tag_id, t.address, t.enabled,
       p.plc_id, p.ip, p.port, p.plc_type, p.label, p.enabled AS plc_enabled
  FROM tb_alarm_tag t
  JOIN tb_plc p ON t.plc_id = p.plc_id
 WHERE t.enabled = 1 AND p.enabled = 1", conn))
        using (var reader = await cmd.ExecuteReaderAsync(ct))
        {
            while (await reader.ReadAsync(ct))
            {
                tags.Add(new AlarmTagRow
                {
                    TagId   = reader.GetInt32(0),
                    Address = reader.GetString(1),
                    Plc = new PlcConfigRow(
                        reader.GetString(3), reader.GetString(4), reader.GetInt32(5),
                        reader.GetString(6), reader.GetString(7), reader.GetBoolean(8)
                    )
                });
            }
        }

        var valid = new List<AlarmTagRow>();
        foreach (var tag in tags)
        {
            var parsed = ParseAddressFull(tag.Address);
            if (parsed == null)
            {
                _logger.LogWarning("Skip alarm tag {TagId} invalid address: {Address}", tag.TagId, tag.Address);
                continue;
            }
            tag.DeviceType   = parsed.Value.Device;
            tag.AddressValue = parsed.Value.Addr;
            valid.Add(tag);
        }
        return valid;
    }

    private async Task<List<FolderTagRow>> LoadFolderTagsAsync(CancellationToken ct)
    {
        using var conn = new MySqlConnection(_repo.ConnectionString);
        await conn.OpenAsync(ct);

        var tags = new List<FolderTagRow>();
        using (var cmd = new MySqlCommand(@"
SELECT t.id, t.address, t.type,
       p.plc_id, p.ip, p.port, p.plc_type, p.label, p.enabled AS plc_enabled
  FROM folders_tags t
  JOIN tb_plc p ON t.plc_id = p.plc_id
 WHERE t.enabled = 1 AND p.enabled = 1", conn))
        using (var reader = await cmd.ExecuteReaderAsync(ct))
        {
            while (await reader.ReadAsync(ct))
            {
                tags.Add(new FolderTagRow
                {
                    TagId   = reader.GetInt32(0),
                    Address = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Type    = reader.IsDBNull(2) ? "WORD" : reader.GetString(2),
                    Plc = new PlcConfigRow(
                        reader.GetString(3), reader.GetString(4), reader.GetInt32(5),
                        reader.GetString(6), reader.GetString(7), reader.GetBoolean(8)
                    )
                });
            }
        }

        var valid = new List<FolderTagRow>();
        foreach (var tag in tags)
        {
            var parsed = ParseAddressFull(tag.Address);
            if (parsed == null)
            {
                _logger.LogWarning("Skip folder tag {TagId} invalid address: {Address}", tag.TagId, tag.Address);
                continue;
            }
            tag.DeviceType   = parsed.Value.Device;
            tag.AddressValue = parsed.Value.Addr;
            valid.Add(tag);
        }
        return valid;
    }

    // 인접 주소를 한 번의 PLC 요청으로 묶는다 (알람+폴더태그 합쳐진 주소 목록 기준).
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

    // "D100"/"M50"/"0xC9" → (디바이스, 숫자주소). 접두어 없으면 D로 간주.
    private static (string Device, int Addr)? ParseAddressFull(string? address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        address = address.Trim();

        if (address.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
        {
            if (int.TryParse(address.AsSpan(2), NumberStyles.HexNumber, null, out int hex))
                return ("D", hex);
            return null;
        }

        int i = 0;
        while (i < address.Length && char.IsLetter(address[i])) i++;

        string device  = i > 0 ? address[..i].ToUpperInvariant() : "D";
        string numPart = address[i..];

        if (int.TryParse(numPart, out int v))
            return (device, v);

        return null;
    }

    private static async Task ApplyAlarmTransitionAsync(MySqlConnection conn, int tagId, bool isOn, int rawValue, CancellationToken ct)
    {
        long? openId = null;
        using (var cmdSel = new MySqlCommand(@"
SELECT history_id
  FROM tb_alarm_history
 WHERE tag_id = @tagId AND clear_time IS NULL
 ORDER BY occur_time DESC
 LIMIT 1", conn))
        {
            cmdSel.Parameters.AddWithValue("@tagId", tagId);
            var obj = await cmdSel.ExecuteScalarAsync(ct);
            if (obj != null && obj != DBNull.Value)
                openId = Convert.ToInt64(obj);
        }

        if (isOn)
        {
            if (openId == null)
            {
                using var cmdIns = new MySqlCommand(@"
INSERT INTO tb_alarm_history(tag_id, occur_time, value_at_occur)
VALUES (@tagId, NOW(), @val)", conn);
                cmdIns.Parameters.AddWithValue("@tagId", tagId);
                cmdIns.Parameters.AddWithValue("@val", rawValue.ToString());
                await cmdIns.ExecuteNonQueryAsync(ct);
            }
        }
        else
        {
            if (openId != null)
            {
                using var cmdUpd = new MySqlCommand(@"
UPDATE tb_alarm_history
   SET clear_time = NOW()
 WHERE history_id = @id", conn);
                cmdUpd.Parameters.AddWithValue("@id", openId.Value);
                await cmdUpd.ExecuteNonQueryAsync(ct);
            }
        }
    }

    // 알람/폴더태그를 하나의 폴링 배치로 합치기 위한 공용 표현 — 출처(IsAlarmSource)만 다르게 표시.
    private sealed class CombinedTagRow
    {
        public int TagId;
        public string DeviceType = "D";
        public int AddressValue;
        public PlcConfigRow Plc = null!;
        public bool IsAlarmSource;
    }

    private sealed class FolderTagRow
    {
        public int TagId { get; set; }
        public string Address { get; set; } = "";
        public string Type { get; set; } = "WORD";
        public string DeviceType { get; set; } = "D";
        public int AddressValue { get; set; }
        public PlcConfigRow Plc { get; set; } = null!;
    }
}
