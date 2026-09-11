import { Fragment, useEffect, useRef, useState } from 'react';
import AtmosphereOverview from '../../components/scada/AtmosphereOverview';
import AtmosConditionPanel from '../../components/scada/AtmosConditionPanel';
import AtmosValvePanel from '../../components/scada/AtmosValvePanel';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { lampClassOf, lampOf, writeTag } from '../../api/scada/foldertagApi';
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
    // 발생기는 아직 태그가 없어서 표시 전용이다. 오면 gen_gas_open_cmd로 넣는다.
    key: 'gen', tone: 'gen', title: '발 생 기',
    plate: { left: 1500, top: 100, width: 172 },
    state: { left: 1495, top: 158, width: 182 },
  },
];

/* 압력계·솔밸브 아래에 붙는 상태 글씨. cx는 그 부품이 그려지는 가운데 x다.
     blowe-pre x 328~405 → 366    blowe-sol x 454~533 → 494
     gas-pre   x 232~300 → 266    gas-sol   x 368~446 → 407 */
const PIPE_LABELS = [
  { key: 'bPre', cx: 368, top: 82, text: '압력 이상' },
  { key: 'bSol', cx: 495, top: 82, text: 'SOL닫힘' },
  { key: 'gPre', cx: 266, top: 244, text: '압력 이상' },
  { key: 'gSol', cx: 407, top: 244, text: 'SOL닫힘' },
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

// 자동모드 전환 조건 — 순서와 문구는 현장 HMI 화면 그대로.
// on은 PLC 상태라 지금은 전부 꺼짐으로 두고, 연동 때 폴링 값으로 채운다.
const CONDITIONS = [
  { key: 'blower', label: 'ADDTION AIR BLOWER ON' },
  { key: 'airSol', label: 'ADDTION AIR SOL VLAVE ON' },
  { key: 'airPress', label: 'ADDTION AIR PRESSURE 정상' },
  { key: 'gasSol', label: 'ADDTION GAS SOL VLAVE ON' },
  { key: 'gasPress', label: 'ADDTION GAS PRESSURE 정상' },
  { key: 'refTemp', label: '허용 기준온도 도달' },
  { key: 'genGas', label: '발생기 GAS OPEN' },
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

  /* 값을 못 받았으면 0이 아니라 '---'로 보여준다 — 읽지 못한 값을 0으로 그리면
     실제로 0인 것과 구분되지 않는다. */
  const o2Text = (() => {
    const v = tagValues?.o2_pv;
    return v == null || v === '' ? '---' : String(v);
  })();

  const [conditions] = useState(() => CONDITIONS.map((c) => ({ ...c, on: false })));

  /* 아직 태그가 없는 설비(발생기)의 OPEN/CLOSE 색. 사진처럼 열림으로 고정해 둔다.
     ADDTION 블로워·가스는 램프 태그로 넘어가서 여기서 빠졌다. */
  const [devices] = useState({ gen: true });

  /* ── ADDTION 블로워·가스 OPEN/CLOSE ───────────────────────────────────
     모멘터리가 아니다. AT_HOLD_MS를 채우면 누른 쪽 태그에 1, 반대쪽 태그에 0을 주고
     그대로 남는다(래치). 떼는 것은 아무 값도 보내지 않는다 — 손을 떼면 밸브가 원래대로
     돌아가 버리면 안 되니까. OPEN과 CLOSE는 서로 반대라 둘이 동시에 1이 될 수 없다.

     개별연소 모달의 버너 버튼(누르는 동안만 1)과는 다른 방식이다. 그쪽은 PLC가 0을
     되돌려 주지만, 여기는 화면이 두 태그를 직접 맞춰 줘야 한다. */

  const [writeError, setWriteError] = useState('');

  // 지금 누르고 있는 태그 — 진행 바를 그리는 데만 쓴다(버튼을 비활성화하지 않는다)
  const [heldTag, setHeldTag] = useState('');

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
    setWriteError('');

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      sendPair(selfCmd, otherCmd);
    }, AT_HOLD_MS);
  };

  /* 뗌은 값을 보내지 않는다. 시간을 채우기 전에 뗐을 때 예약된 쓰기를 취소하는 것이
     전부다(그래서 이름이 cancel이다). 채운 뒤에 떼면 이미 나갔으므로 할 일이 없다. */
  const handleRelease = () => {
    if (!heldRef.current) return;
    heldRef.current = null;
    setHeldTag('');

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

  const [valve, setValve] = useState({
    pv: '0',
    sv: '1050',
    mv: '0',
    p: '3.0',
    i: '120',
    d: '30',
    refTemp: '800',
    refTempReached: false,
    manualMv: '0',
  });

  const handleValveChange = (field, value) => {
    setValve((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="at-page">
      <div className="at-stage" ref={stageRef}>
        {/* left:50% + 음수 margin으로 가운데를 맞춰 두고 transform-origin: top center로
            줄이기 때문에, 배율이 바뀌어도 가운데에 머문다.
            배율을 재기 전(0) 한 프레임은 원본 크기로 번쩍이지 않게 숨긴다. */}
        <div
          className="at-stage-inner"
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
                          + (heldTag === b.cmd ? ' is-held' : '')}
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
                      <em className={`hmi-lampbox${devices[d.key] ? ' is-on' : ''}`}>OPEN</em>
                      <em className={`hmi-lampbox${devices[d.key] ? '' : ' is-alarm'}`}>CLOSE</em>
                    </>
                  )}
                </span>
              </Fragment>
            ))}

            {/* 압력 이상·SOL닫힘 — 설명 글씨가 아니라 이상을 알리는 램프다 */}
            {PIPE_LABELS.map((l) => (
              <span
                className="at-pipe-label hmi-lampbox is-alarm"
                key={l.key}
                style={{ left: l.cx, top: l.top, transform: 'translateX(-50%)' }}
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

            <div className="at-slot" style={SLOTS.valve}>
              {/* 자동/수동 모드는 위 OPEN/CLOSE와 같은 래치 버튼이라 누름 처리를
                  그대로 넘긴다(handlePress). 나머지 칸은 아직 더미다. */}
              <AtmosValvePanel
                data={valve}
                onChange={handleValveChange}
                values={tagValues}
                onPress={handlePress}
                heldTag={heldTag}
                holdMs={AT_HOLD_MS}
              />
            </div>

            <div className="at-slot" style={SLOTS.cond}>
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
