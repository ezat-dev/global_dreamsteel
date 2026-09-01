namespace PlcApiServer.Models;

// Device: 미쓰비시일 때만 실제로 반영됨 (D/W/R 워드, M/L/X/Y/B 비트). 생략 시 서비스단 기본값(D/M) 사용.
public record WriteRequest(int Address, int Value, string? Device = null);
public record WriteBitRequest(int Address, bool Value, string? Device = null);
public record PlcConfigRequest(string? Ip, int Port, string? PlcType, string? Label);
public record PlcAddRequest(string? Id, string? Ip, int Port, string? PlcType, string? Label, bool? Enabled);
