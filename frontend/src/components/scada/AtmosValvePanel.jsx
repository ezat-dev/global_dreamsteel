import { LedInput } from './HmiParts';

// 입력 허용 범위. 온도제어의 HH/H/L/LL처럼 실제 값을 받으면 이 표만 고치면 된다.
const RANGE = {
  sv: { min: 0, max: 1200 },
  p: { min: 0, max: 1200 },
  i: { min: 0, max: 2400 },
  d: { min: 0, max: 600 },
  refTemp: { min: 650, max: 1000 },
  manualMv: { min: 0, max: 100 },
};

/**
 * ADDTION CONTROL MOTOR VALVE 패널.
 *
 * 온도제어 화면과 같은 규칙을 따른다.
 *  - PV, MV      : PLC가 주는 현재값 → 표시 전용
 *  - 나머지       : 작업자 설정값 → 숫자패드로 입력
 *  - 자동모드에서는 MANUAL MV를 잠근다(제어기가 출력을 정하므로)
 *
 * @param data     { pv, sv, mv, p, i, d, refTemp, refTempReached, manualMv, manualMode }
 * @param onChange (field, value) => void
 */
export default function AtmosValvePanel({ data, onChange }) {
  const set = (field) => (value) => onChange(field, value);

  return (
    <div className="at-valve">
      <div className="at-valve-title">ADDTION CONTROL MOTOR VALVE</div>

      <div className="at-valve-body">
        <div className="at-valve-boxes">
          {/* 좌: 현재값 / 설정값 / 출력 */}
          <div className="at-box">
            <div className="at-field">
              <label>PV</label>
              <LedInput value={data.pv} color="red" unit="mmV" title="현재값(PV) — PLC 읽기 전용" readOnly />
            </div>
            <div className="at-field">
              <label>SV</label>
              <LedInput
                value={data.sv} onChange={set('sv')} color="green" unit="mmV"
                title="설정값(SV)" label="ADDTION VALVE 설정값 (SV)" {...RANGE.sv}
              />
            </div>
            <div className="at-field">
              <label>MV</label>
              <LedInput value={data.mv} color="orange" unit="%" title="출력(MV) — PLC 읽기 전용" readOnly />
            </div>
          </div>

          {/* 우: PID */}
          <div className="at-box">
            <div className="at-field">
              <label>P</label>
              <LedInput value={data.p} onChange={set('p')} color="blue"
                label="ADDTION VALVE 비례대 (P)" {...RANGE.p} />
            </div>
            <div className="at-field">
              <label>I</label>
              <LedInput value={data.i} onChange={set('i')} color="orange"
                label="ADDTION VALVE 적분시간 (I)" {...RANGE.i} />
            </div>
            <div className="at-field">
              <label>D</label>
              <LedInput value={data.d} onChange={set('d')} color="violet"
                label="ADDTION VALVE 미분시간 (D)" {...RANGE.d} />
            </div>
          </div>
        </div>

        {/* 허용 기준온도 — 램프는 도달 여부(PLC), 값은 작업자 설정 */}
        <div className="at-reftemp">
          <span className={`at-reftemp-lamp${data.refTempReached ? ' on' : ''}`} title="허용 기준온도 도달" />
          <span className="at-reftemp-label">허용 기준온도</span>
          <LedInput
            value={data.refTemp} onChange={set('refTemp')} color="green" unit="℃"
            title="허용 기준온도" label="분위기제어 허용 기준온도" {...RANGE.refTemp}
          />
        </div>

        {/* 자동/수동 표시 — 이 화면에서는 눌러서 바꾸는 것이 아니라 PLC 상태를 비추기만 한다.
            걸려 있는 쪽만 검게, 나머지는 회색으로 표시할 예정이라 지금은 둘 다 검은 글씨로 둔다
            (회색 처리는 .at-mode-item.off 클래스만 붙이면 된다). */}
        <div className="at-mode">
          <span className="at-mode-item">자동모드</span>
          <span className="at-mode-item">수동모드</span>
        </div>

        {/* 모드가 이 화면의 조작 대상이 아니게 되면서, MANUAL MV도 모드에 따라 흐려지지 않는다.
            항상 검은 글씨 + 입력 가능. */}
        <div className="at-manual">
          <span className="at-manual-label">MANUAL MV</span>
          <LedInput
            value={data.manualMv} onChange={set('manualMv')} color="green" unit="%"
            title="수동 출력량"
            label="ADDTION VALVE 수동 출력량 (MANUAL MV)"
            {...RANGE.manualMv}
          />
        </div>
      </div>
    </div>
  );
}
