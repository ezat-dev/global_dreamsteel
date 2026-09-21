import { Fragment, useEffect, useRef, useState } from 'react';
import AtmosphereOverview from '../../components/scada/AtmosphereOverview';
import AtmosConditionPanel from '../../components/scada/AtmosConditionPanel';
import AtmosValvePanel from '../../components/scada/AtmosValvePanel';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import {
  lampClassOf, lampOf, tagState, writeTag, TAG_OFF, TAG_ON, TAG_UNKNOWN,
} from '../../api/scada/foldertagApi';
import {
  BEACON, FITTING_TAGS, fittingOffClass, fittingOnClass,
} from '../../components/scada/atmosphereArtTags';
// 작화 도구가 뽑아준 설비 그림 스타일. 우리 CSS보다 먼저 깐다.
import './atmosphereOverview.css';
import './AtmospherePage.css';

/* ===========================================================================
   분위기제어

   설비 그림(블로워·가스 배관·컨트롤 밸브·발생기·로)은 작화 원본을 그대로 쓰고,
   그 위에 밸브 조작판과 자동모드 조건판을 얹는다.

   원본이 1801x742px 고정 크기라 화면에 맞춰 transform: scale로 줄인다. 얹는 판들도
   같이 줄어들어야 하므로 스케일 안쪽에 두고, 위치는 그림 좌표계(1801x742) 기준 px로 적는다.
   =========================================================================== */

const STAGE_W = 1801;
const STAGE_H = 742;

/* 그림 위에 얹는 판의 자리 — 여기 숫자만 고치면 옮겨진다.

   설비 조각이 실제로 그려지는 자리(작화 CSS에서 확인한 값):
     블로워      x    1~ 260, y  18~111     가스        x    0~ 202, y 178~271
     컨트롤밸브  x  626~ 676, y 118~161     주배관      x  656~1418, y 129~150
     발생기      x 1490~1680, y  80~194     로(furnace) x  924~1801, y 600~742
     내림관      x 1284~1332 / 1413~1461, y 461~573
   비어 있는 곳은 x 60~900 / y 280~740(왼쪽 아래)와 x 700~1250 / y 180~590(가운데)다. */
const SLOTS = {
  valve: { left: 690, top: 198, width: 440 },
  /* 조건판은 height를 주면 그만큼 커지고, 남는 높이를 조건 7줄이 고르게 나눠 갖는다
     (AtmospherePage.css의 .at-cond / .at-cond-row 참고). 빼면 내용 높이만큼만 된다. */
  cond: { left: 40, top: 460, width: 420, height: 275 },
};

/* 설비 위에 얹는 제목판과 OPEN/CLOSE 칸.
   plate는 제목 띠, state는 그 아래 OPEN/CLOSE 두 글자가 놓이는 자리다.
   tone은 사진의 색 — 블로워는 회색, 가스는 주황, 발생기는 남보라.

   onCmd/offCmd가 있으면 두 칸이 조작 버튼이 되고, 램프는 명령 이름 + '_lamp'를 읽는다.
   없으면 표시 전용 램프로 남는다 — 태그가 준비된 설비만 하나씩 살릴 수 있게 갈라 두었다.
   두 태그는 한 쌍으로 움직인다: OPEN을 누르면 open=1 / close=0 이 같이 나간다.

   태그 이름의 add_는 ADDTION(첨가)이다. 이 화면엔 GAS OPEN/CLOSE가 두 벌
   있어서(왼쪽 위 ADDTION GAS, 오른쪽 발생기) 그냥 gas_로 두면 구분이 안 된다.
   작화에 BLOWE로 적혀 있지만 조건 문구가 ADDTION AIR BLOWER라서 태그는 air로 간다. */
const DEVICE_PANELS = [
  {
    key: 'blower', tone: 'blower', title: 'ADDTION BLOWE',
    plate: { left: 4, top: 8, width: 220 },
    state: { left: 16, top: 70, width: 170 },
    onCmd: 'add_air_open_cmd',    // M324 / 램프 M624 — 1이면 초록
    offCmd: 'add_air_close_cmd',  // M325 / 램프 M625 — 1이면 빨강
  },
  {
    key: 'gas', tone: 'gas', title: 'ADDTION GAS',
    plate: { left: 4, top: 168, width: 178 },
    state: { left: 16, top: 228, width: 170 },
    onCmd: 'add_gas_open_cmd',    // M322 / 램프 M622
    offCmd: 'add_gas_close_cmd',  // M323 / 램프 M623
  },
  {
    /* 발생기는 램프 태그만 있고 명령 태그가 없어서 누를 수 없는 표시 전용이다.
       누르는 버튼으로 만들려면 gen_gas_open_cmd / gen_gas_close_cmd가 필요하고,
       그러면 위 둘처럼 onCmd/offCmd로 옮기면 된다.

       두 칸의 규칙이 서로 다르다 — OPEN은 0일 때 초록, CLOSE는 1일 때 빨강이다. */
    key: 'gen', tone: 'gen', title: '발 생 기',
    plate: { left: 1500, top: 100, width: 172 },
    state: { left: 1495, top: 158, width: 182 },
    openTag: 'generator_open_lamp',
    closeTag: 'generator_close_lamp',
  },
];

/* 압력계·솔밸브 아래에 붙는 상태 글씨. cx는 그 부품이 그려지는 가운데 x다.
     blowe-pre x 328~405 → 366    blowe-sol x 454~533 → 494
     gas-pre   x 232~300 → 266    gas-sol   x 368~446 → 407 */
/* 넷 다 켜지고 꺼지는 램프가 아니라 늘 빨강 아니면 초록이다 — 0이면 빨강, 1이면 초록.
   값을 못 읽으면 점선(모름)이다. */
const PIPE_LABELS = [
  { key: 'bPre', cx: 368, top: 82, text: '압력 이상', tag: 'add_blowe_pressure_abnormal_lamp' },
  { key: 'bSol', cx: 495, top: 82, text: 'SOL닫힘', tag: 'add_blowe_sol_close_lamp' },
  { key: 'gPre', cx: 266, top: 244, text: '압력 이상', tag: 'add_gas_pressure_abnormal_lamp' },
  { key: 'gSol', cx: 407, top: 244, text: 'SOL닫힘', tag: 'add_gas_sol_close_lamp' },
];

/* 로(obj-4, y 600~742)로 내려가는 관 끝에 붙는 이름판.
   사진처럼 초록 화살표 두 개의 정중앙에 오게 한다 —
     down-1 x 1284~1332 → 중심 1308,  down-2 x 1413~1461 → 중심 1437
     둘의 가운데 = 1372 이므로 left = 1372 - 폭/2.
   세로는 화살표 아래끝(573)과 로 윗변(600) 사이에 걸치도록 잡았다. */
const FURNACE_PLATE = { left: 1277, top: 592, width: 190, text: '로내 투입' };

// 로 위에 얹는 O2 센서 표시부
const O2_PANEL = { left: 940, top: 620, titleWidth: 135, valueWidth: 100 };

/* 이 화면의 PLC 태그가 든 폴더 — ez_scada.folders.id (폴더 이름 '분위기제어').
   DB에 만든 행의 id와 반드시 같아야 한다. 틀리면 오류가 아니라 태그 0개 응답으로
   조용히 실패하니, 값이 '---'로 나오면 여기를 먼저 본다. */
const AT_FOLDER_ID = 10;

/* 조작 버튼을 이만큼 누르고 있어야 실제로 명령이 나간다(다른 화면과 같은 2초).
   설비 명령이라 스치듯 눌린 것으로 밸브가 움직이면 안 된다 — 채우는 동안 버튼에
   진행 바가 차고, 그 전에 떼면 아무것도 보내지 않는다.
   CSS 애니메이션 길이도 이 값을 inline style로 받아 간다(두 곳에 적으면 어긋난다). */
const AT_HOLD_MS = 2000;

/* 자동모드 전환 조건 — 순서와 문구는 현장 HMI 화면 그대로.

   일곱 줄 다 늘 초록 아니면 빨강이다(켜지고 꺼지는 램프가 아니다).
   greenWhen이 초록이 되는 값이고 나머지 값이 빨강, 못 읽으면 점선이다.

   대부분 1에서 초록인데 GAS PRESSURE 정상과 발생기 GAS OPEN 둘만 0에서 초록이다.
   바로 위 AIR PRESSURE 정상은 1에서 초록이라 나란히 놓고 보면 거꾸로처럼 보이는데,
   PLC가 그렇게 준다. 램프가 반대로 보이면 여기 greenWhen부터 확인할 것. */
const CONDITIONS = [
  { key: 'blower', label: 'ADDTION AIR BLOWER ON', tag: 'add_air_blower_on_lamp', greenWhen: TAG_ON },
  { key: 'airSol', label: 'ADDTION AIR SOL VLAVE ON', tag: 'add_air_sol_valve_lamp', greenWhen: TAG_ON },
  { key: 'airPress', label: 'ADDTION AIR PRESSURE 정상', tag: 'add_air_pressure_normal_lamp', greenWhen: TAG_ON },
  { key: 'gasSol', label: 'ADDTION GAS SOL VLAVE ON', tag: 'add_gas_sol_valve_on_lamp', greenWhen: TAG_ON },
  { key: 'gasPress', label: 'ADDTION GAS PRESSURE 정상', tag: 'add_gas_pressure_normal_lamp', greenWhen: TAG_OFF },
  { key: 'refTemp', label: '허용 기준온도 도달', tag: 'allow_temp_reach_lamp', greenWhen: TAG_ON },
  { key: 'genGas', label: '발생기 GAS OPEN', tag: 'generator_gas_open_lamp', greenWhen: TAG_OFF },
];

export default function AtmospherePage() {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      setScale(Math.min(width / STAGE_W, height / STAGE_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* PLC 태그 값. 지금 붙어 있는 것은 O2 SENSOR(o2_pv, D241) 하나뿐이고,
     나머지 칸(조건 램프·밸브 패널)은 아직 더미다. */
  const { values: tagValues, error: tagValueError } = useFolderTagValues(AT_FOLDER_ID);

  /** 압력계·솔밸브 아래 램프 — 이름 자체가 상태값이라(_cmd가 없다) 값을 바로 읽는다.
      늘 초록 아니면 빨강이고, 못 읽을 때만 점선이다. */
  const pipeClass = (l) => {
    const st = tagState(tagValues?.[l.tag]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === TAG_ON ? ' is-on' : ' is-alarm';
  };

  /* 왼쪽 위 배관 부속 다섯 — 값이 1이면 초록, 0이거나 못 읽으면 회색.
     구동화면 화살표·모터와 같은 방식이다: 작화는 memo로 묶인 고정 그림이라 값을 넘기지
     않고, 무대에 클래스만 붙여서 실제로 색을 바꾸는 일은 AtmospherePage.css가 맡는다.

     켜짐·꺼짐 둘 다 클래스를 붙인다 — 둘 다 filter가 필요해서다(꺼짐은 회색으로 만들고
     켜짐은 초록으로 물들인다). 한쪽만 붙이면 0일 때 가스 밸브의 주황이 그대로 남는다.

     tagValues 아래에 두어야 한다 — 위에 두면 선언 전에 읽어서(TDZ) 렌더가 통째로 죽는다. */
  const fittingClasses = Object.entries(FITTING_TAGS)
    .map(([cls, t]) => (tagState(tagValues?.[t.tag]) === TAG_ON
      ? ` ${fittingOnClass(cls)}`
      : ` ${fittingOffClass(cls)}`))
    .join('');

  /* 값을 못 받았으면 0이 아니라 '---'로 보여준다 — 읽지 못한 값을 0으로 그리면
     실제로 0인 것과 구분되지 않는다. */
  const o2Text = (() => {
    const v = tagValues?.o2_pv;
    return v == null || v === '' ? '---' : String(v);
  })();

  /* 자동모드 동작 조건 일곱 줄 — 줄마다 초록이 되는 값이 다르다(greenWhen). */
  const conditions = CONDITIONS.map((c) => {
    const st = tagState(tagValues?.[c.tag]);
    const lamp = st === TAG_UNKNOWN ? ' unknown' : (st === c.greenWhen ? ' on' : ' alarm');
    return { ...c, lamp };
  });

  /** 발생기 OPEN/CLOSE — 명령 태그가 없는 표시 램프라 값을 바로 읽는다.
      켜지는 값이 두 칸에서 다르다(OPEN은 0, CLOSE는 1). 못 읽으면 점선. */
  const genLampClass = (tag, litWhen, onClassName) => {
    const st = tagState(tagValues?.[tag]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === litWhen ? onClassName : '';
  };

  /* 발생기 위 경광등 — 0이면 초록(정상), 1이면 그림 그대로 빨강, 못 읽으면 회색.
     밸브·모터와 달리 1일 때 아무것도 안 건다 — 원래 빨간 경광등이라 그게 맞다. */
  const beaconState = tagState(tagValues?.[BEACON.tag]);
  const beaconClass = beaconState === TAG_OFF
    ? ' beacon-green'
    : (beaconState === TAG_UNKNOWN ? ' beacon-gray' : '');

  /* ── ADDTION 블로워·가스 OPEN/CLOSE ───────────────────────────────────
     모멘터리가 아니다. AT_HOLD_MS를 채우면 누른 쪽 태그에 1, 반대쪽 태그에 0을 주고
     그대로 남는다(래치). 떼는 것은 아무 값도 보내지 않는다 — 손을 떼면 밸브가 원래대로
     돌아가 버리면 안 되니까. OPEN과 CLOSE는 서로 반대라 둘이 동시에 1이 될 수 없다.

     개별연소 모달의 버너 버튼(누르는 동안만 1)과는 다른 방식이다. 그쪽은 PLC가 0을
     되돌려 주지만, 여기는 화면이 두 태그를 직접 맞춰 줘야 한다. */

  const [writeError, setWriteError] = useState('');

  // 지금 누르고 있는 태그 — 진행 바를 그리는 데만 쓴다(버튼을 비활성화하지 않는다)
  const [heldTag, setHeldTag] = useState('');
  // 누름 시간을 채워서 실제로 값이 나간 태그 — 테두리(.is-armed)를 그리는 데 쓴다
  const [armedTag, setArmedTag] = useState('');

  /* 누름 상태를 ref로도 들고 있는다. window 이벤트 핸들러가 state를 보면 첫 렌더의
     값에 갇혀서 타이머를 못 지운다. */
  const heldRef = useRef(null);
  const holdTimerRef = useRef(null);

  /* 누름 시간을 채웠을 때 실제로 나가는 쓰기.
     반대쪽을 먼저 0으로 내리고 그 다음 누른 쪽을 1로 올린다. 순서가 중요하다 —
     1을 먼저 보내면 그 사이 OPEN과 CLOSE가 같이 1인 순간이 생기고, PLC가 그 순간을
     읽으면 열라는 명령과 닫으라는 명령을 동시에 받는다.

     0도 로그를 남긴다. 모멘터리 버튼의 0은 누름이 끝나서 자동으로 내려가는 것이라
     기록하지 않지만, 여기 0은 사람이 누른 결과로 PLC에 실제로 쓴 값이다.
     scada_log는 태그 값이 언제 무엇으로 바뀌었는지를 보는 곳이라 빠지면 안 된다. */
  const sendPair = (selfCmd, otherCmd) => writeTag(AT_FOLDER_ID, otherCmd, 0)
    .then(() => writeTag(AT_FOLDER_ID, selfCmd, 1))
    .catch((e) => setWriteError(`${selfCmd} — ${e.message}`));

  const handlePress = (selfCmd, otherCmd) => {
    if (heldRef.current) return;   // OPEN과 CLOSE를 동시에 누르는 상황은 만들지 않는다
    heldRef.current = selfCmd;
    setHeldTag(selfCmd);
    setArmedTag('');
    setWriteError('');

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      setArmedTag(selfCmd);
      sendPair(selfCmd, otherCmd);
    }, AT_HOLD_MS);
  };

  /* 뗌은 값을 보내지 않는다. 시간을 채우기 전에 뗐을 때 예약된 쓰기를 취소하는 것이
     전부다(그래서 이름이 cancel이다). 채운 뒤에 떼면 이미 나갔으므로 할 일이 없다. */
  const handleRelease = () => {
    if (!heldRef.current) return;
    heldRef.current = null;
    setHeldTag('');
    setArmedTag('');

    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  };

  /* 뗌을 버튼이 아니라 window에서 받는다.
     손가락이 버튼 밖으로 나가서 떼도, 창이 포커스를 잃어도(탭 전환·알림창) 진행 바가
     계속 차 있다가 명령이 나가 버리면 안 된다. 버튼의 onPointerUp만 믿으면 그런
     경우에 취소가 안 된다.
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
      release();   // 화면을 떠날 때 예약된 쓰기가 있으면 취소한다
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ADDTION CONTROL MOTOR VALVE — 자동/수동 두 칸만 명령 태그(add_valve_*_cmd)이고
     나머지는 여기 있는 값 태그다. 쓰는 칸도 읽는 태그와 같은 이름을 쓴다
     (온도제어의 SV처럼 표시용·입력용이 갈리지 않는다). */
  const VALVE_TAGS = {
    pv: 'add_control_motor_valve_pv',
    sv: 'add_control_motor_valve_sv',
    mv: 'add_control_motor_valve_mv',
    p: 'add_control_motor_valve_p',
    i: 'add_control_motor_valve_i',
    d: 'add_control_motor_valve_d',
    refTemp: 'add_control_motor_allow_temp',
    manualMv: 'add_control_motor_valve_manual_mv',
  };
  const VALVE_LAMP = 'add_control_motor_allow_temp_lamp';

  /* 값을 못 받았으면 0이 아니라 '---'다 — 읽지 못한 설정값을 0으로 그리면
     실제로 0인 것과 구분되지 않는다. */
  const valveText = (field) => {
    const v = tagValues?.[VALVE_TAGS[field]];
    return v == null || v === '' ? '---' : String(v);
  };

  const refTempState = tagState(tagValues?.[VALVE_LAMP]);
  const valve = {
    pv: valveText('pv'),
    sv: valveText('sv'),
    mv: valveText('mv'),
    p: valveText('p'),
    i: valveText('i'),
    d: valveText('d'),
    refTemp: valveText('refTemp'),
    manualMv: valveText('manualMv'),
    /* 도달 램프는 세 갈래다 — 도달(초록) / 아직(꺼짐) / 못 읽음(점선).
       못 읽은 것을 '아직'으로 그리면 도달했는데 안 한 것으로 보게 된다. */
    refTempLamp: refTempState === TAG_UNKNOWN ? ' unknown' : (refTempState === TAG_ON ? ' on' : ''),
  };

  const handleValveChange = (field, value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;

    setWriteError('');
    writeTag(AT_FOLDER_ID, VALVE_TAGS[field], num)
      .catch((e) => setWriteError(`${VALVE_TAGS[field]} — ${e.message}`));
  };

  return (
    /* hmi-dark — 어두운 배경·유리 판은 scada.css의 공용 규칙이 맡는다.
       작화(파이프·밸브·모터)는 배경이 비어 있는 그림이라 그대로 얹힌다. */
    <div className="at-page hmi-dark">
      {/* 배관 부속을 초록으로 물들이는 색 행렬. CSS의 filter: url(#at-green)이 이걸 부른다.

          기성 필터로는 안 된다 — grayscale·sepia 따위에는 '초록으로'가 없고, hue-rotate로
          맞추면 원래 색(은회색·주황)마다 다른 색이 나온다.

          쓰는 색은 화면 램프의 초록 그대로다(scada.css의 .hmi-lampbox.is-on = #15803d
          = 0.0824 / 0.5020 / 0.2392). 그 색에 밝기(luminance)로 낸 배수를 곱한다.
          배수는 0.45 ~ 1.30이라 어두운 곳 rgb(9,58,27) ~ 밝은 곳 rgb(27,166,79)이고,
          전부 #15803d 계열 안에서만 오르내린다.

          CSS가 이 필터 앞에 contrast(1.8)을 먼저 건다. 원본이 밝은 은회색 좁은 범위라
          그냥 물들이면 안쪽 모양이 뭉개져 초록 덩어리로 보인다. 대비를 먼저 벌려 두면
          같은 배수 폭 안에서도 음영이 살아난다.

          여기까지 세 번 고쳤다. 밝기를 1.3배로 키워 초록 한 축에 실었더니 G가 최대치를
          넘겨 형광이 됐고, 배수 폭을 0.8~1.2로 줄였더니 색은 맞는데 모양이 안 보였다.
          폭을 넓히는 것으로 모양을 살리려 하면 하이라이트가 다시 튄다 — 폭 말고 대비로
          푸는 것이 요점이다.

          한 줄의 앞 셋은 (그 채널 값 × 0.85 × 밝기 계수 0.2126/0.7152/0.0722), 맨 뒤는
          (그 채널 값 × 0.45)인 고정분이다. A줄은 그대로 둔다 — 투명한 곳이 채워지면
          그림이 상자가 된다. */}
      <svg className="at-filter-defs" aria-hidden="true">
        <filter id="at-green" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.01489 0.05009 0.00506 0 0.03708
                    0.09072 0.30518 0.03081 0 0.22590
                    0.04323 0.14541 0.01468 0 0.10764
                    0       0       0       1 0"
          />
        </filter>
      </svg>

      <div className="at-stage" ref={stageRef}>
        {/* left:50% + 음수 margin으로 가운데를 맞춰 두고 transform-origin: top center로
            줄이기 때문에, 배율이 바뀌어도 가운데에 머문다.
            배율을 재기 전(0) 한 프레임은 원본 크기로 번쩍이지 않게 숨긴다. */}
        <div
          className={`at-stage-inner${fittingClasses}${beaconClass}`}
          style={{
            width: STAGE_W,
            height: STAGE_H,
            marginLeft: -STAGE_W / 2,
            transform: `scale(${scale})`,
            visibility: scale ? 'visible' : 'hidden',
          }}
        >
          <AtmosphereOverview />

          <div className="at-overlay">
            {/* 설비 제목판 + OPEN/CLOSE — 두 칸 다 램프다. OPEN은 초록, CLOSE는 빨강으로
                켜지고, 각자 자기 램프 태그만 본다(서로를 보고 그리지 않는다). 둘 다 0이면
                둘 다 꺼진 채로 둔다 — 동작 중이거나 어느 쪽도 아닌 상태를 그대로 보여준다.
                명령 태그가 있는 설비는 그 램프가 버튼도 겸한다(모양은 같다). */}
            {DEVICE_PANELS.map((d) => (
              <Fragment key={d.key}>
                <span className={`at-plate at-plate--${d.tone}`} style={d.plate}>
                  {d.title}
                </span>
                <span className="at-openclose" style={d.state}>
                  {d.onCmd ? (
                    /* other = 반대쪽 버튼의 태그. 누를 때 이쪽에 1, 반대쪽에 0을 준다. */
                    [
                      { cmd: d.onCmd, other: d.offCmd, text: 'OPEN', onClassName: ' is-on' },
                      { cmd: d.offCmd, other: d.onCmd, text: 'CLOSE', onClassName: ' is-alarm' },
                    ].map((b) => (
                      /* disabled를 걸지 않는다 — 비활성 요소는 뗌 이벤트를 못 받아서
                         시간을 채우기 전에 떼도 취소가 안 된다. */
                      <button
                        type="button"
                        key={b.cmd}
                        className={`hmi-lampbox${lampClassOf(tagValues, b.cmd, b.onClassName)}`
                          + (heldTag === b.cmd ? ' is-held' : '')
                          + (armedTag === b.cmd ? ' is-armed' : '')}
                        onPointerDown={() => handlePress(b.cmd, b.other)}
                        data-tag={b.cmd}
                        title={`${AT_HOLD_MS / 1000}초 누르면 ${b.other}=0, ${b.cmd}=1`
                          + ` / 램프 ${lampOf(b.cmd)}`}
                      >
                        {b.text}
                        {heldTag === b.cmd && (
                          <span
                            className="at-hold-bar"
                            style={{ animationDuration: `${AT_HOLD_MS}ms` }}
                          />
                        )}
                      </button>
                    ))
                  ) : (
                    <>
                      <em
                        className={`hmi-lampbox${genLampClass(d.openTag, TAG_OFF, ' is-on')}`}
                        data-tag={d.openTag}
                        title={`발생기 OPEN — 읽기 전용 / ${d.openTag} — 0이면 초록`}
                      >
                        OPEN
                      </em>
                      <em
                        className={`hmi-lampbox${genLampClass(d.closeTag, TAG_ON, ' is-alarm')}`}
                        data-tag={d.closeTag}
                        title={`발생기 CLOSE — 읽기 전용 / ${d.closeTag} — 1이면 빨강`}
                      >
                        CLOSE
                      </em>
                    </>
                  )}
                </span>
              </Fragment>
            ))}

            {/* 압력 이상·SOL닫힘 — 설명 글씨가 아니라 이상을 알리는 램프다 */}
            {PIPE_LABELS.map((l) => (
              <span
                className={`at-pipe-label hmi-lampbox${pipeClass(l)}`}
                key={l.key}
                data-tag={l.tag}
                title={`${l.text} — 읽기 전용 / ${l.tag} — 1이면 초록, 0이면 빨강`}
                /* 가운데 맞춤(translateX(-50%))은 CSS(.at-pipe-label)가 한다 —
                   인라인 transform으로 두면 좁은 화면에서 판을 키우는 규칙이 먹지 않는다
                   (인라인이 스타일시트를 이긴다). */
                style={{ left: l.cx, top: l.top }}
              >
                {l.text}
              </span>
            ))}

            <span className="at-plate at-plate--furnace" style={FURNACE_PLATE}>
              {FURNACE_PLATE.text}
            </span>

            {/* O2 SENSOR — PLC가 주는 값이라 표시 전용 */}
            <span className="at-o2" style={{ left: O2_PANEL.left, top: O2_PANEL.top }}>
              <em className="at-plate at-plate--o2" style={{ width: O2_PANEL.titleWidth }}>
                O2 SENSOR
              </em>
              <em
                className="at-val"
                style={{ width: O2_PANEL.valueWidth }}
                data-tag="o2_pv"
                title="O2 SENSOR — 읽기 전용 / o2_pv (D241)"
              >
                {o2Text}
              </em>
              <em className="at-o2-unit">mmV</em>
            </span>

            <div className="at-slot at-slot--valve" style={SLOTS.valve}>
              {/* 자동/수동 모드는 위 OPEN/CLOSE와 같은 래치 버튼이라 누름 처리를
                  그대로 넘긴다(handlePress). 나머지 칸은 VALVE_TAGS의 값 태그를 읽고 쓴다. */}
              <AtmosValvePanel
                data={valve}
                tags={VALVE_TAGS}
                lampTag={VALVE_LAMP}
                onChange={handleValveChange}
                values={tagValues}
                onPress={handlePress}
                heldTag={heldTag}
                armedTag={armedTag}
                holdMs={AT_HOLD_MS}
              />
            </div>

            <div className="at-slot at-slot--cond" style={SLOTS.cond}>
              <AtmosConditionPanel conditions={conditions} />
            </div>
          </div>
        </div>
      </div>

      {/* 값 수신 실패·쓰기 실패 안내 — 값이 '---'로 굳거나 버튼을 눌렀는데 아무 일도
          없을 때 이유가 보여야 한다. 쓰기 실패를 먼저 띄운다(방금 한 조작이라서). */}
      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
    </div>
  );
}
