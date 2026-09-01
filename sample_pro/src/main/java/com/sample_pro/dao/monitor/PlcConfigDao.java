package com.sample_pro.dao.monitor;

import com.sample_pro.domain.PlcConfig;
import java.util.List;

public interface PlcConfigDao {
    List<PlcConfig> selectAll();
    PlcConfig selectById(String plcId);
}
