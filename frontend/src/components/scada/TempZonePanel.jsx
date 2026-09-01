import { BarGauge, LedInput } from './HmiParts';

const TEMP_TICKS = [1000, 800, 600, 400, 200, 0];
const MV_TICKS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

// 칸별 입력 허용 범위. 숫자패드가 이 밖의 값은 확정하지 못하게 막는다.
// SV는 게이지 눈금(0~1000℃)과, 출력 관련은 0~100%와 맞췄고, 나머지는 지정받은 값이다.
const RANGE = {
  sv: { min: 0, max: 1000 },
  hh: { min: 0, max: 500 },
  h: { min: 0, max: 200 },
  l: { min: 0, max: 200 },
  ll: { min: 0, max: 400 },
  p: { min: 0, max: 1200 },
  i: { min: 0, max: 2400 },
  d: { min: 0, max: 600 },
  limitHi: { min: 0, max: 100 },
  limitLo: { min: 0, max: 100 },
  manualMv: { min: 0, max: 100 },
};

/**
 * ZONE 1개짜리 온도제어 패널.
 *
 * 칸은 두 종류다.
 *  - PV, MV      : PLC가 주는 현재값. 표시 전용(readOnly)이고 위 게이지를 움직인다.
 *  - 나머지 전부  : 작업자가 넣는 설정값. 입력 가능. SV는 입력하면 위 게이지도 같이 움직인다.
 *
 * @param zone   { pv, sv, mv, hh, h, l, ll, p, i, d, limitHi, limitLo, manualMv, manualMode }
 * @param onChange (field, value) => void
 */
export default function TempZonePanel({ zoneNo, zone, onChange }) {
  const set = (field) => (value) => onChange(field, value);

  return (
    <div className="tz-panel">
      <div className="tz-title">{zoneNo}ZONE 온도제어</div>

      {/* 왼쪽(게이지 + 하단 조작)과 오른쪽 세로 열을 나란히 둔다.
          우측 열은 패널 아래끝까지 내려와 출력 LIMIT이 수동모드 줄과 같은 높이에서 끝난다. */}
      <div className="tz-body">
        <div className="tz-left">
        {/* 게이지 3개 + 그 아래 실제 값 입력 */}
        <div className="tz-gauges">
          <div className="tz-gauge-col">
            <BarGauge label="PV" color="red" value={zone.pv} max={1000} ticks={TEMP_TICKS} />
            <LedInput value={zone.pv} color="red" unit="℃" title="현재값(PV) — PLC 읽기 전용" readOnly />
          </div>
          <div className="tz-gauge-col">
            <BarGauge label="SV" color="green" value={zone.sv} max={1000} ticks={TEMP_TICKS} />
            <LedInput
              value={zone.sv} onChange={set('sv')} color="green" unit="℃"
              title="설정값(SV)" label={`${zoneNo}ZONE 설정값 (SV)`} {...RANGE.sv}
            />
          </div>
          <div className="tz-gauge-col">
            <BarGauge label="MV" color="blue" value={zone.mv} max={100} ticks={MV_TICKS} />
            <LedInput value={zone.mv} color="blue" unit="%" title="출력(MV) — PLC 읽기 전용" readOnly />
          </div>
        </div>

        {/* 하단 — 수동/자동 모드 토글 + 수동 출력량.
            버튼은 "지금 어느 모드인지"를 보여준다(빨강=수동, 초록=자동).
            자동모드에서는 PID가 출력을 정하므로 수동 출력량은 손대지 못하게 잠근다. */}
        <div className="tz-foot">
          <button
            type="button"
            className={`tz-mode-btn ${zone.manualMode ? 'manual' : 'auto'}`}
            onClick={() => onChange('manualMode', !zone.manualMode)}
            title={zone.manualMode ? '누르면 자동모드로 전환' : '누르면 수동모드로 전환'}
          >
            {zone.manualMode ? '수동모드' : '자동모드'}
          </button>

          <div className={`tz-manual-mv${zone.manualMode ? '' : ' is-off'}`}>
            <div className="tz-manual-mv-label">수동 출력량(MV)</div>
            <LedInput
              value={zone.manualMv}
              onChange={set('manualMv')}
              color="green"
              unit="%"
              title={zone.manualMode ? '수동 출력량' : '자동모드에서는 조절할 수 없습니다'}
              label={`${zoneNo}ZONE 수동 출력량 (MV)`}
              {...RANGE.manualMv}
              disabled={!zone.manualMode}
            />
          </div>
        </div>
        </div>

        {/* 우측 세로 열 — 경보 설정 / PID / 출력 제한 */}
        <div className="tz-side">
          <div className="tz-side-group">
            <div className="tz-field"><label>HH</label>
              <LedInput value={zone.hh} onChange={set('hh')} color="red" size="sm"
                label={`${zoneNo}ZONE 상상한 경보 (HH)`} {...RANGE.hh} /></div>
            <div className="tz-field"><label>H</label>
              <LedInput value={zone.h} onChange={set('h')} color="orange" size="sm"
                label={`${zoneNo}ZONE 상한 경보 (H)`} {...RANGE.h} /></div>
            <div className="tz-field"><label>L</label>
              <LedInput value={zone.l} onChange={set('l')} color="yellow" size="sm"
                label={`${zoneNo}ZONE 하한 경보 (L)`} {...RANGE.l} /></div>
            <div className="tz-field"><label>LL</label>
              <LedInput value={zone.ll} onChange={set('ll')} color="yellow" size="sm"
                label={`${zoneNo}ZONE 하하한 경보 (LL)`} {...RANGE.ll} /></div>
          </div>

          <div className="tz-side-group">
            <div className="tz-field"><label>P</label>
              <LedInput value={zone.p} onChange={set('p')} color="white" size="sm"
                label={`${zoneNo}ZONE 비례대 (P)`} {...RANGE.p} /></div>
            <div className="tz-field"><label>I</label>
              <LedInput value={zone.i} onChange={set('i')} color="white" size="sm"
                label={`${zoneNo}ZONE 적분시간 (I)`} {...RANGE.i} /></div>
            <div className="tz-field"><label>D</label>
              <LedInput value={zone.d} onChange={set('d')} color="white" size="sm"
                label={`${zoneNo}ZONE 미분시간 (D)`} {...RANGE.d} /></div>
          </div>

          <div className="tz-side-group tz-limit">
            <div className="tz-limit-title">출력 LIMIT<br />(MV%)</div>
            <div className="tz-field"><label>상한</label>
              <LedInput value={zone.limitHi} onChange={set('limitHi')} color="yellow" size="sm"
                label={`${zoneNo}ZONE 출력 상한 (MV%)`} {...RANGE.limitHi} /></div>
            <div className="tz-field"><label>하한</label>
              <LedInput value={zone.limitLo} onChange={set('limitLo')} color="yellow" size="sm"
                label={`${zoneNo}ZONE 출력 하한 (MV%)`} {...RANGE.limitLo} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
