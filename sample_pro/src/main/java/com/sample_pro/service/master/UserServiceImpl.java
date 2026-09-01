package com.sample_pro.service.master;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sample_pro.dao.master.UserDao;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserDao userDao;

    @Override
    public List<Map<String, Object>> empList() {
        return userDao.empList();
    }
    @Override
    public void empInsert(Map<String, Object> params) {
        userDao.empInsert(params);
    }
    @Override
    public void empUpdate(Map<String, Object> params) {
        userDao.empUpdate(params);
    }
    @Override
    public void empToggle(int empId) {
        Map<String, Object> p = new java.util.HashMap<>();
        p.put("emp_id", empId);
        userDao.empToggle(p);
    }
    @Override
    public void empDelete(int empId) {
        Map<String, Object> p = new java.util.HashMap<>();
        p.put("emp_id", empId);
        userDao.empDelete(p);
    }

    @Override
    public Map<String, Object> empLoginCheck(String id, String pwNo) {
        Map<String, Object> params = new java.util.HashMap<>();
        params.put("id", id);
        params.put("pw_no", pwNo);
        return userDao.empLoginCheck(params);
    }

}
