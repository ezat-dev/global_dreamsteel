package com.sample_pro.controller.monitor;

import com.sample_pro.domain.Folder;
import com.sample_pro.domain.Tag;
import com.sample_pro.service.monitor.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/tag")
public class TagController {

    @Autowired
    private TagService tagService;

    // C# PlcApiServer 주소 — folders_tags 실시간값(LiveTagMonitorService)을 프록시로 가져올 때만 사용
    private static final String CSHARP = "http://localhost:5050";
    private final RestTemplate rest = new RestTemplate();

    // ══ 페이지 ═══════════════════════════════════════════

    @RequestMapping(value = "/TagWorkPage", method = RequestMethod.GET)
    public String tagWorkPage(Model model) {
        return "/monitoring/TagWorkPage.jsp";
    }

    @RequestMapping(value = "/TagMonitorPage", method = RequestMethod.GET)
    public String tagMonitorPage(Model model) {
        return "/monitoring/TagMonitorPage.jsp";
    }

    // ══ 폴더 ═════════════════════════════════════════════

    // 폴더 목록 조회
    @RequestMapping(value = "/folder/list", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<?> folderList() {
        try {
            List<Folder> list = tagService.getFolderList();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("폴더 목록 조회 실패: " + e.getMessage()));
        }
    }

    // 폴더 추가
    @RequestMapping(value = "/folder/insert", method = RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> folderInsert(@RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("name");
            if (name == null || name.trim().isEmpty())
                return ResponseEntity.ok(err("폴더 이름을 입력하세요."));

            Folder folder = new Folder();
            folder.setName(name.trim());

            tagService.insertFolder(folder);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("폴더 추가 실패: " + e.getMessage()));
        }
    }

    // 폴더 삭제 (폴더 내 태그도 같이 삭제)
    @RequestMapping(value = "/folder/delete", method = RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> folderDelete(@RequestBody Map<String, Object> body) {
        try {
            int folderId = Integer.parseInt(body.get("folderId").toString());
            tagService.deleteFolder(folderId);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("폴더 삭제 실패: " + e.getMessage()));
        }
    }

    // ══ 태그 ═════════════════════════════════════════════

    // 태그 목록 조회 (폴더별)
    @RequestMapping(value = "/list", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<?> tagList(@RequestParam(value = "folderId", defaultValue = "0") int folderId) {
        try {
            List<Tag> list = tagService.getTagList(folderId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(err("태그 목록 조회 실패: " + e.getMessage()));
        }
    }

    // 태그 추가
    @RequestMapping(value = "/insert", method = RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> tagInsert(@RequestBody Tag tag) {
        try {
            if (tag.getName() == null || tag.getName().trim().isEmpty())
                return ResponseEntity.ok(err("태그 이름을 입력하세요."));
            tagService.insertTag(tag);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("태그 추가 실패: " + e.getMessage()));
        }
    }

    // 태그 수정
    @RequestMapping(value = "/update", method = RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> tagUpdate(@RequestBody Tag tag) {
        try {
            if (tag.getId() == 0)
                return ResponseEntity.ok(err("태그 ID가 없습니다."));
            tagService.updateTag(tag);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("태그 수정 실패: " + e.getMessage()));
        }
    }

    // 태그 삭제
    @RequestMapping(value = "/delete", method = RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> tagDelete(@RequestBody Map<String, Object> body) {
        try {
            int id = Integer.parseInt(body.get("id").toString());
            tagService.deleteTag(id);
            return ResponseEntity.ok(ok());
        } catch (Exception e) {
            return ResponseEntity.ok(err("태그 삭제 실패: " + e.getMessage()));
        }
    }

    // ══ 실시간값 (LiveTagMonitorService 프록시) ══════════════════════════════

    // folders_tags의 최신값 조회 — PLC 통신 없이 C# 메모리 캐시를 그대로 받아온다.
    @RequestMapping(value = "/live/values", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<?> liveValues() {
        try {
            Map<?, ?> res = rest.getForObject(CSHARP + "/api/foldertag/values", Map.class);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.ok(err("실시간값 조회 실패: " + e.getMessage()));
        }
    }

    // 공통 응답 헬퍼
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