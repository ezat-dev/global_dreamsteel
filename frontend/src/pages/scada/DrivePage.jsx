import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DriveOverview from '../../components/scada/DriveOverview';
import {
  ARROW_TAGS, FAN_TAGS, MOTOR_TAGS, RAIL_TAGS, ROLLER_TAGS, ZONE_TAGS,
  artTitle, motorGrayClass, motorYellowClass, railRollClass, zoneHotClass,
} from '../../components/scada/driveArtTags';
import HmiTable from '../../components/scada/HmiTable';
import { LedInput } from '../../components/scada/HmiParts';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import useAlarmList from '../../components/scada/useAlarmList';
import {
  lampClassOf, lampOf, tagState, writeTag, TAG_ON, TAG_OFF, TAG_UNKNOWN,
} from '../../api/scada/foldertagApi';
import { useHoldMs } from '../../components/scada/HoldMsContext';
import { beginPress, endPress } from '../../components/scada/pressGuard';
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

   화면에 찍히는 글자(라벨·램프 이름·툴팁)는 사전 i18n/{ko,en}/drive.json에 있다.
   아래 표들에는 위치와 태그만 두고, 글자는 키로 찾는다 — 램프는 lamp.<태그>,
   그림 위 라벨은 label.<key>.
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
     MAIN ZONE1~7  x 494~1124, y 200~366      COOLING CH.      x1124~1353, y 200~368
     출구 POCKET   x1403~1667, y   0~206      출구 TABLE DR.   x1353~1667, y 215~349
     맨 오른쪽 모터 x1667~1723

   DOOR(x 494~525)와 그 오른쪽 빈 판(525~609)은 2026-11-17에 지웠다. 그 115px만큼
   MAIN 존을 왼쪽으로 당기고, 존 한 칸을 75 → 90px로, 쿨링챔버 판을 216 → 229px로
   다시 나눴다 — 작화 원본 CSS는 그대로 두고 DrivePage.css의 'DOOR 자리 비우기'가
   덮어쓴다. 출구 쪽은 그대로다.
   ------------------------------------------------------------------------- */
/* 글자는 drive.json의 label.<key> */
const LABELS = [
  { key: 'entPocket', cx: 188, top: -2 },     // 입구 POCKET
  { key: 'entSide', cx: 188, top: 70 },       // 입구 SIDE CONVEYOR
  { key: 'entTable', cx: 190, top: 360 },     // 입구 TABLE DRIVE
  { key: 'mainDrive', cx: 809, top: 168 },    // MAIN DRIVE — 존(x 494~1124) 가운데
  /* 사진처럼 두 줄로(COOLING CHAMBER / TABLE DRIVE). 사전 글자의 \n은 .dr-tag의
     white-space: pre-line이 살린다.
     쿨링챔버 판(x1124~1353) 가운데 1238에 맞춘다. */
  { key: 'coolTable', cx: 1238, top: 168 },
  { key: 'exitPocket', cx: 1535, top: -2 },   // 출구 POCKET
  { key: 'exitSide', cx: 1535, top: 70 },     // 출구 SIDE CONVEYOR
  { key: 'exitTable', cx: 1540, top: 357 },   // 출구 TABLE DRIVE
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
   현장 주소를 받으면 DB의 address만 고치면 되고 화면은 손댈 필요가 없다.

   박스 제목은 key로 사전의 label.<key>를 찾는다(그림 위 라벨과 같은 묶음). */
const DRIVE_PANELS = [
  {
    key: 'entTable', unit: 'charge', left: 350, top: 12, svMin: 0, svMax: 2610,
    pvTag: 'charge_table_drive_pv',
    svTag: 'charge_table_drive_sv',
    detectTag: 'charge_table_drive_detect_normal_lamp',
  },
  {
    key: 'mainCc', unit: 'maincc', left: 700, top: 12, svMin: 0, svMax: 2610,
    pvTag: 'maincc_drive_pv',
    svTag: 'maincc_drive_sv',
    detectTag: 'maincc_drive_detect_normal_lamp',
  },
  // 출구 컨베이어(x 1353~1723) 위에 오도록. 폭이 250이라 left는 1473을 넘기면 안 된다.
  {
    key: 'exitTable', unit: 'discharge', left: 1050, top: 12, svMin: 0, svMax: 4110,
    pvTag: 'discharge_table_drive_pv',
    svTag: 'discharge_table_drive_sv',
    detectTag: 'discharge_table_drive_detect_normal_lamp',
  },
];

/* MAIN DRIVE 존 — 작화 존 이미지 위에 PV/SV를 그대로 얹는다(존 폭 90px 간격).
   494는 DOOR를 지우고 당긴 자리, 90은 쿨링챔버 폭을 넘겨받아 넓힌 칸이다 —
   DrivePage.css의 존 left/width 값과 같이 움직인다. */
const ZONE_LEFT = 494;
const ZONE_STEP = 90;
const ZONE_W = 90;
const ZONES = [1, 2, 3, 4, 5, 6, 7];

/* 존 SV 허용 범위 — 7개 존이 모두 같다. 온도(0~1000℃)라 온도제어 화면과 같은 값이다.
   숫자패드가 이 범위를 벗어난 값은 확정하지 못하게 막는다. */
const ZONE_SV_MIN = 0;
const ZONE_SV_MAX = 1000;

/* 이 화면의 PLC 태그가 든 폴더 — ez_scada.folders.id (폴더 이름 '구동화면').
   DB에 만든 행의 id와 반드시 같아야 한다. 틀리면 오류가 아니라 태그 0개 응답으로
   조용히 실패하니, 값이 전부 '---'로 나오면 여기를 먼저 본다. */
const DR_FOLDER_ID = 9;

/* MAIN DRIVE 아래 '####℃ 이하시 설비 OFF'의 OFF 버튼. 읽기와 쓰기가 같은 태그다. */
const FACILITY_OFF_BTN_TAG = 'facility_off_temp_toggle_button';

/* ALARM SWITCH 판의 두 버튼 — 알람화면의 같은 버튼과 태그·동작이 완전히 같다
   (같은 주소를 폴더 9에도 넣어 두었다. 이 화면은 폴더 9만 폴링하므로,
   여기에 있어야 읽기와 쓰기가 한 폴더에서 끝난다).

   값을 쓰는 태그와 상태를 읽는 태그가 하나다 — 짝이 되는 _lamp가 없다.
   누르는 순간 1이 나가고(누름 지연 시간 없음) 떼면 0, 그리고 1인 동안 버튼이 초록으로 켜진다. */
const ALARM_SWITCHES = [
  { tag: 'alarm_reset', text: 'ALARM RESET' },
  { tag: 'alarm_horn_stop', text: 'HORN STOP' },
];

/* 이 판의 두 버튼은 쓰는 태그가 곧 상태 태그다 — 다른 조작 버튼처럼 _lamp를 보지
   않으므로, 누른 뒤 값을 직접 읽을 때도 그 태그를 그대로 읽는다. */
const isAlarmSwitch = (name) => ALARM_SWITCHES.some((b) => b.tag === name);

/* 구동부 ON/OFF 태그. 화면 이름은 입구/출구지만 태그는 현장 용어인 장입/배출을 쓴다.
     charge    M300 ON / M301 OFF   램프 M600 / M601   입구 TABLE DRIVE
     maincc    M302 / M303          램프 M602 / M603   MAIN/CC DRIVE
     discharge M304 / M305          램프 M604 / M605   출구 TABLE DRIVE
     fan2      M306 / M307          램프 M606 / M607   쿨링챔버 왼쪽 팬(FANS)
     fan3      M308 / M309          램프 M608 / M609   쿨링챔버 오른쪽 팬
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
           yellowTag가 있는 모터(입구 모터 1·출구 모터 4)는 초록이 아닐 때 그 태그가 1이면
           회색 대신 노랑이다(#dr-yellow).
           어느 자리가 어느 태그인지는 driveArtTags.js의 MOTOR_TAGS 주석에 좌표까지 적혀 있다. */
const MOTOR_COLOR = Object.entries(MOTOR_TAGS).map(([cls, t]) => ({
  tag: t.tag,
  yellowTag: t.yellowTag,
  grayClass: motorGrayClass(cls),
  yellowClass: motorYellowClass(cls),
}));

/* 존 PV/SV는 온도제어 화면과 같은 PLC 주소를 본다(1존 PV R100 / Working SV R102 / 설정 SV R120).
   같은 주소가 폴더 8과 9에 각각 한 행씩 있다 — 화면마다 폴더 하나만 폴링하려고
   복제한 것이다. PLC 왕복은 늘지 않는다(C# 폴러가 주소를 Distinct로 묶어 읽는다).
   주소가 바뀌면 두 폴더를 함께 고쳐야 한다는 점만 주의. */
const zoneTag = (n, suffix) => `tic_z${n}_${suffix}`;

/* 로 순환 팬 둘 — 쿨링챔버 판(main-obj-2) 위에 나란히.

   판이 x1124~1353(229px)이고(2026-11-17) 팬은 40 → 64로 키웠다.
   판을 4등분한 1/4·3/4 지점(x1181 / x1296)에 팬 가운데를 맞춘다 — left는 거기서
   팬 절반(32)을 뺀 값이다. top은 아래 ON/OFF 버튼 자리를 남기려고 판 위쪽에 붙였다
   (팬 240~304, 버튼 312~334, 판 아래 끝 368).

   DOOR 오른쪽 판(main-obj-1)에도 하나 있었는데 지웠다 — 그 자리에 팬이 없다고
   확인받았다(판 자체도 지금은 없다). 태그(fan1_lamp)는 driveArtTags에서 같이 뺐다.
   둘 다 같은 top을 쓴다 — 따로 두면 높이가 어긋난다. */
const FAN_SIZE = 64;
const FAN_TOP = 240;

/* unit은 팬 ON/OFF 버튼 태그의 앞부분이다(driveCmd — fan2_on_cmd 등). 구동부 버튼과 같은 구조:
     fan2  ON M306 / OFF M307   램프 M606 / M607   쿨링챔버 왼쪽 팬
     fan3  ON M308 / OFF M309   램프 M608 / M609   쿨링챔버 오른쪽 팬
   팬이 도는 그림은 FAN_TAGS(fan2_lamp / fan3_lamp)가 보는데, 그 주소도 ON 램프와 같은
   M606 / M608이다 — ON 램프가 켜진 것과 팬이 도는 것이 같은 값이다. */
const FANS = [
  { key: 'cc1', unit: 'fan2', left: 1149 },
  { key: 'cc2', unit: 'fan3', left: 1264 },
];

/* 팬 아래 ON/OFF 한 쌍 — 한 박스로 감싼다(DrivePage.css .dr-fan-btns, 2026-11-18).
   폭 = 버튼 44(.dr-onoff) x 2 + 사이 6 + 안쪽 여백 5 x 2 + 테두리 1 x 2 = 106px, 팬 가운데에 맞춘다.
   두 박스는 x 1128~1234 / 1243~1349 — 사이 9px이고 쿨링챔버 판(x 1124~1353) 안에 든다. */
const FAN_BTN_TOP = 312;
const FAN_BTN_W = 106;

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
   화면은 손댈 필요가 없다 — 그래서 이름을 먼저 박아 두었다.

   램프 글자는 drive.json의 lamp.<태그>다(아래 하단 램프판·회전감지 램프도 같다). */
const ENT_CONDITIONS = [
  { tag: 'charge_motor_trip_lamp' },       // 입구 모터 트립조건
  { tag: 'charge_auto_step_lamp' },        // 입구 자동STEP 초기조건
  { tag: 'charge_table_drive_lamp' },      // 입구 TABLE DRIVE 구동상태
  { tag: 'charge_emergency_off_lamp' },    // 입구 비상정지 OFF
];

const EXIT_CONDITIONS = [
  { tag: 'discharge_motor_trip_lamp' },                // 출구 모터 트립조건
  { tag: 'discharge_auto_step_lamp' },                 // 출구 자동STEP 초기조건
  { tag: 'discharge_table_drive_lamp' },               // 출구 TABLE DRIVE 구동상태
  { tag: 'discharge_side_conveyor_down_state_lamp' },  // 출구 SIDE CONVEYOR 하강상태
  { tag: 'discharge_emergency_off_lamp' },             // 출구 비상정지 OFF
];

/* 출구 구동부 자동운전 TIME 설정(윗줄 판)은 2026-11-18 엔지니어링 기본설정의
   '구동부 자동운전 TIME 설정' 판으로 옮겼다(EngineeringPage.jsx의 SECTIONS autoTime). */

/* ---------------------------------------------------------------------------
   하단 램프판 — 묶음별 램프 목록
   ------------------------------------------------------------------------- */
/* tag는 ez_scada.folders_tags.name이다(위 조건 램프와 같은 규칙).
   글자는 drive.json의 lamp.<태그>.

   2026-11-17 현장 I/O 표로 통째로 바꿨다(예전 SOL VALVE / P/X 등 26개는 DB에서도 지웠다).
   표의 이름을 줄이지 않고 한 줄에 다 보이게 둔다(사용자 요청 — 칸 모양으로 줄여 봤다가
   되돌렸다). 순서는 표 그대로(Y 출력 → X 입력)이고 위에서 아래로 채운 뒤 다음 열로 간다.

   cols는 판의 열 수다. 1920 화면에서 실제로 재서 정했다(이 화면 글꼴 11.5px):
     입구 — 가장 긴 이름(스토퍼 …감지 L/S) 249px이라 3열은 안 들어간다 → 2열 x 7줄
            (마침 왼쪽 열이 Y 7개, 오른쪽 열이 X 7개로 갈린다)
     출구 — 가장 긴 이름 210px → 3열 x 6줄. 17개라 한 자리가 남는데, 첫 열 마지막을
            비워(null) 둘째 열이 사이드 콘베어 상승부터, 셋째 열이 L/S 상승-하강 짝으로
            줄마다 맞게 했다(사용자 제안).
   열 폭은 글자 길이에 맞춰지고(max-content) 경보 표가 남는 폭을 가져간다(DrivePage.css).
   주소는 줄 끝 주석. */
const LAMP_BOARDS = {
  ent: {
    cols: 2,
    tags: [
      'charge_table_hyd_unit_on_lamp',                // Y0C8 장입 테이블 유압유닛 ON
      'charge_pocket_lift_motor_up_lamp',             // Y0C9 장입포켓 승강모터 상승
      'charge_pocket_lift_motor_down_lamp',           // Y0CA 장입포켓 승강모터 하강
      'charge_side_conveyor_up_lamp',                 // Y198 장입 테이블 사이드 콘베어 상승
      'charge_side_conveyor_down_lamp',               // Y199 장입 테이블 사이드 콘베어 하강
      'charge_side_conveyor_forward_lamp',            // Y0CB 장입 테이블 사이드 콘베어 전진
      'charge_side_conveyor_backward_lamp',           // Y0CC 장입 테이블 사이드 콘베어 후진
      'charge_pocket_up_ls_lamp',                     // X099 장입포켓 상승감지 L/S
      'charge_pocket_down_ls_lamp',                   // X09A 장입포켓 하강감지 L/S
      'charge_side_conveyor_up_ls_lamp',              // X09B 사이드 콘베어 상승감지 L/S
      'charge_side_conveyor_down_ls_lamp',            // X09C 사이드 콘베어 하강감지 L/S
      'charge_side_conveyor_stopper_up_ls_lamp',      // X09D 스토퍼 상승감지 L/S
      'charge_side_conveyor_stopper_down_ls_lamp',    // X09E 스토퍼 하강감지 L/S
      'charge_side_conveyor_stopper_product_ls_lamp', // X09F 스토퍼 제품감지 L/S
    ],
  },
  exit: {
    cols: 3,
    tags: [
      'discharge_table_hyd_unit_on_lamp',             // Y0CF 추출 테이블 유압유닛 ON
      'discharge_pocket1_lift_motor_up_lamp',         // Y0D0 No.1 추출포켓 승강모터 상승
      'discharge_pocket1_lift_motor_down_lamp',       // Y0D1 No.1 추출포켓 승강모터 하강
      'discharge_pocket2_lift_motor_up_lamp',         // Y0D2 No.2 추출포켓 승강모터 상승
      'discharge_pocket2_lift_motor_down_lamp',       // Y0D3 No.2 추출포켓 승강모터 하강
      null,                                           // 빈칸 — 첫 열 마지막을 비워 다음 열부터 상승-하강 짝이 줄마다 맞게 한다
      'discharge_side_conveyor_up_lamp',              // Y19A 추출 테이블 사이드 콘베어 상승
      'discharge_side_conveyor_down_lamp',            // Y19B 추출 테이블 사이드 콘베어 하강
      'discharge_side_conveyor_forward_lamp',         // Y0CD 추출 테이블 사이드 콘베어 전진
      'discharge_side_conveyor_backward_lamp',        // Y0CE 추출 테이블 사이드 콘베어 후진
      'discharge_product_detect_ls_lamp',             // X0B8 출구 제품 감지 L/S
      'discharge_product_arrive_detect_ls_lamp',      // X0B9 출구 제품도착 감지 L/S
      'discharge_side_conveyor_up_ls_lamp',           // X0BA 사이드 콘베어 상승감지 L/S
      'discharge_side_conveyor_down_ls_lamp',         // X0BB 사이드 콘베어 하강감지 L/S
      'discharge_pocket1_up_ls_lamp',                 // X0BC No.1 추출포켓 상승감지 L/S
      'discharge_pocket1_down_ls_lamp',               // X0BD No.1 추출포켓 하강감지 L/S
      'discharge_pocket2_up_ls_lamp',                 // X0BE No.2 추출포켓 상승감지 L/S
      'discharge_pocket2_down_ls_lamp',               // X0BF No.2 추출포켓 하강감지 L/S
    ],
  },
};

/* 회전감지 램프 — 각각 짝이 되는 모터 바로 아래에 붙는다.
   cx는 그 모터가 화면에 실제로 그려지는 가운데 x다(MAIN 쪽 둘은 반전이라
   CSS의 left 값과 다르니 주의):
     ent-motor-4  x 332~356  → 344       main-motor-1 x  494~ 518 → 506
     exit-motor-5 x 1403~1427 → 1415
   (main-motor-1은 DOOR 자리를 지우면서 115px 당겼다 — DrivePage.css)
   C/C TABLE DRIVE / CONVEYOR 회전감지(cc_table_status_lamp)는 그 위 모터(main-motor-2)와
   함께 2026-11-17에 지웠다(사용자 요청).
   글자는 drive.json의 lamp.<태그>. 그 안의 \n 줄바꿈은 DrivePage.css의 .dr-trip-lamp에서
   white-space: pre-line으로 살린다. */
const TRIP_TOP = 410;

/* 세 램프는 점만 바뀐다 — 값이 1이면 빨간 점, 0이면 꺼진 동그라미, 못 읽으면 점선.
   글씨는 값과 상관없이 늘 보인다(2026-11-17 사용자 지정 — 그 전에는 1 초록이었다).
   판정은 아래 tripLampClass.

   바로 위 모터에도 회전감지 이름의 태그가 따로 붙어 있다(driveArtTags.js의 MOTOR_TAGS —
   main_table_drive_conveyor_rotate_detect_lamp 등). 이름이 겹치지만 다른 태그다.
   모터는 그림 색, 여기는 글씨 램프라 따로 움직인다 — 한쪽만 바뀌어도 고장이 아니다. */
const TRIP_LAMPS = [
  { key: 'ent', cx: 344, tag: 'charge_table_status_lamp' },      // 입구 TABLE DRIVE / CONVEYOR 회전감지
  { key: 'main', cx: 506, tag: 'main_table_status_lamp' },       // MAIN TABLE DRIVE / CONVEYOR 회전감지
  { key: 'exit', cx: 1415, tag: 'discharge_table_status_lamp' }, // 출구 TABLE DRIVE / CONVEYOR 회전감지
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
   value를 주면 그 부분만 앞에 빨간 숫자로 붙는다(나머지 text는 검은 글씨).
   글자는 drive.json의 note.<key>, 값 설명은 note.<key>Value. */
const NOTES = [
  // MAIN DRIVE 존(x 494~1124, 아래끝 y 366) 바로 밑 — "####℃ 이하시 설비 [OFF]"
  /* lamp를 주면 글자 뒤에 빨간 램프 칸이 붙는다 — 이 줄의 "OFF"는 설명이 아니라
     설비가 실제로 꺼졌음을 알리는 표시등이다. */
  {
    key: 'tempOff', cx: 809, top: 372, lamp: 'OFF',
    /* 앞의 빨간 숫자를 PLC에서 읽는다. 못 읽으면 '---'로 둔다 — 0으로 그리면
       0℃ 이하에서 끈다는 말이 되어 설정을 잘못 읽는다. */
    valueTag: 'facility_off_temp',
    /* 뒤의 'OFF'는 글씨가 아니라 누르는 버튼이다. 읽는 태그와 쓰는 태그가 같다.
       2초를 채우면 지금 값의 반대가 나가고 그대로 남는다(토글). 떼는 것으로는
       아무 값도 보내지 않는다 — 걸어 두는 자리라 손을 떼면 풀리면 안 된다. */
    lampTag: 'facility_off_temp_toggle_button',
  },
  // ent-motor-4(x 332~356, y 360~401) 오른쪽 옆. 모터 세로 가운데에 맞춘다.
  { key: 'stopper', left: 362, top: 372 },   // STOPPER 하강 감지
  /* DOOR 위에 '입구문 열림'(cx 510, top 142)이 하나 더 있었는데 그 아래 모터
     (ent-motor-3)와 함께 지웠다 — 현장에 없는 설비다. 그 모터가 보던
     charge_door_open_lamp는 화면 어디에서도 쓰지 않는다. 문 그림(ent-door-1)과
     그 색 표시(ent_door_open_close_lamp)도 2026-11-17에 지웠다. */
];

/* ---------------------------------------------------------------------------
   하단 경보 목록 — 경보이력 화면과 같은 API(getAlarmList)를 최근 100건만 받아 쓴다.
   지나가며 훑어보는 자리라 컬럼이 더 적다. 범위 조회는 경보이력 화면 몫이다.

   컬럼이 바뀌면 표를 통째로 다시 만들기 때문에 언어가 바뀔 때만 새로 만든다(매 렌더
   새로 만들면 표가 계속 재생성된다). 컬럼을 더하거나 빼면 useAlarmList의 SHOWN_FIELDS도
   같이 손봐야 한다 — 거기 없는 값은 바뀌어도 화면이 갱신되지 않는다.
   ------------------------------------------------------------------------- */
const alarmColumns = (t) => [
  { title: t('common:alarmCol.occurTime'), field: 'occurTimeStr', width: 145, hozAlign: 'center' },
  { title: t('common:alarmCol.tagName'), field: 'tagName', minWidth: 120, widthGrow: 2, tooltip: true, hozAlign: 'center' },
  // msgShown — 화면 언어의 경보주석(useAlarmList가 붙인다. 영문이 비어 있으면 한글)
  { title: t('common:alarmCol.alarmMsg'), field: 'msgShown', minWidth: 130, widthGrow: 3, tooltip: true, hozAlign: 'center' },
      {
        title: t('common:alarmCol.status'), field: 'alarmStatus', width: 95, hozAlign: 'center',
        /* DB(vw_alarm_history)는 ACTIVE / CLEARED로 주는데 현장에서 읽을 말로 바꿔 보여준다.
           ACTIVE만 빨간 '발생'이고 나머지는 전부 회색 '해제'다 — 지금 값이 둘뿐이지만
           나중에 다른 상태가 늘어도 발생으로 오인하지 않게 ACTIVE만 골라낸다. */
        formatter: (cell) => {
          const on = cell.getValue() === 'ACTIVE';
          return on
            ? `<span class="ht-badge on">${t('common:alarmCol.active')}</span>`
            : `<span class="ht-badge off">${t('common:alarmCol.cleared')}</span>`;
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
  const { t } = useTranslation('drive');
  /* 이 태그들은 이름 자체가 램프다(_cmd_lamp가 아니다). lampClassOf는 명령 이름에
     '_lamp'를 붙여 찾으므로 여기서는 값을 바로 읽는다.

     점등 규칙(2026-11-17 사용자 지정, 입구·출구 공통):
       수동      1 → 노랑 / 0 → 꺼짐      (예전에는 0일 때 초록이었다)
       자동      1 → 초록 / 0 → 꺼짐
       자동운전  1 → 초록 / 0 → 꺼짐
       비상정지  1 → 초록 / 0 → 빨강      (꺼진 상태가 없다 — 아래 stopClass)
     못 읽으면 넷 다 점선이다. */
  const lampClass = (name, onClassName) => {
    if (!values) return ' is-unknown';
    const st = tagState(values[name]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === TAG_ON ? onClassName : '';
  };

  /* 비상정지는 두 갈래 색이다 — 1이 정상(초록), 0이 비상정지 걸림(빨강). */
  const stopClass = (() => {
    if (!values) return ' is-unknown';
    const st = tagState(values[stopTag]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === TAG_ON ? ' is-on' : ' is-alarm';
  })();

  return (
    <div className="hmi-group dr-panel">
      <span className="hmi-group-title">{title}</span>

      <div className="dr-op-row">
        <span className="dr-op-label">{t('op.select')}</span>
        <span
          className={`dr-op-btn dr-op-lamp${lampClass(manualTag, ' is-warn')}`}
          data-tag={manualTag}
          title={t('op.manualTip', { tag: manualTag })}
        >
          {t('op.manual')}
        </span>
        <span
          className={`dr-op-btn dr-op-lamp${lampClass(autoTag, ' is-on')}`}
          data-tag={autoTag}
          title={t('op.autoTip', { tag: autoTag })}
        >
          {t('op.auto')}
        </span>
      </div>

      {/* 자동운전·비상정지도 램프다 — 기동과 정지는 현장 OP 패널에서 하고, 화면은
          지금 어떤 상태인지만 비춘다. 자동운전은 1일 때 초록, 비상정지는 1이면 초록(정상)
          0이면 빨강(걸림)이다. */}
      <div className="dr-op-row">
        <span
          className={`dr-op-btn dr-op-lamp is-wide${lampClass(autoDriveTag, ' is-on')}`}
          data-tag={autoDriveTag}
          title={t('op.autoDriveTip', { tag: autoDriveTag })}
        >
          {t('op.autoDrive')}
        </span>
        <span
          className={`dr-op-btn dr-op-lamp is-wide${stopClass}`}
          data-tag={stopTag}
          title={t('op.estopTip', { tag: stopTag })}
        >
          {t('op.estop')}
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
  const { t } = useTranslation();
  return (
    <div className="dr-vbox" title={tag ? t('hmi.readOnly', { what: hint ?? label, tag }) : undefined}>
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
  const { t } = useTranslation('drive');
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
            {t(`lamp.${lamp.tag}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 하단 램프판 — 입구(ent) 또는 출구(exit) 판 하나.
 *
 * 표의 이름 그대로 점 + 글씨 한 줄씩. cols열 격자에 위에서 아래로 채우고, 칸 사이를
 * 가로·세로 점선으로 나눈다. 점은 1이면 빨강, 0이면 꺼진 회색, 못 읽으면 점선
 * (2026-11-17 사용자 지정 — 그 전에는 1이 초록이었다. 빨강이어도 깜빡이지 않는다, DrivePage.css).
 *
 * @param side 'ent' | 'exit' — LAMP_BOARDS의 키
 */
function LampBoardGroup({ side, values }) {
  const { t } = useTranslation('drive');
  const { cols, tags } = LAMP_BOARDS[side];
  const rows = Math.ceil(tags.length / cols);
  const lampClass = (tag) => {
    if (!values) return ' unknown';
    const st = tagState(values[tag]);
    if (st === TAG_UNKNOWN) return ' unknown';
    return st === TAG_ON ? ' alarm' : '';
  };

  return (
    <div className={`hmi-group dr-panel dr-board is-${side}`}>
      <div
        className="dr-board-grid"
        /* 줄: minmax(0, 1fr) — 판 높이(.dr-bottom 160px)를 줄 수로 나눠 갖는다.
           열: 글자 폭 이상(max-content)이면서 남는 폭은 나눠 갖는다(1fr). 넓은 화면은 판이
           글자 폭만큼이라(.dr-board flex: 0 0 auto) 남는 폭이 없어 전과 같고, 판이 한 줄을
           통째로 쓰는 1700px 이하에서만 열이 판 폭에 고르게 퍼진다 — 왼쪽에 몰려 오른쪽이
           비던 것(2026-11-26 태블릿 지적)을 고친 것이다. */
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(max-content, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {tags.map((tag, i) => {
          /* 점선: 첫 열이 아니면 왼쪽 세로선. 아래 가로선은 같은 열 바로 밑에 램프가 있을
             때만 — 열의 끝이거나 밑이 빈칸(null)이면 긋지 않는다. */
          const left = i >= rows ? ' has-left' : '';
          const bottom = i % rows !== rows - 1 && tags[i + 1] ? ' has-bottom' : '';
          /* null은 줄을 맞추려고 비워 두는 자리다(LAMP_BOARDS 참고) */
          if (!tag) return <span className={`dr-board-cell${left}`} key={`gap-${i}`} />;
          return (
            <span
              className={`hmi-lamp dr-board-cell${lampClass(tag)}${left}${bottom}`}
              key={tag}
              data-tag={tag}
              title={`${t(`lamp.${tag}`)} — ${tag}`}
            >
              <span className="hmi-lamp-dot" />
              {t(`lamp.${tag}`)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** 누르는 버튼이면서 램프인 ON 또는 OFF 하나.
 *
 * 누르고 holdMs를 채우면 <unit>_<action>_cmd에 1, 떼면 0(handleDrivePress/Release).
 * 색은 짝 램프(<cmd>_lamp)가 1일 때 들어온다 — ON은 초록, OFF는 빨강.
 * 누른 것과 실제로 돈 것은 다르므로 색을 화면이 먼저 바꾸지 않는다.
 * disabled를 쓰지 않는다: 누른 뒤 비활성화되면 뗌 이벤트가 오지 않아 비트가 1로 남는다.
 *
 * @param title  툴팁에 들어가는 설비 이름
 * @param unit   태그 이름 앞부분 (charge / maincc / discharge / fan2 / fan3)
 * @param action 'on' | 'off'
 */
function OnOffButton({
  title, unit, action, values, onPress, heldTag, armedTag, holdMs,
}) {
  const { t } = useTranslation('drive');
  const cmd = driveCmd(unit, action);
  return (
    <button
      type="button"
      className={`dr-onoff hmi-lampbox${lampClassOf(values, cmd, action === 'on' ? ' is-on' : ' is-alarm')}`
        + (heldTag === cmd ? ' is-held' : '')
        + (armedTag === cmd ? ' is-armed' : '')}
      onPointerDown={() => onPress(cmd)}
      data-tag={cmd}
      title={t('panel.onoffTip', {
        title, action: action.toUpperCase(), sec: holdMs / 1000, cmd, lamp: lampOf(cmd),
      })}
    >
      {action.toUpperCase()}
      {heldTag === cmd && (
        <span className="dr-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
      )}
    </button>
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
  const { t } = useTranslation('drive');
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

  /* ON/OFF 버튼 — 구동 박스와 쿨링챔버 팬 아래 버튼이 같은 부품(OnOffButton)을 쓴다. */
  const btnProps = {
    title, unit, values, onPress, heldTag, armedTag, holdMs,
  };

  return (
    <div className="hmi-group dr-drive" style={style}>
      <span className="hmi-group-title">{title}</span>

      <div className="dr-drive-row">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <OnOffButton {...btnProps} action="on" />
        <span className="dr-drive-tag">PV</span>
        <LedInput
          value={text(pvTag)}
          readOnly
          color="red"
          size="sm"
          unit="mm/Min"
          title={t('panel.pvTip', { title, tag: pvTag })}
        />
      </div>

      {/* is-sv를 붙여 SV 입력칸만 연두색으로 물들인다(DrivePage.css의 --dr-sv). */}
      <div className="dr-drive-row is-sv">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <OnOffButton {...btnProps} action="off" />
        <span className="dr-drive-tag">SV</span>
        <LedInput
          value={text(svTag)}
          onChange={(v) => onSv(svTag, v)}
          color="red"
          size="sm"
          unit="mm/Min"
          title={t('panel.svTip', { title, tag: svTag })}
          label={t('panel.svLabel', { title })}
          min={svMin}
          max={svMax}
        />
      </div>

      {/* 구동감지 — 글자 칸 자체가 램프다. 조작이 아니라 PLC 상태를 비춘다. */}
      <div className="dr-drive-foot">
        <span className={`dr-detect hmi-lampbox${detectClass}`} title={detectTag}>
          {t('panel.detect')}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   화면
   ------------------------------------------------------------------------- */

export default function DrivePage() {
  const { t, i18n } = useTranslation('drive');
  // 하단 경보 목록의 열 — 언어가 바뀔 때만 새로 만든다(바뀌면 표가 다시 만들어진다)
  const alarmCols = useMemo(() => alarmColumns(t), [t]);
  const stageRef = useRef(null);
  /* 0으로 시작한다 — 아직 재기 전이라는 뜻이고, 그동안은 무대를 숨긴다(아래 visibility).
     1로 두면 배율을 재기 전 한 프레임이 원본 크기로 그려져서, 화면에 들어올 때마다
     그림이 튄다(PC는 작았다가 커지고, 태블릿은 컸다가 작아진다).
     연소·분위기·쿨링 화면과 useStageScale 훅이 전부 같은 방식이다. */
  const [scale, setScale] = useState(0);

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

  /* 하단 경보 목록. 최근 100건을 5초마다 다시 받는다 — 화면을 켜 둔 채로 새 경보가
     떠야 하기 때문이다. 범위 지정이 필요하면 경보이력 화면을 쓴다. */
  const { alarms, error: alarmError } = useAlarmList();


  /* 구동부 속도 설정(SV) — 숫자패드에서 확정한 값을 PLC에 쓴다.
     값 태그와 표시 태그가 같아서, 쓰고 나면 다음 폴링에 그 값이 그대로 돌아온다. */
  const handleDriveSv = (tag, value) => {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return;

    setWriteError('');
    writeTag(DR_FOLDER_ID, tag, num)
      .catch((e) => setWriteError(`${tag} — ${e.message}`));
  };

  /* 이 화면의 PLC 값 — 램프·PV/SV·조작 상태가 전부 여기서 온다.
     조작 버튼을 누른 뒤에도 PLC를 따로 바로 읽지 않는다 — 바뀐 값은 0.9초 폴링으로만
     들어온다(10/30 사용자 결정, foldertagApi의 PLC_POLL_MS). */
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

  /* 레일(mini-rail 468개)은 롤러와 규칙이 같지만 방식이 다르다. 이쪽은 작화가 CSS로
     그린 div라 무대에 클래스를 붙여 DrivePage.css가 움직이게 한다.
     1일 때만 클래스가 붙는다 — 안 붙은 상태가 '멈춤'이다. */
  const railRoll = Object.entries(RAIL_TAGS)
    .filter(([, rail]) => tagState(tagValues?.[rail.tag]) === TAG_ON)
    .map(([key]) => ` ${railRollClass(key)}`)
    .join('');

  /* 모터는 화살표와 같은 방식이다 — 무대에 클래스만 붙이고 색을 바꾸는 일은 CSS가 한다.
     초록 태그가 1이면 아무것도 안 붙고(작화 그대로 초록), 아니면 노랑 태그가 1일 때
     노랑, 그것도 아니면 회색이다. */
  const motorGray = MOTOR_COLOR
    .map(({
      tag, yellowTag, grayClass, yellowClass,
    }) => {
      if (tagState(tagValues?.[tag]) === TAG_ON) return '';
      if (yellowTag && tagState(tagValues?.[yellowTag]) === TAG_ON) return ` ${yellowClass}`;
      return ` ${grayClass}`;
    })
    .join('');

  /* MAIN 존 구획 — 모터·화살표와 같은 방식이다(무대에 클래스만 붙이고 색은
     DrivePage.css가 입힌다). 1일 때만 오렌지가 붙고, 0과 못 읽음은 작화 그대로다. */
  const zoneHot = Object.entries(ZONE_TAGS)
    .filter(([, zone]) => tagState(tagValues?.[zone.tag]) === TAG_ON)
    .map(([cls]) => ` ${zoneHotClass(cls)}`)
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

  /** 회전감지 램프 셋(TRIP_LAMPS) — 점만 바뀌고 글씨는 늘 그대로다.
      1이면 빨간 점(' alarm'), 0이면 꺼진 동그라미(''), 못 읽으면 점선(' unknown').
      위 statusLampClass(1이면 초록)와 켜지는 색이 달라 따로 둔다. */
  const tripLampClass = (tag) => {
    const st = tagState(tagValues?.[tag]);
    if (st === TAG_UNKNOWN) return ' unknown';
    return st === TAG_ON ? ' alarm' : '';
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
     누르고 holdMs를 채우면 1, 떼면 0. PLC가 그 순간을 받아 기동/정지하고
     결과는 램프 태그로 돌아온다. */

  /* 구동부 ON/OFF 버튼을 이만큼 누르고 있어야 명령이 나간다.
     컨베이어가 스치듯 눌린 것으로 돌거나 멈추면 안 되니 시간을 둔다.
     모든 화면의 누름 버튼이 같은 값이다(엔지니어링 화면의 누름 시간, 기본 2초) —
     화면마다 다르면 손이 헷갈린다. CSS 애니메이션 길이도 이 값을 inline style로 받아 간다. */
  const holdMs = useHoldMs();

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

  /* ALARM SWITCH(ALARM RESET / HORN STOP)는 누름 지연 시간 없이 누르는 순간 1이 나간다
     (2026-10-30 — 경보 세 화면 머리줄의 같은 버튼과 같다, AlarmSwitchButtons).
     너무 짧게 톡 치면 PLC가 1을 못 볼 수 있어서 1을 쓴 뒤 이만큼은 지나야 0을 보낸다. */
  const MIN_PULSE_MS = 300;
  const onAtRef = useRef(0);

  const handleDrivePress = (name) => {
    if (heldRef.current) return;   // ON과 OFF를 동시에 누르는 상황은 만들지 않는다
    heldRef.current = name;
    armedRef.current = false;
    setHeldTag(name);
    setArmedTag('');
    setWriteError('');

    holdTimerRef.current = setTimeout(() => {
      armedRef.current = true;
      onAtRef.current = Date.now();
      // 지금부터 이 버튼의 0이 나가야 한다 — 그 전에는 로그인 화면으로 넘어가지 않는다(pressGuard)
      beginPress();
      setArmedTag(name);
      chainRef.current = writeTag(DR_FOLDER_ID, name, 1)
        .catch((e) => setWriteError(`${name} — ${e.message}`));
    }, isAlarmSwitch(name) ? 0 : holdMs);
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
    const wait = Math.max(0, MIN_PULSE_MS - (Date.now() - onAtRef.current));
    chainRef.current = chainRef.current
      .then(() => new Promise((r) => setTimeout(r, wait)))
      .then(() => writeTag(DR_FOLDER_ID, name, 0, false))
      .catch((e) => setWriteError(t('common:hmi.releaseFailed', { name, msg: e.message })))
      .finally(endPress);
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
  /* 시간을 채워 실제로 값이 나갔다는 표시(.is-armed 테두리). 위 ON/OFF의 armedTag와 같은
     것이고, 손을 뗄 때까지만 남는다 — "웹이 보냈다"이지 PLC가 받았다는 뜻은 아니다. */
  const [offBtnArmed, setOffBtnArmed] = useState(false);
  const offBtnHeldRef = useRef(false);
  const offBtnTimerRef = useRef(null);

  const handleOffBtnPress = () => {
    if (offBtnHeldRef.current || offBtnState === TAG_UNKNOWN) return;
    offBtnHeldRef.current = true;
    setOffBtnHeld(true);
    setOffBtnArmed(false);
    setWriteError('');

    /* 보낼 값을 누르는 순간의 값으로 정한다. 2초 사이에 폴링이 값을 바꾸더라도
       작업자가 보고 누른 그 값의 반대가 나가야 한다 — 타이머 안에서 다시 읽으면
       손이 떠난 뒤의 값을 뒤집게 된다. */
    const next = offBtnState === TAG_ON ? 0 : 1;

    offBtnTimerRef.current = setTimeout(() => {
      setOffBtnArmed(true);
      // 바뀐 값은 0.9초 폴링으로 들어온다(PLC를 따로 바로 읽지 않는다)
      writeTag(DR_FOLDER_ID, FACILITY_OFF_BTN_TAG, next)
        .catch((e) => setWriteError(`${FACILITY_OFF_BTN_TAG} — ${e.message}`));
    }, holdMs);
  };

  /* 떼는 것으로는 아무 값도 보내지 않으므로 여기서는 타이머만 거둔다. */
  const handleOffBtnRelease = () => {
    if (!offBtnHeldRef.current) return;
    offBtnHeldRef.current = false;
    setOffBtnHeld(false);
    setOffBtnArmed(false);
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
        {/* MAIN 존 구획이 달궈졌을 때(값 1). 목표색 #ea580c에 위와 같은 공식
            (목표색 x (0.45 + 0.85 x 밝기))을 쓴 값이다. 존 그림은 원본이 이미
            색과 명암을 갖고 있어서 contrast를 앞에 걸지 않는다 — 매쉬 롤러처럼
            밝은 은회색 좁은 범위가 아니라 그럴 필요가 없다. */}
        <filter id="dr-orange" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.16583 0.55786 0.05632 0 0.41294
                    0.06236 0.20979 0.02118 0 0.15529
                    0.00850 0.02861 0.00289 0 0.02118
                    0       0       0       1 0"
          />
        </filter>
        {/* 입구 모터 1·출구 모터 4의 노랑(yellowTag가 1). 목표색 #eab308(OP PANEL 수동 램프와
            같은 노랑)에 위 초록·주황과 같은 공식(목표색 x (0.45 + 0.85 x 밝기))을 쓴 값이다. */}
        <filter id="dr-yellow" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.16583 0.55786 0.05632 0 0.41294
                    0.12685 0.42674 0.04308 0 0.31588
                    0.00567 0.01907 0.00193 0 0.01412
                    0       0       0       1 0"
          />
        </filter>
        {/* 쿨링챔버 판(main-obj-2)을 차가운 푸른색으로 — 작화 원본은 회갈색(베이지) 그라디언트다.
            색이 옅은 그림이라 hue-rotate로는 파랑이 거의 안 나와서, 밝기만 남겨 푸른 축에 싣는다
            (위 초록·주황과 같은 방식). 각 줄 = 고정분 + 밝기 × 배수:
            R 0.15+0.5L, G 0.25+0.6L, B 0.40+0.6L — 밝은 띠는 #9fd1f7 근처, 가운데 어두운 띠는 #6085ab 근처.
            고정분을 두는 이유는 어두운 띠가 검게 꺼지지 않고 '쇠 빛 도는 파랑'으로 남게 하려는 것이다. */}
        <filter id="dr-blue" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.10630 0.35760 0.03610 0 0.15
                    0.12756 0.42912 0.04332 0 0.25
                    0.12756 0.42912 0.04332 0 0.40
                    0       0       0       1 0"
          />
        </filter>
      </svg>

      {/* ===== 상단 조작·상태 패널 ===== */}
      <div className="dr-top">
        {/* 입구 = charge, 출구 = discharge. 폴더 9의 기존 태그(charge_on_cmd 등)와 같은 말이다. */}
        <OpPanel
          title={t('op.entTitle')}
          values={tagValues}
          autoTag="charge_op_auto_lamp"
          manualTag="charge_op_manual_lamp"
          autoDriveTag="charge_op_auto_drive_lamp"
          stopTag="charge_op_emergency_stop_lamp"
        />

        <div className="hmi-group dr-panel dr-alarm-sw">
          <span className="hmi-group-title">ALARM SWITCH</span>
          {/* 경보 세 화면 머리줄의 같은 버튼과 동작이 같다 — 누르는 순간 1, 떼면 0(누름 지연 시간 없음).
              그래서 진행 바도 없다. disabled를 걸지 않는 이유는 다른 momentary 버튼과 같다:
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
              title={t('common:hmi.pressMomentary', { tag: b.tag })}
            >
              {b.text}
            </button>
          ))}
        </div>

        {/* dr-cond — 윗줄에서 글자가 접힐 수 있는 판이라 좁게 시작해 남는 폭을 받는다(DrivePage.css) */}
        <LampList title={t('group.entCond')} lamps={ENT_CONDITIONS} values={tagValues} className="dr-cond" />
        <LampList title={t('group.exitCond')} lamps={EXIT_CONDITIONS} values={tagValues} className="dr-cond" />

        <OpPanel
          title={t('op.exitTitle')}
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
          className={`dr-stage-inner${arrowHideClass}${motorGray}${zoneHot}${railRoll}`}
          style={{
            width: STAGE_W,
            height: STAGE_H + STAGE_PAD_B,
            transform: `scale(${scale})`,
            /* 배율을 재기 전(0) 한 프레임은 숨긴다 — 원본 크기로 번쩍이지 않게.
               다른 작화 화면들과 같은 처리다. */
            visibility: scale ? 'visible' : 'hidden',
          }}
        >
          {/* lang — 언어가 바뀌면 그림 위 툴팁을 새 언어로 다시 그리게 한다(DriveOverview 참고) */}
          <DriveOverview entRolling={entRolling} exitRolling={exitRolling} lang={i18n.language} />

          <div className="dr-overlay">
            {LABELS.map((l) => (
              <span
                className="dr-tag"
                key={l.key}
                style={{ left: l.cx, top: l.top, transform: 'translateX(-50%)' }}
              >
                {t(`label.${l.key}`)}
              </span>
            ))}

            {DRIVE_PANELS.map((p) => (
              <DrivePanel
                key={p.key}
                title={t(`label.${p.key}`)}
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
                holdMs={holdMs}
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
                <ValueBox label="PV" hint={t('common:hmi.zonePv', { n })} value={zoneText(n, 'pv')} tag={zoneTag(n, 'pv')} />

                {/* SV는 설정값이라 눌러서 숫자패드로 넣는다. 글자색은 DrivePage.css의 --dr-sv.
                    표시는 tic_zN_sv(D100, 실제 적용 중인 목표값), 입력은 tic_zN_sv_cmd(R100). */}
                <div className="dr-vbox">
                  <span className="dr-vbox-label">SV</span>
                  <LedInput
                    value={zoneText(n, 'sv')}
                    onChange={(v) => handleZoneSv(n, v)}
                    size="sm"
                    label={t('common:hmi.zoneSv', { n })}
                    title={t('common:hmi.svIo', { show: zoneTag(n, 'sv'), input: zoneTag(n, 'sv_cmd') })}
                    min={ZONE_SV_MIN}
                    max={ZONE_SV_MAX}
                  />
                </div>
              </div>
            ))}

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

            {/* 팬마다 바로 아래 ON/OFF — 구동 박스의 ON/OFF와 같은 부품·같은 누름 규칙이다. */}
            {FANS.map((f) => (
              <div
                className="dr-fan-btns"
                key={f.unit}
                style={{ left: f.left + FAN_SIZE / 2 - FAN_BTN_W / 2, top: FAN_BTN_TOP, width: FAN_BTN_W }}
              >
                {['on', 'off'].map((action) => (
                  <OnOffButton
                    key={action}
                    title={t(`art.${FAN_TAGS[f.key].tag}`)}
                    unit={f.unit}
                    action={action}
                    values={tagValues}
                    onPress={handleDrivePress}
                    heldTag={heldTag}
                    armedTag={armedTag}
                    holdMs={holdMs}
                  />
                ))}
              </div>
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
              title={t('note.endRollerTip', { tag: END_ROLLER.tag })}
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
              title={t('common:hmi.greenAt1', { what: t('note.product'), tag: PRODUCT_LAMP.tag })}
            >
              <span className="hmi-lamp-dot" />
              <em>{t('note.product')}</em>
            </span>

            {/* 회전감지 램프 — 짝이 되는 모터 바로 아래. 그림과 같은 좌표계라
                배율이 바뀌어도 모터와 어긋나지 않는다. */}
            {TRIP_LAMPS.map((l) => (
              <span
                className={`hmi-lamp dr-trip-lamp${tripLampClass(l.tag)}`}
                key={l.key}
                style={{ left: l.cx, top: TRIP_TOP, transform: 'translateX(-50%)' }}
                data-tag={l.tag}
                title={t('rule.tripTip', { what: t(`lamp.${l.tag}`).replace('\n', ' '), tag: l.tag })}
              >
                <span className="hmi-lamp-dot" />
                {t(`lamp.${l.tag}`)}
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
                title={n.valueTag ? t('common:hmi.readOnly', { what: t(`note.${n.key}Value`), tag: n.valueTag }) : undefined}
              >
                {n.valueTag && <span className="dr-note-val">{noteValue(n.valueTag)}</span>}
                {t(`note.${n.key}`)}
                {/* 0이면 빨강, 1이면 초록, 못 읽으면 점선. 점선일 때는 보낼 값을
                    정할 수 없어 눌러도 반응하지 않는다(위 handleOffBtnPress 참고). */}
                {n.lamp && (
                  <button
                    type="button"
                    className={`dr-note-lamp hmi-lampbox${offBtnClass}`
                      + (offBtnHeld ? ' is-held' : '')
                      + (offBtnArmed ? ' is-armed' : '')}
                    onPointerDown={handleOffBtnPress}
                    title={t('note.offBtnTip', { tag: n.lampTag, sec: holdMs / 1000 })}
                  >
                    {n.lamp}
                    {offBtnHeld && (
                      <span className="dr-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
                    )}
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 하단: 입구 램프판 | 경보 목록 | 출구 램프판 =====
          그림처럼 왼쪽이 입구, 오른쪽이 출구가 되게 경보 표를 가운데 끼운다.
          DOM 순서만 바꾼 것이라 CSS는 그대로다 — 넓은 화면은 경보 표 600px 고정에
          램프판이 남는 폭을 나눠 갖고, 1700px 이하는 경보 표가 order: 1로 맨 아래
          한 줄로 내려간다(DrivePage.css). 입구/출구는 key 앞부분(ent/exit)으로 가른다. */}
      <div className="dr-bottom">
        <LampBoardGroup side="ent" values={tagValues} />

        <div className="dr-alarm">
          {alarmError && <div className="dr-alarm-error">{alarmError}</div>}
          <HmiTable data={alarms} columns={alarmCols} options={ALARM_OPTIONS} height="100%" />
        </div>

        <LampBoardGroup side="exit" values={tagValues} />
      </div>

      {/* 쓰기 실패·값 수신 실패 안내. SV를 넣었는데 아무 반응이 없을 때 이유가 보여야 한다. */}
      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
    </div>
  );
}
