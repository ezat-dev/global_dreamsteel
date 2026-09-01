// ============================================================================
// PlcRegistry.cs
// ============================================================================
// [파일 역할]
//   "기본(default) PLC 1대"의 접속정보(IP/Port/Type/Label)를 메모리에 들고 있다가,
//   Program.cs의 id 없는 API(/api/plc/read, /write, /config, /ping, /readBits, /writeBit)가
//   호출될 때 그 접속정보로 PlcService 인스턴스를 내려주는 창구 역할을 한다.
//   DB(MariaDB)는 전혀 건드리지 않는다 — 설정은 전부 이 클래스의 필드(_ip/_port/_type/_label)에만 있다.
//
// [처리 흐름 — 웹 요청이 여기까지 오는 경로]
//   웹 → 5050 → Program.cs의 핸들러 (예: app.MapGet("/api/plc/read", ...))
//     → PlcRegistry.GetOrCreateDefault() 호출
//       → 현재 _ip/_port/_type/_label 값으로 PlcConfigRow("default", ...)를 만들어
//         PlcServiceCache.GetOrCreate()에 넘긴다.
//       → PlcServiceCache가 같은 ip:port로 이미 만들어둔 PlcService가 있으면 그걸 재사용하고,
//         없으면 새로 만든다 (TCP 연결은 PlcService 안에서 지연 생성됨).
//     → 돌려받은 PlcService.ReadWordsAsync()/WriteWordAsync() 등을 호출해 실제 PLC와 통신.
//     → DB로는 가지 않는다. 여기서 끝.
//
//   /api/plc/config를 POST로 호출하면 ConfigDefault()가 _ip/_port/_type/_label을 바꾸고,
//   바뀐 설정으로 GetOrCreateDefault()를 다시 호출해 캐시에도 즉시 반영한다.
//   ※ 이 설정은 메모리에만 있으므로 서버를 재시작하면 아래 초기값으로 되돌아간다.
// ============================================================================

using PlcApiServer.Models;

namespace PlcApiServer.Services;

/// <summary>
/// PlcServiceCache를 공유하여 같은 PLC에 TCP 연결이 중복 생성되는 문제 해소
/// 기존에는 PlcRegistry와 PlcServiceCache가 각자 별도 PlcService 인스턴스를 생성하여
/// 동일한 PLC(예: 192.168.1.238:2004)에 TCP 연결이 2개 맺히고 연결 거부 발생
/// </summary>
public class PlcRegistry
{
    private readonly PlcServiceCache _cache;

    // 기본 PLC 설정 (변경 가능) — 서버 기동 시 초기값. ConfigDefault()로만 바뀌고 DB에는 저장 안 됨.
    private string _ip    = "192.168.1.238";
    private int    _port  = 2004;
    private string _type  = "LS";
    private string _label = "PLC-1";

    public PlcRegistry(PlcServiceCache cache) { _cache = cache; }

    // PlcServiceCache["default"] 와 동일한 인스턴스 반환 → TCP 연결 공유
    // id를 항상 "default"로 고정해서 호출하므로, ip:port가 바뀌지 않는 한 매번 같은 PlcService(=같은 TCP 연결)를 돌려준다.
    public PlcService GetOrCreateDefault()
        => _cache.GetOrCreate(new PlcConfigRow("default", _ip, _port, _type, _label, true));

    // /api/plc/config POST 에서 호출 — 기본 PLC의 접속정보를 메모리상에서 갱신한다.
    // 값이 비어있거나(null/공백) 범위를 벗어나면 기존 값을 그대로 유지한다 (부분 수정 허용).
    public void ConfigDefault(string? ip, int port, string? plcType, string? label)
    {
        if (!string.IsNullOrWhiteSpace(ip))      _ip    = ip!;
        if (port is > 0 and <= 65535)            _port  = port;
        if (!string.IsNullOrWhiteSpace(plcType))
        {
            // 알 수 없는 타입 문자열은 "LS"로 강제 — PlcService의 타입 분기(if/else)를 벗어나지 않게 방어
            var t = plcType!.Trim().ToUpperInvariant();
            _type = t switch { "MITSUBISHI" => "MITSUBISHI", "MODBUS_TCP" => "MODBUS_TCP", _ => "LS" };
        }
        if (!string.IsNullOrWhiteSpace(label))   _label = label!;
        GetOrCreateDefault(); // 캐시에 즉시 반영 (변경 직후 요청부터 새 설정으로 통신하도록)
    }

    // GET /api/plc/config 응답에 그대로 노출되는 현재 설정값
    public string DefaultIp    => _ip;
    public int    DefaultPort  => _port;
    public string DefaultType  => _type;
    public string DefaultLabel => _label;
}
