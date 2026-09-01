package com.sample_pro.service.monitor;

import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 서버 사이드 PLC 캐시 — 2초마다 전체 BCF 폴링 후 스냅샷 유지.
 *
 * BCF1~11  : Modbus TCP  (코일 readBits / 워드 read)
 * BCF12    : Mitsubishi   (D레지스터 word, X/Y/M 비트 — device 파라미터)
 */
@Service
public class MonitorCacheService {

    private static final String CSHARP = "http://localhost:5050";

    private final RestTemplate rest;
    private final ConcurrentHashMap<String, Object> snapshot = new ConcurrentHashMap<>();


    public MonitorCacheService() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(1000);
        f.setReadTimeout(8000);
        rest = new RestTemplate(f);
    }

    // ── Modbus 워드 주소 (per-BCF): 메인 모니터 + 상세 페이지 모두 포함 ─────
    private static final Map<Integer, int[]> WORD_DETAIL_ADDRS = new HashMap<>();

    // ── Modbus 코일 비트 주소 (< 40000) ────────────────────────────────────
    private static final Map<Integer, int[]> COIL_ADDRS = new HashMap<>();
    // ── 40xxx: FC03 워드 읽기 후 0/1 변환 (BCF7 알람, BCF11 트레이) ─────────
    private static final Map<Integer, int[]> WORD_FLAG_ADDRS = new HashMap<>();

    static {
        // BCF1~5, 10: 침탄로 — 상세 페이지 40015~40071 전체 커버
        int[] bcf1to5 = {
            40002, 40004,
            40015, 40016, 40017, 40018, 40019, 40020, 40021, 40023, 40025,
            40028, 40029, 40030, 40031, 40032, 40033, 40034, 40035, 40036,
            40038, 40039, 40040, 40041, 40042, 40043, 40044,
            40046, 40047, 40048, 40049, 40050, 40051, 40052,
            40060,
            40069, 40070, 40071
        };
        WORD_DETAIL_ADDRS.put(1,  bcf1to5);
        WORD_DETAIL_ADDRS.put(2,  bcf1to5);
        WORD_DETAIL_ADDRS.put(3,  bcf1to5);
        WORD_DETAIL_ADDRS.put(4,  bcf1to5);
        WORD_DETAIL_ADDRS.put(5,  bcf1to5);
        WORD_DETAIL_ADDRS.put(10, bcf1to5);

        // BCF6: 시간PV/SP 소주소(2~48) + 온도/CP 40xxx 주소
        WORD_DETAIL_ADDRS.put(6, new int[]{
            2, 3, 8, 9, 10, 12, 13, 14, 16, 17, 21, 22, 41, 48,
            40018, 40025, 40033, 40034, 40035, 40036, 40037, 40038,
            40039, 40040, 40041, 40042, 40043, 40044, 40045, 40046,
            40048, 40049
        });

        // BCF7, 9: 존테이블 소주소 + 온도CP 패널(40003~40071) + 상세(44610~44613)
        // main_monitor2: DT=44610, 온도PV=44611/44612/44613, SP=40003/40004/40007
        int[] bcf79 = {
            11, 13, 15, 19, 21, 23, 25, 26, 27, 29, 32,
            115, 130, 145, 193, 232, 233, 390,
            40003, 40004, 40007, 40046, 40047, 40052, 40069, 40070, 40071,
            44610, 44611, 44612, 44613
        };
        WORD_DETAIL_ADDRS.put(7, bcf79);
        WORD_DETAIL_ADDRS.put(9, bcf79);

        // BCF8: 온도 주소가 BCF7/9와 전혀 다른 노형
        // main_monitor2: DT=40063/40005, 온도PV=40049/40050/40055, SP=40071/40073/40074
        // zone table: 시간PV(16~26), 시간SP(31~39), 온도SP(41~48), 온도PV(49~50), CP(51~55), NH3(56~60)
        int[] bcf8 = {
            11, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 29,
            31, 32, 33, 34, 35, 36, 37, 38, 39,
            41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
            115, 130, 145, 193, 232, 233, 390,
            40003, 40004, 40005, 40007,
            40046, 40047, 40049, 40050, 40052, 40055,
            40063, 40069, 40070, 40071, 40072, 40073, 40074,
            44611, 44612, 44613
        };
        WORD_DETAIL_ADDRS.put(8, bcf8);

        // ── 코일 비트 ──────────────────────────────────────────────────────
        COIL_ADDRS.put(1,  new int[]{
            1, 2, 3, 4, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 25, 27, 28, 29, 30,
            33, 34, 38, 39, 40, 41, 44, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
            66, 67, 69, 71, 72, 74, 76, 79, 80, 81, 83, 85, 88, 90,
            96, 97, 98, 106, 107, 131, 132, 134, 136, 137, 138, 139, 140, 141});
        COIL_ADDRS.put(2,  new int[]{
            1, 2, 3, 4, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 25, 27, 28, 29, 30,
            33, 34, 38, 39, 40, 41, 44, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
            66, 67, 69, 71, 72, 74, 76, 79, 80, 81, 83, 85, 88, 90,
            96, 97, 98, 106, 107, 131, 132, 134, 136, 137, 138, 139, 140, 141});
        COIL_ADDRS.put(3,  new int[]{2, 3, 8, 25, 39, 40, 44, 45, 46, 50, 51, 56, 60, 96, 97, 98, 106});
        COIL_ADDRS.put(4,  new int[]{2, 3, 8, 25, 44, 45, 46, 50, 51, 56, 60, 85, 86, 96, 97, 98, 106});
        COIL_ADDRS.put(5,  new int[]{2, 3, 8, 25, 38, 39, 40, 46, 48, 49, 50, 51, 52, 53, 54, 58, 62, 98, 99, 100, 108});
        COIL_ADDRS.put(6,  new int[]{8, 14, 16, 20, 22, 24, 25, 26, 30, 37, 39, 43, 84, 131,
                                      187, 224, 225, 226, 234, 244, 245, 248, 249,
                                      252, 253, 256, 257, 260, 261, 264, 265,
                                      291, 293, 294, 295, 296, 297, 298,
                                      303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 386});
        COIL_ADDRS.put(7,  new int[]{1, 2, 12, 14, 17, 18, 19, 22, 25, 88, 89, 110, 111, 144, 145, 155, 157,
                                      264, 272, 273, 274, 275, 276, 277, 278, 279});
        COIL_ADDRS.put(8,  new int[]{7, 11, 13, 14, 15, 18, 19, 23, 25, 85, 86, 87, 88, 93, 96, 113, 116, 117,
                                      164, 165, 166, 174,
                                      210, 212, 215, 217,
                                      230, 231, 232, 233, 234, 235, 236, 237, 238,
                                      239, 240, 241, 242, 243, 244, 245, 246, 247});
        COIL_ADDRS.put(9,  new int[]{1, 2, 12, 14, 18, 19, 22, 25, 110, 111, 144, 145, 155, 157,
                                      264, 272, 273, 274, 275, 276, 277, 278, 279});
        COIL_ADDRS.put(10, new int[]{2, 8, 25, 38, 39, 42, 46, 49, 52, 53, 54, 58, 62, 98, 99, 100, 133});
        COIL_ADDRS.put(11, new int[]{3, 5, 7, 9, 25, 56, 57, 60, 62, 65, 79, 80, 83, 84, 97, 98, 100, 117,
                                      133, 162, 163, 164, 165, 166, 167});

        // BCF11: 존테이블 + 온도 패널 + main_monitor2 DT 아날로그(40007/40009/40026/40043/40051)
        WORD_DETAIL_ADDRS.put(11, new int[]{
            1, 2, 3, 4, 6, 7, 8, 10, 19,
            73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
            101, 103, 106, 137, 141, 142, 143, 145,
            40001, 40002, 40003, 40004, 40005, 40007, 40009,
            40026, 40043, 40051, 40052,
            40077, 40078, 40079, 40080, 40081
        });

        WORD_FLAG_ADDRS.put(7,  new int[]{40038});
        WORD_FLAG_ADDRS.put(11, new int[]{40008, 40010, 40027, 40044, 40053});
    }

    // ── BCF12 Mitsubishi D레지스터 주소 ────────────────────────────────────
    private static final int   BCF12_D_START = 1010;
    private static final int   BCF12_D_COUNT = 78;   // 1010~1087
    private static final int[] BCF12_D_ADDRS = {1010, 1020, 1051, 1061, 1081, 1083, 1085, 1087};

    // ── 스케줄러: 2초마다 전체 BCF 읽기 ───────────────────────────────────
    @Scheduled(fixedDelay = 2000)
    public void refresh() {
        List<CompletableFuture<Void>> futures = new ArrayList<>();

        // 모든 BCF 워드 (per-BCF 주소 맵)
        for (Integer n : WORD_DETAIL_ADDRS.keySet()) {
            final int plcNum = n;
            futures.add(CompletableFuture.runAsync(() -> readModbusWords(plcNum)));
        }

        // BCF1~11 코일 비트
        for (int n = 1; n <= 11; n++) {
            if (!COIL_ADDRS.containsKey(n)) continue;
            final int plcNum = n;
            futures.add(CompletableFuture.runAsync(() -> readModbusCoils(plcNum)));
        }

        // BCF7/11 워드-플래그 (40xxx → 0/1)
        for (Map.Entry<Integer, int[]> e : WORD_FLAG_ADDRS.entrySet()) {
            final int plcNum = e.getKey();
            final int[] addrs = e.getValue();
            futures.add(CompletableFuture.runAsync(() -> readWordFlags(plcNum, addrs)));
        }

        // BCF12 Mitsubishi D레지스터
        futures.add(CompletableFuture.runAsync(this::readBcf12Words));

        // BCF12 Mitsubishi X/Y/M 비트
        futures.add(CompletableFuture.runAsync(this::readBcf12Bits));

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    }

    // ── 개별 읽기 메서드 ───────────────────────────────────────────────────

    /** Modbus 워드: 갭 > 200 또는 범위 >= 120 레지스터 구간마다 분할 호출 */
    private void readModbusWords(int plcNum) {
        int[] addrs = WORD_DETAIL_ADDRS.get(plcNum);
        if (addrs == null || addrs.length == 0) return;
        int chunkStart = 0;
        for (int i = 1; i <= addrs.length; i++) {
            boolean gapFlush  = (i < addrs.length) && (addrs[i] - addrs[i - 1] > 200);
            boolean sizeFlush = (i < addrs.length) && (addrs[i] - addrs[chunkStart] >= 120);
            if (i == addrs.length || gapFlush || sizeFlush) {
                int[] chunk = Arrays.copyOfRange(addrs, chunkStart, i);
                readModbusWordsChunk(plcNum, chunk);
                chunkStart = i;
            }
        }
    }

    private void readModbusWordsChunk(int plcNum, int[] addrs) {
        int start = addrs[0];
        int count = addrs[addrs.length - 1] - start + 1;
        String url = CSHARP + "/api/plc/read/" + plcId(plcNum)
                   + "?start=" + start + "&count=" + count;
        try {
            Map<?, ?> res = rest.getForObject(url, Map.class);
            if (res != null && Boolean.TRUE.equals(res.get("success"))) {
                List<?> vals = (List<?>) res.get("values");
                for (int addr : addrs) {
                    int idx = addr - start;
                    if (idx >= 0 && idx < vals.size() && vals.get(idx) != null) {
                        snapshot.put("bcf" + plcNum + "_s_" + addr, vals.get(idx));
                        // BCF1~5, BCF10 단품(DT) 아날로그 키 alias: bcfX_dt_40060
                        if (addr == 40060 && (plcNum >= 1 && plcNum <= 5 || plcNum == 10)) {
                            snapshot.put("bcf" + plcNum + "_dt_40060", vals.get(idx));
                        }
                    }
                }
                snapshot.put("bcf" + plcNum + "_conn", System.currentTimeMillis());
            }
        } catch (Exception ignored) {}
    }

    /** Modbus 코일: 최소~최대 주소 범위로 한 번 호출 */
    private void readModbusCoils(int plcNum) {
        int[] sorted = Arrays.stream(COIL_ADDRS.get(plcNum))
                             .filter(a -> a < 40000)
                             .sorted().toArray();
        if (sorted.length == 0) return;

        int start = sorted[0];
        int count = sorted[sorted.length - 1] - start + 1;
        String url = CSHARP + "/api/plc/readBits/" + plcId(plcNum)
                   + "?start=" + start + "&count=" + count;
        try {
            Map<?, ?> res = rest.getForObject(url, Map.class);
            if (res != null && Boolean.TRUE.equals(res.get("success"))) {
                List<?> vals = (List<?>) res.get("values");
                for (int addr : sorted) {
                    int idx = addr - start;
                    if (idx >= 0 && idx < vals.size()) {
                        Object v = vals.get(idx);
                        snapshot.put("bcf" + plcNum + "_" + addr,
                            Boolean.TRUE.equals(v) ? 1 : 0);
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    /** 40xxx 주소: FC03 워드 읽기 → 0 이면 0, 그 외 1 */
    private void readWordFlags(int plcNum, int[] addrs) {
        for (int addr : addrs) {
            String url = CSHARP + "/api/plc/read/" + plcId(plcNum)
                       + "?start=" + addr + "&count=1";
            try {
                Map<?, ?> res = rest.getForObject(url, Map.class);
                if (res != null && Boolean.TRUE.equals(res.get("success"))) {
                    List<?> vals = (List<?>) res.get("values");
                    if (!vals.isEmpty()) {
                        Object v = vals.get(0);
                        int flag = (v instanceof Number && ((Number) v).intValue() != 0) ? 1 : 0;
                        snapshot.put("bcf" + plcNum + "_" + addr, flag);
                    }
                }
            } catch (Exception ignored) {}
        }
    }

    /** BCF12 D레지스터: D1051~D1087 범위 단일 호출 */
    private void readBcf12Words() {
        String url = CSHARP + "/api/plc/read/dongwoo_12"
                   + "?start=" + BCF12_D_START + "&count=" + BCF12_D_COUNT + "&device=D";
        try {
            Map<?, ?> res = rest.getForObject(url, Map.class);
            if (res != null && Boolean.TRUE.equals(res.get("success"))) {
                List<?> vals = (List<?>) res.get("values");
                for (int dAddr : BCF12_D_ADDRS) {
                    int idx = dAddr - BCF12_D_START;
                    if (idx >= 0 && idx < vals.size() && vals.get(idx) != null)
                        snapshot.put("bcf12_s_D" + dAddr, vals.get(idx));
                }
                snapshot.put("bcf12_conn", System.currentTimeMillis());
            }
        } catch (Exception ignored) {}
    }

    /** BCF12 X/Y/M 비트: Mitsubishi bit device read (device 파라미터 사용) */
    private void readBcf12Bits() {
        // ── 오버레이 패널용 기존 비트 ─────────────────────────────────────────
        // X144(0x90)~X151(0x97)
        readMitBitRange("X", 144, 8,
            new int[]   {144,           146,           149,           151},
            new String[]{"bcf12_X090H", "bcf12_X092H", "bcf12_X095H", "bcf12_X097H"});

        // Y240(0xF0)~Y249: count=10(짝수)으로 Y248(0xF8) byte경계 문제 방지
        readMitBitRange("Y", 240, 10,
            new int[]   {240,           241,           244,           248},
            new String[]{"bcf12_Y0F0H", "bcf12_Y0F1H", "bcf12_Y0F4H", "bcf12_Y0F8H"});

        // Y274(0x112H, 운전모드), M6824(조깅), M925(공정현황)
        readMitBitSingle("Y", 274,  "bcf12_Y112H");
        readMitBitSingle("M", 6824, "bcf12_M6824");
        readMitBitSingle("M", 925,  "bcf12_M0925");

        // Y281(0x119H) — now_work 공정현황
        readMitBitSingle("Y", 281, "bcf12_Y119H");

        // L301~306(래치릴레이) — now_work 승온/본처리/강온
        readMitBitRange("L", 301, 6,
            new int[]   {301,          302,          303,          304,          305,          306},
            new String[]{"bcf12_L0301","bcf12_L0302","bcf12_L0303","bcf12_L0304","bcf12_L0305","bcf12_L0306"});

        // ── 존 테이블 X 비트 ──────────────────────────────────────────────────
        // X43(0x2B) 단독
        readMitBitSingle("X", 43, "bcf12_x02b");

        // X121(0x79)~X183(0xB7): 63비트
        readMitBitRange("X", 121, 63,
            new int[]   {121,          122,          124,          125,          128,          129,          130,          131,          132,          133,          134,          135,          137,          139,          155,          156,          157,          158,          183},
            new String[]{"bcf12_x079","bcf12_x07a","bcf12_x07c","bcf12_x07d","bcf12_x080","bcf12_x081","bcf12_x082","bcf12_x083","bcf12_x084","bcf12_x085","bcf12_x086","bcf12_x087h","bcf12_x089","bcf12_x08b","bcf12_x09b","bcf12_x09c","bcf12_x09d","bcf12_x09e","bcf12_x0b7"});

        // ── 존 테이블 Y 비트 ──────────────────────────────────────────────────
        // Y208(0xD0)~Y247(0xF7): 40비트
        readMitBitRange("Y", 208, 40,
            new int[]   {208,          209,          211,          212,          214,          216,          217,          218,          219,          220,          221,          222,          223,          244,            245,          246,          247},
            new String[]{"bcf12_y0d0h","bcf12_y0d1h","bcf12_y0d3h","bcf12_y0d4h","bcf12_y0d6h","bcf12_y0d8h","bcf12_y0d9h","bcf12_y0dah","bcf12_y0dbh","bcf12_y0dch","bcf12_y0ddh","bcf12_y0deh","bcf12_y0dfh","bcf12_Y0F4H","bcf12_y0f5h","bcf12_y0f6h","bcf12_y0f7h"});

        // Y256(0x100) 단독
        readMitBitSingle("Y", 256, "bcf12_y100h");

        // Y257(0x101H) — obj-on
        readMitBitSingle("Y", 257, "bcf12_Y101H");

        // Y267(0x10B)~Y269(0x10D): 3비트
        readMitBitRange("Y", 267, 3,
            new int[]   {267,          269},
            new String[]{"bcf12_y10bh","bcf12_y10dh"});

        // Y304(0x130)~Y309(0x135): 6비트
        readMitBitRange("Y", 304, 6,
            new int[]   {304,          305,          306,          307,          308,          309},
            new String[]{"bcf12_y130h","bcf12_y131h","bcf12_y132h","bcf12_y133h","bcf12_y134h","bcf12_y135h"});
    }

    private void readMitBitRange(String device, int startAddr, int count,
                                  int[] addrMap, String[] tagMap) {
        String url = CSHARP + "/api/plc/read/dongwoo_12"
                   + "?start=" + startAddr + "&count=" + count + "&device=" + device;
        try {
            Map<?, ?> res = rest.getForObject(url, Map.class);
            if (res != null && Boolean.TRUE.equals(res.get("success"))) {
                List<?> vals = (List<?>) res.get("values");
                for (int i = 0; i < addrMap.length && i < tagMap.length; i++) {
                    int idx = addrMap[i] - startAddr;
                    if (idx >= 0 && idx < vals.size()) {
                        Object v = vals.get(idx);
                        snapshot.put(tagMap[i],
                            (v instanceof Number && ((Number) v).intValue() != 0) ? 1 : 0);
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private void readMitBitSingle(String device, int addr, String tag) {
        String url = CSHARP + "/api/plc/read/dongwoo_12"
                   + "?start=" + addr + "&count=1&device=" + device;
        try {
            Map<?, ?> res = rest.getForObject(url, Map.class);
            if (res != null && Boolean.TRUE.equals(res.get("success"))) {
                List<?> vals = (List<?>) res.get("values");
                if (!vals.isEmpty()) {
                    Object v = vals.get(0);
                    snapshot.put(tag,
                        (v instanceof Number && ((Number) v).intValue() != 0) ? 1 : 0);
                }
            }
        } catch (Exception ignored) {}
    }

    // ── 스냅샷 반환 (컨트롤러에서 호출) ──────────────────────────────────
    public Map<String, Object> getSnapshot() {
        return new HashMap<>(snapshot);
    }

    private static String plcId(int n) {
        return n < 10 ? "dongwoo_0" + n : "dongwoo_" + n;
    }
}
