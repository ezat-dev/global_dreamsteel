package com.sample_pro.service.master;

import java.util.List;
import java.util.Map;

public interface UserService {

	List<Map<String, Object>> empList();
	void empInsert(Map<String, Object> params);
	void empUpdate(Map<String, Object> params);
	void empToggle(int empId);
	void empDelete(int empId);

	Map<String, Object> empLoginCheck(String id, String pwNo);

}
