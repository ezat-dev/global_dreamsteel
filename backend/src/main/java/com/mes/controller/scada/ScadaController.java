package com.mes.controller.scada;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
import com.mes.common.response.ApiResponse;
import com.mes.domain.scada.ScadaAlarm;
import com.mes.domain.scada.ScadaTrend;
import com.mes.domain.scada.ScadaUser;
import com.mes.service.scada.ScadaService;

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
        ScadaUser data = scadaService.getUser(param);
        session.setAttribute("loginId", data.getId());  //pk
        session.setAttribute("loginUserId", data.getUserId());  //로그인 아이디
        session.setAttribute("loginUserName", data.getUserName());  //로그인 이름
        session.setAttribute("loginUserRole", data.getUserRole());  //로그인 권한
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
                    .body(ApiResponse.error("COMMON_409", "중복된 ID 입니다."));
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
        return ResponseEntity.ok(ApiResponse.success(scadaService.updateUser(scadaUser)));
    }

    //알람 태그 리스트 조회
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
     *                   아니라 누름의 자동 해제라서 기록하지 않는다)
     */
    //태그에 값 쓰기
    @PostMapping("/writeTag")
    public ResponseEntity<ApiResponse<Boolean>> writeTag(@RequestBody ScadaUser scadaUser,
                                                         HttpSession session) {
        /* 로그에 남길 사람. 세션에만 있는 값이라 여기서 담아 넘긴다 —
           프론트가 보낸 값을 쓰면 아무 이름으로나 기록을 남길 수 있다. */
        String userId = (String) session.getAttribute("loginUserId");

        /* 세션이 없으면 PLC에 값을 보내기 전에 막는다.
           안 막으면 순서가 이렇게 된다: user_id가 null인 채로 C#에 값을 쓰고,
           그 뒤 scada_log INSERT가 NOT NULL 위반으로 실패한다 —
           설비는 이미 움직였는데 기록은 없고, 화면에는 원인과 무관한
           "이미 존재하거나 참조 중인 데이터입니다"가 뜬다.

           application.yml에서 만료를 없애고(timeout: -1) 정상 종료 시 복원되게 해뒀지만
           (persistent: true), 강제 종료나 첫 기동에는 세션이 없다.
           조작 기록이 비는 것보다는 거부가 낫다. */
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다. 다시 로그인해주세요.");
        }

        scadaUser.setUserId(userId);
        scadaUser.setUserName((String) session.getAttribute("loginUserName"));
        return ResponseEntity.ok(ApiResponse.success(scadaService.writeTag(scadaUser)));
    }
}
