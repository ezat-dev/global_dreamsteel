package com.sample_pro.controller.monitor;

import com.sample_pro.dao.monitor.PlcConfigDao;
import com.sample_pro.domain.PlcConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientResponseException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PLC 통신 컨트롤러
 *
 * 브라우저(AJAX) → 이 컨트롤러(Spring) → C# API 서버(localhost:5050) → 실제 PLC 장비
 * 로 이어지는 3단계 프록시 구조.
 *
 * 지원 PLC 기종 (기종 구분은 C# 쪽에서 plcType 컬럼 보고 자동 분기):
 *   - LS XGT     : FEnet 프로토콜
 *   - Mitsubishi : MC Protocol 3E Binary
 *   - Modbus TCP : 표준 Modbus TCP (워드/비트 구분 있음)
 *
 * 엔드포인트 구조:
 *   - /plc/xxx        : default PLC 1대 전용 (하위 호환용)
 *   - /plc/xxx/{id}   : tb_plc 테이블에 등록된 PLC를 id로 지정
 */
@Controller
@RequestMapping("/plc")
public class PlcController {

    /** C# API 서버 주소 (같은 서버에서 포트 5050으로 실행 중) */
    private static final String CSHARP = "http://localhost:5050";

    /** C# API 서버로 HTTP 요청을 보내는 Spring 내장 HTTP 클라이언트 */
    private final RestTemplate rest = new RestTemplate();

    /**
     * MariaDB tb_plc 테이블 조회용 DAO.
     * /plc/dblist 엔드포인트에서 등록된 PLC 목록을 가져올 때 사용.
     */
    @Autowired
    private PlcConfigDao plcConfigDao;


    // ══════════════════════════════════════════════════════════════
    //  페이지
    // ══════════════════════════════════════════════════════════════

    /**
     * PLC 모니터링 화면 반환.
     * GET /plc/PlcReadWrite → PlcReadWrite.jsp
     */
    @RequestMapping(value = "/PlcReadWrite", method = RequestMethod.GET)
    public String page(Model model) {
        return "/monitoring/PlcReadWrite.jsp";
    }


    // ══════════════════════════════════════════════════════════════
    //  기존 엔드포인트 (하위 호환 — default PLC 1대)
    //  C# PlcRegistry의 "default" 인스턴스로 고정 연결됨.
    //  PLC가 1대일 때 또는 기본 PLC에 빠르게 접근할 때 사용.
    // ══════════════════════════════════════════════════════════════

    /**
     * default PLC 워드 읽기.
     * GET /plc/read?start=10000&count=100
     *
     * @param start 읽기 시작 주소 (기본값 10000)
     * @param count 읽을 워드 개수 (1~300, 기본값 100)
     * @return { success, start, values: [숫자배열] }
     *
     * Modbus 주소 범위별 동작:
     *   0x(1~9999)   → 비트 영역이므로 에러 발생, /readBits 사용할 것
     *   1x(10001~)   → 비트 영역이므로 에러 발생, /readBits 사용할 것
     *   3x(30001~)   → FC04 Input Register 읽기
     *   4x(40001~)   → FC03 Holding Register 읽기
     *   RAW(0~)      → FC03 Holding Register offset 읽기
     */
    @RequestMapping(value = "/read", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> read(
            @RequestParam(value = "start", defaultValue = "10000") int start,
            @RequestParam(value = "count", defaultValue = "100")   int count) {

        if (count < 1)   count = 1;
        if (count > 300) count = 300;

        String url = CSHARP + "/api/plc/read?start=" + start + "&count=" + count;
        System.out.println(">>> [READ] " + url);
        try {
            Map<?, ?> res = rest.getForObject(url, Map.class);
            System.out.println(">>> [READ OK] " + res);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.out.println(">>> [READ ERR] " + e.getMessage());
            return errFromCsharp(e);
        }
    }

    /**
     * default PLC 워드 쓰기.
     * POST /plc/write
     * Body: { "address": 10000, "value": 123 }
     *
     * @param body address(주소), value(쓸 값 0~65535)
     * @return { success: true } 또는 { success: false, error: "..." }
     *
     * Modbus일 경우 4x(40001~) 또는 RAW 주소만 가능.
     * 비트 영역(0x/1x)에 쓰려면 /writeBit 사용할 것.
     */
    @RequestMapping(value = "/write", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> write(@RequestBody Map<String, Integer> body) {
        System.out.println(">>> [WRITE] addr=" + body.get("address") + " <- " + body.get("value"));
        try {
            Map<?, ?> res = postJson(CSHARP + "/api/plc/write", body);
            System.out.println(">>> [WRITE OK] " + res);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.out.println(">>> [WRITE ERR] " + e.getMessage());
            return errFromCsharp(e);
        }
    }

    /**
     * default PLC 접속 설정 조회.
     * GET /plc/config
     *
     * @return { ip, port, plcType, label }
     */
    @RequestMapping(value = "/config", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> getConfig() {
        try {
            return ResponseEntity.ok(rest.getForObject(CSHARP + "/api/plc/config", Map.class));
        } catch (Exception e) { return errFromCsharp(e); }
    }

    /**
     * default PLC 접속 설정 변경.
     * POST /plc/config
     * Body: { "ip": "192.168.1.10", "port": 2004, "plcType": "LS", "label": "1호기" }
     *
     * plcType 허용값: "LS" | "MITSUBISHI" | "MODBUS_TCP"
     * 서버 재시작 없이 접속 대상 PLC를 바꿀 때 사용.
     */
    @RequestMapping(value = "/config", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> setConfig(@RequestBody Map<String, Object> body) {
        System.out.println(">>> [CONFIG] " + body);
        try {
            return ResponseEntity.ok(postJson(CSHARP + "/api/plc/config", body));
        } catch (Exception e) { return errFromCsharp(e); }
    }

    /**
     * default PLC TCP 연결 테스트 (ping).
     * GET /plc/ping
     *
     * @return { success: true, message: "192.168.1.10:2004 connected" }
     *         연결 실패 시 { success: false, message: "..." }
     */
    @RequestMapping(value = "/ping", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> ping() {
        try {
            return ResponseEntity.ok(rest.getForObject(CSHARP + "/api/plc/ping", Map.class));
        } catch (Exception e) { return errFromCsharp(e); }
    }


    // ══════════════════════════════════════════════════════════════
    //  다중 PLC — tb_plc 테이블에 등록된 PLC를 id로 구분
    //  URL의 {id} = tb_plc.plc_id (PK)
    //  C#이 plc_id로 DB 조회 → plcType 확인 → 해당 프로토콜로 통신
    // ══════════════════════════════════════════════════════════════

    /**
     * MariaDB tb_plc 테이블에서 PLC 목록 조회 (enabled=1만).
     * GET /plc/dblist
     *
     * 화면의 PLC 선택 드롭다운을 채울 때 사용.
     * /plc/list 와 달리 Java가 직접 DB에서 읽어옴 (C# 거치지 않음).
     *
     * @return { success: true, data: [ {plcId, ip, port, plcType, label}, ... ] }
     */
    @RequestMapping(value = "/dblist", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> dbList() {
        try {
            List<PlcConfig> list = plcConfigDao.selectAll();
            Map<String, Object> r = new HashMap<>();
            r.put("success", true);
            r.put("data", list);
            return ResponseEntity.ok(r);
        } catch (Exception e) {
            return err("DB 조회 실패: " + e.getMessage());
        }
    }

    /**
     * C# 메모리에 올라온 PLC 목록 조회.
     * GET /plc/list
     *
     * C# PlcRepository(= tb_plc)에 등록된 PLC 전체를 반환.
     * /dblist 와 데이터 출처는 같지만 C# 서버를 통해 가져옴.
     *
     * @return [ {id, ip, port, plcType, label, enabled}, ... ]
     */
    @RequestMapping(value = "/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> list() {
        try {
            return ResponseEntity.ok(rest.getForObject(CSHARP + "/api/plc/list", Object.class));
        } catch (Exception e) { return errFromCsharp(e); }
    }

    /**
     * 새 PLC 등록.
     * POST /plc/add
     * Body: { "id":"ls1", "ip":"192.168.1.10", "port":2004, "plcType":"LS", "label":"1호기" }
     *
     * C#이 tb_plc 테이블에 INSERT(또는 UPDATE)하고 메모리에도 등록.
     * 이후 /read/ls1, /write/ls1 등 id 기반 엔드포인트로 접근 가능.
     *
     * plcType 기본 포트: LS=2004, MITSUBISHI=6004, MODBUS_TCP=502
     */
    @RequestMapping(value = "/add", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> add(@RequestBody Map<String, Object> body) {
        System.out.println(">>> [ADD] " + body);
        try {
            return ResponseEntity.ok(postJson(CSHARP + "/api/plc/add", body));
        } catch (Exception e) { return errFromCsharp(e); }
    }

    /**
     * 등록된 PLC 삭제.
     * DELETE /plc/remove/{id}
     *
     * C#이 tb_plc 테이블에서 해당 id 행을 삭제하고 메모리에서도 제거.
     * 이후 해당 id로 read/write 요청 시 "PLC not found" 에러 반환.
     *
     * @param id 삭제할 PLC의 plc_id (예: "ls1", "mits1")
     */
    @RequestMapping(value = "/remove/{id}", method = RequestMethod.DELETE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> remove(@PathVariable String id) {
        System.out.println(">>> [REMOVE] " + id);
        try {
            rest.delete(CSHARP + "/api/plc/remove/" + id);
            Map<String, Object> r = new HashMap<>();
            r.put("success", true);
            return ResponseEntity.ok(r);
        } catch (Exception e) { return errFromCsharp(e); }
    }

    /**
     * 특정 PLC 워드 읽기.
     * GET /plc/read/{id}?start=10000&count=100
     *
     * C#이 plc_id로 tb_plc 조회 → plcType 확인 → 해당 프로토콜로 읽기.
     *   LS        → FEnet으로 D레지스터 읽기
     *   MITSUBISHI → MC 3E로 D레지스터 읽기
     *   MODBUS_TCP → FC03/FC04로 워드 읽기 (비트 영역이면 에러)
     *
     * @param id    tb_plc.plc_id (예: "ls1", "mits1", "modbus1")
     * @param start 읽기 시작 주소 (기본값 10000)
     * @param count 읽을 워드 개수 (1~300, 기본값 100)
     * @return { success, start, values: [숫자배열] }
     */
    @RequestMapping(value = "/read/{id}", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> readById(
            @PathVariable String id,
            @RequestParam(value = "start",  defaultValue = "10000") int start,
            @RequestParam(value = "count",  defaultValue = "100")   int count,
            @RequestParam(value = "device", defaultValue = "D")     String device) {

        if (count < 1)   count = 1;
        if (count > 960) count = 960;

        String url = CSHARP + "/api/plc/read/" + id + "?start=" + start + "&count=" + count + "&device=" + device;
        System.out.println(">>> [READ/" + id + "] " + url);
        try {
            Map<?, ?> res = rest.getForObject(url, Map.class);
            return ResponseEntity.ok(res);
        } catch (Exception e) { return errFromCsharp(e); }
    }

    /**
     * 특정 PLC 워드 쓰기.
     * POST /plc/write/{id}
     * Body: { "address": 5000, "value": 1 }
     *
     * C#이 plc_id로 tb_plc 조회 → plcType 확인 → 해당 프로토콜로 쓰기.
     *   LS        → FEnet으로 D레지스터 1워드 쓰기
     *   MITSUBISHI → MC 3E로 D레지스터 1워드 쓰기
     *   MODBUS_TCP → FC06(단일 레지스터 쓰기), 실패 시 FC10으로 자동 재시도
     *
     * Modbus 비트 영역(0x/1x Coil)에 쓰려면 /writeBit/{id} 사용할 것.
     *
     * @param id   tb_plc.plc_id
     * @param body address(주소), value(쓸 값 0~65535)
     */
    @RequestMapping(value = "/write/{id}", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> writeById(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        System.out.println(">>> [WRITE/" + id + "] addr=" + body.get("address") + " <- " + body.get("value")
                + (body.get("device") != null ? " device=" + body.get("device") : ""));
        try {
            return ResponseEntity.ok(postJson(CSHARP + "/api/plc/write/" + id, body));
        } catch (Exception e) { return errFromCsharp(e); }
    }

    /**
     * 특정 PLC TCP 연결 테스트 (ping).
     * GET /plc/ping/{id}
     *
     * tb_plc에 등록된 ip:port 로 TCP 소켓 연결을 시도하고 성공 여부를 반환.
     * 실제 PLC 통신은 하지 않고 네트워크 연결 가능 여부만 확인.
     *
     * @param id tb_plc.plc_id
     * @return { success: true, message: "192.168.1.10:2004 connected" }
     */
    @RequestMapping(value = "/ping/{id}", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> pingById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(rest.getForObject(CSHARP + "/api/plc/ping/" + id, Map.class));
        } catch (Exception e) { return errFromCsharp(e); }
    }

    @RequestMapping(value = "/status-all", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> statusAll() {
        try {
            return ResponseEntity.ok(rest.getForObject(CSHARP + "/api/plc/status-all", Object.class));
        } catch (Exception e) { return errFromCsharp(e); }
    }


    // ══════════════════════════════════════════════════════════════
    //  비트 읽기/쓰기 — MODBUS_TCP 전용
    //  Modbus 비트 영역:
    //    0x (1~9999)    : Coil — FC01 읽기 / FC05 쓰기 (읽기+쓰기)
    //    1x (10001~19999): Coil — FC01 읽기 / FC05 쓰기 (읽기+쓰기)
    //    2x (20001~29999): Discrete Input — FC02 읽기 전용
    //  LS/Mitsubishi는 비트 읽기/쓰기 미지원, 호출 시 C#에서 에러 반환.
    // ══════════════════════════════════════════════════════════════

    /**
     * default PLC 비트 읽기.
     * GET /plc/readBits?start=10001&count=100
     *
     * @param start 읽기 시작 주소 (기본값 10001, 0x/1x/2x 비트 주소)
     * @param count 읽을 비트 개수 (1~2000, 기본값 100)
     * @return { success, start, values: [true/false 배열] }
     */
    @RequestMapping(value = "/readBits", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> readBits(
            @RequestParam(value = "start", defaultValue = "10001") int start,
            @RequestParam(value = "count", defaultValue = "100")   int count) {

        if (count < 1)    count = 1;
        if (count > 2000) count = 2000;

        String url = CSHARP + "/api/plc/readBits?start=" + start + "&count=" + count;
        System.out.println(">>> [READ_BITS] " + url);
        try {
            Map<?, ?> res = rest.getForObject(url, Map.class);
            System.out.println(">>> [READ_BITS OK] " + res);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.out.println(">>> [READ_BITS ERR] " + e.getMessage());
            return errFromCsharp(e);
        }
    }

    /**
     * default PLC 비트 쓰기 (Coil 전용).
     * POST /plc/writeBit
     * Body: { "address": 10001, "value": true }
     *
     * Modbus FC05 (Write Single Coil) 사용.
     * value=true → 0xFF00, value=false → 0x0000 으로 변환되어 전송됨.
     * 2x Discrete Input 주소는 읽기 전용이므로 에러 반환.
     *
     * @param body address(0x/1x Coil 주소), value(true/false)
     */
    @RequestMapping(value = "/writeBit", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> writeBit(@RequestBody Map<String, Object> body) {
        System.out.println(">>> [WRITE_BIT] addr=" + body.get("address") + " <- " + body.get("value"));
        try {
            Map<?, ?> res = postJson(CSHARP + "/api/plc/writeBit", body);
            System.out.println(">>> [WRITE_BIT OK] " + res);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.out.println(">>> [WRITE_BIT ERR] " + e.getMessage());
            return errFromCsharp(e);
        }
    }

    /**
     * 특정 PLC 비트 읽기.
     * GET /plc/readBits/{id}?start=10001&count=100
     *
     * @param id     tb_plc.plc_id (MODBUS_TCP 또는 MITSUBISHI 타입)
     * @param start  읽기 시작 주소 (기본값 10001)
     * @param count  읽을 비트 개수 (1~2000, 기본값 100)
     * @param device 미쓰비시 비트 디바이스 (M/L/X/Y/B 등, 기본값 "M"). Modbus는 무시됨.
     * @return { success, start, values: [true/false 배열] }
     */
    @RequestMapping(value = "/readBits/{id}", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> readBitsById(
            @PathVariable String id,
            @RequestParam(value = "start",  defaultValue = "10001") int start,
            @RequestParam(value = "count",  defaultValue = "100")   int count,
            @RequestParam(value = "device", defaultValue = "M")     String device) {

        if (count < 1)    count = 1;
        if (count > 2000) count = 2000;

        String url = CSHARP + "/api/plc/readBits/" + id + "?start=" + start + "&count=" + count + "&device=" + device;
        System.out.println(">>> [READ_BITS/" + id + "] " + url);
        try {
            Map<?, ?> res = rest.getForObject(url, Map.class);
            return ResponseEntity.ok(res);
        } catch (Exception e) { return errFromCsharp(e); }
    }

    /**
     * 특정 PLC 비트 쓰기 (Coil 전용).
     * POST /plc/writeBit/{id}
     * Body: { "address": 10001, "value": true }
     *
     * @param id   tb_plc.plc_id (MODBUS_TCP 타입만 동작)
     * @param body address(0x/1x Coil 주소), value(true/false)
     */
    @RequestMapping(value = "/writeBit/{id}", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> writeBitById(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        System.out.println(">>> [WRITE_BIT/" + id + "] addr=" + body.get("address") + " <- " + body.get("value"));
        try {
            return ResponseEntity.ok(postJson(CSHARP + "/api/plc/writeBit/" + id, body));
        } catch (Exception e) { return errFromCsharp(e); }
    }


    // ══════════════════════════════════════════════════════════════
    //  내부 유틸 메서드
    // ══════════════════════════════════════════════════════════════

    /**
     * 에러 응답 생성 헬퍼.
     * 모든 엔드포인트에서 예외 발생 시 동일한 형태로 반환.
     *
     * @param msg 에러 메시지
     * @return { success: false, error: "메시지" }
     */
    private ResponseEntity<?> err(String msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("success", false);
        m.put("error", msg);
        return ResponseEntity.ok(m);
    }

    /**
     * C# API 호출 실패 시 HTTP 상태/응답 본문을 최대한 포함해 반환.
     * 프론트에서 왜 실패했는지 바로 확인할 수 있도록 디버깅 정보를 보강한다.
     */
    private ResponseEntity<?> errFromCsharp(Exception e) {
        if (e instanceof RestClientResponseException) {
            RestClientResponseException re = (RestClientResponseException) e;
            String body = re.getResponseBodyAsString();
            if (body != null) {
                body = body.replaceAll("\\s+", " ").trim();
                if (body.length() > 600) body = body.substring(0, 600) + "...";
            }
            String msg = "C# API HTTP " + re.getRawStatusCode() + " " + re.getStatusText()
                    + (body != null && !body.isEmpty() ? " | body: " + body : "");
            System.out.println(">>> [C# ERR] " + msg);
            return err(msg);
        }
        String msg = "C# API 연결 실패: " + e.getMessage();
        System.out.println(">>> [C# ERR] " + msg);
        return err(msg);
    }

    /**
     * JSON POST 요청 헬퍼.
     * Content-Type: application/json 헤더를 붙여 C# API 서버로 POST 전송.
     *
     * @param url  요청 대상 URL (C# API 서버 주소)
     * @param body 요청 바디 (Map 또는 POJO → Jackson이 JSON으로 직렬화)
     * @return C# 서버의 응답 JSON (Map 형태)
     */
    private Map<?, ?> postJson(String url, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return rest.exchange(url, HttpMethod.POST, entity, Map.class).getBody();
    }
}
