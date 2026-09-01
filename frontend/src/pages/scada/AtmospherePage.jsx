import { Fragment, useEffect, useRef, useState } from 'react';
import AtmosphereOverview from '../../components/scada/AtmosphereOverview';
import AtmosConditionPanel from '../../components/scada/AtmosConditionPanel';
import AtmosValvePanel from '../../components/scada/AtmosValvePanel';
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

/* 설비 위에 얹는 제목판과 OPEN/CLOSE 표시.
   plate는 제목 띠, state는 그 아래 OPEN/CLOSE 두 글자가 놓이는 자리다.
   tone은 사진의 색 — 블로워는 회색, 가스는 주황, 발생기는 남보라. */
const DEVICE_PANELS = [
  {
    key: 'blower', tone: 'blower', title: 'ADDTION BLOWE',
    plate: { left: 4, top: 8, width: 220 },
    state: { left: 8, top: 70, width: 210 },
  },
  {
    key: 'gas', tone: 'gas', title: 'ADDTION GAS',
    plate: { left: 4, top: 168, width: 178 },
    state: { left: 8, top: 228, width: 170 },
  },
  {
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

  const [conditions] = useState(() => CONDITIONS.map((c) => ({ ...c, on: false })));

  /* 각 설비가 열렸는지. PLC 상태라 지금은 사진과 같은 조합으로 고정해 둔다
     (블로워·가스는 닫힘, 발생기는 열림). 연동 때 폴링 값으로 바꾼다. */
  const [devices] = useState({ blower: false, gas: false, gen: true });

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
    manualMode: true,
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
            {/* 설비 제목판 + OPEN/CLOSE — 지금 걸린 쪽만 진하게, 반대쪽은 흐리게 */}
            {DEVICE_PANELS.map((d) => (
              <Fragment key={d.key}>
                <span className={`at-plate at-plate--${d.tone}`} style={d.plate}>
                  {d.title}
                </span>
                <span className="at-openclose" style={d.state}>
                  <em className={devices[d.key] ? 'is-on' : ''}>OPEN</em>
                  <em className={devices[d.key] ? '' : 'is-on'}>CLOSE</em>
                </span>
              </Fragment>
            ))}

            {PIPE_LABELS.map((l) => (
              <span
                className="at-pipe-label"
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
              <em className="at-val" style={{ width: O2_PANEL.valueWidth }}>####</em>
              <em className="at-o2-unit">mmV</em>
            </span>

            <div className="at-slot" style={SLOTS.valve}>
              <AtmosValvePanel data={valve} onChange={handleValveChange} />
            </div>

            <div className="at-slot" style={SLOTS.cond}>
              <AtmosConditionPanel conditions={conditions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
