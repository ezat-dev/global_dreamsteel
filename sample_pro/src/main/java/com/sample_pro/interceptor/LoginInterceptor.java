package com.sample_pro.interceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.web.servlet.HandlerInterceptor;

public class LoginInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        HttpSession session = request.getSession(false);

        boolean loggedIn = session != null
            && (session.getAttribute("loginEmp")  != null
             || session.getAttribute("loginUser") != null);

        if (loggedIn) return true;

        // AJAX / REST 요청 판단 (fetch API 포함)
        String accept      = request.getHeader("Accept");
        String contentType = request.getHeader("Content-Type");
        String xRequested  = request.getHeader("X-Requested-With");

        boolean isAjax = "XMLHttpRequest".equals(xRequested)
            || (contentType != null && contentType.contains("application/json"))
            || (accept != null && !accept.contains("text/html") && accept.contains("application/json"));

        if (isAjax) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"error\":\"로그인이 필요합니다.\"}");
            return false;
        }

        // 일반 페이지 요청 → 로그인 페이지로 리다이렉트
        String contextPath = request.getContextPath();
        response.sendRedirect(contextPath + "/main_1/login");
        return false;
    }
}
