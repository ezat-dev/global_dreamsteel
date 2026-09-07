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

import com.mes.common.response.ApiResponse;
import com.mes.domain.scada.ScadaAlarm;
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
        session.setAttribute("loginUserId", data.getId());
        session.setAttribute("loginUserName", data.getUserName());
        session.setAttribute("loginUserRole", data.getUserRole());
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
    @GetMapping("/getTrendList")
    public ApiResponse<List<ScadaAlarm>> getTrendList(@ModelAttribute ScadaAlarm scadaAlarm) {
        return ApiResponse.success(scadaService.getTrendList(scadaAlarm));
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
}
