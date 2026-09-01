package com.sample_pro.domain;

public class PagePermission {
    private int    permId;
    private int    empId;
    private String pageUrl;
    private String canView;
    private String canAdd;
    private String canEdit;
    private String canDel;

    public int    getPermId()           { return permId; }
    public void   setPermId(int v)      { this.permId = v; }
    public int    getEmpId()            { return empId; }
    public void   setEmpId(int v)       { this.empId = v; }
    public String getPageUrl()          { return pageUrl; }
    public void   setPageUrl(String v)  { this.pageUrl = v; }
    public String getCanView()          { return canView; }
    public void   setCanView(String v)  { this.canView = v; }
    public String getCanAdd()           { return canAdd; }
    public void   setCanAdd(String v)   { this.canAdd = v; }
    public String getCanEdit()          { return canEdit; }
    public void   setCanEdit(String v)  { this.canEdit = v; }
    public String getCanDel()           { return canDel; }
    public void   setCanDel(String v)   { this.canDel = v; }
}
