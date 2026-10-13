import { useEffect, useRef, useState } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { useTranslation } from 'react-i18next';
import 'tabulator-tables/dist/css/tabulator.min.css';

/* ── 화면 설명서의 축소(transform: scale)와 Tabulator ────────────────────────
   설명서가 열리면 화면 전체를 transform: scale로 줄인다(ScreenGuide.css). Tabulator는 몇 군데서
   크기를 getBoundingClientRect로 재는데(tabulator_esm.js), 그 값은 배율이 곱해진 화면 크기다.
     - fitColumns   표 폭       → 열 합이 표 폭의 84%(1920)·77%(1280)로 그려져 오른쪽이 빈다
     - Column.getHeight 열 머리 높이 → 머리줄이 53→45px로 눌려 검색칸이 삐져나오고 칸마다 높이가 어긋난다
     - adjustTableSize  머리줄·바닥줄 높이 → 본문 칸 높이가 어긋난다
   그 요소들에만 "크기는 배치 크기(배율을 뺀 값)로" 돌려주는 getBoundingClientRect를 인스턴스에
   얹는다. 위치(left/top)는 그대로 둔다. 배율이 없으면(평소) 원래 값 그대로라 지금과 똑같다.
   요소에 얹는 것이라 다른 화면·다른 코드(설명서가 짚을 곳을 재는 것 등)의 측정은 건드리지 않는다.
   tabulator-tables를 올릴 때 이 측정들이 offsetWidth 등으로 바뀌면 이 덮개는 필요 없어진다. */

/** 요소의 화면 사각형에서 크기(width/height)만 배치 크기로 되돌린다. 배율이 없으면 원래 사각형 그대로.
    위치(left/top/right/bottom)는 화면 값 그대로 둔다 — 드롭다운·메뉴 자리처럼 위치를 쓰는 곳이
    화면과 어긋나지 않게. 위 세 측정은 width/height만 읽는다. */
function unscaledRect(el) {
  const r = Element.prototype.getBoundingClientRect.call(el);
  if (!el.offsetWidth || !el.offsetHeight) return r;
  const kx = r.width / el.offsetWidth;
  const ky = r.height / el.offsetHeight;
  if (Math.abs(kx - 1) < 0.01 && Math.abs(ky - 1) < 0.01) return r;
  return {
    x: r.x, y: r.y, left: r.left, top: r.top, right: r.right, bottom: r.bottom,
    width: r.width / kx, height: r.height / ky,
    toJSON() { return this; },
  };
}

/** 지금 표가 축소된 화면 안에 있는지 — 표 본문의 화면 폭과 배치 폭이 다르면 그렇다 */
const isScaled = (el) => !!el?.offsetWidth
  && Math.abs(Element.prototype.getBoundingClientRect.call(el).width - el.offsetWidth) >= 1;

/** 위 세 측정이 쓰는 요소에 unscaledRect를 얹는다. 내부 구조가 다른 버전이면 손대지 않는다. */
function applyLayoutRects(table) {
  try {
    [
      table.rowManager.element,
      table.columnManager.element,
      table.footerManager?.element,
      ...table.columnManager.columnsByIndex.map((c) => c.element),
    ].filter(Boolean).forEach((el) => {
      // eslint-disable-next-line no-param-reassign
      el.getBoundingClientRect = () => unscaledRect(el);
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Tabulator 공용 래퍼 — 초기화·해제·데이터 갱신을 감싼다.
 * 경보이력·로그처럼 목록을 뿌리는 화면들이 같이 쓴다.
 *
 * 겉모습(HMI 회색 테마)은 styles/scada.css의 .hmi-table-wrap 아래에서 덮어쓴다.
 *
 * @param columns Tabulator 컬럼 정의. 바뀌면 표를 통째로 다시 만든다.
 * @param options Tabulator 추가 옵션(기본값을 덮어쓴다)
 */
/* 행 높이를 칸에 맞춰 늘릴 때의 상한·하한.
   경보이력·로그처럼 표가 화면 전체를 쓰는 곳에서, 20행이 칸보다 짧으면 마지막 행과
   페이지 버튼 사이가 벌어진다(칸이 클수록 더 벌어진다). 행 수는 그대로 두고 높이만 키운다. */
const FIT_MIN_ROW_H = 26;
const FIT_MAX_ROW_H = 56;

export default function HmiTable({
  data, columns, options, height = '100%', fitRows = false, onTableReady,
}) {
  const { t, i18n } = useTranslation();
  const wrapRef = useRef(null);
  const elRef = useRef(null);
  const tableRef = useRef(null);
  const builtRef = useRef(false);

  /* 칸에 맞춰 잰 행 높이. 바뀌면 아래 생성 effect가 표를 다시 만든다 —
     Tabulator는 rowHeight를 만들 때 한 번 읽고 나중에 바꿀 수 없다. */
  const [rowH, setRowH] = useState(30);
  /* 아래 fit이 읽는 지금의 rowH. fit은 [fitRows, data, columns]가 바뀔 때만 새로 만들어져서
     state를 그대로 읽으면 만들 때의 값(처음엔 30)에 갇힌다. 그러면 행이 이미 커진 뒤에
     '테두리 몫(extra)'을 행 높이 차이만큼 크게 잡아 행을 그만큼 작게 다시 만든다 —
     창 크기가 바뀔 때마다 표 아래가 비거나(설명서를 열고 닫을 때 150~200px) 넘쳤다. */
  const rowHRef = useRef(30);
  rowHRef.current = rowH;
  /* 지금의 fit(아래 effect가 넣는다). 표를 다시 만든 뒤(tableBuilt) 한 번 더 재는 데 쓴다 —
     창 크기가 바뀐 순간에는 아직 옛 표의 머리줄이 남아 있어 높이를 잘못 재는 일이 있다
     (설명서를 닫을 때 머리줄이 46→54px로 바뀌어 행이 8px 넘쳤다). */
  const fitRef = useRef(null);

  useEffect(() => {
    builtRef.current = false;
    tableRef.current = new Tabulator(elRef.current, {
      data,
      columns,
      layout: 'fitColumns',
      height,
      /* fitRows면 아래에서 잰 값을 쓴다. CSS로 바꾸지 않고 Tabulator 옵션으로 주는 것이
         요점이다 — 행 높이는 Tabulator가 스크롤·레이아웃 계산에 쓰는 값이라, CSS로만
         키우면 내부 계산과 어긋나 열이 통째로 깨진다(한 번 그렇게 만들어 봤다). */
      rowHeight: fitRows ? rowH : 30,
      // 헤더 제목은 전부 가운데 정렬. 컬럼의 hozAlign은 본문 셀만 정렬하기 때문에
      // 헤더는 headerHozAlign을 따로 줘야 한다.
      /* vertAlign — 행이 높아지면 글자가 위에 붙으므로 세로 가운데로 둔다.
         CSS로 셀을 flex로 바꿔도 되지만 그러면 안 된다: Tabulator가 컬럼 폭을 셀의
         인라인 width로 잡는데 display를 바꾸면 그 계산이 무너져 열이 통째로 어긋난다
         (실제로 그렇게 만들어 봤다). 라이브러리가 주는 옵션으로 푸는 쪽이 안전하다.
         행 높이가 30px 고정인 쪽은 지금도 가운데에 가까워서 건드리지 않는다. */
      columnDefaults: {
        headerHozAlign: 'center',
        ...(fitRows ? { vertAlign: 'middle' } : {}),
      },
      placeholder: t('table.empty'),
      /* 바닥줄 글자를 지금 언어로. Tabulator 기본은 First/Prev/Next/Last와
         "Showing 1-20 of 300 rows"다. 건수 문구는 "{showing} 1-20 {of} 300 {rows}" 틀에
         끼워지므로, 앞말을 비우고 사이를 사전 값으로 둔다(한국어 "1-20 / 300건").
         언어를 바꾸면 아래 effect의 의존성(language)으로 표를 다시 만들어 이 값을 새로 읽는다.
         headerFilters는 건드리지 않는다 — 검색칸 안내문은 컬럼마다 따로 주고 있다. */
      locale: 'app',
      langs: {
        app: {
          pagination: {
            first: t('table.first'), first_title: t('table.firstTitle'),
            prev: t('table.prev'), prev_title: t('table.prevTitle'),
            next: t('table.next'), next_title: t('table.nextTitle'),
            last: t('table.last'), last_title: t('table.lastTitle'),
            page_title: t('table.page'),
            counter: {
              showing: '', of: t('table.counterOf'), rows: t('table.counterRows'), pages: t('table.counterPages'),
            },
          },
          data: { loading: t('table.loading'), error: t('table.error') },
        },
      },
      pagination: true,
      paginationSize: 20,
      paginationSizeSelector: [20, 50, 100, 200],
      paginationCounter: 'rows',
      ...options,
    });
    tableRef.current.on('tableBuilt', () => {
      builtRef.current = true;
      const table = tableRef.current;
      /* 이후의 측정이 배치 크기를 쓰게 한다. 축소된 채로 만들어졌으면 처음 그림은 이미
         화면 크기로 재서 그린 것이라, 덮개를 얹은 뒤 한 번 다시 그린다(평소에는 다시 그리지 않는다). */
      if (applyLayoutRects(table) && isScaled(table.rowManager.element)) table.redraw(true);
      onTableReady?.(table);
      // 새 표의 머리줄·바닥줄로 다시 잰다(fitRows일 때만 fitRef가 있다)
      requestAnimationFrame(() => fitRef.current?.());
    });

    return () => {
      tableRef.current?.destroy();
      tableRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // rowH가 바뀌면 다시 만든다 — Tabulator는 rowHeight를 나중에 못 바꾼다.
    // 언어가 바뀌어도 다시 만든다 — 빈 표 안내·바닥줄 글자를 만들 때 한 번 읽기 때문이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, rowH, i18n.language]);

  /* 칸 높이를 재서 행 높이를 정한다(fitRows일 때만).

     헤더와 페이지버튼줄 높이는 실제 DOM에서 잰다 — 글자 크기나 검색칸이 바뀌면 같이
     달라지는 값이라 상수로 적어 두면 그때부터 어긋난다.

     한 프레임 미뤄서(rAF) 재는 이유는 표가 그려진 뒤여야 헤더·푸터가 생기기 때문이다.
     창 크기가 바뀌면 ResizeObserver가 다시 잰다.

     키울 때는 2px 미만 차이를 무시하는 것이 중요하다. rowH를 바꾸면 표를 다시 만들고,
     다시 만든 뒤 또 재는데(tableBuilt), 그때 1px쯤 달라지면 끝없이 다시 만들게 된다.
     줄일 때는 1px도 받는다 — 무시하면 20행이면 20px이 넘쳐 표 안에 스크롤이 생긴다.
     줄인 뒤 다시 재서 1px 크게 나와도 키우는 쪽이라 무시되므로 왔다 갔다 하지 않는다. */
  useEffect(() => {
    if (!fitRows) return undefined;
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const fit = () => {
      const header = wrap.querySelector('.tabulator-header');
      const footer = wrap.querySelector('.tabulator-footer');
      if (!header || !footer) return;

      const perPage = tableRef.current?.getPageSize?.() || options?.paginationSize || 20;
      const avail = wrap.clientHeight - header.offsetHeight - footer.offsetHeight;
      if (avail <= 0 || !perPage) return;

      /* 지정한 높이에 실제로 더 붙는 몫을 뺀다. 행마다 테두리가 1px 있어서(scada.css의
         .tabulator-row border-bottom) 20행이면 20px이 더해지고, 그만큼 넘쳐 스크롤이
         조금 생긴다. 상수로 1을 빼지 않고 실제 행을 재는 것은 테두리 두께나 여백이
         바뀌어도 따라가게 하려는 것이다. */
      const row = wrap.querySelector('.tabulator-row');
      const extra = row ? Math.max(0, row.offsetHeight - rowHRef.current) : 0;

      // 내림한다 — 올리면 마지막 행이 잘려 스크롤이 생긴다
      const fitted = Math.floor(avail / perPage) - extra;
      const next = Math.max(FIT_MIN_ROW_H, Math.min(FIT_MAX_ROW_H, fitted));
      setRowH((prev) => (next < prev || next - prev >= 2 ? next : prev));
    };

    fitRef.current = fit;
    const raf = requestAnimationFrame(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      fitRef.current = null;
    };
    // data가 들어온 뒤에야 헤더·푸터가 그려지므로 그때 다시 잰다.
    // rowH는 의존성에 넣지 않고 rowHRef로 읽는다 — 넣으면 재계산이 한 번 더 돌아 깜빡인다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitRows, data, columns]);

  // 데이터만 바뀐 경우엔 표를 다시 만들지 않고 갱신한다.
  // 아직 tableBuilt 전이면 그 시점으로 미룬다(초기 렌더에서 replaceData가 무시되는 것 방지).
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    if (builtRef.current) {
      table.replaceData(data);
    } else {
      table.on('tableBuilt', () => table.replaceData(data));
    }
  }, [data]);

  return (
    <div className="hmi-table-wrap" ref={wrapRef}>
      <div ref={elRef} />
    </div>
  );
}
