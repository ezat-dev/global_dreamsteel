// ══════════════════════════════════════════════════════════════
//  PlcService.cs
//  지원: LS XGT (FEnet) / 미쓰비시 Q시리즈 (MC Protocol 3E) / Modbus TCP
// ══════════════════════════════════════════════════════════════

using System.Net.Sockets;
using System.Text;

public class PlcService
{
    // ── 런타임 설정 (API로 변경 가능) ───────────────────────
    public string PlcIp       { get; set; } = "192.168.1.238";
    public int    PlcPort     { get; set; } = 2004;
    public string PlcType     { get; set; } = "LS";   // "LS" | "MITSUBISHI" | "MODBUS_TCP"
    public string Label   { get; set; } = "";
    private int _invokeId = 1;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private const byte ModbusUnitId = 0x01;
    private const int ModbusMaxReadCount = 125;

    // ════════════════════════════════════════════════════════
    //  읽기
    // ════════════════════════════════════════════════════════
    public async Task<ushort[]> ReadWordsAsync(int startD, int count)
    {
        var type = (PlcType ?? "LS").ToUpperInvariant();
        if (type == "MITSUBISHI") return await MitsubishiReadWordsAsync(startD, count);
        if (type == "MODBUS_TCP") return await ModbusReadWordsAsync(startD, count);
        return await LsReadWordsAsync(startD, count);
    }

    // ════════════════════════════════════════════════════════
    //  쓰기
    // ════════════════════════════════════════════════════════
    public async Task WriteWordAsync(int dAddress, int value)
    {
        var type = (PlcType ?? "LS").ToUpperInvariant();
        if (type == "MITSUBISHI") { await MitsubishiWriteWordAsync(dAddress, value); return; }
        if (type == "MODBUS_TCP") { await ModbusWriteWordAsync(dAddress, value); return; }
        await LsWriteWordAsync(dAddress, value);
    }

    // ════════════════════════════════════════════════════════
    //  LS XGT — 읽기
    // ════════════════════════════════════════════════════════
    private async Task<ushort[]> LsReadWordsAsync(int startD, int count)
    {
        await _lock.WaitAsync();
        try
        {
            using var tcp = new TcpClient { ReceiveTimeout = 3000, SendTimeout = 3000 };
            await tcp.ConnectAsync(PlcIp, PlcPort);
            using var ns = tcp.GetStream();

            // Sub-cmd 0x0000 (Continuous Direct Variable Read) + %DW{word_addr} 포맷
            // Sub-cmd 0x0014 (Individual) 은 변수 하나씩 이름으로 읽는 방식으로
            // 뒤에 byte count 필드가 없어 복수 워드 읽기에 사용 불가.
            string device      = $"%DW{startD}";
            byte[] deviceAscii = Encoding.ASCII.GetBytes(device);
            ushort deviceLen   = (ushort)deviceAscii.Length;

            var body = new List<byte>();
            body.AddRange(new byte[] { 0x54, 0x00 });                    // Read command
            body.AddRange(new byte[] { 0x00, 0x00 });                    // Sub-cmd: Continuous (Direct Variable)
            body.AddRange(new byte[] { 0x00, 0x00 });                    // Reserved
            body.AddRange(BitConverter.GetBytes((ushort)0x0002));        // Data type: WORD
            body.AddRange(BitConverter.GetBytes((ushort)count));         // Word count
            body.AddRange(BitConverter.GetBytes(deviceLen));             // Variable name length
            body.AddRange(deviceAscii);                                  // Variable name

            int id = Interlocked.Increment(ref _invokeId) & 0xFFFF;
            byte[] packet = BuildFenetHeader(body.ToArray(), (ushort)id);

            await ns.WriteAsync(packet);

            byte[] hdr = new byte[20];
            await ReadFullAsync(ns, hdr);

            ushort bodyLen = BitConverter.ToUInt16(hdr, 16);
            if (bodyLen == 0) throw new Exception("PLC 응답 바디가 비어있습니다.");

            byte[] recvBody = new byte[bodyLen];
            await ReadFullAsync(ns, recvBody);

            return LsParseResponse(recvBody, (ushort)count);
        }
        finally { _lock.Release(); }
    }

    // ════════════════════════════════════════════════════════
    //  LS XGT — 쓰기
    // ════════════════════════════════════════════════════════
    private async Task LsWriteWordAsync(int dAddress, int value)
    {
        await _lock.WaitAsync();
        try
        {
            using var tcp = new TcpClient { ReceiveTimeout = 3000, SendTimeout = 3000 };
            await tcp.ConnectAsync(PlcIp, PlcPort);
            using var ns = tcp.GetStream();

            int    byteAddress = dAddress * 2;
            string device      = $"%DB{byteAddress}";
            byte[] deviceAscii = Encoding.ASCII.GetBytes(device);
            ushort deviceLen   = (ushort)deviceAscii.Length;
            byte[] valueBytes  = BitConverter.GetBytes((ushort)value);

            var body = new List<byte>();
            body.AddRange(new byte[] { 0x58, 0x00 });
            body.AddRange(new byte[] { 0x14, 0x00 });
            body.AddRange(new byte[] { 0x00, 0x00 });
            body.AddRange(new byte[] { 0x01, 0x00 });
            body.AddRange(BitConverter.GetBytes(deviceLen));
            body.AddRange(deviceAscii);
            body.AddRange(new byte[] { 0x02, 0x00 });
            body.AddRange(valueBytes);

            int id = Interlocked.Increment(ref _invokeId) & 0xFFFF;
            byte[] packet = BuildFenetHeader(body.ToArray(), (ushort)id);
            await ns.WriteAsync(packet);

            byte[] hdr = new byte[20];
            await ReadFullAsync(ns, hdr);

            ushort bodyLen = BitConverter.ToUInt16(hdr, 16);
            if (bodyLen > 0)
            {
                byte[] wBody = new byte[bodyLen];
                await ReadFullAsync(ns, wBody);
                ushort err = BitConverter.ToUInt16(wBody, 6);
                if (err != 0) throw new Exception($"PLC 쓰기 에러: 0x{err:X4}");
            }
        }
        finally { _lock.Release(); }
    }

    // ==============================================================
    //  Modbus TCP — 읽기 (Function 0x03, Holding Register)
    // ==============================================================
    private async Task<ushort[]> ModbusReadWordsAsync(int startAddress, int count)
    {
        if (startAddress < 0 || startAddress > 65535)
            throw new Exception("Modbus 시작 주소 범위 오류 (0~65535)");
        if (count < 1)
            throw new Exception("Modbus 읽기 개수는 1 이상이어야 합니다.");
        if (startAddress + count - 1 > 65535)
            throw new Exception("Modbus 읽기 주소 범위를 초과했습니다.");

        await _lock.WaitAsync();
        try
        {
            using var tcp = new TcpClient { ReceiveTimeout = 3000, SendTimeout = 3000 };
            await tcp.ConnectAsync(PlcIp, PlcPort);
            using var ns = tcp.GetStream();

            var values = new List<ushort>(count);
            int remain = count;
            int curAddress = startAddress;

            while (remain > 0)
            {
                int chunkCount = Math.Min(remain, ModbusMaxReadCount);
                ushort txId = (ushort)(Interlocked.Increment(ref _invokeId) & 0xFFFF);
                byte[] req = BuildModbusReadRequest(txId, (ushort)curAddress, (ushort)chunkCount);
                await ns.WriteAsync(req);

                byte[] pdu = await ReadModbusPduAsync(ns, txId);
                if (pdu.Length < 2)
                    throw new Exception("Modbus READ 응답 길이가 비정상입니다.");

                byte functionCode = pdu[0];
                if ((functionCode & 0x80) != 0)
                {
                    byte ex = pdu.Length > 1 ? pdu[1] : (byte)0;
                    throw new Exception($"Modbus READ 예외 코드: 0x{ex:X2}");
                }
                if (functionCode != 0x03)
                    throw new Exception($"Modbus READ 기능 코드 오류: 0x{functionCode:X2}");

                int byteCount = pdu[1];
                if (byteCount != chunkCount * 2)
                    throw new Exception($"Modbus READ 데이터 길이 오류: {byteCount}");
                if (pdu.Length < 2 + byteCount)
                    throw new Exception("Modbus READ 데이터가 잘렸습니다.");

                for (int i = 0; i < byteCount; i += 2)
                    values.Add(ReadUInt16BE(pdu, 2 + i));

                curAddress += chunkCount;
                remain -= chunkCount;
            }

            return values.ToArray();
        }
        finally { _lock.Release(); }
    }

    // ==============================================================
    //  Modbus TCP — 쓰기 (Function 0x06, Single Register)
    // ==============================================================
    private async Task ModbusWriteWordAsync(int address, int value)
    {
        if (address < 0 || address > 65535)
            throw new Exception("Modbus 주소 범위 오류 (0~65535)");
        if (value < 0 || value > 65535)
            throw new Exception("Modbus 값 범위 오류 (0~65535)");

        await _lock.WaitAsync();
        try
        {
            using var tcp = new TcpClient { ReceiveTimeout = 3000, SendTimeout = 3000 };
            await tcp.ConnectAsync(PlcIp, PlcPort);
            using var ns = tcp.GetStream();

            ushort txId = (ushort)(Interlocked.Increment(ref _invokeId) & 0xFFFF);
            byte[] req = BuildModbusWriteRequest(txId, (ushort)address, (ushort)value);
            await ns.WriteAsync(req);

            byte[] pdu = await ReadModbusPduAsync(ns, txId);
            byte functionCode = pdu.Length > 0 ? pdu[0] : (byte)0;

            // Exception 응답: [function|0x80, exceptionCode]
            if ((functionCode & 0x80) != 0)
            {
                byte ex = pdu.Length > 1 ? pdu[1] : (byte)0;

                // 일부 장비는 FC06을 막고 FC10만 허용
                if (ex == 0x01)
                {
                    ushort txId2 = (ushort)(Interlocked.Increment(ref _invokeId) & 0xFFFF);
                    byte[] req10 = BuildModbusWriteMultipleRequest(txId2, (ushort)address, (ushort)value);
                    await ns.WriteAsync(req10);

                    byte[] pdu10 = await ReadModbusPduAsync(ns, txId2);
                    byte functionCode10 = pdu10.Length > 0 ? pdu10[0] : (byte)0;
                    if ((functionCode10 & 0x80) != 0)
                    {
                        byte ex10 = pdu10.Length > 1 ? pdu10[1] : (byte)0;
                        throw new Exception($"Modbus WRITE exception: 0x{ex10:X2} ({GetModbusExceptionText(ex10)})");
                    }
                    if (pdu10.Length < 5 || functionCode10 != 0x10)
                        throw new Exception("Modbus WRITE (FC10) invalid response");

                    ushort respAddress10 = ReadUInt16BE(pdu10, 1);
                    ushort respQty10 = ReadUInt16BE(pdu10, 3);
                    if (respAddress10 != (ushort)address || respQty10 != 1)
                        throw new Exception("Modbus WRITE (FC10) echo validation failed");
                    return;
                }

                throw new Exception($"Modbus WRITE exception: 0x{ex:X2} ({GetModbusExceptionText(ex)})");
            }

            if (pdu.Length < 5)
                throw new Exception("Modbus WRITE invalid response length");
            if (functionCode != 0x06)
                throw new Exception($"Modbus WRITE function mismatch: 0x{functionCode:X2}");

            ushort respAddress = ReadUInt16BE(pdu, 1);
            ushort respValue = ReadUInt16BE(pdu, 3);
            if (respAddress != (ushort)address || respValue != (ushort)value)
                throw new Exception("Modbus WRITE echo validation failed");
        }
        finally { _lock.Release(); }
    }

    // ════════════════════════════════════════════════════════
    //  미쓰비시 Q시리즈 — 읽기 (MC Protocol 3E Binary)
    //
    //  요청 프레임 구조:
    //    [0~1]  서브헤더      : 0x50 0x00
    //    [2]    네트워크번호  : 0x00
    //    [3]    PC번호        : 0xFF
    //    [4~5]  요청처 모듈  : 0xFF 0x03
    //    [6]    요청처 I/O   : 0x00
    //    [7~8]  데이터길이   : (이후 바이트 수)
    //    [9~10] CPU감시타이머: 0x10 0x00  (4000ms)
    //    [11~12] 커맨드       : 0x01 0x04 (Word Read)
    //    [13~14] 서브커맨드   : 0x00 0x00 (워드 단위)
    //    [15~18] 시작디바이스: (주소 3바이트 + 디바이스코드 1바이트)
    //    [19~20] 읽을점수    : (ushort)
    // ════════════════════════════════════════════════════════
    private async Task<ushort[]> MitsubishiReadWordsAsync(int startD, int count)
    {
        await _lock.WaitAsync();
        try
        {
            using var tcp = new TcpClient { ReceiveTimeout = 3000, SendTimeout = 3000 };
            await tcp.ConnectAsync(PlcIp, PlcPort);
            using var ns = tcp.GetStream();

            byte[] packet = BuildMcReadPacket(startD, count);
            await ns.WriteAsync(packet);

            // 응답 헤더 11바이트 수신 (서브헤더2 + 네트2 + PC1 + 모듈IO2 + 모듈Station1 + 데이터길이2 + 종료코드2)
            byte[] respHdr = new byte[11];
            await ReadFullAsync(ns, respHdr);

            ushort endCode  = BitConverter.ToUInt16(respHdr, 9);
            ushort dataLen  = BitConverter.ToUInt16(respHdr, 7);
            int    bodyLen  = dataLen - 2;  // 종료코드 2바이트 제외

            if (endCode != 0)
                throw new Exception($"미쓰비시 READ 에러코드: 0x{endCode:X4}");

            if (bodyLen <= 0)
                return new ushort[0];

            byte[] data = new byte[bodyLen];
            await ReadFullAsync(ns, data);

            // Word 단위 파싱 (Little Endian)
            var result = new List<ushort>();
            for (int i = 0; i + 1 < data.Length && result.Count < count; i += 2)
                result.Add(BitConverter.ToUInt16(data, i));

            return result.ToArray();
        }
        finally { _lock.Release(); }
    }

    // ════════════════════════════════════════════════════════
    //  미쓰비시 Q시리즈 — 쓰기 (MC Protocol 3E Binary)
    //
    //  커맨드: 0x01 0x14 (Word Write), 서브커맨드: 0x00 0x00
    // ════════════════════════════════════════════════════════
    private async Task MitsubishiWriteWordAsync(int dAddress, int value)
    {
        await _lock.WaitAsync();
        try
        {
            using var tcp = new TcpClient { ReceiveTimeout = 3000, SendTimeout = 3000 };
            await tcp.ConnectAsync(PlcIp, PlcPort);
            using var ns = tcp.GetStream();

            byte[] packet = BuildMcWritePacket(dAddress, (ushort)value);
            await ns.WriteAsync(packet);

            byte[] respHdr = new byte[11];
            await ReadFullAsync(ns, respHdr);

            ushort endCode = BitConverter.ToUInt16(respHdr, 9);
            if (endCode != 0)
                throw new Exception($"미쓰비시 WRITE 에러코드: 0x{endCode:X4}");
        }
        finally { _lock.Release(); }
    }

    // ════════════════════════════════════════════════════════
    //  미쓰비시 패킷 빌더
    // ════════════════════════════════════════════════════════

    /// <summary>
    /// D디바이스 Word 읽기 패킷 (3E Binary)
    /// </summary>
    private static byte[] BuildMcReadPacket(int startD, int count)
    {
        // 커맨드 이후 데이터 (커맨드2 + 서브커맨드2 + 디바이스주소3 + 디바이스코드1 + 점수2 = 10바이트)
        var commandData = new List<byte>();
        commandData.AddRange(new byte[] { 0x01, 0x04 });   // Read Word
        commandData.AddRange(new byte[] { 0x00, 0x00 });   // Subcommand (Word 단위)
        // D디바이스 주소: 3바이트 Little Endian
        commandData.Add((byte)(startD & 0xFF));
        commandData.Add((byte)((startD >> 8) & 0xFF));
        commandData.Add((byte)((startD >> 16) &
         0xFF));
        commandData.Add(0xA8);                             // D디바이스 코드 (Q/L: 0xA8)
        commandData.AddRange(BitConverter.GetBytes((ushort)count));

        return BuildMcHeader(commandData.ToArray());
    }

    /// <summary>
    /// D디바이스 Word 쓰기 패킷 (3E Binary, 1점)
    /// </summary>
    private static byte[] BuildMcWritePacket(int dAddress, ushort value)
    {
        var commandData = new List<byte>();
        commandData.AddRange(new byte[] { 0x01, 0x14 });   // Write Word
        commandData.AddRange(new byte[] { 0x00, 0x00 });   // Subcommand
        commandData.Add((byte)(dAddress & 0xFF));
        commandData.Add((byte)((dAddress >> 8) & 0xFF));
        commandData.Add((byte)((dAddress >> 16) & 0xFF));
        commandData.Add(0xA8);                             // D디바이스 코드
        commandData.AddRange(new byte[] { 0x01, 0x00 });   // 1점
        commandData.AddRange(BitConverter.GetBytes(value));// 데이터

        return BuildMcHeader(commandData.ToArray());
    }

    /// <summary>
    /// MC Protocol 3E 공통 헤더 조립
    /// 데이터길이 = 감시타이머(2) + commandData.Length
    /// </summary>
    private static byte[] BuildMcHeader(byte[] commandData)
    {
        ushort dataLength = (ushort)(2 + commandData.Length); // 감시타이머 포함

        var pkt = new List<byte>();
        pkt.AddRange(new byte[] { 0x50, 0x00 });          // 서브헤더 (3E)
        pkt.Add(0x00);                                     // 네트워크번호
        pkt.Add(0xFF);                                     // PC번호
        pkt.AddRange(new byte[] { 0xFF, 0x03 });           // 요청처 모듈 I/O
        pkt.Add(0x00);                                     // 요청처 스테이션
        pkt.AddRange(BitConverter.GetBytes(dataLength));   // 데이터 길이
        pkt.AddRange(new byte[] { 0x10, 0x00 });           // 감시 타이머 (4000ms)
        pkt.AddRange(commandData);

        return pkt.ToArray();
    }

    private static byte[] BuildModbusReadRequest(ushort txId, ushort startAddress, ushort count)
    {
        var req = new byte[12];
        WriteUInt16BE(req, 0, txId);
        WriteUInt16BE(req, 2, 0x0000); // protocol id
        WriteUInt16BE(req, 4, 0x0006); // unit(1) + pdu(5)
        req[6] = ModbusUnitId;
        req[7] = 0x03;
        WriteUInt16BE(req, 8, startAddress);
        WriteUInt16BE(req, 10, count);
        return req;
    }

    private static byte[] BuildModbusWriteRequest(ushort txId, ushort address, ushort value)
    {
        var req = new byte[12];
        WriteUInt16BE(req, 0, txId);
        WriteUInt16BE(req, 2, 0x0000); // protocol id
        WriteUInt16BE(req, 4, 0x0006); // unit(1) + pdu(5)
        req[6] = ModbusUnitId;
        req[7] = 0x06;
        WriteUInt16BE(req, 8, address);
        WriteUInt16BE(req, 10, value);
        return req;
    }

    private static byte[] BuildModbusWriteMultipleRequest(ushort txId, ushort address, ushort value)
    {
        // MBAP length = unit(1) + pdu(8)
        // PDU = fc(1) + address(2) + quantity(2) + byteCount(1) + data(2)
        var req = new byte[15];
        WriteUInt16BE(req, 0, txId);
        WriteUInt16BE(req, 2, 0x0000); // protocol id
        WriteUInt16BE(req, 4, 0x0009); // unit(1) + pdu(8)
        req[6] = ModbusUnitId;
        req[7] = 0x10;
        WriteUInt16BE(req, 8, address);
        WriteUInt16BE(req, 10, 0x0001); // quantity
        req[12] = 0x02;                 // byte count
        WriteUInt16BE(req, 13, value);
        return req;
    }

    private static async Task<byte[]> ReadModbusPduAsync(NetworkStream ns, ushort expectedTxId)
    {
        var mbap = new byte[7];
        await ReadFullAsync(ns, mbap);

        ushort txId = ReadUInt16BE(mbap, 0);
        ushort protocolId = ReadUInt16BE(mbap, 2);
        ushort length = ReadUInt16BE(mbap, 4);
        if (txId != expectedTxId)
            throw new Exception($"Modbus 트랜잭션 불일치: expected={expectedTxId}, recv={txId}");
        if (protocolId != 0)
            throw new Exception($"Modbus 프로토콜 ID 오류: {protocolId}");
        if (length < 2)
            throw new Exception("Modbus 길이 필드가 비정상입니다.");

        int pduLength = length - 1; // length = unitId + pdu
        var pdu = new byte[pduLength];
        await ReadFullAsync(ns, pdu);
        return pdu;
    }

    private static ushort ReadUInt16BE(byte[] data, int offset) =>
        (ushort)((data[offset] << 8) | data[offset + 1]);

    private static void WriteUInt16BE(byte[] data, int offset, ushort value)
    {
        data[offset] = (byte)(value >> 8);
        data[offset + 1] = (byte)(value & 0xFF);
    }

    private static string GetModbusExceptionText(byte exCode)
    {
        return exCode switch
        {
            0x01 => "Illegal Function",
            0x02 => "Illegal Data Address",
            0x03 => "Illegal Data Value",
            0x04 => "Slave Device Failure",
            0x05 => "Acknowledge",
            0x06 => "Slave Device Busy",
            0x08 => "Memory Parity Error",
            0x0A => "Gateway Path Unavailable",
            0x0B => "Gateway Target Device Failed To Respond",
            _ => "Unknown Exception"
        };
    }

    // ════════════════════════════════════════════════════════
    //  LS 공용 헬퍼
    // ════════════════════════════════════════════════════════
    private static ushort[] LsParseResponse(byte[] body, ushort requestedWordCount)
    {
        if (body.Length < 8)  throw new Exception($"응답 바디가 너무 짧습니다. ({body.Length}바이트)");
        ushort errCode = BitConverter.ToUInt16(body, 6);
        if (errCode != 0) throw new Exception($"PLC READ 에러: 0x{errCode:X4}");
        if (body.Length < 12) throw new Exception($"응답 바디 부족: {body.Length}바이트 (최소 12 필요)");

        ushort actualByteCount = BitConverter.ToUInt16(body, 10);
        int dataOffset = body.Length - actualByteCount;

        var values = new List<ushort>();
        for (int i = 0; i < requestedWordCount; i++)
        {
            int off = dataOffset + (i * 2);
            if (off + 1 < body.Length)
                values.Add(BitConverter.ToUInt16(body, off));
        }
        return values.ToArray();
    }

    private static byte[] BuildFenetHeader(byte[] body, ushort id)
    {
        byte[] pkt = new byte[20 + body.Length];
        Encoding.ASCII.GetBytes("LSIS-XGT").CopyTo(pkt, 0);
        pkt[12] = 0xB0; pkt[13] = 0x33;
        pkt[14] = (byte)(id & 0xFF);
        pkt[15] = (byte)((id >> 8) & 0xFF);
        pkt[16] = (byte)(body.Length & 0xFF);
        pkt[17] = (byte)(body.Length >> 8);
        body.CopyTo(pkt, 20);
        return pkt;
    }

    private static async Task ReadFullAsync(NetworkStream ns, byte[] buf)
    {
        int offset = 0;
        while (offset < buf.Length)
        {
            int n = await ns.ReadAsync(buf, offset, buf.Length - offset);
            if (n == 0) throw new Exception("PLC 연결 종료");
            offset += n;
        }
    }
}
