import axiosInstance from '../axiosInstance';
import plcApiInstance from '../plcApiInstance';
import i18n from '../../i18n';

/* ===========================================================================
   folders_tags 태그 읽기·쓰기. 두 경로가 다르다.

   읽기 — C#(5050)을 직접 부른다. C#이 백그라운드로 폴링해 메모리에 들고 있는 값을
          꺼내오는 것이라 1초마다 불러도 PLC 왕복이 늘지 않는다.

   쓰기 — 자바(8081)를 거친다. C#으로 바로 보내면 더 짧지만, C#은 로그인한 사용자가
          누군지 모른다(세션은 자바에 있다). 누가 무엇을 바꿨는지 scada_log에 남겨야
          하므로, 사용자를 아는 자바가 쓰기를 수행하고 그 자리에서 기록한다.
          프론트가 쓰고 나서 따로 로그 요청을 보내는 방식이면, 쓰기는 나갔는데
          로그 요청이 실패하는 경우에 기록이 비어 버린다.
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
 * litWhen으로 "몇일 때 켜지는지"를 뒤집을 수 있다. 대부분 1일 때 켜지지만
 * 0일 때 켜지는 램프가 실제로 있다(MAIN GAS CLOSE) — PLC가 그렇게 주는 것이라
 * 화면에서 맞춰야 한다. 이걸 태그 이름 규칙으로는 표현할 수 없어서 화면이 지정한다.
 *
 * @param values 폴링으로 받은 { 태그이름: 값 } 맵. null이면 아직 못 받은 상태
 * @param cmdName 명령 태그 이름(램프 이름은 여기서 만든다)
 * @param onClassName 램프가 켜졌을 때 붙일 클래스(' is-on' / ' is-alarm')
 * @param litWhen TAG_ON(기본, 값이 1일 때 켜짐) 또는 TAG_OFF(값이 0일 때 켜짐)
 */
export function lampClassOf(values, cmdName, onClassName, litWhen = TAG_ON) {
  if (!values) return ' is-unknown';
  const st = tagState(values[lampOf(cmdName)]);
  if (st === TAG_UNKNOWN) return ' is-unknown';
  return st === litWhen ? onClassName : '';
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

/* ---------------------------------------------------------------------------
   PLC에서 지금 값을 직접 읽기 — 폴링이 보는 값과 경로가 다르다.

   위 getFolderTagValues가 받아오는 것은 C#이 2초마다 PLC를 읽어 메모리에 쌓아 둔
   캐시다. 그래서 웹이 무언가를 쓴 직후에는 최악 2초 동안 예전 값이 보인다.
   모멘터리 버튼을 2초나 누르고 있었는데 램프가 안 켜지는 것이 이 때문이다.

   아래 readTagLive는 그 캐시를 건너뛰고 PLC를 그 자리에서 읽는다.
   PLC 왕복이 실제로 일어나므로 폴링처럼 주기적으로 부르면 안 된다 —
   사람이 버튼을 눌렀을 때 한 번만 쓴다.
   --------------------------------------------------------------------------- */

/* 태그 이름 → { plcId, address }. 주소는 DB를 고치지 않는 한 바뀌지 않으므로 태그마다
   한 번만 조회하고 들고 있는다. 버튼을 누를 때마다 두 번 왕복하지 않게 하려는 것이다. */
const addressCache = new Map();

function lookupAddress(folderId, name) {
  const key = `${folderId}:${name}`;
  const hit = addressCache.get(key);
  if (hit) return Promise.resolve(hit);

  return plcApiInstance
    .get('/api/foldertag/value/by-name', { params: { name } })
    .then((res) => {
      /* 이 API는 folderId 파라미터를 무시하고 같은 이름을 가진 태그를 전부 준다.
         alarm_reset은 알람화면(6)과 구동화면(9)에 같은 주소로 들어 있어서 둘 다 온다 —
         부르는 쪽 폴더를 골라 쓰고, 없으면 첫 번째를 쓴다. */
      const tags = res.data?.tags ?? [];
      const tag = tags.find((t) => t.folderId === folderId) ?? tags[0];
      if (!tag?.address || !tag?.plcId) throw new Error(i18n.t('api.addressNotFound', { name }));

      const found = { plcId: tag.plcId, address: tag.address };
      addressCache.set(key, found);
      return found;
    });
}

/**
 * 태그의 지금 값을 PLC에서 직접 읽는다. 실패하면 reject하므로 호출부가 삼키면 된다 —
 * 못 읽어도 폴링이 곧 같은 값을 가져오니 지금까지와 같아질 뿐이다.
 *
 * 주소를 코드에 적지 않는다. by-name이 address와 plcId를 같이 주므로, 현장 주소가
 * 바뀌어도 DB의 address만 고치면 되는 이 프로젝트의 방식이 그대로 유지된다.
 *
 * C#이 주소 문자열(X012)을 그대로 받아 자기가 파싱한다. 번지를 숫자로 넘기는
 * /api/plc/read 쪽은 쓰지 않는다 — 미쓰비시는 X가 16진수(X012는 12가 아니라 18)고
 * M·R·D는 10진수라, 프론트가 진법을 잘못 맞추면 엉뚱한 번지를 읽으면서도
 * 에러가 나지 않는다(그 번지도 멀쩡한 주소라서 값이 정상으로 돌아온다).
 */
export function readTagLive(folderId, name) {
  return lookupAddress(folderId, name)
    .then(({ plcId, address }) => plcApiInstance
      .get('/api/foldertag/read/by-address', { params: { plcId, address } })
      .then((res) => {
        const body = res.data ?? {};
        if (!body.success) throw new Error(body.message || i18n.t('api.plcReadFailed'));
        return body.value;
      }));
}

/**
 * 태그에 값 쓰기 — 자바를 거쳐 실제로 PLC에 나가고, scada_log에 기록된다.
 *
 * 비트/워드는 C#이 주소의 디바이스 문자로 가른다(M/L/X/Y/B/S=비트, D/W/R=워드).
 * folders_tags.type 컬럼은 보지 않으므로 여기서도 신경 쓸 필요가 없다.
 *
 * folderId를 반드시 같이 넘긴다 — 태그 이름은 폴더 안에서만 유일해서(UNIQUE
 * (folder_id, name)), 여러 폴더에 같은 이름이 있으면 C#이 "특정할 수 없음"으로
 * 거부한다. 엉뚱한 설비에 쓰는 사고를 막는 장치다.
 *
 * @param log false면 기록하지 않는다. momentary 버튼을 뗄 때 나가는 0이 그렇다 —
 *            사람이 한 조작이 아니라 누름의 자동 해제라서, 기록하면 버튼 한 번에
 *            로그가 두 줄씩 쌓여 읽기 어려워진다.
 */
export function writeTag(folderId, name, value, log = true) {
  /* 필드명이 자바 ScadaUser의 것이다 — sendValue와 address는 곧 scada_log의 컬럼이라,
     서비스가 C# 응답의 address만 채워 넣고 그대로 INSERT할 수 있다. */
  return axiosInstance
    .post('/api/scada/writeTag', {
      folderId,
      tagName: name,
      sendValue: String(value),
      writeLog: log,
    })
    .then((res) => {
      const body = res.data ?? {};
      if (!body.success) throw new Error(body.message || i18n.t('api.plcWriteFailed'));
      return body;
    });
}
