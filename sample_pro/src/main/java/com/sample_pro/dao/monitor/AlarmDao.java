package com.sample_pro.dao.monitor;

import com.sample_pro.domain.AlarmFolder;
import com.sample_pro.domain.AlarmHistory;
import com.sample_pro.domain.AlarmTag;
import com.sample_pro.domain.PlcConfig;

import java.util.List;
import java.util.Map;

public interface AlarmDao {

    List<AlarmFolder> selectAlarmFolderList();
    void insertAlarmFolder(AlarmFolder folder);
    void deleteAlarmFolder(int folderId);

    List<AlarmTag> selectAlarmTagList(int folderId);
    void insertAlarmTag(AlarmTag tag);
    void updateAlarmTag(AlarmTag tag);
    void deleteAlarmTag(int tagId);

    List<PlcConfig> selectPlcList();
    void insertOrUpdatePlc(PlcConfig plc);
    void deletePlc(String plcId);

    List<AlarmHistory> selectActiveAlarms(Map<String, Object> params);
    List<AlarmHistory> selectAlarmHistory(Map<String, Object> params);
    List<AlarmHistory> selectAlarmHistoryRange(Map<String, Object> params);
}
