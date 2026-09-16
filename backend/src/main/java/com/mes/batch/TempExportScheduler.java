package com.mes.batch;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mes.service.scada.TempExportService;

@Component
@ConditionalOnProperty(prefix = "scada.export", name = "enabled", havingValue = "true")
public class TempExportScheduler {

    @Autowired
    private TempExportService tempExportService;

    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Seoul")
    public void daily() {
        tempExportService.export(LocalDate.now().minusDays(1));
    }
}
