package com.mes.common.log;

import java.util.Arrays;
import java.util.stream.Collectors;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/**
 * 컨트롤러 요청·응답을 로그 파일에 남긴다.
 *
 * <p>
 * 목적은 "이 웹에서 누가 언제 어떤 요청을 보냈나"다. scada_log와 내용이 겹치지만 그건
 * 상관없다 — scada_log는 조작 이력(쓰기만)이고, 여기는 조회까지 포함한 접근 기록이다.
 * </p>
 *
 * <p>
 * 화면을 옮길 때마다 checkSession이 나가므로, 그 줄들이 사실상 화면 이동 기록이 된다.
 * </p>
 *
 * <p>
 * 남기는 것: 사용자 · HTTP 메서드 · URI · 인자 · 소요시간, 그리고 조작(GET이 아닌 것)의
 * 응답 본문. 시각은 logback이 줄 앞에 붙인다.
 * </p>
 *
 * <p>
 * <b>조회(GET)의 응답 본문은 남기지 않는다.</b> 조회로 나간 데이터는 DB에 그대로 있어서
 * 로그에 또 받아 적을 이유가 없고, getLogList처럼 기간 없이 부르면 응답이 수십 MB라
 * 문자열로 만드는 것만으로 메모리를 먹는다. 무엇을 조회했는지는 인자에 남는다.
 * </p>
 */
@Aspect
@Component
public class ControllerLogAspect {

    private static final Logger log = LoggerFactory.getLogger(ControllerLogAspect.class);

    /**
     * 직렬화에만 쓴다. 스프링이 MVC용으로 만든 것과 섞이지 않게 여기서 따로 든다.
     *
     * <p>
     * NON_NULL — 값이 있는 것만 남긴다. 조회는 @ModelAttribute로 빈 DTO가 들어와서
     * 그냥 찍으면 null 필드가 서른 개씩 늘어선다. "조건 없이 전체 조회"라는 한 가지
     * 사실을 알려고 그 줄을 다 읽어야 하고, 실제로 넘긴 값이 그 사이에 묻힌다.
     * </p>
     */
    private static final ObjectMapper MAPPER = JsonMapper.builder()
            .serializationInclusion(JsonInclude.Include.NON_NULL)
            .build();

    /**
     * 한 줄에 담을 최대 글자 수.
     *
     * <p>
     * 응답 본문을 통째로 남기면 조회 응답 하나가 수십 MB까지 갈 수 있다(getLogList를
     * 기간 없이 부르면 scada_log 전체가 온다). 그걸 한 줄로 만들면 문자열을 메모리에
     * 다 올리고 파일에도 그대로 쓴다. 넘치는 만큼은 잘라내고 원래 길이를 덧붙인다.
     * </p>
     *
     * <p>
     * 로그 파일이 하루 150KB 수준이라 이 값을 올려도 용량은 여유가 많다 — 다만 위의
     * 메모리·속도 문제는 그대로 남는다.
     * </p>
     */
    private static final int MAX_LEN = 10000;

    /**
     * 비밀번호를 가린다. {@code "userPassword":"1234"} → {@code "userPassword":"***"}
     *
     * <p>
     * 로그인 요청에 비밀번호가 평문으로 들어온다. 인자를 그대로 찍으면 로그 파일에
     * 그대로 쌓이므로 반드시 지워야 한다. DTO 종류를 가리지 않게 직렬화된 문자열에서
     * 이름으로 찾아 가린다 — 필드가 늘어도 여기에 이름만 추가하면 된다.
     * </p>
     */
    private static final String SECRET_PATTERN = "(?i)\"(userPassword|password|pwd)\"\\s*:\\s*\"[^\"]*\"";

    @Around("execution(* com.mes.controller..*(..))")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = currentRequest();
        String who = loginUserId(request);
        String what = request == null
                ? joinPoint.getSignature().toShortString()
                : request.getMethod() + " " + request.getRequestURI();

        log.info("요청  user={} {} args={}", who, what, describeArgs(joinPoint.getArgs()));

        /* 조회는 응답 본문을 남기지 않는다 — 나간 데이터는 DB에 그대로 있고, 큰 조회는
           문자열로 만드는 것만으로 메모리를 먹는다. 그래서 아예 직렬화하지 않는다. */
        boolean isQuery = request != null && "GET".equalsIgnoreCase(request.getMethod());

        long started = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long took = System.currentTimeMillis() - started;
            if (isQuery) {
                log.info("응답  user={} {} {}ms 성공", who, what, took);
            } else {
                log.info("응답  user={} {} {}ms body={}", who, what, took, describeResult(result));
            }
            return result;
        } catch (Throwable e) {
            /*
             * 예외 자체는 GlobalExceptionHandler가 스택까지 남긴다. 여기서는 "그 요청이
             * 실패로 끝났다"만 같은 형식으로 남겨서, 요청 줄과 짝이 맞게 한다.
             */
            log.info("응답  user={} {} {}ms 실패={}",
                    who, what, System.currentTimeMillis() - started, e.getMessage());
            throw e;
        }
    }

    /** 요청 밖(스케줄러 등)에서 불리면 null이다 — 그때도 로그는 남겨야 하므로 예외로 두지 않는다. */
    private HttpServletRequest currentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        return attrs instanceof ServletRequestAttributes sra ? sra.getRequest() : null;
    }

    /** 로그인 전(로그인 요청 자체)이나 세션이 끊긴 요청은 '-'로 남는다. */
    private String loginUserId(HttpServletRequest request) {
        if (request == null) {
            return "-";
        }
        // getSession(false) — 없으면 만들지 않는다. true로 두면 로그가 세션을 새로 만든다.
        HttpSession session = request.getSession(false);
        Object userId = session == null ? null : session.getAttribute("loginUserId");
        return userId == null ? "-" : String.valueOf(userId);
    }

    private String describeArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return "[]";
        }
        return Arrays.stream(args)
                .map(this::toText)
                .collect(Collectors.joining(", ", "[", "]"));
    }

    private String describeResult(Object result) {
        // writeTag 같은 메서드는 ResponseEntity로 감싸서 준다 — 안의 본문만 남긴다
        Object body = result instanceof ResponseEntity<?> entity ? entity.getBody() : result;
        return toText(body);
    }

    private String toText(Object value) {
        if (value == null) {
            return "null";
        }
        /*
         * 서블릿 객체는 직렬화할 것이 아니다 — HttpSession을 JSON으로 만들면 세션 속성이
         * 통째로 딸려 나오고, 순환 참조로 터지기도 한다. 종류만 남긴다.
         */
        if (value instanceof HttpServletRequest || value instanceof HttpSession) {
            return value.getClass().getSimpleName();
        }

        String text;
        try {
            text = MAPPER.writeValueAsString(value);
        } catch (Exception e) {
            // 직렬화가 안 되는 값 때문에 요청이 실패하면 안 된다 — toString으로 물러선다
            text = String.valueOf(value);
        }

        text = text.replaceAll(SECRET_PATTERN, "\"$1\":\"***\"");
        if (text.length() > MAX_LEN) {
            text = text.substring(0, MAX_LEN) + "...(총 " + text.length() + "자)";
        }
        return text;
    }
}
