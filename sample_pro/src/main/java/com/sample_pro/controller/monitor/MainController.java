package com.sample_pro.controller.monitor;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/main_1")
public class MainController {

    @RequestMapping(value = "/main",           method = RequestMethod.GET) public String main()          { return "/main_1/main.jsp"; }
    @RequestMapping(value = "/login",          method = RequestMethod.GET) public String login()         { return "/main_1/login.jsp"; }

    // 알람
    @RequestMapping(value = "/alarm/history",  method = RequestMethod.GET) public String alarmHistory()  { return "/main_1/monitor/alarm_history.jsp"; }
    @RequestMapping(value = "/alarm/ranking",  method = RequestMethod.GET) public String alarmRanking()  { return "/main_1/monitor/alarm_ranking.jsp"; }

    // 트렌드
    @RequestMapping(value = "/trend",          method = RequestMethod.GET) public String trend()         { return "/main_1/monitor/trend.jsp"; }

    // 시스템
    @RequestMapping(value = "/user/manage",    method = RequestMethod.GET) public String userManage()    { return "/main_1/master/user_manage.jsp"; }
    @RequestMapping(value = "/user/permission",method = RequestMethod.GET) public String userPermission(){ return "/main_1/master/user_permission.jsp"; }
}
