package com.sample_pro.service.monitor;

import com.sample_pro.domain.AlarmFolder;
import com.sample_pro.domain.AlarmHistory;
import com.sample_pro.domain.AlarmTag;
import com.sample_pro.domain.PlcConfig;

import java.util.List;

public interface AlarmService {

    List<AlarmFolder> getAlarmFolderList();
    void insertAlarmFolder(AlarmFolder folder);
    void deleteAlarmFolder(int folderId);

    List<AlarmTag> getAlarmTagList(int folderId);
    void insertAlarmTag(AlarmTag tag);
    void updateAlarmTag(AlarmTag tag);
    void deleteAlarmTag(int tagId);

    List<PlcConfig> getPlcList();
    void savePlc(PlcConfig plc);
    void removePlc(String plcId);

    List<AlarmHistory> getActiveAlarms(int limit);
    List<AlarmHistory> getAlarmHistory(int limit);
    List<AlarmHistory> getAlarmHistoryRange(String from, String to);
}
