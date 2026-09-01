package com.sample_pro.dao.monitor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import com.sample_pro.domain.TempHistory;
import com.sample_pro.domain.TempMemo;
import com.sample_pro.domain.TempTag;

@Repository
public class TempDaoImpl implements TempDao {

    @Resource(name = "session")
    private SqlSession sqlSession;

    @Override
    public void ensureTempTagTable() {
        sqlSession.update("TempMapper.ensureTempTagTable");
    }

    @Override
    public int countTempTagColumn(String colName) {
        return sqlSession.selectOne("TempMapper.countTempTagColumn", colName);
    }

    @Override
    public void addTempTagColName() {
        sqlSession.update("TempMapper.addTempTagColName");
    }

    @Override
    public void addEquipIdColumn() {
        sqlSession.update("TempMapper.addEquipIdColumn");
    }

    @Override
    public void addScaleColumn() {
        sqlSession.update("TempMapper.addScaleColumn");
    }

    @Override
    public void ensureTempHistoryTable() {
        sqlSession.update("TempMapper.ensureTempHistoryTable");
    }

    @Override
    public void ensureTempSnapshotTable() {
        sqlSession.update("TempMapper.ensureTempSnapshotTable");
    }

    @Override
    public void addTempSnapshotColumn(String colName) {
        Map<String, Object> param = new HashMap<>();
        param.put("colName", colName);
        sqlSession.update("TempMapper.addTempSnapshotColumn", param);
    }

    @Override
    public List<TempTag> selectTempTagList() {
        return sqlSession.selectList("TempMapper.selectTempTagList");
    }

    @Override
    public TempTag selectTempTagById(int tempId) {
        return sqlSession.selectOne("TempMapper.selectTempTagById", tempId);
    }

    @Override
    public List<TempTag> selectTempTagsMissingColName() {
        return sqlSession.selectList("TempMapper.selectTempTagsMissingColName");
    }

    @Override
    public List<String> selectTempColNames() {
        return sqlSession.selectList("TempMapper.selectTempColNames");
    }

    @Override
    public void insertTempTag(TempTag tag) {
        sqlSession.insert("TempMapper.insertTempTag", tag);
    }

    @Override
    public void updateTempTag(TempTag tag) {
        sqlSession.update("TempMapper.updateTempTag", tag);
    }

    @Override
    public void deleteTempTag(int tempId) {
        sqlSession.delete("TempMapper.deleteTempTag", tempId);
    }

    @Override
    public List<TempHistory> selectTempHistory(Map<String, Object> params) {
        return sqlSession.selectList("TempMapper.selectTempHistory", params);
    }

    @Override
    public int countTempSnapshotColumn(String colName) {
        return sqlSession.selectOne("TempMapper.countTempSnapshotColumn", colName);
    }

    @Override
    public void renameTempSnapshotColumn(Map<String, Object> params) {
        sqlSession.update("TempMapper.renameTempSnapshotColumn", params);
    }

    @Override
    public List<Map<String, Object>> selectTempSnapshot(Map<String, Object> params) {
        return sqlSession.selectList("TempMapper.selectTempSnapshot", params);
    }

    @Override
    public List<Map<String, Object>> selectTempSnapshotRange(Map<String, Object> params) {
        return sqlSession.selectList("TempMapper.selectTempSnapshotRange", params);
    }

    @Override
    public List<TempMemo> selectMemoList(Map<String, Object> params) {
        return sqlSession.selectList("TempMapper.selectMemoList", params);
    }

    @Override
    public void insertMemo(TempMemo memo) {
        sqlSession.insert("TempMapper.insertMemo", memo);
    }

    @Override
    public void deleteMemo(int tcCnt) {
        sqlSession.update("TempMapper.deleteMemo", tcCnt);
    }
}
