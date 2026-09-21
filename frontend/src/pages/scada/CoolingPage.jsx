import { useEffect, useRef, useState } from 'react';
import CoolingOverview from '../../components/scada/CoolingOverview';
import { LedInput } from '../../components/scada/HmiParts';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { tagState, writeTag, TAG_ON, TAG_UNKNOWN } from '../../api/scada/foldertagApi';
import {
  ARROW_TAGS, PUMPS, TOWER_MOTOR, arrowBlinkClass, pumpGrayClass, pumpGreenClass,
} from '../../components/scada/coolingArtTags';
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

   화면의 모든 값이 PLC에서 온다 — 그림 위 기기(상부 모터·펌프·화살표), 집수조 경보 띠,
   냉각수 알람 지연시간. 지연시간 두 칸만 쓰기도 한다(읽는 태그와 같은 태그).
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

/* 집수조 안의 빨간 경보 띠. 값이 1일 때만 보이고, 0이거나 못 읽으면 아예 안 그린다.
   못 읽을 때 숨기는 쪽으로 정한 이유: 확인할 수 없는 경보를 띄우면 오보가 된다.
   대신 값을 못 받고 있다는 것 자체는 화면 아래 토스트가 알린다. */
const LEVEL_BANNERS = [
  { key: 'high', left: 868, top: 560, width: 228, text: '집수조 LEVEL HIGH', tag: 'sump_tank_level_high_lamp' },
  { key: 'low', left: 868, top: 618, width: 228, text: '집수조 LEVEL LOW', tag: 'sump_tank_level_low_lamp' },
];

/* 냉각수 알람 지연시간 — HIGH/LOW를 분 단위로 넣는다.
   폭은 아래 두 줄의 내용 폭과 같게 잡는다: HIGH/LOW 글자판 54 + 간격 5 + 값칸 112
   (입력 84 + 'min' 28) = 171. 예전 215는 제목판만 60px 넓어서 아래 줄과 오른쪽 선이
   어긋나 보였다. 값칸 폭(CoolingPage.css의 .ct-delay-label / .hmi-led-input)을 고치면
   이 숫자도 같이 고쳐야 한다. */
const DELAY_PANEL = { left: 1140, top: 556, width: 171 };

/* 위쪽 한계를 두지 않는다 — 실제 범위를 아직 모른다. 0~60으로 잡아 두었다가
   "그 범위가 아니다"라고 확인받아 뺐다. 값을 알게 되면 LedInput에 max를 주면 된다
   (숫자패드가 범위를 벗어난 값을 확정하지 못하게 막는다).

   min은 0으로 남긴다 — 지연시간에 음수는 뜻이 없다. 숫자패드는 이 값이 0 이상이면
   빼기 키를 막고 "음수는 입력할 수 없습니다"를 띄운다. min·max가 둘 다 있어야
   범위 안내가 뜨므로, 이것만으로는 화면에 0~ 같은 문구가 생기지 않는다.

   읽는 태그와 쓰는 태그가 같다 — 숫자패드로 넣은 값이 이 태그로 나가고,
   화면에 보이는 값도 다음 폴링에서 이 태그로 돌아온다. */
const DELAY_ROWS = [
  { key: 'high', label: 'HIGH', tag: 'cooling_alarm_delay_time_high' },
  { key: 'low', label: 'LOW', tag: 'cooling_alarm_delay_time_low' },
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


  /* 이 화면의 PLC 값 — 상부 모터·펌프 넷·흐름 화살표 아홉·집수조 경보 띠·알람 지연시간이
     전부 여기서 온다. 태그 없이 그려지는 것은 배관과 화살표 셋(arrow-3~5)뿐이다. */
  const { values: tagValues, error: tagValueError } = useFolderTagValues(CT_FOLDER_ID);
  const [writeError, setWriteError] = useState('');

  /* 쿨링타워 상부 모터 — 1이면 초록, 0이면 작화 그대로, 못 읽으면 회색.
     구동화면 화살표·모터와 같은 방식이다: 작화는 memo로 묶인 고정 그림이라 값을 넘기지
     않고, 무대에 클래스만 붙여서 실제로 색을 바꾸는 일은 CoolingPage.css가 맡는다.

     tagValues 아래에 두어야 한다 — 위에 두면 선언 전에 읽어서(TDZ) 렌더가 통째로 죽는다. */
  const motorState = tagState(tagValues?.[TOWER_MOTOR.tag]);
  const motorClass = motorState === TAG_ON
    ? ' motor-green'
    : (motorState === TAG_UNKNOWN ? ' motor-gray' : '');

  /* 펌프 넷 — 상부 모터와 같은 규칙(1이면 초록, 0이면 그대로, 못 읽으면 회색). */
  const pumpClasses = PUMPS
    .map(({ cls, tag }) => {
      const st = tagState(tagValues?.[tag]);
      if (st === TAG_ON) return ` ${pumpGreenClass(cls)}`;
      return st === TAG_UNKNOWN ? ` ${pumpGrayClass(cls)}` : '';
    })
    .join('');

  /* 냉각수 알람 지연시간 — 읽기와 쓰기가 같은 태그다.
     값을 못 받았으면 0이 아니라 '---'다. 0으로 그리면 "지연 없음"으로 읽힌다. */
  const delayText = (tag) => {
    const v = tagValues?.[tag];
    return v == null || v === '' ? '---' : String(v);
  };

  const handleDelayChange = (tag, value) => {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return;

    setWriteError('');
    writeTag(CT_FOLDER_ID, tag, num)
      .catch((e) => setWriteError(`${tag} — ${e.message}`));
  };

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
          className={`ct-stage-inner${motorClass}${pumpClasses}${arrowBlinkClasses}`}
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

            {LEVEL_BANNERS
              .filter((b) => tagState(tagValues?.[b.tag]) === TAG_ON)
              .map((b) => (
                <span
                  className="ct-banner"
                  key={b.key}
                  data-tag={b.tag}
                  title={`${b.text} — 읽기 전용 / ${b.tag} — 1일 때만 보인다`}
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
                    value={delayText(r.tag)}
                    onChange={(v) => handleDelayChange(r.tag, v)}
                    color="red"
                    size="sm"
                    unit="min"
                    title={`냉각수 알람 지연시간 ${r.label} / ${r.tag} — 읽기·쓰기 같은 태그`}
                    label={`냉각수 알람 지연시간 ${r.label}`}
                    min={0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 값을 못 받고 있으면 알린다 — 다른 화면과 같은 자리(.hmi-toast)다.
          이게 없으면 램프가 회색인 것이 "안 돈다"인지 "못 읽는다"인지 화면만 보고 모른다. */}
      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
    </div>
  );
}
