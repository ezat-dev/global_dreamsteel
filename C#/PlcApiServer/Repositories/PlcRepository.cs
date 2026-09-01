using MySqlConnector;
using PlcApiServer.Models;

namespace PlcApiServer.Repositories;

public sealed class PlcRepository
{
    private readonly string _connStr;

    public PlcRepository(IConfiguration config)
    {
        _connStr = config.GetConnectionString("MariaDb") ?? "";
        if (string.IsNullOrWhiteSpace(_connStr))
            throw new InvalidOperationException("Missing ConnectionStrings:MariaDb");
    }

    public string ConnectionString => _connStr;

    public async Task<List<PlcConfigRow>> GetAllAsync()
    {
        var list = new List<PlcConfigRow>();
        using var conn = new MySqlConnection(_connStr);
        await conn.OpenAsync();
        using var cmd = new MySqlCommand(@"
SELECT plc_id, ip, port, plc_type, label, enabled
  FROM tb_plc
 ORDER BY plc_id", conn);
        using var rd = await cmd.ExecuteReaderAsync();
        while (await rd.ReadAsync())
        {
            list.Add(new PlcConfigRow(
                rd.GetString(0),
                rd.GetString(1),
                rd.GetInt32(2),
                rd.GetString(3),
                rd.GetString(4),
                rd.GetBoolean(5)
            ));
        }
        return list;
    }

    public async Task<PlcConfigRow?> GetByIdAsync(string id)
    {
        using var conn = new MySqlConnection(_connStr);
        await conn.OpenAsync();
        using var cmd = new MySqlCommand(@"
SELECT plc_id, ip, port, plc_type, label, enabled
  FROM tb_plc
 WHERE plc_id = @id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        using var rd = await cmd.ExecuteReaderAsync();
        if (!await rd.ReadAsync()) return null;
        return new PlcConfigRow(
            rd.GetString(0),
            rd.GetString(1),
            rd.GetInt32(2),
            rd.GetString(3),
            rd.GetString(4),
            rd.GetBoolean(5)
        );
    }

    public async Task<PlcConfigRow> AddOrUpdateAsync(PlcConfigRow cfg)
    {
        using var conn = new MySqlConnection(_connStr);
        await conn.OpenAsync();
        using var cmd = new MySqlCommand(@"
INSERT INTO tb_plc(plc_id, ip, port, plc_type, label, enabled)
VALUES (@id, @ip, @port, @type, @label, @enabled)
ON DUPLICATE KEY UPDATE
  ip = VALUES(ip),
  port = VALUES(port),
  plc_type = VALUES(plc_type),
  label = VALUES(label),
  enabled = VALUES(enabled)
", conn);
        cmd.Parameters.AddWithValue("@id", cfg.Id);
        cmd.Parameters.AddWithValue("@ip", cfg.Ip);
        cmd.Parameters.AddWithValue("@port", cfg.Port);
        cmd.Parameters.AddWithValue("@type", cfg.PlcType);
        cmd.Parameters.AddWithValue("@label", cfg.Label);
        cmd.Parameters.AddWithValue("@enabled", cfg.Enabled);
        await cmd.ExecuteNonQueryAsync();
        return cfg;
    }

    public async Task<bool> RemoveAsync(string id)
    {
        using var conn = new MySqlConnection(_connStr);
        await conn.OpenAsync();
        using var cmd = new MySqlCommand("DELETE FROM tb_plc WHERE plc_id=@id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        int n = await cmd.ExecuteNonQueryAsync();
        return n > 0;
    }
}
