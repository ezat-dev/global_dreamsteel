namespace PlcApiServer.Models;

public sealed class AlarmTagRow
{
    public int TagId { get; set; }
    public string Address { get; set; } = "";
    public string DeviceType { get; set; } = "D";   // 파싱 후 채워짐
    public int AddressValue { get; set; }            // 파싱 후 채워짐
    public PlcConfigRow Plc { get; set; } = null!;
}
