package com.sample_pro.domain;

public class AlarmHistory {
    private long historyId;
    private int tagId;
    private String tagName;
    private String address;
    private String alarmMsg;
    private int level;
    private String plcId;
    private String occurTime;
    private String clearTime;
    private String ackTime;
    private String ackUser;
    private String valueAtOccur;

    public long getHistoryId() { return historyId; }
    public void setHistoryId(long historyId) { this.historyId = historyId; }

    public int getTagId() { return tagId; }
    public void setTagId(int tagId) { this.tagId = tagId; }

    public String getTagName() { return tagName; }
    public void setTagName(String tagName) { this.tagName = tagName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAlarmMsg() { return alarmMsg; }
    public void setAlarmMsg(String alarmMsg) { this.alarmMsg = alarmMsg; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public String getPlcId() { return plcId; }
    public void setPlcId(String plcId) { this.plcId = plcId; }

    public String getOccurTime() { return occurTime; }
    public void setOccurTime(String occurTime) { this.occurTime = occurTime; }

    public String getClearTime() { return clearTime; }
    public void setClearTime(String clearTime) { this.clearTime = clearTime; }

    public String getAckTime() { return ackTime; }
    public void setAckTime(String ackTime) { this.ackTime = ackTime; }

    public String getAckUser() { return ackUser; }
    public void setAckUser(String ackUser) { this.ackUser = ackUser; }

    public String getValueAtOccur() { return valueAtOccur; }
    public void setValueAtOccur(String valueAtOccur) { this.valueAtOccur = valueAtOccur; }
}
