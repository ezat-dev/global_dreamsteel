package com.mes.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
import com.mes.domain.scada.ScadaSetting;
import com.mes.service.scada.ScadaService;

import jakarta.servlet.http.HttpSession;

/**
 * 로그인 세션 확인 — 세션을 보는 API는 전부 {@link #requireLogin}을 부른다.
 *
 * <p>
 * 로그인 유지시간(scada_setting의 session_limit_min, 분)은 <b>로그인한 시각부터</b> 센다.
 * 마지막 조작부터 세지 않는 이유는, 화면이 타이머로 자바를 계속 부르기 때문이다
 * (checkSession 5초, getSettingList 30초). 톰캣의 무활동 만료를 쓰면 그 요청들이 시계를
 * 계속 되돌려서 화면을 켜 둔 동안은 영원히 만료되지 않는다.
 * </p>
 *
 * <p>
 * 만료되면 401(COMMON_401)을 던진다 — 프론트의 axiosInstance가 그 코드를 보고 로그인 화면으로
 * 보낸다. 값을 줄이면 이미 로그인해 있는 사람에게도 다음 확인 때 바로 적용된다.
 * </p>
 *
 * <p>
 * <b>만료돼도 세션을 지우지 않는다.</b> 요청마다 시간을 다시 재서 막으므로 쓰는 쪽에서는 지운 것과
 * 같고, 다시 로그인하면 loginAt이 새로 들어가 풀린다. 남겨 두는 이유는 모멘터리 버튼의 "떼는 0"이다 —
 * 1을 보낸 뒤 손을 떼기 전에 시간이 다 되면, 세션을 지운 순간 그 0을 받을 수 없어 PLC 비트가
 * 1로 남는다. 그 0만은 {@link #requireLogin(HttpSession, boolean)}의 allowExpired로 통과시킨다.
 * </p>
 */
@Component
public class SessionConfig {

    private static final Logger log = LoggerFactory.getLogger(SessionConfig.class);

    @Autowired
    private ScadaService scadaService;

    /** 로그인 확인 + 유지시간 확인. 통과 못 하면 401을 던진다. */
    public void requireLogin(HttpSession session) {
        requireLogin(session, false);
    }

    /**
     * @param allowExpired true면 로그인 여부만 보고 유지시간은 보지 않는다. writeTag의 "떼는 0"
     *                     (writeLog=false, 값 0)에만 쓴다 — 시간이 다 됐어도 누르고 있던 비트는
     *                     내려가야 한다.
     */
    public void requireLogin(HttpSession session, boolean allowExpired) {
        if (session.getAttribute("loginId") == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다. 다시 로그인해주세요.");
        }

        Object loginAt = session.getAttribute("loginAt");
        if (!(loginAt instanceof Long)) {
            // 이 기능을 배포하기 전에 로그인한 세션 — 지금을 기준으로 잡는다(배포하자마자 전원을 튕기지 않게)
            session.setAttribute("loginAt", System.currentTimeMillis());
            return;
        }

        if (allowExpired) {
            return;
        }

        long limitMin = sessionLimitMin(); // 0 이하 = 무제한
        if (limitMin > 0 && System.currentTimeMillis() - (Long) loginAt > limitMin * 60_000L) {
            // 세션은 지우지 않는다(클래스 주석 참고) — 다시 로그인할 때까지 이 401이 계속 나간다
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "로그인 유지시간이 지났습니다. 다시 로그인해주세요.");
        }
    }

    /**
     * 로그인 유지시간(분). 못 읽으면 0(무제한)이다.
     *
     * <p>
     * 줄이 없거나(selectOne → null) 숫자가 아니거나 DB 오류면 예외를 던지지 않고 무제한으로 둔다.
     * 여기서 터지면 세션을 보는 API가 전부 500이 된다 — 401이 아니라 로그인 화면으로도 안 가고,
     * 버튼·숫자 입력만 "서버 내부 오류"로 막힌 채 남는다. 설정 문제로 조작이 막히는 것보다
     * 유지시간이 잠시 안 걸리는 편이 낫다.
     * </p>
     */
    private long sessionLimitMin() {
        try {
            // 쿼리가 키를 직접 적고 있어 넘길 조건이 없다
            ScadaSetting setting = scadaService.getSessionLimitMin(null);
            if (setting == null || setting.getSettingValue() == null) {
                return 0;
            }
            return Long.parseLong(setting.getSettingValue().trim());
        } catch (RuntimeException e) {
            log.warn("session_limit_min을 읽지 못해 로그인 유지시간을 무제한으로 둡니다", e);
            return 0;
        }
    }
}
