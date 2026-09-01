package com.sample_pro.service.monitor;

import com.sample_pro.dao.monitor.TempDao;
import com.sample_pro.domain.TempHistory;
import com.sample_pro.domain.TempMemo;
import com.sample_pro.domain.TempTag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service("tempService")
public class TempServiceImpl implements TempService {

    @Autowired
    private TempDao tempDao;

    private void ensureTables() {
        tempDao.ensureTempTagTable();
        if (tempDao.countTempTagColumn("col_name") == 0) {
            tempDao.addTempTagColName();
        }
        if (tempDao.countTempTagColumn("equip_id") == 0) {
            tempDao.addEquipIdColumn();
        }
        if (tempDao.countTempTagColumn("scale") == 0) {
            tempDao.addScaleColumn();
        }
        tempDao.ensureTempHistoryTable();
        tempDao.ensureTempSnapshotTable();

        fillMissingColNames();
    }

    @Override
    public List<TempTag> getTempTagList() {
        ensureTables();
        return tempDao.selectTempTagList();
    }

    @Override
    @Transactional
    public void insertTempTag(TempTag tag) {
        ensureTables();
        if (tag.getEnabled() == 0) tag.setEnabled(1);
        // 사용자가 컬럼명을 직접 입력했으면 그걸 기반으로, 안 넣었으면 태그명에서 자동 파생
        String colName = resolveColName(tag.getColName(), tag.getTagName(), null);
        tag.setColName(colName);
        tempDao.insertTempTag(tag);

        // temp_snapshot 테이블에 컬럼 추가
        try {
            tempDao.addTempSnapshotColumn(colName);
        } catch (Exception e) {
            // 컬럼이 이미 존재할 수 있음 - 무시
        }
    }

    @Override
    @Transactional
    public void updateTempTag(TempTag tag) {
        ensureTables();
        TempTag current = tempDao.selectTempTagById(tag.getTempId());
        if (current == null) {
            return;
        }

        String desiredCol = (tag.getColName() != null && !tag.getColName().trim().isEmpty())
                ? tag.getColName().trim() : null;
        boolean tagNameChanged = tag.getTagName() != null && !tag.getTagName().equals(current.getTagName());
        boolean colNameChanged = desiredCol != null && !desiredCol.equals(current.getColName());

        String newCol = current.getColName();
        if (colNameChanged) {
            // 사용자가 컬럼명을 직접 바꾼 경우 — 그 값을 기준으로 유일성만 보장
            newCol = resolveColName(desiredCol, tag.getTagName(), current.getColName());
            renameSnapshotColumnIfExists(current.getColName(), newCol);
        } else if (tagNameChanged) {
            // 컬럼명은 그대로 두고 태그명만 바뀐 경우 — 기존처럼 태그명 기반 자동 파생
            newCol = resolveColName(null, tag.getTagName(), current.getColName());
            renameSnapshotColumnIfExists(current.getColName(), newCol);
        }
        if (newCol == null || newCol.trim().isEmpty()) {
            newCol = resolveColName(null, tag.getTagName(), current.getColName());
        }

        tag.setColName(newCol);
        tempDao.updateTempTag(tag);
    }

    // desiredColName이 있으면 그것을(가벼운 정제만) 기준으로, 없으면 tagName에서 자동 파생해서
    // tb_temp_tag.col_name/tb_temp_snapshot 컬럼명으로 쓸 유일한 이름을 만든다.
    private String resolveColName(String desiredColName, String tagNameForFallback, String currentColToExclude) {
        String base = (desiredColName != null && !desiredColName.trim().isEmpty())
                ? sanitizeManualColName(desiredColName.trim())
                : toSafeColumnBase(tagNameForFallback);

        Set<String> used = new HashSet<>(tempDao.selectTempColNames());
        if (currentColToExclude != null) used.remove(currentColToExclude);

        String name = base;
        int idx = 2;
        while (used.contains(name)) {
            name = base + "_" + idx;
            idx++;
        }
        return name;
    }

    // 사용자가 직접 입력한 컬럼명은 태그명 자동 파생(toSafeColumnBase)과 달리 대소문자/형태를 그대로
    // 존중한다 — SQL 컬럼 식별자로 쓸 수 없는 문자만 제거하고 나머지는 입력한 그대로 둔다.
    private String sanitizeManualColName(String input) {
        String s = input.replaceAll("[가-힣]+", "");        // 한글 제거 (컬럼 식별자에 못 씀)
        s = s.replaceAll("[^A-Za-z0-9_]+", "_");             // 허용 문자(영문/숫자/_) 외엔 _로 치환
        s = s.replaceAll("^_+|_+$", "");
        if (s.isEmpty()) s = "col";
        if (!Character.isLetter(s.charAt(0)) && s.charAt(0) != '_') s = "c_" + s;
        return s;
    }

    @Override
    @Transactional
    public void deleteTempTag(int tempId) {
        ensureTables();
        tempDao.deleteTempTag(tempId);
    }

    @Override
    public List<TempHistory> getTempHistory(int limit, Integer tempId) {
        ensureTables();
        Map<String, Object> p = new HashMap<>();
        p.put("limit", limit);
        if (tempId != null && tempId > 0) p.put("tempId", tempId);
        return tempDao.selectTempHistory(p);
    }

    @Override
    public List<Map<String, Object>> getTempSnapshot(int limit) {
        ensureTables();
        Map<String, Object> p = new HashMap<>();
        p.put("limit", limit);
        return tempDao.selectTempSnapshot(p);
    }

    @Override
    public List<Map<String, Object>> getTempSnapshotRange(String from, String to) {
        ensureTables();
        Map<String, Object> p = new HashMap<>();
        p.put("from", from);
        p.put("to", to);
        return tempDao.selectTempSnapshotRange(p);
    }

    @Override
    public List<TempMemo> getMemoList(String from, String to) {
        Map<String, Object> p = new HashMap<>();
        p.put("from", from);
        p.put("to", to);
        return tempDao.selectMemoList(p);
    }

    @Override
    @Transactional
    public void insertMemo(TempMemo memo) {
        tempDao.insertMemo(memo);
    }

    @Override
    @Transactional
    public void deleteMemo(int tcCnt) {
        tempDao.deleteMemo(tcCnt);
    }

    private void renameSnapshotColumnIfExists(String oldCol, String newCol) {
        if (oldCol == null || oldCol.trim().isEmpty()) return;
        if (newCol == null || newCol.trim().isEmpty()) return;
        if (oldCol.equals(newCol)) return;

        int exists = tempDao.countTempSnapshotColumn(oldCol);
        if (exists <= 0) return;
        Map<String, Object> p = new HashMap<>();
        p.put("oldCol", oldCol);
        p.put("newCol", newCol);
        tempDao.renameTempSnapshotColumn(p);
    }

    private void fillMissingColNames() {
        List<TempTag> missing = tempDao.selectTempTagsMissingColName();
        if (missing == null || missing.isEmpty()) return;

        Set<String> used = new HashSet<>(tempDao.selectTempColNames());
        used.remove("");

        for (TempTag t : missing) {
            String col = buildUniqueColName(t.getTagName(), null, used);
            t.setColName(col);
            tempDao.updateTempTag(t);
            used.add(col);
        }
    }

    private String buildUniqueColName(String tagName, String currentCol) {
        return buildUniqueColName(tagName, currentCol, null);
    }

    private String buildUniqueColName(String tagName, String currentCol, Set<String> usedOverride) {
        String base = toSafeColumnBase(tagName);
        Set<String> used = (usedOverride != null) ? usedOverride : new HashSet<>(tempDao.selectTempColNames());
        if (currentCol != null) used.remove(currentCol);

        String name = base;
        int idx = 2;
        while (used.contains(name)) {
            name = base + "_" + idx;
            idx++;
        }
        return name;
    }

    private String toSafeColumnBase(String tagName) {
        String s = tagName == null ? "" : tagName.trim().toLowerCase();
        // 한글 및 특수문자를 영어로 변환
        s = s.replaceAll("[가-힣]+", "");  // 한글 제거
        s = s.replaceAll("[^a-z0-9]+", "_");  // 특수문자를 _로
        s = s.replaceAll("^_+|_+$", "");  // 앞뒤 _ 제거
        if (s.isEmpty()) s = "tag";
        if (!Character.isLetter(s.charAt(0))) s = "t_" + s;
        return "tag_" + s;
    }
}
