package com.sample_pro.dao.master;

import com.sample_pro.domain.PagePermission;
import java.util.List;

public interface PermDao {
    List<PagePermission> selectByEmpId(int empId);
    void upsertPerm(PagePermission perm);
    void deleteByEmpId(int empId);
}
