package com.sample_pro.dao.master;

import java.util.List;
import java.util.Map;

public interface UserDao {

	List<Map<String, Object>> empList();
	void empInsert(Map<String, Object> params);
	void empUpdate(Map<String, Object> params);
	void empToggle(Map<String, Object> params);
	void empDelete(Map<String, Object> params);

	Map<String, Object> empLoginCheck(Map<String, Object> params);

}
