package com.mes.controller.scada;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mes.common.config.SessionConfig;
import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
import com.mes.common.response.ApiResponse;
import com.mes.domain.scada.ScadaAlarm;
import com.mes.domain.scada.ScadaSetting;
import com.mes.domain.scada.ScadaTrend;
import com.mes.domain.scada.ScadaUser;
import com.mes.service.scada.AlarmFileStorage;
import com.mes.service.scada.ScadaService;
import com.mes.service.scada.TrendFileStorage;

import jakarta.servlet.http.HttpSession;

/**
 * SCADA(HMI) 화면 REST 엔드포인트.
 *
 * <p>
 * MES 화면(BaseController 등)과 DB가 다르다 — 이쪽은 global_dream 스키마만 본다.
 * 화면이 늘어나도(구동/연소/온도제어/…) 이 컨트롤러 하나에 모으고, 실제 로직은
 * {@link ScadaService}에 위임만 한다.
 * </p>
 */
@RestController
@RequestMapping("/api/scada")
public class ScadaController {

    @Autowired
    private ScadaService scadaService;

    /** 세션을 보는 API는 전부 sessionConfig.requireLogin으로 확인한다 — 로그인 여부와 유지시간을 같이 본다. */
    @Autowired
    private SessionConfig sessionConfig;

    /** 알람 첨부 파일 폴더 — 내려받기에서 저장 이름을 실제 경로로 바꾸는 데 쓴다 */
    @Autowired
    private AlarmFileStorage alarmFileStorage;

    /** 트렌드 화면 [엑셀 받기]·[트렌드 저장]의 서버 사본 폴더 */
    @Autowired
    private TrendFileStorage trendFileStorage;

    // ===================== 로그인 =====================

    /**
     * SCADA 로그인 화면에서 호출한다.
     *
     * <p>
     * 세션/토큰 발급은 아직 없다. 성공하면 사용자 정보만 반환하고, 프론트엔드가 이를
     * 브라우저에 보관해 로그인 상태를 유지한다(MES 로그인과 같은 방식).
     * </p>
     *
     * @param param userId, userPassword
     * @return 로그인한 사용자(id, userId, userName — 비밀번호 제외)
     */
    // 로그인
    @PostMapping("/login")
    public ApiResponse<ScadaUser> login(@RequestBody ScadaUser param, HttpSession session) {
        if (param == null
                || param.getUserPassword() == null || param.getUserPassword().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "비밀번호를 입력해주세요.");
        }
        ScadaUser data = scadaService.getUser(param);
        session.setAttribute("loginId", data.getId()); // pk
        session.setAttribute("loginUserName", data.getUserName()); // 로그인 이름
        session.setAttribute("loginUserRole", data.getUserRole()); // 로그인 권한
        session.setAttribute("loginAt", System.currentTimeMillis()); // 로그인 시간

        return ApiResponse.success(data);
    }

    // ===================== 경보이력 =====================

    /**
     * 경보이력 목록 조회.
     *
     * <p>
     * 조회 조건은 쿼리스트링으로 받는다. GET에는 바디를 실을 수 없어(브라우저가 버린다)
     * {@code @RequestBody} 대신 {@code @ModelAttribute}를 쓴다 — {@code ?alarmStatus=발생}
     * 같은 파라미터가 {@link ScadaAlarm}의 같은 이름 필드에 담긴다.
     * </p>
     *
     * @param param 조회 조건(비어 있으면 전체)
     */
    // 알람 목록 조회
    @GetMapping("/getAlarmList")
    public ApiResponse<List<ScadaAlarm>> getAlarmList(@ModelAttribute ScadaAlarm scadaAlarm) {
        return ApiResponse.success(scadaService.getAlarmList(scadaAlarm));
    }

    // 트렌드 조회
    @GetMapping("/getTrend")
    public ApiResponse<List<ScadaTrend>> getTrend(@ModelAttribute ScadaTrend scadaTrend) {
        return ApiResponse.success(scadaService.getTrend(scadaTrend));
    }

    // 로그 리스트 조회
    @GetMapping("/getLogList")
    public ApiResponse<List<ScadaAlarm>> getLogList(@ModelAttribute ScadaAlarm scadaAlarm) {
        return ApiResponse.success(scadaService.getLogList(scadaAlarm));
    }

    // 사용자 추가
    @PostMapping("/insertUser")
    public ResponseEntity<ApiResponse<Boolean>> insertUser(@RequestBody ScadaUser scadaUser) {
        if (scadaService.getId(scadaUser) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("COMMON_409", "중복된 비밀번호 입니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(scadaService.insertUser(scadaUser)));
    }

    // 사용자 정보 조회
    @GetMapping("/getUserList")
    public ApiResponse<List<ScadaUser>> getUserList(@ModelAttribute ScadaUser scadaUser) {
        return ApiResponse.success(scadaService.getUserList(scadaUser));
    }

    // 사용자 수정
    @PostMapping("/updateUser")
    public ResponseEntity<ApiResponse<Boolean>> updateUser(@RequestBody ScadaUser scadaUser) {
        if (scadaService.getId(scadaUser) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("COMMON_409", "중복된 비밀번호 입니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(scadaService.updateUser(scadaUser)));
    }

    // 알람 태그 리스트 조회
    @GetMapping("/getAlarmTagList")
    public ApiResponse<List<ScadaAlarm>> getAlarmTagList(@ModelAttribute ScadaAlarm scadaAlarm) {
        return ApiResponse.success(scadaService.getAlarmTagList(scadaAlarm));
    }

    /**
     * 태그에 값 쓰기 + 제어 로그 기록.
     *
     * <p>
     * 프론트엔드는 값 <b>읽기</b>는 C#(PlcApiServer)을 직접 호출하지만 <b>쓰기</b>는 여기를
     * 거친다 — C#은 로그인한 사용자가 누군지 모르기 때문이다(세션은 여기 있다). 누가 무엇을
     * 바꿨는지 scada_log에 남겨야 하므로, 사용자를 아는 쪽이 쓰기를 수행하고 그 자리에서
     * 기록한다. 프론트가 쓰고 나서 따로 로그 요청을 보내는 방식이면, 쓰기는 나갔는데 로그
     * 요청이 실패하는 경우에 기록이 비어 버린다.
     * </p>
     *
     * <p>
     * 여기서는 세션의 사용자를 param에 담는 일만 한다. C# 호출과 로그 기록은
     * {@link ScadaService#writeTag}가 한 덩어리로 처리한다 — 컨트롤러에서 두 번 나눠
     * 부르면 다른 화면이 쓰기를 호출할 때 그 순서를 또 적어야 하고, 한 곳에서 빼먹으면
     * 로그가 조용히 안 남는다.
     * </p>
     *
     * @param scadaUser folderId, tagName, sendValue, writeLog
     *                  (writeLog=false는 momentary 버튼을 뗄 때 나가는 0 — 사람이 한 조작이
     *                  아니라 누름의 자동 해제라서 기록하지 않는다)
     */
    // 태그에 값 쓰기
    @PostMapping("/writeTag")
    public ResponseEntity<ApiResponse<Boolean>> writeTag(@RequestBody ScadaUser scadaUser,
            HttpSession session) {
        /*
         * 세션이 없거나 로그인 유지시간이 지났으면 PLC에 값을 보내기 전에 막는다.
         * 안 막으면 순서가 이렇게 된다: user_name이 null인 채로 C#에 값을 쓰고,
         * 그 뒤 scada_log INSERT가 실패한다 — 설비는 이미 움직였는데 기록은 없다.
         *
         * application.yml에서 톰캣 만료를 없애고(timeout: -1) 정상 종료 시 복원되게 해뒀지만
         * (persistent: true), 강제 종료나 첫 기동에는 세션이 없다.
         * 조작 기록이 비는 것보다는 거부가 낫다.
         *
         * 예외는 모멘터리 버튼을 뗄 때 나가는 0(writeLog=false, 값 0)이다 — 로그인은 확인하되
         * 유지시간은 보지 않는다. 1을 보낸 뒤 손을 떼기 전에 시간이 다 되면 그 0이 막혀
         * PLC 비트가 1로 남기 때문이다. 화면도 그 0을 보낼 때까지 로그인 화면으로 넘어가지
         * 않고 기다린다(프론트 pressGuard).
         */
        boolean isRelease = Boolean.FALSE.equals(scadaUser.getWriteLog())
                && "0".equals(scadaUser.getSendValue());
        sessionConfig.requireLogin(session, isRelease);

        /*
         * 로그에 남길 사람. 세션에만 있는 값이라 여기서 담아 넘긴다 —
         * 프론트가 보낸 값을 쓰면 아무 이름으로나 기록을 남길 수 있다.
         */
        scadaUser.setUserName((String) session.getAttribute("loginUserName"));
        return ResponseEntity.ok(ApiResponse.success(scadaService.writeTag(scadaUser)));
    }

    // 트렌드 메모 조회
    @GetMapping("/getTrendMemoList")
    public ApiResponse<List<ScadaTrend>> getTrendMemoList(@ModelAttribute ScadaTrend scadaTrend) {
        return ApiResponse.success(scadaService.getTrendMemoList(scadaTrend));
    }

    /*
     * 트렌드 메모 저장
     *
     * 남긴 사람은 세션에서 채운다 — 프론트가 보낸 값을 쓰면 아무 이름으로나 남길 수 있다.
     *
     * tc_user_code는 int(11)이고 기존 데이터도 scada_user.id가 들어 있다. 그래서
     * loginUserId("admin")가 아니라 loginId(PK)를 넣는다. 아이디 문자열을 넣으면
     * sql_mode에 STRICT_TRANS_TABLES가 걸려 있어 0으로 들어가는 게 아니라 INSERT가 터진다.
     * loginId는 Long이라 형변환이 아니라 String.valueOf로 담는다.
     */
    @PostMapping("/insertTrendMemo")
    public ResponseEntity<ApiResponse<Boolean>> insertTrendMemo(@RequestBody ScadaTrend scadaTrend,
            HttpSession session) {
        sessionConfig.requireLogin(session);
        scadaTrend.setTcUserCode(String.valueOf(session.getAttribute("loginId")));
        scadaTrend.setTcUserName((String) session.getAttribute("loginUserName"));
        return ResponseEntity.ok(ApiResponse.success(scadaService.insertTrendMemo(scadaTrend)));
    }

    /*
     * 트렌드 메모 수정
     *
     * 작성자(tc_user_code/tc_user_name)는 넘기지 않는다 — 그 칸은 '누가 남겼는지'라서
     * 고친 사람으로 덮으면 원래 남긴 사람을 잃는다. 쿼리도 그 두 칸은 건드리지 않는다.
     */
    @PostMapping("/updateTrendMemo")
    public ResponseEntity<ApiResponse<Boolean>> updateTrendMemo(@RequestBody ScadaTrend scadaTrend,
            HttpSession session) {
        sessionConfig.requireLogin(session);
        scadaTrend.setTcUserCode(String.valueOf(session.getAttribute("loginId")));
        scadaTrend.setTcUserName((String) session.getAttribute("loginUserName"));
        return ResponseEntity.ok(ApiResponse.success(scadaService.updateTrendMemo(scadaTrend)));
    }

    // 트렌드 메모 삭제
    @PostMapping("/deleteTrendMemo")
    public ResponseEntity<ApiResponse<Boolean>> deleteTrendMemo(@RequestBody ScadaTrend scadaTrend) {
        return ResponseEntity.ok(ApiResponse.success(scadaService.deleteTrendMemo(scadaTrend)));
    }

    // 로그인 세션 확인 — 화면 이동 때와 5초마다 불린다. 로그인 유지시간도 여기서 걸린다.
    @GetMapping("/checkSession")
    public ApiResponse<Boolean> checkSession(HttpSession session) {
        sessionConfig.requireLogin(session);
        return ApiResponse.success(true);
    }

    // 세팅값 조회
    @GetMapping("/getSettingList")
    public ApiResponse<List<ScadaSetting>> getSettingList(HttpSession session,
            @ModelAttribute ScadaSetting scadaSetting) {
        sessionConfig.requireLogin(session);
        return ApiResponse.success(scadaService.getSettingList(scadaSetting));
    }

    // 세팅값 수정
    @PostMapping("/updateSetting")
    public ResponseEntity<ApiResponse<Boolean>> updateSetting(@RequestBody ScadaSetting scadaSetting,
            HttpSession session) {
        sessionConfig.requireLogin(session);
        if ("hold_ms".equals(scadaSetting.getSettingKey())) {
            int ms;
            try {
                ms = Integer.parseInt(scadaSetting.getSettingValue());
            } catch (NumberFormatException e) {
                throw new BusinessException(ErrorCode.INVALID_PARAMETER, "누름 시간은 숫자여야 합니다.");
            }
            if (ms < 0 || ms > 5000) {
                throw new BusinessException(ErrorCode.INVALID_PARAMETER, "누름 시간은 0~5초 사이여야 합니다.");
            }
        }
        // 로그인 유지시간(분). 0 = 무제한, 최대 24시간
        if ("session_limit_min".equals(scadaSetting.getSettingKey())) {
            int min;
            try {
                min = Integer.parseInt(scadaSetting.getSettingValue());
            } catch (NumberFormatException e) {
                throw new BusinessException(ErrorCode.INVALID_PARAMETER, "로그인 유지 시간은 숫자여야 합니다.");
            }
            if (min < 0 || min > 1440) {
                throw new BusinessException(ErrorCode.INVALID_PARAMETER, "로그인 유지 시간은 0~24시간 사이여야 합니다.");
            }
        }
        scadaSetting.setUpdateUser((String) session.getAttribute("loginUserName"));
        return ResponseEntity.ok(ApiResponse.success(scadaService.updateSetting(scadaSetting)));
    }

    // 트렌트 범위 조회
    @GetMapping("/getTrendRangeList")
    public ApiResponse<List<ScadaTrend>> getTrendRangeList(HttpSession session,
            @ModelAttribute ScadaTrend scadaTrend) {
        sessionConfig.requireLogin(session);
        return ApiResponse.success(scadaService.getTrendRangeList(scadaTrend));
    }

    // 트렌드 범위 수정
    @PostMapping("/updateTrendRange")
    public ResponseEntity<ApiResponse<Boolean>> updateTrendRange(@RequestBody ScadaTrend scadaTrend,
            HttpSession session) {
        sessionConfig.requireLogin(session);

        // 둘 다 비우면 "기본 범위로 되돌리기"(NULL). 하나만 비우는 건 받지 않는다
        String min = scadaTrend.getTrendMin();
        String max = scadaTrend.getTrendMax();
        boolean reset = (min == null || min.isBlank()) && (max == null || max.isBlank());
        if (reset) {
            scadaTrend.setTrendMin(null);
            scadaTrend.setTrendMax(null);
        } else {
            int lo;
            int hi;
            try {
                lo = Integer.parseInt(min.trim());
                hi = Integer.parseInt(max.trim());
            } catch (RuntimeException e) { // 숫자가 아님, 한쪽만 빔(NullPointerException)
                throw new BusinessException(ErrorCode.INVALID_PARAMETER, "범위는 최소·최대 모두 정수여야 합니다.");
            }
            if (lo >= hi) {
                throw new BusinessException(ErrorCode.INVALID_PARAMETER, "최소는 최대보다 작아야 합니다.");
            }
            // 검사한 값 그대로 저장한다 — 받은 문자열(" 1200 " 등)을 넘기면 공백째 int 컬럼에 들어간다
            scadaTrend.setTrendMin(String.valueOf(lo));
            scadaTrend.setTrendMax(String.valueOf(hi));
        }
        return ResponseEntity.ok(ApiResponse.success(scadaService.updateTrendRange(scadaTrend)));
    }

    // ===================== 알람 설명·첨부 파일 (알람화면 설명창) =====================

    /** 설명 칸(tb_alarm_tag.alarm_desc)이 VARCHAR(255)다 — 칸을 늘리면 이 숫자도 같이 고친다 */
    private static final int ALARM_DESC_MAX = 255;

    /*
     * 알람 설명 저장.
     *
     * 로그인을 확인한다 — 다른 저장 API와 같다. 길이는 여기서 먼저 막는다: DB에 넘기면
     * STRICT 모드라 잘리지 않고 오류가 나는데, 그 오류는 "이미 존재하거나 참조 중인 데이터"라는
     * 엉뚱한 안내로 바뀌어 나간다(GlobalExceptionHandler). 칸이 NOT NULL이라 null은 ''로 바꾼다.
     */
    @PostMapping("/updateAlarmDesc")
    public ResponseEntity<ApiResponse<Boolean>> updateAlarmDesc(@RequestBody ScadaAlarm scadaAlarm,
            HttpSession session) {
        sessionConfig.requireLogin(session);
        String desc = scadaAlarm.getAlarmDesc() == null ? "" : scadaAlarm.getAlarmDesc();
        if (desc.length() > ALARM_DESC_MAX) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "설명은 255자까지 쓸 수 있습니다.");
        }
        scadaAlarm.setAlarmDesc(desc);
        return ResponseEntity.ok(ApiResponse.success(scadaService.updateAlarmDesc(scadaAlarm)));
    }

    /*
     * 알람 파일 올리기 — multipart로 tagId, kind(pdf/img), file.
     * 같은 종류의 파일이 이미 있으면 바꾼다(옛 파일은 폴더에서 지운다). 크기 한도는
     * application.yml의 spring.servlet.multipart(20MB) — 넘으면 GlobalExceptionHandler가 안내한다.
     */
    @PostMapping("/uploadAlarmFile")
    public ResponseEntity<ApiResponse<ScadaAlarm>> uploadAlarmFile(@RequestParam("tagId") String tagId,
            @RequestParam("kind") String kind, @RequestParam("file") MultipartFile file,
            HttpSession session) {
        sessionConfig.requireLogin(session);
        return ResponseEntity.ok(ApiResponse.success(scadaService.uploadAlarmFile(tagId, kind, file)));
    }

    // 알람 파일 지우기 — { tagId, kind }
    @PostMapping("/deleteAlarmFile")
    public ResponseEntity<ApiResponse<Boolean>> deleteAlarmFile(@RequestBody ScadaAlarm scadaAlarm,
            HttpSession session) {
        sessionConfig.requireLogin(session);
        return ResponseEntity.ok(ApiResponse.success(scadaService.deleteAlarmFile(scadaAlarm)));
    }

    /*
     * 알람 파일 내려주기 — ?tagId=&kind=
     *
     * 화면에서 <img src>와 새 탭(PDF)으로 바로 연다. 그래서 첨부(attachment)가 아니라
     * inline으로 내려 브라우저가 그 자리에서 보여 주게 한다. 이름은 원래 이름(한글 포함)을
     * filename*=UTF-8''… 꼴로 실어, 새 탭에서 저장할 때 그 이름이 된다.
     *
     * 화면이 주소 뒤에 저장 이름(&v=…)을 붙여 부르므로, 파일을 바꾸면 주소가 바뀌어
     * 브라우저가 옛 파일을 캐시에서 꺼내 보여 주지 않는다.
     */
    @GetMapping("/alarmFile")
    public ResponseEntity<Resource> getAlarmFile(@RequestParam("tagId") String tagId,
            @RequestParam("kind") String kind, HttpSession session) {
        sessionConfig.requireLogin(session);
        AlarmFileStorage.checkKind(kind);
        ScadaAlarm info = scadaService.getAlarmFileInfo(tagId);
        boolean pdf = AlarmFileStorage.KIND_PDF.equals(kind);
        String stored = pdf ? info.getPdfFile() : info.getImgFile();
        String name = pdf ? info.getPdfName() : info.getImgName();
        if (stored == null || stored.isBlank()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "올린 파일이 없습니다.");
        }
        Path path = alarmFileStorage.resolve(stored);
        if (!Files.isRegularFile(path)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(AlarmFileStorage.contentTypeOf(stored)))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(name == null || name.isBlank() ? stored : name,
                                StandardCharsets.UTF_8).build().toString())
                .body(new FileSystemResource(path));
    }

    // ===================== 트렌드 파일 서버 사본 =====================

    /*
     * 트렌드 화면에서 누른 PC로 내려받은 파일을 서버 폴더에도 한 부 남긴다 — multipart로 kind, file.
     *   kind=excel → scada.trend-file.excel-dir([엑셀 받기])
     *   kind=image → scada.trend-file.image-dir([트렌드 저장] PNG)
     * 같은 이름이 있으면 번호를 붙여 저장하므로, 실제로 저장한 이름을 돌려준다.
     * 크기 한도는 알람 첨부와 같은 spring.servlet.multipart(20MB) — 트렌드 엑셀은 30초 간격이라
     * 한 달 치(약 8만 6천 행)도 이보다 훨씬 작다.
     */
    @PostMapping("/saveTrendFile")
    public ResponseEntity<ApiResponse<String>> saveTrendFile(@RequestParam("kind") String kind,
            @RequestParam("file") MultipartFile file, HttpSession session) {
        sessionConfig.requireLogin(session);
        return ResponseEntity.ok(ApiResponse.success(trendFileStorage.save(kind, file)));
    }

}
