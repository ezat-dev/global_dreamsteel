package com.mes.service.scada.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
import com.mes.dao.scada.ScadaDao;
import com.mes.domain.scada.ScadaAlarm;
import com.mes.domain.scada.ScadaUser;
import com.mes.service.scada.ScadaService;

@Service
public class ScadaServiceImpl implements ScadaService {

    @Autowired
    private ScadaDao scadaDao;

    @Override
    public ScadaUser getUser(ScadaUser param) {
        if (param == null
                || param.getUserId() == null || param.getUserId().isBlank()
                || param.getUserPassword() == null || param.getUserPassword().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "아이디와 비밀번호를 입력해주세요.");
        }

        ScadaUser user = scadaDao.getUser(param);
        if (user == null) {
            // 아이디가 없는 건지 비밀번호가 틀린 건지는 구분해서 알려주지 않는다(계정 존재 여부 노출 방지).
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "아이디 또는 비밀번호가 일치하지 않습니다.");
        }
        return user;
    }

    @Override
    public List<ScadaAlarm> getAlarmList(ScadaAlarm scadaAlarm) {
        return scadaDao.getAlarmList(scadaAlarm);
    }

    @Override
    public List<ScadaAlarm> getTrendList(ScadaAlarm scadaAlarm) {
        return scadaDao.getTrendList(scadaAlarm);
    }

    @Override
    public List<ScadaAlarm> getLogList(ScadaAlarm scadaAlarm) {
        return scadaDao.getLogList(scadaAlarm);
    }

        @Override
    public boolean insertUser(ScadaUser scadaUser) {
        return scadaDao.insertUser(scadaUser);
    }

    @Override
    public ScadaUser getId(ScadaUser scadaUser) {
        return scadaDao.getId(scadaUser);
    }

    @Override
    public List<ScadaUser> getUserList(ScadaUser scadaUser) {
        return scadaDao.getUserList(scadaUser);
    }

    @Override
    public boolean updateUser(ScadaUser scadaUser) {
        return scadaDao.updateUser(scadaUser);
    }

        @Override
    public List<ScadaAlarm> getAlarmTagList(ScadaAlarm scadaAlarm) {
        return scadaDao.getAlarmTagList(scadaAlarm);
    }
}
