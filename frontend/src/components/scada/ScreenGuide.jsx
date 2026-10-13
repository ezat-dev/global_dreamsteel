import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import GUIDE_STEPS from './guideSteps';
import './ScreenGuide.css';

/* ===========================================================================
   화면 설명서 — 헤더의 ? 버튼으로 연다(ScadaLayout).

   그림을 따로 찍어 두지 않고 지금 화면 위에서 짚는다. 화면 전체를 어둡게 덮고 설명하는
   부분만 뚫어 테두리를 두르고, 설명 카드는 화면 구석에 고정해 띄운다(아래 CORNERS).
   카드는 이전/다음으로 넘기고, 넘길 때 움직이는 것은 짚는 테두리뿐이다.
   화면이 바뀌어도 설명서 그림을 다시 찍을 일이 없고, 한/영·태블릿 크기도 그대로 따라간다.

   단계와 짚을 곳은 guideSteps.js, 글자는 사전 guide.json(<화면key>.<id>.title / body)에 있다.

   보기만 하는 창이다 — 열려 있는 동안 뒤 화면은 눌리지 않는다(어두운 막이 받는다).
   조회 권한이라 화면이 잠겨(<fieldset disabled>) 있어도 쓸 수 있게 화면 틀(.hmi-root)에 그린다.
   =========================================================================== */

/** 짚는 상자를 대상보다 이만큼 넓힌다 — 테두리가 대상 글자에 붙지 않게 */
const PAD = 6;
/** 화면 가장자리에서 카드까지 띄우는 거리 */
const EDGE = 12;
/** 카드 폭 — 화면이 좁으면 거기에 맞춰 줄어든다 */
const CARD_W = 400;

/* 문구 속 [[on]] 같은 표시를 화면의 램프 색 점으로 바꾼다 — "초록이면 정상"을 글로만 쓰면
   현장에서 색을 바로 대 보기 어렵다. 쓸 수 있는 색은 램프 규칙과 같은 넷이다. */
const DOT_RE = /(\[\[(?:on|alarm|unknown|off)\]\])/;

function Line({ text }) {
  return String(text).split(DOT_RE).map((part, i) => {
    const m = part.match(/^\[\[(\w+)\]\]$/);
    // eslint-disable-next-line react/no-array-index-key
    return m ? <span key={i} className={`sg-dot is-${m[1]}`} aria-hidden="true" /> : part;
  });
}

/** 선택자에 걸리는 요소들을 모두 감싸는 상자(화면 좌표). 보이는 요소가 없으면 null */
function targetRect(selector) {
  if (!selector) return null;
  let els;
  try {
    els = [...document.querySelectorAll(selector)];
  } catch {
    return null;   // 선택자가 잘못됐으면 짚지 않는 카드로 — 설명서가 화면을 깨뜨리면 안 된다
  }
  const rects = els.map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  if (!rects.length) return null;
  return {
    left: Math.min(...rects.map((r) => r.left)) - PAD,
    top: Math.min(...rects.map((r) => r.top)) - PAD,
    right: Math.max(...rects.map((r) => r.right)) + PAD,
    bottom: Math.max(...rects.map((r) => r.bottom)) + PAD,
  };
}

/* 카드는 화면 구석 한 곳에 붙어 있고, 단계를 넘겨도 움직이지 않는다 — 짚는 테두리만 옮겨 다닌다.
   (예전에는 카드가 짚는 곳 옆을 따라다녀서 넘길 때마다 화면 여기저기로 튀어 정신없었다.)

   기본은 오른쪽 아래. 아래쪽 끝을 기준으로 붙이므로 장마다 글 양이 달라 카드 높이가 바뀌어도
   [이전]/[다음] 버튼 자리는 그대로다. 짚는 곳이 그 구석에 걸릴 때만 다음 구석으로 옮긴다:
   오른쪽 아래 → 왼쪽 아래 → 오른쪽 위 → 왼쪽 위. 넷 다 걸리면(설비 그림처럼 화면을 거의 다
   짚을 때) 가장 덜 가리는 구석에 둔다. */
const CORNERS = ['br', 'bl', 'tr', 'tl'];

const cornerStyle = (c) => ({
  [c[0] === 'b' ? 'bottom' : 'top']: EDGE,
  [c[1] === 'r' ? 'right' : 'left']: EDGE,
});

/** 짚는 상자를 가리지 않는 첫 구석. 다 가리면 가장 덜 가리는 구석 */
function pickCorner(rect, w, h) {
  if (!rect) return CORNERS[0];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cover = (c) => {
    const left = c[1] === 'r' ? vw - EDGE - w : EDGE;
    const top = c[0] === 'b' ? vh - EDGE - h : EDGE;
    const x = Math.max(0, Math.min(left + w, rect.right) - Math.max(left, rect.left));
    const y = Math.max(0, Math.min(top + h, rect.bottom) - Math.max(top, rect.top));
    return x * y;
  };
  const free = CORNERS.find((c) => cover(c) === 0);
  if (free) return free;
  return CORNERS.reduce((best, c) => (cover(c) < cover(best) ? c : best), CORNERS[0]);
}

const sameRect = (a, b) => (!a && !b) || (a && b
  && Math.abs(a.left - b.left) < 1 && Math.abs(a.top - b.top) < 1
  && Math.abs(a.right - b.right) < 1 && Math.abs(a.bottom - b.bottom) < 1);

/**
 * @param screenKey scadaMenu의 key — 어느 화면의 설명서인지
 * @param onClose   닫기
 */
export default function ScreenGuide({ screenKey, onClose }) {
  const { t } = useTranslation('guide');
  const steps = GUIDE_STEPS[screenKey] ?? [];
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [corner, setCorner] = useState(CORNERS[0]);
  const cardRef = useRef(null);
  const nextRef = useRef(null);

  const step = steps[index];
  const total = steps.length;
  const last = index === total - 1;
  const base = `${screenKey}.${step?.id}`;
  const lines = t(`${base}.body`, { returnObjects: true });
  const body = Array.isArray(lines) ? lines : [String(lines ?? '')];

  const go = useCallback((n) => setIndex((i) => Math.min(Math.max(n(i), 0), total - 1)), [total]);

  /* 단계가 바뀌면 대상을 화면 안으로 끌어온다(본문이 스크롤되는 화면이 있다) */
  useEffect(() => {
    if (!step?.target) return;
    try {
      document.querySelector(step.target)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } catch {
      // 잘못된 선택자 — 아래 targetRect도 null을 돌려 짚지 않는 카드가 된다
    }
  }, [step]);

  /* 짚을 상자를 잰다. 값이 들어오며 판 크기가 바뀌거나, 창 크기·스크롤이 바뀔 수 있어
     열려 있는 동안 짧게 되풀이해 잰다(바뀌었을 때만 다시 그린다). */
  useEffect(() => {
    const measure = () => setRect((prev) => {
      const next = targetRect(step?.target);
      return sameRect(prev, next) ? prev : next;
    });
    measure();
    const timer = setInterval(measure, 300);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  /* 카드 구석 — 카드 높이는 글 양에 따라 달라서 그려 본 뒤에 재고 정한다 */
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    setCorner(pickCorner(rect, card.offsetWidth, card.offsetHeight));
  }, [rect, index, body.length, t]);

  // 키보드 — ← → 로 넘기고 Esc로 닫는다
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go((i) => i + 1);
      else if (e.key === 'ArrowLeft') go((i) => i - 1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [go, onClose]);

  // 열면 '다음' 버튼에 포커스 — 키보드만으로도 바로 넘길 수 있게
  useEffect(() => { nextRef.current?.focus(); }, []);

  if (!step) return null;

  const title = t(`${base}.title`);
  const guide = (
    <div className="hmi-dark sg-root" role="dialog" aria-modal="true" aria-label={t('ui.open')}>
      {/* 뒤 화면을 막는 판. 짚는 곳이 있으면 투명하게 두고 어둠은 뚫린 상자의 그림자가 만든다 */}
      <div className={`sg-backdrop${rect ? '' : ' is-dim'}`} onMouseDown={onClose} />
      {rect && (
        <div
          className="sg-hole"
          style={{ left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top }}
        />
      )}

      <div
        ref={cardRef}
        className="sg-card"
        style={{
          width: `min(${CARD_W}px, calc(100vw - ${EDGE * 2}px))`,
          ...cornerStyle(corner),
        }}
      >
        <div className="sg-head">
          <span className="sg-count">{t('ui.count', { n: index + 1, total })}</span>
          <span className="sg-title">{title}</span>
          <button type="button" className="sg-close" onClick={onClose} aria-label={t('ui.close')} title={t('ui.close')}>
            <IconX size={18} />
          </button>
        </div>

        <ul className="sg-body">
          {body.map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i}><Line text={line} /></li>
          ))}
        </ul>

        <div className="sg-foot">
          <div className="sg-dots">
            {steps.map((s, i) => (
              <button
                type="button"
                key={s.id}
                className={`sg-dotbtn${i === index ? ' is-current' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={t('ui.goto', { n: i + 1 })}
                title={t(`${screenKey}.${s.id}.title`)}
              />
            ))}
          </div>
          <div className="sg-nav">
            <button type="button" className="sg-btn" onClick={() => go((i) => i - 1)} disabled={index === 0}>
              <IconChevronLeft size={16} />
              {t('ui.prev')}
            </button>
            <button
              ref={nextRef}
              type="button"
              className="sg-btn is-primary"
              onClick={() => (last ? onClose() : go((i) => i + 1))}
            >
              {last ? t('ui.done') : t('ui.next')}
              {!last && <IconChevronRight size={16} />}
            </button>
          </div>
        </div>
        <div className="sg-keys">{t('ui.keys')}</div>
      </div>
    </div>
  );

  // 화면 틀(.hmi-root) 안, 본문 fieldset 밖에 그린다 — 글꼴·토큰은 틀의 것을 그대로 쓴다
  return createPortal(guide, document.querySelector('.hmi-root') ?? document.body);
}
