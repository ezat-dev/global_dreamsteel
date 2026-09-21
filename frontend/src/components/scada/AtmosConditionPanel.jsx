/**
 * 분위기 제어 자동모드 동작 조건 — 자동모드로 넘어가기 위한 전제 조건 램프판.
 *
 * 조작하는 곳이 아니라 PLC 상태를 그대로 비추는 표시등이라 클릭 대상이 아니다.
 * 값을 보고 색을 정하는 일은 부르는 쪽(AtmospherePage)이 한다 — 줄마다 초록이 되는
 * 값이 달라서(greenWhen), 여기서는 받은 클래스를 붙이기만 한다.
 *
 * @param conditions [{ key, label, tag, lamp }]
 *                   lamp는 램프에 붙일 클래스(' on' / ' alarm' / ' unknown')
 */
export default function AtmosConditionPanel({ conditions }) {
  return (
    <div className="at-cond">
      <div className="at-cond-title">분위기 제어 자동모드 동작 조건</div>

      <div className="at-cond-body">
        {conditions.map((c) => (
          <div
            className="at-cond-row"
            key={c.key}
            data-tag={c.tag}
            title={`${c.label} — 읽기 전용 / ${c.tag}`}
          >
            <span className={`at-cond-lamp${c.lamp ?? ''}`} />
            <span className="at-cond-text">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
