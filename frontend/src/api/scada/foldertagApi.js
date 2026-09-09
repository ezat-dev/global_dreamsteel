import plcApiInstance from '../plcApiInstance';

/* ===========================================================================
   folders_tags 태그 읽기·쓰기 — C#(PlcApiServer)을 직접 호출한다.

   읽기는 C#이 백그라운드로 폴링해 메모리에 들고 있는 값을 꺼내오는 것이라
   자주 불러도 PLC 왕복이 늘지 않는다. 쓰기는 실제로 PLC에 값을 내보낸다.
   =========================================================================== */

/** 램프/값 상태 — C#은 읽기 실패나 아직 안 읽은 태그를 null로 준다. */
export const TAG_ON = 'on';
export const TAG_OFF = 'off';
export const TAG_UNKNOWN = 'unknown';

/**
 * 태그 raw 값을 세 상태로 판정한다.
 *
 * null(=읽기 실패·미폴링)을 '꺼짐'으로 뭉개지 않는 것이 요점이다 — 못 읽은 램프가
 * 정상으로 보이면 설비 상태를 잘못 읽는다.
 * 0보다 크면 ON으로 보는 건 C#의 TreatNonZeroAsOn 기본값(true)과 맞춘 것이다.
 */
export function tagState(raw) {
  if (raw == null || raw === '') return TAG_UNKNOWN;
  const n = Number(raw);
  if (!Number.isFinite(n)) return TAG_UNKNOWN;
  return n > 0 ? TAG_ON : TAG_OFF;
}

/**
 * 태그 이름 규칙 — 명령 태그 이름 뒤에 '_lamp'를 붙인 것이 그 버튼의 램프 태그다.
 *   main_gas_open_cmd(M320)   ↔ main_gas_open_cmd_lamp(M620)
 *   cb_z1_b1_on_cmd(M380)     ↔ cb_z1_b1_on_cmd_lamp(M680)
 *
 * 프로젝트 전체가 이 규칙 하나를 쓴다(알람화면의 alarm_1000 ↔ alarm_1000_lamp도 같다).
 * 화면마다 규칙이 갈리면 여기서 분기해야 하므로, 태그를 넣을 때 이 형태로 맞춘다.
 */
export function lampOf(cmdName) {
  return `${cmdName}_lamp`;
}

/**
 * 명령 태그의 램프 상태를 클래스 문자열로 바꾼다. 켜진 램프에 붙일 클래스를 받는다 —
 * 같은 1이라도 화면마다 뜻이 달라서(운전 중이면 초록, 정지 중이면 빨강) 색은 호출부가 정한다.
 *
 * 값을 한 번도 못 받았거나 그 램프만 못 읽었으면 '모름'으로 둔다. 꺼진 것으로 그리면
 * 실제로 돌고 있는 설비를 멈춘 것으로 보여주게 된다.
 *
 * @param values 폴링으로 받은 { 태그이름: 값 } 맵. null이면 아직 못 받은 상태
 * @param cmdName 명령 태그 이름(램프 이름은 여기서 만든다)
 * @param onClassName 램프가 켜졌을 때 붙일 클래스(' is-on' / ' is-alarm')
 */
export function lampClassOf(values, cmdName, onClassName) {
  if (!values) return ' is-unknown';
  const st = tagState(values[lampOf(cmdName)]);
  if (st === TAG_UNKNOWN) return ' is-unknown';
  return st === TAG_ON ? onClassName : '';
}

/**
 * 한 폴더의 태그 값 전체 — { lastPollAt, values: { 태그이름: 값 } }
 *
 * C#은 배열로 준다:
 *   { success, folderId, lastPollAt, tags: [{ name, address, value }, ...] }
 * folderId를 빼면 folders_tags.id를 키로 한 맵이 오는데, 그러면 화면이 DB의
 * auto increment 값에 묶인다. 이름으로 찾는 쪽을 쓴다.
 *
 * 배열을 여기서 맵으로 바꿔 돌려준다 — 화면은 응답 형태를 몰라도 되고,
 * 태그가 수백 개여도 매 렌더마다 find로 훑지 않는다.
 */
export function getFolderTagValues(folderId) {
  return plcApiInstance
    .get('/api/foldertag/values', { params: { folderId } })
    .then((res) => {
      const body = res.data ?? {};
      const values = {};
      (body.tags ?? []).forEach((t) => { values[t.name] = t.value; });
      return { lastPollAt: body.lastPollAt ?? null, values };
    });
}

/**
 * 태그에 값 쓰기 — 실제로 PLC에 나간다.
 *
 * 비트/워드는 C#이 주소의 디바이스 문자로 가른다(M/L/X/Y/B/S=비트, D/W/R=워드).
 * folders_tags.type 컬럼은 보지 않으므로 여기서도 신경 쓸 필요가 없다.
 *
 * folderId를 반드시 같이 넘긴다 — 태그 이름은 폴더 안에서만 유일해서(UNIQUE
 * (folder_id, name)), 여러 폴더에 같은 이름이 있으면 C#이 "특정할 수 없음"으로
 * 거부한다. 엉뚱한 설비에 쓰는 사고를 막는 장치다.
 *
 * 주의: 실패도 HTTP 200 + success:false 로 온다(C#이 그렇게 응답한다).
 * 그래서 axios의 catch가 잡지 못하므로 여기서 success를 보고 직접 예외를 던진다.
 */
export function writeTag(folderId, name, value) {
  return plcApiInstance
    .get('/api/foldertag/write/by-name', { params: { folderId, name, value } })
    .then((res) => {
      const body = res.data ?? {};
      if (!body.success) throw new Error(body.error || 'PLC 쓰기에 실패했습니다.');
      return body;
    });
}
