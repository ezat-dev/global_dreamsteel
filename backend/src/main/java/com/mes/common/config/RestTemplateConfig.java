package com.mes.common.config;

import java.time.Duration;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * 외부 서버(C# PlcApiServer, 5050) 호출용 HTTP 클라이언트.
 *
 * <p>
 * 지금까지 자바는 요청을 받는 쪽만 했지만, PLC 태그 쓰기는 자바가 C#에 요청을 보내야 한다
 * (C#은 로그인한 사용자를 모르는데 scada_log에 누가 바꿨는지 남겨야 한다 —
 * {@code ScadaServiceImpl.writeTag} 참고). 그때 쓰는 것이 이 빈이다.
 * </p>
 *
 * <p>
 * 스프링 부트가 자동으로 등록해 주는 것은 {@link RestTemplateBuilder}뿐이고
 * {@link RestTemplate} 자체는 아니다 — 그래서 이 클래스가 없으면 주입 대상을 못 찾고
 * 기동 시점에 NoSuchBeanDefinitionException으로 떨어진다.
 * </p>
 *
 * <p>
 * <b>타임아웃이 이 설정의 핵심이다.</b> 기본값은 무제한이라, C#이 멈추거나 PLC가 응답하지
 * 않으면 호출이 끝나지 않고 톰캣 요청 스레드를 계속 물고 있는다. 그런 요청이 쌓이면 스레드
 * 풀이 차서 관계없는 화면(로그인·목록 조회)까지 응답하지 않는다.
 * </p>
 *
 * <p>
 * 2초로 잡은 근거: 프론트의 axios 타임아웃이 10초이고, C#은 PLC 연결이 실패하면 자체
 * 쿨다운으로 3초 안에 응답을 돌려준다. 그보다 짧게 끊어 실패를 빨리 알리는 편이 조작
 * 화면에서는 낫다 — 버튼을 눌렀는데 10초를 기다리는 것보다 2초에 실패가 뜨는 것이 낫다.
 * PLC 왕복이 정상일 때는 수십 ms라 2초로 정상 요청이 끊길 여지는 없다.
 * </p>
 */
@Configuration
public class RestTemplateConfig {

    /** 연결·읽기 타임아웃(초). 늘려야 할 일이 생기면 여기만 고친다. */
    private static final int TIMEOUT_SECONDS = 2;

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                .readTimeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                .build();
    }
}
