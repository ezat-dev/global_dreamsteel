package com.sample_pro.dao.monitor;

import com.sample_pro.domain.AlarmFolder;
import com.sample_pro.domain.AlarmHistory;
import com.sample_pro.domain.AlarmTag;
import com.sample_pro.domain.PlcConfig;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import javax.annotation.Resource;
import java.util.List;
import java.util.Map;

@Repository
public class AlarmDaoImpl implements AlarmDao {

    @Resource(name = "session")
    private SqlSession sqlSession;

    @Override
    public List<AlarmFolder> selectAlarmFolderList() {
        return sqlSession.selectList("AlarmMapper.selectAlarmFolderList");
    }

    @Override
    public void insertAlarmFolder(AlarmFolder folder) {
        sqlSession.insert("AlarmMapper.insertAlarmFolder", folder);
    }

    @Override
    public void deleteAlarmFolder(int folderId) {
        sqlSession.delete("AlarmMapper.deleteAlarmFolder", folderId);
    }

    @Override
    public List<AlarmTag> selectAlarmTagList(int folderId) {
        return sqlSession.selectList("AlarmMapper.selectAlarmTagList", folderId);
    }

    @Override
    public void insertAlarmTag(AlarmTag tag) {
        sqlSession.insert("AlarmMapper.insertAlarmTag", tag);
    }

    @Override
    public void updateAlarmTag(AlarmTag tag) {
        sqlSession.update("AlarmMapper.updateAlarmTag", tag);
    }

    @Override
    public void deleteAlarmTag(int tagId) {
        sqlSession.delete("AlarmMapper.deleteAlarmTag", tagId);
    }

    @Override
    public List<PlcConfig> selectPlcList() {
        return sqlSession.selectList("AlarmMapper.selectPlcList");
    }

    @Override
    public void insertOrUpdatePlc(PlcConfig plc) {
        sqlSession.insert("AlarmMapper.insertOrUpdatePlc", plc);
    }

    @Override
    public void deletePlc(String plcId) {
        sqlSession.delete("AlarmMapper.deletePlc", plcId);
    }

    @Override
    public List<AlarmHistory> selectActiveAlarms(Map<String, Object> params) {
        return sqlSession.selectList("AlarmMapper.selectActiveAlarms", params);
    }

    @Override
    public List<AlarmHistory> selectAlarmHistory(Map<String, Object> params) {
        return sqlSession.selectList("AlarmMapper.selectAlarmHistory", params);
    }

    @Override
    public List<AlarmHistory> selectAlarmHistoryRange(Map<String, Object> params) {
        return sqlSession.selectList("AlarmMapper.selectAlarmHistoryRange", params);
    }
}
