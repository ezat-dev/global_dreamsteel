package com.sample_pro.domain;

public class AlarmTag {
    private int tagId;
    private int folderId;
    private String tagName;
    private String address;
    private String plcId;
    private String alarmMsg;
    private int level;
    private int enabled;
    private String createdAt;
    private String updatedAt;

    public int getTagId() { return tagId; }
    public void setTagId(int tagId) { this.tagId = tagId; }

    public int getFolderId() { return folderId; }
    public void setFolderId(int folderId) { this.folderId = folderId; }

    public String getTagName() { return tagName; }
    public void setTagName(String tagName) { this.tagName = tagName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPlcId() { return plcId; }
    public void setPlcId(String plcId) { this.plcId = plcId; }

    public String getAlarmMsg() { return alarmMsg; }
    public void setAlarmMsg(String alarmMsg) { this.alarmMsg = alarmMsg; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public int getEnabled() { return enabled; }
    public void setEnabled(int enabled) { this.enabled = enabled; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
