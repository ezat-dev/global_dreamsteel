package com.sample_pro.controller.monitor;

import com.sample_pro.domain.AlarmFolder;
import com.sample_pro.domain.AlarmHistory;
import com.sample_pro.domain.AlarmTag;
import com.sample_pro.domain.PlcConfig;
import com.sample_pro.service.monitor.AlarmService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.InputStream;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;

@Controller
@RequestMapping("/alarm")
public class AlarmController {

    @Autowired
    private AlarmService alarmService;

    @RequestMapping(value = "/manage", method = RequestMethod.GET)
    public String alarmManagePage(Model model) {
        return "/monitoring/AlarmManagePage.jsp";
    }

    @RequestMapping(value = "/monitor", method = RequestMethod.GET)
    public String alarmMonitorPage(Model model) {
        return "/monitoring/AlarmMonitorPage.jsp";
    }

    @RequestMapping(value = "/temp", method = RequestMethod.GET)
    public String alarmTempPage(Model model) {
        return "/monitoring/AlarmTempOverview.jsp";
    }

    @RequestMapping(value = "/excel/download", method = RequestMethod.GET)
    public void downloadExcel(HttpServletResponse response) throws java.io.IOException {
        List<AlarmFolder> folders = alarmService.getAlarmFolderList();
        Map<Integer, String> folderNameById = new HashMap<>();
        for (AlarmFolder f : folders) {
            folderNameById.put(f.getFolderId(), f.getFolderName());
        }

        List<AlarmTag> tags = new ArrayList<>();
        for (AlarmFolder f : folders) {
            tags.addAll(alarmService.getAlarmTagList(f.getFolderId()));
        }

        String[] headers = new String[] { "FolderName", "TagName", "Address", "PlcId", "AlarmMsg", "Level", "Enabled" };

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("AlarmTags");
            Row head = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                head.createCell(i).setCellValue(headers[i]);
            }

            int r = 1;
            for (AlarmTag t : tags) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(folderNameById.getOrDefault(t.getFolderId(), ""));
                row.createCell(1).setCellValue(nullToEmpty(t.getTagName()));
                row.createCell(2).setCellValue(nullToEmpty(t.getAddress()));
                row.createCell(3).setCellValue(nullToEmpty(t.getPlcId()));
                row.createCell(4).setCellValue(nullToEmpty(t.getAlarmMsg()));
                row.createCell(5).setCellValue(t.getLevel());
                row.createCell(6).setCellValue(t.getEnabled());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            String filename = "alarm_tags.xlsx";
            String encoded = URLEncoder.encode(filename, "UTF-8").replaceAll("\\+", "%20");
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + encoded);
            wb.write(response.getOutputStream());
        }
    }

    @RequestMapping(value = "/excel/upload", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.ok(err("엑셀 파일이 없습니다."));
        }

        int inserted = 0;
        int updated = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook wb = WorkbookFactory.create(is)) {
            if (wb.getNumberOfSheets() == 0) {
                return ResponseEntity.ok(err("엑셀 시트가 비어 있습니다."));
            }

            Sheet sheet = wb.getSheetAt(0);
            DataFormatter fmt = new DataFormatter();

            List<AlarmFolder> folders = alarmService.getAlarmFolderList();
            Map<String, Integer> folderMap = new HashMap<>();
            for (AlarmFolder f : folders) {
                folderMap.put(f.getFolderName(), f.getFolderId());
            }

            Map<String, Integer> tagIdMap = new HashMap<>();
            for (AlarmFolder f : folders) {
                List<AlarmTag> list = alarmService.getAlarmTagList(f.getFolderId());
                for (AlarmTag t : list) {
                    if (t.getTagName() != null) {
                        tagIdMap.put(f.getFolderId() + "|" + t.getTagName().trim(), t.getTagId());
                    }
                }
            }

            Set<String> plcIds = new HashSet<>();
            for (PlcConfig p : alarmService.getPlcList()) {
                if (p.getPlcId() != null) plcIds.add(p.getPlcId());
            }

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String folderName = cellString(row, 0, fmt);
                String tagName = cellString(row, 1, fmt);
                String address = cellString(row, 2, fmt);
                String plcId = cellString(row, 3, fmt);
                String alarmMsg = cellString(row, 4, fmt);
                int level = parseInt(cellString(row, 5, fmt), 1);
                int enabled = parseInt(cellString(row, 6, fmt), 1);

                if (isBlank(folderName) && isBlank(tagName) && isBlank(address) && isBlank(plcId)) {
                    continue;
                }

                if (isBlank(folderName)) { errors.add("Row " + (r + 1) + ": folderName empty"); skipped++; continue; }
                if (isBlank(tagName)) { errors.add("Row " + (r + 1) + ": tagName empty"); skipped++; continue; }
                if (isBlank(address)) { errors.add("Row " + (r + 1) + ": address empty"); skipped++; continue; }
                if (isBlank(plcId)) { errors.add("Row " + (r + 1) + ": plcId empty"); skipped++; continue; }
                if (!plcIds.contains(plcId)) { errors.add("Row " + (r + 1) + ": plcId not found (" + plcId + ")"); skipped++; continue; }

                Integer folderId = folderMap.get(folderName);
                if (folderId == null || folderId == 0) {
                    AlarmFolder f = new AlarmFolder();
                    f.setFolderName(folderName.trim());
                    f.setParentId(null);
                    f.setSortOrder(0);
                    alarmService.insertAlarmFolder(f);
                    if (f.getFolderId() > 0) {
                        folderId = f.getFolderId();
                        folderMap.put(folderName, folderId);
                    } else {
                        // reload map if key not returned
                        for (AlarmFolder fx : alarmService.getAlarmFolderList()) {
                            folderMap.put(fx.getFolderName(), fx.getFolderId());
                        }
                        folderId = folderMap.get(folderName);
                    }
                }

                if (folderId == null || folderId == 0) {
                    errors.add("Row " + (r + 1) + ": folder create failed (" + folderName + ")");
                    skipped++;
                    continue;
                }

                AlarmTag tag = new AlarmTag();
                tag.setFolderId(folderId);
                tag.setTagName(tagName.trim());
                tag.setAddress(address.trim());
                tag.setPlcId(plcId.trim());
                tag.setAlarmMsg(alarmMsg);
                tag.setLevel(level);
                tag.setEnabled(enabled);

                String key = folderId + "|" + tag.getTagName();
                Integer tagId = tagIdMap.get(key);
                if (tagId != null && tagId > 0) {
                    tag.setTagId(tagId);
                    alarmService.updateAlarmTag(tag);
                    updated++;
                } else {
                    alarmService.insertAlarmTag(tag);
                    inserted++;
                    if (tag.getTagId() > 0) tagIdMap.put(key, tag.getTagId());
                }
            }
        } catch (Exception e) {
            return ResponseEntity.ok(err("엑셀 업로드 실패: " + e.getMessage()));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("inserted", inserted);
        res.put("updated", updated);
        res.put("skipped", skipped);
        if (!errors.isEmpty()) res.put("errors", errors.size() > 50 ? errors.subList(0, 50) : errors);
        return ResponseEntity.ok(res);
    }

    @RequestMapping(value = "/folder/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> folderList() {
        try {
            List<AlarmFolder> list = alarmService.getAlarmFolderList();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("폴더 목록 조회 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/folder/insert", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> folderInsert(@RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("folderName");
            if (name == null || name.trim().isEmpty())
                return ResponseEntity.ok(err("폴더 이름을 입력하세요"));

            AlarmFolder folder = new AlarmFolder();
            folder.setFolderName(name.trim());
            folder.setParentId(null);
            folder.setSortOrder(0);
            alarmService.insertAlarmFolder(folder);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("폴더 추가 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/folder/delete", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> folderDelete(@RequestBody Map<String, Object> body) {
        try {
            int folderId = Integer.parseInt(body.get("folderId").toString());
            alarmService.deleteAlarmFolder(folderId);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("폴더 삭제 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/tag/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> tagList(@RequestParam(value = "folderId", defaultValue = "0") int folderId) {
        try {
            List<AlarmTag> list = alarmService.getAlarmTagList(folderId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("태그 목록 조회 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/tag/insert", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> tagInsert(@RequestBody AlarmTag tag) {
        try {
            if (tag.getTagName() == null || tag.getTagName().trim().isEmpty())
                return ResponseEntity.ok(err("태그 이름을 입력하세요"));
            if (tag.getFolderId() == 0)
                return ResponseEntity.ok(err("폴더를 선택하세요"));
            if (tag.getPlcId() == null || tag.getPlcId().trim().isEmpty())
                return ResponseEntity.ok(err("PLC를 선택하세요"));

            alarmService.insertAlarmTag(tag);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("태그 추가 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/tag/update", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> tagUpdate(@RequestBody AlarmTag tag) {
        try {
            if (tag.getTagId() == 0)
                return ResponseEntity.ok(err("태그 ID가 없습니다"));
            alarmService.updateAlarmTag(tag);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("태그 수정 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/tag/delete", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> tagDelete(@RequestBody Map<String, Object> body) {
        try {
            int tagId = Integer.parseInt(body.get("tagId").toString());
            alarmService.deleteAlarmTag(tagId);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("태그 삭제 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/plc/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> plcList() {
        try {
            List<PlcConfig> list = alarmService.getPlcList();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("PLC 목록 조회 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/plc/add", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> plcAdd(@RequestBody PlcConfig plc) {
        try {
            if (plc.getPlcId() == null || plc.getPlcId().trim().isEmpty())
                return ResponseEntity.ok(err("PLC ID를 입력하세요"));
            if (plc.getIp() == null || plc.getIp().trim().isEmpty())
                return ResponseEntity.ok(err("PLC IP를 입력하세요"));
            if (plc.getPort() <= 0) plc.setPort(2004);
            if (plc.getPlcType() == null || plc.getPlcType().trim().isEmpty())
                plc.setPlcType("LS");
            if (plc.getLabel() == null || plc.getLabel().trim().isEmpty())
                plc.setLabel(plc.getPlcId());
            if (plc.getEnabled() == 0) plc.setEnabled(1);

            alarmService.savePlc(plc);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("PLC 저장 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/plc/remove", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> plcRemove(@RequestBody Map<String, Object> body) {
        try {
            String plcId = body.get("plcId").toString();
            alarmService.removePlc(plcId);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("PLC 삭제 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/active/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> activeList(@RequestParam(value = "limit", defaultValue = "50") int limit) {
        try {
            List<AlarmHistory> list = alarmService.getActiveAlarms(limit);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("활성 알람 조회 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/history/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> historyList(@RequestParam(value = "limit", defaultValue = "100") int limit) {
        try {
            List<AlarmHistory> list = alarmService.getAlarmHistory(limit);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("알람 이력 조회 실패: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/history/range", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> historyRange(@RequestParam String from, @RequestParam String to) {
        try {
            List<AlarmHistory> list = alarmService.getAlarmHistoryRange(from, to);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("알람 이력 조회 실패: " + e.getMessage()));
        }
    }

    private static String cellString(Row row, int idx, DataFormatter fmt) {
        if (row == null) return "";
        Cell cell = row.getCell(idx);
        if (cell == null) return "";
        return fmt.formatCellValue(cell).trim();
    }

    private static int parseInt(String s, int def) {
        if (s == null) return def;
        try {
            return Integer.parseInt(s.trim());
        } catch (Exception e) {
            return def;
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private Map<String, Object> ok() {
        Map<String, Object> m = new HashMap<>();
        m.put("success", true);
        return m;
    }

    private Map<String, Object> err(String msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("success", false);
        m.put("error", msg);
        return m;
    }
}
