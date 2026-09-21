import { useEffect, useRef, useState } from 'react';
import CoolingOverview from '../../components/scada/CoolingOverview';
import { LedInput } from '../../components/scada/HmiParts';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { tagState, TAG_ON, TAG_UNKNOWN } from '../../api/scada/foldertagApi';
import { ARROW_TAGS, TOWER_MOTOR, arrowBlinkClass } from '../../components/scada/coolingArtTags';
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

/* 이 화면의 PLC 태그가 든 폴더 — ez_scada.folders.id (폴더 이름 '쿨링타워').
   DB에 만든 행의 id와 반드시 같아야 한다. 틀리면 오류가 아니라 태그 0개 응답으로
   조용히 실패하니, 값이 안 오면 여기를 먼저 본다. */
const CT_FOLDER_ID = 11;

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

/* 냉각수 알람 지연시간 — HIGH/LOW를 분 단위로 넣는다.
   폭은 아래 두 줄의 내용 폭과 같게 잡는다: HIGH/LOW 글자판 54 + 간격 5 + 값칸 112
   (입력 84 + 'min' 28) = 171. 예전 215는 제목판만 60px 넓어서 아래 줄과 오른쪽 선이
   어긋나 보였다. 값칸 폭(CoolingPage.css의 .ct-delay-label / .hmi-led-input)을 고치면
   이 숫자도 같이 고쳐야 한다. */
const DELAY_PANEL = { left: 1140, top: 556, width: 171 };

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

  /* 이 화면의 PLC 값. 지금 붙어 있는 것은 상부 모터 램프 하나뿐이고,
     알람 지연시간·수위 배너·펌프는 아직 태그가 없다. */
  const { values: tagValues, error: tagValueError } = useFolderTagValues(CT_FOLDER_ID);

  /* 쿨링타워 상부 모터 — 1이면 초록, 0이면 작화 그대로, 못 읽으면 회색.
     구동화면 화살표·모터와 같은 방식이다: 작화는 memo로 묶인 고정 그림이라 값을 넘기지
     않고, 무대에 클래스만 붙여서 실제로 색을 바꾸는 일은 CoolingPage.css가 맡는다.

     tagValues 아래에 두어야 한다 — 위에 두면 선언 전에 읽어서(TDZ) 렌더가 통째로 죽는다. */
  const motorState = tagState(tagValues?.[TOWER_MOTOR.tag]);
  const motorClass = motorState === TAG_ON
    ? ' motor-green'
    : (motorState === TAG_UNKNOWN ? ' motor-gray' : '');

  /* 냉각수 흐름 화살표 — 값이 1인 것만 깜빡인다. 0이거나 못 읽으면 가만히 있는다.
     아홉이 한 렌더에서 같이 붙으므로 애니메이션도 같이 시작해 박자가 맞는다. */
  const arrowBlinkClasses = ARROW_TAGS
    .filter(({ tag }) => tagState(tagValues?.[tag]) === TAG_ON)
    .map(({ cls }) => ` ${arrowBlinkClass(cls)}`)
    .join('');

  return (
    /* hmi-dark — 어두운 배경·유리 판은 scada.css의 공용 규칙이 맡는다.
       작화(파란 배관·청록 화살표·은색 펌프)는 배경이 비어 있어 그대로 얹힌다. */
    <div className="ct-page hmi-dark">
      {/* 상부 모터를 초록으로 물들이는 색 행렬. CSS의 filter: url(#ct-green)이 이걸 부른다.
          분위기제어(#at-green)와 같은 값이다 — 화면 램프의 초록(#15803d)에 밝기로 낸
          배수(0.45~1.30)를 곱한다. CSS가 앞에 contrast(1.8)을 먼저 걸어 안쪽 음영을
          살린다. 자세한 사정은 AtmospherePage.jsx의 같은 자리 주석에 적어 두었다.
          (필터 정의는 문서마다 따로 있어야 해서 화면끼리 나눠 쓸 수 없다) */}
      <svg className="ct-filter-defs" aria-hidden="true">
        <filter id="ct-green" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.01489 0.05009 0.00506 0 0.03708
                    0.09072 0.30518 0.03081 0 0.22590
                    0.04323 0.14541 0.01468 0 0.10764
                    0       0       0       1 0"
          />
        </filter>
      </svg>

      <div className="ct-stage" ref={stageRef}>
        {/* left:50% + 음수 margin으로 가운데를 맞춰 두고 transform-origin: top center로
            줄이기 때문에, 배율이 바뀌어도 가운데에 머문다.
            배율을 재기 전(0) 한 프레임은 원본 크기로 번쩍이지 않게 숨긴다. */}
        <div
          className={`ct-stage-inner${motorClass}${arrowBlinkClasses}`}
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

      {/* 값을 못 받고 있으면 알린다 — 다른 화면과 같은 자리(.hmi-toast)다.
          이게 없으면 램프가 회색인 것이 "안 돈다"인지 "못 읽는다"인지 화면만 보고 모른다. */}
      {tagValueError && <div className="hmi-toast">{tagValueError}</div>}
    </div>
  );
}
