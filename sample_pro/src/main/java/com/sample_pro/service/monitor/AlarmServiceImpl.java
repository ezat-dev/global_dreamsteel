package com.sample_pro.service.monitor;

import com.sample_pro.dao.monitor.AlarmDao;
import com.sample_pro.domain.AlarmFolder;
import com.sample_pro.domain.AlarmHistory;
import com.sample_pro.domain.AlarmTag;
import com.sample_pro.domain.PlcConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service("alarmService")
public class AlarmServiceImpl implements AlarmService {

    @Autowired
    private AlarmDao alarmDao;

    @Override
    public List<AlarmFolder> getAlarmFolderList() {
        return alarmDao.selectAlarmFolderList();
    }

    @Override
    @Transactional
    public void insertAlarmFolder(AlarmFolder folder) {
        alarmDao.insertAlarmFolder(folder);
    }

    @Override
    @Transactional
    public void deleteAlarmFolder(int folderId) {
        alarmDao.deleteAlarmFolder(folderId);
    }

    @Override
    public List<AlarmTag> getAlarmTagList(int folderId) {
        return alarmDao.selectAlarmTagList(folderId);
    }

    @Override
    @Transactional
    public void insertAlarmTag(AlarmTag tag) {
        alarmDao.insertAlarmTag(tag);
    }

    @Override
    @Transactional
    public void updateAlarmTag(AlarmTag tag) {
        alarmDao.updateAlarmTag(tag);
    }

    @Override
    @Transactional
    public void deleteAlarmTag(int tagId) {
        alarmDao.deleteAlarmTag(tagId);
    }

    @Override
    public List<PlcConfig> getPlcList() {
        return alarmDao.selectPlcList();
    }

    @Override
    @Transactional
    public void savePlc(PlcConfig plc) {
        alarmDao.insertOrUpdatePlc(plc);
    }

    @Override
    @Transactional
    public void removePlc(String plcId) {
        alarmDao.deletePlc(plcId);
    }

    @Override
    public List<AlarmHistory> getActiveAlarms(int limit) {
        Map<String, Object> p = new HashMap<>();
        p.put("limit", limit);
        return alarmDao.selectActiveAlarms(p);
    }

    @Override
    public List<AlarmHistory> getAlarmHistory(int limit) {
        Map<String, Object> p = new HashMap<>();
        p.put("limit", limit);
        return alarmDao.selectAlarmHistory(p);
    }

    @Override
    public List<AlarmHistory> getAlarmHistoryRange(String from, String to) {
        Map<String, Object> p = new HashMap<>();
        p.put("from", from);
        p.put("to", to);
        return alarmDao.selectAlarmHistoryRange(p);
    }
}
