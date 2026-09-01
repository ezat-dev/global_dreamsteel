package com.sample_pro.domain;

public class TempTag {
    private int tempId;
    private String tagName;
    private String address;
    private String plcId;
    private String colName;
    private String trendName;
    private String equipId;
    // 스냅샷 저장 전 raw 값에 적용할 보정식. 맨 앞 1글자가 연산자(+,-,*,/), 나머지가 숫자.
    // 예: "+50"(더하기) "-100"(빼기) "*0.01"(곱하기) "/2"(나누기). null/빈 값이면 raw 그대로 저장.
    // 실제 적용은 C# TempMonitorService.ApplyScaleOne에서 이루어진다.
    private String scale;
    private int enabled;
    private String createdAt;
    private String updatedAt;

    public int getTempId() {
        return tempId;
    }

    public void setTempId(int tempId) {
        this.tempId = tempId;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPlcId() {
        return plcId;
    }

    public void setPlcId(String plcId) {
        this.plcId = plcId;
    }

    public String getColName() {
        return colName;
    }

    public void setColName(String colName) {
        this.colName = colName;
    }

    public String getTrendName() {
        return trendName;
    }

    public void setTrendName(String trendName) {
        this.trendName = trendName;
    }

    public String getEquipId() {
        return equipId;
    }

    public void setEquipId(String equipId) {
        this.equipId = equipId;
    }

    public String getScale() {
        return scale;
    }

    public void setScale(String scale) {
        this.scale = scale;
    }

    public int getEnabled() {
        return enabled;
    }

    public void setEnabled(int enabled) {
        this.enabled = enabled;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
