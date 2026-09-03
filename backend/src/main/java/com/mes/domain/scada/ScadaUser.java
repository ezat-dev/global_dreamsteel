package com.mes.domain.scada;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCADA(HMI) 사용자 — global_dream 스키마의 {@code user} 테이블 1행.
 *
 * <p>컬럼이 id / user_id / user_password / user_name 4개뿐이라 부서·권한·사용여부 같은 항목은 아직 없다.
 * 요청 바디와 응답에도 이 클래스를 그대로 쓴다(요청 전용 클래스를 따로 두지 않는다).</p>
 */
@Data
@NoArgsConstructor
public class ScadaUser {

    private Long id;
    private String userId;
    private String userPassword;
    private String userName;
    private String logId;
    private String address;
    private String sendValue;
    private String insertDate;
    private String userRole;
    private String deleteYn;
}
