/**
 * 아직 내용을 만들지 않은 SCADA 화면의 자리 표시.
 * 각 화면 작업을 시작할 때 이 컴포넌트를 지우고 실제 계장 화면을 그려 넣으면 된다.
 */
export default function ScadaPlaceholder({ title, desc }) {
  return (
    <div className="hmi-placeholder">
      <div className="hmi-placeholder-title">{title}</div>
      <div className="hmi-placeholder-desc">{desc ?? '화면 내용은 아직 작업 전입니다.'}</div>
    </div>
  );
}
