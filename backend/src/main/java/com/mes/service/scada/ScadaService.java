package com.mes.service.scada;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.mes.domain.scada.ScadaAlarm;
import com.mes.domain.scada.ScadaSetting;
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

    List<ScadaTrend> getTrendMemoList(ScadaTrend scadaTrend);

    boolean insertTrendMemo(ScadaTrend scadaTrend);

    boolean updateTrendMemo(ScadaTrend scadaTrend);

    boolean deleteTrendMemo(ScadaTrend scadaTrend);
    
    String findAddress(ScadaUser scadaUser);

    List<ScadaSetting> getSettingList(ScadaSetting scadaSetting);

    boolean updateSetting(ScadaSetting scadaSetting);

    ScadaSetting getSessionLimitMin(ScadaSetting scadaSetting);

    List<ScadaTrend> getTrendRangeList(ScadaTrend scadaTrend);

    boolean updateTrendRange(ScadaTrend scadaTrend);

    boolean updateAlarmDesc(ScadaAlarm scadaAlarm);

    /**
     * 알람 파일 올리기 — 같은 종류의 옛 파일이 있으면 바꾸고 옛 파일은 폴더에서 지운다.
     *
     * @param tagId 알람(tb_alarm_tag.tag_id)
     * @param kind  "pdf" 또는 "img"
     * @return tagId와 바뀐 두 칸(pdfFile·pdfName 또는 imgFile·imgName)
     */
    ScadaAlarm uploadAlarmFile(String tagId, String kind, MultipartFile file);

    /** 알람 파일 지우기 — tagId, kind. DB 두 칸을 비우고 폴더의 파일도 지운다 */
    boolean deleteAlarmFile(ScadaAlarm scadaAlarm);

    /** 알람 한 개의 파일 칸(저장 이름·원래 이름). 없는 알람이면 BusinessException */
    ScadaAlarm getAlarmFileInfo(String tagId);
}
