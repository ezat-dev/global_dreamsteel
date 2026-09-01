package com.sample_pro.dao.monitor;

import com.sample_pro.domain.PlcConfig;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

import javax.annotation.Resource;
import java.util.List;

@Repository
public class PlcConfigDaoImpl implements PlcConfigDao {

    @Resource(name = "session")
    private SqlSession sqlSession;

    @Override
    public List<PlcConfig> selectAll() {
        return sqlSession.selectList("PlcConfigMapper.selectAll");
    }

    @Override
    public PlcConfig selectById(String plcId) {
        return sqlSession.selectOne("PlcConfigMapper.selectById", plcId);
    }
}
