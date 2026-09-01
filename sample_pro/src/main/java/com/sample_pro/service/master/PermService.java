package com.sample_pro.service.master;

import com.sample_pro.domain.PagePermission;
import java.util.List;
import java.util.Map;

public interface PermService {
    List<PagePermission> getPermsByEmpId(int empId);
    Map<String, PagePermission> getPermsMapByEmpId(int empId);
    void savePerms(int empId, List<PagePermission> perms);
}
