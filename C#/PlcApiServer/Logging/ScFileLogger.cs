namespace PlcApiServer.Logging;

/// <summary>
/// D:\SC_LOG\YYYYMMDD.log 에 스타트/무브/엔드 신호 로그를 기록한다.
/// </summary>
public static class ScFileLogger
{
    private static readonly string LogDir = @"D:\SC_LOG";
    private static readonly object _lock  = new();

    /// <param name="tag">START / MOVE / END</param>
    /// <param name="message">한 줄 메시지</param>
    public static void Write(string tag, string message)
    {
        try
        {
            Directory.CreateDirectory(LogDir);
            var now      = DateTime.Now;
            var filePath = Path.Combine(LogDir, now.ToString("yyyyMMdd") + ".log");
            var line     = $"{now:yyyy-MM-dd HH:mm:ss} [{tag,-5}] {message}{Environment.NewLine}";
            lock (_lock)
                File.AppendAllText(filePath, line, System.Text.Encoding.UTF8);
        }
        catch { /* 로그 실패는 서비스 동작에 영향 없이 무시 */ }
    }
}
