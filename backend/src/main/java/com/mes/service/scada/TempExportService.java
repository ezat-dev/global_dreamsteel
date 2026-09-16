package com.mes.service.scada;

import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.mes.domain.scada.ScadaTrend;

/**
 * 하루치 온도 스냅샷을 엑셀 파일 하나로 내보낸다.
 *
 * <p>
 * 자정마다 도는 {@code TempExportScheduler}가 어제 날짜로 부르지만, 이 클래스 자체는
 * 스케줄과 무관하다 — 날짜만 주면 언제든 다시 만들 수 있다. 서버가 꺼져 있어서 빠진
 * 날을 나중에 손으로 채우거나 화면에 버튼을 붙일 때도 이 메서드를 그대로 쓴다.
 * </p>
 *
 * <p>
 * 화면의 '엑셀 내려받기'(프론트 downloadXlsx.js)와 같은 모양으로 맞춰 둔다 — 열 구성,
 * 단위 표기, 열 폭 계산 규칙이 같다. 한쪽만 바꾸면 사람이 두 파일을 놓고 볼 때 헷갈린다.
 * </p>
 */
@Service
public class TempExportService {

    private static final Logger log = LoggerFactory.getLogger(TempExportService.class);

    /** DB 조회 조건으로 넘길 형식. record_time이 datetime이라 이 형태로 비교된다. */
    private static final DateTimeFormatter QUERY_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /** 파일 이름에 들어가는 날짜 — 저장한 날이 아니라 데이터의 날짜다. */
    private static final DateTimeFormatter FILE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    /*
     * 열 폭의 아래위 한계. 너무 좁으면 제목이 잘리고, 너무 넓으면 한 열이 화면을 다 먹는다.
     * 프론트(downloadXlsx.js)와 같은 값이다.
     */
    private static final int MIN_WIDTH = 8;
    private static final int MAX_WIDTH = 50;

    /**
     * 내보낼 열 하나. number가 true면 숫자로 넣는다 — 문자열로 넣으면 엑셀에서
     * 계산도 그래프도 안 된다.
     *
     * <p>
     * record로 두면 짧지만 이 프로젝트의 나머지 코드가 쓰는 문법 수준을 넘는다.
     * 평범한 클래스로 둔다.
     * </p>
     */
    private static class Column {
        private final String title;
        private final Function<ScadaTrend, String> getter;
        private final boolean number;

        Column(String title, Function<ScadaTrend, String> getter, boolean number) {
            this.title = title;
            this.getter = getter;
            this.number = number;
        }
    }

    /** 화면의 트랜드 그래프와 같은 순서. 제목에 단위를 붙여 파일만 따로 열어도 알아보게 한다. */
    private static final List<Column> COLUMNS = Arrays.asList(
            new Column("시각", ScadaTrend::getRecordTime, false),
            new Column("1ZONE(℃)", ScadaTrend::getZone1Pv, true),
            new Column("2ZONE(℃)", ScadaTrend::getZone2Pv, true),
            new Column("3ZONE(℃)", ScadaTrend::getZone3Pv, true),
            new Column("4ZONE(℃)", ScadaTrend::getZone4Pv, true),
            new Column("5ZONE(℃)", ScadaTrend::getZone5Pv, true),
            new Column("6ZONE(℃)", ScadaTrend::getZone6Pv, true),
            new Column("7ZONE(℃)", ScadaTrend::getZone7Pv, true),
            new Column("O2(mmV)", ScadaTrend::getO2Pv, true));

    @Value("${scada.export.dir}")
    private String exportDir;

    @Autowired
    private ScadaService scadaService; // 기존 getTrend 재사용

    /**
     * 하루치를 파일 하나로 만든다. 같은 이름이 있으면 덮어쓴다 —
     * 다시 돌려도 같은 결과가 나와야 손으로 복구하기 쉽다.
     *
     * @param day 내보낼 날짜(그날 00:00:00 ~ 23:59:59)
     */
    public void export(LocalDate day) {
        /*
         * 스케줄러 스레드로 예외가 빠져나가 봐야 아무도 보지 않는다. 여기서 잡아 로그로
         * 남긴다 — 하루 실패가 다음 날 실행을 막지도 않는다.
         */
        try {
            List<ScadaTrend> rows = selectDay(day);
            if (rows.isEmpty()) {
                /*
                 * 빈 파일을 만들지 않는다. 그게 쌓이면 '그날 자료가 없다'와
                 * '그날 수집이 죽었다'를 구분할 수 없다.
                 */
                log.warn("[온도데이터] {} 자료가 없어 파일을 만들지 않았습니다.", day);
                return;
            }

            Path path = Path.of(exportDir, "온도데이터_" + day.format(FILE_FORMAT) + ".xlsx");
            Files.createDirectories(path.getParent());
            write(rows, path);

            log.info("[온도데이터] {} {}행 저장 완료 — {}", day, rows.size(), path);
        } catch (Exception e) {
            log.error("[온도데이터] {} 저장 실패", day, e);
        }
    }

    /**
     * 그날 00:00:00 ~ 23:59:59.
     *
     * <p>
     * 끝을 다음 날 00:00:00으로 주면 안 된다 — getTrend의 조건이 {@code <=}라서
     * 그 정각 스냅샷이 이 파일과 다음 날 파일에 모두 들어간다.
     * </p>
     */
    private List<ScadaTrend> selectDay(LocalDate day) {
        ScadaTrend param = new ScadaTrend();
        param.setStartTime(day.atStartOfDay().format(QUERY_FORMAT));
        param.setEndTime(day.atTime(23, 59, 59).format(QUERY_FORMAT));
        return scadaService.getTrend(param);
    }

    /** 머리글 한 줄 + 데이터 줄들. 워크북을 닫아야 임시 파일이 남지 않는다. */
    private void write(List<ScadaTrend> rows, Path path) throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("온도데이터");

            Row head = sheet.createRow(0);
            for (int c = 0; c < COLUMNS.size(); c++) {
                head.createCell(c).setCellValue(COLUMNS.get(c).title);
            }

            for (int r = 0; r < rows.size(); r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < COLUMNS.size(); c++) {
                    fill(row.createCell(c), COLUMNS.get(c), rows.get(r));
                }
            }

            applyWidths(sheet, rows);

            try (OutputStream out = Files.newOutputStream(path)) {
                wb.write(out);
            }
        }
    }

    /**
     * 한 칸을 채운다.
     *
     * <p>
     * 값이 없으면 아무것도 하지 않는다 — 그게 빈 칸이다. 0을 넣으면 그 시각에 온도가
     * 0이었다는 기록이 되어 버린다(화면에서 '---'로 두는 것과 같은 이유).
     * </p>
     */
    private void fill(Cell cell, Column col, ScadaTrend row) {
        String raw = col.getter.apply(row);
        if (raw == null || raw.isBlank()) {
            return;
        }

        if (!col.number) {
            /*
             * 시각은 드라이버에 따라 '2026-09-15 00:00:30.0'처럼 소수부가 붙어 올 수 있다.
             * 화면과 같은 모양(초까지)으로 맞춘다.
             */
            cell.setCellValue(raw.length() > 19 ? raw.substring(0, 19) : raw);
            return;
        }

        try {
            cell.setCellValue(Double.parseDouble(raw));
        } catch (NumberFormatException e) {
            // 숫자로 못 읽는 값은 빈 칸으로 둔다. 글자로 남기면 열 전체가 문자열 취급된다.
            log.debug("[온도데이터] 숫자로 읽지 못한 값 — {} = {}", col.title, raw);
        }
    }

    /**
     * 열 폭을 내용에 맞춘다.
     *
     * <p>
     * {@code autoSizeColumn}은 쓰지 않는다 — 서버에 한글 폰트가 없으면(headless 환경에서
     * 흔하다) 폭이 엉뚱하게 잡힌다. 프론트와 같은 규칙으로 직접 센다.
     * </p>
     */
    private void applyWidths(Sheet sheet, List<ScadaTrend> rows) {
        for (int c = 0; c < COLUMNS.size(); c++) {
            Column col = COLUMNS.get(c);
            int longest = displayWidth(col.title);
            for (ScadaTrend row : rows) {
                longest = Math.max(longest, displayWidth(col.getter.apply(row)));
            }
            int chars = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, longest + 2));
            // POI의 폭 단위는 '기본 글꼴 숫자 하나 폭의 1/256'이다.
            sheet.setColumnWidth(c, chars * 256);
        }
    }

    /** 한글은 영문보다 두 배 가까이 넓다 — 2로 세지 않으면 한글 열이 항상 좁게 나온다. */
    private int displayWidth(String s) {
        if (s == null) {
            return 0;
        }
        int w = 0;
        for (int i = 0; i < s.length(); i++) {
            w += s.charAt(i) > 0x2E7F ? 2 : 1;
        }
        return w;
    }
}
