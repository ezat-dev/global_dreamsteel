// Program.cs  ASP.NET Core 8 Minimal API  (port 5050)
// Default PLC read/write + Multi-PLC CRUD (DB)

using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddSingleton<PlcRegistry>();
builder.Services.AddSingleton<PlcRepository>();
builder.Services.AddSingleton<PlcServiceCache>();
builder.Services.AddHostedService<AlarmMonitorService>();
builder.Services.AddHostedService<TempMonitorService>();

var app = builder.Build();
app.UseCors();

// Default PLC (in-memory)
app.MapGet("/api/plc/read", async (int start, int count, PlcRegistry reg) =>
{
    try
    {
        var values = await reg.GetOrCreateDefault().ReadWordsAsync(start, count);
        return Results.Ok(new { success = true, start, values });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { success = false, error = ex.Message });
    }
});

app.MapPost("/api/plc/write", async (WriteRequest req, PlcRegistry reg) =>
{
    try
    {
        await reg.GetOrCreateDefault().WriteWordAsync(req.Address, req.Value);
        return Results.Ok(new { success = true });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { success = false, error = ex.Message });
    }
});

app.MapGet("/api/plc/config", (PlcRegistry reg) =>
{
    var plc = reg.GetOrCreateDefault();
    return Results.Ok(new
    {
        ip = plc.PlcIp,
        port = plc.PlcPort,
        plcType = plc.PlcType,
        label = plc.Label
    });
});

app.MapPost("/api/plc/config", (PlcConfigRequest req, PlcRegistry reg) =>
{
    var plc = reg.GetOrCreateDefault();

    if (!string.IsNullOrWhiteSpace(req.Ip)) plc.PlcIp = req.Ip;
    if (req.Port is > 0 and <= 65535) plc.PlcPort = req.Port;
    if (!string.IsNullOrWhiteSpace(req.PlcType)) plc.PlcType = NormalizePlcType(req.PlcType);
    if (!string.IsNullOrWhiteSpace(req.Label)) plc.Label = req.Label;

    string source = req.Source ?? "Unknown";
    Console.WriteLine($"[CONFIG] {source}: {plc.PlcType}  {plc.PlcIp}:{plc.PlcPort}");

    return Results.Ok(new
    {
        success = true,
        ip = plc.PlcIp,
        port = plc.PlcPort,
        plcType = plc.PlcType,
        label = plc.Label
    });
});

app.MapGet("/api/plc/ping", async (PlcRegistry reg) =>
{
    var plc = reg.GetOrCreateDefault();
    try
    {
        using var tcp = new System.Net.Sockets.TcpClient
            { ReceiveTimeout = 2000, SendTimeout = 2000 };
        await tcp.ConnectAsync(plc.PlcIp, plc.PlcPort);
        return Results.Ok(new { success = true, message = $"{plc.PlcIp}:{plc.PlcPort} connected" });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { success = false, message = ex.Message });
    }
});

// Multi-PLC CRUD (DB)
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

    await repo.AddOrUpdateAsync(cfg);
    cache.GetOrCreate(cfg);

    Console.WriteLine($"[ADD] {cfg.Id}  {cfg.PlcType}  {cfg.Ip}:{cfg.Port}  \"{cfg.Label}\"");
    return Results.Ok(new { success = true, id = cfg.Id });
});

app.MapDelete("/api/plc/remove/{id}", async (string id, PlcRepository repo, PlcServiceCache cache) =>
{
    bool ok = await repo.RemoveAsync(id);
    cache.Remove(id);
    Console.WriteLine($"[REMOVE] {id}");
    return Results.Ok(new { success = ok });
});

app.MapGet("/api/plc/read/{id}", async (string id, int start, int count, PlcRepository repo, PlcServiceCache cache) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, error = $"PLC '{id}' not found" });
    try
    {
        var svc = cache.GetOrCreate(cfg);
        var values = await svc.ReadWordsAsync(start, count);
        return Results.Ok(new { success = true, start, values });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

app.MapPost("/api/plc/write/{id}", async (string id, WriteRequest req, PlcRepository repo, PlcServiceCache cache) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, error = $"PLC '{id}' not found" });
    try
    {
        var svc = cache.GetOrCreate(cfg);
        await svc.WriteWordAsync(req.Address, req.Value);
        return Results.Ok(new { success = true });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
});

app.MapGet("/api/plc/ping/{id}", async (string id, PlcRepository repo) =>
{
    var cfg = await repo.GetByIdAsync(id);
    if (cfg == null) return Results.Ok(new { success = false, message = $"PLC '{id}' not found" });
    try
    {
        using var tcp = new System.Net.Sockets.TcpClient
            { ReceiveTimeout = 2000, SendTimeout = 2000 };
        await tcp.ConnectAsync(cfg.Ip, cfg.Port);
        return Results.Ok(new { success = true, message = $"{cfg.Ip}:{cfg.Port} connected" });
    }
    catch (Exception ex) { return Results.Ok(new { success = false, message = ex.Message }); }
});

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

static int GetDefaultPort(string plcType)
{
    return plcType switch
    {
        "MITSUBISHI" => 6004,
        "MODBUS_TCP" => 502,
        _ => 2004
    };
}

app.Run("http://0.0.0.0:5050");

record WriteRequest(int Address, int Value);
record PlcConfigRequest(string? Ip, int Port, string? PlcType, string? Label, string? Source);
record PlcAddRequest(string? Id, string? Ip, int Port, string? PlcType, string? Label, bool? Enabled);

public class PlcRegistry
{
    private readonly ConcurrentDictionary<string, PlcService> _map = new();

    public PlcService? Get(string id) =>
        _map.TryGetValue(id, out var s) ? s : null;

    public PlcService GetOrCreateDefault() =>
        _map.GetOrAdd("default", _ => new PlcService
        {
            PlcIp = "192.168.1.238",
            PlcPort = 2004,
            PlcType = "LS",
            Label = "PLC-1"
        });

    public void AddOrUpdate(string id, PlcService svc) => _map[id] = svc;

    public void Remove(string id) => _map.TryRemove(id, out _);

    public IEnumerable<KeyValuePair<string, PlcService>> GetAll() => _map;
}

