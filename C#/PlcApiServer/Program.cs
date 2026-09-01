// ============================================================================
// Program.cs
// ============================================================================
// [파일 역할]
//   ASP.NET Core 8 Minimal API의 진입점(Entry Point)이자 전체 HTTP 라우팅 테이블.
//   서버 기동, DI(의존성 주입) 등록, "/api/plc/..." 엔드포인트 전부가 이 파일 하나에 있다.
//
// [전체 처리 흐름 — 웹 요청이 5050 포트로 들어온 뒤 일어나는 일]
//   1) 웹/타 서버(JSP, 프론트엔드 등)가 http://<서버IP>:5050/api/plc/... 로 HTTP 요청을 보낸다.
//   2) 이 파일 맨 아래 app.Run("http://0.0.0.0:5050")으로 열어둔 Kestrel 웹서버가 요청을 받는다.
//   3) 요청 경로(URL)와 메서드(GET/POST/DELETE)를 이 파일의 app.MapGet/MapPost/MapDelete 중
//      일치하는 라우트에 매칭시켜 해당 람다(핸들러)를 실행한다.
//   4) 핸들러 안에서 아래 둘 중 하나의 경로로 실제 작업을 위임한다.
//        (A) 기본 PLC 1대만 상대하는 API (/read, /write, /config, /ping, /readBits, /writeBit)
//            → PlcRegistry(Services/PlcRegistry.cs)가 메모리에 들고 있는 IP/Port/Type을 사용.
//              DB 조회 없음. PlcServiceCache를 통해 PlcService 인스턴스를 얻는다.
//        (B) id로 특정 PLC를 지정하는 API ({id}가 붙은 엔드포인트들, /list, /add, /remove)
//            → PlcRepository(Repositories/PlcRepository.cs)가 MariaDB(ez_scada.tb_plc 테이블)를
//              조회/저장한다. 조회로 얻은 접속정보(ip/port/plcType)를 PlcServiceCache에 넘겨
//              PlcService 인스턴스를 얻는다.
//   5) PlcService(Services/PlcService.cs 및 PlcService.Ls/Mitsubishi/Modbus.cs)가 실제로
//      TCP 소켓을 열어 PLC와 통신한다 (LS FEnet / Mitsubishi MC Protocol / Modbus TCP).
//   6) 결과(읽은 값 또는 성공 여부)를 Results.Ok(new { success, ... }) 형태의 JSON으로
//      HTTP 응답에 담아 웹 쪽으로 돌려준다. 모든 API가 예외를 잡아서 HTTP 200 + success:false로
//      응답하도록 통일되어 있다 (호출 측에서 HTTP status가 아니라 JSON의 success 필드를 본다).
//
//   ※ DB까지 가는 요청 vs 안 가는 요청
//     - DB 조회/저장이 있는 것: /api/plc/list, /cnt, /add, /remove/{id}, /read/{id}, /write/{id},
//       /readRaw/{id}, /ping/{id}, /status-all, /readBits/{id}, /writeBit/{id}
//       → 전부 PlcRepository를 파라미터로 받아 MariaDB(tb_plc)를 거친다.
//     - DB 없이 메모리(PlcRegistry)만 쓰는 것: /api/plc/read, /write, /config, /ping,
//       /readBits, /writeBit (id 없는 버전) → 서버 재시작하면 기본값(192.168.1.238:2004 LS)으로 복귀.
//
// [DI(의존성 주입) 등록]
//   PlcRegistry / PlcRepository / PlcServiceCache 를 전부 싱글톤(Singleton)으로 등록한다.
//   싱글톤이어야 앱 전체에서 인스턴스가 1개만 존재해서, 같은 PLC에 대해 TCP 연결이 여러 개
//   중복 생성되는 것을 막고 DB 커넥션 문자열도 하나로 공유한다.
//
// [백그라운드 서비스]
//   LiveTagMonitorService / TempMonitorService 모두 활성화되어 있다. 서버 기동과 동시에 별도
//   스레드에서 주기적으로 PLC를 폴링한다.
//     - LiveTagMonitorService: 알람(tb_alarm_tag)과 폴더태그(folders_tags)를 하나의 폴링
//       배치로 합쳐서 읽는다(같은 PLC를 두 시스템이 따로 왕복하지 않도록). 알람은 전환시에만
//       DB(tb_alarm_history)에 기록하고, 폴더태그는 DB에 쓰지 않고 메모리에만 최신값을 들고
//       있다가 /api/foldertag/values 요청이 오면 그 자리에서 즉시 응답한다.
//     - TempMonitorService: 30초마다 전체 스냅샷 한 행을 통째로 DB(tb_temp_snapshot)에 적재.
//   (자세한 내용은 각 Services/*.cs 파일 상단 참고)
// ============================================================================

using System.Collections.Concurrent;
using PlcApiServer.Services;
using PlcApiServer.Repositories;
using PlcApiServer.Models;

// ── 웹 애플리케이션 빌더 생성 & 서비스 등록 ────────────────────────────────────
var builder = WebApplication.CreateBuilder(args);

// CORS 전체 허용 — 프론트엔드(JSP 등 다른 포트/도메인)에서 5050으로 자유롭게 호출 가능하게 함
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// DI 컨테이너에 싱글톤으로 등록 — 요청마다 새로 만들지 않고 앱 생명주기 동안 인스턴스 1개 공유
builder.Services.AddSingleton<PlcRegistry>();     // 기본(default) PLC 1대의 설정 + 접근 창구
builder.Services.AddSingleton<PlcRepository>();   // MariaDB(ez_scada.tb_plc) CRUD 담당
builder.Services.AddSingleton<PlcServiceCache>(); // ip:port 별 PlcService(TCP 연결) 재사용 캐시

// BackgroundService 등록 — 앱 시작과 동시에 별도 스레드가 돌면서 PLC를 주기적으로 읽음
// LiveTagMonitorService는 AddSingleton으로도 등록한다 — 아래 /api/foldertag/values 핸들러가
// 이 "같은" 인스턴스를 DI로 주입받아 FolderTagValues(메모리 캐시)를 직접 읽어야 하기 때문.
// AddHostedService(sp => ...)로 넘겨줘야 호스트가 새 인스턴스를 또 만들지 않고 그 싱글톤을 그대로 구동한다.
builder.Services.AddSingleton<LiveTagMonitorService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<LiveTagMonitorService>());
builder.Services.AddHostedService<TempMonitorService>();

var app = builder.Build();
app.UseCors();

// ============================================================================
// [A] 기본(default) PLC 1대 전용 API — DB를 거치지 않고 PlcRegistry(메모리)만 사용
//     흐름: 웹 → 5050 → 이 핸들러 → PlcRegistry.GetOrCreateDefault()
//           → PlcServiceCache에서 "default"용 PlcService를 꺼내거나 새로 생성
//           → PlcService가 TCP로 PLC와 직접 통신 → 결과 JSON 응답
// ============================================================================

// GET /api/plc/read?start=&count=
//   기본 PLC의 워드(레지스터)를 count개 읽는다. device 파라미터가 없어 항상 "D"(데이터 레지스터)로 읽음.
app.MapGet("/api/plc/read", async (int start, int count, PlcRegistry reg) =>
{
    try
    {
        var values = await reg.GetOrCreateDefault().ReadWordsAsync(start, count);
        return Results.Ok(new { success = true, start, values });
    }
    catch (Exception ex)
    {
        // PLC 통신 실패(타임아웃, 연결 끊김 등)도 HTTP 200 + success:false 로 응답
        return Results.Ok(new { success = false, error = ex.Message });
    }
});

// POST /api/plc/write  body: { address, value, device }
//   기본 PLC에 워드 1개를 쓴다. PlcService 내부에서 쓰기 후 즉시 읽어 검증(최대 3회 재시도)한다.
//   device: 미쓰비시(D/W/R) / LS(D/M/L/P, D는 기존 경로·나머지는 Individual 모드). 생략 시 "D". Modbus는 무시.
app.MapPost("/api/plc/write", async (WriteRequest req, PlcRegistry reg) =>
{
    try
    {
        await reg.GetOrCreateDefault().WriteWordAsync(req.Address, req.Value, req.Device ?? "D");
        return Results.Ok(new { success = true });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { success = false, error = ex.Message });
    }
});

// GET /api/plc/config
//   현재 메모리에 저장된 기본 PLC 접속정보를 그대로 반환 (DB 조회 아님, 서버 기동 후 설정한 값).
app.MapGet("/api/plc/config", (PlcRegistry reg) =>
{
    return Results.Ok(new
    {
        ip = reg.DefaultIp,
        port = reg.DefaultPort,
        plcType = reg.DefaultType,
        label = reg.DefaultLabel
    });
});

// POST /api/plc/config  body: { ip, port, plcType, label }
//   기본 PLC의 접속정보를 메모리상에서 변경한다. DB에는 저장되지 않으므로 서버를 재시작하면
//   PlcRegistry 생성자의 초기값(192.168.1.238:2004 LS)으로 되돌아간다.
app.MapPost("/api/plc/config", (PlcConfigRequest req, PlcRegistry reg) =>
{
    reg.ConfigDefault(req.Ip, req.Port, req.PlcType, req.Label);

    return Results.Ok(new
    {
        success = true,
        ip = reg.DefaultIp,
        port = reg.DefaultPort,
        plcType = reg.DefaultType,
        label = reg.DefaultLabel
    });
});

// GET /api/plc/ping
//   기본 PLC와의 통신 가능 여부만 확인. 새 TCP를 만들지 않고 기존 영구 연결을 그대로 재사용해서
//   주소 0번을 1개 가볍게 읽어보는 방식 → LS/Mitsubishi처럼 동시 접속 1개만 허용하는 PLC에서도
//   연결을 하나 더 뺏지 않고 PING이 가능하다.
app.MapGet("/api/plc/ping", async (PlcRegistry reg) =>
{
    var plc = reg.GetOrCreateDefault();
    try
    {
        await plc.ReadWordsAsync(0, 1);
        return Results.Ok(new { success = true, message = $"{reg.DefaultIp}:{reg.DefaultPort} connected" });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { success = false, message = ex.Message });
    }
});

// ============================================================================
// [B] 다중 PLC 관리 API (Multi-PLC CRUD) — MariaDB(ez_scada.tb_plc)를 거치는 API들
//     흐름: 웹 → 5050 → 이 핸들러 → PlcRepository로 DB 조회/저장
//           → (필요 시) PlcServiceCache.GetOrCreate(cfg)로 해당 PLC용 PlcService 획득
//           → PlcService가 TCP로 해당 PLC와 통신 → 결과 JSON 응답
// ============================================================================

// GET /api/plc/list
//   등록된 모든 PLC 목록을 DB(tb_plc)에서 그대로 조회해 반환. PLC와의 실제 통신은 없음
//   (화면에 PLC 목록/설정을 뿌려주기 위한 용도).
app.MapGet("/api/plc/list", async (PlcRepository repo) =>
{
    var list = await repo.GetAllAsync();
    return Results.Ok(list.Select(e => new {
        id = e.Id,
        ip = e.Ip,
        port = e.Port,
        plcType = e.PlcType,
        label = e.Label,
        enabled = e.Enabled
    }));
});

// GET /api/plc/cnt
//   DB(tb_plc)에 등록된 PLC들의 plc_id/ip만 간단히 반환. /list와 마찬가지로 PLC와의
//   실제 통신은 없고 DB 조회만 한다 (등록된 PLC 수·목록을 가볍게 확인하고 싶을 때 사용).
app.MapGet("/api/plc/cnt", async (PlcRepository repo) =>
{
    var list = await repo.GetAllAsync();
    return Results.Ok(list.Select(e => new {
        id = e.Id,
        ip = e.Ip
    }));
});

// POST /api/plc/add  body: { id, ip, port, plcType, label, enabled }
//   PLC 등록/수정(upsert). 흐름:
//     1) plcType 문자열을 NormalizePlcType()으로 "LS"/"MITSUBISHI"/"MODBUS_TCP" 중 하나로 정규화
//     2) port가 안 넘어오면 GetDefaultPort()로 타입별 기본 포트를 채움 (LS=2004, MITSUBISHI=6004, MODBUS_TCP=502)
//     3) PlcRepository.AddOrUpdateAsync → DB(tb_plc)에 INSERT ... ON DUPLICATE KEY UPDATE
//     4) PlcServiceCache.GetOrCreate(cfg) → 방금 저장한 설정으로 캐시도 즉시 갱신
//        (DB에만 저장하고 캐시를 안 갱신하면, 기존에 캐시돼 있던 옛 IP/타입으로 계속 통신하게 되므로 필수)
app.MapPost("/api/plc/add", async (PlcAddRequest req, PlcRepository repo, PlcServiceCache cache) =>
{
    if (string.IsNullOrWhiteSpace(req.Id))
        return Results.Ok(new { success = false, error = "id required" });

    string plcType = NormalizePlcType(req.PlcType);

    var cfg = new PlcConfigRow(
        req.Id.Trim(),
        string.IsNullOrWhiteSpace(req.Ip) ? "192.168.1.1" : req.Ip.Trim(),
        req.Port is > 0 and <= 65535 ? req.Port : GetDefaultPort(plcType),
        plcType,
        string.IsNullOrWhiteSpace(req.Label) ? req.Id.Trim() : req.Label.Trim(),
        req.Enabled ?? true
    );

    await repo.AddOrUpdateAsync(cfg);   // DB 저장
    cache.GetOrCreate(cfg);             // 캐시 즉시 반영 (다음 요청부터 새 설정으로 통신)

    Console.WriteLine($"[ADD] {cfg.Id}  {cfg.PlcType}  {cfg.Ip}:{cfg.Port}  \"{cfg.Label}\"");
    return Results.Ok(new { success = true, id = cfg.Id });
});

// DELETE /api/plc/remove/{id}
//   DB(tb_plc)에서 삭제 + 캐시에서도 제거. 캐시 제거 시 같은 ip:port를 쓰는 다른 id가
//   없는지 확인한 뒤에만 실제 TCP 연결을 정리한다 (PlcServiceCache.Remove 내부 로직).
app.MapDelete("/api/plc/remove/{id}", async (string id, PlcRepository repo, PlcServiceCache cache) =>
{
    bool ok = await repo.RemoveAsync(id);
    cache.Remove(id);
    Console.WriteLine($"[REMOVE] {id}");
    return Results.Ok(new { success = ok });
});

// GET /api/plc/read/{id}?start=&count=&device=
//   id로 지정한 PLC의 워드를 읽는다. 흐름:
//     1) PlcRepository.GetByIdAsync(id) → DB(tb_plc)에서 해당 PLC의 ip/port/plcType 조회
//        못 찾으면 success:false 로 즉시 응답 (HTTP 404 아님, 항상 200)
//     2) PlcServiceCache.GetOrCreate(cfg) → 같은 ip:port면 기존 TCP 연결을 재사용
//     3) PlcService.ReadWordsAsync(start, count, device) 호출
//        device는 미쓰비시(D/M/X/Y 등 디바이스 코드로 반영)와 LS(D=기존 경로, M/L/P=Individual 모드)
//        에서 실제로 반영되고, MODBUS_TCP에서는 무시된다 (PlcService.cs 상단 주석 참고).
app.MapGet("/api/plc/read/{id}", async (string id, int start, int count, string? device, PlcRepository repo, PlcServiceCache cache) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, error = $"PLC '{id}' not found" });
    try
    {
        var svc = cache.GetOrCreate(cfg);
        var values = await svc.ReadWordsAsync(start, count, device ?? "D");
        return Results.Ok(new { success = true, start, values });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

// GET /api/plc/readRaw/{id}?start=&count=
//   FC03 raw 읽기 — Modbus 표준 주소 변환(40001 빼기 등) 없이 wire address(0-based)를 그대로
//   FC03(Holding Register Read)으로 보낸다. 0-based 주소 체계를 쓰는 일부 PLC(BCF_6 시간 레지스터 등) 전용.
//   구현은 PlcService.Modbus.cs의 ReadWordsRawFc3Async 참고. plcType 상관없이 항상 Modbus wire로 나간다.
app.MapGet("/api/plc/readRaw/{id}", async (string id, int start, int count, PlcRepository repo, PlcServiceCache cache) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, error = $"PLC '{id}' not found" });
    try
    {
        var svc = cache.GetOrCreate(cfg);
        var values = await svc.ReadWordsRawFc3Async(start, count);
        return Results.Ok(new { success = true, start, values });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

// POST /api/plc/write/{id}  body: { address, value, device }
//   id로 지정한 PLC에 워드 1개를 쓴다. /read/{id}와 동일하게 DB에서 접속정보를 조회한 뒤
//   PlcService.WriteWordAsync(쓰기 후 read-back 검증, 최대 3회 재시도)를 호출한다.
//   device: 미쓰비시(D/W/R) / LS(D/M/L/P). 생략 시 "D". Modbus는 무시.
app.MapPost("/api/plc/write/{id}", async (string id, WriteRequest req, PlcRepository repo, PlcServiceCache cache) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, error = $"PLC '{id}' not found" });
    try
    {
        var svc = cache.GetOrCreate(cfg);
        await svc.WriteWordAsync(req.Address, req.Value, req.Device ?? "D");
        return Results.Ok(new { success = true });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

// GET /api/plc/ping/{id}
//   id로 지정한 PLC의 통신 상태 확인. 두 단계로 나뉜다.
//     1) 캐시에 최근 성공 기록(LastSuccessAt)이 있고 90초 이내면, 새로 연결하지 않고
//        바로 "성공"으로 응답한다 (AlarmMonitor 1s / TempMonitor 60s 주기로 어차피 계속 통신 중이라
//        굳이 PING을 위해 추가 TCP를 만들 필요가 없기 때문 — 리소스 절약).
//     2) 아직 폴링 이력이 전혀 없으면(LastSuccessAt == null), 이 요청이 직접 TcpClient로
//        연결을 시도해서 확인한다 (PlcService를 거치지 않는 순수 TCP connect 테스트).
app.MapGet("/api/plc/ping/{id}", async (string id, PlcRepository repo, PlcServiceCache cache) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, message = $"PLC '{id}' not found" });

    var svc = cache.GetOrCreate(cfg);
    var last = svc.LastSuccessAt;

    // 최근 90초 이내 성공 이력 → TCP 연결 없이 즉시 반환
    // (AlarmMonitor 1s, TempMonitor 60s 주기 고려)
    if (last.HasValue)
    {
        double age = (DateTime.UtcNow - last.Value).TotalSeconds;
        if (age <= 90)
            return Results.Ok(new { success = true, message = $"{cfg.Ip}:{cfg.Port} connected" });
        return Results.Ok(new { success = false, message = $"last ok {age:F0}s ago" });
    }

    // LastSuccessAt 없음 = 아직 폴링 전 → TCP 직접 확인
    try
    {
        using var tcp = new System.Net.Sockets.TcpClient();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        await tcp.ConnectAsync(cfg.Ip, cfg.Port, cts.Token);
        return Results.Ok(new { success = true, message = $"{cfg.Ip}:{cfg.Port} connected" });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, message = ex.Message }); }
});

// GET /api/plc/status-all
//   등록된 전체 PLC의 통신 상태를 한 번에 조회. DB(tb_plc)에서 목록을 가져온 뒤,
//   각 PLC에 대해 cache.TryGet()으로 "캐시에 이미 있는 PlcService가 있으면 그 마지막 성공
//   시각만" 확인한다 — 여기서는 절대 새 TCP 연결을 만들지 않는다 (대시보드에서 다수 PLC
//   상태를 자주 폴링해도 PLC 쪽에 부담을 주지 않기 위함).
app.MapGet("/api/plc/status-all", async (PlcRepository repo, PlcServiceCache cache) =>
{
    var list = await repo.GetAllAsync();
    var now  = DateTime.UtcNow;
    var result = list.Select(cfg =>
    {
        var svc  = cache.TryGet(cfg.Id);          // 연결 없이 캐시만 조회
        var last = svc?.LastSuccessAt;
        double? age = last.HasValue ? (now - last.Value).TotalSeconds : (double?)null;
        bool ok = age.HasValue && age.Value <= 90;
        return new
        {
            id      = cfg.Id,
            ok,
            ageSeconds = age.HasValue ? (int)age.Value : (int?)null,
            message = ok ? "connected" : (age.HasValue ? $"last ok {(int)age.Value}s ago" : "no data")
        };
    });
    return Results.Ok(result);
});

// ============================================================================
// [C] 비트(Bit) 읽기/쓰기 API — MODBUS_TCP / MITSUBISHI / LS(M/L/P) 전부 지원
//     device 파라미터로 비트 디바이스를 지정한다 (미쓰비시: M/L/X/Y/B 등, LS: M/L/P — D는 비트
//     불가, 기본값 "M"). Modbus는 device를 무시하고 address 자체가 영역(0x/1x/2x)을 나타낸다.
//     LS의 M/L/P 비트 read/write는 LS전기 공식 매뉴얼의 데이터 타입 코드는 확인했지만 응답
//     인코딩까지는 실기로 검증되지 않았다 (PlcService.Ls.cs 상단 주석 참고) — 실제 배포 전에
//     읽기부터 먼저 테스트해볼 것을 권장한다.
// ============================================================================

// GET /api/plc/readBits?start=&count=&device=  (default PLC)
app.MapGet("/api/plc/readBits", async (int start, int count, string? device, PlcRegistry reg) =>
{
    try
    {
        var values = await reg.GetOrCreateDefault().ReadBitsAsync(start, count, device ?? "M");
        return Results.Ok(new { success = true, start, values });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

// POST /api/plc/writeBit  body: { address, value, device }  (default PLC)
app.MapPost("/api/plc/writeBit", async (WriteBitRequest req, PlcRegistry reg) =>
{
    try
    {
        await reg.GetOrCreateDefault().WriteBitAsync(req.Address, req.Value, req.Device ?? "M");
        return Results.Ok(new { success = true });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

// GET /api/plc/readBits/{id}?start=&count=&device=  (id 지정 PLC, DB에서 접속정보 조회)
app.MapGet("/api/plc/readBits/{id}", async (string id, int start, int count, string? device, PlcRepository repo, PlcServiceCache cache) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, error = $"PLC '{id}' not found" });
    try
    {
        var svc = cache.GetOrCreate(cfg);
        var values = await svc.ReadBitsAsync(start, count, device ?? "M");
        return Results.Ok(new { success = true, start, values });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

// POST /api/plc/writeBit/{id}  body: { address, value, device }  (id 지정 PLC, DB에서 접속정보 조회)
app.MapPost("/api/plc/writeBit/{id}", async (string id, WriteBitRequest req, PlcRepository repo, PlcServiceCache cache) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, error = $"PLC '{id}' not found" });
    try
    {
        var svc = cache.GetOrCreate(cfg);
        await svc.WriteBitAsync(req.Address, req.Value, req.Device ?? "M");
        return Results.Ok(new { success = true });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

// GET /api/plc/writeBit/{id}?address=&value=&device=  (id 지정 PLC, URL만으로 비트 쓰기)
//   위 POST와 동작은 동일 — body 없이 브라우저 주소창에서 바로 테스트할 수 있도록 GET으로도 열어둠.
//   같은 경로에 POST/GET을 각각 매핑했기 때문에 HTTP 메서드로 구분된다(URL 충돌 아님).
//   value는 "true"/"1"을 참으로 인식하고 그 외(예: "false","0")는 거짓으로 처리한다.
app.MapGet("/api/plc/writeBit/{id}", async (string id, int address, string value, string? device, PlcRepository repo, PlcServiceCache cache) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, error = $"PLC '{id}' not found" });
    try
    {
        bool boolValue = value == "1" || string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);
        var svc = cache.GetOrCreate(cfg);
        await svc.WriteBitAsync(address, boolValue, device ?? "M");
        return Results.Ok(new { success = true, address, value = boolValue, device = device ?? "M" });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

// GET /api/foldertag/values
//   folders_tags(폴더 태그)의 최신값을 즉시 반환한다. PLC 통신 없이 응답 — 값은
//   LiveTagMonitorService가 백그라운드에서 이미 폴링해 메모리(FolderTagValues)에 들고 있는
//   것을 그대로 꺼내주는 것뿐이다. tagId(=folders_tags.id) → raw 값(int, 통신 실패 시 null)
//   맵으로 응답하고, BIT/WORD 해석(0이 아니면 ON 등)은 호출하는 쪽(Java/JSP)이 담당한다.
app.MapGet("/api/foldertag/values", (LiveTagMonitorService monitor) =>
{
    return Results.Ok(new
    {
        success = true,
        lastPollAt = monitor.LastPollAt,
        values = monitor.FolderTagValues
    });
});

// ============================================================================
// [로컬 함수] /api/plc/add 에서만 사용하는 입력값 보정 헬퍼
// ============================================================================

// 클라이언트가 보낸 plcType 문자열을 서버가 아는 3종류 중 하나로 강제 변환.
// 대소문자 무시, 공백 제거, 알 수 없는 값이면 기본값 "LS"로 처리 → 잘못된 타입 문자열이
// DB에 그대로 저장되어 PlcService의 타입 분기(if/else)를 벗어나는 사고를 방지.
static string NormalizePlcType(string? rawPlcType)
{
    var t = (rawPlcType ?? "LS").Trim().ToUpperInvariant();
    return t switch
    {
        "LS" => "LS",
        "MITSUBISHI" => "MITSUBISHI",
        "MODBUS_TCP" => "MODBUS_TCP",
        _ => "LS"
    };
}

// 클라이언트가 port를 안 넘기거나 범위를 벗어난 값을 보냈을 때, PLC 타입별 관례적인
// 기본 포트를 채워준다 (LS XGT FEnet=2004, Mitsubishi MC Protocol=6004, Modbus TCP=502).
static int GetDefaultPort(string plcType)
{
    return plcType switch
    {
        "MITSUBISHI" => 6004,
        "MODBUS_TCP" => 502,
        _ => 2004
    };
}

// ── 서버 기동 — 0.0.0.0:5050 으로 모든 네트워크 인터페이스에서 요청을 수신 ──────────
app.Run("http://0.0.0.0:5050");
