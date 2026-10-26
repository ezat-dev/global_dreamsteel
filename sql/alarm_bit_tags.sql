-- 알람 발생 비트 200개(M1000~M1199)를 알람화면 폴더(6 '알람페이지_램프')에 넣는다 (2026-10-26)
--
-- 화면 규칙: 발생 비트(alarm_1000, M1000)만 1이면 칸이 빨갛게 깜빡이고,
--            램프 비트(alarm_1000_lamp, M1200)도 1이면 지금처럼 빨갛게 켜진다.
-- 화면은 폴더 6의 값을 이름으로 읽으므로, 발생 비트도 같은 폴더에 같은 이름(alarm_xxxx)으로 있어야 한다.
--
-- 알람 정의(tb_alarm_tag) 200행을 그대로 복사한다 — 이름·주소·plc_id가 정의와 어긋날 일이 없다.
-- 알람 이력(tb_alarm_history)은 이것과 상관없이 지금처럼 tb_alarm_tag 기준으로 쌓인다
-- (folders_tags 행은 값만 메모리에 들고 DB에 기록하지 않는다).
-- 한 번만 실행한다 — 다시 실행하면 (folder_id, name) 중복으로 오류가 난다.

INSERT INTO ez_scada.folders_tags (folder_id, name, address, plc_id, description, enabled, type)
SELECT 6, tag_name, address, plc_id, CONCAT('알람 발생 — ', alarm_msg), 1, 'WORD'
FROM ez_scada.tb_alarm_tag
ORDER BY tag_id;
