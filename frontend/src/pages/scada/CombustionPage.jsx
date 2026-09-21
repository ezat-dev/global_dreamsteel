import { useEffect, useRef, useState } from 'react';
import CombustionOverview from '../../components/scada/CombustionOverview';
import HmiTable from '../../components/scada/HmiTable';
import { LedInput } from '../../components/scada/HmiParts';
import ZoneBurnerModal from '../../components/scada/ZoneBurnerModal';
import { useStageStretch } from '../../components/scada/useStageScale';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { getAlarmList } from '../../api/scada/alarmHistApi';
import { lampClassOf, lampOf, tagState, writeTag, TAG_OFF, TAG_ON, TAG_UNKNOWN } from '../../api/scada/foldertagApi';
import { FITTING_TAGS, fittingRedClass } from '../../components/scada/combustionArtTags';
// 작화 도구가 뽑아준 설비 그림 스타일. 우리 CSS보다 먼저 깐다.
import './combustionOverview.css';
import './CombustionPage.css';

/* ===========================================================================
   연소화면

   설비 그림은 작화 원본(CombustionOverview + combustionOverview.css)을 그대로 쓰고,
   그 위에 개도·존 PV/SV·조작판을 얹는다.

   원본이 2101x532px 고정 크기다. 가로가 약 4:1로 길어 구동화면처럼 가로 기준으로
   배율을 잡는다. 얹는 것들도 같이 줄어들어야 하므로 스케일 안쪽에 두고, 위치는 전부
   그림 좌표계(2101x532) 기준 px로 적는다.

   값은 아직 전부 더미다. PLC 연동 때 state 자리만 폴링 결과로 바꾸면 된다.
   =========================================================================== */

/* 작화 그림 자체는 1155x469다.
   무대를 1400으로 더 넓게 잡는 이유는, 사진에서 연소 BLOWER·버너 쿨링 패널이
   그림 오른쪽 "바깥"에 놓이기 때문이다. 그 자리(1155~1400)를 미리 비워 둔다.

   ※ 크기를 잴 때 주의 — 이 작화는 rotate(-180deg) + transform-origin: 0 0 인 조각이
     많다. 그러면 left/top의 왼쪽·위쪽으로 그려져서, left+width로 폭을 재면 실제보다
     훨씬 크게 나온다(처음에 2101로 잘못 쟀다). 네 꼭짓점을 변환해서 재야 한다. */
const DRAW_W = 1279;   // 그림이 실제로 그려지는 폭 (0 ~ 1279)
const STAGE_W = 1285;  // 얹는 것이 전부 그림 안에 들어와서 그림 폭 그대로 쓴다

/* 그림 아래끝. 작화 조각 대부분이 transform-origin: 0 0 에 rotate(-180deg)라
   CSS의 top이 아래쪽 끝이고 실제 자리는 top-height ~ top 이다. 그래서 top만 봐도
   (469), top+height로 봐도(532) 둘 다 틀리고, 회전을 반영해 재면 475다.
   짧게 잡으면 아래가 잘리고, 길게 잡으면 그만큼 아래에 빈 띠가 생긴다. */
const STAGE_H = 475;

/* 예전에는 y가 음수인 조각(pipe135) 때문에 그림 전체를 39px 내려야 했다.
   지금 작화 CSS에는 음수 top이 하나도 없어서(최소 0) 내릴 필요가 없다 —
   0이 아니면 그만큼 위쪽에 빈 띠가 생기고 그림은 그만큼 눌린다. */
const DRAW_SHIFT = 0;

// 무대는 그림만 담는다(개별연소 판은 무대 밖 .cb-zonebar).
const STAGE_TOTAL_H = DRAW_SHIFT + STAGE_H;

/* ---------------------------------------------------------------------------
   존 좌표 — 작화 CSS에서 확인한 실제 값

     상단 개도 for-N-zone-per : 중심 x 199 + (N-1)*147,  y  92~121
     하단 개도 rev-N-zone-per : 중심 x 267 + (i)*147,    y 466~496
     존 박스   zon-box        : x 120~1155, y 191~369
     MAIN GAS  main-gas       : x   0~ 378, y   0~ 93
     압력계    gas-pre        : x 258~ 289, y   8~ 39
     솔밸브    gas-sol        : x 310~ 354, y   9~ 38
     오른쪽 배관 끝           : x 2101 (여기에 연소 BLOWER 패널이 붙는다)

   ※ 하단 개도는 작화 이름이 역순이다(rev-1이 맨 오른쪽). 화면에는 사진대로
     왼쪽부터 1존으로 표시한다. 개도는 위아래가 같은 값(tic_zN_mv)이라 이 역순이
     문제되지 않는다 — 어느 쪽에 어느 존을 넣든 보이는 값이 같기 때문이다.
     나중에 위아래가 다른 값을 쓰는 것이 생기면 그때는 순서를 확인해야 한다.
   ------------------------------------------------------------------------- */
const ZONES = [1, 2, 3, 4, 5, 6, 7];

/* 이 화면의 PLC 태그가 든 폴더 — ez_scada.folders.id.
   DB에 만든 행의 id와 반드시 같아야 한다. 틀리면 오류가 아니라 값이 안 오는
   형태로 조용히 실패하니(태그 0개 응답), 값이 전부 '모름'으로 나오면 여기를 먼저 본다. */
const CB_FOLDER_ID = 7;

/* 조작 버튼을 이만큼 누르고 있어야 실제로 명령이 나간다.
   설비 명령이라 스치듯 눌린 것으로 밸브가 움직이면 안 된다 — 이 시간을 채우는 동안
   버튼에 진행 바가 차고, 그 전에 떼면 아무것도 보내지 않는다.
   CSS 애니메이션 길이도 이 값을 inline style로 받아 간다(두 곳에 적어 두면 어긋난다). */
const HOLD_MS = 2000;

const TOP_CX0 = 199;   // 상단 1존 중심
/* 하단 개도 박스도 상단과 같은 x에 있다(199, 346, … 1081).
   전에 267로 잡혀 있던 건 잘못 잰 값이다 — rev-* 조각은 transform-origin: 0 0 에
   rotate(-180deg)가 걸려 있어서, CSS의 left(1115)가 오른쪽 끝이고 실제 가운데는
   left - width/2 (1081)다. 그래서 글씨가 박스 오른쪽으로 68px(=박스 폭) 밀려 있었다. */
const BOT_CX0 = TOP_CX0;
const ZONE_STEP = 147;

const topCx = (n) => TOP_CX0 + (n - 1) * ZONE_STEP;
const botCx = (n) => BOT_CX0 + (n - 1) * ZONE_STEP;

const PER_TOP = 96;    // 상단 개도 글씨 top (박스 y 91~121 안쪽)
const PER_BOT = 442;   // 하단 개도 글씨 top (박스 y 437~467 안쪽 — 회전 반영 후 실제 자리)

// 존 박스(y 191~369) 안에서 이름표·PV·SV가 놓이는 높이
const ZONE_TITLE_TOP = 215;
const ZONE_PV_TOP = 258;
const ZONE_SV_TOP = 302;
const ZONE_BOX_W = 128;   // 존 하나가 쓰는 폭(간격 147보다 좁게 잡아 여백을 둔다)

/* 존 설정온도(SV) 허용 범위(℃) — 7개 존이 모두 같다.
   숫자패드가 이 범위를 벗어난 값은 확정하지 못하게 막는다. */
const ZONE_SV_MIN = 0;
const ZONE_SV_MAX = 1000;

/* (존 이름표·개별연소 판의 좌표 상수가 여기 있었는데, 그 판들이 무대 밖 .cb-zonebar로
   빠지면서 쓰이지 않게 되어 지웠다. 지금 위치는 CombustionPage.css의 .cb-zonebar가 잡는다.) */

/* 상단·우측 설비 패널. plate는 제목 띠, state는 그 아래 두 글자가 놓이는 자리다.

   onCmd/offCmd가 있으면 두 칸이 조작 버튼이 되고(누르면 그 태그에 1), 램프는
   명령 이름 + '_lamp'를 읽는다. 없으면 예전처럼 표시 전용 램프로 남는다 —
   태그가 준비된 설비만 하나씩 살릴 수 있게 이렇게 갈라 두었다. */
const DEVICE_PANELS = [
  {
    key: 'mainGas', tone: 'gas', title: 'MAIN GAS',
    plate: { left: 25, top: 2, width: 190 },
    // 제목판(25~215) 아래 가운데에 오도록. left를 키우면 오른쪽으로 쏠린다.
    state: { left: 15, top: 40, width: 210 },
    on: 'OPEN', off: 'CLOSE',
    /* OPEN/CLOSE 램프가 따로 있다 — 두 칸이 서로를 보고 그리지 않고 각자 1일 때 켜진다.
       둘 다 0이면 둘 다 꺼진 채로 둔다(동작 중이거나 어느 쪽도 아닌 상태). */
    onCmd: 'main_gas_open_cmd',   // M320 / 램프 M620 — 1이면 초록
    offCmd: 'main_gas_close_cmd', // M321 / 램프 M621 — 1이면 빨강
  },
  /* 연소 BLOWER는 작화가 깔아둔 파란 패널 바탕(main-blower2, x 1038~1279 / y 0~64)
     위에 그대로 얹는다. main-blower1.png는 블로워 그림이 아니라 이 패널의 배경이다. */
  {
    key: 'blower', tone: 'blue', title: '연소 BLOWER',
    plate: { left: 1052, top: 3, width: 214 },
    state: { left: 1052, top: 36, width: 214 },
    on: 'ON', off: 'OFF',
    /* MAIN GAS와 같은 구조 — ON/OFF 램프가 따로 있고 각자 1일 때 켜진다.
       이름이 cb_z1_b1_on_cmd(버너 "연소 ON")와 헷갈리지 않게 blower_로 뒀다. */
    onCmd: 'blower_on_cmd',   // M310 / 램프 M610 — 1이면 초록
    offCmd: 'blower_off_cmd', // M311 / 램프 M611 — 1이면 빨강
  },
  /* 버너 쿨링은 바탕이 없어서 CSS로 그린다. 사진처럼 연소 BLOWER 아래에 두되,
     7존 개도(for-7-zone-per, x 1047~1115 / y 91~120)를 가리지 않게 오른쪽으로 민다. */
  {
    key: 'burnerCool', tone: 'blue', title: '버너 쿨링',
    /* 폭은 제목판과 상태판이 같아야 한다 — 다르면 아래 판이 삐져나온다.

       오른쪽 끝이 무대 폭(STAGE_W 1285)을 넘으면 안 된다. .cb-stage가 overflow: hidden
       이라 넘는 만큼 그냥 잘린다. 바깥 폭 = width + 좌우 여백 9*2 + 테두리 2 = width+20
       이므로, left 1145 + 118 + 20 = 1283으로 2px 남기고 맞췄다.

       왼쪽 한계는 1132다 — 그보다 왼쪽에는 7존 개도 상자(for-7-zone-box, x 1045~1117)와
       작은 조각들(obj21 x 1113~1132)이 있어서 가린다. 판을 더 넓히려면 무대를 넓히는
       수밖에 없는데, 그러면 그림 전체가 그만큼 작아진다. */
    plate: { left: 1145, top: 78, width: 118 },
    state: { left: 1145, top: 100, width: 118 },
    on: 'ON', off: 'OFF', stacked: true,
    /* 위 둘과 OFF 램프 규칙이 다르다 — 여기는 존 연소 ON/OFF와 같은 쪽이다.
       ON은 1이면 초록, OFF는 0이면 빨강(즉 '지금 꺼져 있다'를 빨강으로 알린다).
       MAIN GAS·연소 BLOWER의 CLOSE/OFF는 반대로 1일 때 켜진다. 같은 화면에서 갈리는
       것이라, 램프가 거꾸로 보이면 이 offLitWhen부터 본다. */
    onCmd: 'burner_cooling_on_cmd',   // M300(임시) / 램프 burner_cooling_on_cmd_lamp
    offCmd: 'burner_cooling_off_cmd', // M300(임시) / 램프 burner_cooling_off_cmd_lamp
    offLitWhen: TAG_OFF,
  },
];

/* 배관 부속 아래에 붙는 상태 램프. cx는 그 부속이 그려지는 가운데 x다.

   이 셋은 켜지고 꺼지는 램프가 아니라 늘 초록 아니면 빨강이다. greenWhen이 초록이 되는
   값이고 나머지 값이 빨강이다 — 셋이 서로 다르다. 값을 못 읽으면 점선(모름)이다.

   압력 정상만 0에서 초록인 것이 눈에 거슬리지만 PLC가 그렇게 준다. 거꾸로 보이면
   여기 greenWhen부터 확인할 것. */
const PIPE_LABELS = [
  { key: 'gasPre', cx: 273, top: 44, text: '압력 정상', tag: 'main_gas_pressure_normal_lamp', greenWhen: TAG_OFF },
  { key: 'gasSol', cx: 332, top: 44, text: 'SOL닫힘', tag: 'main_gas_sol_close_lamp', greenWhen: TAG_ON },
  // 블로워 압력계(blower-pre, x 920~957 / y 4~43) 바로 아래
  { key: 'blowPre', cx: 938, top: 48, text: '압력 이상', tag: 'combustion_blower_pressure_abnormal_lamp', greenWhen: TAG_ON },
];

/* 좌측 하단 경보 목록 — 경보이력·구동화면과 같은 API(getAlarmList)를 그대로 쓴다.
   좁은 칸이라 컬럼을 줄였다. 컬럼이 바뀌면 표를 통째로 다시 만들기 때문에
   모듈 상수로 둔다(매 렌더 새 배열을 넘기면 표가 계속 재생성된다). */
const ALARM_COLUMNS = [
  /* 최소 폭 합이 판 폭보다 크면 가로 스크롤이 생긴다. 태블릿에서 이 판은 430px까지
     좁아지므로 합을 397px(145+80+100+72)로 맞춰 둔다.

     발생시각만 145를 지킨다 — 'yyyy-MM-dd HH:mm:ss' 19자가 들어가야 해서 더 줄이면
     글자가 잘린다. 나머지 셋을 줄였다.

     데스크톱(560px)에서는 남는 폭을 widthGrow가 2:3으로 나눠 가지므로 보이는 폭이
     예전과 거의 같다(태그이름 144→145, 경보주석 181→198). 최소값만 낮춘 것이라
     넓은 화면의 모양은 건드리지 않는다. */
  { title: '발생시각', field: 'occurTimeStr', width: 145, hozAlign: 'center' },
  { title: '태그이름', field: 'tagName', minWidth: 80, widthGrow: 2, tooltip: true, hozAlign: 'center' },
  { title: '경보주석', field: 'alarmMsg', minWidth: 100, widthGrow: 3, tooltip: true, hozAlign: 'center' },
  {
    // 배지('발생'/'해제')만 들어가는 칸이라 72px이면 충분하다
    title: '경보상태', field: 'alarmStatus', width: 72, hozAlign: 'center',
    // DB(vw_alarm_history)는 ACTIVE / CLEARED로 준다. ACTIVE만 빨간 '발생'이다.
    formatter: (cell) => (cell.getValue() === 'ACTIVE'
      ? '<span class="ht-badge on">발생</span>'
      : '<span class="ht-badge off">해제</span>'),
  },
];

/* 낮은 칸이라 페이지 넘김 줄이 자리를 너무 먹는다. 대신 세로 스크롤로 본다. */
const ALARM_OPTIONS = { pagination: false };

/* 존 전체의 연소 ON/OFF 명령 — ez_scada.folders_tags.name과 반드시 같아야 한다.
   개별 버너가 cb_z1_b1_on_cmd(1존 1번 버너)라, 존 전체는 버너 번호 자리에 burn을 넣어
   cb_z1_burn_on_cmd로 구분한다(M361~M374 / 램프 M661~M674).
   램프 이름은 여기에 '_lamp'를 붙인 것이고, 그 규칙은 foldertagApi의 lampOf가 갖고 있다. */
const zoneBurnCmd = (zone, action) => `cb_z${zone}_burn_${action}_cmd`;

/* 존 연소 두 칸. 서로를 보고 그리지 않고 각자 자기 램프 값만 본다.

   켜지는 값이 둘이 다르다 — ON은 1일 때 초록, OFF는 0일 때 빨강이다(PLC가 그렇게 준다).
   MAIN GAS CLOSE와 같은 경우로, lampClassOf의 litWhen이 이걸 위해 있다.
   그래서 연소 중이면 ON=1(초록) / OFF=1(회색)이고, 정지 중이면 ON=0(회색) / OFF=0(빨강)이다.
   값을 못 읽으면 둘 다 점선(is-unknown)으로 '모름'을 표시한다. */
const ZONE_BURN_BUTTONS = [
  { action: 'on', text: '연소\nON', lit: ' is-on' },
  { action: 'off', text: '연소\nOFF', lit: ' is-alarm', litWhen: TAG_OFF },
];

/* 화면 맨 아래 조작판 — 실화/버너 경보와 퍼지.

   칸이 세 종류다.
     kind: 'btn'  RESET — 누르는 버튼. 색은 값과 무관하게 늘 노랑이다(.cb-action-btn).
     cmd          램프이면서 버튼(ALL PURGE의 ON). 색은 _cmd_lamp가 정한다.
     tag          누를 수 없는 표시 램프. 값이 1이면 lit 색, 0이면 회색, 못 읽으면 점선.

   lit이 칸마다 다르다 — 퍼지 단계는 준비(빨강) → 중(노랑) → 완료(초록)로 넘어간다. */
const ACTION_PANELS = [
  {
    key: 'misfire',
    title: '실화 ALARM',
    items: [
      { text: '실화', tag: 'misfire_alarm_misfire_lamp', lit: ' is-alarm' },
      { text: 'RESET', kind: 'btn', cmd: 'misfire_alarm_reset_cmd' },
    ],
  },
  {
    key: 'burner',
    title: 'BURNER ALARM',
    items: [
      { text: '이상', tag: 'burner_alarm_abnormal_lamp', lit: ' is-alarm' },
      { text: 'RESET', kind: 'btn', cmd: 'burner_alarm_reset_cmd' },
    ],
  },
  {
    key: 'purge',
    title: 'ALL PURGE',
    items: [
      { text: 'ON', cmd: 'all_purge_on_cmd' },
      { text: 'PURGE 준비', tag: 'all_purge_ready_lamp', lit: ' is-alarm' },
      { text: 'PURGE 중', tag: 'all_purge_doing_lamp', lit: ' is-warn' },
      { text: 'PURGE 완료', tag: 'all_purge_complete_lamp', lit: ' is-on' },
    ],
  },
];

export default function CombustionPage() {
  /* 가로 기준으로 잡아 좌우 여백을 없앤다. 그림만 담으면 1285x508(약 2.5:1)이라
     1080 화면에서 아래 판들까지 세로가 맞는다. */
  /* 가로·세로를 각각 칸에 맞춘다 — 좌우 여백 없이 꽉 채우는 대신 그림이 조금 늘어난다.
     비율을 지키면(useStageScale) 아래 판들(.cb-zonebar 104 + .cb-bottom 96)이 세로를
     먼저 가져가는 만큼 그림이 작아지고 좌우가 비게 된다. */
  const [stageRef, scale] = useStageStretch(STAGE_W, STAGE_TOTAL_H);

  /* PLC 상태·설정값. 지금은 사진과 같은 더미다(존 연소 ON/OFF는 태그가 붙어서 빠졌다). */
  const [devices] = useState({ mainGas: false, blower: false, burnerCool: false });

  /* 개별연소 모달을 띄운 존 번호. null이면 닫힘.
     존마다 창을 따로 두지 않고 번호만 바꿔 끼운다 — 내용이 존 번호로만 갈린다. */
  const [burnerZone, setBurnerZone] = useState(null);

  /* PLC 태그 값 — 이 화면이 한 번만 폴링해서 모달까지 같이 쓴다.
     모달이 따로 폴링하면 창을 열 때마다 요청이 하나 더 붙는다. */
  const { values: tagValues, error: tagValueError } = useFolderTagValues(CB_FOLDER_ID);

  /* 위쪽 배관 부속 넷 — 값이 1이면 작화 그대로, 0이거나 못 읽으면 빨강.
     구동화면 화살표·모터와 같은 방식이다: 작화는 memo로 묶인 고정 그림이라 값을 넘기지
     않고, 무대에 클래스만 붙여서 실제로 색을 바꾸는 일은 CombustionPage.css가 맡는다.

     tagValues 아래에 두어야 한다 — 위에 두면 선언 전에 읽어서(TDZ) 렌더가 통째로 죽는다. */
  const fittingRedClasses = Object.entries(FITTING_TAGS)
    .filter(([, t]) => tagState(tagValues?.[t.tag]) !== TAG_ON)
    .map(([cls]) => ` ${fittingRedClass(cls)}`)
    .join('');

  const [writeError, setWriteError] = useState('');
  // 지금 누르고 있는 태그 — 진행 바를 그리는 데 쓴다(비활성화에는 쓰지 않는다)
  const [heldTag, setHeldTag] = useState('');
  // 누름 시간을 채워서 실제로 1이 나간 태그
  const [armedTag, setArmedTag] = useState('');

  /* 누름 상태를 ref로도 들고 있는다. window 이벤트 핸들러가 state를 보면 첫 렌더의
     값에 갇히고, 뗌을 놓치면 비트가 1로 남는다. */
  const heldRef = useRef(null);
  const armedRef = useRef(false);
  const holdTimerRef = useRef(null);
  /* 쓰기 순서를 지키기 위한 사슬. 1과 0을 각각 따로 보내면 0이 먼저 도착해서
     비트가 1로 남을 수 있다 — 1이 끝난 뒤에 0을 보낸다. */
  const chainRef = useRef(Promise.resolve());

  /** 명령 태그의 램프 상태 → 클래스. 켜졌을 때 무슨 색인지, 몇일 때 켜지는지는 부르는 쪽이 정한다. */
  const lampClass = (cmdName, onClassName, litWhen) =>
    lampClassOf(tagValues, cmdName, onClassName, litWhen);

  /** 배관 부속 아래 램프 — 이름 자체가 상태값이라(_cmd가 없다) 값을 바로 읽는다.
      늘 초록 아니면 빨강이고, 못 읽을 때만 점선이다. */
  const pipeClass = (l) => {
    const st = tagState(tagValues?.[l.tag]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === l.greenWhen ? ' is-on' : ' is-alarm';
  };

  /** 하단 조작판의 표시 램프 — 1이면 그 칸의 lit 색, 0이면 회색, 못 읽으면 점선. */
  const actionLampClass = (it) => {
    const st = tagState(tagValues?.[it.tag]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === TAG_ON ? it.lit : '';
  };

  /* 누르는 순간에는 아무것도 보내지 않는다 — HOLD_MS를 채워야 1이 나간다.
     그 뒤로는 싸이몬의 Bit_Momentary와 같다(떼면 0). */
  const handlePress = (name) => {
    if (heldRef.current) return;   // 두 개를 동시에 누르는 상황은 만들지 않는다
    heldRef.current = name;
    armedRef.current = false;
    setHeldTag(name);
    setArmedTag('');
    setWriteError('');

    holdTimerRef.current = setTimeout(() => {
      armedRef.current = true;
      setArmedTag(name);
      chainRef.current = writeTag(CB_FOLDER_ID, name, 1)
        .catch((e) => setWriteError(`${name} — ${e.message}`));
    }, HOLD_MS);
  };

  const handleRelease = () => {
    const name = heldRef.current;
    if (!name) return;
    heldRef.current = null;
    setHeldTag('');
    setArmedTag('');

    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;

    // 누름 시간을 못 채웠으면 1을 보낸 적이 없으니 0도 보낼 필요가 없다
    if (!armedRef.current) return;
    armedRef.current = false;

    /* 1이 실패했어도 0은 보낸다 — 나갔는지 안 나갔는지 모르는 상태로 두는 것보다
       확실히 내리는 쪽이 안전하다.
       log=false: 이 0은 사람이 한 조작이 아니라 누름의 자동 해제다. 기록하면
       버튼 한 번에 로그가 두 줄씩 쌓여서 "누가 무엇을 눌렀나"가 안 보인다. */
    chainRef.current = chainRef.current
      .then(() => writeTag(CB_FOLDER_ID, name, 0, false))
      .catch((e) => setWriteError(`${name} 해제 실패 — ${e.message}`));
  };

  /* 뗌을 버튼이 아니라 window에서 받는다.
     손가락이 버튼 밖으로 나가서 떼도, 창이 포커스를 잃어도(탭 전환·알림창·화면보호기)
     반드시 0이 나가게 하려는 것이다. 버튼의 onPointerUp만 믿으면 그런 경우에 비트가
     1로 남는다 — 설비 명령에서는 그게 사고다.
     핸들러가 ref와 setState만 건드려서 렌더마다 새로 걸 필요가 없다. */
  useEffect(() => {
    const release = () => handleRelease();
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

  /* 존 PV/SV — 온도제어·구동화면과 같은 PLC 주소를 본다(D101/D100/R100).
     세 화면이 같은 값을 보므로 한 곳에서 SV를 바꾸면 나머지에도 1초 안에 반영된다.
     값을 못 받았으면 0이 아니라 '---'로 둔다 — 읽지 못한 온도를 0으로 그리면
     노가 식은 것으로 오해한다. */
  const zoneTag = (n, suffix) => `tic_z${n}_${suffix}`;

  const zoneText = (n, suffix) => {
    const v = tagValues?.[zoneTag(n, suffix)];
    return v == null || v === '' ? '---' : String(v);
  };

  /* 표시는 tic_zN_sv(D100, 실제 적용 중인 목표값), 입력은 tic_zN_sv_cmd(R100).
     램프 프로그램이 돌면 930을 넣어도 표시는 850→880→910으로 따라 올라간다. */
  const handleZoneSv = (n, value) => {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return;

    setWriteError('');
    writeTag(CB_FOLDER_ID, `tic_z${n}_sv_cmd`, num)
      .catch((e) => setWriteError(`tic_z${n}_sv_cmd — ${e.message}`));
  };

  /* 좌측 하단 경보 목록. 조회 조건 없이 전부 받는다 — 범위 지정은 경보이력 화면 몫이다.
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

  return (
    /* hmi-dark — 어두운 배경·유리 판은 scada.css의 공용 규칙이 맡는다.
       작화(노란 가스관·흰 공기관·불꽃)는 배경이 비어 있어 그대로 얹힌다. */
    <div className="cb-page hmi-dark">
      {/* 배관 부속을 빨갛게 만드는 색 행렬. CSS의 filter: url(#cb-red)가 이걸 부른다.

          기성 필터로는 안 된다 — grayscale·sepia 따위에는 '빨강으로'가 없고, hue-rotate로
          맞추면 원래 색(주황·파랑·은색)마다 다른 색이 나온다. 그래서 밝기(luminance)만
          남기고 그 밝기를 빨강 한 축에 싣는다. 어떤 색에서 출발하든 같은 빨강이 되고
          명암이 남아서, 빨개져도 밸브·송풍기 모양으로 보인다.

          가로줄이 결과의 R·G·B·A다. R줄은 밝기 계수(0.2126/0.7152/0.0722)에 1.4를 곱해
          조금 밝은 빨강으로 띄우고, G·B줄은 같은 계수의 0.25배만 남겨 붉은 기를 준다.
          A줄은 그대로 둔다 — 투명한 곳이 검게 채워지면 그림이 상자가 된다.
          (예: 가스 배관의 주황 #ffb300 → 약 #ff2d2d) */}
      <svg className="cb-filter-defs" aria-hidden="true">
        <filter id="cb-red" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.29764 1.00128 0.10108 0 0
                    0.05315 0.17880 0.01805 0 0
                    0.05315 0.17880 0.01805 0 0
                    0       0       0       1 0"
          />
        </filter>
      </svg>

      {/* 줄인 뒤의 실제 높이만큼만 자리를 차지하게 한다 */}
      {/* 높이를 인라인으로 못박지 않는다 — 남는 세로를 그대로 차지해야 그 크기를 재서
          배율을 낼 수 있다(높이를 배율로 정하면 서로를 참조해 0에서 못 벗어난다). */}
      <div className="cb-stage" ref={stageRef}>
        <div
          className={`cb-stage-inner${fittingRedClasses}`}
          style={{
            width: STAGE_W,
            height: STAGE_TOTAL_H,
            transform: `scale(${scale.x}, ${scale.y})`,
            visibility: scale.x ? 'visible' : 'hidden',
          }}
        >
          {/* 그림과 오버레이를 함께 내려서 y가 음수인 조각(pipe135)이 안 잘리게 한다.
              이 안쪽은 좌표가 작화 원본 기준 그대로다. */}
          <div className="cb-shift" style={{ top: DRAW_SHIFT }}>
            <CombustionOverview />

          <div className="cb-overlay">
            {/* ── 설비 제목판 + 상태 두 글자 ── */}
            {DEVICE_PANELS.map((d) => (
              <span className="cb-dev" key={d.key}>
                <em className={`cb-plate cb-plate--${d.tone}`} style={d.plate}>{d.title}</em>

                {/* 두 칸 다 램프다. 걸린 쪽만 켜진다 — on쪽은 초록, off쪽은 빨강.
                    명령 태그가 있는 설비는 그 램프가 버튼도 겸한다(모양은 같다). */}
                <em className={`cb-onoff${d.stacked ? ' is-stacked' : ''}`} style={d.state}>
                  {d.onCmd ? (
                    <>
                      {/* HOLD_MS만큼 누르면 1, 떼면 0. 뗌은 window가 받는다.
                          disabled를 걸지 않는 이유: 비활성 요소는 뗌 이벤트를 못 받아서
                          비트가 1로 남는다. */}
                      <button
                        type="button"
                        className={`hmi-lampbox${lampClass(d.onCmd, ' is-on', d.onLitWhen)}`
                          + (heldTag === d.onCmd ? ' is-held' : '')
                          + (armedTag === d.onCmd ? ' is-armed' : '')}
                        onPointerDown={() => handlePress(d.onCmd)}
                        data-tag={d.onCmd}
                        title={`${d.onCmd} / 램프 ${lampOf(d.onCmd)} — ${HOLD_MS / 1000}초 누르면 전송`}
                      >
                        {d.on}
                        {heldTag === d.onCmd && (
                          <span className="cb-hold-bar" style={{ animationDuration: `${HOLD_MS}ms` }} />
                        )}
                      </button>
                      <button
                        type="button"
                        className={`hmi-lampbox${lampClass(d.offCmd, ' is-alarm', d.offLitWhen)}`
                          + (heldTag === d.offCmd ? ' is-held' : '')
                          + (armedTag === d.offCmd ? ' is-armed' : '')}
                        onPointerDown={() => handlePress(d.offCmd)}
                        data-tag={d.offCmd}
                        title={`${d.offCmd} / 램프 ${lampOf(d.offCmd)} — ${HOLD_MS / 1000}초 누르면 전송`}
                      >
                        {d.off}
                        {heldTag === d.offCmd && (
                          <span className="cb-hold-bar" style={{ animationDuration: `${HOLD_MS}ms` }} />
                        )}
                      </button>
                    </>
                  ) : (
                    /* 아직 태그가 없는 설비(연소 BLOWER·버너 쿨링) — 더미값 표시 전용 */
                    <>
                      <b className={`hmi-lampbox${devices[d.key] ? ' is-on' : ''}`}>{d.on}</b>
                      <b className={`hmi-lampbox${devices[d.key] ? '' : ' is-alarm'}`}>{d.off}</b>
                    </>
                  )}
                </em>
              </span>
            ))}

            {PIPE_LABELS.map((l) => (
              <span
                className={`cb-pipe-label hmi-lampbox${pipeClass(l)}`}
                key={l.key}
                style={{ left: l.cx, top: l.top, transform: 'translateX(-50%)' }}
                data-tag={l.tag}
                title={`${l.text} — 읽기 전용 / ${l.tag} — 값이 ${l.greenWhen === TAG_ON ? 1 : 0}이면 초록, 아니면 빨강`}
              >
                {l.text}
              </span>
            ))}

            {/* ── 개도 % — 작화가 그려둔 박스 위에 글씨만 얹는다.
                온도제어의 출력(MV)과 같은 값이다(tic_zN_mv, D102/D122/…/D222).
                존마다 위·아래 두 곳에 같은 값을 보여준다 — 실제로 같은 태그다.

                덕분에 작화 이름이 역순인 문제(rev-1이 맨 오른쪽)를 신경 쓰지 않아도 된다.
                위아래가 같은 값이라 어느 쪽에 어느 존을 넣든 결과가 같기 때문이다. */}
            {ZONES.map((n) => (
              <span
                className="cb-per"
                key={`top${n}`}
                style={{ left: topCx(n), top: PER_TOP }}
                data-tag={zoneTag(n, 'mv')}
                title={`${n}ZONE 개도(MV) — 읽기 전용 / ${zoneTag(n, 'mv')}`}
              >
                {zoneText(n, 'mv')} %
              </span>
            ))}
            {ZONES.map((n) => (
              <span
                className="cb-per"
                key={`bot${n}`}
                style={{ left: botCx(n), top: PER_BOT }}
                data-tag={zoneTag(n, 'mv')}
                title={`${n}ZONE 개도(MV) — 읽기 전용 / ${zoneTag(n, 'mv')}`}
              >
                {zoneText(n, 'mv')} %
              </span>
            ))}

            {/* ── 존 이름표 + PV/SV ── */}
            {ZONES.map((n) => (
              <span
                className="cb-zone-title"
                key={`zt${n}`}
                style={{ left: topCx(n), top: ZONE_TITLE_TOP, width: ZONE_BOX_W }}
              >
                {`${n}ZONE`}
              </span>
            ))}
            {ZONES.map((n) => (
              <span
                className="cb-val-row"
                key={`pv${n}`}
                style={{ left: topCx(n), top: ZONE_PV_TOP, width: ZONE_BOX_W }}
              >
                <b>PV</b>
                {/* 단위는 박스 밖에 — 아래 SV(LedInput)가 단위를 밖에 그려서 높이를 맞춘다 */}
                <em
                  className="cb-val is-pv"
                  data-tag={zoneTag(n, 'pv')}
                  title={`${n}ZONE 현재온도(PV) — 읽기 전용 / ${zoneTag(n, 'pv')}`}
                >
                  {zoneText(n, 'pv')}
                </em>
                <em className="cb-unit">℃</em>
              </span>
            ))}
            {ZONES.map((n) => (
              <span
                className="cb-val-row"
                key={`sv${n}`}
                style={{ left: topCx(n), top: ZONE_SV_TOP, width: ZONE_BOX_W }}
              >
                <b>SV</b>
                {/* 눌러서 숫자패드로 넣는다. 파란 박스 모양은 CombustionPage.css가 덮어쓴다. */}
                <LedInput
                  value={zoneText(n, 'sv')}
                  onChange={(v) => handleZoneSv(n, v)}
                  size="sm"
                  unit="℃"
                  label={`${n}ZONE 설정온도`}
                  title={`표시 tic_z${n}_sv / 입력 tic_z${n}_sv_cmd`}
                  min={ZONE_SV_MIN}
                  max={ZONE_SV_MAX}
                />
              </span>
            ))}

          </div>
          </div>
        </div>
      </div>

      {/* ===== 존 이름표 + 개별연소 판 =====
          무대 밖에 둔다. 안에 넣으면 무대가 세로로 길어져(1285x650) 배율이 높이에 묶이고
          좌우에 여백이 생긴다. 그림만 두면 1285x508이라 폭이 꽉 찬다.
          폭을 "줄인 그림과 똑같이" 잡아서, 존 위치를 %로 주면 그림과 정확히 맞는다. */}
      <div className="cb-zonebar">
        {ZONES.map((n) => (
          /* 존 기둥(topCx)에 맞춘다. botCx는 하단 개도 박스 좌표라 68px 오른쪽으로 치우쳐 있다. */
          <div
            className="cb-burn"
            key={`burn${n}`}
            style={{ left: `${(topCx(n) / STAGE_W) * 100}%`, width: ZONE_STEP * scale.x * 0.94 }}
          >
            <span className="cb-plate cb-plate--zone">{`NO.${n}ZONE`}</span>
            {/* 사진처럼 "연소"와 "ON/OFF"를 두 줄로 — 칸이 좁아 한 줄로는 안 들어간다
                (.hmi-lampbox에 white-space: pre-line이 걸려 있어 \n이 줄바꿈이 된다).

                본판의 MAIN GAS OPEN/CLOSE와 같은 모멘터리 버튼이다 — HOLD_MS만큼
                누르면 1이 나가고 떼면 0이 나간다(뗌은 window가 받는다). 색은 누른 것과
                무관하게 PLC 램프가 정한다. disabled를 걸지 않는 이유는 위와 같다:
                비활성 요소는 뗌 이벤트를 못 받아서 비트가 1로 남는다. */}
            <span className="cb-onoff">
              {ZONE_BURN_BUTTONS.map((b) => {
                const cmd = zoneBurnCmd(n, b.action);
                return (
                  <button
                    type="button"
                    key={cmd}
                    className={`hmi-lampbox${lampClass(cmd, b.lit, b.litWhen)}`
                      + (heldTag === cmd ? ' is-held' : '')
                      + (armedTag === cmd ? ' is-armed' : '')}
                    onPointerDown={() => handlePress(cmd)}
                    data-tag={cmd}
                    title={`${cmd} / 램프 ${lampOf(cmd)} — ${HOLD_MS / 1000}초 누르면 전송`}
                  >
                    {b.text}
                    {heldTag === cmd && (
                      <span className="cb-hold-bar" style={{ animationDuration: `${HOLD_MS}ms` }} />
                    )}
                  </button>
                );
              })}
            </span>
            {/* 이름표지만 누르면 그 존의 버너 4개 운전창이 열린다 */}
            <button
              type="button"
              className="cb-plate cb-plate--zone cb-plate--btn"
              onClick={() => setBurnerZone(n)}
            >
              {`${n}ZONE 개별연소`}
            </button>
          </div>
        ))}
      </div>

      {/* ===== 무대 밖 — 경보 목록과 조작판 (글씨가 배율에 안 눌리도록 밖에 둔다) ===== */}
      <div className="cb-bottom">
        <div className="cb-alarm">
          {alarmError && <div className="cb-alarm-error">{alarmError}</div>}
          <HmiTable data={alarms} columns={ALARM_COLUMNS} options={ALARM_OPTIONS} height="100%" />
        </div>

        {ACTION_PANELS.map((p) => (
          /* key별 클래스를 같이 준다 — 항목이 4개인 ALL PURGE만 좁은 화면에서
             2×2로 접어야 해서 CSS가 그 판을 집어낼 수 있어야 한다. */
          <div className={`cb-action cb-action--${p.key}`} key={p.key}>
            <span className="cb-plate cb-plate--action">{p.title}</span>
            <div className="cb-action-row">
              {p.items.map((it) => {
                {/* RESET — 다른 momentary 버튼과 같다(2초 누르면 1, 떼면 0).
                    다른 점은 색이 값을 따르지 않고 늘 노랑이라는 것뿐이다. 눌렀는지는
                    누름 표시(is-held)와 진행 바로만 알린다. */}
                if (it.kind === 'btn') {
                  return (
                    <button
                      type="button"
                      key={it.text}
                      className={'cb-action-btn'
                        + (heldTag === it.cmd ? ' is-held' : '')
                        + (armedTag === it.cmd ? ' is-armed' : '')}
                      onPointerDown={() => handlePress(it.cmd)}
                      data-tag={it.cmd}
                      title={`${it.cmd} / 램프 ${lampOf(it.cmd)} — ${HOLD_MS / 1000}초 누르면 전송 (색은 늘 노랑)`}
                    >
                      {it.text}
                      {heldTag === it.cmd && (
                        <span className="cb-hold-bar" style={{ animationDuration: `${HOLD_MS}ms` }} />
                      )}
                    </button>
                  );
                }

                /* 명령 태그가 붙은 칸(ALL PURGE의 ON)은 램프이면서 버튼이다.
                   본판 OPEN/CLOSE와 같은 모멘터리다: HOLD_MS만큼 누르면 1, 떼면 0.
                   색은 누른 것과 무관하게 램프(_cmd_lamp)가 정한다.
                   disabled를 걸지 않는 이유도 같다 — 비활성 요소는 뗌 이벤트를 못 받아서
                   비트가 1로 남는다. */
                if (it.cmd) {
                  return (
                    <button
                      type="button"
                      key={it.text}
                      className={`cb-action-lamp hmi-lampbox${lampClass(it.cmd, ' is-on')}`
                        + (heldTag === it.cmd ? ' is-held' : '')
                        + (armedTag === it.cmd ? ' is-armed' : '')}
                      onPointerDown={() => handlePress(it.cmd)}
                      data-tag={it.cmd}
                      title={`${it.cmd} / 램프 ${lampOf(it.cmd)} — ${HOLD_MS / 1000}초 누르면 전송`}
                    >
                      {it.text}
                      {heldTag === it.cmd && (
                        <span className="cb-hold-bar" style={{ animationDuration: `${HOLD_MS}ms` }} />
                      )}
                    </button>
                  );
                }

                /* 나머지는 눌리는 것이 아니라 상태 표시라 button이 아닌 span이다. */
                return (
                  <span
                    className={`cb-action-lamp hmi-lampbox${actionLampClass(it)}`}
                    key={it.text}
                    data-tag={it.tag}
                    title={`${it.text} — 읽기 전용 / ${it.tag} — 1이면 켜짐`}
                  >
                    {it.text}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {burnerZone !== null && (
        <ZoneBurnerModal
          zone={burnerZone}
          values={tagValues}
          onPress={handlePress}
          heldTag={heldTag}
          armedTag={armedTag}
          holdMs={HOLD_MS}
          onClose={() => setBurnerZone(null)}
        />
      )}

      {/* 쓰기 실패·값 수신 실패 안내. 화면 아래에 떠서 작화를 가리지 않는다 —
          버튼을 눌렀는데 아무 반응이 없을 때 이유를 알 수 있어야 한다. */}
      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
    </div>
  );
}
