/* ===========================================================================
   표를 엑셀 파일(.xlsx)로 내려받기 — 경보이력·로그가 같이 쓴다.

   서버에 다시 묻지 않는다. 화면이 들고 있는 것을 그대로 파일로 만든다
   (폐쇄망이라 바깥 서버를 거치는 방식은 애초에 쓸 수 없다).

   CSV가 아니라 xlsx인 이유는 열 폭 때문이다. CSV는 값만 있는 텍스트라 서식이 없어서,
   엑셀이 열면 모든 열이 같은 기본 폭으로 깔린다 — 경보주석처럼 긴 칸은 잘려서 안 보인다.
   xlsx여야 열마다 폭을 지정할 수 있다.

   SheetJS는 쓸 때만 불러온다(동적 import). 7MB짜리라 처음 화면 뜨는 속도에 얹으면
   손해다 — 내려받기를 누른 그 순간에만 받아 온다.
   =========================================================================== */

/* 엑셀의 열 폭 단위는 '기본 글꼴 숫자 하나의 폭'이다. 한글은 영문보다 두 배 가까이
   넓으므로 2로 세지 않으면 한글 열이 항상 좁게 나온다. */
const displayWidth = (s) => {
  const text = String(s ?? '');
  let w = 0;
  for (const ch of text) w += /[ᄀ-ᇿ　-〿가-힯一-鿿＀-￯]/.test(ch) ? 2 : 1;
  return w;
};

/* 폭의 아래위 한계. 너무 좁으면 제목이 잘리고, 너무 넓으면 한 열이 화면을 다 먹는다.
   경보주석처럼 긴 칸은 50에서 끊고 나머지는 엑셀에서 줄바꿈으로 보면 된다. */
const MIN_W = 8;
const MAX_W = 50;

const pad2 = (n) => String(n).padStart(2, '0');

/** 파일 이름 뒤에 붙일 시각 — 같은 표를 여러 번 받아도 파일이 덮이지 않게 한다. */
function stamp(d = new Date()) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
    + `_${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

/**
 * @param table    Tabulator 인스턴스(HmiTable의 onTableReady로 받는다)
 * @param baseName 파일 이름 앞부분. 예: '경보이력' → 경보이력_20260916_1103.xlsx
 * @param sheetName 시트 이름. 없으면 baseName을 쓴다(엑셀 제한 31자).
 *
 * 컬럼 정의에 excelValue(value, row)를 넣어 두면 그 함수를 거쳐 값을 내보낸다.
 * 화면에는 배지로 그리지만 파일에는 글자로 남겨야 하는 칸(경보상태 ACTIVE → 발생)에 쓴다.
 */
export default async function downloadXlsx(table, baseName, sheetName) {
  if (!table) return;

  /* 'active'는 지금 화면에 걸려 있는 상태 그대로다 — 열 머리 검색칸으로 좁힌 결과와
     정렬 순서가 그대로 따라온다. 화면에서 본 것과 파일이 다르면 그게 더 혼란스럽다. */
  const rows = table.getData('active');

  /* NO 열은 데이터에 없는 값이라(화면에서는 formatter가 번호를 찍는다) 여기서 만들어 넣는다.
     엑셀에도 왼쪽에 행 번호가 있지만 그건 머리글 줄까지 세는 번호라 한 칸씩 어긋난다 —
     화면에서 본 번호와 같은 것이 파일에도 있어야 서로 짚어 가며 볼 수 있다.
     그 밖에 field도 rownum도 없는 열은 내보낼 값이 없어 버린다. */
  const cols = table.getColumnDefinitions()
    .filter((c) => c.field || c.formatter === 'rownum');

  const body = rows.map((row, i) => cols.map((c) => {
    if (!c.field) return i + 1;          // NO — 숫자로 넣어야 엑셀에서 정렬·합계가 된다
    const raw = row[c.field];
    return c.excelValue ? c.excelValue(raw, row) : (raw ?? '');
  }));

  await writeSheet(cols.map((c) => c.title ?? c.field), body, `${baseName}_${stamp()}`, sheetName ?? baseName);
}

/**
 * 표가 아닌 화면(트랜드처럼 차트만 있는 곳)에서 쓰는 입구.
 * 열 정의와 줄 데이터를 직접 넘기면 같은 모양의 파일이 나온다.
 *
 * @param cols     [{ title, field, value? }] — value(row)를 주면 그 함수로 값을 만든다
 * @param rows     내보낼 줄 데이터
 * @param fileName 확장자 뺀 파일 이름. 부르는 쪽이 통째로 정한다
 *                 (기간을 이름에 넣는 등 화면마다 사정이 다르다)
 * @param sheetName 시트 이름
 */
export async function downloadRowsXlsx(cols, rows, fileName, sheetName) {
  const body = rows.map((row) => cols.map((c) => {
    const v = c.value ? c.value(row) : row[c.field];
    // null은 빈 칸으로 둔다 — 못 읽은 값을 0으로 적으면 그 시각에 0이었던 것이 된다
    return v == null ? '' : v;
  }));
  await writeSheet(cols.map((c) => c.title ?? c.field), body, fileName, sheetName);
}

/** 머리글 + 본문을 받아 열 폭까지 잡아 파일로 쓴다. 위 두 입구가 같이 쓴다. */
async function writeSheet(header, body, fileName, sheetName) {
  // 열 폭은 제목과 값 중 가장 긴 것을 따른다(+2는 좌우 여백).
  const widths = header.map((h, i) => {
    const longest = body.reduce((max, r) => Math.max(max, displayWidth(r[i])), displayWidth(h));
    return { wch: Math.min(MAX_W, Math.max(MIN_W, longest + 2)) };
  });

  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws['!cols'] = widths;

  const wb = XLSX.utils.book_new();
  /* 시트 이름은 31자 제한이 있고 : \ / ? * [ ] 를 못 쓴다.
     기간을 이름에 넣는 화면이 있어서 금지 문자를 미리 걷어낸다. */
  XLSX.utils.book_append_sheet(wb, ws, String(sheetName ?? '').replace(/[:\\/?*[\]]/g, '-').slice(0, 31));
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
