package com.mes.domain.scada;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 경보이력 — global_dreamsteel 스키마의 {@code alarm_list} 테이블 1행.
 * 조회 조건도 이 클래스로 받는다(요청 전용 클래스를 따로 두지 않는다).
 */
@Data
@NoArgsConstructor
public class ScadaAlarm {

    private String alarmId;
    private String alarmGenerateTime;
    private String alarmStatus;
    private String alarmClearTime;
    private String alarmComment;
    private String alarmTagName;
    private String alarmTime;
    private String startTime;
    private String endTime;
    private String alarmTagValue;

}
