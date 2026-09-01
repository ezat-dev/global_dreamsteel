package com.sample_pro.controller.master;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.sample_pro.domain.PagePermission;

import com.sample_pro.service.master.PermService;
import com.sample_pro.service.master.UserService;

@Controller
public class UserController {

	@Autowired
	private UserService userService;

	@Autowired
	private PermService permService;

	private static final String[] ALL_PAGE_URLS = {
		"trend", "alarm/history", "alarm/ranking",
		"user/manage", "user/permission"
	};

	/* 직원 목록 조회 */
	@RequestMapping(value = "/emp/list", method = RequestMethod.GET, produces = "application/json;charset=UTF-8")
	@ResponseBody
	public Map<String, Object> empList() {
		Map<String, Object> r = new HashMap<>();
		try { r.put("success", true);  r.put("data", userService.empList()); }
		catch(Exception e) { r.put("success", false); r.put("message", e.getMessage()); }
		return r;
	}

	/* 직원 저장 (INSERT / UPDATE) */
	@RequestMapping(value = "/emp/save", method = RequestMethod.POST, produces = "application/json;charset=UTF-8")
	@ResponseBody
	public Map<String, Object> empSave(@RequestBody Map<String, Object> body) {
		Map<String, Object> r = new HashMap<>();
		try {
			Object empId = body.get("emp_id");
			if (empId == null || empId.toString().trim().isEmpty()) {
				userService.empInsert(body);
				// 신규 직원 생성 시 전체 페이지 권한 자동 부여
				Object newEmpId = body.get("emp_id");
				if (newEmpId != null) {
					List<PagePermission> perms = new ArrayList<>();
					for (String url : ALL_PAGE_URLS) {
						PagePermission p = new PagePermission();
						p.setPageUrl(url);
						p.setCanView("Y"); p.setCanAdd("Y"); p.setCanEdit("Y"); p.setCanDel("Y");
						perms.add(p);
					}
					permService.savePerms(Integer.parseInt(newEmpId.toString()), perms);
				}
			} else {
				userService.empUpdate(body);
			}
			r.put("success", true);
		} catch(Exception e) { r.put("success", false); r.put("message", e.getMessage()); }
		return r;
	}

	/* 직원 활성/비활성 토글 */
	@RequestMapping(value = "/emp/toggle", method = RequestMethod.POST, produces = "application/json;charset=UTF-8")
	@ResponseBody
	public Map<String, Object> empToggle(@RequestBody Map<String, Object> body) {
		Map<String, Object> r = new HashMap<>();
		try { userService.empToggle(Integer.parseInt(body.get("emp_id").toString())); r.put("success", true); }
		catch(Exception e) { r.put("success", false); r.put("message", e.getMessage()); }
		return r;
	}

	/* 직원 삭제 */
	@RequestMapping(value = "/emp/delete", method = RequestMethod.POST, produces = "application/json;charset=UTF-8")
	@ResponseBody
	public Map<String, Object> empDelete(@RequestBody Map<String, Object> body) {
		Map<String, Object> r = new HashMap<>();
		try { userService.empDelete(Integer.parseInt(body.get("emp_id").toString())); r.put("success", true); }
		catch(Exception e) { r.put("success", false); r.put("message", e.getMessage()); }
		return r;
	}

	/* 현재 로그인 직원 정보 */
	@RequestMapping(value = "/emp/me", method = RequestMethod.GET, produces = "application/json;charset=UTF-8")
	@ResponseBody
	public Map<String, Object> empMe(HttpSession session) {
		Map<String, Object> r = new HashMap<>();
		Object emp = session.getAttribute("loginEmp");
		r.put("success", emp != null);
		if (emp != null) r.put("data", emp);
		return r;
	}

	/* 로그아웃 */
	@RequestMapping(value = "/user/logout", method = RequestMethod.POST, produces = "application/json;charset=UTF-8")
	@ResponseBody
	public Map<String, Object> logout(HttpSession session) {
		session.invalidate();
		Map<String, Object> r = new HashMap<>();
		r.put("success", true);
		return r;
	}

	@RequestMapping(value = "/user/login", method = RequestMethod.POST, produces = "application/json;charset=UTF-8")
	@ResponseBody
	public Map<String, Object> empLogin(
			@RequestParam String user_id,
			@RequestParam String user_pw,
			HttpSession session) {
		Map<String, Object> rtnMap = new HashMap<>();
		if (user_id == null || user_id.trim().isEmpty()) {
			rtnMap.put("success", false); rtnMap.put("message", "아이디를 입력하세요."); return rtnMap;
		}
		if (user_pw == null || user_pw.trim().isEmpty()) {
			rtnMap.put("success", false); rtnMap.put("message", "비밀번호를 입력하세요."); return rtnMap;
		}
		Map<String, Object> emp = userService.empLoginCheck(user_id.trim(), user_pw);
		if (emp == null) {
			rtnMap.put("success", false); rtnMap.put("message", "아이디 또는 비밀번호가 올바르지 않습니다."); return rtnMap;
		}
		session.setAttribute("loginEmp", emp);
		rtnMap.put("success", true);
		return rtnMap;
	}

}
