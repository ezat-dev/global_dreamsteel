import { useEffect, useRef } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
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
export default function HmiTable({ data, columns, options, height = '100%', onTableReady }) {
  const elRef = useRef(null);
  const tableRef = useRef(null);
  const builtRef = useRef(false);

  useEffect(() => {
    builtRef.current = false;
    tableRef.current = new Tabulator(elRef.current, {
      data,
      columns,
      layout: 'fitColumns',
      height,
      rowHeight: 30,
      // 헤더 제목은 전부 가운데 정렬. 컬럼의 hozAlign은 본문 셀만 정렬하기 때문에
      // 헤더는 headerHozAlign을 따로 줘야 한다.
      columnDefaults: { headerHozAlign: 'center' },
      placeholder: '데이터가 없습니다.',
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
  }, [columns]);

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
    <div className="hmi-table-wrap">
      <div ref={elRef} />
    </div>
  );
}
