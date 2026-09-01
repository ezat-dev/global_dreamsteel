-- tb_ez_in_out_security 테이블 생성
-- 센서 감지 이벤트 로그 저장

CREATE TABLE tb_ez_in_out_security (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_name VARCHAR(50) NOT NULL COMMENT '센서 이름 (예: 공장 입구)',
    sensor_addr VARCHAR(20) NOT NULL COMMENT '센서 주소 (예: D0002.A)',
    detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '감지 시간',
    status VARCHAR(10) NOT NULL DEFAULT 'ON' COMMENT '상태 (ON/OFF)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 인덱스 추가 (감지 시간으로 조회 최적화)
CREATE INDEX idx_detected_at ON tb_ez_in_out_security (detected_at);
CREATE INDEX idx_sensor_name ON tb_ez_in_out_security (sensor_name);