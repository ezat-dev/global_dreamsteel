package com.mes.common.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 화면 주소를 화면(index.html)으로 돌려준다 — 프론트를 jar 안에 넣어 8081 한 포트로 서비스할 때 필요하다.
 *
 * <p>
 * 프론트는 bootJar가 빌드해서 jar의 static/에 넣는다(build.gradle의 buildFrontend). 스프링은 static/ 안의
 * 파일(index.html, /assets/…)은 그대로 내보내지만, /drive·/login 같은 주소는 실제 파일이 아니라
 * 리액트 라우터가 브라우저 안에서 그리는 화면이라 서버에는 없다. 그 주소에서 새로고침하거나 주소를
 * 직접 치면 404가 난다 — 그런 요청을 index.html로 넘겨 리액트가 받게 한다.
 * </p>
 *
 * <p>
 * 넘기는 것은 점(.)이 없는 한 단계 주소뿐이다(/, /drive, /alarmHistory …). 화면 주소가 전부 한 단계라
 * 그것으로 충분하고, /api/… 는 두 단계 이상이라 걸리지 않으며 /assets/x.js, /favicon.ico 같은 파일은
 * 점이 있어 걸리지 않는다. 예전 주소 /scada/… 는 리액트가 / 로 돌려보내므로 같이 넘긴다.
 * </p>
 *
 * <p>
 * com.mes.controller가 아니라 여기 두는 이유: ControllerLogAspect가 controller 패키지의 요청을 전부
 * 로그 파일에 남기는데, 화면을 열 때마다 이 요청이 찍히면 로그만 늘어난다.
 * </p>
 *
 * <p>
 * bootRun(run-backend.bat)처럼 jar에 프론트가 없을 때는 index.html이 없어 지금과 같이 오류가 난다 —
 * 개발할 때는 화면을 vite(5051)로 띄우므로 상관없다.
 * </p>
 */
@Controller
public class SpaForwardController {

    @GetMapping({ "/", "/{path:[^\\.]*}", "/scada/**" })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
