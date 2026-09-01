package com.sample_pro.service.master;

import com.sample_pro.dao.master.PermDao;
import com.sample_pro.domain.PagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service("permService")
public class PermServiceImpl implements PermService {

    @Autowired
    private PermDao permDao;

    @Override
    public List<PagePermission> getPermsByEmpId(int empId) {
        return permDao.selectByEmpId(empId);
    }

    @Override
    public Map<String, PagePermission> getPermsMapByEmpId(int empId) {
        List<PagePermission> list = permDao.selectByEmpId(empId);
        Map<String, PagePermission> map = new HashMap<>();
        for (PagePermission p : list) {
            map.put(p.getPageUrl(), p);
        }
        return map;
    }

    @Override
    @Transactional
    public void savePerms(int empId, List<PagePermission> perms) {
        permDao.deleteByEmpId(empId);
        for (PagePermission p : perms) {
            p.setEmpId(empId);
            if (p.getCanView() == null) p.setCanView("Y");
            if (p.getCanAdd()  == null) p.setCanAdd("Y");
            if (p.getCanEdit() == null) p.setCanEdit("Y");
            if (p.getCanDel()  == null) p.setCanDel("Y");
            permDao.upsertPerm(p);
        }
    }
}
