// ============================================================================
// PlcService.Modbus.cs  (partial class — Modbus TCP 프로토콜 구현)
// ============================================================================
// [파일 역할]
//   PlcService의 PlcType == "MODBUS_TCP" 일 때 실제로 패킷을 만들고 파싱하는 부분.
//   또한 Program.cs의 /api/plc/readRaw/{id} 가 쓰는 ReadWordsRawFc3Async(주소 변환 없는 FC03)도
//   여기에 있다 — 이건 PlcType과 무관하게 호출될 수 있지만, 내부적으로 Modbus 패킷 형식을
//   그대로 사용하기 때문에 이 파일에 함께 둔다.
//
//   Modbus 표준 주소 체계 (1-based, 사람이 보는 주소):
//     0x  (0~9999)      : Coil                — FC01(읽기)/FC05(쓰기), 비트
//     1x  (10001~19999) : Coil                — FC01(읽기)/FC05(쓰기), 비트
//     2x  (20001~29999) : Discrete Input      — FC02(읽기 전용), 비트
//     3x  (30001~39999) : Input Register      — FC04(읽기 전용), 워드
//     4x  (40001~49999) : Holding Register    — FC03(읽기)/FC06,FC10(쓰기), 워드
//   실제 와이어(wire) 프로토콜에는 0-based 오프셋만 실리므로, Resolve*Address 메서드들이
//   "사람이 쓰는 주소(예: 40001)" → "wire address(예: 0)"로 변환하는 역할을 한다.
//
// [처리 흐름 — 웹 요청이 여기까지 오는 경로]
//   웹 → 5050 → Program.cs 핸들러 → PlcService.ReadWordsAsync/WriteWordAsync/ReadBitsAsync/
//     WriteBitAsync (PlcService.cs) → PlcType이 "MODBUS_TCP"이면 이 파일의
//     ModbusReadWordsAsync/ModbusWriteWordAsync/ModbusReadBitsAsync/ModbusWriteBitAsync 호출
//     → Resolve*Address로 주소를 해석(영역·function code 판별) →
//       WithConnectionAsync(PlcService.cs)로 TCP 연결을 확보한 뒤 MBAP 헤더 + PDU를 조립해 전송
//     → ReadModbusPduAsync로 응답을 받아 파싱 → 결과(ushort[]/bool[])가 그대로
//       PlcService.cs → Program.cs로 돌아가 JSON 응답이 된다.
//   ※ 여기서 DB(MariaDB)는 전혀 관여하지 않는다. 순수하게 TCP 바이트 스트림 조립/파싱만 한다.
// ============================================================================

using System.Net.Sockets;

namespace PlcApiServer.Services;

public partial class PlcService
{
    private const byte ModbusUnitId = 0x01;
    private const int ModbusMaxReadCount = 125;      // register read max — FC03/04 한 번에 읽을 수 있는 최대 워드 수(표준 규격)
    private const int ModbusMaxBitReadCount = 2000;  // bit read max — FC01/02 한 번에 읽을 수 있는 최대 비트 수(표준 규격)

    //  읽기 - WORD (FC03 raw) — Modbus 주소 해석 없이 wire address를 그대로 FC03으로 읽음
    //  PLC가 0-based holding register 주소를 사용할 때 (예: BCF_6 시간 레지스터 addr 2~48)
    //  Program.cs의 /api/plc/readRaw/{id} 에서 호출되며, 40001을 빼는 등의 표준 주소 변환을 건너뛴다.
    public async Task<ushort[]> ReadWordsRawFc3Async(int wireStart, int count)
    {
        return await WithConnectionAsync(async ns =>
        {
            var values = new List<ushort>(count);
            int remain = count;
            int curWire = wireStart;
            while (remain > 0)
            {
                // 표준 최대치(125워드)를 넘으면 여러 번 나눠서 읽는다
                int chunk = Math.Min(remain, ModbusMaxReadCount);
                ushort txId = (ushort)(Interlocked.Increment(ref _invokeId) & 0xFF);
                byte[] req = BuildModbusReadRequest(txId, 0x03, (ushort)curWire, (ushort)chunk);
                await ns.WriteAsync(req);
                byte[] pdu = await ReadModbusPduAsync(ns, txId);
                if (pdu.Length < 2) throw new Exception($"FC03 Raw READ 응답 짧음 [wire={curWire}]");
                byte recvFc = pdu[0];
                if ((recvFc & 0x80) != 0)   // 최상위 비트가 서면 예외 응답
                {
                    byte ex = pdu.Length > 1 ? pdu[1] : (byte)0;
                    throw new Exception($"FC03 Raw exception 0x{ex:X2} [wire={curWire}]");
                }
                int byteCount = pdu[1];
                for (int i = 0; i < byteCount; i += 2)
                    values.Add(ReadUInt16BE(pdu, 2 + i));
                curWire += chunk;
                remain  -= chunk;
            }
            return values.ToArray();
        });
    }

    //  Modbus TCP — WORD 읽기 (FC03 / FC04)
    //  0x(코일) / 1x / 2x 비트 영역이 들어오면 내부적으로 비트 읽기 후 0/1 ushort[]로 변환
    //  (AlarmMonitorService/TempMonitorService처럼 device 구분 없이 항상 ReadWordsAsync만 호출하는
    //   쪽에서도 비트 태그를 0/1 워드값처럼 다룰 수 있도록 하기 위함)
    private async Task<ushort[]> ModbusReadWordsAsync(int startAddress, int count)
    {
        var resolved = ResolveModbusReadAddress(startAddress, count);

        // 비트 영역 → ModbusReadBitsAsync로 읽고 0/1 변환 (락 진입 전에 처리)
        if (resolved.IsBit)
        {
            bool[] bits = await ModbusReadBitsAsync(startAddress, count);
            var converted = new ushort[bits.Length];
            for (int i = 0; i < bits.Length; i++)
                converted[i] = bits[i] ? (ushort)1 : (ushort)0;
            return converted;
        }

        byte functionCode = resolved.FunctionCode;
        string area = resolved.AreaName;

        return await WithConnectionAsync(async ns =>
        {
            var values = new List<ushort>(count);
            int remain = count;
            int curWireAddress = resolved.WireStart;

            while (remain > 0)
            {
                int chunkCount = Math.Min(remain, ModbusMaxReadCount);
                ushort txId = (ushort)(Interlocked.Increment(ref _invokeId) & 0xFF);
                byte[] req = BuildModbusReadRequest(txId, functionCode, (ushort)curWireAddress, (ushort)chunkCount);
                await ns.WriteAsync(req);

                byte[] pdu = await ReadModbusPduAsync(ns, txId);
                if (pdu.Length < 2)
                    throw new Exception($"Modbus READ 응답 길이 비정상 [input={startAddress}, wire={curWireAddress}, area={area}]");

                byte recvFunctionCode = pdu[0];
                if ((recvFunctionCode & 0x80) != 0)
                {
                    byte ex = pdu.Length > 1 ? pdu[1] : (byte)0;
                    throw new Exception($"Modbus READ exception: 0x{ex:X2} ({GetModbusExceptionText(ex)}) [input={startAddress}, wire={curWireAddress}, area={area}, fc=0x{functionCode:X2}]");
                }
                if (recvFunctionCode != functionCode)
                    throw new Exception($"Modbus READ function mismatch: recv=0x{recvFunctionCode:X2}, expect=0x{functionCode:X2} [input={startAddress}, area={area}]");

                int byteCount = pdu[1];
                if (byteCount != chunkCount * 2)
                    throw new Exception($"Modbus READ 데이터 길이 오류: {byteCount} [chunkCount={chunkCount}]");
                if (pdu.Length < 2 + byteCount)
                    throw new Exception("Modbus READ 데이터가 잘렸습니다.");

                for (int i = 0; i < byteCount; i += 2)
                    values.Add(ReadUInt16BE(pdu, 2 + i));

                curWireAddress += chunkCount;
                remain -= chunkCount;
            }

            return values.ToArray();
        });
    }

    //  Modbus TCP — BIT 읽기 (FC01 / FC02)
    private async Task<bool[]> ModbusReadBitsAsync(int startAddress, int count)
    {
        var resolved = ResolveModbusReadAddress(startAddress, count);

        if (!resolved.IsBit)
            throw new Exception($"Modbus {resolved.AreaName} 영역은 word 읽기 대상입니다. ReadWordsAsync를 사용하세요.");

        byte functionCode = resolved.FunctionCode;
        string area = resolved.AreaName;

        return await WithConnectionAsync(async ns =>
        {
            var values = new List<bool>(count);
            int remain = count;
            int curWireAddress = resolved.WireStart;

            while (remain > 0)
            {
                int chunkCount = Math.Min(remain, ModbusMaxBitReadCount);
                ushort txId = (ushort)(Interlocked.Increment(ref _invokeId) & 0xFF);
                byte[] req = BuildModbusReadRequest(txId, functionCode, (ushort)curWireAddress, (ushort)chunkCount);
                await ns.WriteAsync(req);

                byte[] pdu = await ReadModbusPduAsync(ns, txId);
                if (pdu.Length < 2)
                    throw new Exception($"Modbus BIT READ 응답 길이 비정상 [input={startAddress}, wire={curWireAddress}, area={area}]");

                byte recvFunctionCode = pdu[0];
                if ((recvFunctionCode & 0x80) != 0)
                {
                    byte ex = pdu.Length > 1 ? pdu[1] : (byte)0;
                    throw new Exception($"Modbus BIT READ exception: 0x{ex:X2} ({GetModbusExceptionText(ex)}) [input={startAddress}, wire={curWireAddress}, area={area}, fc=0x{functionCode:X2}]");
                }
                if (recvFunctionCode != functionCode)
                    throw new Exception($"Modbus BIT READ function mismatch: recv=0x{recvFunctionCode:X2}, expect=0x{functionCode:X2} [input={startAddress}, area={area}]");

                int byteCount = pdu[1];
                if (pdu.Length < 2 + byteCount)
                    throw new Exception("Modbus BIT READ 데이터가 잘렸습니다.");

                // 응답은 비트가 바이트 안에 LSB부터 순서대로 패킹되어 있음
                for (int bitIndex = 0; bitIndex < chunkCount; bitIndex++)
                {
                    int byteIndex = bitIndex / 8;
                    int bitOffset = bitIndex % 8;
                    bool bitValue = (pdu[2 + byteIndex] & (1 << bitOffset)) != 0;
                    values.Add(bitValue);
                }

                curWireAddress += chunkCount;
                remain -= chunkCount;
            }

            return values.ToArray();
        });
    }

    //  Modbus TCP — WORD 쓰기 (FC06, 일부 장비 FC10 fallback)
    //  일부 장비는 FC06(단일 레지스터 쓰기)을 "Illegal Function"으로 거부하고 FC10(복수 레지스터
    //  쓰기, 개수=1)만 지원하는 경우가 있어, FC06이 실패(exception 0x01)하면 FC10으로 재시도한다.
    private async Task ModbusWriteWordAsync(int address, int value)
    {
        var resolved = ResolveModbusWordWriteAddress(address);
        ushort wireAddress = resolved.WireAddress;
        string area = resolved.AreaName;

        if (value < 0 || value > 65535)
            throw new Exception("Modbus 값 범위 오류 (0~65535)");

        await WithConnectionAsync(async ns =>
        {
            ushort txId = (ushort)(Interlocked.Increment(ref _invokeId) & 0xFF);
            byte[] req = BuildModbusWriteRequest(txId, wireAddress, (ushort)value);
            await ns.WriteAsync(req);

            byte[] pdu = await ReadModbusPduAsync(ns, txId);
            byte functionCode = pdu.Length > 0 ? pdu[0] : (byte)0;

            if ((functionCode & 0x80) != 0)
            {
                byte ex = pdu.Length > 1 ? pdu[1] : (byte)0;

                if (ex == 0x01)   // Illegal Function → FC10(복수 쓰기, 개수 1)으로 폴백
                {
                    ushort txId2 = (ushort)(Interlocked.Increment(ref _invokeId) & 0xFF);
                    byte[] req10 = BuildModbusWriteMultipleRequest(txId2, wireAddress, (ushort)value);
                    await ns.WriteAsync(req10);

                    byte[] pdu10 = await ReadModbusPduAsync(ns, txId2);
                    byte functionCode10 = pdu10.Length > 0 ? pdu10[0] : (byte)0;
                    if ((functionCode10 & 0x80) != 0)
                    {
                        byte ex10 = pdu10.Length > 1 ? pdu10[1] : (byte)0;
                        throw new Exception($"Modbus WRITE exception: 0x{ex10:X2} ({GetModbusExceptionText(ex10)}) [input={address}, wire={wireAddress}, area={area}]");
                    }
                    if (pdu10.Length < 5 || functionCode10 != 0x10)
                        throw new Exception($"Modbus WRITE (FC10) invalid response [input={address}, wire={wireAddress}, area={area}]");

                    ushort respAddress10 = ReadUInt16BE(pdu10, 1);
                    ushort respQty10 = ReadUInt16BE(pdu10, 3);
                    if (respAddress10 != wireAddress || respQty10 != 1)
                        throw new Exception($"Modbus WRITE (FC10) echo validation failed [input={address}, wire={wireAddress}, area={area}]");
                    return;
                }

                throw new Exception($"Modbus WRITE exception: 0x{ex:X2} ({GetModbusExceptionText(ex)}) [input={address}, wire={wireAddress}, area={area}]");
            }

            if (pdu.Length < 5)
                throw new Exception($"Modbus WRITE invalid response length [input={address}, wire={wireAddress}, area={area}]");
            if (functionCode != 0x06)
                throw new Exception($"Modbus WRITE function mismatch: 0x{functionCode:X2} [input={address}, wire={wireAddress}, area={area}]");

            // FC06 응답은 요청을 그대로 echo하므로, 주소/값이 요청과 같은지 확인해 쓰기 성공을 검증
            ushort respAddress = ReadUInt16BE(pdu, 1);
            ushort respValue = ReadUInt16BE(pdu, 3);
            if (respAddress != wireAddress || respValue != (ushort)value)
                throw new Exception($"Modbus WRITE echo validation failed [input={address}, wire={wireAddress}, area={area}]");
        });
    }

    //  Modbus TCP — BIT 쓰기 (FC05, Coil only)
    private async Task ModbusWriteBitAsync(int address, bool value)
    {
        var resolved = ResolveModbusBitWriteAddress(address);
        ushort wireAddress = resolved.WireAddress;
        string area = resolved.AreaName;

        await WithConnectionAsync(async ns =>
        {
            ushort txId = (ushort)(Interlocked.Increment(ref _invokeId) & 0xFF);
            byte[] req = BuildModbusWriteSingleCoilRequest(txId, wireAddress, value);
            await ns.WriteAsync(req);

            byte[] pdu = await ReadModbusPduAsync(ns, txId);
            byte functionCode = pdu.Length > 0 ? pdu[0] : (byte)0;

            if ((functionCode & 0x80) != 0)
            {
                byte ex = pdu.Length > 1 ? pdu[1] : (byte)0;
                throw new Exception($"Modbus BIT WRITE exception: 0x{ex:X2} ({GetModbusExceptionText(ex)}) [input={address}, wire={wireAddress}, area={area}]");
            }

            if (pdu.Length < 5)
                throw new Exception($"Modbus BIT WRITE invalid response length [input={address}, wire={wireAddress}, area={area}]");
            if (functionCode != 0x05)
                throw new Exception($"Modbus BIT WRITE function mismatch: 0x{functionCode:X2} [input={address}, wire={wireAddress}, area={area}]");

            // FC05 응답도 echo 방식 — 코일 ON은 0xFF00, OFF는 0x0000으로 되돌아온다
            ushort respAddress = ReadUInt16BE(pdu, 1);
            ushort respValue = ReadUInt16BE(pdu, 3);
            ushort expectedValue = value ? (ushort)0xFF00 : (ushort)0x0000;

            if (respAddress != wireAddress || respValue != expectedValue)
                throw new Exception($"Modbus BIT WRITE echo validation failed [input={address}, wire={wireAddress}, area={area}]");
        });
    }

    //  Modbus 주소 해석 (표준 1-based 주소 표기 → wire address 변환)
    //  10001 -> wire 0
    //  20001 -> wire 0
    //  30001 -> wire 0
    //  40001 -> wire 0
    private static (int WireStart, byte FunctionCode, string AreaName, bool IsBit) ResolveModbusReadAddress(int startAddress, int count)
    {
        if (count < 1)
            throw new Exception("Modbus 읽기 개수는 1 이상이어야 합니다.");

        long endAddress = (long)startAddress + count - 1;

        // 표준 주소 범위
        if (startAddress >= 40001 && startAddress <= 49999)
        {
            if (endAddress > 49999)
                throw new Exception("Modbus 4x 영역 범위를 초과했습니다. (예: 40001~49999)");
            return (startAddress - 40001, 0x03, "4x(Holding Register)", false);
        }

        if (startAddress >= 30001 && startAddress <= 39999)
        {
            if (endAddress > 39999)
                throw new Exception("Modbus 3x 영역 범위를 초과했습니다. (예: 30001~39999)");
            return (startAddress - 30001, 0x04, "3x(Input Register)", false);
        }

        if (startAddress >= 20001 && startAddress <= 29999)
        {
            if (endAddress > 29999)
                throw new Exception("Modbus 2x 영역 범위를 초과했습니다. (예: 20001~29999)");
            return (startAddress - 20001, 0x02, "2x(Discrete Input)", true);
        }

        if (startAddress >= 10001 && startAddress <= 19999)
        {
            if (endAddress > 19999)
                throw new Exception("Modbus 1x 영역 범위를 초과했습니다. (예: 10001~19999)");
            return (startAddress - 10001, 0x01, "1x(Coil)", true);
        }

        // 0x 코일 영역 (0~9999) → FC01 비트 읽기
        if (startAddress >= 0 && startAddress <= 9999)
        {
            if (endAddress > 9999)
                throw new Exception("Modbus 0x 영역 범위를 초과했습니다. (예: 0~9999)");
            return (startAddress > 0 ? startAddress - 1 : 0, 0x01, "0x(Coil)", true);
        }

        // 그 외 범위 오류 — 위 범위에 안 걸리면 raw holding offset으로 간주(호환용 폴백)
        if (startAddress > 65535 || endAddress > 65535)
            throw new Exception("Modbus 읽기 주소 범위 오류 (0~65535)");

        return (startAddress, 0x03, "RAW(Holding offset)", false);
    }

    // 워드 쓰기용 주소 해석 — 4x(Holding Register)만 쓰기가 가능하고, 나머지 영역은
    // 읽기 전용이거나 비트 영역이므로 명확한 안내 메시지와 함께 예외를 던진다.
    private static (ushort WireAddress, string AreaName) ResolveModbusWordWriteAddress(int address)
    {
        if (address >= 40001 && address <= 49999)
            return ((ushort)(address - 40001), "4x(Holding Register)");

        if (address >= 30001 && address <= 39999)
            throw new Exception("Modbus 3x(Input Register)는 읽기 전용입니다. 쓰기는 4x 주소를 사용하세요.");

        if (address >= 20001 && address <= 29999)
            throw new Exception("Modbus 2x(Discrete Input)는 읽기 전용 bit 영역입니다.");

        if (address >= 10001 && address <= 19999)
            throw new Exception("Modbus 1x(Coil)는 bit 영역입니다. WriteBitAsync를 사용하세요.");

        if (address < 0 || address > 65535)
            throw new Exception("Modbus 주소 범위 오류 (0~65535)");

        return ((ushort)address, "RAW(Holding offset)");
    }

    // 비트 쓰기용 주소 해석 — 1x(Coil)만 쓰기가 가능하다 (FC05는 Coil 전용 기능코드).
    private static (ushort WireAddress, string AreaName) ResolveModbusBitWriteAddress(int address)
    {
        if (address >= 10001 && address <= 19999)
            return ((ushort)(address - 10001), "1x(Coil)");

        if (address >= 20001 && address <= 29999)
            throw new Exception("Modbus 2x(Discrete Input)는 읽기 전용입니다. bit 쓰기는 1x만 가능합니다.");

        if (address >= 30001 && address <= 39999)
            throw new Exception("Modbus 3x(Input Register)는 word 읽기 전용입니다.");

        if (address >= 40001 && address <= 49999)
            throw new Exception("Modbus 4x(Holding Register)는 word 영역입니다. bit 쓰기는 1x만 가능합니다.");

        if (address < 0 || address > 65535)
            throw new Exception("Modbus 주소 범위 오류 (0~65535)");

        return ((ushort)address, "RAW(Coil offset)");
    }

    // ========================================================================
    //  Modbus TCP 패킷 빌더 — 전부 MBAP 헤더(7바이트: 트랜잭션ID/프로토콜ID/길이/유닛ID) +
    //  PDU(기능코드+데이터)로 구성된다.
    // ========================================================================

    private static byte[] BuildModbusReadRequest(ushort txId, byte functionCode, ushort startAddress, ushort count)
    {
        var req = new byte[12];
        WriteUInt16BE(req, 0, txId);          // 트랜잭션 ID (응답 매칭용)
        WriteUInt16BE(req, 2, 0x0000);        // 프로토콜 ID (Modbus는 항상 0)
        WriteUInt16BE(req, 4, 0x0006);        // 이후 바이트 길이 (유닛ID+기능코드+주소+개수 = 6)
        req[6] = ModbusUnitId;                // 유닛/슬레이브 ID
        req[7] = functionCode;                // 기능 코드 (0x01/02/03/04)
        WriteUInt16BE(req, 8, startAddress);  // wire 시작 주소
        WriteUInt16BE(req, 10, count);        // 읽을 개수
        return req;
    }

    private static byte[] BuildModbusWriteRequest(ushort txId, ushort address, ushort value)
    {
        var req = new byte[12];
        WriteUInt16BE(req, 0, txId);
        WriteUInt16BE(req, 2, 0x0000);
        WriteUInt16BE(req, 4, 0x0006);
        req[6] = ModbusUnitId;
        req[7] = 0x06;                        // FC06: 단일 레지스터 쓰기
        WriteUInt16BE(req, 8, address);
        WriteUInt16BE(req, 10, value);
        return req;
    }

    private static byte[] BuildModbusWriteMultipleRequest(ushort txId, ushort address, ushort value)
    {
        var req = new byte[15];
        WriteUInt16BE(req, 0, txId);
        WriteUInt16BE(req, 2, 0x0000);
        WriteUInt16BE(req, 4, 0x0009);        // 이후 바이트 길이 (개수 1개 쓰기 기준)
        req[6] = ModbusUnitId;
        req[7] = 0x10;                        // FC10: 복수 레지스터 쓰기 (여기선 개수=1로만 사용, FC06 폴백용)
        WriteUInt16BE(req, 8, address);
        WriteUInt16BE(req, 10, 0x0001);       // 쓸 레지스터 개수: 1
        req[12] = 0x02;                       // 바이트 수: 2 (워드 1개)
        WriteUInt16BE(req, 13, value);
        return req;
    }

    private static byte[] BuildModbusWriteSingleCoilRequest(ushort txId, ushort address, bool value)
    {
        var req = new byte[12];
        WriteUInt16BE(req, 0, txId);
        WriteUInt16BE(req, 2, 0x0000);
        WriteUInt16BE(req, 4, 0x0006);
        req[6] = ModbusUnitId;
        req[7] = 0x05;                                            // FC05: 단일 코일 쓰기
        WriteUInt16BE(req, 8, address);
        WriteUInt16BE(req, 10, value ? (ushort)0xFF00 : (ushort)0x0000);  // Modbus 코일 값 표현: ON=0xFF00, OFF=0x0000
        return req;
    }

    // MBAP 헤더(7바이트)를 읽어 트랜잭션ID/프로토콜ID를 검증하고, 남은 PDU 바이트만 읽어서 반환한다.
    private static async Task<byte[]> ReadModbusPduAsync(NetworkStream ns, ushort expectedTxId)
    {
        var mbap = new byte[7];
        await ReadFullAsync(ns, mbap);

        ushort txId = ReadUInt16BE(mbap, 0);
        ushort protocolId = ReadUInt16BE(mbap, 2);
        ushort length = ReadUInt16BE(mbap, 4);   // 유닛ID(1) + PDU 길이

        if (txId != expectedTxId)
            throw new Exception($"Modbus 트랜잭션 불일치: expected={expectedTxId}, recv={txId}");
        if (protocolId != 0)
            throw new Exception($"Modbus 프로토콜 ID 오류: {protocolId}");
        if (length < 2)
            throw new Exception("Modbus 길이 필드가 비정상입니다.");

        int pduLength = length - 1;   // 유닛ID 1바이트를 뺀 순수 PDU(기능코드+데이터) 길이
        var pdu = new byte[pduLength];
        await ReadFullAsync(ns, pdu);
        return pdu;
    }

    // Modbus는 빅엔디안(Big-Endian)이라 LS/Mitsubishi(리틀엔디안, BitConverter 사용)와 달리
    // 별도의 빅엔디안 read/write 헬퍼를 쓴다.
    private static ushort ReadUInt16BE(byte[] data, int offset) =>
        (ushort)((data[offset] << 8) | data[offset + 1]);

    private static void WriteUInt16BE(byte[] data, int offset, ushort value)
    {
        data[offset] = (byte)(value >> 8);
        data[offset + 1] = (byte)(value & 0xFF);
    }

    // Modbus 표준 예외 코드를 사람이 읽을 수 있는 텍스트로 변환 (에러 메시지에 같이 붙여줌)
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
}
