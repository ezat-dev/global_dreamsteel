import { useEffect, useRef, useState } from 'react';
import CoolingOverview from '../../components/scada/CoolingOverview';
import { LedInput } from '../../components/scada/HmiParts';
// 작화 도구가 뽑아준 설비 그림 스타일. 무수정 원본이라 우리 CSS보다 먼저 깐다.
import './coolingOverview.css';
import './CoolingPage.css';

/* ===========================================================================
   쿨링타워

   설비 그림은 작화 원본(CoolingOverview + coolingOverview.css)을 그대로 쓰고,
   그 위에 이름판·경보 띠·설정값을 얹는다.

   원본이 1496x708px 고정 크기라 화면에 맞춰 transform: scale로 줄인다. 구동화면과
   달리 가로·세로 중 작은 배율을 쓴다 — 이 그림은 약 2.1:1로 세로가 깊어서 가로에만
   맞추면 높이가 화면을 넘친다. 얹는 것들도 같이 줄어들어야 하므로 스케일 안쪽에 두고,
   위치는 전부 그림 원본 좌표계(1496x708) 기준 px로 적는다.

   값은 아직 더미다. PLC 연동 때 state 자리만 폴링 결과로 바꾸면 된다.
   =========================================================================== */

const STAGE_W = 1496;
const STAGE_H = 708;

/* ---------------------------------------------------------------------------
   그림 위에 얹는 것들의 위치 — 전부 여기 모아 둔다.
   cx는 가운데 정렬 기준 x, left/top은 왼쪽 위 기준. 단위는 그림 원본 px다.
   화면을 보고 미세조정할 일이 반드시 생기는데, 그때 이 표의 숫자만 고치면 된다.

   설비 조각이 실제로 그려지는 자리(작화 CSS에서 확인한 값):
     COOLING CHAMBER 탱크  x  919~1181, y 121~278
     RX-발생기 탱크        x 1234~1496, y 121~278
     집수조(파란 안쪽)     x  837~1418, y 528~687
     NO.1 냉각수펌프       x  607~ 749, y 322~397
     NO.2 냉각수펌프       x  609~ 751, y 433~508
     NO.1 순환펌프         x  161~ 303, y 498~573
     NO.2 순환펌프         x  159~ 301, y 609~684
   ------------------------------------------------------------------------- */

// 탱크 한가운데에 박히는 이름판
const TANK_PLATES = [
  { key: 'chamber', cx: 1050, top: 186, width: 200, text: 'COOLING CHAMBER' },
  { key: 'rx', cx: 1365, top: 186, width: 200, text: 'RX-발생기' },
];

// 펌프 바로 위에 붙는 이름판
const PUMP_PLATES = [
  { key: 'cool1', cx: 678, top: 321, text: 'NO.1 냉각수펌프' },
  { key: 'cool2', cx: 680, top: 432, text: 'NO.2 냉각수펌프' },
  { key: 'circ1', cx: 232, top: 497, text: 'NO.1 순환펌프' },
  { key: 'circ2', cx: 230, top: 608, text: 'NO.2 순환펌프' },
];

/* 집수조 안의 빨간 경보 띠. 지금은 항상 켜진 모양으로 그리고, 연동 때 PLC 값에 따라
   on/off를 붙이면 된다. */
const LEVEL_BANNERS = [
  { key: 'high', left: 868, top: 560, width: 228, text: '집수조 LEVEL HIGH' },
  { key: 'low', left: 868, top: 618, width: 228, text: '집수조 LEVEL LOW' },
];

// 냉각수 알람 지연시간 — HIGH/LOW를 분 단위로 넣는다.
const DELAY_PANEL = { left: 1140, top: 556, width: 215 };

/* 두 칸의 허용 범위가 같다. 숫자패드가 이 범위를 벗어난 값은 확정하지 못하게 막는다. */
const DELAY_MIN = 0;
const DELAY_MAX = 60;

const DELAY_ROWS = [
  { key: 'high', label: 'HIGH' },
  { key: 'low', label: 'LOW' },
];

export default function CoolingPage() {
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

  const [delays, setDelays] = useState({ high: '0', low: '0' });

  return (
    <div className="ct-page">
      <div className="ct-stage" ref={stageRef}>
        {/* left:50% + 음수 margin으로 가운데를 맞춰 두고 transform-origin: top center로
            줄이기 때문에, 배율이 바뀌어도 가운데에 머문다.
            배율을 재기 전(0) 한 프레임은 원본 크기로 번쩍이지 않게 숨긴다. */}
        <div
          className="ct-stage-inner"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            marginLeft: -STAGE_W / 2,
            transform: `scale(${scale})`,
            visibility: scale ? 'visible' : 'hidden',
          }}
        >
          <CoolingOverview />

          <div className="ct-overlay">
            {TANK_PLATES.map((p) => (
              <span
                className="ct-plate ct-tank-plate"
                key={p.key}
                style={{ left: p.cx, top: p.top, width: p.width, transform: 'translateX(-50%)' }}
              >
                {p.text}
              </span>
            ))}

            {PUMP_PLATES.map((p) => (
              <span
                className="ct-plate ct-pump-plate"
                key={p.key}
                style={{ left: p.cx, top: p.top, transform: 'translateX(-50%)' }}
              >
                {p.text}
              </span>
            ))}

            {LEVEL_BANNERS.map((b) => (
              <span
                className="ct-banner"
                key={b.key}
                style={{ left: b.left, top: b.top, width: b.width }}
              >
                {b.text}
              </span>
            ))}

            <div
              className="ct-delay"
              style={{ left: DELAY_PANEL.left, top: DELAY_PANEL.top, width: DELAY_PANEL.width }}
            >
              <span className="ct-plate ct-delay-title">냉각수 알람 지연시간</span>

              {DELAY_ROWS.map((r) => (
                <div className="ct-delay-row" key={r.key}>
                  <span className="ct-plate ct-delay-label">{r.label}</span>
                  <LedInput
                    value={delays[r.key]}
                    onChange={(v) => setDelays((prev) => ({ ...prev, [r.key]: v }))}
                    color="red"
                    size="sm"
                    unit="min"
                    label={`냉각수 알람 지연시간 ${r.label}`}
                    min={DELAY_MIN}
                    max={DELAY_MAX}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
