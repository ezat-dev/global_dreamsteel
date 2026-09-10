package com.mes.dao.scada;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.mes.domain.scada.ScadaAlarm;
import com.mes.domain.scada.ScadaUser;

/**
 * SCADA(HMI) 화면 데이터 접근 계층. global_dreamsteel 스키마만 본다.
 *
 * <p>
 * 구현이 하나뿐이고 두 번째가 생길 일이 없어서 인터페이스를 두지 않는다.
 * 파라미터·반환은 전부 도메인 객체로 주고받으므로, 조회 조건이 늘어도 시그니처를 바꿀 필요가 없다.
 * </p>
 */
@Repository
public class ScadaDao {

    @Autowired
    private SqlSessionTemplate sqlSession;

    /**
     * 사용자 1명 조회. param의 userId + userPassword가 모두 일치하는 행만 가져온다.
     * 
     * @return 일치하는 사용자(비밀번호 제외), 없으면 null
     */
    public ScadaUser getUser(ScadaUser param) {
        return sqlSession.selectOne("ScadaUserMapper.getUser", param);
    }

    public List<ScadaAlarm> getAlarmList(ScadaAlarm scadaAlarm) {
        return sqlSession.selectList("ScadaAlarmMapper.getAlarmList", scadaAlarm);
    }

    public List<ScadaAlarm> getTrendList(ScadaAlarm scadaAlarm) {
        return sqlSession.selectList("ScadaAlarmMapper.getTrendList", scadaAlarm);
    }

    public List<ScadaAlarm> getLogList(ScadaAlarm scadaAlarm) {
        return sqlSession.selectList("ScadaUserMapper.getLogList", scadaAlarm);
    }

    public boolean insertUser(ScadaUser scadaUser) {
        int result = sqlSession.insert("ScadaUserMapper.insertUser", scadaUser);
        if (result <= 0) {
            return false;
        }
        return true;
    }

    public ScadaUser getId(ScadaUser scadaUser) {
        return sqlSession.selectOne("ScadaUserMapper.getId", scadaUser);
    }

    public List<ScadaUser> getUserList(ScadaUser scadaUser) {
        return sqlSession.selectList("ScadaUserMapper.getUserList", scadaUser);
    }

    public boolean updateUser(ScadaUser scadaUser) {
        int result = sqlSession.update("ScadaUserMapper.updateUser", scadaUser);
        if (result <= 0) {
            return false;
        }
        return true;
    }

    public List<ScadaAlarm> getAlarmTagList(ScadaAlarm scadaAlarm) {
        return sqlSession.selectList("ScadaAlarmMapper.getAlarmTagList", scadaAlarm);
    }

    public boolean insertLog(ScadaUser scadaUser) {
        int result = sqlSession.insert("ScadaUserMapper.insertLog", scadaUser);
        if (result <= 0) {
            return false;
        }
        return true;
    }
}
