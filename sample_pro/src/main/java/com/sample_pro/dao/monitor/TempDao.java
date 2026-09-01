package com.sample_pro.dao.monitor;

import com.sample_pro.domain.TempHistory;
import com.sample_pro.domain.TempMemo;
import com.sample_pro.domain.TempTag;

import java.util.List;
import java.util.Map;

public interface TempDao {
    void ensureTempTagTable();
    int countTempTagColumn(String colName);
    void addTempTagColName();
    void addEquipIdColumn();
    void addScaleColumn();
    void ensureTempHistoryTable();
    void ensureTempSnapshotTable();
    void addTempSnapshotColumn(String colName);

    List<TempTag> selectTempTagList();
    TempTag selectTempTagById(int tempId);
    List<TempTag> selectTempTagsMissingColName();
    List<String> selectTempColNames();
    void insertTempTag(TempTag tag);
    void updateTempTag(TempTag tag);
    void deleteTempTag(int tempId);

    List<TempHistory> selectTempHistory(Map<String, Object> params);

    int countTempSnapshotColumn(String colName);
    void renameTempSnapshotColumn(Map<String, Object> params);
    List<Map<String, Object>> selectTempSnapshot(Map<String, Object> params);
    List<Map<String, Object>> selectTempSnapshotRange(Map<String, Object> params);

    List<TempMemo> selectMemoList(Map<String, Object> params);
    void insertMemo(TempMemo memo);
    void deleteMemo(int tcCnt);
}
