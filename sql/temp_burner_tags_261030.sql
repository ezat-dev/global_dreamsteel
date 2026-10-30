-- 온도제어·버너 태그 주소 갱신 (2026-10-30, 'PLC Point Configuration_EZ26391_261030 (버너부분 수정).xlsx' 기준)
-- 주소는 존마다 R 100개다(1존 R100~R199, 2존 R200~R299 …). UPDATE만 있다 — 여러 번 실행해도 결과가 같다.
--
-- 태그를 이름으로 고친다(폴더를 가리지 않는다). tic_zN_pv / sv / sv_cmd / mv 는 온도화면(8)뿐 아니라
-- 연소화면(7)·구동화면(9)·엔지니어링(12)에도 같은 이름으로 한 줄씩 있어서, 이름으로 고쳐야 한 번에 다 바뀐다.

-- ===== 1. 녹색 — 온도제어 태그 =====
-- 1존 (R100~)
UPDATE ez_scada.folders_tags SET address = 'R100', description = '1존 온도 PV' WHERE name = 'tic_z1_pv';
UPDATE ez_scada.folders_tags SET address = 'R101', description = '1존 TIC 출력(MV) PV' WHERE name = 'tic_z1_mv';
UPDATE ez_scada.folders_tags SET address = 'R120', description = '1존 온도 SV(설정)' WHERE name = 'tic_z1_sv_cmd';
UPDATE ez_scada.folders_tags SET address = 'R121', description = '1존 PID (P) SV' WHERE name = 'tic_z1_pid_p';
UPDATE ez_scada.folders_tags SET address = 'R122', description = '1존 PID (I) SV' WHERE name = 'tic_z1_pid_i';
UPDATE ez_scada.folders_tags SET address = 'R123', description = '1존 PID (D) SV' WHERE name = 'tic_z1_pid_d';
UPDATE ez_scada.folders_tags SET address = 'R124', description = '1존 TIC 수동 출력(MV) SV' WHERE name = 'tic_z1_manual_mv';
UPDATE ez_scada.folders_tags SET address = 'R126', description = '1존 온도 경보(HH) SV' WHERE name = 'tic_z1_alarm_hh';
UPDATE ez_scada.folders_tags SET address = 'R127', description = '1존 온도 경보(H) SV' WHERE name = 'tic_z1_alarm_h';
UPDATE ez_scada.folders_tags SET address = 'R128', description = '1존 온도 경보(L) SV' WHERE name = 'tic_z1_alarm_l';
UPDATE ez_scada.folders_tags SET address = 'R129', description = '1존 온도 경보(LL) SV' WHERE name = 'tic_z1_alarm_ll';
UPDATE ez_scada.folders_tags SET address = 'R136', description = '1존 TIC 출력 제한(High)' WHERE name = 'tic_z1_range_hi';
UPDATE ez_scada.folders_tags SET address = 'R137', description = '1존 TIC 출력 제한(Low)' WHERE name = 'tic_z1_range_lo';
-- 2존 (R200~)
UPDATE ez_scada.folders_tags SET address = 'R200', description = '2존 온도 PV' WHERE name = 'tic_z2_pv';
UPDATE ez_scada.folders_tags SET address = 'R201', description = '2존 TIC 출력(MV) PV' WHERE name = 'tic_z2_mv';
UPDATE ez_scada.folders_tags SET address = 'R220', description = '2존 온도 SV(설정)' WHERE name = 'tic_z2_sv_cmd';
UPDATE ez_scada.folders_tags SET address = 'R221', description = '2존 PID (P) SV' WHERE name = 'tic_z2_pid_p';
UPDATE ez_scada.folders_tags SET address = 'R222', description = '2존 PID (I) SV' WHERE name = 'tic_z2_pid_i';
UPDATE ez_scada.folders_tags SET address = 'R223', description = '2존 PID (D) SV' WHERE name = 'tic_z2_pid_d';
UPDATE ez_scada.folders_tags SET address = 'R224', description = '2존 TIC 수동 출력(MV) SV' WHERE name = 'tic_z2_manual_mv';
UPDATE ez_scada.folders_tags SET address = 'R226', description = '2존 온도 경보(HH) SV' WHERE name = 'tic_z2_alarm_hh';
UPDATE ez_scada.folders_tags SET address = 'R227', description = '2존 온도 경보(H) SV' WHERE name = 'tic_z2_alarm_h';
UPDATE ez_scada.folders_tags SET address = 'R228', description = '2존 온도 경보(L) SV' WHERE name = 'tic_z2_alarm_l';
UPDATE ez_scada.folders_tags SET address = 'R229', description = '2존 온도 경보(LL) SV' WHERE name = 'tic_z2_alarm_ll';
UPDATE ez_scada.folders_tags SET address = 'R236', description = '2존 TIC 출력 제한(High)' WHERE name = 'tic_z2_range_hi';
UPDATE ez_scada.folders_tags SET address = 'R237', description = '2존 TIC 출력 제한(Low)' WHERE name = 'tic_z2_range_lo';
-- 3존 (R300~)
UPDATE ez_scada.folders_tags SET address = 'R300', description = '3존 온도 PV' WHERE name = 'tic_z3_pv';
UPDATE ez_scada.folders_tags SET address = 'R301', description = '3존 TIC 출력(MV) PV' WHERE name = 'tic_z3_mv';
UPDATE ez_scada.folders_tags SET address = 'R320', description = '3존 온도 SV(설정)' WHERE name = 'tic_z3_sv_cmd';
UPDATE ez_scada.folders_tags SET address = 'R321', description = '3존 PID (P) SV' WHERE name = 'tic_z3_pid_p';
UPDATE ez_scada.folders_tags SET address = 'R322', description = '3존 PID (I) SV' WHERE name = 'tic_z3_pid_i';
UPDATE ez_scada.folders_tags SET address = 'R323', description = '3존 PID (D) SV' WHERE name = 'tic_z3_pid_d';
UPDATE ez_scada.folders_tags SET address = 'R324', description = '3존 TIC 수동 출력(MV) SV' WHERE name = 'tic_z3_manual_mv';
UPDATE ez_scada.folders_tags SET address = 'R326', description = '3존 온도 경보(HH) SV' WHERE name = 'tic_z3_alarm_hh';
UPDATE ez_scada.folders_tags SET address = 'R327', description = '3존 온도 경보(H) SV' WHERE name = 'tic_z3_alarm_h';
UPDATE ez_scada.folders_tags SET address = 'R328', description = '3존 온도 경보(L) SV' WHERE name = 'tic_z3_alarm_l';
UPDATE ez_scada.folders_tags SET address = 'R329', description = '3존 온도 경보(LL) SV' WHERE name = 'tic_z3_alarm_ll';
UPDATE ez_scada.folders_tags SET address = 'R336', description = '3존 TIC 출력 제한(High)' WHERE name = 'tic_z3_range_hi';
UPDATE ez_scada.folders_tags SET address = 'R337', description = '3존 TIC 출력 제한(Low)' WHERE name = 'tic_z3_range_lo';
-- 4존 (R400~)
UPDATE ez_scada.folders_tags SET address = 'R400', description = '4존 온도 PV' WHERE name = 'tic_z4_pv';
UPDATE ez_scada.folders_tags SET address = 'R401', description = '4존 TIC 출력(MV) PV' WHERE name = 'tic_z4_mv';
UPDATE ez_scada.folders_tags SET address = 'R420', description = '4존 온도 SV(설정)' WHERE name = 'tic_z4_sv_cmd';
UPDATE ez_scada.folders_tags SET address = 'R421', description = '4존 PID (P) SV' WHERE name = 'tic_z4_pid_p';
UPDATE ez_scada.folders_tags SET address = 'R422', description = '4존 PID (I) SV' WHERE name = 'tic_z4_pid_i';
UPDATE ez_scada.folders_tags SET address = 'R423', description = '4존 PID (D) SV' WHERE name = 'tic_z4_pid_d';
UPDATE ez_scada.folders_tags SET address = 'R424', description = '4존 TIC 수동 출력(MV) SV' WHERE name = 'tic_z4_manual_mv';
UPDATE ez_scada.folders_tags SET address = 'R426', description = '4존 온도 경보(HH) SV' WHERE name = 'tic_z4_alarm_hh';
UPDATE ez_scada.folders_tags SET address = 'R427', description = '4존 온도 경보(H) SV' WHERE name = 'tic_z4_alarm_h';
UPDATE ez_scada.folders_tags SET address = 'R428', description = '4존 온도 경보(L) SV' WHERE name = 'tic_z4_alarm_l';
UPDATE ez_scada.folders_tags SET address = 'R429', description = '4존 온도 경보(LL) SV' WHERE name = 'tic_z4_alarm_ll';
UPDATE ez_scada.folders_tags SET address = 'R436', description = '4존 TIC 출력 제한(High)' WHERE name = 'tic_z4_range_hi';
UPDATE ez_scada.folders_tags SET address = 'R437', description = '4존 TIC 출력 제한(Low)' WHERE name = 'tic_z4_range_lo';
-- 5존 (R500~)
UPDATE ez_scada.folders_tags SET address = 'R500', description = '5존 온도 PV' WHERE name = 'tic_z5_pv';
UPDATE ez_scada.folders_tags SET address = 'R501', description = '5존 TIC 출력(MV) PV' WHERE name = 'tic_z5_mv';
UPDATE ez_scada.folders_tags SET address = 'R520', description = '5존 온도 SV(설정)' WHERE name = 'tic_z5_sv_cmd';
UPDATE ez_scada.folders_tags SET address = 'R521', description = '5존 PID (P) SV' WHERE name = 'tic_z5_pid_p';
UPDATE ez_scada.folders_tags SET address = 'R522', description = '5존 PID (I) SV' WHERE name = 'tic_z5_pid_i';
UPDATE ez_scada.folders_tags SET address = 'R523', description = '5존 PID (D) SV' WHERE name = 'tic_z5_pid_d';
UPDATE ez_scada.folders_tags SET address = 'R524', description = '5존 TIC 수동 출력(MV) SV' WHERE name = 'tic_z5_manual_mv';
UPDATE ez_scada.folders_tags SET address = 'R526', description = '5존 온도 경보(HH) SV' WHERE name = 'tic_z5_alarm_hh';
UPDATE ez_scada.folders_tags SET address = 'R527', description = '5존 온도 경보(H) SV' WHERE name = 'tic_z5_alarm_h';
UPDATE ez_scada.folders_tags SET address = 'R528', description = '5존 온도 경보(L) SV' WHERE name = 'tic_z5_alarm_l';
UPDATE ez_scada.folders_tags SET address = 'R529', description = '5존 온도 경보(LL) SV' WHERE name = 'tic_z5_alarm_ll';
UPDATE ez_scada.folders_tags SET address = 'R536', description = '5존 TIC 출력 제한(High)' WHERE name = 'tic_z5_range_hi';
UPDATE ez_scada.folders_tags SET address = 'R537', description = '5존 TIC 출력 제한(Low)' WHERE name = 'tic_z5_range_lo';
-- 6존 (R600~)
UPDATE ez_scada.folders_tags SET address = 'R600', description = '6존 온도 PV' WHERE name = 'tic_z6_pv';
UPDATE ez_scada.folders_tags SET address = 'R601', description = '6존 TIC 출력(MV) PV' WHERE name = 'tic_z6_mv';
UPDATE ez_scada.folders_tags SET address = 'R620', description = '6존 온도 SV(설정)' WHERE name = 'tic_z6_sv_cmd';
UPDATE ez_scada.folders_tags SET address = 'R621', description = '6존 PID (P) SV' WHERE name = 'tic_z6_pid_p';
UPDATE ez_scada.folders_tags SET address = 'R622', description = '6존 PID (I) SV' WHERE name = 'tic_z6_pid_i';
UPDATE ez_scada.folders_tags SET address = 'R623', description = '6존 PID (D) SV' WHERE name = 'tic_z6_pid_d';
UPDATE ez_scada.folders_tags SET address = 'R624', description = '6존 TIC 수동 출력(MV) SV' WHERE name = 'tic_z6_manual_mv';
UPDATE ez_scada.folders_tags SET address = 'R626', description = '6존 온도 경보(HH) SV' WHERE name = 'tic_z6_alarm_hh';
UPDATE ez_scada.folders_tags SET address = 'R627', description = '6존 온도 경보(H) SV' WHERE name = 'tic_z6_alarm_h';
UPDATE ez_scada.folders_tags SET address = 'R628', description = '6존 온도 경보(L) SV' WHERE name = 'tic_z6_alarm_l';
UPDATE ez_scada.folders_tags SET address = 'R629', description = '6존 온도 경보(LL) SV' WHERE name = 'tic_z6_alarm_ll';
UPDATE ez_scada.folders_tags SET address = 'R636', description = '6존 TIC 출력 제한(High)' WHERE name = 'tic_z6_range_hi';
UPDATE ez_scada.folders_tags SET address = 'R637', description = '6존 TIC 출력 제한(Low)' WHERE name = 'tic_z6_range_lo';
-- 7존 (R700~)
UPDATE ez_scada.folders_tags SET address = 'R700', description = '7존 온도 PV' WHERE name = 'tic_z7_pv';
UPDATE ez_scada.folders_tags SET address = 'R701', description = '7존 TIC 출력(MV) PV' WHERE name = 'tic_z7_mv';
UPDATE ez_scada.folders_tags SET address = 'R720', description = '7존 온도 SV(설정)' WHERE name = 'tic_z7_sv_cmd';
UPDATE ez_scada.folders_tags SET address = 'R721', description = '7존 PID (P) SV' WHERE name = 'tic_z7_pid_p';
UPDATE ez_scada.folders_tags SET address = 'R722', description = '7존 PID (I) SV' WHERE name = 'tic_z7_pid_i';
UPDATE ez_scada.folders_tags SET address = 'R723', description = '7존 PID (D) SV' WHERE name = 'tic_z7_pid_d';
UPDATE ez_scada.folders_tags SET address = 'R724', description = '7존 TIC 수동 출력(MV) SV' WHERE name = 'tic_z7_manual_mv';
UPDATE ez_scada.folders_tags SET address = 'R726', description = '7존 온도 경보(HH) SV' WHERE name = 'tic_z7_alarm_hh';
UPDATE ez_scada.folders_tags SET address = 'R727', description = '7존 온도 경보(H) SV' WHERE name = 'tic_z7_alarm_h';
UPDATE ez_scada.folders_tags SET address = 'R728', description = '7존 온도 경보(L) SV' WHERE name = 'tic_z7_alarm_l';
UPDATE ez_scada.folders_tags SET address = 'R729', description = '7존 온도 경보(LL) SV' WHERE name = 'tic_z7_alarm_ll';
UPDATE ez_scada.folders_tags SET address = 'R736', description = '7존 TIC 출력 제한(High)' WHERE name = 'tic_z7_range_hi';
UPDATE ez_scada.folders_tags SET address = 'R737', description = '7존 TIC 출력 제한(Low)' WHERE name = 'tic_z7_range_lo';

-- ===== 2. 노란색 — 버너 퍼지 타이머 R n30 → R n10 (버너수량 R n34는 그대로라 고칠 것 없음) =====
-- 둘 다 엔지니어링 > 버너제어 탭에 이미 존마다 있다('퍼지 타이머', '버너 펄스제어 버너수량').
UPDATE ez_scada.folders_tags SET address = 'R110', description = '1존 버너 퍼지 시간 SV (초)' WHERE name = 'bc_z1_purge_timer';
UPDATE ez_scada.folders_tags SET address = 'R210', description = '2존 버너 퍼지 시간 SV (초)' WHERE name = 'bc_z2_purge_timer';
UPDATE ez_scada.folders_tags SET address = 'R310', description = '3존 버너 퍼지 시간 SV (초)' WHERE name = 'bc_z3_purge_timer';
UPDATE ez_scada.folders_tags SET address = 'R410', description = '4존 버너 퍼지 시간 SV (초)' WHERE name = 'bc_z4_purge_timer';
UPDATE ez_scada.folders_tags SET address = 'R510', description = '5존 버너 퍼지 시간 SV (초)' WHERE name = 'bc_z5_purge_timer';
UPDATE ez_scada.folders_tags SET address = 'R610', description = '6존 버너 퍼지 시간 SV (초)' WHERE name = 'bc_z6_purge_timer';
UPDATE ez_scada.folders_tags SET address = 'R710', description = '7존 버너 퍼지 시간 SV (초)' WHERE name = 'bc_z7_purge_timer';

-- ===== 2-1. 트렌드 수집 주소 — 존 PV D n01 → R n00 (tb_temp_tag) =====
-- 트렌드 화면에 쌓이는 존 온도도 같은 PV를 읽는다. 이걸 안 고치면 트렌드만 옛 주소(D101 등)를 계속 읽는다.
-- O2(D241)는 이번 주소표에 없어서 그대로 둔다.
UPDATE ez_scada.tb_temp_tag SET address = 'R100' WHERE tag_name = '1zone_pv';
UPDATE ez_scada.tb_temp_tag SET address = 'R200' WHERE tag_name = '2zone_pv';
UPDATE ez_scada.tb_temp_tag SET address = 'R300' WHERE tag_name = '3zone_pv';
UPDATE ez_scada.tb_temp_tag SET address = 'R400' WHERE tag_name = '4zone_pv';
UPDATE ez_scada.tb_temp_tag SET address = 'R500' WHERE tag_name = '5zone_pv';
UPDATE ez_scada.tb_temp_tag SET address = 'R600' WHERE tag_name = '6zone_pv';
UPDATE ez_scada.tb_temp_tag SET address = 'R700' WHERE tag_name = '7zone_pv';

-- ===== 3. (확인 필요 — 주석을 풀어야 실행된다) Working SV D100 → R n02 =====
-- 주소표에서 녹색이 아니었지만, PV·MV가 D → R로 옮겨진 것과 같이 Working SV도 R n02(Feedback)로 적혀 있다.
-- 화면의 SV 칸(게이지·숫자)이 이 값을 보여 준다. 맞으면 아래 7줄의 -- 를 지우고 실행.
-- UPDATE ez_scada.folders_tags SET address = 'R102', description = '1존 온도 Working SV (Feedback)' WHERE name = 'tic_z1_sv';
-- UPDATE ez_scada.folders_tags SET address = 'R202', description = '2존 온도 Working SV (Feedback)' WHERE name = 'tic_z2_sv';
-- UPDATE ez_scada.folders_tags SET address = 'R302', description = '3존 온도 Working SV (Feedback)' WHERE name = 'tic_z3_sv';
-- UPDATE ez_scada.folders_tags SET address = 'R402', description = '4존 온도 Working SV (Feedback)' WHERE name = 'tic_z4_sv';
-- UPDATE ez_scada.folders_tags SET address = 'R502', description = '5존 온도 Working SV (Feedback)' WHERE name = 'tic_z5_sv';
-- UPDATE ez_scada.folders_tags SET address = 'R602', description = '6존 온도 Working SV (Feedback)' WHERE name = 'tic_z6_sv';
-- UPDATE ez_scada.folders_tags SET address = 'R702', description = '7존 온도 Working SV (Feedback)' WHERE name = 'tic_z7_sv';
