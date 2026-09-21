import { useEffect, useRef, useState } from 'react';
import DriveOverview from '../../components/scada/DriveOverview';
import {
  ARROW_TAGS, FAN_TAGS, MOTOR_TAGS, ROLLER_TAGS, artTitle, motorGrayClass,
} from '../../components/scada/driveArtTags';
import HmiTable from '../../components/scada/HmiTable';
import { LedInput } from '../../components/scada/HmiParts';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { getAlarmList } from '../../api/scada/alarmHistApi';
import {
  lampClassOf, lampOf, tagState, writeTag, TAG_ON, TAG_OFF, TAG_UNKNOWN,
} from '../../api/scada/foldertagApi';
// 작화 도구가 뽑아준 설비 그림 스타일. 무수정 원본이라 우리 CSS보다 먼저 깐다.
import './driveOverview.css';
import './DrivePage.css';

/* ===========================================================================
   구동화면

   가운데 설비 그림은 작화 원본(DriveOverview + driveOverview.css)을 그대로 쓴다.
   원본이 1981x406px 고정 크기라서, 화면 폭에 맞춰 transform: scale로 줄인다.
   그림 위에 얹는 라벨·드라이브 박스도 같이 줄어들어야 하므로 스케일 안쪽에 두고,
   위치는 전부 그림 원본 좌표계(1981x406) 기준 px로 적는다.

   값은 아직 전부 더미다. PLC 연동 때 STATE 자리만 폴링 결과로 바꾸면 된다.
   =========================================================================== */

/* 그림이 실제로 그려지는 범위. 작화 캔버스는 오른쪽으로 1981px까지 있지만 1723 뒤로는
   아무것도 없어서, 1981을 기준으로 배율을 잡으면 우측에 빈 띠가 남는다.

   출구 쪽 조각 276개는 transform: scale(-1, 1) + transform-origin: 0 0 으로 좌우가
   뒤집혀 있다. 즉 left가 그 조각의 오른쪽 끝이고 실제로는 left-width 자리에 그려진다
   (예: .exit-obj-1은 left 1667 / width 264라서 1403~1667을 차지한다). left+width로
   폭을 재면 실제보다 훨씬 크게 나오니 주의. */
const STAGE_W = 1723;
const STAGE_H = 406;

/* 그림 아래에 붙이는 회전감지 램프 자리. 모터가 y 406까지 내려와 있어서 그림 높이
   그대로면 램프를 놓을 곳이 없다. 무대를 이만큼 더 잡아 램프도 그림과 같은 좌표계에서
   같은 배율로 움직이게 한다. */
const STAGE_PAD_B = 48;

/* ---------------------------------------------------------------------------
   그림 위에 얹는 것들의 위치 — 전부 여기 모아 둔다.

   cx는 가운데 정렬 기준 x, left/top은 왼쪽 위 기준. 단위는 그림 원본 px다.
   화면을 보고 미세조정할 일이 반드시 생기는데, 그때 이 표의 숫자만 고치면 된다.

   설비 조각이 화면에 실제로 그려지는 범위 — 라벨을 옮길 때 참고.
   (출구 쪽은 반전 때문에 CSS의 left 값과 다르다. 위 STAGE_W 주석 참고.)
     입구 POCKET   x  56~320,  y   1~207      입구 TABLE DRIVE x  56~494,  y 216~350
     DOOR          x 494~525,  y 200~368      MAIN ZONE1~7     x 609~1136, y 200~366
     COOLING CH.   x1137~1353, y 200~368      출구 POCKET      x1403~1667, y   0~206
     출구 TABLE DR.x1353~1667, y 215~349      맨 오른쪽 모터   x1667~1723
   ------------------------------------------------------------------------- */
const LABELS = [
  { key: 'entPocket', text: '입구 POCKET', cx: 188, top: -2 },
  { key: 'entSide', text: '입구 SIDE CONVEYOR', cx: 188, top: 70 },
  { key: 'entTable', text: '입구 TABLE DRIVE', cx: 190, top: 360 },
  { key: 'mainDrive', text: 'MAIN DRIVE', cx: 872, top: 168 },
  // 사진처럼 두 줄로. \n은 .dr-tag의 white-space: pre-line이 살린다.
  { key: 'coolTable', text: 'COOLING CHAMBER\nTABLE DRIVE', cx: 1245, top: 168 },
  { key: 'exitPocket', text: '출구 POCKET', cx: 1535, top: -2 },
  { key: 'exitSide', text: '출구 SIDE CONVEYOR', cx: 1535, top: 70 },
  { key: 'exitTable', text: '출구 TABLE DRIVE', cx: 1540, top: 357 },
];

// 빈 띠(그림 위쪽 y 10~145)에 떠 있는 드라이브 조작 박스 3개.
/* svMin/svMax는 구동부마다 다른 속도 설정 허용 범위(mm/Min).
   숫자패드가 이 범위를 벗어난 값은 확정하지 못하게 막는다. */
/* unit은 ON/OFF 태그 이름의 앞부분이다(charge_on_cmd 등) — driveCmd() 참고. */
/* pvTag/svTag/detectTag는 ez_scada.folders_tags.name이다. unit에서 조립하지 않고 그대로
   적는다 — 가운데가 제각각이라(charge_table_drive_ / maincc_drive_ / discharge_table_drive_)
   규칙으로 만들면 한 곳만 어긋나도 조용히 빈 값이 된다.

   PV는 읽기 전용, SV는 값을 쓰는 태그와 읽는 태그가 하나다(쓰면 다음 폴링에 그 값이 온다).
   구동감지는 0이 정상(초록), 1이 이상(빨강)이다 — 이름의 _normal_ 이 그 뜻이다.

   주소는 아직 임시다: PV·SV가 D000, 구동감지가 M001이라 세 박스가 같이 움직인다.
   현장 주소를 받으면 DB의 address만 고치면 되고 화면은 손댈 필요가 없다. */
const DRIVE_PANELS = [
  {
    key: 'entTable', unit: 'charge', title: '입구 TABLE DRIVE', left: 350, top: 12, svMin: 0, svMax: 2610,
    pvTag: 'charge_table_drive_pv',
    svTag: 'charge_table_drive_sv',
    detectTag: 'charge_table_drive_detect_normal_lamp',
  },
  {
    key: 'mainCc', unit: 'maincc', title: 'MAIN/CC DRIVE', left: 700, top: 12, svMin: 0, svMax: 2610,
    pvTag: 'maincc_drive_pv',
    svTag: 'maincc_drive_sv',
    detectTag: 'maincc_drive_detect_normal_lamp',
  },
  // 출구 컨베이어(x 1353~1723) 위에 오도록. 폭이 250이라 left는 1473을 넘기면 안 된다.
  {
    key: 'exitTable', unit: 'discharge', title: '출구 TABLE DRIVE', left: 1050, top: 12, svMin: 0, svMax: 4110,
    pvTag: 'discharge_table_drive_pv',
    svTag: 'discharge_table_drive_sv',
    detectTag: 'discharge_table_drive_detect_normal_lamp',
  },
];

// MAIN DRIVE 존 — 작화 존 이미지 위에 PV/SV를 그대로 얹는다(존 폭 75.5px 간격).
const ZONE_LEFT = 609;
const ZONE_STEP = 75.5;
const ZONE_W = 75;
const ZONES = [1, 2, 3, 4, 5, 6, 7];

/* 존 SV 허용 범위 — 7개 존이 모두 같다. 온도(0~1000℃)라 온도제어 화면과 같은 값이다.
   숫자패드가 이 범위를 벗어난 값은 확정하지 못하게 막는다. */
const ZONE_SV_MIN = 0;
const ZONE_SV_MAX = 1000;

/* 이 화면의 PLC 태그가 든 폴더 — ez_scada.folders.id (폴더 이름 '구동화면').
   DB에 만든 행의 id와 반드시 같아야 한다. 틀리면 오류가 아니라 태그 0개 응답으로
   조용히 실패하니, 값이 전부 '---'로 나오면 여기를 먼저 본다. */
const DR_FOLDER_ID = 9;

/* 구동부 ON/OFF 버튼을 이만큼 누르고 있어야 명령이 나간다.
   컨베이어가 스치듯 눌린 것으로 돌거나 멈추면 안 되니 시간을 둔다.
   연소·온도제어의 누름 버튼도 같은 2초다 — 화면마다 다르면 손이 헷갈린다.
   CSS 애니메이션 길이도 이 값을 inline style로 받아 간다(두 곳에 적으면 어긋난다). */
const DRIVE_HOLD_MS = 2000;

/* MAIN DRIVE 아래 '####℃ 이하시 설비 OFF'의 OFF 버튼. 읽기와 쓰기가 같은 태그다. */
const FACILITY_OFF_BTN_TAG = 'facility_off_temp_toggle_button';

/* ALARM SWITCH 판의 두 버튼 — 알람화면의 같은 버튼과 태그·동작이 완전히 같다
   (같은 주소를 폴더 9에도 넣어 두었다. 이 화면은 폴더 9만 폴링하므로,
   여기에 있어야 읽기와 쓰기가 한 폴더에서 끝난다).

   값을 쓰는 태그와 상태를 읽는 태그가 하나다 — 짝이 되는 _lamp가 없다.
   2초 누르면 1이 나가고 떼면 0, 그리고 1인 동안 버튼이 초록으로 켜진다. */
const ALARM_SWITCHES = [
  { tag: 'alarm_reset', text: 'ALARM RESET' },
  { tag: 'alarm_horn_stop', text: 'HORN STOP' },
];

/* 구동부 ON/OFF 태그. 화면 이름은 입구/출구지만 태그는 현장 용어인 장입/배출을 쓴다.
     charge    M300 ON / M301 OFF   램프 M600 / M601   입구 TABLE DRIVE
     maincc    M302 / M303          램프 M602 / M603   MAIN/CC DRIVE
     discharge M304 / M305          램프 M604 / M605   출구 TABLE DRIVE
   램프 이름은 lampOf()가 cmd + '_lamp'로 조립하므로 DB에도 그 이름 그대로 있어야 한다.
   ON/OFF 각각 램프가 따로 있어서(M600·M601) 두 칸이 서로를 보고 그리지 않는다 —
   둘 다 0이면 둘 다 꺼진 채로 둔다. 구동부가 어느 쪽도 아닌 상태(기동 중·고장)를
   있는 대로 보여주는 게 맞다. 연소화면 MAIN GAS의 OPEN/CLOSE도 같은 구조다. */
const driveCmd = (unit, action) => `${unit}_${action}_cmd`;

/* 작화 위 요소(화살표·롤러·모터)의 태그 이름은 driveArtTags.js 한 곳에 있다 —
   그림에 다는 툴팁과 여기서 색·표시를 정하는 일이 같은 이름을 봐야 하기 때문이다.
   여기서는 그 태그에 화면 쪽 처리(무대에 붙일 클래스)만 얹는다.

   화살표: 값이 1이면 보이고 0이거나 못 읽으면 숨긴다. 숨기는 일은 DrivePage.css가 맡는다.
   모터:   값이 1이면 지금 색(초록), 아니면 회색. 모터 그림이 초록 한 색이라 filter 한 줄로 된다.
           어느 자리가 어느 태그인지는 driveArtTags.js의 MOTOR_TAGS 주석에 좌표까지 적혀 있다. */
const MOTOR_GRAY = Object.entries(MOTOR_TAGS).map(([cls, t]) => ({
  tag: t.tag,
  grayClass: motorGrayClass(cls),
}));

/* 존 PV/SV는 온도제어 화면과 같은 PLC 주소를 본다(D101/D100/R100).
   같은 주소가 폴더 8과 9에 각각 한 행씩 있다 — 화면마다 폴더 하나만 폴링하려고
   복제한 것이다. PLC 왕복은 늘지 않는다(C# 폴러가 주소를 Distinct로 묶어 읽는다).
   주소가 바뀌면 두 폴더를 함께 고쳐야 한다는 점만 주의. */
const zoneTag = (n, suffix) => `tic_z${n}_${suffix}`;

/* 로 순환 팬 셋 — DOOR 오른쪽 판에 하나, 쿨링챔버 판에 둘.
   예전에는 이 자리에 PV 값칸 셋이 있었다(값을 줄 태그가 없어 '####'로만 떠 있었다).

   자리는 작화 판의 가운데로 잡았다:
     왼쪽 = main-obj-1 (x525~609, y199~365) 가운데
     오른쪽 = main-obj-2 (x1137~1353, y200~368) 위에 둘. 옛 PV 칸의 가운데
              (x1193 / x1298)를 그대로 써서 간격이 전과 같다.
   셋 다 같은 top을 쓴다 — 따로 두면 높이가 어긋난다. */
const FAN_SIZE = 64;
const FAN_TOP = 253;

const FANS = [
  { key: 'door', left: 536 },
  { key: 'cc1', left: 1161 },
  { key: 'cc2', left: 1266 },
];

/* 팬 그림 두 벌 — 도는 것과 멈춘 것. 롤러와 같은 이유로 파일을 바꿔 끼운다
   (<img>로 띄운 SVG 안의 애니메이션은 바깥 CSS로 멈출 수 없다).
   ?v= 는 캐시 무효화다 — public/ 자산은 파일명에 해시가 안 붙어서, 그림을 고치면
   이 숫자를 올려야 현장 화면에 반영된다. */
const FAN_SPIN_SRC = '/scada/drive/fan-spin.svg?v=10';
const FAN_STILL_SRC = '/scada/drive/fan-still.svg?v=1';

/* ---------------------------------------------------------------------------
   상단 패널
   ------------------------------------------------------------------------- */

/* 자동운전 조건 램프 — 순서와 문구는 현장 HMI 화면 그대로.

   tag는 ez_scada.folders_tags.name이다. 이 램프들은 짝이 되는 명령이 없는 상태 표시라
   이름 자체가 램프다(_cmd_lamp가 아니다). 0이면 빨강, 1이면 초록, 못 읽으면 점선.

   주소는 아직 전부 M000이다(현장 주소를 못 받았다). 받으면 DB의 address만 고치면 되고
   화면은 손댈 필요가 없다 — 그래서 이름을 먼저 박아 두었다. */
const ENT_CONDITIONS = [
  { text: '입구 모터 트립조건', tag: 'charge_motor_trip_lamp' },
  { text: '입구 자동STEP 초기조건', tag: 'charge_auto_step_lamp' },
  { text: '입구 TABLE DRIVE 구동상태', tag: 'charge_table_drive_lamp' },
  { text: '입구 비상정지 OFF', tag: 'charge_emergency_off_lamp' },
];

const EXIT_CONDITIONS = [
  { text: '출구 모터 트립조건', tag: 'discharge_motor_trip_lamp' },
  { text: '출구 자동STEP 초기조건', tag: 'discharge_auto_step_lamp' },
  { text: '출구 TABLE DRIVE 구동상태', tag: 'discharge_table_drive_lamp' },
  { text: '출구 SIDE CONVEYOR 하강상태', tag: 'discharge_side_conveyor_down_state_lamp' },
  { text: '출구 비상정지 OFF', tag: 'discharge_emergency_off_lamp' },
];

/* 출구 구동부 자동운전 TIME 설정 — 초 단위 설정값 3개.
   min/max는 항목마다 다르다. 숫자패드가 이 범위를 벗어난 값은 확정하지 못하게 막는다
   (NumPad에서 "입력" 버튼이 잠긴다). */
/* tag는 ez_scada.folders_tags.name이다. 이 셋은 값을 쓰는 태그와 읽는 태그가 하나다 —
   PLC에 써 놓은 설정값을 그대로 다시 읽어 보여준다(존 SV처럼 표시용 주소가 따로 없다).

   주소는 아직 셋 다 D000이다(현장 주소를 못 받았다). 그래서 한 칸을 고치면 세 칸이
   같이 바뀐다. 주소를 받으면 DB의 address만 칸마다 고치면 되고 화면은 손댈 필요가 없다. */
const EXIT_TIMES = [
  { key: 'align', label: '출구제품 정렬(지연)시간', min: 0, max: 600, tag: 'discharge_product_sort_delay_time' },
  { key: 'clear', label: '제품 감지 해제TIME', min: 0, max: 600, tag: 'discharge_product_detect_clear_time' },
  { key: 'sideConv', label: '출구 SIDE CONVEYOR 전진 TIME', min: 15, max: 50, tag: 'discharge_side_conveyor_forward_time' },
];

/* ---------------------------------------------------------------------------
   하단 램프판 — 묶음별 램프 목록
   ------------------------------------------------------------------------- */
/* tag는 ez_scada.folders_tags.name이다(위 조건 램프와 같은 규칙).
   주소는 아직 전부 M000이라 26개가 같이 움직인다 — 현장 주소를 받으면 DB만 고치면 된다. */
const LAMP_BOARDS = [
  {
    key: 'entSol',
    lamps: [
      { text: '입구 POCKET\nSOL VALVE UP', tag: 'charge_pocket_sol_valve_up_lamp' },
      { text: '입구 POCKET\nSOL VALVE DOWN', tag: 'charge_pocket_sol_valve_down_lamp' },
      { text: '입구 SIDE CONVEYOR\nSOL VALVE UP', tag: 'charge_side_conveyor_sol_valve_up_lamp' },
      { text: '입구 SIDE CONVEYOR\nSOL VALVE DOWN', tag: 'charge_side_conveyor_sol_valve_down_lamp' },
    ],
  },
  {
    key: 'entLs',
    lamps: [
      { text: '입구 POCKET\nUP L/S', tag: 'charge_pocket_up_ls_lamp' },
      { text: '입구 POCKET\nDOWN L/S', tag: 'charge_pocket_down_ls_lamp' },
      { text: '입구 SIDE CONVEYOR\nUP L/S', tag: 'charge_side_conveyor_up_ls_lamp' },
      { text: '입구 SIDE CONVEYOR\nDOWN L/S', tag: 'charge_side_conveyor_down_ls_lamp' },
    ],
  },
  {
    key: 'entPx',
    lamps: [
      { text: '입구 SIDE CONVEYOR\nFORWARD P/X', tag: 'charge_side_conveyor_forward_px_lamp' },
      { text: '입구 SIDE CONVEYOR\nBACKWARD P/X', tag: 'charge_side_conveyor_backward_px_lamp' },
      { text: '입구 DOOR\nOPEN P/X', tag: 'charge_door_open_px_lamp' },
      { text: '입구 DOOR\nCLOSE P/X', tag: 'charge_door_close_px_lamp' },
    ],
  },
  {
    key: 'entEtc',
    lamps: [
      { text: '입구 제품 투입\n감지 P/X', tag: 'charge_product_detect_px_lamp' },
      { text: '입구 제품 정렬\nSTOPPER 하강 L/S', tag: 'charge_product_sort_stopper_down_lamp' },
    ],
  },
  {
    key: 'exitSol',
    lamps: [
      { text: '출구 SIDE CONVEYOR\nSOL VALVE UP', tag: 'discharge_side_conveyor_sol_valve_up_lamp' },
      { text: '출구 SIDE CONVEYOR\nSOL VALVE DOWN', tag: 'discharge_side_conveyor_sol_valve_down_lamp' },
      { text: '출구 SIDE CONVEYOR\nUP L/S', tag: 'discharge_side_conveyor_up_ls_lamp' },
      { text: '출구 SIDE CONVEYOR\nDOWN L/S', tag: 'discharge_side_conveyor_down_ls_lamp' },
    ],
  },
  {
    key: 'exitPx',
    lamps: [
      { text: '출구 SIDE CONVEYOR\nFORWARD P/X', tag: 'discharge_side_conveyor_forward_px_lamp' },
      { text: '출구 SIDE CONVEYOR\nBACKWARD P/X', tag: 'discharge_side_conveyor_backward_px_lamp' },
      { text: '출구 제품 속도\n감지 P/H', tag: 'discharge_product_speed_detect_ph_lamp' },
      { text: '제품 도착\n감지 L/S', tag: 'discharge_product_arrive_detect_ls_lamp' },
    ],
  },
  {
    key: 'exitPocket',
    lamps: [
      { text: '출구 POCKET\n제품 감지 P/X', tag: 'discharge_pocket_product_detect_px_lamp' },
      { text: '출구 POCKET\n제품 감지 (상)', tag: 'discharge_pocket_product_detect_top_lamp' },
      { text: '출구 POCKET\n제품 감지 (중)', tag: 'discharge_pocket_product_detect_mid_lamp' },
      { text: '출구 POCKET\n제품 감지 (하)', tag: 'discharge_pocket_product_detect_bottom_lamp' },
    ],
  },
];

/* 회전감지 램프 — 각각 짝이 되는 모터 바로 아래에 붙는다.
   cx는 그 모터가 화면에 실제로 그려지는 가운데 x다(MAIN 쪽 둘은 반전이라
   CSS의 left 값과 다르니 주의):
     ent-motor-4  x 332~356  → 344       main-motor-1 x  609~ 633 → 621
     main-motor-2 x1138~1162 → 1150      exit-motor-5 x 1403~1427 → 1415
   \n 줄바꿈은 DrivePage.css의 .dr-trip-lamp에서 white-space: pre-line으로 살린다. */
const TRIP_TOP = 410;

/* 네 램프는 값이 1이면 초록, 0이면 회색, 못 읽으면 점선이다.

   바로 위 모터에도 회전감지 이름의 태그가 따로 붙어 있다(driveArtTags.js의 MOTOR_TAGS —
   main_table_drive_conveyor_rotate_detect_lamp 등). 이름이 겹치지만 다른 태그다.
   모터는 그림 색, 여기는 글씨 램프라 따로 움직인다 — 한쪽만 바뀌어도 고장이 아니다. */
const TRIP_LAMPS = [
  { key: 'ent', cx: 344, text: '입구 TABLE DRIVE\nCONVEYOR 회전감지', tag: 'charge_table_status_lamp' },
  { key: 'main', cx: 621, text: 'MAIN TABLE DRIVE\nCONVEYOR 회전감지', tag: 'main_table_status_lamp' },
  { key: 'cc', cx: 1150, text: 'C/C TABLE DRIVE\nCONVEYOR 회전감지', tag: 'cc_table_status_lamp' },
  { key: 'exit', cx: 1415, text: '출구 TABLE DRIVE\nCONVEYOR 회전감지', tag: 'discharge_table_status_lamp' },
];

/* 입구 롤러 줄 맨 끝의 제품 감지 자리.

   작화에는 롤러 12개(x 80~446) 오른쪽에 롤러가 하나 더 있고 그 옆에 상태표시등과
   '제품 감지' 글씨가 있는데, 내보낸 그림(DriveOverview)에는 빠져 있다. 그래서 여기
   덧씌우는 층에서 채운다. 나중에 작화를 다시 뽑아 롤러가 들어오면 이 ROLLER만 지우면
   된다(램프와 글씨는 태그를 받아야 하므로 어차피 여기 남는다).

   좌표는 작화 화면을 보고 어림잡은 값이다. 롤러 줄은 y 215, 18x138로 다 같으므로
   높이·크기는 옆 롤러와 맞췄고, x만 마지막 롤러(446)와 DOOR(494) 사이에 두었다.

   램프는 그 롤러(~473)와 DOOR(494~) 사이 빈 자리의 가운데에 세우고 글씨를 그 아래
   붙인다. 사이가 21px뿐이라 글씨가 양옆으로 넘치는데, 덧씌우는 층이라 잘리지 않고
   그림 위에 얹힌다. 글씨를 작게(10px) 둔 것도 그래서다. */
/* 이 롤러만 값에 따라 색이 바뀐다 — 0이면 빨강, 1이면 초록, 못 읽으면 회색.
   그림이 은회색 쇠라 빨강·초록 둘 다 색 행렬이 필요하다(아래 #dr-red / #dr-green). */
const END_ROLLER = { left: 455, top: 215, width: 18, height: 138, tag: 'charge_side_mesh_roller' };
const PRODUCT_LAMP = { cx: 483, top: 265, tag: 'product_detect_lamp' };

/* 그림 위에 얹는 짧은 문구들.
   cx를 주면 그 x가 글자의 가운데가 되고, left를 주면 그 x가 왼쪽 끝이 된다.
   value를 주면 그 부분만 앞에 빨간 숫자로 붙는다(나머지 text는 검은 글씨). */
const NOTES = [
  // MAIN DRIVE 존(x 609~1136, 아래끝 y 366) 바로 밑
  /* lamp를 주면 글자 뒤에 빨간 램프 칸이 붙는다 — 이 줄의 "OFF"는 설명이 아니라
     설비가 실제로 꺼졌음을 알리는 표시등이다. */
  {
    key: 'tempOff', cx: 872, top: 372, text: '℃ 이하시 설비', lamp: 'OFF',
    /* 앞의 빨간 숫자를 PLC에서 읽는다. 못 읽으면 '---'로 둔다 — 0으로 그리면
       0℃ 이하에서 끈다는 말이 되어 설정을 잘못 읽는다. */
    valueTag: 'facility_off_temp',
    valueLabel: '설비 OFF 기준 온도',
    /* 뒤의 'OFF'는 글씨가 아니라 누르는 버튼이다. 읽는 태그와 쓰는 태그가 같다.
       2초를 채우면 지금 값의 반대가 나가고 그대로 남는다(토글). 떼는 것으로는
       아무 값도 보내지 않는다 — 걸어 두는 자리라 손을 떼면 풀리면 안 된다. */
    lampTag: 'facility_off_temp_toggle_button',
  },
  // ent-motor-4(x 332~356, y 360~401) 오른쪽 옆. 모터 세로 가운데에 맞춘다.
  { key: 'stopper', left: 362, top: 372, text: 'STOPPER 하강 감지' },
  // ent-motor-3(x 497~522, y 160~201) 바로 위. 가운데(510)에 맞춘다.
  { key: 'entDoorOpen', cx: 510, top: 142, text: '입구문 열림' },
];

/* ---------------------------------------------------------------------------
   하단 경보 목록 — 경보이력 화면과 같은 API(getAlarmList)를 그대로 쓴다.
   여기서는 조회 조건 없이 전부 받아 최근 것만 훑어보는 용도라 컬럼이 더 적다.

   컬럼이 바뀌면 표를 통째로 다시 만들기 때문에 모듈 상수로 둔다(매 렌더 새로
   만들면 표가 계속 재생성된다).
   ------------------------------------------------------------------------- */
const ALARM_COLUMNS = [
  { title: '발생시각', field: 'occurTimeStr', width: 145, hozAlign: 'center' },
  { title: '태그이름', field: 'tagName', minWidth: 120, widthGrow: 2, tooltip: true, hozAlign: 'center' },
  { title: '경보주석', field: 'alarmMsg', minWidth: 130, widthGrow: 3, tooltip: true, hozAlign: 'center' },
  { title: '태그값', field: 'valueAtOccur', width: 80, hozAlign: 'center' },
      {
        title: '경보상태', field: 'alarmStatus', width: 95, hozAlign: 'center',
        /* DB(vw_alarm_history)는 ACTIVE / CLEARED로 주는데 현장에서 읽을 말로 바꿔 보여준다.
           ACTIVE만 빨간 '발생'이고 나머지는 전부 회색 '해제'다 — 지금 값이 둘뿐이지만
           나중에 다른 상태가 늘어도 발생으로 오인하지 않게 ACTIVE만 골라낸다. */
        formatter: (cell) => {
          const on = cell.getValue() === 'ACTIVE';
          return on
            ? '<span class="ht-badge on">발생</span>'
            : '<span class="ht-badge off">해제</span>';
        },
      },
];

/* 좁은 칸에 얹는 표라 페이지 넘김 줄이 자리를 너무 먹는다. 대신 세로 스크롤로 본다. */
const ALARM_OPTIONS = { pagination: false };

/* ---------------------------------------------------------------------------
   작은 부품들
   ------------------------------------------------------------------------- */

/** 조작 선택(수동/자동)과 자동운전/비상정지가 한 벌인 OP PANEL.
 *
 * 조작 선택은 버튼이 아니라 램프다 — 모드를 고르는 것은 현장 OP 패널의 물리 셀렉터이고,
 * 화면은 지금 어느 쪽에 걸려 있는지만 비춘다. 예전에는 눌리는 버튼이라 화면에서 누르면
 * 색이 바뀌었는데, PLC는 그대로인 채 화면만 바뀌어서 "바꿨다"고 오해할 자리였다.
 *
 * 두 램프는 서로를 보고 그리지 않는다. 각자 자기 태그가 1일 때 켜지고, 둘 다 0이면
 * 둘 다 꺼진 채로 둔다(셀렉터가 중립이거나 넘어가는 중인 상태를 그대로 보여준다).
 */
function OpPanel({ title, values, autoTag, manualTag, autoDriveTag, stopTag }) {
  /* 이 태그들은 이름 자체가 램프다(_cmd_lamp가 아니다). lampClassOf는 명령 이름에
     '_lamp'를 붙여 찾으므로 여기서는 값을 바로 읽는다.

     켜지는 값이 둘이 다르다 — 자동은 1일 때, 수동은 0일 때 켜진다(PLC가 그렇게 준다).
     연소화면의 MAIN GAS CLOSE와 같은 경우다. 그래서 몇에서 켜지는지를 호출부가 정한다. */
  const lampClass = (name, litWhen, onClassName = ' is-on') => {
    if (!values) return ' is-unknown';
    const st = tagState(values[name]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === litWhen ? onClassName : '';
  };

  return (
    <div className="hmi-group dr-panel">
      <span className="hmi-group-title">{title}</span>

      <div className="dr-op-row">
        <span className="dr-op-label">조작 선택</span>
        <span
          className={`dr-op-btn dr-op-lamp${lampClass(manualTag, TAG_OFF)}`}
          data-tag={manualTag}
          title={`${manualTag} — 값이 0이면 수동에 걸린 것(켜짐)`}
        >
          수동
        </span>
        <span
          className={`dr-op-btn dr-op-lamp${lampClass(autoTag, TAG_ON)}`}
          data-tag={autoTag}
          title={`${autoTag} — 값이 1이면 자동에 걸린 것(켜짐)`}
        >
          자동
        </span>
      </div>

      {/* 자동운전·비상정지도 램프다 — 기동과 정지는 현장 OP 패널에서 하고, 화면은
          지금 어떤 상태인지만 비춘다. 둘 다 값이 1일 때 켜지고, 색만 다르다:
          운전 중은 초록, 비상정지가 걸리면 빨강(다른 화면의 경보 색과 같다). */}
      <div className="dr-op-row">
        <span
          className={`dr-op-btn dr-op-lamp is-wide${lampClass(autoDriveTag, TAG_ON)}`}
          data-tag={autoDriveTag}
          title={`${autoDriveTag} — 값이 1이면 자동운전 중(켜짐)`}
        >
          자동운전
        </span>
        <span
          className={`dr-op-btn dr-op-lamp is-wide${lampClass(stopTag, TAG_ON, ' is-alarm')}`}
          data-tag={stopTag}
          title={`${stopTag} — 값이 1이면 비상정지 걸림(빨강)`}
        >
          비상정지
        </span>
      </div>
    </div>
  );
}

/**
 * 라벨 아래에 검은 표시창이 붙는 한 칸 — 사진의 PV/SV 칸 모양.
 * 표시 전용이라 입력 부품(LedInput)을 쓰지 않는다. 존·쿨링챔버·DOOR가 같이 쓴다.
 *
 * @param tone 숫자색. 사진을 따라 PV는 red, SV는 green.
 * @param tag  이 칸이 보여주는 PLC 태그 이름. 넘기면 마우스를 올렸을 때 뜬다.
 *             아직 태그가 없는 칸(쿨링챔버·DOOR)은 비워 두면 된다 — 그 자체가
 *             "이 칸은 아직 연결 안 됨"이라는 표시가 된다.
 */
/* label은 칸에 찍히는 글자라 짧아야 한다(옆의 SV 칸과 나란히 선다).
   hint는 마우스를 올렸을 때만 나오는 설명 — 어느 존의 값인지처럼 칸에 적기엔
   긴 말을 여기로 넘긴다. 없으면 label을 그대로 쓴다. */
function ValueBox({ label, value = '####', tone = 'red', tag, hint }) {
  return (
    <div className="dr-vbox" title={tag ? `${hint ?? label} — 읽기 전용 / ${tag}` : undefined}>
      <span className="dr-vbox-label">{label}</span>
      <em className={`dr-val is-${tone}`} data-tag={tag}>{value}</em>
    </div>
  );
}

/** PLC 상태를 비추기만 하는 램프 목록. 조작 대상이 아니다.
 *
 * 색은 값 하나로 정해진다 — 1이면 초록(on), 0이면 빨강(alarm).
 * 이 화면의 램프는 "조건이 섰나"를 보는 것이라 꺼짐이 회색이 아니라 빨강이다:
 * 회색으로 두면 조건이 안 선 것과 값을 못 읽은 것이 같아 보인다.
 * 못 읽었으면 점선(unknown)으로 따로 표시한다.
 */
function LampList({ title, lamps, values, className = '' }) {
  const lampClass = (tag) => {
    if (!values) return ' unknown';
    const st = tagState(values[tag]);
    if (st === TAG_UNKNOWN) return ' unknown';
    return st === TAG_ON ? ' on' : ' alarm';
  };

  return (
    <div className={`hmi-group dr-panel ${className}`}>
      {title && <span className="hmi-group-title">{title}</span>}
      <div className="dr-lamp-list">
        {lamps.map((lamp) => (
          <span className={`hmi-lamp${lampClass(lamp.tag)}`} key={lamp.tag} title={lamp.tag}>
            <span className="hmi-lamp-dot" />
            {lamp.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/** ON/OFF 조작 + PV/SV(mm/Min) + 구동감지 한 벌. 그림 위에 떠 있는 박스.
 *
 * ON/OFF는 누르는 버튼이면서 동시에 램프다 — 눌러서 기동/정지시키고, 색은 PLC가
 * 주는 램프 값(charge_on_cmd_lamp 등)으로 켜진다. 누른 것과 실제로 돈 것은 다르므로
 * 색을 화면이 먼저 바꾸지 않는다. PLC가 거부하면 색이 안 바뀌고, 그게 정보다.
 *
 * @param unit 태그 이름 앞부분 (charge / maincc / discharge)
 * @param values 폴링으로 받은 { 태그이름: 값 }
 * @param onPress (tagName) => void — 누름. 뗌은 화면이 window에서 받는다
 * @param heldTag 지금 누르고 있는 태그. 진행 바를 그리는 데 쓴다
 * @param armedTag 누름 시간을 채워 1이 나간 태그. 테두리를 그리는 데 쓴다
 * @param holdMs 눌러야 하는 시간(ms)
 */
function DrivePanel({
  title, unit, style, values, svMin, svMax,
  pvTag, svTag, detectTag, onSv,
  onPress, heldTag = '', armedTag = '', holdMs = 2000,
}) {
  /* 값을 못 받았으면 0이 아니라 '---'로 보여준다 — 0으로 그리면 실제 0과 구분되지 않는다. */
  const text = (tag) => {
    const v = values?.[tag];
    return v == null || v === '' ? '---' : String(v);
  };

  /* 구동감지 — 글자는 "구동감지 정상"으로 고정이고 색만 바뀐다(현장 화면 그대로).
     0이 정상(초록), 1이 이상(빨강), 못 읽으면 점선으로 '모름'. */
  const detectClass = (() => {
    if (!values) return ' is-unknown';
    const st = tagState(values[detectTag]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === TAG_OFF ? ' is-on' : ' is-alarm';
  })();

  /* ON/OFF 버튼 한 개 분량의 속성. 두 버튼이 켜지는 색만 다르고 나머지는 같다.
     disabled를 쓰지 않는다: 누른 뒤 비활성화되면 뗌 이벤트가 오지 않아 비트가 1로 남는다. */
  const btn = (action, onClassName) => {
    const cmd = driveCmd(unit, action);
    return {
      type: 'button',
      className: `dr-onoff hmi-lampbox${lampClassOf(values, cmd, onClassName)}`
        + (heldTag === cmd ? ' is-held' : '')
        + (armedTag === cmd ? ' is-armed' : ''),
      onPointerDown: () => onPress(cmd),
      'data-tag': cmd,
      title: `${title} ${action.toUpperCase()} — ${holdMs / 1000}초 누르면 전송`
        + ` / ${cmd} / 램프 ${lampOf(cmd)}`,
      children: (
        <>
          {action.toUpperCase()}
          {heldTag === cmd && (
            <span className="dr-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
          )}
        </>
      ),
    };
  };

  return (
    <div className="hmi-group dr-drive" style={style}>
      <span className="hmi-group-title">{title}</span>

      <div className="dr-drive-row">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <button {...btn('on', ' is-on')} />
        <span className="dr-drive-tag">PV</span>
        <LedInput
          value={text(pvTag)}
          readOnly
          color="red"
          size="sm"
          unit="mm/Min"
          title={`${title} 현재속도(PV) — 읽기 전용 / ${pvTag}`}
        />
      </div>

      {/* is-sv를 붙여 SV 입력칸만 연두색으로 물들인다(DrivePage.css의 --dr-sv). */}
      <div className="dr-drive-row is-sv">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <button {...btn('off', ' is-alarm')} />
        <span className="dr-drive-tag">SV</span>
        <LedInput
          value={text(svTag)}
          onChange={(v) => onSv(svTag, v)}
          color="red"
          size="sm"
          unit="mm/Min"
          title={`${title} 속도 설정(SV) / ${svTag}`}
          label={`${title} 속도 설정`}
          min={svMin}
          max={svMax}
        />
      </div>

      {/* 구동감지 — 글자 칸 자체가 램프다. 조작이 아니라 PLC 상태를 비춘다. */}
      <div className="dr-drive-foot">
        <span className={`dr-detect hmi-lampbox${detectClass}`} title={detectTag}>
          구동감지 정상
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   화면
   ------------------------------------------------------------------------- */

export default function DrivePage() {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);

  /* 그림은 원본 크기 그대로 그려 두고 통째로 줄인다. 그래야 작화 CSS를 안 건드리고도
     창 크기에 맞고, 위에 얹은 라벨도 그림과 같은 비율로 따라 움직인다.

     배율은 가로만 보고 정한다 — 좌우 끝에 딱 붙이려는 것이라서, 세로까지 같이 보면
     (min을 쓰면) 세로가 걸릴 때 좌우에 여백이 남는다. 높이는 비율대로 따라오고,
     그만큼의 자리는 아래 dr-stage에 height로 잡아 준다. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      if (!width) return;
      setScale(width / STAGE_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* 하단 경보 목록. 조회 조건 없이 전부 받는다 — 범위 지정이 필요하면 경보이력 화면을 쓴다.
     화면을 벗어난 뒤 응답이 도착해도 state를 건드리지 않게 한다
     (개발 모드의 StrictMode는 effect를 두 번 실행한다). */
  const [alarms, setAlarms] = useState([]);
  const [alarmError, setAlarmError] = useState('');

  useEffect(() => {
    let alive = true;

    getAlarmList()
      .then((res) => {
        if (alive) setAlarms(res.data ?? []);
      })
      .catch((e) => {
        if (alive) setAlarmError(e.response?.data?.message ?? '경보를 불러오지 못했습니다.');
      });

    return () => { alive = false; };
  }, []);


  /* 출구 TIME 설정 세 칸의 표시값 — 폴링으로 받은 PLC 값을 그대로 보여준다.
     못 받았으면 '---'로 둔다(0으로 보여주면 실제 0과 구분되지 않는다). */
  const timeText = (tag) => {
    const v = tagValues?.[tag];
    return v == null || v === '' ? '---' : String(v);
  };

  /* 숫자패드에서 확정한 값을 PLC에 쓴다. 값 태그와 표시 태그가 같아서,
     쓰고 나면 다음 폴링에 그 값이 그대로 돌아온다(안 돌아오면 쓰기가 실패한 것이다). */
  const handleTime = (tag, value) => {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return;

    setWriteError('');
    writeTag(DR_FOLDER_ID, tag, num)
      .catch((e) => setWriteError(`${tag} — ${e.message}`));
  };

  /* 구동부 속도 설정(SV) — 숫자패드에서 확정한 값을 PLC에 쓴다.
     값 태그와 표시 태그가 같아서, 쓰고 나면 다음 폴링에 그 값이 그대로 돌아온다. */
  const handleDriveSv = (tag, value) => {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return;

    setWriteError('');
    writeTag(DR_FOLDER_ID, tag, num)
      .catch((e) => setWriteError(`${tag} — ${e.message}`));
  };

  /* 이 화면의 PLC 값 — 램프·PV/SV·조작 상태가 전부 여기서 온다. */
  const { values: tagValues, error: tagValueError } = useFolderTagValues(DR_FOLDER_ID);
  const [writeError, setWriteError] = useState('');

  /* SIDE CONVEYOR 화살표 — 값이 1인 방향만 보인다(0이거나 못 읽으면 숨긴다).
     통신이 끊겼는데 화살표가 떠 있으면 컨베이어가 도는 것으로 읽히므로 숨기는 쪽이 안전하다.

     작화(DriveOverview)는 요소가 571개라 memo로 묶여 있다 — 1초마다 오는 값을 그대로
     넘기면 매 초 전부 다시 비교하게 된다. 그래서 무대에 클래스만 붙이고 실제로 숨기는
     일은 DrivePage.css가 맡는다(롤러는 CSS로 안 되는 경우라 아래에서 따로 다룬다).

     tagValues를 쓰므로 반드시 그 아래에 둔다 — 위에 두면 선언 전에 읽어서(TDZ)
     렌더가 통째로 죽는다. 실제로 그렇게 만들어 화면이 빈 적이 있다. */
  const arrowHideClass = ARROW_TAGS
    .filter(({ tag }) => tagState(tagValues?.[tag]) !== TAG_ON)
    .map(({ hideClass }) => ` ${hideClass}`)
    .join('');

  /* 롤러도 같은 규칙이다 — 1일 때만 돌고, 0이거나 못 읽으면 선다.
     이쪽은 클래스로 될 일이 아니라서(SVG 안의 애니메이션은 바깥 CSS가 못 건드린다)
     작화에 boolean을 넘긴다. 1초마다 오는 값이 아니라 결론만 넘기므로 memo는 그대로 산다. */
  const entRolling = tagState(tagValues?.[ROLLER_TAGS.ent.tag]) === TAG_ON;
  const exitRolling = tagState(tagValues?.[ROLLER_TAGS.exit.tag]) === TAG_ON;

  /* 모터는 화살표와 같은 방식이다 — 무대에 클래스만 붙이고 회색으로 만드는 일은 CSS가 한다. */
  const motorGray = MOTOR_GRAY
    .filter(({ tag }) => tagState(tagValues?.[tag]) !== TAG_ON)
    .map(({ grayClass }) => ` ${grayClass}`)
    .join('');

  /* 값을 못 받았으면 0이 아니라 '---'로 보여준다.
     읽지 못한 온도를 0으로 그리면 노가 식은 것으로 오해한다. */
  const zoneText = (n, suffix) => {
    const v = tagValues?.[zoneTag(n, suffix)];
    return v == null || v === '' ? '---' : String(v);
  };

  /** 그림 위에 얹는 상태 램프(제품감지·회전감지 넷) — 1이면 초록, 0이면 회색, 못 읽으면 점선.
      아래 LampList의 램프와 달리 0을 빨강으로 두지 않는다. 이 자리는 "지금 감지되고
      있다"를 알리는 것이지 이상을 알리는 것이 아니라, 안 감지된 상태가 경보로 보이면 안 된다. */
  const statusLampClass = (tag) => {
    const st = tagState(tagValues?.[tag]);
    if (st === TAG_UNKNOWN) return ' unknown';
    return st === TAG_ON ? ' on' : '';
  };

  /* 입구 롤러 줄 맨 끝의 매쉬 롤러 — 0이면 빨강, 1이면 초록, 못 읽으면 회색.
     이 그림만 색이 바뀐다. 램프가 아니라 그림이라 클래스가 아니라 filter로 물들인다. */
  const endRollerState = tagState(tagValues?.[END_ROLLER.tag]);
  const endRollerClass = endRollerState === TAG_UNKNOWN
    ? ' is-unknown'
    : (endRollerState === TAG_ON ? ' is-on' : ' is-alarm');

  /* 그림 위 글귀에 섞이는 값(NOTES의 valueTag) — 같은 규칙으로 '---'를 쓴다. */
  const noteValue = (tag) => {
    const v = tagValues?.[tag];
    return v == null || v === '' ? '---' : String(v);
  };

  /* 표시는 Working SV(D100), 입력은 R100으로 나간다 — 온도제어 화면과 같은 규칙이다.
     램프 프로그램이 돌면 930을 넣어도 표시는 850→880→910으로 따라 올라간다. */
  const handleZoneSv = (n, value) => {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return;

    setWriteError('');
    writeTag(DR_FOLDER_ID, zoneTag(n, 'sv_cmd'), num)
      .catch((e) => setWriteError(`${zoneTag(n, 'sv_cmd')} — ${e.message}`));
  };

  /* ── 구동부 ON/OFF (momentary) ────────────────────────────────────────
     누르고 DRIVE_HOLD_MS를 채우면 1, 떼면 0. PLC가 그 순간을 받아 기동/정지하고
     결과는 램프 태그로 돌아온다. */

  // 지금 누르고 있는 태그 — 진행 바를 그리는 데만 쓴다(버튼을 비활성화하지 않는다)
  const [heldTag, setHeldTag] = useState('');
  // 누름 시간을 채워서 실제로 1이 나간 태그 — 테두리(.is-armed)를 그리는 데 쓴다
  const [armedTag, setArmedTag] = useState('');

  /* 누름 상태를 ref로도 들고 있는다. window 이벤트 핸들러가 state를 보면 첫 렌더의
     값에 갇히고, 뗌을 놓치면 비트가 1로 남는다. */
  const heldRef = useRef(null);
  const armedRef = useRef(false);
  const holdTimerRef = useRef(null);
  /* 쓰기 순서를 지키기 위한 사슬. 1과 0을 따로 보내면 짧게 눌렀을 때 0이 먼저
     도착해서 비트가 1로 남을 수 있다 — 1이 끝난 뒤에 0을 보낸다. */
  const chainRef = useRef(Promise.resolve());

  /* ALARM SWITCH 두 버튼의 색 — 이 태그들은 이름 자체가 상태값이라(_lamp가 없다)
     lampClassOf 대신 값을 바로 읽는다. 1이면 켜짐, 못 읽으면 모름(점선). */
  const switchLampClass = (name) => {
    if (!tagValues) return ' is-unknown';
    const st = tagState(tagValues[name]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === TAG_ON ? ' is-on' : '';
  };

  const handleDrivePress = (name) => {
    if (heldRef.current) return;   // ON과 OFF를 동시에 누르는 상황은 만들지 않는다
    heldRef.current = name;
    armedRef.current = false;
    setHeldTag(name);
    setArmedTag('');
    setWriteError('');

    holdTimerRef.current = setTimeout(() => {
      armedRef.current = true;
      setArmedTag(name);
      chainRef.current = writeTag(DR_FOLDER_ID, name, 1)
        .catch((e) => setWriteError(`${name} — ${e.message}`));
    }, DRIVE_HOLD_MS);
  };

  const handleDriveRelease = () => {
    const name = heldRef.current;
    if (!name) return;
    heldRef.current = null;
    setHeldTag('');
    setArmedTag('');

    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;

    // 시간을 못 채웠으면 1을 보낸 적이 없으니 0도 보낼 필요가 없다
    if (!armedRef.current) return;
    armedRef.current = false;

    /* 1이 실패했어도 0은 보낸다 — 나갔는지 모르는 상태로 두는 것보다 확실히 내리는
       쪽이 안전하다. log=false: 이 0은 사람이 한 조작이 아니라 누름의 자동 해제다. */
    chainRef.current = chainRef.current
      .then(() => writeTag(DR_FOLDER_ID, name, 0, false))
      .catch((e) => setWriteError(`${name} 해제 실패 — ${e.message}`));
  };

  /* ── 설비 OFF 버튼 (토글) ─────────────────────────────────────────────
     위 ON/OFF와 달리 모멘터리가 아니다. 2초를 채우면 지금 값의 반대를 보내고
     그대로 남는다 — 떼는 것은 아무 값도 보내지 않는다.

     값을 못 읽는 동안은 누름 자체를 시작하지 않는다. 반대값을 보내는 조작이라
     지금 값을 모르면 무엇을 보낼지 정할 수 없다. 눌러도 아무 일이 없는 것을 진행 바가
     차오르다 마는 것으로 보여 주면 고장으로 읽히므로, 처음부터 반응하지 않게 둔다. */
  const offBtnState = tagState(tagValues?.[FACILITY_OFF_BTN_TAG]);
  const offBtnClass = offBtnState === TAG_UNKNOWN
    ? ' is-unknown'
    : (offBtnState === TAG_ON ? ' is-on' : ' is-alarm');
  const [offBtnHeld, setOffBtnHeld] = useState(false);
  const offBtnHeldRef = useRef(false);
  const offBtnTimerRef = useRef(null);

  const handleOffBtnPress = () => {
    if (offBtnHeldRef.current || offBtnState === TAG_UNKNOWN) return;
    offBtnHeldRef.current = true;
    setOffBtnHeld(true);
    setWriteError('');

    /* 보낼 값을 누르는 순간의 값으로 정한다. 2초 사이에 폴링이 값을 바꾸더라도
       작업자가 보고 누른 그 값의 반대가 나가야 한다 — 타이머 안에서 다시 읽으면
       손이 떠난 뒤의 값을 뒤집게 된다. */
    const next = offBtnState === TAG_ON ? 0 : 1;

    offBtnTimerRef.current = setTimeout(() => {
      writeTag(DR_FOLDER_ID, FACILITY_OFF_BTN_TAG, next)
        .catch((e) => setWriteError(`${FACILITY_OFF_BTN_TAG} — ${e.message}`));
    }, DRIVE_HOLD_MS);
  };

  /* 떼는 것으로는 아무 값도 보내지 않으므로 여기서는 타이머만 거둔다. */
  const handleOffBtnRelease = () => {
    if (!offBtnHeldRef.current) return;
    offBtnHeldRef.current = false;
    setOffBtnHeld(false);
    clearTimeout(offBtnTimerRef.current);
    offBtnTimerRef.current = null;
  };

  /* 뗌을 버튼이 아니라 window에서 받는다.
     손가락이 버튼 밖으로 나가서 떼도, 창이 포커스를 잃어도(탭 전환·알림창) 반드시
     0이 나가게 하려는 것이다. 버튼의 onPointerUp만 믿으면 그런 경우에 비트가 1로
     남고, PLC는 기동/정지 명령이 계속 걸려 있는 상태가 된다.
     핸들러가 ref와 setState만 건드려서 렌더마다 새로 걸 필요가 없다. */
  useEffect(() => {
    const release = () => { handleDriveRelease(); handleOffBtnRelease(); };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);

    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      release();   // 화면을 떠날 때 누르고 있던 것이 있으면 내린다
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* hmi-dark — 어두운 배경·유리 판은 scada.css의 공용 규칙이 맡는다.
       작화(롤러·모터·컨베이어)는 배경이 비어 있어 그대로 얹힌다. */
    <div className="dr-page hmi-dark">
      {/* 매쉬 롤러를 물들이는 색 행렬. CSS의 filter: url(#dr-green) / url(#dr-red)가 부른다.

          기성 필터로는 안 된다 — grayscale·sepia에는 '초록으로'가 없고, hue-rotate로 맞추면
          원래 색마다 다른 색이 나온다. 그래서 화면 램프 색(초록 #15803d / 빨강 #dc2626)을
          먼저 정하고, 거기에 밝기(luminance)로 낸 배수 0.45~1.30을 곱한다. 어디를 찍어도
          그 색 계열 안이고 그 안에서만 명암이 진다.

          CSS가 앞에 contrast(1.8)을 먼저 건다 — 원본이 밝은 은회색 좁은 범위라 바로
          물들이면 안쪽 매쉬 무늬가 뭉개진다. 분위기제어(#at-green)와 같은 방식이고,
          그쪽 주석에 왜 이 값인지(형광이 됐던 과정까지) 적어 두었다.
          필터 정의는 문서마다 따로 있어야 해서 화면끼리 나눠 쓸 수 없다. */}
      <svg className="dr-filter-defs" aria-hidden="true">
        <filter id="dr-green" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.01488 0.05006 0.00505 0 0.03706
                    0.09071 0.30515 0.03081 0 0.22588
                    0.04323 0.14542 0.01468 0 0.10765
                    0       0       0       1 0"
          />
        </filter>
        <filter id="dr-red" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.15591 0.52448 0.05295 0 0.38824
                    0.02693 0.09059 0.00915 0 0.06706
                    0.02693 0.09059 0.00915 0 0.06706
                    0       0       0       1 0"
          />
        </filter>
      </svg>

      {/* ===== 상단 조작·상태 패널 ===== */}
      <div className="dr-top">
        {/* 입구 = charge, 출구 = discharge. 폴더 9의 기존 태그(charge_on_cmd 등)와 같은 말이다. */}
        <OpPanel
          title="입구 OP PANEL"
          values={tagValues}
          autoTag="charge_op_auto_lamp"
          manualTag="charge_op_manual_lamp"
          autoDriveTag="charge_op_auto_drive_lamp"
          stopTag="charge_op_emergency_stop_lamp"
        />

        <div className="hmi-group dr-panel dr-alarm-sw">
          <span className="hmi-group-title">ALARM SWITCH</span>
          {/* 알람화면의 같은 버튼과 동작이 같다 — 2초 누르면 1, 떼면 0.
              disabled를 걸지 않는 이유는 다른 momentary 버튼과 같다:
              비활성 요소는 뗌 이벤트를 못 받아서 비트가 1로 남는다. */}
          {ALARM_SWITCHES.map((b) => (
            <button
              type="button"
              key={b.tag}
              className={`dr-op-btn is-wide${switchLampClass(b.tag)}`
                + (heldTag === b.tag ? ' is-held' : '')
                + (armedTag === b.tag ? ' is-armed' : '')}
              onPointerDown={() => handleDrivePress(b.tag)}
              data-tag={b.tag}
              title={`${b.tag} — ${DRIVE_HOLD_MS / 1000}초 누르면 1, 떼면 0`}
            >
              {b.text}
              {heldTag === b.tag && (
                <span className="dr-hold-bar" style={{ animationDuration: `${DRIVE_HOLD_MS}ms` }} />
              )}
            </button>
          ))}
        </div>

        <LampList title="입구 자동운전 조건" lamps={ENT_CONDITIONS} values={tagValues} />
        <LampList title="출구 자동운전 조건" lamps={EXIT_CONDITIONS} values={tagValues} />

        <div className="hmi-group dr-panel dr-time">
          <span className="hmi-group-title">출구 구동부 자동운전 TIME 설정</span>
          {EXIT_TIMES.map((t) => (
            <div className="dr-time-row" key={t.key}>
              <span className="dr-time-label">{t.label}</span>
              {/* 색은 DrivePage.css의 .dr-time 규칙이 --dr-sv(존 SV와 같은 연두)로 덮는다. */}
              <LedInput
                value={timeText(t.tag)}
                onChange={(v) => handleTime(t.tag, v)}
                size="sm"
                unit="SEC"
                title={`${t.label} — ${t.tag}`}
                label={t.label}
                min={t.min}
                max={t.max}
              />
            </div>
          ))}
        </div>

        <OpPanel
          title="출구 OP PANEL"
          values={tagValues}
          autoTag="discharge_op_auto_lamp"
          manualTag="discharge_op_manual_lamp"
          autoDriveTag="discharge_op_auto_drive_lamp"
          stopTag="discharge_op_emergency_stop_lamp"
        />
      </div>

      {/* ===== 설비 그림 + 그 위에 얹는 것들 ===== */}
      {/* 줄인 뒤의 실제 높이만큼만 자리를 차지하게 한다 — 그래야 그림 아래에 빈 띠가
          남지 않고, 아래 패널들이 바로 붙는다. */}
      <div
        className="dr-stage"
        ref={stageRef}
        style={{ height: (STAGE_H + STAGE_PAD_B) * scale }}
      >
        {/* 왼쪽 위를 고정점으로 줄인다(transform-origin: top left). 배율이 가로 기준이라
            줄인 폭이 곧 무대 폭이 되어 좌우 양끝에 딱 맞는다. */}
        <div
          className={`dr-stage-inner${arrowHideClass}${motorGray}`}
          style={{
            width: STAGE_W,
            height: STAGE_H + STAGE_PAD_B,
            transform: `scale(${scale})`,
          }}
        >
          <DriveOverview entRolling={entRolling} exitRolling={exitRolling} />

          <div className="dr-overlay">
            {LABELS.map((l) => (
              <span
                className="dr-tag"
                key={l.key}
                style={{ left: l.cx, top: l.top, transform: 'translateX(-50%)' }}
              >
                {l.text}
              </span>
            ))}

            {DRIVE_PANELS.map((p) => (
              <DrivePanel
                key={p.key}
                title={p.title}
                unit={p.unit}
                style={{ left: p.left, top: p.top }}
                values={tagValues}
                pvTag={p.pvTag}
                svTag={p.svTag}
                detectTag={p.detectTag}
                onSv={handleDriveSv}
                onPress={handleDrivePress}
                heldTag={heldTag}
                armedTag={armedTag}
                holdMs={DRIVE_HOLD_MS}
                svMin={p.svMin}
                svMax={p.svMax}
              />
            ))}

            {/* MAIN DRIVE 존별 PV/SV — 존 이미지 위에 그대로 겹친다. */}
            {ZONES.map((n) => (
              <div
                className="dr-zone"
                key={n}
                style={{ left: ZONE_LEFT + (n - 1) * ZONE_STEP, width: ZONE_W, top: 225, gap: 15 }}
              >
                {/* 사진의 표기는 ZONE1이 아니라 1ZONE이다. */}
                <div className="dr-zone-title">{`${n}ZONE`}</div>
                <ValueBox label="PV" hint={`${n}ZONE 현재온도`} value={zoneText(n, 'pv')} tag={zoneTag(n, 'pv')} />

                {/* SV는 설정값이라 눌러서 숫자패드로 넣는다. 글자색은 DrivePage.css의 --dr-sv.
                    표시는 tic_zN_sv(D100, 실제 적용 중인 목표값), 입력은 tic_zN_sv_cmd(R100). */}
                <div className="dr-vbox">
                  <span className="dr-vbox-label">SV</span>
                  <LedInput
                    value={zoneText(n, 'sv')}
                    onChange={(v) => handleZoneSv(n, v)}
                    size="sm"
                    label={`${n}ZONE 설정온도`}
                    title={`표시 ${zoneTag(n, 'sv')} / 입력 ${zoneTag(n, 'sv_cmd')}`}
                    min={ZONE_SV_MIN}
                    max={ZONE_SV_MAX}
                  />
                </div>
              </div>
            ))}

            {/* DOOR 이름 — 작화 문짝 폭이 31px뿐이라 글자를 세로로 세운다 */}
            <div className="dr-door" style={{ left: 494, top: 205 }}>
              <span className="dr-door-text">DOOR</span>
            </div>

            {/* 로 순환 팬 — 그림과 같은 좌표계에 놓아서 배율이 바뀌어도 판 가운데에 남는다.
                값이 1이면 도는 그림, 0이거나 못 읽으면 멈춘 그림으로 바꿔 끼운다. */}
            {FANS.map((f) => (
              <img
                className="dr-fan"
                key={f.key}
                src={tagState(tagValues?.[FAN_TAGS[f.key].tag]) === TAG_ON ? FAN_SPIN_SRC : FAN_STILL_SRC}
                alt=""
                title={artTitle(FAN_TAGS[f.key])}
                style={{ left: f.left, top: FAN_TOP, width: FAN_SIZE, height: FAN_SIZE }}
              />
            ))}

            {/* 입구 롤러 줄 맨 끝 롤러 — 작화에서 빠져 나온 것을 여기서 채운다.
                그림과 같은 좌표계라 배율이 바뀌어도 옆 롤러와 어긋나지 않는다.
                이 하나만 겉면이 매쉬다(roller-mesh.svg) — 제품 감지 자리라 작화에도
                옆의 매끈한 롤러들과 다르게 그려져 있다. */}
            {/* 두 장을 겹친다. 아래는 원본 그대로고, 위는 같은 그림을 몸통만 오려내
                물들인 것이다 — 바깥에서 건 filter는 그림 전체에 걸려서, 위·아래 축(고정부)만
                빼고 칠할 방법이 이것뿐이다(오려내는 자리는 DrivePage.css가 갖고 있다). */}
            <img
              className="dr-end-roller"
              src="/scada/drive/roller-mesh.svg"
              alt=""
              data-tag={END_ROLLER.tag}
              title={`제품 감지 매쉬 롤러 — 읽기 전용 / ${END_ROLLER.tag} — 1이면 초록 / 0이면 빨강`}
              style={{ left: END_ROLLER.left, top: END_ROLLER.top, width: END_ROLLER.width, height: END_ROLLER.height }}
            />
            <img
              className={`dr-end-roller dr-end-roller-body${endRollerClass}`}
              src="/scada/drive/roller-mesh.svg"
              alt=""
              aria-hidden="true"
              style={{ left: END_ROLLER.left, top: END_ROLLER.top, width: END_ROLLER.width, height: END_ROLLER.height }}
            />

            {/* 제품감지 — 위 롤러와 DOOR 사이에 표시등을 세우고 글씨를 그 아래 붙인다. */}
            <span
              className={`hmi-lamp dr-product-lamp${statusLampClass(PRODUCT_LAMP.tag)}`}
              style={{ left: PRODUCT_LAMP.cx, top: PRODUCT_LAMP.top }}
              data-tag={PRODUCT_LAMP.tag}
              title={`제품감지 — 읽기 전용 / ${PRODUCT_LAMP.tag} — 1이면 초록`}
            >
              <span className="hmi-lamp-dot" />
              <em>제품감지</em>
            </span>

            {/* 회전감지 램프 — 짝이 되는 모터 바로 아래. 그림과 같은 좌표계라
                배율이 바뀌어도 모터와 어긋나지 않는다. */}
            {TRIP_LAMPS.map((l) => (
              <span
                className={`hmi-lamp dr-trip-lamp${statusLampClass(l.tag)}`}
                key={l.key}
                style={{ left: l.cx, top: TRIP_TOP, transform: 'translateX(-50%)' }}
                data-tag={l.tag}
                title={`${l.text.replace('\n', ' ')} — 읽기 전용 / ${l.tag} — 1이면 초록`}
              >
                <span className="hmi-lamp-dot" />
                {l.text}
              </span>
            ))}

            {/* cx가 있으면 그 지점을 가운데로 맞추고(-50% 이동), left면 그대로 왼쪽 끝. */}
            {NOTES.map((n) => (
              <span
                className="dr-note"
                key={n.key}
                style={n.cx != null
                  ? { left: n.cx, top: n.top, transform: 'translateX(-50%)' }
                  : { left: n.left, top: n.top }}
                title={n.valueTag ? `${n.valueLabel} — 읽기 전용 / ${n.valueTag}` : undefined}
              >
                {n.valueTag && <span className="dr-note-val">{noteValue(n.valueTag)}</span>}
                {n.text}
                {/* 0이면 빨강, 1이면 초록, 못 읽으면 점선. 점선일 때는 보낼 값을
                    정할 수 없어 눌러도 반응하지 않는다(위 handleOffBtnPress 참고). */}
                {n.lamp && (
                  <button
                    type="button"
                    className={`dr-note-lamp hmi-lampbox${offBtnClass}${offBtnHeld ? ' is-held' : ''}`}
                    onPointerDown={handleOffBtnPress}
                    title={`설비 OFF / ${n.lampTag} — ${DRIVE_HOLD_MS / 1000}초 누르면 0↔1 뒤집힘`}
                  >
                    {n.lamp}
                    {offBtnHeld && (
                      <span className="dr-hold-bar" style={{ animationDuration: `${DRIVE_HOLD_MS}ms` }} />
                    )}
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 하단 경보 목록 + 램프판 ===== */}
      <div className="dr-bottom">
        <div className="dr-alarm">
          {alarmError && <div className="dr-alarm-error">{alarmError}</div>}
          <HmiTable data={alarms} columns={ALARM_COLUMNS} options={ALARM_OPTIONS} height="100%" />
        </div>

        {LAMP_BOARDS.map((b) => (
          <LampList key={b.key} lamps={b.lamps} values={tagValues} className="dr-board" />
        ))}
      </div>

      {/* 쓰기 실패·값 수신 실패 안내. SV를 넣었는데 아무 반응이 없을 때 이유가 보여야 한다. */}
      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
    </div>
  );
}
