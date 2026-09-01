import { useRef, useState } from 'react';
import NumPad from './NumPad';

/**
 * HMI 공용 부품 — 세로 막대 게이지와 LED 입력창.
 * 온도제어 화면에서 먼저 쓰고, 연소·분위기제어 화면에서도 그대로 재사용할 것들이다.
 */

/** 문자열로 들고 있는 입력값을 게이지용 숫자로 바꾼다. 비어 있거나 숫자가 아니면 0. */
export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * 검은 바탕 + 색 숫자로 된 LED 표시창.
 *
 * PLC가 주는 현재값(PV, MV 등)은 readOnly로 두어 표시 전용으로 쓰고,
 * 작업자가 넣는 설정값(SV, PID 등)은 그대로 입력창으로 쓴다.
 *
 * 값은 키보드로 직접 치는 게 아니라 눌렀을 때 뜨는 숫자패드(NumPad)로만 넣는다.
 * 현장 터치 패널에 키보드가 없기도 하고, 숫자 외의 문자가 들어갈 여지를 아예 없애기 위함이다.
 *
 * @param color    digit 색 계열 — red | green | blue | orange | yellow | white
 * @param unit     숫자 오른쪽에 붙는 단위(℃, % 등). LED 박스 밖에 검은 글씨로 붙는다.
 * @param label    숫자패드 상단에 뜰 항목 이름. 없으면 title을 쓴다.
 * @param min/max  허용 범위. 숫자패드가 이 범위를 벗어난 값은 확정하지 못하게 막는다.
 * @param readOnly true면 표시 전용(PLC가 주는 값)
 * @param disabled true면 지금은 쓰지 않는 칸(예: 자동모드일 때의 수동 출력량).
 *                 값은 그대로 보이되 꺼진 LED처럼 어둡게 표시한다.
 */
export function LedInput({
  value, onChange, color = 'red', unit, size = 'md', title, label,
  min, max, readOnly = false, disabled = false,
}) {
  const inputRef = useRef(null);
  // 숫자패드를 어디에 띄울지 — 누른 칸의 화면상 위치. 닫혀 있으면 null.
  const [anchor, setAnchor] = useState(null);
  const locked = readOnly || disabled;

  const openPad = () => {
    const r = inputRef.current?.getBoundingClientRect();
    if (r) setAnchor({ left: r.left, top: r.top, bottom: r.bottom });
  };

  return (
    <div className="hmi-led-row">
      <input
        ref={inputRef}
        className={`hmi-led-input led-${color} led-${size}`
          + `${readOnly ? ' is-readonly' : ''}${disabled ? ' is-disabled' : ''}`
          + `${anchor ? ' is-editing' : ''}`}
        value={value}
        // 항상 readOnly — 값 변경은 숫자패드를 거친다.
        readOnly
        onClick={locked ? undefined : openPad}
        // 못 쓰는 칸은 탭으로도 넘어가지 않게 해서 조작 대상이 아님을 분명히 한다.
        tabIndex={locked ? -1 : undefined}
        onKeyDown={locked ? undefined : (e) => {
          if (e.key === 'Enter' || e.key === ' ') { openPad(); e.preventDefault(); }
        }}
        title={title}
      />
      {unit && <span className="hmi-led-unit">{unit}</span>}

      {anchor && (
        <NumPad
          label={label ?? title ?? '값 입력'}
          value={value}
          unit={unit}
          min={min}
          max={max}
          anchor={anchor}
          onCommit={(v) => { onChange(v); setAnchor(null); }}
          onCancel={() => setAnchor(null)}
        />
      )}
    </div>
  );
}

/**
 * 세로 막대 게이지 + 눈금.
 *
 * 눈금 간격이 일정하다는 전제로 라벨을 space-between으로 배치한다(참고 HMI가
 * 0/200/…/1000, 0/10/…/100 처럼 등간격만 쓴다). 등간격이 아닌 눈금이 필요해지면
 * 라벨마다 위치를 계산해서 절대배치로 바꿔야 한다.
 *
 * @param ticks 위에서 아래 순서(예: [1000, 800, 600, 400, 200, 0])
 */
export function BarGauge({ label, color, value, min = 0, max, ticks }) {
  const pct = max === min ? 0 : ((toNumber(value) - min) / (max - min)) * 100;
  const fill = Math.min(100, Math.max(0, pct));

  return (
    <div className="hmi-gauge">
      <div className={`hmi-gauge-head head-${color}`}>{label}</div>

      <div className="hmi-gauge-body">
        <div className="hmi-gauge-scale">
          {ticks.map((t) => (
            <span className="hmi-gauge-tick" key={t}>{t}</span>
          ))}
        </div>

        <div className="hmi-gauge-track">
          <div className={`hmi-gauge-fill fill-${color}`} style={{ height: `${fill}%` }} />
          <div className="hmi-gauge-marks">
            {ticks.map((t) => (
              <span key={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
