package com.sample_pro.dao.master;

import com.sample_pro.domain.PagePermission;
import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;
import javax.annotation.Resource;
import java.util.List;

@Repository
public class PermDaoImpl implements PermDao {

    @Resource(name = "session")
    private SqlSession sqlSession;

    @Override
    public List<PagePermission> selectByEmpId(int empId) {
        return sqlSession.selectList("PermMapper.selectByEmpId", empId);
    }

    @Override
    public void upsertPerm(PagePermission perm) {
        sqlSession.insert("PermMapper.upsertPerm", perm);
    }

    @Override
    public void deleteByEmpId(int empId) {
        sqlSession.delete("PermMapper.deleteByEmpId", empId);
    }
}
