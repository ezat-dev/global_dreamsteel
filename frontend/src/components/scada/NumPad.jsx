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
 * @param decimals 소수 자릿수. 기본 0이면 소수점을 막는다(아래 allowDecimal 참고).
 * @param anchor  누른 칸의 화면상 위치 { left, top, bottom }
 * @param onCommit(value) 입력 확정
 * @param onCancel        취소
 */
export default function NumPad({
  label, value, unit, min, max, decimals = 0, anchor, onCommit, onCancel,
}) {
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

  /* min이 0 이상이면 음수를 받지 않는다. 지연시간·개도처럼 음수가 뜻이 없는 칸이다. */
  const allowNegative = min == null || min < 0;

  /* 소수점은 기본으로 막는다.

     PLC에서 읽고 쓰는 값이 전부 정수다 — C#이 워드를 BitConverter.ToUInt16으로 읽고,
     여러 워드짜리도 비트를 이어 붙여 정수로만 만든다(float 변환 코드가 아예 없다).
     소수가 나오는 곳은 온도 태그뿐인데, 그것도 PLC가 소수를 주는 게 아니라 읽은 정수에
     tb_temp_tag.scale의 식을 C#이 붙이는 것이고 화면이 쓰는 folders_tags에는 그 칸이 없다.

     받아 놓고 반올림하지 않고 아예 막는 이유는, 30.5를 넣었는데 31이 들어가면
     작업자가 그 사실을 모르기 때문이다. 담을 데가 없는 값이면 못 넣는다고 알려 주는
     편이 낫다 — 위 음수 처리와 같은 생각이다.

     PLC 값에 소수가 필요해지면 화면만으로 끝나지 않는다. C#이 읽기·쓰기 양쪽에서
     자릿수를 다루게 해야 보이는 값과 들어가는 값이 맞는다.

     decimals는 PLC가 아닌 값에만 연다 — 엔지니어링 화면의 버튼 누름 시간(초, 소수 한 자리)은
     DB에 ms 정수로 들어가서, 화면이 1.5초를 1500으로 바꿔 넣으면 잘리는 자리가 없다. */
  const allowDecimal = decimals > 0;

  /* 못 누르는 키를 눌렀을 때 뜨는 문구. 다음 입력에서 지운다.
     키를 disabled로만 두면 터치 화면에서는 눌러도 아무 일이 없어서 고장으로 읽힌다 —
     왜 안 되는지 글로 알려 줘야 한다(설명이 title에만 있으면 마우스에서만 보인다). */
  const [blockMsg, setBlockMsg] = useState('');

  const press = (key) => {
    if (key === '-' && !allowNegative) {
      setBlockMsg('음수는 입력할 수 없습니다');
      return;
    }
    if (key === '.' && !allowDecimal) {
      setBlockMsg('소수점은 입력할 수 없습니다');
      return;
    }
    /* 자릿수를 넘는 숫자는 받지 않는다 — 받아 놓고 반올림하면 넣은 값과 들어간 값이 달라진다
       (위 소수점 처리와 같은 생각). 패드를 막 연 상태(fresh)면 새로 쓰는 것이라 막지 않는다. */
    if (allowDecimal && key >= '0' && key <= '9' && !fresh) {
      const dot = draft.indexOf('.');
      if (dot >= 0 && draft.length - dot - 1 >= decimals) {
        setBlockMsg(`소수점 ${decimals}자리까지만 입력할 수 있습니다`);
        return;
      }
    }
    setBlockMsg('');

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
    setBlockMsg('');
    setDraft((prev) => (fresh ? '' : prev.slice(0, -1)));
    setFresh(false);
  };

  const clear = () => {
    setBlockMsg('');
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

  let hint = rangeText ? `범위 ${rangeText}` : '';
  if (blockMsg) hint = blockMsg;
  else if (underMin) hint = `${min} 이상만 입력할 수 있습니다`;
  else if (overMax) hint = `${max} 이하만 입력할 수 있습니다`;
  else if (isBlank) hint = rangeText ? `범위 ${rangeText}` : '값을 입력하세요';

  return createPortal((
    /* onContextMenu — 이 패드는 portal로 document.body에 붙어서 ScadaLayout의
       롱프레스 메뉴 차단이 닿지 않는다. 숫자키를 조금 오래 누르면 태블릿에서
       다운로드·공유 메뉴가 뜨므로 여기서도 따로 막는다. */
    <div
      className="hmi-pad-overlay"
      onMouseDown={onCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
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

        <div className={`hmi-pad-hint${blockMsg || underMin || overMax ? ' error' : ''}`}>{hint}</div>

        <div className="hmi-pad-keys">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
            <button type="button" key={k} className="hmi-pad-key" onClick={() => press(k)}>{k}</button>
          ))}
          <button
            type="button"
            className="hmi-pad-key"
            onClick={() => press('-')}
            title={allowNegative ? '부호 바꾸기' : '음수는 입력할 수 없습니다'}
          >
            −
          </button>
          <button type="button" className="hmi-pad-key" onClick={() => press('0')}>0</button>
          {/* 못 쓰는 키도 남겨 둔다 — 없애면 키 배치가 달라져 손이 기억한 자리가 어긋나고,
              눌렀을 때 왜 안 되는지 알려 줄 자리도 없어진다(음수 키와 같은 처리). */}
          <button
            type="button"
            className="hmi-pad-key"
            onClick={() => press('.')}
            title={allowDecimal ? '소수점' : '소수점은 입력할 수 없습니다'}
          >
            .
          </button>
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
