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

    /**
     * 조회 건수 상한. 안 주면(null) 전부 내린다 — 경보이력 화면은 그렇게 쓴다.
     *
     * <p>
     * 구동·연소화면은 하단 목록을 5초마다 다시 받기 때문에 최근 것만 필요하고,
     * 행이 쌓인 뒤에도 매번 전체를 내리는 일이 없도록 100을 넘긴다.
     * </p>
     *
     * <p>
     * 여기만 String이 아니라 Integer다. {@code LIMIT #{limit}}은 프리페어드
     * 파라미터로 나가는데, 문자열로 바인딩되면 {@code LIMIT '100'}이 되어 DB가 거부한다.
     * </p>
     */
    private Integer limit;
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
    private String alarmMsgEng;
    private String alarmDesc;

    /*
     * 알람 첨부 파일 — PDF 하나, 사진 하나. 파일마다 두 칸이다.
     *   pdfFile/imgFile : 서버 폴더(scada.alarm-file.dir)에 저장한 이름(UUID). 서버가 정한다.
     *   pdfName/imgName : 사용자가 올린 원래 이름. 내려받을 때 이 이름으로 보여 준다.
     * 빈 문자열이면 파일이 없는 것이다.
     */
    private String pdfFile;
    private String pdfName;
    private String imgFile;
    private String imgName;

    /** 파일 지우기 요청에서만 쓴다 — "pdf" 또는 "img" */
    private String kind;

}
