package com.sample_pro.dao.master;

import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.apache.ibatis.session.SqlSession;
import org.springframework.stereotype.Repository;

@Repository
public class UserDaoImpl implements UserDao{

	 @Resource(name="session")
	    private SqlSession sqlSession;

	@Override
	public List<Map<String, Object>> empList() {
		return sqlSession.selectList("users.empList");
	}
	@Override
	public void empInsert(Map<String, Object> params) {
		sqlSession.insert("users.empInsert", params);
	}
	@Override
	public void empUpdate(Map<String, Object> params) {
		sqlSession.update("users.empUpdate", params);
	}
	@Override
	public void empToggle(Map<String, Object> params) {
		sqlSession.update("users.empToggle", params);
	}
	@Override
	public void empDelete(Map<String, Object> params) {
		sqlSession.delete("users.empDelete", params);
	}

	@Override
	public Map<String, Object> empLoginCheck(Map<String, Object> params) {
		return sqlSession.selectOne("users.empLoginCheck", params);
	}

}
