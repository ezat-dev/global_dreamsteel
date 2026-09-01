package com.sample_pro.service.monitor;

import com.sample_pro.domain.AlarmHistory;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class AlarmExportService {

    private static final Logger log = LoggerFactory.getLogger(AlarmExportService.class);

    @Autowired
    private AlarmService alarmService;

    private static final String SAVE_DIR     = "D:\\DATA_BACKUP\\알람 리스트";
    private static final String SAVE_DIR_NET = "Z:\\08-대구사업장\\04-대생\\02 레벨2\\06-설비관리\\통합모니터링 데이터 백업\\알람 리스트";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // 시트명 (Excel 표시용)
    private static final String[] SHEET_NAMES = {
        "BCF_01","BCF_02","BCF_03","BCF_04","BCF_05","BCF_06",
        "BCF_07","BCF_08","BCF_09","BCF_10","BCF_11","BCF_12"
    };
    // DB tb_alarm_history.plc_id 실제 값
    private static final String[] PLC_IDS = {
        "dongwoo_01","dongwoo_02","dongwoo_03","dongwoo_04","dongwoo_05","dongwoo_06",
        "dongwoo_07","dongwoo_08","dongwoo_09","dongwoo_10","dongwoo_11","dongwoo_12"
    };

    private static final String[] HEADERS = {"No","발생시각","설비","태그명","알람내용","발생값","해제시각","상태"};
    private static final int[]    WIDTHS  = {5,   22,       10,   28,     45,       12,     22,       8};

    @Scheduled(cron = "0 53 10 * * *")
    public void exportYesterdayAlarms() {
        String yesterday = LocalDate.now().minusDays(1).format(DATE_FMT);
        log.info("[AlarmExport] 전일({}) 알람 저장 시작", yesterday);

        List<AlarmHistory> all;
        try {
            all = alarmService.getAlarmHistoryRange(yesterday, yesterday);
        } catch (Exception e) {
            log.error("[AlarmExport] 데이터 조회 실패: {}", e.getMessage(), e);
            return;
        }

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            CellStyle headerStyle = buildHeaderStyle(wb);
            CellStyle dataStyle   = buildDataStyle(wb, false);
            CellStyle activeStyle = buildDataStyle(wb, true);

            for (int i = 0; i < PLC_IDS.length; i++) {
                String plcId = PLC_IDS[i];
                List<AlarmHistory> rows = new ArrayList<>();
                for (AlarmHistory h : all) {
                    if (plcId.equals(h.getPlcId())) rows.add(h);
                }
                writeSheet(wb.createSheet(SHEET_NAMES[i]), SHEET_NAMES[i], rows, headerStyle, dataStyle, activeStyle);
            }

            File dir = new File(SAVE_DIR);
            if (!dir.exists()) dir.mkdirs();

            File out = new File(dir, "알람이력_" + yesterday + ".xlsx");
            try (FileOutputStream fos = new FileOutputStream(out)) {
                wb.write(fos);
            }
            log.info("[AlarmExport] 저장 완료: {} (총 {}건)", out.getAbsolutePath(), all.size());
            copyToNetwork(out.toPath(), SAVE_DIR_NET);

        } catch (Exception e) {
            log.error("[AlarmExport] 엑셀 생성 실패: {}", e.getMessage(), e);
        }
    }

    private void writeSheet(Sheet sheet, String equipLabel, List<AlarmHistory> rows,
                            CellStyle headerStyle, CellStyle dataStyle, CellStyle activeStyle) {
        Row hRow = sheet.createRow(0);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell c = hRow.createCell(i);
            c.setCellValue(HEADERS[i]);
            c.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, WIDTHS[i] * 256);
        }

        for (int i = 0; i < rows.size(); i++) {
            AlarmHistory h   = rows.get(i);
            boolean isActive = h.getClearTime() == null || h.getClearTime().isEmpty();
            CellStyle style  = isActive ? activeStyle : dataStyle;
            Row row = sheet.createRow(i + 1);

            cell(row, 0, String.valueOf(i + 1), style);
            cell(row, 1, nv(h.getOccurTime()), style);
            cell(row, 2, equipLabel, style);
            cell(row, 3, nv(h.getTagName()), style);
            cell(row, 4, nv(h.getAlarmMsg()), style);
            cell(row, 5, nv(h.getValueAtOccur()), style);
            cell(row, 6, nv(h.getClearTime()), style);
            cell(row, 7, isActive ? "활성" : "해제", style);
        }
    }

    private void cell(Row row, int col, String val, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(val);
        c.setCellStyle(style);
    }

    private String nv(String s) { return s != null ? s : ""; }

    private void copyToNetwork(Path src, String netDir) {
        try {
            Files.createDirectories(Paths.get(netDir));
            Files.copy(src, Paths.get(netDir, src.getFileName().toString()), StandardCopyOption.REPLACE_EXISTING);
            log.info("[AlarmExport] 네트워크 복사 완료: {}\\{}", netDir, src.getFileName());
        } catch (Exception e) {
            log.warn("[AlarmExport] 네트워크 복사 실패 (로컬 저장은 정상): {}", e.getMessage());
        }
    }

    private CellStyle buildHeaderStyle(Workbook wb) {
        Font f = wb.createFont();
        f.setBold(true);
        f.setColor(IndexedColors.WHITE.getIndex());
        f.setFontHeightInPoints((short) 10);

        CellStyle s = wb.createCellStyle();
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(s, BorderStyle.THIN);
        return s;
    }

    private CellStyle buildDataStyle(Workbook wb, boolean alarm) {
        CellStyle s = wb.createCellStyle();
        if (alarm) {
            s.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        applyBorders(s, BorderStyle.THIN);
        return s;
    }

    private void applyBorders(CellStyle s, BorderStyle b) {
        s.setBorderTop(b); s.setBorderBottom(b);
        s.setBorderLeft(b); s.setBorderRight(b);
    }
}
