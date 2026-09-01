import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const GAP = 6;     // 누른 칸과 패드 사이 간격
const MARGIN = 8;  // 화면 가장자리 최소 여백

/**
 * 숫자 입력 패드.
 *
 * 현장 터치 패널에는 키보드가 없으므로, LED 칸을 누르면 이 패드가 뜨고 숫자를 찍은 뒤
 * "입력"을 눌러야 값이 반영된다. 취소하면 원래 값이 그대로 남는다.
 *
 * 화면 가운데가 아니라 누른 칸 바로 아래에 붙여서, 지금 어느 값을 고치는 중인지
 * 눈으로 바로 알 수 있게 한다.
 *
 * 물리 키보드로도 칠 수 있게 해뒀다(숫자/./Backspace/Enter/Esc) — 개발·사무실 PC에서
 * 마우스로만 찍는 건 너무 느리기 때문.
 *
 * @param label   패드 상단에 띄울 항목 이름
 * @param value   현재 값(문자열)
 * @param unit    단위 표시(℃, % 등)
 * @param min/max 허용 범위. 벗어나면 "입력" 버튼이 잠긴다.
 * @param anchor  누른 칸의 화면상 위치 { left, top, bottom }
 * @param onCommit(value) 입력 확정
 * @param onCancel        취소
 */
export default function NumPad({ label, value, unit, min, max, anchor, onCommit, onCancel }) {
  // 패드를 연 직후 첫 숫자를 누르면 기존 값을 지우고 새로 쓰기 시작한다(계장 패드 관행).
  // 지우기/백스페이스를 한 번이라도 쓰면 그때부턴 이어쓰기가 된다.
  const [draft, setDraft] = useState(String(value ?? ''));
  const [fresh, setFresh] = useState(true);

  // 패드 실제 크기를 재서 위치를 잡는다. 크기를 상수로 박아두면 글자 수나 안내문 때문에
  // 높이가 달라질 때 화면 밖으로 밀려나므로, 그린 뒤 재서 맞춘다.
  const padRef = useRef(null);
  const [pos, setPos] = useState(null);

  /* 패드를 어디에 그릴지 — 화면 최상위 래퍼(.hmi-root)에 따로 그린다(포털).

     패드는 뷰포트 좌표로 위치를 잡고 position: fixed로 띄우는데, CSS에서는 transform이
     걸린 조상이 있으면 그 안의 fixed 자손이 뷰포트가 아니라 그 조상을 기준으로 배치된다.
     구동화면은 설비 그림을 transform: scale로 줄여 넣어서, 그 안의 칸을 누르면 좌표가
     축소된 무대 기준으로 해석돼 엉뚱한 곳에 떴다.

     body가 아니라 .hmi-root로 빼는 이유는 --hmi-* 토큰이 .hmi-root에 선언돼 있어서다.
     body로 빼면 var(--hmi-panel) 같은 값이 전부 비어 패드가 투명해진다.
     한 번 잡아 두면 패드가 열려 있는 동안 바뀌지 않는다. */
  const hostRef = useRef(null);
  if (!hostRef.current) {
    hostRef.current = document.querySelector('.hmi-root') ?? document.body;
  }

  useLayoutEffect(() => {
    const el = padRef.current;
    if (!el || !anchor) return;

    const { width, height } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 가로: 누른 칸의 왼쪽에 맞추되 오른쪽 화면 밖으로 나가면 당겨온다
    let left = anchor.left;
    if (left + width > vw - MARGIN) left = vw - width - MARGIN;
    if (left < MARGIN) left = MARGIN;

    // 세로: 기본은 바로 아래. 아래가 모자라면 위로 뒤집고, 위도 모자라면 화면 안으로만 맞춘다
    let top = anchor.bottom + GAP;
    if (top + height > vh - MARGIN) {
      const above = anchor.top - height - GAP;
      top = above >= MARGIN ? above : Math.max(MARGIN, vh - height - MARGIN);
    }

    setPos({ left, top });
  }, [anchor]);

  // 패드는 화면 좌표에 고정돼 있어서, 뒤 화면이 스크롤되면 엉뚱한 곳을 가리키게 된다.
  // 따라다니게 만드는 대신 그냥 닫는다(입력 중이던 값은 버려진다 — 확정 전이므로 안전).
  useEffect(() => {
    window.addEventListener('scroll', onCancel, true);
    window.addEventListener('resize', onCancel);
    return () => {
      window.removeEventListener('scroll', onCancel, true);
      window.removeEventListener('resize', onCancel);
    };
  }, [onCancel]);

  const num = Number(draft);
  const isBlank = draft.trim() === '';
  const isNumber = !isBlank && Number.isFinite(num);
  const underMin = isNumber && min != null && num < min;
  const overMax = isNumber && max != null && num > max;
  const canCommit = isNumber && !underMin && !overMax;

  const press = (key) => {
    setDraft((prev) => {
      const base = fresh ? '' : prev;
      if (key === '.') {
        if (base.includes('.')) return base;
        return base === '' ? '0.' : base + '.';
      }
      if (key === '-') {
        return base.startsWith('-') ? base.slice(1) : `-${base}`;
      }
      // 앞자리 0이 계속 쌓이는 것만 막는다("007" → "7")
      if (base === '0') return key;
      if (base === '-0') return `-${key}`;
      return base + key;
    });
    setFresh(false);
  };

  const backspace = () => {
    setDraft((prev) => (fresh ? '' : prev.slice(0, -1)));
    setFresh(false);
  };

  const clear = () => {
    setDraft('');
    setFresh(false);
  };

  const commit = () => {
    if (canCommit) onCommit(draft);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') { press(e.key); e.preventDefault(); return; }
      if (e.key === '.') { press('.'); e.preventDefault(); return; }
      if (e.key === '-') { press('-'); e.preventDefault(); return; }
      if (e.key === 'Backspace') { backspace(); e.preventDefault(); return; }
      if (e.key === 'Delete') { clear(); e.preventDefault(); return; }
      if (e.key === 'Enter') { commit(); e.preventDefault(); return; }
      if (e.key === 'Escape') { onCancel(); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const rangeText = min != null && max != null ? `${min} ~ ${max}` : null;
  const allowNegative = min == null || min < 0;

  let hint = rangeText ? `범위 ${rangeText}` : '';
  if (underMin) hint = `${min} 이상만 입력할 수 있습니다`;
  else if (overMax) hint = `${max} 이하만 입력할 수 있습니다`;
  else if (isBlank) hint = rangeText ? `범위 ${rangeText}` : '값을 입력하세요';

  return createPortal((
    <div className="hmi-pad-overlay" onMouseDown={onCancel}>
      {/* 패드 내부 클릭이 오버레이(=취소)로 전달되지 않게 막는다.
          위치를 재기 전(pos === null) 한 프레임은 숨겨서 왼쪽 위에 번쩍이지 않게 한다. */}
      <div
        ref={padRef}
        className="hmi-pad"
        style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="hmi-pad-title">{label}</div>

        <div className="hmi-pad-display">
          <span className="hmi-pad-value">{draft || '0'}</span>
          {unit && <span className="hmi-pad-unit">{unit}</span>}
        </div>

        <div className={`hmi-pad-hint${underMin || overMax ? ' error' : ''}`}>{hint}</div>

        <div className="hmi-pad-keys">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
            <button type="button" key={k} className="hmi-pad-key" onClick={() => press(k)}>{k}</button>
          ))}
          <button
            type="button"
            className="hmi-pad-key"
            onClick={() => press('-')}
            disabled={!allowNegative}
            title={allowNegative ? '부호 바꾸기' : '음수는 입력할 수 없습니다'}
          >
            −
          </button>
          <button type="button" className="hmi-pad-key" onClick={() => press('0')}>0</button>
          <button type="button" className="hmi-pad-key" onClick={() => press('.')}>.</button>
        </div>

        <div className="hmi-pad-edit">
          <button type="button" className="hmi-pad-key wide" onClick={clear}>지우기</button>
          <button type="button" className="hmi-pad-key wide" onClick={backspace}>←</button>
        </div>

        <div className="hmi-pad-foot">
          <button type="button" className="hmi-pad-cancel" onClick={onCancel}>취 소</button>
          <button type="button" className="hmi-pad-ok" onClick={commit} disabled={!canCommit}>입 력</button>
        </div>
      </div>
    </div>
  ), hostRef.current);
}
