package com.sample_pro.domain;

public class TempMemo {
    private int    tcCnt;
    private String tcRegtime;
    private String tcName;
    private String tcDesc;
    private int    tcUserCode;
    private String tcUserName;
    private String tcYn;

    public int    getTcCnt()               { return tcCnt; }
    public void   setTcCnt(int tcCnt)      { this.tcCnt = tcCnt; }
    public String getTcRegtime()           { return tcRegtime; }
    public void   setTcRegtime(String v)   { this.tcRegtime = v; }
    public String getTcName()              { return tcName; }
    public void   setTcName(String v)      { this.tcName = v; }
    public String getTcDesc()              { return tcDesc; }
    public void   setTcDesc(String v)      { this.tcDesc = v; }
    public int    getTcUserCode()          { return tcUserCode; }
    public void   setTcUserCode(int v)     { this.tcUserCode = v; }
    public String getTcUserName()          { return tcUserName; }
    public void   setTcUserName(String v)  { this.tcUserName = v; }
    public String getTcYn()               { return tcYn; }
    public void   setTcYn(String v)        { this.tcYn = v; }
}
