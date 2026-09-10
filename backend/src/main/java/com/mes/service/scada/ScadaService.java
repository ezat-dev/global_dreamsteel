package com.mes.service.scada;

import java.util.List;

import com.mes.domain.scada.ScadaAlarm;
import com.mes.domain.scada.ScadaTrend;
import com.mes.domain.scada.ScadaUser;

/**
 * SCADA(HMI) 화면 비즈니스 로직.
 */
public interface ScadaService {

    /**
     * 로그인 — 아이디·비밀번호가 일치하는 사용자를 조회한다.
     * 
     * @param param userId, userPassword
     * @return 로그인한 사용자(비밀번호 제외)
     * @throws com.mes.common.exception.BusinessException 일치하는 사용자가 없을 때
     */
    ScadaUser getUser(ScadaUser param);

    List<ScadaAlarm> getAlarmList(ScadaAlarm scadaAlarm);

    List<ScadaTrend> getTrend(ScadaTrend scadaTrend);

    List<ScadaAlarm> getLogList(ScadaAlarm scadaAlarm);

    boolean insertUser(ScadaUser scadaUser);

    ScadaUser getId(ScadaUser scadaUser);

    List<ScadaUser> getUserList(ScadaUser scadaUser);
    boolean updateUser(ScadaUser scadaUser);
    List<ScadaAlarm> getAlarmTagList(ScadaAlarm scadaAlarm);
    boolean writeTag(ScadaUser scadaUser);
}
