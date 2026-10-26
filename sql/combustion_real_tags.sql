-- 연소화면 태그 실주소 반영 (2026-10-26, PLC 태그 목록 기준)
-- 1~5는 이미 DB에 있는 태그의 주소를 고치는 UPDATE, 6~7은 새로 넣는 INSERT다.
--
-- 버너 번호: 화면 왼쪽부터 1~53(위 줄 1~25, 아래 줄 26~53). 존 안의 버너 번호는
-- 위 줄 왼쪽부터 1번, 아래 줄 왼쪽부터 이어진다 — 1존은 위 1~4 → 1-1~1-4, 아래 26~29 → 1-5~1-8.
-- 코드의 번호 규칙은 frontend/src/components/scada/combustionArtTags.js(burnerOf)에 있다.
--
-- 이 파일에 없는 것: 개별 버너 ON/OFF(cb_zN_bK_*, M380~/M680~)는 받은 목록 범위 밖이라 그대로 두었다.
-- M360/M361(전체 존 버너 ON/OFF)은 화면에 해당 버튼이 없어 넣지 않았다.

-- ===== 1. 존 연소 ON/OFF (본판) — 지금 DB가 한 칸씩 밀려 있다(M361~ → M362~) =====
UPDATE ez_scada.folders_tags SET address = 'M362', description = '1존 버너 연소 ON 버튼' WHERE folder_id = 7 AND name = 'cb_z1_burn_on_cmd';
UPDATE ez_scada.folders_tags SET address = 'M363', description = '1존 버너 연소 OFF 버튼' WHERE folder_id = 7 AND name = 'cb_z1_burn_off_cmd';
UPDATE ez_scada.folders_tags SET address = 'M662', description = '1존 버너 연소 ON 램프' WHERE folder_id = 7 AND name = 'cb_z1_burn_on_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M663', description = '1존 버너 연소 OFF 램프' WHERE folder_id = 7 AND name = 'cb_z1_burn_off_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M364', description = '2존 버너 연소 ON 버튼' WHERE folder_id = 7 AND name = 'cb_z2_burn_on_cmd';
UPDATE ez_scada.folders_tags SET address = 'M365', description = '2존 버너 연소 OFF 버튼' WHERE folder_id = 7 AND name = 'cb_z2_burn_off_cmd';
UPDATE ez_scada.folders_tags SET address = 'M664', description = '2존 버너 연소 ON 램프' WHERE folder_id = 7 AND name = 'cb_z2_burn_on_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M665', description = '2존 버너 연소 OFF 램프' WHERE folder_id = 7 AND name = 'cb_z2_burn_off_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M366', description = '3존 버너 연소 ON 버튼' WHERE folder_id = 7 AND name = 'cb_z3_burn_on_cmd';
UPDATE ez_scada.folders_tags SET address = 'M367', description = '3존 버너 연소 OFF 버튼' WHERE folder_id = 7 AND name = 'cb_z3_burn_off_cmd';
UPDATE ez_scada.folders_tags SET address = 'M666', description = '3존 버너 연소 ON 램프' WHERE folder_id = 7 AND name = 'cb_z3_burn_on_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M667', description = '3존 버너 연소 OFF 램프' WHERE folder_id = 7 AND name = 'cb_z3_burn_off_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M368', description = '4존 버너 연소 ON 버튼' WHERE folder_id = 7 AND name = 'cb_z4_burn_on_cmd';
UPDATE ez_scada.folders_tags SET address = 'M369', description = '4존 버너 연소 OFF 버튼' WHERE folder_id = 7 AND name = 'cb_z4_burn_off_cmd';
UPDATE ez_scada.folders_tags SET address = 'M668', description = '4존 버너 연소 ON 램프' WHERE folder_id = 7 AND name = 'cb_z4_burn_on_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M669', description = '4존 버너 연소 OFF 램프' WHERE folder_id = 7 AND name = 'cb_z4_burn_off_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M370', description = '5존 버너 연소 ON 버튼' WHERE folder_id = 7 AND name = 'cb_z5_burn_on_cmd';
UPDATE ez_scada.folders_tags SET address = 'M371', description = '5존 버너 연소 OFF 버튼' WHERE folder_id = 7 AND name = 'cb_z5_burn_off_cmd';
UPDATE ez_scada.folders_tags SET address = 'M670', description = '5존 버너 연소 ON 램프' WHERE folder_id = 7 AND name = 'cb_z5_burn_on_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M671', description = '5존 버너 연소 OFF 램프' WHERE folder_id = 7 AND name = 'cb_z5_burn_off_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M372', description = '6존 버너 연소 ON 버튼' WHERE folder_id = 7 AND name = 'cb_z6_burn_on_cmd';
UPDATE ez_scada.folders_tags SET address = 'M373', description = '6존 버너 연소 OFF 버튼' WHERE folder_id = 7 AND name = 'cb_z6_burn_off_cmd';
UPDATE ez_scada.folders_tags SET address = 'M672', description = '6존 버너 연소 ON 램프' WHERE folder_id = 7 AND name = 'cb_z6_burn_on_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M673', description = '6존 버너 연소 OFF 램프' WHERE folder_id = 7 AND name = 'cb_z6_burn_off_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M374', description = '7존 버너 연소 ON 버튼' WHERE folder_id = 7 AND name = 'cb_z7_burn_on_cmd';
UPDATE ez_scada.folders_tags SET address = 'M375', description = '7존 버너 연소 OFF 버튼' WHERE folder_id = 7 AND name = 'cb_z7_burn_off_cmd';
UPDATE ez_scada.folders_tags SET address = 'M674', description = '7존 버너 연소 ON 램프' WHERE folder_id = 7 AND name = 'cb_z7_burn_on_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M675', description = '7존 버너 연소 OFF 램프' WHERE folder_id = 7 AND name = 'cb_z7_burn_off_cmd_lamp';

-- ===== 2. ALL PURGE ON (M350 → M340) / 존 PURGE 시작 (M351~ → M342~) =====
UPDATE ez_scada.folders_tags SET address = 'M340', description = '전체 존 PURGE 시작 버튼' WHERE folder_id = 7 AND name = 'all_purge_on_cmd';
UPDATE ez_scada.folders_tags SET address = 'M640', description = '전체 존 PURGE 시작 램프' WHERE folder_id = 7 AND name = 'all_purge_on_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M342', description = '1존 PURGE 시작 버튼' WHERE folder_id = 7 AND name = 'cb_z1_purge_cmd';
UPDATE ez_scada.folders_tags SET address = 'M642', description = '1존 PURGE 시작 램프' WHERE folder_id = 7 AND name = 'cb_z1_purge_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M344', description = '2존 PURGE 시작 버튼' WHERE folder_id = 7 AND name = 'cb_z2_purge_cmd';
UPDATE ez_scada.folders_tags SET address = 'M644', description = '2존 PURGE 시작 램프' WHERE folder_id = 7 AND name = 'cb_z2_purge_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M346', description = '3존 PURGE 시작 버튼' WHERE folder_id = 7 AND name = 'cb_z3_purge_cmd';
UPDATE ez_scada.folders_tags SET address = 'M646', description = '3존 PURGE 시작 램프' WHERE folder_id = 7 AND name = 'cb_z3_purge_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M348', description = '4존 PURGE 시작 버튼' WHERE folder_id = 7 AND name = 'cb_z4_purge_cmd';
UPDATE ez_scada.folders_tags SET address = 'M648', description = '4존 PURGE 시작 램프' WHERE folder_id = 7 AND name = 'cb_z4_purge_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M350', description = '5존 PURGE 시작 버튼' WHERE folder_id = 7 AND name = 'cb_z5_purge_cmd';
UPDATE ez_scada.folders_tags SET address = 'M650', description = '5존 PURGE 시작 램프' WHERE folder_id = 7 AND name = 'cb_z5_purge_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M352', description = '6존 PURGE 시작 버튼' WHERE folder_id = 7 AND name = 'cb_z6_purge_cmd';
UPDATE ez_scada.folders_tags SET address = 'M652', description = '6존 PURGE 시작 램프' WHERE folder_id = 7 AND name = 'cb_z6_purge_cmd_lamp';
UPDATE ez_scada.folders_tags SET address = 'M354', description = '7존 PURGE 시작 버튼' WHERE folder_id = 7 AND name = 'cb_z7_purge_cmd';
UPDATE ez_scada.folders_tags SET address = 'M654', description = '7존 PURGE 시작 램프' WHERE folder_id = 7 AND name = 'cb_z7_purge_cmd_lamp';

-- ===== 3. 경보 RESET (임시 M300 → 실주소). 램프(_lamp)는 목록에 없어 M300 그대로 둔다 =====
UPDATE ez_scada.folders_tags SET address = 'M378', description = '실화(Flame Fail) RESET 버튼' WHERE folder_id = 7 AND name = 'misfire_alarm_reset_cmd';
UPDATE ez_scada.folders_tags SET address = 'M379', description = '버너 이상 RESET 버튼' WHERE folder_id = 7 AND name = 'burner_alarm_reset_cmd';

-- ===== 4. 번개(점화 트랜스) 53개 — 임시 M300 → Y0E0~ =====
UPDATE ez_scada.folders_tags SET address = 'Y0E0', description = '1존 버너 1-1 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder1_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0E1', description = '1존 버너 1-2 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder2_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0E2', description = '1존 버너 1-3 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder3_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0E3', description = '1존 버너 1-4 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder4_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0E8', description = '2존 버너 2-1 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder5_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0E9', description = '2존 버너 2-2 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder6_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0EA', description = '2존 버너 2-3 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder7_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0EB', description = '2존 버너 2-4 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder8_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F0', description = '3존 버너 3-1 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder9_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F1', description = '3존 버너 3-2 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder10_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F2', description = '3존 버너 3-3 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder11_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F3', description = '3존 버너 3-4 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder12_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F8', description = '4존 버너 4-1 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder13_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F9', description = '4존 버너 4-2 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder14_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0FA', description = '4존 버너 4-3 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder15_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y100', description = '5존 버너 5-1 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder16_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y101', description = '5존 버너 5-2 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder17_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y102', description = '5존 버너 5-3 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder18_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y108', description = '6존 버너 6-1 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder19_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y109', description = '6존 버너 6-2 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder20_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y10A', description = '6존 버너 6-3 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder21_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y110', description = '7존 버너 7-1 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder22_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y111', description = '7존 버너 7-2 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder23_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y112', description = '7존 버너 7-3 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder24_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y113', description = '7존 버너 7-4 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder25_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0E4', description = '1존 버너 1-5 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder26_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0E5', description = '1존 버너 1-6 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder27_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0E6', description = '1존 버너 1-7 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder28_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0E7', description = '1존 버너 1-8 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder29_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0EC', description = '2존 버너 2-5 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder30_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0ED', description = '2존 버너 2-6 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder31_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0EE', description = '2존 버너 2-7 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder32_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0EF', description = '2존 버너 2-8 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder33_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F4', description = '3존 버너 3-5 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder34_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F5', description = '3존 버너 3-6 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder35_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F6', description = '3존 버너 3-7 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder36_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0F7', description = '3존 버너 3-8 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder37_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0FB', description = '4존 버너 4-4 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder38_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0FC', description = '4존 버너 4-5 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder39_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0FD', description = '4존 버너 4-6 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder40_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y0FE', description = '4존 버너 4-7 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder41_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y103', description = '5존 버너 5-4 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder42_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y104', description = '5존 버너 5-5 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder43_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y105', description = '5존 버너 5-6 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder44_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y106', description = '5존 버너 5-7 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder45_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y10B', description = '6존 버너 6-4 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder46_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y10C', description = '6존 버너 6-5 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder47_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y10D', description = '6존 버너 6-6 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder48_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y10E', description = '6존 버너 6-7 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder49_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y114', description = '7존 버너 7-5 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder50_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y115', description = '7존 버너 7-6 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder51_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y116', description = '7존 버너 7-7 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder52_lamp';
UPDATE ez_scada.folders_tags SET address = 'Y117', description = '7존 버너 7-8 점화 트랜스 ON' WHERE folder_id = 7 AND name = 'combustion_thunder53_lamp';

-- ===== 5. 불꽃(화염 감지) 53개 — 임시 D100 → X040~ =====
UPDATE ez_scada.folders_tags SET address = 'X040', description = '1존 버너 1-1 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire1_lamp';
UPDATE ez_scada.folders_tags SET address = 'X041', description = '1존 버너 1-2 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire2_lamp';
UPDATE ez_scada.folders_tags SET address = 'X042', description = '1존 버너 1-3 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire3_lamp';
UPDATE ez_scada.folders_tags SET address = 'X043', description = '1존 버너 1-4 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire4_lamp';
UPDATE ez_scada.folders_tags SET address = 'X048', description = '2존 버너 2-1 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire5_lamp';
UPDATE ez_scada.folders_tags SET address = 'X049', description = '2존 버너 2-2 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire6_lamp';
UPDATE ez_scada.folders_tags SET address = 'X04A', description = '2존 버너 2-3 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire7_lamp';
UPDATE ez_scada.folders_tags SET address = 'X04B', description = '2존 버너 2-4 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire8_lamp';
UPDATE ez_scada.folders_tags SET address = 'X050', description = '3존 버너 3-1 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire9_lamp';
UPDATE ez_scada.folders_tags SET address = 'X051', description = '3존 버너 3-2 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire10_lamp';
UPDATE ez_scada.folders_tags SET address = 'X052', description = '3존 버너 3-3 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire11_lamp';
UPDATE ez_scada.folders_tags SET address = 'X053', description = '3존 버너 3-4 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire12_lamp';
UPDATE ez_scada.folders_tags SET address = 'X058', description = '4존 버너 4-1 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire13_lamp';
UPDATE ez_scada.folders_tags SET address = 'X059', description = '4존 버너 4-2 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire14_lamp';
UPDATE ez_scada.folders_tags SET address = 'X05A', description = '4존 버너 4-3 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire15_lamp';
UPDATE ez_scada.folders_tags SET address = 'X060', description = '5존 버너 5-1 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire16_lamp';
UPDATE ez_scada.folders_tags SET address = 'X061', description = '5존 버너 5-2 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire17_lamp';
UPDATE ez_scada.folders_tags SET address = 'X062', description = '5존 버너 5-3 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire18_lamp';
UPDATE ez_scada.folders_tags SET address = 'X068', description = '6존 버너 6-1 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire19_lamp';
UPDATE ez_scada.folders_tags SET address = 'X069', description = '6존 버너 6-2 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire20_lamp';
UPDATE ez_scada.folders_tags SET address = 'X06A', description = '6존 버너 6-3 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire21_lamp';
UPDATE ez_scada.folders_tags SET address = 'X070', description = '7존 버너 7-1 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire22_lamp';
UPDATE ez_scada.folders_tags SET address = 'X071', description = '7존 버너 7-2 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire23_lamp';
UPDATE ez_scada.folders_tags SET address = 'X072', description = '7존 버너 7-3 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire24_lamp';
UPDATE ez_scada.folders_tags SET address = 'X073', description = '7존 버너 7-4 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire25_lamp';
UPDATE ez_scada.folders_tags SET address = 'X044', description = '1존 버너 1-5 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire26_lamp';
UPDATE ez_scada.folders_tags SET address = 'X045', description = '1존 버너 1-6 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire27_lamp';
UPDATE ez_scada.folders_tags SET address = 'X046', description = '1존 버너 1-7 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire28_lamp';
UPDATE ez_scada.folders_tags SET address = 'X047', description = '1존 버너 1-8 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire29_lamp';
UPDATE ez_scada.folders_tags SET address = 'X04C', description = '2존 버너 2-5 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire30_lamp';
UPDATE ez_scada.folders_tags SET address = 'X04D', description = '2존 버너 2-6 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire31_lamp';
UPDATE ez_scada.folders_tags SET address = 'X04E', description = '2존 버너 2-7 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire32_lamp';
UPDATE ez_scada.folders_tags SET address = 'X04F', description = '2존 버너 2-8 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire33_lamp';
UPDATE ez_scada.folders_tags SET address = 'X054', description = '3존 버너 3-5 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire34_lamp';
UPDATE ez_scada.folders_tags SET address = 'X055', description = '3존 버너 3-6 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire35_lamp';
UPDATE ez_scada.folders_tags SET address = 'X056', description = '3존 버너 3-7 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire36_lamp';
UPDATE ez_scada.folders_tags SET address = 'X057', description = '3존 버너 3-8 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire37_lamp';
UPDATE ez_scada.folders_tags SET address = 'X05B', description = '4존 버너 4-4 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire38_lamp';
UPDATE ez_scada.folders_tags SET address = 'X05C', description = '4존 버너 4-5 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire39_lamp';
UPDATE ez_scada.folders_tags SET address = 'X05D', description = '4존 버너 4-6 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire40_lamp';
UPDATE ez_scada.folders_tags SET address = 'X05E', description = '4존 버너 4-7 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire41_lamp';
UPDATE ez_scada.folders_tags SET address = 'X063', description = '5존 버너 5-4 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire42_lamp';
UPDATE ez_scada.folders_tags SET address = 'X064', description = '5존 버너 5-5 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire43_lamp';
UPDATE ez_scada.folders_tags SET address = 'X065', description = '5존 버너 5-6 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire44_lamp';
UPDATE ez_scada.folders_tags SET address = 'X066', description = '5존 버너 5-7 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire45_lamp';
UPDATE ez_scada.folders_tags SET address = 'X06B', description = '6존 버너 6-4 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire46_lamp';
UPDATE ez_scada.folders_tags SET address = 'X06C', description = '6존 버너 6-5 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire47_lamp';
UPDATE ez_scada.folders_tags SET address = 'X06D', description = '6존 버너 6-6 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire48_lamp';
UPDATE ez_scada.folders_tags SET address = 'X06E', description = '6존 버너 6-7 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire49_lamp';
UPDATE ez_scada.folders_tags SET address = 'X074', description = '7존 버너 7-5 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire50_lamp';
UPDATE ez_scada.folders_tags SET address = 'X075', description = '7존 버너 7-6 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire51_lamp';
UPDATE ez_scada.folders_tags SET address = 'X076', description = '7존 버너 7-7 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire52_lamp';
UPDATE ez_scada.folders_tags SET address = 'X077', description = '7존 버너 7-8 화염 감지(FD)' WHERE folder_id = 7 AND name = 'combustion_fire53_lamp';

-- ===== 6. 새 태그 — PURGE 정지(전체 1 + 존 7, 각 버튼·램프) =====
INSERT INTO ez_scada.folders_tags (folder_id, name, address, plc_id, description, enabled, type) VALUES
  (7, 'all_purge_off_cmd', 'M341', 'global_dreamsteel_mitsubishi', '전체 존 PURGE 정지 버튼', 1, 'WORD'),
  (7, 'all_purge_off_cmd_lamp', 'M641', 'global_dreamsteel_mitsubishi', '전체 존 PURGE 정지 램프', 1, 'WORD'),
  (7, 'cb_z1_purge_stop_cmd', 'M343', 'global_dreamsteel_mitsubishi', '1존 PURGE 정지 버튼', 1, 'WORD'),
  (7, 'cb_z1_purge_stop_cmd_lamp', 'M643', 'global_dreamsteel_mitsubishi', '1존 PURGE 정지 램프', 1, 'WORD'),
  (7, 'cb_z2_purge_stop_cmd', 'M345', 'global_dreamsteel_mitsubishi', '2존 PURGE 정지 버튼', 1, 'WORD'),
  (7, 'cb_z2_purge_stop_cmd_lamp', 'M645', 'global_dreamsteel_mitsubishi', '2존 PURGE 정지 램프', 1, 'WORD'),
  (7, 'cb_z3_purge_stop_cmd', 'M347', 'global_dreamsteel_mitsubishi', '3존 PURGE 정지 버튼', 1, 'WORD'),
  (7, 'cb_z3_purge_stop_cmd_lamp', 'M647', 'global_dreamsteel_mitsubishi', '3존 PURGE 정지 램프', 1, 'WORD'),
  (7, 'cb_z4_purge_stop_cmd', 'M349', 'global_dreamsteel_mitsubishi', '4존 PURGE 정지 버튼', 1, 'WORD'),
  (7, 'cb_z4_purge_stop_cmd_lamp', 'M649', 'global_dreamsteel_mitsubishi', '4존 PURGE 정지 램프', 1, 'WORD'),
  (7, 'cb_z5_purge_stop_cmd', 'M351', 'global_dreamsteel_mitsubishi', '5존 PURGE 정지 버튼', 1, 'WORD'),
  (7, 'cb_z5_purge_stop_cmd_lamp', 'M651', 'global_dreamsteel_mitsubishi', '5존 PURGE 정지 램프', 1, 'WORD'),
  (7, 'cb_z6_purge_stop_cmd', 'M353', 'global_dreamsteel_mitsubishi', '6존 PURGE 정지 버튼', 1, 'WORD'),
  (7, 'cb_z6_purge_stop_cmd_lamp', 'M653', 'global_dreamsteel_mitsubishi', '6존 PURGE 정지 램프', 1, 'WORD'),
  (7, 'cb_z7_purge_stop_cmd', 'M355', 'global_dreamsteel_mitsubishi', '7존 PURGE 정지 버튼', 1, 'WORD'),
  (7, 'cb_z7_purge_stop_cmd_lamp', 'M655', 'global_dreamsteel_mitsubishi', '7존 PURGE 정지 램프', 1, 'WORD');

-- ===== 7. 새 태그 — 버너 밸브 106개(가스 Y120~ / 공기 Y160~) =====
INSERT INTO ez_scada.folders_tags (folder_id, name, address, plc_id, description, enabled, type) VALUES
  (7, 'combustion_gas_valve1_lamp', 'Y120', 'global_dreamsteel_mitsubishi', '1존 버너 1-1 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve2_lamp', 'Y121', 'global_dreamsteel_mitsubishi', '1존 버너 1-2 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve3_lamp', 'Y122', 'global_dreamsteel_mitsubishi', '1존 버너 1-3 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve4_lamp', 'Y123', 'global_dreamsteel_mitsubishi', '1존 버너 1-4 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve5_lamp', 'Y128', 'global_dreamsteel_mitsubishi', '2존 버너 2-1 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve6_lamp', 'Y129', 'global_dreamsteel_mitsubishi', '2존 버너 2-2 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve7_lamp', 'Y12A', 'global_dreamsteel_mitsubishi', '2존 버너 2-3 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve8_lamp', 'Y12B', 'global_dreamsteel_mitsubishi', '2존 버너 2-4 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve9_lamp', 'Y130', 'global_dreamsteel_mitsubishi', '3존 버너 3-1 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve10_lamp', 'Y131', 'global_dreamsteel_mitsubishi', '3존 버너 3-2 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve11_lamp', 'Y132', 'global_dreamsteel_mitsubishi', '3존 버너 3-3 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve12_lamp', 'Y133', 'global_dreamsteel_mitsubishi', '3존 버너 3-4 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve13_lamp', 'Y138', 'global_dreamsteel_mitsubishi', '4존 버너 4-1 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve14_lamp', 'Y139', 'global_dreamsteel_mitsubishi', '4존 버너 4-2 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve15_lamp', 'Y13A', 'global_dreamsteel_mitsubishi', '4존 버너 4-3 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve16_lamp', 'Y140', 'global_dreamsteel_mitsubishi', '5존 버너 5-1 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve17_lamp', 'Y141', 'global_dreamsteel_mitsubishi', '5존 버너 5-2 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve18_lamp', 'Y142', 'global_dreamsteel_mitsubishi', '5존 버너 5-3 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve19_lamp', 'Y148', 'global_dreamsteel_mitsubishi', '6존 버너 6-1 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve20_lamp', 'Y149', 'global_dreamsteel_mitsubishi', '6존 버너 6-2 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve21_lamp', 'Y14A', 'global_dreamsteel_mitsubishi', '6존 버너 6-3 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve22_lamp', 'Y150', 'global_dreamsteel_mitsubishi', '7존 버너 7-1 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve23_lamp', 'Y151', 'global_dreamsteel_mitsubishi', '7존 버너 7-2 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve24_lamp', 'Y152', 'global_dreamsteel_mitsubishi', '7존 버너 7-3 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve25_lamp', 'Y153', 'global_dreamsteel_mitsubishi', '7존 버너 7-4 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve26_lamp', 'Y124', 'global_dreamsteel_mitsubishi', '1존 버너 1-5 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve27_lamp', 'Y125', 'global_dreamsteel_mitsubishi', '1존 버너 1-6 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve28_lamp', 'Y126', 'global_dreamsteel_mitsubishi', '1존 버너 1-7 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve29_lamp', 'Y127', 'global_dreamsteel_mitsubishi', '1존 버너 1-8 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve30_lamp', 'Y12C', 'global_dreamsteel_mitsubishi', '2존 버너 2-5 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve31_lamp', 'Y12D', 'global_dreamsteel_mitsubishi', '2존 버너 2-6 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve32_lamp', 'Y12E', 'global_dreamsteel_mitsubishi', '2존 버너 2-7 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve33_lamp', 'Y12F', 'global_dreamsteel_mitsubishi', '2존 버너 2-8 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve34_lamp', 'Y134', 'global_dreamsteel_mitsubishi', '3존 버너 3-5 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve35_lamp', 'Y135', 'global_dreamsteel_mitsubishi', '3존 버너 3-6 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve36_lamp', 'Y136', 'global_dreamsteel_mitsubishi', '3존 버너 3-7 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve37_lamp', 'Y137', 'global_dreamsteel_mitsubishi', '3존 버너 3-8 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve38_lamp', 'Y13B', 'global_dreamsteel_mitsubishi', '4존 버너 4-4 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve39_lamp', 'Y13C', 'global_dreamsteel_mitsubishi', '4존 버너 4-5 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve40_lamp', 'Y13D', 'global_dreamsteel_mitsubishi', '4존 버너 4-6 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve41_lamp', 'Y13E', 'global_dreamsteel_mitsubishi', '4존 버너 4-7 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve42_lamp', 'Y143', 'global_dreamsteel_mitsubishi', '5존 버너 5-4 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve43_lamp', 'Y144', 'global_dreamsteel_mitsubishi', '5존 버너 5-5 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve44_lamp', 'Y145', 'global_dreamsteel_mitsubishi', '5존 버너 5-6 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve45_lamp', 'Y146', 'global_dreamsteel_mitsubishi', '5존 버너 5-7 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve46_lamp', 'Y14B', 'global_dreamsteel_mitsubishi', '6존 버너 6-4 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve47_lamp', 'Y14C', 'global_dreamsteel_mitsubishi', '6존 버너 6-5 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve48_lamp', 'Y14D', 'global_dreamsteel_mitsubishi', '6존 버너 6-6 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve49_lamp', 'Y14E', 'global_dreamsteel_mitsubishi', '6존 버너 6-7 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve50_lamp', 'Y154', 'global_dreamsteel_mitsubishi', '7존 버너 7-5 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve51_lamp', 'Y155', 'global_dreamsteel_mitsubishi', '7존 버너 7-6 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve52_lamp', 'Y156', 'global_dreamsteel_mitsubishi', '7존 버너 7-7 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_gas_valve53_lamp', 'Y157', 'global_dreamsteel_mitsubishi', '7존 버너 7-8 가스 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve1_lamp', 'Y160', 'global_dreamsteel_mitsubishi', '1존 버너 1-1 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve2_lamp', 'Y161', 'global_dreamsteel_mitsubishi', '1존 버너 1-2 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve3_lamp', 'Y162', 'global_dreamsteel_mitsubishi', '1존 버너 1-3 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve4_lamp', 'Y163', 'global_dreamsteel_mitsubishi', '1존 버너 1-4 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve5_lamp', 'Y168', 'global_dreamsteel_mitsubishi', '2존 버너 2-1 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve6_lamp', 'Y169', 'global_dreamsteel_mitsubishi', '2존 버너 2-2 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve7_lamp', 'Y16A', 'global_dreamsteel_mitsubishi', '2존 버너 2-3 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve8_lamp', 'Y16B', 'global_dreamsteel_mitsubishi', '2존 버너 2-4 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve9_lamp', 'Y170', 'global_dreamsteel_mitsubishi', '3존 버너 3-1 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve10_lamp', 'Y171', 'global_dreamsteel_mitsubishi', '3존 버너 3-2 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve11_lamp', 'Y172', 'global_dreamsteel_mitsubishi', '3존 버너 3-3 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve12_lamp', 'Y173', 'global_dreamsteel_mitsubishi', '3존 버너 3-4 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve13_lamp', 'Y178', 'global_dreamsteel_mitsubishi', '4존 버너 4-1 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve14_lamp', 'Y179', 'global_dreamsteel_mitsubishi', '4존 버너 4-2 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve15_lamp', 'Y17A', 'global_dreamsteel_mitsubishi', '4존 버너 4-3 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve16_lamp', 'Y180', 'global_dreamsteel_mitsubishi', '5존 버너 5-1 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve17_lamp', 'Y181', 'global_dreamsteel_mitsubishi', '5존 버너 5-2 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve18_lamp', 'Y182', 'global_dreamsteel_mitsubishi', '5존 버너 5-3 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve19_lamp', 'Y188', 'global_dreamsteel_mitsubishi', '6존 버너 6-1 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve20_lamp', 'Y189', 'global_dreamsteel_mitsubishi', '6존 버너 6-2 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve21_lamp', 'Y18A', 'global_dreamsteel_mitsubishi', '6존 버너 6-3 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve22_lamp', 'Y190', 'global_dreamsteel_mitsubishi', '7존 버너 7-1 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve23_lamp', 'Y191', 'global_dreamsteel_mitsubishi', '7존 버너 7-2 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve24_lamp', 'Y192', 'global_dreamsteel_mitsubishi', '7존 버너 7-3 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve25_lamp', 'Y193', 'global_dreamsteel_mitsubishi', '7존 버너 7-4 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve26_lamp', 'Y164', 'global_dreamsteel_mitsubishi', '1존 버너 1-5 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve27_lamp', 'Y165', 'global_dreamsteel_mitsubishi', '1존 버너 1-6 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve28_lamp', 'Y166', 'global_dreamsteel_mitsubishi', '1존 버너 1-7 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve29_lamp', 'Y167', 'global_dreamsteel_mitsubishi', '1존 버너 1-8 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve30_lamp', 'Y16C', 'global_dreamsteel_mitsubishi', '2존 버너 2-5 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve31_lamp', 'Y16D', 'global_dreamsteel_mitsubishi', '2존 버너 2-6 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve32_lamp', 'Y16E', 'global_dreamsteel_mitsubishi', '2존 버너 2-7 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve33_lamp', 'Y16F', 'global_dreamsteel_mitsubishi', '2존 버너 2-8 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve34_lamp', 'Y174', 'global_dreamsteel_mitsubishi', '3존 버너 3-5 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve35_lamp', 'Y175', 'global_dreamsteel_mitsubishi', '3존 버너 3-6 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve36_lamp', 'Y176', 'global_dreamsteel_mitsubishi', '3존 버너 3-7 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve37_lamp', 'Y177', 'global_dreamsteel_mitsubishi', '3존 버너 3-8 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve38_lamp', 'Y17B', 'global_dreamsteel_mitsubishi', '4존 버너 4-4 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve39_lamp', 'Y17C', 'global_dreamsteel_mitsubishi', '4존 버너 4-5 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve40_lamp', 'Y17D', 'global_dreamsteel_mitsubishi', '4존 버너 4-6 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve41_lamp', 'Y17E', 'global_dreamsteel_mitsubishi', '4존 버너 4-7 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve42_lamp', 'Y183', 'global_dreamsteel_mitsubishi', '5존 버너 5-4 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve43_lamp', 'Y184', 'global_dreamsteel_mitsubishi', '5존 버너 5-5 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve44_lamp', 'Y185', 'global_dreamsteel_mitsubishi', '5존 버너 5-6 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve45_lamp', 'Y186', 'global_dreamsteel_mitsubishi', '5존 버너 5-7 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve46_lamp', 'Y18B', 'global_dreamsteel_mitsubishi', '6존 버너 6-4 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve47_lamp', 'Y18C', 'global_dreamsteel_mitsubishi', '6존 버너 6-5 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve48_lamp', 'Y18D', 'global_dreamsteel_mitsubishi', '6존 버너 6-6 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve49_lamp', 'Y18E', 'global_dreamsteel_mitsubishi', '6존 버너 6-7 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve50_lamp', 'Y194', 'global_dreamsteel_mitsubishi', '7존 버너 7-5 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve51_lamp', 'Y195', 'global_dreamsteel_mitsubishi', '7존 버너 7-6 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve52_lamp', 'Y196', 'global_dreamsteel_mitsubishi', '7존 버너 7-7 공기 밸브 열림', 1, 'WORD'),
  (7, 'combustion_air_valve53_lamp', 'Y197', 'global_dreamsteel_mitsubishi', '7존 버너 7-8 공기 밸브 열림', 1, 'WORD');
