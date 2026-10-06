import { useEffect, useRef, useState } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { useTranslation } from 'react-i18next';
import 'tabulator-tables/dist/css/tabulator.min.css';

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
      onTableReady?.(tableRef.current);
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

     2px 미만 차이를 무시하는 것이 중요하다. rowH를 바꾸면 표를 다시 만들고, 그러면
     이 effect가 또 돌아서 재는데, 그때 1px쯤 달라지면 끝없이 다시 만들게 된다. */
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
      const extra = row ? Math.max(0, row.offsetHeight - rowH) : 0;

      // 내림한다 — 올리면 마지막 행이 잘려 스크롤이 생긴다
      const fitted = Math.floor(avail / perPage) - extra;
      const next = Math.max(FIT_MIN_ROW_H, Math.min(FIT_MAX_ROW_H, fitted));
      setRowH((prev) => (Math.abs(prev - next) < 2 ? prev : next));
    };

    const raf = requestAnimationFrame(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // data가 들어온 뒤에야 헤더·푸터가 그려지므로 그때 다시 잰다.
    // rowH는 실제 행 높이와 비교하는 데만 쓰고, 넣으면 재계산이 한 번 더 돌아 깜빡인다.
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
