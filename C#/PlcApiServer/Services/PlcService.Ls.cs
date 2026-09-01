// ============================================================================
// PlcService.Ls.cs  (partial class — LS산전 XGT 시리즈, FEnet 프로토콜 구현)
// ============================================================================
// [파일 역할]
//   PlcService의 PlcType == "LS" 일 때 실제로 패킷을 만들고 파싱하는 부분.
//   이 파일 안에 서로 다른 두 경로가 있다 (LS전기 공식 "XGB FEnet I/F Module" 매뉴얼 기준):
//     (1) 워드(D/M/L/P 등 모든 영역) — "Continuous" 모드, "%<영역>B<바이트주소>" 표기
//         → LsReadWordsAsync / LsWriteWordAsync (area 파라미터로 D/M/L/P 등 지정, 기본값 "D")
//     (2) M/L/P 비트 — "Individual" 모드, "%<영역>X<주소>" 표기
//         → LsIndividualReadBitsAsync / LsIndividualWriteBitAsync
//   D는 원래부터 (1) Continuous 경로만 썼고, 이번에 area 파라미터를 추가해 M/L/P 워드도
//   같은 Continuous 경로를 타도록 확장했다 (기존 D 동작은 area="D" 기본값으로 100% 동일).
//
// [처리 흐름 — 웹 요청이 여기까지 오는 경로]
//   웹 → 5050 → Program.cs 핸들러 → PlcService.ReadWordsAsync/WriteWordAsync/ReadBitsAsync/
//     WriteBitAsync (PlcService.cs) → PlcType이 "LS"이면 device 파라미터를 영역(area)으로
//     그대로 넘겨 (1) 워드 경로 또는 (2) 비트 경로로 분기
//     → WithConnectionAsync(PlcService.cs)로 TCP 연결을 확보한 뒤,
//       FEnet 헤더(BuildFenetHeader) + 명령 바디를 조립해 그대로 소켓에 write
//     → PLC가 응답한 바이트를 ReadFullAsync(PlcService.cs)로 정확한 길이만큼 읽고 값을 파싱
//     → 결과(ushort[]/bool[])가 그대로 PlcService.cs → Program.cs로 돌아가 JSON 응답이 된다.
//   ※ 여기서 DB(MariaDB)는 전혀 관여하지 않는다. 순수하게 TCP 바이트 스트림 조립/파싱만 한다.
//
// [검증 상태 — 실기 테스트로 확인/수정한 이력]
//   실제 PLC(XBM-DN32H2)로 테스트한 결과:
//     - Continuous 모드(워드)는 D뿐 아니라 다른 영역(%MB/%LB/%PB 등)에도 그대로 잘 동작함을
//       확인 → 워드 읽기/쓰기는 전부 이 경로로 통일했다 (100개 이상 다중 읽기까지 정상).
//     - Individual 모드(비트, h0000)는 실기에서 "count(포인트 수)"를 요청해도 PLC가 항상
//       1점만 응답하는 것으로 확인됨 → 비트 다중 읽기는 주소별로 1점씩 순차 요청해서 모으는
//       방식으로 구현했다 (LsIndividualReadBitsAsync). 응답이 정상적으로 오는 것은 확인됐지만,
//       OFF(0) 상태 비트로만 테스트했고 ON(1) 상태에서도 1바이트에 정확히 인코딩되는지는
//       아직 확인 전이다 — 실제 ON 상태인 비트로 한 번 더 검증 필요.
//   D는 매뉴얼에 "byte/word만 지원, bit 불가"로 명시돼 있어 비트 접근 대상에서 제외했다.
// ============================================================================

using System.Text;

namespace PlcApiServer.Services;

public partial class PlcService
{
    //  LS XGT — 워드 읽기 (Continuous 모드, 모든 영역 공통)
    //  startD: 워드 주소, count: 읽을 워드 개수, area: 디바이스 영역(D/M/L/P 등, 기본값 "D")
    //  FEnet 개별 읽기(0x54) 명령 — device 문자열은 "%<area>B<바이트주소>" (워드주소*2)로 조립
    //  (Continuous 모드는 Byte 단위로만 동작하므로 워드 주소를 바이트 주소로 변환해서 사용)
    private async Task<ushort[]> LsReadWordsAsync(int startD, int count, string area = "D")
    {
        return await WithConnectionAsync(async ns =>
        {
            int byteAddress = startD * 2;                       // 워드 단위지만 FEnet Continuous는 바이트주소 사용
            string device = $"%{area}B{byteAddress}";
            byte[] deviceAscii = Encoding.ASCII.GetBytes(device);
            ushort deviceLen = (ushort)deviceAscii.Length;
            ushort byteCountToRead = (ushort)(count * 2);        // 워드 개수 → 바이트 개수 변환

            // ── FEnet 개별 읽기 요청 명령 바디 조립 ──
            var body = new List<byte>();
            body.AddRange(new byte[] { 0x54, 0x00 });            // 명령: 개별 읽기 요청 (0x0054)
            body.AddRange(new byte[] { 0x14, 0x00 });            // 데이터 타입: Continuous(연속) 등 고정값
            body.AddRange(new byte[] { 0x00, 0x00 });            // 예약
            body.AddRange(new byte[] { 0x01, 0x00 });            // 블록 수: 1개
            body.AddRange(BitConverter.GetBytes(deviceLen));     // 디바이스 문자열 길이
            body.AddRange(deviceAscii);                          // "%DB<바이트주소>" ASCII
            body.AddRange(BitConverter.GetBytes(byteCountToRead)); // 읽을 바이트 수

            int id = Interlocked.Increment(ref _invokeId) & 0xFFFF;
            byte[] packet = BuildFenetHeader(body.ToArray(), (ushort)id);

            await ns.WriteAsync(packet);

            // ── 응답 파싱: FEnet 헤더는 항상 20바이트 고정 ──
            byte[] hdr = new byte[20];
            await ReadFullAsync(ns, hdr);

            ushort bodyLen = BitConverter.ToUInt16(hdr, 16);     // 헤더의 16번째 오프셋 = 뒤따라올 바디 길이
            if (bodyLen == 0) throw new Exception("PLC 응답 바디가 비어있습니다.");

            byte[] recvBody = new byte[bodyLen];
            await ReadFullAsync(ns, recvBody);

            return LsParseResponse(recvBody, (ushort)count);
        });
    }

    //  LS XGT — 워드 쓰기 (Continuous 모드, 모든 영역 공통)
    //  개별 쓰기(0x58) 명령으로 워드 1개에 값을 쓴다. area: 디바이스 영역(D/M/L/P 등, 기본값 "D")
    private async Task LsWriteWordAsync(int dAddress, int value, string area = "D")
    {
        await WithConnectionAsync(async ns =>
        {
            int byteAddress = dAddress * 2;
            string device = $"%{area}B{byteAddress}";
            byte[] deviceAscii = Encoding.ASCII.GetBytes(device);
            ushort deviceLen = (ushort)deviceAscii.Length;
            byte[] valueBytes = BitConverter.GetBytes((ushort)value);

            // ── FEnet 개별 쓰기 요청 명령 바디 조립 ──
            var body = new List<byte>();
            body.AddRange(new byte[] { 0x58, 0x00 });            // 명령: 개별 쓰기 요청 (0x0058)
            body.AddRange(new byte[] { 0x14, 0x00 });            // 데이터 타입 고정값
            body.AddRange(new byte[] { 0x00, 0x00 });            // 예약
            body.AddRange(new byte[] { 0x01, 0x00 });            // 블록 수: 1개
            body.AddRange(BitConverter.GetBytes(deviceLen));     // 디바이스 문자열 길이
            body.AddRange(deviceAscii);                          // "%DB<바이트주소>" ASCII
            body.AddRange(new byte[] { 0x02, 0x00 });            // 쓸 바이트 수: 2 (워드 1개)
            body.AddRange(valueBytes);                           // 실제 쓸 값

            int id = Interlocked.Increment(ref _invokeId) & 0xFFFF;
            byte[] packet = BuildFenetHeader(body.ToArray(), (ushort)id);
            await ns.WriteAsync(packet);

            // ── 응답 파싱 & 에러코드 확인 ──
            byte[] hdr = new byte[20];
            await ReadFullAsync(ns, hdr);

            ushort bodyLen = BitConverter.ToUInt16(hdr, 16);
            if (bodyLen == 0)
                throw new Exception("PLC 쓰기 응답이 비어있습니다 (bodyLen=0).");
            byte[] wBody = new byte[bodyLen];
            await ReadFullAsync(ns, wBody);
            ushort err = BitConverter.ToUInt16(wBody, 6);        // 응답 바디의 6번째 오프셋 = 에러코드
            if (err != 0) throw new Exception($"PLC 쓰기 에러: 0x{err:X4}");
        });
    }

    // ========================================================================
    // ── Individual 모드 — M/L/P 비트 읽기/쓰기 ──────────────────────────────
    //  PLC가 Individual+Bit 요청에서 count(포인트 수)를 무시하고 항상 1점만 응답하는 것으로
    //  실기에서 확인되어, 여러 점을 읽을 때는 주소별로 1점씩 순차 요청해서 모은다.
    // ========================================================================

    //  LS XGT — Individual 모드 비트 읽기. area: 디바이스 영역(M/L/P), startAddress부터 count개.
    private async Task<bool[]> LsIndividualReadBitsAsync(string area, int startAddress, int count)
    {
        var result = new bool[count];
        for (int i = 0; i < count; i++)
        {
            byte[] data = await LsIndividualReadRawAsync($"%{area}X{startAddress + i}", 0x00); // 데이터 타입: Bit (h0000)
            result[i] = data.Length > 0 && data[0] != 0;
        }
        return result;
    }

    //  LS XGT — Individual 모드 비트 쓰기. area: 디바이스 영역(M/L/P), 1점만 쓴다.
    private async Task LsIndividualWriteBitAsync(string area, int address, bool value)
    {
        string device = $"%{area}X{address}";
        await WithConnectionAsync(async ns =>
        {
            byte[] deviceAscii = Encoding.ASCII.GetBytes(device);
            ushort deviceLen = (ushort)deviceAscii.Length;

            var body = new List<byte>();
            body.AddRange(new byte[] { 0x58, 0x00 });               // 명령: 개별 쓰기 요청 (h5800)
            body.AddRange(new byte[] { 0x00, 0x00 });               // 데이터 타입: Bit (h0000)
            body.AddRange(new byte[] { 0x00, 0x00 });               // 예약
            body.AddRange(new byte[] { 0x01, 0x00 });               // 블록 수: 1개
            body.AddRange(BitConverter.GetBytes(deviceLen));
            body.AddRange(deviceAscii);
            body.AddRange(new byte[] { 0x01, 0x00 });               // 쓸 점수: 1비트
            body.Add(value ? (byte)0x01 : (byte)0x00);              // 비트 값 (포인트당 1바이트)
            // ⚠ ON(0x01/0xFF/2바이트 0x0001) 여러 인코딩을 실기로 시도했으나 전부 검증 실패.
            //   OFF(0x00) 쓰기는 성공해서 프레임 구조 자체는 맞는 것으로 보이나, ON 값 인코딩만
            //   틀렸거나 이 펌웨어가 Individual+Bit 쓰기 자체를 다르게 요구하는 것으로 추정된다.
            //   Wireshark로 XG5000의 실제 강제(Force) On 패킷을 캡처해 대조하는 게 가장 확실하다.

            int id = Interlocked.Increment(ref _invokeId) & 0xFFFF;
            byte[] packet = BuildFenetHeader(body.ToArray(), (ushort)id);
            await ns.WriteAsync(packet);

            byte[] hdr = new byte[20];
            await ReadFullAsync(ns, hdr);

            ushort bodyLen = BitConverter.ToUInt16(hdr, 16);
            if (bodyLen == 0) throw new Exception("PLC 쓰기 응답이 비어있습니다 (bodyLen=0).");
            byte[] wBody = new byte[bodyLen];
            await ReadFullAsync(ns, wBody);
            ushort err = BitConverter.ToUInt16(wBody, 6);
            if (err != 0) throw new Exception($"PLC 쓰기 에러: 0x{err:X4}");
        });
    }

    //  LS XGT — Individual 모드 읽기 공통 처리 (개별 읽기 요청 h5400, 항상 1점 요청)
    private async Task<byte[]> LsIndividualReadRawAsync(string device, byte dataTypeLow)
    {
        return await WithConnectionAsync(async ns =>
        {
            byte[] deviceAscii = Encoding.ASCII.GetBytes(device);
            ushort deviceLen = (ushort)deviceAscii.Length;

            var body = new List<byte>();
            body.AddRange(new byte[] { 0x54, 0x00 });               // 명령: 개별 읽기 요청 (h5400)
            body.AddRange(new byte[] { dataTypeLow, 0x00 });        // 데이터 타입: Bit(0x00)/Word(0x02)
            body.AddRange(new byte[] { 0x00, 0x00 });               // 예약
            body.AddRange(new byte[] { 0x01, 0x00 });               // 블록 수: 1개
            body.AddRange(BitConverter.GetBytes(deviceLen));        // 디바이스 문자열 길이
            body.AddRange(deviceAscii);                             // "%MX100" 등 ASCII
            body.AddRange(new byte[] { 0x01, 0x00 });               // 읽을 점 수: 1 (PLC가 count를 무시하므로 항상 1)

            int id = Interlocked.Increment(ref _invokeId) & 0xFFFF;
            byte[] packet = BuildFenetHeader(body.ToArray(), (ushort)id);
            await ns.WriteAsync(packet);

            byte[] hdr = new byte[20];
            await ReadFullAsync(ns, hdr);

            ushort bodyLen = BitConverter.ToUInt16(hdr, 16);
            if (bodyLen == 0) throw new Exception("PLC 응답 바디가 비어있습니다.");

            byte[] recvBody = new byte[bodyLen];
            await ReadFullAsync(ns, recvBody);

            return ExtractLsResponseData(recvBody);
        });
    }

    // Individual 모드 응답에서 에러코드를 확인하고 실제 데이터 구간만 잘라 반환한다.
    // (Continuous 모드의 LsParseResponse와 같은 헤더 구조를 공유한다고 보고 재사용 — D 경로의
    //  LsParseResponse 자체는 건드리지 않고 별도로 분리했다.)
    private static byte[] ExtractLsResponseData(byte[] body)
    {
        if (body.Length >= 8)
        {
            ushort errCodeEarly = BitConverter.ToUInt16(body, 6);
            if (errCodeEarly != 0)
                throw new Exception($"PLC READ 에러: 0x{errCodeEarly:X4}");
        }
        if (body.Length < 12) throw new Exception($"응답 바디 부족: {body.Length}바이트 (최소 12 필요)");

        ushort errCode = BitConverter.ToUInt16(body, 6);
        if (errCode != 0) throw new Exception($"PLC READ 에러: 0x{errCode:X4}");

        ushort actualByteCount = BitConverter.ToUInt16(body, 10);
        int dataOffset = body.Length - actualByteCount;
        if (dataOffset < 0 || dataOffset > body.Length) return Array.Empty<byte>();
        return body[dataOffset..];
    }

    //  LS 공용 헬퍼 — 읽기 응답 바디에서 실제 워드 값들을 뽑아낸다.
    private static ushort[] LsParseResponse(byte[] body, ushort requestedWordCount)
    {
        // 에러 응답은 8바이트 (헤더만) — 먼저 에러코드를 확인하고 예외를 던진다
        if (body.Length >= 8)
        {
            ushort errCodeEarly = BitConverter.ToUInt16(body, 6);
            if (errCodeEarly != 0)
                throw new Exception($"PLC READ 에러: 0x{errCodeEarly:X4}");
        }
        if (body.Length < 12) throw new Exception($"응답 바디 부족: {body.Length}바이트 (최소 12 필요)");

        ushort errCode = BitConverter.ToUInt16(body, 6);
        if (errCode != 0) throw new Exception($"PLC READ 에러: 0x{errCode:X4}");

        ushort actualByteCount = BitConverter.ToUInt16(body, 10);   // 실제로 담겨 온 데이터 바이트 수
        int dataOffset = body.Length - actualByteCount;             // 데이터 시작 위치 (뒤에서부터 계산)

        var values = new List<ushort>();
        for (int i = 0; i < requestedWordCount; i++)
        {
            int off = dataOffset + (i * 2);
            if (off + 1 < body.Length)
                values.Add(BitConverter.ToUInt16(body, off));
        }
        return values.ToArray();
    }

    // FEnet 공통 헤더(20바이트) 조립 — "LSIS-XGT" 시그니처 + 트랜잭션 ID + 바디 길이 + 바디
    private static byte[] BuildFenetHeader(byte[] body, ushort id)
    {
        byte[] pkt = new byte[20 + body.Length];
        Encoding.ASCII.GetBytes("LSIS-XGT").CopyTo(pkt, 0);   // 0~7 : 프로토콜 시그니처
        pkt[12] = 0xB0; pkt[13] = 0x33;                        // 12~13 : 회사 코드(고정값)
        pkt[14] = (byte)(id & 0xFF);                           // 14~15 : 트랜잭션 ID (요청-응답 매칭용)
        pkt[15] = (byte)((id >> 8) & 0xFF);
        pkt[16] = (byte)(body.Length & 0xFF);                  // 16~17 : 바디 길이
        pkt[17] = (byte)(body.Length >> 8);
        body.CopyTo(pkt, 20);                                  // 20~   : 명령 바디
        return pkt;
    }
}
