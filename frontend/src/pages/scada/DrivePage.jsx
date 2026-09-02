import { useEffect, useRef, useState } from 'react';
import DriveOverview from '../../components/scada/DriveOverview';
import HmiTable from '../../components/scada/HmiTable';
import { LedInput } from '../../components/scada/HmiParts';
import { getAlarmList } from '../../api/scada/alarmHistApi';
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
const DRIVE_PANELS = [
  { key: 'entTable', title: '입구 TABLE DRIVE', left: 350, top: 12 },
  { key: 'mainCc', title: 'MAIN/CC DRIVE', left: 700, top: 12 },
  // 출구 컨베이어(x 1353~1723) 위에 오도록. 폭이 250이라 left는 1473을 넘기면 안 된다.
  { key: 'exitTable', title: '출구 TABLE DRIVE', left: 1050, top: 12 },
];

// MAIN DRIVE 존 — 작화 존 이미지 위에 PV/SV를 그대로 얹는다(존 폭 75.5px 간격).
const ZONE_LEFT = 609;
const ZONE_STEP = 75.5;
const ZONE_W = 75;
const ZONES = [1, 2, 3, 4, 5, 6, 7];

/* DOOR 오른쪽과 COOLING CHAMBER TABLE DRIVE의 PV 칸.
   셋을 한 목록으로 묶어 같은 top을 쓰게 한다 — 따로 두면 높이가 어긋난다.
   266은 DOOR(y 205~365)의 세로 가운데에 칸(높이 약 38px)을 놓은 값이다. */
const PV_TOP = 266;

const PV_BOXES = [
  { key: 'door', left: 529, width: 77 },   // DOOR 이름(x 494~525) 바로 오른쪽
  { key: 'cc1', left: 1150, width: 86 },
  { key: 'cc2', left: 1255, width: 86 },
];

/* ---------------------------------------------------------------------------
   상단 패널
   ------------------------------------------------------------------------- */

// 자동운전 조건 램프 — 순서와 문구는 현장 HMI 화면 그대로.
const ENT_CONDITIONS = [
  '입구 모터 트립조건',
  '입구 자동STEP 초기조건',
  '입구 TABLE DRIVE 구동상태',
  '입구 비상정지 OFF',
];

const EXIT_CONDITIONS = [
  '출구 모터 트립조건',
  '출구 자동STEP 초기조건',
  '출구 TABLE DRIVE 구동상태',
  '출구 SIDE CONVEYOR 하강상태',
  '출구 비상정지 OFF',
];

// 출구 구동부 자동운전 TIME 설정 — 초 단위 설정값 3개.
const EXIT_TIMES = [
  { key: 'align', label: '출구제품 정렬(지연)시간' },
  { key: 'clear', label: '제품 감지 해제TIME' },
  { key: 'sideConv', label: '출구 SIDE CONVEYOR 전진 TIME' },
];

/* ---------------------------------------------------------------------------
   하단 램프판 — 묶음별 램프 목록
   ------------------------------------------------------------------------- */
const LAMP_BOARDS = [
  {
    key: 'entSol',
    lamps: [
      '입구 POCKET\nSOL VALVE UP',
      '입구 POCKET\nSOL VALVE DOWN',
      '입구 SIDE CONVEYOR\nSOL VALVE UP',
      '입구 SIDE CONVEYOR\nSOL VALVE DOWN',
    ],
  },
  {
    key: 'entLs',
    lamps: [
      '입구 POCKET\nUP L/S',
      '입구 POCKET\nDOWN L/S',
      '입구 SIDE CONVEYOR\nUP L/S',
      '입구 SIDE CONVEYOR\nDOWN L/S',
    ],
  },
  {
    key: 'entPx',
    lamps: [
      '입구 SIDE CONVEYOR\nFORWARD P/X',
      '입구 SIDE CONVEYOR\nBACKWARD P/X',
      '입구 DOOR\nOPEN P/X',
      '입구 DOOR\nCLOSE P/X',
    ],
  },
  {
    key: 'entEtc',
    lamps: [
      '입구 제품 투입\n감지 P/X',
      '입구 제품 정렬\nSTOPPER 하강 L/S',
    ],
  },
  {
    key: 'exitSol',
    lamps: [
      '출구 SIDE CONVEYOR\nSOL VALVE UP',
      '출구 SIDE CONVEYOR\nSOL VALVE DOWN',
      '출구 SIDE CONVEYOR\nUP L/S',
      '출구 SIDE CONVEYOR\nDOWN L/S',
    ],
  },
  {
    key: 'exitPx',
    lamps: [
      '출구 SIDE CONVEYOR\nFORWARD P/X',
      '출구 SIDE CONVEYOR\nBACKWARD P/X',
      '출구 제품 속도\n감지 P/H',
      '제품 도착\n감지 L/S',
    ],
  },
  {
    key: 'exitPocket',
    lamps: [
      '출구 POCKET\n제품 감지 P/X',
      '출구 POCKET\n제품 감지 (상)',
      '출구 POCKET\n제품 감지 (중)',
      '출구 POCKET\n제품 감지 (하)',
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

const TRIP_LAMPS = [
  { key: 'ent', cx: 344, text: '입구 TABLE DRIVE\nCONVEYOR 회전감지' },
  { key: 'main', cx: 621, text: 'MAIN TABLE DRIVE\nCONVEYOR 회전감지' },
  { key: 'cc', cx: 1150, text: 'C/C TABLE DRIVE\nCONVEYOR 회전감지' },
  { key: 'exit', cx: 1415, text: '출구 TABLE DRIVE\nCONVEYOR 회전감지' },
];

/* 그림 위에 얹는 짧은 문구들.
   cx를 주면 그 x가 글자의 가운데가 되고, left를 주면 그 x가 왼쪽 끝이 된다.
   value를 주면 그 부분만 앞에 빨간 숫자로 붙는다(나머지 text는 검은 글씨). */
const NOTES = [
  // MAIN DRIVE 존(x 609~1136, 아래끝 y 366) 바로 밑
  { key: 'tempOff', cx: 872, top: 372, value: '####', text: '℃ 이하시 설비 OFF' },
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

/** 조작 선택(수동/자동)과 자동운전/비상정지가 한 벌인 OP PANEL. */
function OpPanel({ title, mode, onMode }) {
  return (
    <div className="hmi-group dr-panel">
      <span className="hmi-group-title">{title}</span>

      <div className="dr-op-row">
        <span className="dr-op-label">조작 선택</span>
        <button
          type="button"
          className={`dr-op-btn${mode === 'manual' ? ' is-on' : ''}`}
          onClick={() => onMode('manual')}
        >
          수동
        </button>
        <button
          type="button"
          className={`dr-op-btn${mode === 'auto' ? ' is-on' : ''}`}
          onClick={() => onMode('auto')}
        >
          자동
        </button>
      </div>

      {/* 실제 기동/정지는 PLC 쓰기라 연동 전까지 눌러도 아무 일도 하지 않는다. */}
      <div className="dr-op-row">
        <button type="button" className="dr-op-btn is-wide" disabled>자동운전</button>
        <button type="button" className="dr-op-btn is-wide is-stop" disabled>비상정지</button>
      </div>
    </div>
  );
}

/**
 * 라벨 아래에 검은 표시창이 붙는 한 칸 — 사진의 PV/SV 칸 모양.
 * 표시 전용이라 입력 부품(LedInput)을 쓰지 않는다. 존·쿨링챔버·DOOR가 같이 쓴다.
 *
 * @param tone 숫자색. 사진을 따라 PV는 red, SV는 green.
 */
function ValueBox({ label, value = '####', tone = 'red' }) {
  return (
    <div className="dr-vbox">
      <span className="dr-vbox-label">{label}</span>
      <em className={`dr-val is-${tone}`}>{value}</em>
    </div>
  );
}

/** PLC 상태를 비추기만 하는 램프 목록. 조작 대상이 아니다. */
function LampList({ title, lamps, className = '' }) {
  return (
    <div className={`hmi-group dr-panel ${className}`}>
      {title && <span className="hmi-group-title">{title}</span>}
      <div className="dr-lamp-list">
        {lamps.map((text) => (
          <span className="hmi-lamp" key={text}>
            <span className="hmi-lamp-dot" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

/** ON/OFF 표시 + PV/SV(mm/Min) + 구동감지 한 벌. 그림 위에 떠 있는 박스. */
function DrivePanel({ title, style, data, onChange }) {
  return (
    <div className="hmi-group dr-drive" style={style}>
      <span className="hmi-group-title">{title}</span>

      <div className="dr-drive-row">
        <span className={`dr-onoff${data.on ? ' is-on' : ''}`}>ON</span>
        <span className="dr-drive-tag">PV</span>
        <LedInput value={data.pv} readOnly color="red" size="sm" unit="mm/Min" title={`${title} PV`} />
      </div>

      {/* is-sv를 붙여 SV 입력칸만 연두색으로 물들인다(DrivePage.css의 --dr-sv). */}
      <div className="dr-drive-row is-sv">
        <span className={`dr-onoff${data.on ? '' : ' is-off'}`}>OFF</span>
        <span className="dr-drive-tag">SV</span>
        <LedInput
          value={data.sv}
          onChange={(v) => onChange('sv', v)}
          color="red"
          size="sm"
          unit="mm/Min"
          label={`${title} 속도 설정`}
          min={0}
          max={9999}
        />
      </div>

      <div className="dr-drive-foot">구동감지 {data.detect}</div>
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

  const [entMode, setEntMode] = useState('manual');
  const [exitMode, setExitMode] = useState('manual');

  const [times, setTimes] = useState({ align: '0', clear: '0', sideConv: '0' });

  const [drives, setDrives] = useState({
    entTable: { on: false, pv: '0', sv: '0', detect: '정상' },
    mainCc: { on: false, pv: '0', sv: '0', detect: '정상' },
    exitTable: { on: false, pv: '0', sv: '0', detect: '정상' },
  });

  const handleDriveChange = (key, field, value) => {
    setDrives((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  /* 존별 SV — 작업자가 넣는 설정값이라 화면에서 바꿀 수 있다(PV는 PLC가 주는 값이라 표시만).
     PLC 연동 전이라 초기값은 0으로 둔다. */
  const [zoneSv, setZoneSv] = useState(() => ZONES.map(() => '0'));

  const handleZoneSv = (idx, value) => {
    setZoneSv((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  return (
    <div className="dr-page">
      {/* ===== 상단 조작·상태 패널 ===== */}
      <div className="dr-top">
        <OpPanel title="입구 OP PANEL" mode={entMode} onMode={setEntMode} />

        <div className="hmi-group dr-panel dr-alarm-sw">
          <span className="hmi-group-title">ALARM SWITCH</span>
          <button type="button" className="dr-op-btn is-wide" disabled>ALARM RESET</button>
          <button type="button" className="dr-op-btn is-wide" disabled>HORN STOP</button>
        </div>

        <LampList title="입구 자동운전 조건" lamps={ENT_CONDITIONS} />
        <LampList title="출구 자동운전 조건" lamps={EXIT_CONDITIONS} />

        <div className="hmi-group dr-panel dr-time">
          <span className="hmi-group-title">출구 구동부 자동운전 TIME 설정</span>
          {EXIT_TIMES.map((t) => (
            <div className="dr-time-row" key={t.key}>
              <span className="dr-time-label">{t.label}</span>
              {/* 색은 DrivePage.css의 .dr-time 규칙이 --dr-sv(존 SV와 같은 연두)로 덮는다. */}
              <LedInput
                value={times[t.key]}
                onChange={(v) => setTimes((prev) => ({ ...prev, [t.key]: v }))}
                size="sm"
                unit="SEC"
                label={t.label}
                min={0}
                max={9999}
              />
            </div>
          ))}
        </div>

        <OpPanel title="출구 OP PANEL" mode={exitMode} onMode={setExitMode} />
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
          className="dr-stage-inner"
          style={{
            width: STAGE_W,
            height: STAGE_H + STAGE_PAD_B,
            transform: `scale(${scale})`,
          }}
        >
          <DriveOverview />

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
                style={{ left: p.left, top: p.top }}
                data={drives[p.key]}
                onChange={(field, v) => handleDriveChange(p.key, field, v)}
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
                <ValueBox label="PV" />

                {/* SV는 설정값이라 눌러서 숫자패드로 넣는다. 글자색은 DrivePage.css의 --dr-sv. */}
                <div className="dr-vbox">
                  <span className="dr-vbox-label">SV</span>
                  <LedInput
                    value={zoneSv[n - 1]}
                    onChange={(v) => handleZoneSv(n - 1, v)}
                    size="sm"
                    label={`${n}ZONE 속도 설정`}
                    min={0}
                    max={9999}
                  />
                </div>
              </div>
            ))}

            {/* DOOR 이름 — 작화 문짝 폭이 31px뿐이라 글자를 세로로 세운다 */}
            <div className="dr-door" style={{ left: 494, top: 205 }}>
              <span className="dr-door-text">DOOR</span>
            </div>

            {/* DOOR 오른쪽 + 쿨링챔버 PV — 셋 다 같은 높이(PV_TOP) */}
            {PV_BOXES.map((p) => (
              <div
                className="dr-zone"
                key={p.key}
                style={{ left: p.left, top: PV_TOP, width: p.width }}
              >
                <ValueBox label="PV" />
              </div>
            ))}

            {/* 회전감지 램프 — 짝이 되는 모터 바로 아래. 그림과 같은 좌표계라
                배율이 바뀌어도 모터와 어긋나지 않는다. */}
            {TRIP_LAMPS.map((l) => (
              <span
                className="hmi-lamp dr-trip-lamp"
                key={l.key}
                style={{ left: l.cx, top: TRIP_TOP, transform: 'translateX(-50%)' }}
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
              >
                {n.value && <span className="dr-note-val">{n.value}</span>}
                {n.text}
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
          <LampList key={b.key} lamps={b.lamps} className="dr-board" />
        ))}
      </div>
    </div>
  );
}
