import { BarGauge, LedInput } from './HmiParts';
import { TAG_ON, TAG_UNKNOWN, lampOf, tagState } from '../../api/scada/foldertagApi';

const TEMP_TICKS = [1000, 800, 600, 400, 200, 0];
const MV_TICKS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

/* 칸별 입력 허용 범위. 숫자패드가 이 밖의 값은 확정하지 못하게 막는다.
   키는 태그 이름의 접미사다 — 화면 칸 이름과 태그 이름을 따로 두면 짝을 기억해야 한다.
   SV는 게이지 눈금(0~1000℃)과, 출력 관련은 0~100%와 맞췄고, 나머지는 지정받은 값이다. */
const RANGE = {
  sv_cmd: { min: 0, max: 1000 },
  alarm_hh: { min: 0, max: 500 },
  alarm_h: { min: 0, max: 200 },
  alarm_l: { min: 0, max: 200 },
  alarm_ll: { min: 0, max: 400 },
  pid_p: { min: 0, max: 1200 },
  pid_i: { min: 0, max: 2400 },
  pid_d: { min: 0, max: 600 },
  range_hi: { min: 0, max: 100 },
  range_lo: { min: 0, max: 100 },
  manual_mv: { min: 0, max: 100 },
};

/**
 * ZONE 1개짜리 온도제어 패널. 값은 전부 PLC 태그에서 온다(자동/수동 버튼만 아직 더미).
 *
 *   PV       tic_zN_pv         D101   읽기 전용
 *   SV       tic_zN_sv         D100   읽기 — Working SV(제어기가 지금 실제로 쓰는 목표값)
 *            tic_zN_sv_cmd     R100   쓰기 — 작업자가 넣는 목표값
 *   MV       tic_zN_mv         D102   읽기 전용
 *   PID      tic_zN_pid_p/i/d  R101~103  읽기+쓰기(한 레지스터)
 *   MANUAL   tic_zN_manual_mv  R104      읽기+쓰기
 *   출력제한 tic_zN_range_hi/lo R105~106 읽기+쓰기
 *   경보기준 tic_zN_alarm_hh/h/l/ll R110~113 읽기+쓰기
 *
 * SV만 읽는 곳과 쓰는 곳이 다르다. PLC 설계가 그렇다 — 램프 프로그램이 돌면 930을
 * 넣어도 Working SV는 850→880→910으로 서서히 올라간다. 그래서 칸에는 D100(실제 적용 중)을
 * 보여주고 입력은 R100으로 보낸다. R100을 되돌려 보여주면 PLC가 어디까지 왔는지 알 수 없다.
 * 나머지 R 항목은 한 레지스터를 읽고 쓰므로 태그가 하나뿐이고, 그래서 이름에 _cmd가 없다.
 *
 * 자동/수동 모드는 momentary 비트다:
 *   tic_zN_mode_cmd       M330~  누르는 동안 1, 떼면 0 (전환 요청)
 *   tic_zN_mode_cmd_lamp  M630~  0 → 자동(초록), 1 → 수동(빨강)
 * 램프가 0일 때 자동인 점을 주의 — 보통과 반대다(PLC가 그렇게 준다).
 *
 * @param zoneNo 존 번호(1~7). 태그 이름을 이걸로 조립한다
 * @param values 폴링으로 받은 { 태그이름: 값 }. null이면 아직 못 받은 상태
 * @param onWrite (tagName, number) => Promise — 숫자 쓰기(숫자패드)
 * @param onModePress (tagName) => void — 모드 버튼 누름. 뗌은 화면이 window에서 받는다
 * @param heldTag 지금 누르고 있는 태그. 진행 바를 그리는 데 쓴다
 * @param holdMs 눌러야 하는 시간(ms). 진행 바 애니메이션 길이와 같은 값이어야 한다
 */
export default function TempZonePanel({
  zoneNo, values, onWrite, onModePress, heldTag = '', holdMs = 2000,
}) {
  /* 접두사 tic_ = TIC(Temperature Indicating Controller). PLC 주소표가 쓰는 표기와 같다
     ("TIC Temperature PV", "TIC PID (P) SV"). tc_로 쓰면 이 분야에서 써모커플로 읽힌다. */
  const tag = (suffix) => `tic_z${zoneNo}_${suffix}`;
  const raw = (suffix) => values?.[tag(suffix)];

  /* 값을 못 받았으면 0이 아니라 '---'로 보여준다.
     읽지 못한 온도를 0으로 그리면 노가 식은 것으로 오해한다 — 숫자 칸에서는
     램프의 점선 표시에 해당하는 처리다. */
  const text = (suffix) => {
    const v = raw(suffix);
    return v == null || v === '' ? '---' : String(v);
  };

  /* 숫자패드가 문자열을 준다. C#은 int로 받으므로 정수로 맞춘다 —
     소수점이 섞이면 바인딩에서 400이 떨어져서 원인 찾기가 어렵다. */
  const writeNumber = (suffix, value) => {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return;
    onWrite(tag(suffix), n);
  };

  /** 한 레지스터를 읽고 쓰는 칸(R 영역) — 표시·입력·범위·툴팁을 한 번에 붙인다. */
  const rwProps = (suffix, label) => ({
    value: text(suffix),
    onChange: (v) => writeNumber(suffix, v),
    title: `${label} / ${tag(suffix)}`,
    label: `${zoneNo}ZONE ${label}`,
    ...RANGE[suffix],
  });

  /* 자동/수동 모드. 램프가 1이면 수동, 0이면 자동이다 — 다른 램프와 반대라
     tagState 결과를 그대로 "켜짐=정상"으로 읽으면 안 된다.
     못 읽었으면 null로 두고 '---'을 보여준다: 어느 모드인지 모르는데 초록으로
     그려 놓으면 자동으로 돌고 있다고 오해한다. */
  const modeCmd = tag('mode_cmd');
  const modeLamp = tagState(values?.[lampOf(modeCmd)]);
  const manualMode = modeLamp === TAG_UNKNOWN ? null : modeLamp === TAG_ON;
  const modeText = manualMode === null ? '---' : manualMode ? '수동모드' : '자동모드';
  const modeClass = manualMode === null ? 'is-unknown' : manualMode ? 'manual' : 'auto';

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
            <BarGauge label="PV" color="red" value={raw('pv')} max={1000} ticks={TEMP_TICKS} />
            <LedInput
              value={text('pv')} color="red" unit="℃" readOnly
              title={`현재값(PV) — 읽기 전용 / ${tag('pv')}`}
            />
          </div>
          <div className="tz-gauge-col">
            {/* 게이지와 칸은 Working SV(D100)를 보여주고, 입력은 R100으로 나간다 */}
            <BarGauge label="SV" color="green" value={raw('sv')} max={1000} ticks={TEMP_TICKS} />
            <LedInput
              value={text('sv')} onChange={(v) => writeNumber('sv_cmd', v)}
              color="green" unit="℃"
              title={`설정값(SV) — 표시 ${tag('sv')} / 입력 ${tag('sv_cmd')}`}
              label={`${zoneNo}ZONE 설정값 (SV)`} {...RANGE.sv_cmd}
            />
          </div>
          <div className="tz-gauge-col">
            <BarGauge label="MV" color="blue" value={raw('mv')} max={100} ticks={MV_TICKS} />
            <LedInput
              value={text('mv')} color="blue" unit="%" readOnly
              title={`출력(MV) — 읽기 전용 / ${tag('mv')}`}
            />
          </div>
        </div>

        {/* 하단 — 수동/자동 모드 버튼 + 수동 출력량.
            버튼은 "지금 어느 모드인지"를 보여준다(빨강=수동, 초록=자동).
            자동모드에서는 PID가 출력을 정하므로 수동 출력량은 손대지 못하게 잠근다.

            누르면 바로 나가지 않고 holdMs만큼 눌러야 전환 요청(1)이 나간다 —
            지나가다 스친 것으로 제어 모드가 바뀌면 안 된다. 뗌은 화면(TempPage)이
            window에서 받으므로 여기서는 누름만 알린다.
            disabled를 쓰지 않는다: 누른 뒤 비활성화되면 뗌 이벤트가 오지 않아
            비트가 1로 남는다. */}
        <div className="tz-foot">
          <button
            type="button"
            className={`tz-mode-btn ${modeClass}${heldTag === modeCmd ? ' is-held' : ''}`}
            onPointerDown={() => onModePress(modeCmd)}
            data-tag={modeCmd}
            title={`모드 전환 ${modeCmd} / 램프 ${lampOf(modeCmd)}`
              + ` — ${holdMs / 1000}초 누르면 전송 (램프 0=자동, 1=수동)`}
          >
            {modeText}
            {heldTag === modeCmd && (
              <span className="tz-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
            )}
          </button>

          {/* 잠금은 램프(PLC가 실제로 어느 모드인지)를 따른다.
              모드를 못 읽었으면 열어 둔다 — 수동일 수도 있는데 잠가 버리면
              정작 필요할 때 손을 못 댄다. */}
          <div className={`tz-manual-mv${manualMode === false ? ' is-off' : ''}`}>
            <div className="tz-manual-mv-label">수동 출력량(MV)</div>
            <LedInput
              {...rwProps('manual_mv', '수동 출력량 (MV)')}
              color="green"
              unit="%"
              disabled={manualMode === false}
            />
          </div>
        </div>
        </div>

        {/* 우측 세로 열 — 경보 설정 / PID / 출력 제한 */}
        <div className="tz-side">
          <div className="tz-side-group">
            <div className="tz-field"><label>HH</label>
              <LedInput {...rwProps('alarm_hh', '상상한 경보 (HH)')} color="red" size="sm" /></div>
            <div className="tz-field"><label>H</label>
              <LedInput {...rwProps('alarm_h', '상한 경보 (H)')} color="orange" size="sm" /></div>
            <div className="tz-field"><label>L</label>
              <LedInput {...rwProps('alarm_l', '하한 경보 (L)')} color="yellow" size="sm" /></div>
            <div className="tz-field"><label>LL</label>
              <LedInput {...rwProps('alarm_ll', '하하한 경보 (LL)')} color="yellow" size="sm" /></div>
          </div>

          <div className="tz-side-group">
            <div className="tz-field"><label>P</label>
              <LedInput {...rwProps('pid_p', '비례대 (P)')} color="white" size="sm" /></div>
            <div className="tz-field"><label>I</label>
              <LedInput {...rwProps('pid_i', '적분시간 (I)')} color="white" size="sm" /></div>
            <div className="tz-field"><label>D</label>
              <LedInput {...rwProps('pid_d', '미분시간 (D)')} color="white" size="sm" /></div>
          </div>

          <div className="tz-side-group tz-limit">
            <div className="tz-limit-title">출력 LIMIT<br />(MV%)</div>
            <div className="tz-field"><label>상한</label>
              <LedInput {...rwProps('range_hi', '출력 상한 (MV%)')} color="yellow" size="sm" /></div>
            <div className="tz-field"><label>하한</label>
              <LedInput {...rwProps('range_lo', '출력 하한 (MV%)')} color="yellow" size="sm" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
