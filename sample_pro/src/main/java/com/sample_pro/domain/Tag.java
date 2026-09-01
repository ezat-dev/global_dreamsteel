package com.sample_pro.domain;

// folders_tags 1행 — TAG MANAGE(TagWorkPage.jsp)/TAG MONITOR(TagMonitorPage.jsp)가 공유하는 모델.
// 리뉴얼 전에는 value/quality/timestamp를 이 테이블에 직접 들고 있었지만, 실시간값은 이제 C#
// LiveTagMonitorService가 메모리에서 관리하므로(TagController.liveValues 참고) 여기서는 완전히 뺐다.
public class Tag {

    private int    id;
    private int    folderId;
    private String name;
    private String address;   // 디바이스영역+주소 (예: D100, M200)
    private String type;      // BIT | WORD
    private String plcId;     // tb_plc.plc_id 참조 — plcType/ip/port는 tb_plc에서 조회
    private String plcType;   // 목록 조회 시 tb_plc와 JOIN해서 채워지는 값 (읽기 전용, DB 컬럼 아님)
    private int    enabled;
    private String createdAt;
    private String updatedAt;

    public int    getId()        { return id; }
    public int    getFolderId()  { return folderId; }
    public String getName()      { return name; }
    public String getAddress()   { return address; }
    public String getType()      { return type; }
    public String getPlcId()     { return plcId; }
    public String getPlcType()   { return plcType; }
    public int    getEnabled()   { return enabled; }
    public String getCreatedAt() { return createdAt; }
    public String getUpdatedAt() { return updatedAt; }

    public void setId(int id)               { this.id = id; }
    public void setFolderId(int folderId)   { this.folderId = folderId; }
    public void setName(String name)        { this.name = name; }
    public void setAddress(String address)  { this.address = address; }
    public void setType(String type)        { this.type = type; }
    public void setPlcId(String plcId)      { this.plcId = plcId; }
    public void setPlcType(String plcType)  { this.plcType = plcType; }
    public void setEnabled(int enabled)     { this.enabled = enabled; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
