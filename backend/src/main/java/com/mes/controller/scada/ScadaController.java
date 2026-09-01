package com.mes.controller.scada;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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

/**
 * SCADA(HMI) 화면 REST 엔드포인트.
 *
 * <p>MES 화면(BaseController 등)과 DB가 다르다 — 이쪽은 global_dream 스키마만 본다.
 * 화면이 늘어나도(구동/연소/온도제어/…) 이 컨트롤러 하나에 모으고, 실제 로직은
 * {@link ScadaService}에 위임만 한다.</p>
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
     * <p>세션/토큰 발급은 아직 없다. 성공하면 사용자 정보만 반환하고, 프론트엔드가 이를
     * 브라우저에 보관해 로그인 상태를 유지한다(MES 로그인과 같은 방식).</p>
     *
     * @param param userId, userPassword
     * @return 로그인한 사용자(id, userId, userName — 비밀번호 제외)
     */
    @PostMapping("/login")
    public ApiResponse<ScadaUser> login(@RequestBody ScadaUser param) {
        return ApiResponse.success(scadaService.getUser(param));
    }

    // ===================== 경보이력 =====================

    /**
     * 경보이력 목록 조회.
     *
     * <p>조회 조건은 쿼리스트링으로 받는다. GET에는 바디를 실을 수 없어(브라우저가 버린다)
     * {@code @RequestBody} 대신 {@code @ModelAttribute}를 쓴다 — {@code ?alarmStatus=발생}
     * 같은 파라미터가 {@link ScadaAlarm}의 같은 이름 필드에 담긴다.</p>
     *
     * @param param 조회 조건(비어 있으면 전체)
     */
    @GetMapping("/getAlarmList")
    public ApiResponse<List<ScadaAlarm>> getAlarmList(@ModelAttribute ScadaAlarm scadaAlarm) {
        return ApiResponse.success(scadaService.getAlarmList(scadaAlarm));
    }
}
