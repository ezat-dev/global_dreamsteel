package com.sample_pro.domain;

public class PlcConfig {
    private String plcId;
    private String ip;
    private int port;
    private String plcType;
    private String label;
    private int enabled;

    public String getPlcId() { return plcId; }
    public void setPlcId(String plcId) { this.plcId = plcId; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }

    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }

    public String getPlcType() { return plcType; }
    public void setPlcType(String plcType) { this.plcType = plcType; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public int getEnabled() { return enabled; }
    public void setEnabled(int enabled) { this.enabled = enabled; }
}
