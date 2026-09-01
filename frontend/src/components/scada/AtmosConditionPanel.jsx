/**
 * 분위기 제어 자동모드 동작 조건 — 자동모드로 넘어가기 위한 전제 조건 램프판.
 *
 * 조작하는 곳이 아니라 PLC 상태를 그대로 비추는 표시등이라 클릭 대상이 아니다.
 * 값은 PLC 폴링으로 채우고, 여기서는 받은 on/off만 그린다.
 *
 * @param conditions [{ key, label, on }]
 */
export default function AtmosConditionPanel({ conditions }) {
  return (
    <div className="at-cond">
      <div className="at-cond-title">분위기 제어 자동모드 동작 조건</div>

      <div className="at-cond-body">
        {conditions.map((c) => (
          <div className="at-cond-row" key={c.key}>
            <span className={`at-cond-lamp${c.on ? ' on' : ''}`} />
            <span className="at-cond-text">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
