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
    private String historyId;
    private String tagId;
    private String tagName; //태그 이름
    private String address; //plc 주소
    private String plcId;
    private String alarmMsg;    //코멘트
    private String level;
    private String occureTime;  //발생시간
    private String clearTime;   //해제시간
    private String ackTime;
    private String ackUser;
    private String valueAtOccur;
    private String durationSec;
    private String occurTimeStr;
    private String clearTimeStr;
    private String occurTime;
    private String folderId;
    private String plcMsg;
    private String enabled;
    private String createdAt;
    private String updatedAt;
    private String lampId;

}
