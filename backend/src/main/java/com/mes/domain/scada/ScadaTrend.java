package com.mes.domain.scada;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ScadaTrend {

    private String zone1Pv;
    private String zone2Pv;
    private String zone3Pv;
    private String zone4Pv;
    private String zone5Pv;
    private String zone6Pv;
    private String zone7Pv;
    private String o2Pv;
    private String snapshotId;
    private String recordTime;
    private String startTime;
    private String endTime;
}
