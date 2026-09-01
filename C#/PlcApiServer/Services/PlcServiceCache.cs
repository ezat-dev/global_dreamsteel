// ============================================================================
// PlcServiceCache.cs
// ============================================================================
// [파일 역할]
//   "ip:port"(물리적인 PLC 1대) 당 PlcService(=TCP 연결) 인스턴스를 딱 1개만 만들어서
//   재사용하는 캐시. Program.cs의 모든 API 핸들러(기본 PLC든 id 지정 PLC든)가 실제 PLC와
//   통신하기 직전에 반드시 이 캐시를 거쳐 PlcService를 얻는다.
//
// [왜 필요한가]
//   PlcRegistry(기본 PLC 전용)와 id 기반 API가 각자 따로 PlcService를 새로 만들면,
//   같은 PLC(예: 192.168.1.238:2004)에 TCP 연결이 2개 이상 맺히면서 LS/Mitsubishi처럼
//   동시 접속 대수가 제한된 PLC에서 연결 거부가 발생한다. 이 캐시가 ip:port를 키로 써서
//   PlcService를 공유시킴으로써 "물리적 PLC 1대 = TCP 연결 1개"를 보장한다.
//
// [처리 흐름 — 웹 요청이 여기까지 오는 경로]
//   웹 → 5050 → Program.cs 핸들러
//     → (기본 PLC) PlcRegistry.GetOrCreateDefault() 내부에서 이 클래스의 GetOrCreate() 호출
//     → (id 지정 PLC) Program.cs가 PlcRepository로 DB(tb_plc)에서 PlcConfigRow를 조회한 뒤
//       그 cfg를 그대로 이 클래스의 GetOrCreate(cfg)에 넘김
//   → GetOrCreate(cfg): ip:port 키로 기존 PlcService가 있으면 그걸 반환(TCP 연결 재사용),
//     없으면 새 PlcService를 만들어 캐시에 저장.
//   → 호출한 쪽(Program.cs)이 돌려받은 PlcService로 ReadWordsAsync/WriteWordAsync 등을 실행
//     → 그제서야 실제 TCP 소켓으로 PLC와 통신이 일어난다 (연결 자체는 PlcService.cs가 지연 생성).
//   ※ 이 클래스 자체는 DB에 접근하지 않는다. DB 조회는 항상 호출하는 쪽(PlcRepository)의 몫이고,
//     이 클래스는 순수하게 "설정(cfg) → PlcService 인스턴스" 매핑만 담당한다.
// ============================================================================

using System.Collections.Concurrent;
using PlcApiServer.Models;

namespace PlcApiServer.Services;

public sealed class PlcServiceCache
{
    // ── 주 맵: "ip:port" → CacheItem (물리 엔드포인트 당 TCP 연결 1개 보장) ──
    private readonly ConcurrentDictionary<string, CacheItem> _byEndpoint = new();

    // ── 알람 전용 맵: AlarmMonitorService 전용 분리 연결 ──────────────────────
    // Start/Move/End 서비스의 락을 점유하지 않도록 별도 PlcService 인스턴스 유지
    private readonly ConcurrentDictionary<string, CacheItem> _alarmByEndpoint = new();

    // ── 역방향 맵: plcId → "ip:port" (Remove(id) 지원용) ──────────────────
    private readonly ConcurrentDictionary<string, string> _idToEndpoint =
        new(StringComparer.OrdinalIgnoreCase);

    // 캐시 키 생성: IP 대소문자를 무시하고 "ip:port" 형태로 정규화
    private static string EndpointKey(PlcConfigRow cfg) =>
        $"{cfg.Ip.Trim().ToLowerInvariant()}:{cfg.Port}";

    /// <summary>
    /// cfg(plcId, ip, port, plcType, label)에 대응하는 PlcService를 반환한다.
    /// 같은 ip:port로 이미 만들어둔 PlcService가 있으면 그 인스턴스를 그대로 재사용(=TCP 연결 재사용),
    /// 없으면 CacheItem.Create(cfg)로 새 PlcService를 만들어 캐시에 넣는다.
    /// plcId의 ip:port가 이전과 달라졌으면(설정 변경) 옛 엔드포인트를 정리해 좀비 연결이 남지 않게 한다.
    /// </summary>
    public PlcService GetOrCreate(PlcConfigRow cfg)
    {
        string epKey = EndpointKey(cfg);

        // IP:Port 가 바뀐 경우 이전 엔드포인트 정리
        if (_idToEndpoint.TryGetValue(cfg.Id, out var oldEp) && oldEp != epKey)
        {
            // 다른 plcId가 여전히 그 옛 엔드포인트를 쓰고 있으면 연결을 살려둬야 하므로 확인 후 제거
            bool stillUsed = false;
            foreach (var v in _idToEndpoint.Values)
            {
                if (v == oldEp) { stillUsed = true; break; }
            }
            if (!stillUsed)
                _byEndpoint.TryRemove(oldEp, out _);
        }

        // 키가 없으면 새로 생성(Create), 있으면 최신 cfg로 갱신(Update)만 하고 기존 PlcService 인스턴스는 유지
        var item = _byEndpoint.AddOrUpdate(
            epKey,
            _ => CacheItem.Create(cfg),
            (_, existing) => existing.Update(cfg)
        );

        _idToEndpoint[cfg.Id] = epKey;
        return item.Service;
    }

    /// <summary>
    /// AlarmMonitorService 전용 PlcService 인스턴스 반환.
    /// Start/Move/End 서비스와 락을 공유하지 않는 별도 TCP 연결을 사용한다.
    /// </summary>
    public PlcService GetOrCreateAlarm(PlcConfigRow cfg)
    {
        string epKey = EndpointKey(cfg);
        var item = _alarmByEndpoint.AddOrUpdate(
            epKey,
            _ => CacheItem.Create(cfg),
            (_, existing) => existing.Update(cfg)
        );
        return item.Service;
    }

    /// <summary>
    /// 새 연결/생성 없이 캐시에 이미 있는 PlcService만 조회한다 (없으면 null).
    /// Program.cs의 /api/plc/status-all이 다수 PLC 상태를 조회할 때, TCP 연결을 새로 만들지
    /// 않기 위해 이 메서드를 사용한다 (읽기 전용 조회, PLC에 부담을 주지 않음).
    /// </summary>
    public PlcService? TryGet(string id)
    {
        if (!_idToEndpoint.TryGetValue(id, out var epKey)) return null;
        return _byEndpoint.TryGetValue(epKey, out var item) ? item.Service : null;
    }

    /// <summary>
    /// plcId를 캐시에서 제거한다 (Program.cs의 /api/plc/remove/{id}에서 호출).
    /// 같은 ip:port를 쓰는 다른 plcId가 남아있지 않을 때만 실제 PlcService(TCP 연결)를 정리한다.
    /// </summary>
    public void Remove(string id)
    {
        if (!_idToEndpoint.TryRemove(id, out var epKey)) return;

        bool stillUsed = false;
        foreach (var v in _idToEndpoint.Values)
        {
            if (v == epKey) { stillUsed = true; break; }
        }
        if (!stillUsed)
        {
            _byEndpoint.TryRemove(epKey, out _);
            _alarmByEndpoint.TryRemove(epKey, out _);
        }
    }

    // ip:port 하나에 대응하는 PlcService 인스턴스 + 마지막으로 반영된 설정(cfg)을 함께 보관하는 내부 컨테이너
    private sealed class CacheItem
    {
        public PlcConfigRow Config { get; private set; }
        public PlcService Service { get; }

        private CacheItem(PlcConfigRow config, PlcService service)
        {
            Config = config;
            Service = service;
        }

        // 최초 등록 시: cfg의 접속정보로 새 PlcService를 만든다 (TCP 연결 자체는 아직 안 맺음, 지연 연결).
        public static CacheItem Create(PlcConfigRow cfg)
        {
            var svc = new PlcService
            {
                PlcIp   = cfg.Ip,
                PlcPort = cfg.Port,
                PlcType = cfg.PlcType,
                Label   = cfg.Label
            };
            return new CacheItem(cfg, svc);
        }

        // 이미 있는 PlcService에 대해 설정이 바뀐 경우에만(Equals 비교) 필드를 갱신한다.
        // 인스턴스 자체는 새로 만들지 않으므로 진행 중인 TCP 연결/락 상태는 그대로 유지된다.
        public CacheItem Update(PlcConfigRow cfg)
        {
            if (!Equals(Config, cfg))
            {
                Service.PlcIp   = cfg.Ip;
                Service.PlcPort = cfg.Port;
                Service.PlcType = cfg.PlcType;
                Service.Label   = cfg.Label;
                Config = cfg;
            }
            return this;
        }
    }
}
