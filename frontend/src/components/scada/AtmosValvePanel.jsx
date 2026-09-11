import { LedInput } from './HmiParts';
import { TAG_OFF, TAG_ON, TAG_UNKNOWN, lampClassOf, lampOf, tagState } from '../../api/scada/foldertagApi';

/* 자동/수동 모드 — 누르면 자기 태그에 1, 반대쪽에 0이 나가고 그대로 남는다(래치).
   위쪽 OPEN/CLOSE와 같은 방식이다.

   램프 극성이 두 칸에서 다르다:
     자동모드 add_valve_auto_cmd_lamp   (M626)  1일 때 초록
     수동모드 add_valve_manual_cmd_lamp (M627)  0일 때 초록  ← 반대다
   PLC가 그렇게 주는 것이라 여기서 맞춰 읽는다. 둘을 같은 규칙으로 바꾸면 수동모드
   칸이 거꾸로 켜진다 — 한쪽만 보고 "통일"하지 말 것. */
const MODES = [
  { cmd: 'add_valve_auto_cmd', other: 'add_valve_manual_cmd', text: '자동모드', litWhen: TAG_ON },
  { cmd: 'add_valve_manual_cmd', other: 'add_valve_auto_cmd', text: '수동모드', litWhen: TAG_OFF },
];

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
 * @param data     { pv, sv, mv, p, i, d, refTemp, refTempReached, manualMv }
 * @param onChange (field, value) => void
 * @param values   폴링으로 받은 { 태그이름: 값 }
 * @param onPress  (자기태그, 반대태그) => void — 모드 칸 누름
 * @param heldTag  지금 누르고 있는 태그. 진행 바를 그리는 데 쓴다
 * @param holdMs   눌러야 하는 시간(ms)
 */
export default function AtmosValvePanel({
  data, onChange, values, onPress, heldTag = '', holdMs = 2000,
}) {
  const set = (field) => (value) => onChange(field, value);

  /* 자동모드인지. 자동 램프(M626)가 1이면 자동이다.
     못 읽었으면 null — 어느 모드인지 모르는 상태와 자동을 구분해야 한다. */
  const autoLamp = tagState(values?.[lampOf('add_valve_auto_cmd')]);
  const isAuto = autoLamp === TAG_UNKNOWN ? null : autoLamp === TAG_ON;

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

        {/* 자동/수동 — 글자 칸 자체가 램프이면서 버튼이다. 누르면 그 모드로 바뀐다.
            disabled를 걸지 않는다 — 비활성 요소는 뗌 이벤트를 못 받아서 시간을
            채우기 전에 떼도 취소가 안 된다. */}
        <div className="at-mode">
          {MODES.map((m) => (
            <button
              type="button"
              key={m.cmd}
              className={`at-mode-item hmi-lampbox${lampClassOf(values, m.cmd, ' is-on', m.litWhen)}`
                + (heldTag === m.cmd ? ' is-held' : '')}
              onPointerDown={() => onPress(m.cmd, m.other)}
              data-tag={m.cmd}
              title={`${holdMs / 1000}초 누르면 ${m.other}=0, ${m.cmd}=1`
                + ` / 램프 ${lampOf(m.cmd)} — ${m.litWhen === TAG_ON ? '1' : '0'}일 때 켜짐`}
            >
              {m.text}
              {heldTag === m.cmd && (
                <span className="at-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
              )}
            </button>
          ))}
        </div>

        {/* 자동모드에서는 PID가 출력을 정하므로 수동 출력량을 손대지 못하게 잠근다
            (온도제어 화면과 같은 규칙). 모드를 못 읽었으면 열어 둔다 — 실제로 수동인데
            잠가 버리면 정작 필요할 때 손을 못 댄다. */}
        <div className={`at-manual${isAuto === true ? ' is-off' : ''}`}>
          <span className="at-manual-label">MANUAL MV</span>
          <LedInput
            value={data.manualMv} onChange={set('manualMv')} color="green" unit="%"
            title="수동 출력량"
            label="ADDTION VALVE 수동 출력량 (MANUAL MV)"
            disabled={isAuto === true}
            {...RANGE.manualMv}
          />
        </div>
      </div>
    </div>
  );
}
