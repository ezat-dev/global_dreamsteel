package com.sample_pro.controller.master;

import com.sample_pro.domain.PagePermission;
import com.sample_pro.service.master.PermService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.*;

@Controller
@RequestMapping("/perm")
public class PermController {

    @Autowired
    private PermService permService;

    /* 특정 사용자 권한 조회 */
    @RequestMapping(value = "/list", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> list(@RequestParam int empId) {
        try {
            List<PagePermission> list = permService.getPermsByEmpId(empId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("권한 조회 실패: " + e.getMessage()));
        }
    }

    /* 현재 로그인 유저 권한 조회 (map 형태) */
    @RequestMapping(value = "/my", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> my(HttpSession session) {
        try {
            int empId = getEmpId(session);
            if (empId <= 0) return ResponseEntity.ok(Collections.emptyMap());
            Map<String, PagePermission> map = permService.getPermsMapByEmpId(empId);
            return ResponseEntity.ok(map);
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyMap());
        }
    }

    /* 권한 저장 */
    @RequestMapping(value = "/save", method = RequestMethod.POST, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> save(@RequestBody Map<String, Object> body) {
        try {
            int empId = Integer.parseInt(body.get("empId").toString());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawPerms = (List<Map<String, Object>>) body.get("perms");
            List<PagePermission> perms = new ArrayList<>();
            if (rawPerms != null) {
                for (Map<String, Object> r : rawPerms) {
                    PagePermission p = new PagePermission();
                    p.setPageUrl(r.get("pageUrl").toString());
                    p.setCanView(r.getOrDefault("canView", "Y").toString());
                    p.setCanAdd(r.getOrDefault("canAdd",  "Y").toString());
                    p.setCanEdit(r.getOrDefault("canEdit","Y").toString());
                    p.setCanDel(r.getOrDefault("canDel",  "Y").toString());
                    perms.add(p);
                }
            }
            permService.savePerms(empId, perms);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("저장 실패: " + e.getMessage()));
        }
    }

    private int getEmpId(HttpSession session) {
        @SuppressWarnings("unchecked")
        Map<String, Object> loginEmp = (Map<String, Object>) session.getAttribute("loginEmp");
        if (loginEmp != null && loginEmp.get("emp_id") != null) {
            try { return Integer.parseInt(loginEmp.get("emp_id").toString()); } catch (Exception ignored) {}
        }
        com.sample_pro.domain.Users loginUser = (com.sample_pro.domain.Users) session.getAttribute("loginUser");
        if (loginUser != null && loginUser.getUser_code() != null) {
            try { return Integer.parseInt(loginUser.getUser_code()); } catch (Exception ignored) {}
        }
        return 0;
    }

    private Map<String, Object> ok() {
        Map<String, Object> m = new HashMap<>(); m.put("success", true); return m;
    }
    private Map<String, Object> err(String msg) {
        Map<String, Object> m = new HashMap<>(); m.put("success", false); m.put("error", msg); return m;
    }
}
