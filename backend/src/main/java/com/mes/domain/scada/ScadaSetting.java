package com.mes.domain.scada;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@NoArgsConstructor 
public class ScadaSetting {
    private String settingKey;
    private String settingValue;
    private String updateUser;
    private String updateDate;
}
