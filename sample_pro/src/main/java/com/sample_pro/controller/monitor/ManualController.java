package com.sample_pro.controller.monitor;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class ManualController {

    @RequestMapping(value = "/manual", method = RequestMethod.GET)
    public String manualPage() {
        return "/monitoring/ManualPage.jsp";
    }

    @RequestMapping(value = "/expage", method = RequestMethod.GET)
    public String exPage() {
        return "/monitoring/ExPage.jsp";
    }
}
