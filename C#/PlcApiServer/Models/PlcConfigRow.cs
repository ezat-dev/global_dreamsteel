namespace PlcApiServer.Models;

public record PlcConfigRow(string Id, string Ip, int Port, string PlcType, string Label, bool Enabled);
