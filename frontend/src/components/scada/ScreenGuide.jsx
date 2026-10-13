import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import GUIDE_STEPS from './guideSteps';
import './ScreenGuide.css';

/* ===========================================================================
   화면 설명서 — 헤더의 ? 버튼으로 연다(ScadaLayout).

   그림을 따로 찍어 두지 않고 지금 화면 위에서 짚는다. 설명은 화면 오른쪽에 붙는 패널에
   나오고, 왼쪽 화면은 어둡게 덮은 채 설명하는 부분만 뚫어 테두리를 두른다.
   화면이 바뀌어도 설명서 그림을 다시 찍을 일이 없고, 한/영·태블릿 크기도 그대로 따라간다.

   패널은 늘 같은 자리다 — 넘길 때 움직이는 것은 짚는 테두리뿐이다.
   (처음엔 카드가 짚는 곳 옆을 따라다녔고, 다음엔 화면 구석에 띄웠다가 짚는 곳을 피해
   구석을 옮겼는데 둘 다 "왔다 갔다 해서 정신없다"고 해서 패널로 바꿨다.)
   패널이 화면을 가리지 않게, 열려 있는 동안은 화면 전체(.hmi-shell)를 패널 폭만큼 통째로
   축소해 왼쪽에 둔다(ScadaLayout이 .hmi-root에 has-guide를 붙이고, 배율은 아래 effect가 넣는다).
   배치를 다시 잡지 않고 줄이기만 하므로 화면 모양은 평소와 똑같다.

   단계와 짚을 곳은 guideSteps.js, 글자는 사전 guide.json(<화면key>.<id>.title / body)에 있다.

   보기만 하는 창이다 — 열려 있는 동안 뒤 화면은 눌리지 않는다(어두운 막이 받는다).
   조회 권한이라 화면이 잠겨(<fieldset disabled>) 있어도 쓸 수 있게 화면 틀(.hmi-root)에 그린다.
   =========================================================================== */

/** 짚는 상자를 대상보다 이만큼 넓힌다 — 테두리가 대상 글자에 붙지 않게 */
const PAD = 6;

/* 문구 속 [[on]] 같은 표시를 화면의 램프 색 점으로 바꾼다 — "초록이면 정상"을 글로만 쓰면
   현장에서 색을 바로 대 보기 어렵다. 쓸 수 있는 색은 화면 램프와 같은 다섯이다
   (on 초록 / alarm 빨강 / warn 노랑 / off 회색 / unknown 점선). */
const DOT_RE = /(\[\[(?:on|alarm|warn|unknown|off)\]\])/;

function Line({ text }) {
  return String(text).split(DOT_RE).map((part, i) => {
    const m = part.match(/^\[\[(\w+)\]\]$/);
    // eslint-disable-next-line react/no-array-index-key
    return m ? <span key={i} className={`sg-dot is-${m[1]}`} aria-hidden="true" /> : part;
  });
}

/**
 * 짚을 상자들(화면 좌표). 보이는 요소가 없으면 빈 배열.
 * 기본은 선택자에 걸리는 요소를 모두 감싸는 상자 하나(예: 1~7ZONE 전체). split이면 요소마다
 * 따로 짚는다 — 입구·출구 OP PANEL처럼 떨어져 있는 둘을 하나로 감싸면 그 사이 판들까지 들어간다.
 */
function targetRects(selector, split) {
  if (!selector) return [];
  let els;
  try {
    els = [...document.querySelectorAll(selector)];
  } catch {
    return [];   // 선택자가 잘못됐으면 짚지 않는 단계로 — 설명서가 화면을 깨뜨리면 안 된다
  }
  const rects = els.map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  if (!rects.length) return [];
  const box = (rs) => ({
    left: Math.min(...rs.map((r) => r.left)) - PAD,
    top: Math.min(...rs.map((r) => r.top)) - PAD,
    right: Math.max(...rs.map((r) => r.right)) + PAD,
    bottom: Math.max(...rs.map((r) => r.bottom)) + PAD,
  });
  return split ? rects.map((r) => box([r])) : [box(rects)];
}

const sameRect = (a, b) => Math.abs(a.left - b.left) < 1 && Math.abs(a.top - b.top) < 1
  && Math.abs(a.right - b.right) < 1 && Math.abs(a.bottom - b.bottom) < 1;
const sameRects = (a, b) => a.length === b.length && a.every((r, i) => sameRect(r, b[i]));

/**
 * @param screenKey scadaMenu의 key — 어느 화면의 설명서인지
 * @param onClose   닫기
 */
export default function ScreenGuide({ screenKey, onClose }) {
  const { t } = useTranslation('guide');
  const steps = GUIDE_STEPS[screenKey] ?? [];
  const [index, setIndex] = useState(0);
  const [rects, setRects] = useState([]);
  const currentTocRef = useRef(null);

  const step = steps[index];
  const total = steps.length;
  const last = index === total - 1;
  const base = `${screenKey}.${step?.id}`;
  const lines = t(`${base}.body`, { returnObjects: true });
  const body = Array.isArray(lines) ? lines : [String(lines ?? '')];

  const go = useCallback((n) => setIndex((i) => Math.min(Math.max(n(i), 0), total - 1)), [total]);

  /* 화면 축소 배율 — (창 폭 - 패널 폭) / 창 폭. 패널 폭은 CSS 변수(--sg-panel-w, 좁은 화면은 더 좁다)를
     읽는다. CSS만으로는 길이끼리 나눠 배율을 낼 수 없어 여기서 계산해 .hmi-root에 넣고,
     .hmi-root.has-guide .hmi-shell이 그 배율로 축소한다(ScreenGuide.css). 닫으면 지운다. */
  useEffect(() => {
    const root = document.querySelector('.hmi-root');
    if (!root) return undefined;
    const apply = () => {
      const pw = parseFloat(getComputedStyle(root).getPropertyValue('--sg-panel-w')) || 300;
      root.style.setProperty('--sg-scale', String(Math.max(0.3, (window.innerWidth - pw) / window.innerWidth)));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      root.style.removeProperty('--sg-scale');
    };
  }, []);

  /* 눌러야 열리는 창 안을 짚는 단계(guideSteps의 opens) — 그 단계에 오면 창을 열고,
     같은 창을 쓰는 단계끼리는 연 채로 넘어가며, 다른 단계로 가면 닫는다.
     조회 권한이라 여는 버튼이 잠겨 있으면 click()이 아무 일도 하지 않는다 — 그 단계는 짚지 않는다. */
  const openRef = useRef(null);
  useEffect(() => {
    const want = step?.opens ?? null;
    const cur = openRef.current;
    if (cur && cur !== want) {
      if (document.querySelector(cur.check)) document.querySelector(cur.close)?.click();
      openRef.current = null;
    }
    if (want) {
      openRef.current = want;
      if (!document.querySelector(want.check)) document.querySelector(want.trigger)?.click();
    }
  }, [step]);

  // 설명서를 닫을 때 열어 둔 창이 있으면 같이 닫는다 — 설명서가 연 창이 화면에 남지 않게
  useEffect(() => () => {
    const cur = openRef.current;
    if (cur && document.querySelector(cur.check)) document.querySelector(cur.close)?.click();
  }, []);

  /* 단계가 바뀌면 대상을 화면 안으로 끌어온다(본문이 스크롤되는 화면이 있다).
     패널이 열리며 화면 틀이 줄어드는 중일 수 있어 한 박자 뒤에 한다. */
  useEffect(() => {
    if (!step?.target) return undefined;
    const timer = setTimeout(() => {
      try {
        document.querySelector(step.target)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } catch {
        // 잘못된 선택자 — 아래 targetRects도 빈 배열을 돌려 짚지 않는 단계가 된다
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [step]);

  /* 짚을 상자를 잰다. 패널이 열리며 화면이 줄어들고, 값이 들어오며 판 크기가 바뀌거나,
     창 크기·스크롤이 바뀔 수 있어 열려 있는 동안 짧게 되풀이해 잰다(바뀌었을 때만 다시 그린다). */
  useEffect(() => {
    const measure = () => setRects((prev) => {
      const next = targetRects(step?.target, step?.split);
      return sameRects(prev, next) ? prev : next;
    });
    measure();
    const timer = setInterval(measure, 200);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  // 목차가 길어 스크롤되는 경우(좁은 화면) 지금 장이 목차 칸 안에 보이게 한다
  useEffect(() => {
    currentTocRef.current?.scrollIntoView({ block: 'nearest' });
  }, [index]);

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

  if (!step) return null;

  const guide = (
    <div className="hmi-dark sg-root" role="dialog" aria-modal="true" aria-label={t('ui.open')}>
      {/* 왼쪽 화면의 누름을 막는 판. 짚는 곳이 없는 단계(처음·끝)에는 이 판이 직접 어둡게 덮는다 */}
      <div className={`sg-backdrop${rects.length ? '' : ' is-dim'}`} onMouseDown={onClose} />

      {/* 짚는 곳이 있으면 — 화면 전체를 덮는 어두운 한 장에 짚는 곳마다 구멍을 뚫는다(SVG 마스크).
          예전처럼 상자 하나의 큰 그림자로 어둡게 하면, 상자가 둘일 때 서로의 그림자가 상대를 덮는다. */}
      {rects.length > 0 && (
        <svg className="sg-dim" aria-hidden="true">
          <defs>
            <mask id="sg-mask">
              <rect width="100%" height="100%" fill="white" />
              {rects.map((r, i) => (
                <rect
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className="sg-cut"
                  rx="10"
                  fill="black"
                  style={{ x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top }}
                />
              ))}
            </mask>
          </defs>
          <rect width="100%" height="100%" className="sg-dim-fill" mask="url(#sg-mask)" />
        </svg>
      )}
      {rects.map((r, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          className="sg-hole"
          style={{ left: r.left, top: r.top, width: r.right - r.left, height: r.bottom - r.top }}
        />
      ))}

      {/* 오른쪽 패널 — 위: 설명서 이름·닫기 / 가운데: 지금 장(넘치면 이 칸만 스크롤) /
          아래: 점·이전·다음. 아래 줄은 늘 같은 자리라 넘기기만 계속 누르면 된다. */}
      <aside className="sg-panel">
        <div className="sg-top">
          <span className="sg-top-name">{t('ui.open')}</span>
          <button type="button" className="sg-close" onClick={onClose} aria-label={t('ui.close')} title={t('ui.close')}>
            <IconX size={18} />
          </button>
        </div>

        <div className="sg-content">
          <div className="sg-head">
            <span className="sg-count">{t('ui.count', { n: index + 1, total })}</span>
            <span className="sg-title">{t(`${base}.title`)}</span>
          </div>
          <ul className="sg-body">
            {body.map((line, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={i}><Line text={line} /></li>
            ))}
          </ul>
        </div>

        {/* 목차 — 이 화면 설명서의 장 전체. 지금 장을 강조하고, 누르면 그 장으로 간다.
            설명 글이 짧아 패널 아래가 비던 자리를 채우면서, 몇 장 중 어디쯤인지도 한눈에 보인다
            (예전의 점 줄이 하던 일을 대신한다). 길면 이 칸만 스크롤된다. */}
        <nav className="sg-toc" aria-label={t('ui.toc')}>
          <div className="sg-toc-head">{t('ui.toc')}</div>
          <ol className="sg-toc-list">
            {steps.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  ref={i === index ? currentTocRef : undefined}
                  className={`sg-toc-item${i === index ? ' is-current' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? 'step' : undefined}
                >
                  <span className="sg-toc-no">{i + 1}</span>
                  <span className="sg-toc-text">{t(`${screenKey}.${s.id}.title`)}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="sg-foot">
          <div className="sg-nav">
            <button type="button" className="sg-btn" onClick={() => go((i) => i - 1)} disabled={index === 0}>
              <IconChevronLeft size={16} />
              {t('ui.prev')}
            </button>
            <button
              type="button"
              className="sg-btn is-primary"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onClick={() => (last ? onClose() : go((i) => i + 1))}
            >
              {last ? t('ui.done') : t('ui.next')}
              {!last && <IconChevronRight size={16} />}
            </button>
          </div>
          <div className="sg-keys">{t('ui.keys')}</div>
        </div>
      </aside>
    </div>
  );

  // 화면 틀(.hmi-root) 안, 본문 fieldset 밖에 그린다 — 글꼴·토큰은 틀의 것을 그대로 쓴다
  return createPortal(guide, document.querySelector('.hmi-root') ?? document.body);
}
