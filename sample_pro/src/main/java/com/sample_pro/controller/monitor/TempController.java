package com.sample_pro.controller.monitor;

import com.sample_pro.domain.TempHistory;
import com.sample_pro.domain.TempMemo;
import com.sample_pro.domain.TempTag;
import com.sample_pro.service.monitor.ExcelExportService;
import com.sample_pro.service.monitor.TempService;
import javax.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Controller
@RequestMapping("/temp")
public class TempController {

    @Autowired
    private TempService tempService;

    @Autowired
    private ExcelExportService excelExportService;

    @RequestMapping(value = "/manage", method = RequestMethod.GET)
    public String tempManagePage() {
        return "/monitoring/TempManagePage.jsp";
    }

    @RequestMapping(value = "/monitor", method = RequestMethod.GET)
    public String tempMonitorPage() {
        return "/monitoring/TempMonitorPage.jsp";
    }

    @RequestMapping(value = "/tag/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> tagList() {
        try {
            List<TempTag> list = tempService.getTempTagList();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("Temp tag list failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/cols", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> cols() {
        try {
            List<TempTag> list = tempService.getTempTagList();
            // return enabled tags only for snapshot columns
            List<TempTag> enabled = list.stream()
                    .filter(t -> t.getEnabled() == 1)
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(enabled);
        } catch (Exception e) {
            return ResponseEntity.ok(err("Temp columns failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/tag/insert", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> tagInsert(@RequestBody TempTag tag) {
        try {
            if (tag.getTagName() == null || tag.getTagName().trim().isEmpty())
                return ResponseEntity.ok(err("Tag name required"));
            if (tag.getAddress() == null || tag.getAddress().trim().isEmpty())
                return ResponseEntity.ok(err("Address required"));
            if (tag.getPlcId() == null || tag.getPlcId().trim().isEmpty())
                return ResponseEntity.ok(err("PLC required"));

            tempService.insertTempTag(tag);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("Temp tag insert failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/tag/update", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> tagUpdate(@RequestBody TempTag tag) {
        try {
            if (tag.getTempId() == 0)
                return ResponseEntity.ok(err("Temp tag id required"));
            tempService.updateTempTag(tag);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("Temp tag update failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/tag/delete", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> tagDelete(@RequestBody Map<String, Object> body) {
        try {
            int tempId = Integer.parseInt(body.get("tempId").toString());
            tempService.deleteTempTag(tempId);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("Temp tag delete failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/history/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> historyList(
            @RequestParam(value = "limit", defaultValue = "200") int limit,
            @RequestParam(value = "tempId", required = false) Integer tempId) {
        try {
            List<TempHistory> list = tempService.getTempHistory(limit, tempId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("Temp history list failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/snapshot/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> snapshotList(@RequestParam(value = "limit", defaultValue = "200") int limit) {
        try {
            return ResponseEntity.ok(tempService.getTempSnapshot(limit));
        } catch (Exception e) {
            return ResponseEntity.ok(err("Temp snapshot list failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/snapshot/range", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> snapshotRange(
            @RequestParam("from") String from,
            @RequestParam("to") String to) {
        try {
            List<Map<String, Object>> rows = tempService.getTempSnapshotRange(from, to);

            // CP 태그 colName 수집 (trendName → tagName → colName 순으로 이름 결정, \bcp\b 매칭)
            List<TempTag> tags = tempService.getTempTagList();
            Set<String> cpCols = new HashSet<>();
            for (TempTag t : tags) {
                String name = t.getTrendName() != null && !t.getTrendName().isEmpty() ? t.getTrendName()
                            : t.getTagName()   != null && !t.getTagName().isEmpty()   ? t.getTagName()
                            : t.getColName()   != null                                ? t.getColName()
                            : "";
                boolean isCpName = false;
                for (String seg : name.toLowerCase().split("[_\\s]+")) {
                    if (seg.equals("cp")) { isCpName = true; break; }
                }
                if (isCpName && t.getColName() != null) {
                    cpCols.add(t.getColName());
                }
            }

            // CP 컬럼 값 ÷ 1000 (row 키는 DB 컬럼명 그대로, 대소문자 양쪽 시도)
            if (!cpCols.isEmpty()) {
                for (Map<String, Object> row : rows) {
                    for (String col : cpCols) {
                        Object val = row.containsKey(col) ? row.get(col)
                                   : row.containsKey(col.toLowerCase()) ? row.get(col.toLowerCase())
                                   : null;
                        if (val == null) continue;
                        try {
                            double scaled = Double.parseDouble(val.toString()) * 0.001;
                            // 원래 키와 소문자 키 모두 갱신
                            if (row.containsKey(col))               row.put(col, scaled);
                            if (row.containsKey(col.toLowerCase())) row.put(col.toLowerCase(), scaled);
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }

            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            return ResponseEntity.ok(err("Temp snapshot range failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/memo/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> memoList(
            @RequestParam("from") String from,
            @RequestParam("to") String to) {
        try {
            return ResponseEntity.ok(tempService.getMemoList(from, to));
        } catch (Exception e) {
            return ResponseEntity.ok(err("Memo list failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/memo/insert", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> memoInsert(@RequestBody TempMemo memo, HttpSession session) {
        try {
            if (memo.getTcName() == null || memo.getTcName().trim().isEmpty())
                return ResponseEntity.ok(err("메모 제목을 입력하세요"));
            if (memo.getTcRegtime() == null || memo.getTcRegtime().trim().isEmpty()) {
                String now = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
                memo.setTcRegtime(now);
            }
            // 세션에서 로그인 유저 정보 주입 (loginEmp Map 우선, 없으면 loginUser)
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> loginEmp =
                (java.util.Map<String, Object>) session.getAttribute("loginEmp");
            if (loginEmp != null) {
                Object empId   = loginEmp.get("emp_id");
                Object empName = loginEmp.get("emp_name");
                if (empId   != null) { try { memo.setTcUserCode(Integer.parseInt(empId.toString())); } catch (Exception ignored) {} }
                if (empName != null) memo.setTcUserName(empName.toString());
            } else {
                com.sample_pro.domain.Users loginUser =
                    (com.sample_pro.domain.Users) session.getAttribute("loginUser");
                if (loginUser != null) {
                    try { memo.setTcUserCode(Integer.parseInt(loginUser.getUser_code())); } catch (Exception ignored) {}
                    memo.setTcUserName(loginUser.getUser_name());
                }
            }
            tempService.insertMemo(memo);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("Memo insert failed: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/memo/delete", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> memoDelete(@RequestBody Map<String, Object> body) {
        try {
            int tcCnt = Integer.parseInt(body.get("tcCnt").toString());
            tempService.deleteMemo(tcCnt);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("Memo delete failed: " + e.getMessage()));
        }
    }

    // GET|POST /temp/excel/export?date=2026-07-01  (date 생략 시 전날)
    @RequestMapping(value = "/excel/export", method = {RequestMethod.GET, RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> excelExport(
            @RequestParam(required = false) String date) {
        try {
            excelExportService.exportForDate(date);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("Excel export failed: " + e.getMessage()));
        }
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
