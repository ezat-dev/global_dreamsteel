import { useEffect, useState } from 'react';
import { LedInput } from './HmiParts';
import { updateTrendRange } from '../../api/scada/trendApi';

/* ===========================================================================
   트렌드 선 하나의 y축 범위 수정 창 — 트렌드 오른쪽 판에서 범위 줄을 누르면 뜬다.

   값은 ez_scada.tb_temp_tag의 trend_min / trend_max에 저장되고 모든 기기가 같이 쓴다.
   비워 두면(NULL) 단위별 기본 범위로 그린다 — [기본값으로]가 그 상태로 되돌린다.

   숫자는 다른 화면처럼 숫자패드(LedInput)로 넣는다. 정수만 받는다(DB 컬럼이 int).
   음수는 받는다 — 보정값처럼 0 아래를 보고 싶은 선이 있을 수 있다.

   이 창은 트렌드 "제어" 권한이 있을 때만 열린다(TrendPage가 막는다). 서버는 화면 권한을
   보지 않는다 — 다른 화면과 같은 방식(UI 잠금만)이다.
   =========================================================================== */

/**
 * @param row       { key, label, color, unit }  — TrendPage의 VALUE_ROWS 한 줄
 * @param tempId    tb_temp_tag.temp_id — 이 선의 행
 * @param current   { min, max } 지금 그리는 범위(저장값이 없으면 기본 범위)
 * @param custom    true면 저장된 범위, false면 기본 범위를 쓰는 중
 * @param defaults  { min, max } 이 선 단위의 기본 범위
 * @param onClose   닫기
 * @param onSaved   저장·되돌리기가 끝난 뒤 — 범위 목록을 다시 받는 쪽에서 쓴다
 */
export default function TrendRangeModal({ row, tempId, current, custom, defaults, onClose, onSaved }) {
  const [min, setMin] = useState(String(current.min));
  const [max, setMax] = useState(String(current.max));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ESC로 닫기. 저장 중에는 무시한다. 숫자패드가 떠 있으면 그 ESC는 패드를 닫는 것이라
     넘긴다(패드가 스스로 닫는다) — 같이 닫으면 창까지 사라진다. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || submitting) return;
      if (document.querySelector('.hmi-pad')) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [submitting, onClose]);

  const run = (promise) => {
    setSubmitting(true);
    setError('');
    promise
      .then(() => {
        onSaved?.();
        onClose();
      })
      .catch((err) => setError(err.response?.data?.message ?? err.message ?? '범위를 저장하지 못했습니다.'))
      .finally(() => setSubmitting(false));
  };

  const handleSave = () => {
    const lo = Number(min);
    const hi = Number(max);
    // 서버도 같은 검사를 한다 — 왕복 없이 바로 알려 주려는 것이다
    if (!Number.isInteger(lo) || !Number.isInteger(hi)) {
      setError('최소·최대 모두 정수로 넣어 주세요.');
      return;
    }
    if (lo >= hi) {
      setError('최소는 최대보다 작아야 합니다.');
      return;
    }
    run(updateTrendRange(tempId, lo, hi));
  };

  // 저장값을 지운다(NULL) — 이후로는 단위별 기본 범위로 그린다
  const handleReset = () => run(updateTrendRange(tempId, null, null));

  return (
    <div
      className="hmi-umodal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="hmi-umodal tr-range-modal">
        <div className="hmi-umodal-title">
          <span style={{ color: row.color }}>{row.label}</span> y축 범위
        </div>

        <div className="hmi-umodal-body">
          <div className="hmi-umodal-row">
            <span className="hmi-umodal-rowlabel">최소</span>
            <LedInput
              value={min}
              onChange={(v) => { setMin(v); setError(''); }}
              color="green"
              unit={row.unit}
              label={`${row.label} 범위 최소`}
              title={`${row.label} 범위 최소`}
            />
          </div>

          <div className="hmi-umodal-row">
            <span className="hmi-umodal-rowlabel">최대</span>
            <LedInput
              value={max}
              onChange={(v) => { setMax(v); setError(''); }}
              color="green"
              unit={row.unit}
              label={`${row.label} 범위 최대`}
              title={`${row.label} 범위 최대`}
            />
          </div>

          <div className="hmi-umodal-hint">
            {custom
              ? `저장된 범위를 쓰는 중입니다.<br> 기본 범위는 ${defaults.min} ~ ${defaults.max} ${row.unit}입니다.`
              : `지금은 기본 범위(${defaults.min} ~ ${defaults.max} ${row.unit})를 쓰고 있습니다.`}
          </div>

          {error && <div className="hmi-umodal-error">{error}</div>}
        </div>

        <div className="hmi-umodal-foot">
          <button type="button" className="hmi-btn is-primary" onClick={handleSave} disabled={submitting}>
            {submitting ? '저장 중...' : '저장'}
          </button>
          {/* 이미 기본 범위면 되돌릴 것이 없다 — 눌러도 아무 일이 없는 버튼은 두지 않는다 */}
          <button
            type="button"
            className="hmi-btn"
            onClick={handleReset}
            disabled={submitting || !custom}
            title={custom ? '저장된 범위를 지우고 기본 범위로 그립니다' : '이미 기본 범위입니다'}
          >
            기본값으로
          </button>
          <button type="button" className="hmi-btn" onClick={onClose} disabled={submitting}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
