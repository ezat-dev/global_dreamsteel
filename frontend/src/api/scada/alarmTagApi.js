import axiosInstance from '../axiosInstance';
import plcApiInstance from '../plcApiInstance';

/* ===========================================================================
   알람화면용 — 알람 정의(고정)와 램프 값(실시간)을 따로 가져온다.

   정의는 ez_scada.tb_alarm_tag 200행이고 실행 중에 바뀌지 않으므로 1회만 받는다.
   값은 1초마다 C#(PlcApiServer)에서 직접 받는다 — C#이 이미 백그라운드로 폴링해
   메모리에 들고 있는 것을 꺼내 주는 것이라 자주 불러도 PLC에 추가 부하가 없다.

   서로 다른 서버를 보므로 인스턴스도 둘이다(정의는 자바 8081, 값은 C# 5050).
   =========================================================================== */

/** ez_scada.folders.id — 폴더 이름 '알람페이지_램프'. 알람화면 램프 200개가 이 폴더에 있다.
    ALARM RESET / HORN STOP 명령 태그도 같은 폴더라, 화면이 쓸 때 쓰라고 내보낸다
    (두 파일에 6을 각각 적어 두면 폴더를 옮길 때 한쪽만 고치게 된다). */
export const ALARM_LAMP_FOLDER_ID = 6;

/** 램프 태그 이름 규칙: tb_alarm_tag.tag_name + 이 접미사 (alarm_1000 → alarm_1000_lamp) */
const LAMP_SUFFIX = '_lamp';

/** 알람 정의의 tagName으로 짝이 되는 램프 태그 이름을 만든다. */
export function lampNameOf(tagName) {
  return `${tagName}${LAMP_SUFFIX}`;
}

/**
 * 알람 정의 목록 — tag_id(=주소) 순서로 내려온다. 이 순서가 곧 화면 격자 순서다.
 * 각 행: tagName, address, alarmMsg(한글), alarmMsgEng(영문, 비어 있을 수 있다), level
 *        화면에 띄울 문구는 alarmMsg.js의 alarmMsgOf로 고른다
 */
export function getAlarmTagList() {
  return axiosInstance.get('/api/scada/getAlarmTagList').then((res) => res.data);
}

/* ---------------------------------------------------------------------------
   알람 설명·첨부 파일(알람화면 설명창) — 알람마다 설명 하나, PDF 하나, 사진 하나.
   알람은 tagId(tb_alarm_tag.tag_id)로 짚는다. kind는 'pdf' 또는 'img'.
   파일은 백엔드 서버 PC의 폴더에 있고(scada.alarm-file.dir), DB에는 이름만 있다.
   ------------------------------------------------------------------------- */

/** 설명 저장 — 255자까지(서버도 같은 한도로 막는다) */
export function updateAlarmDesc(tagId, alarmDesc) {
  return axiosInstance.post('/api/scada/updateAlarmDesc', { tagId, alarmDesc }).then((res) => res.data);
}

/**
 * 파일 올리기 — 같은 종류가 이미 있으면 바뀐다(옛 파일은 서버가 지운다).
 * 응답 data: { tagId, pdfFile, pdfName } 또는 { tagId, imgFile, imgName }
 *
 * 타임아웃을 늘린다 — 기본 10초는 조회용이라, 20MB를 느린 망으로 올리면 넘길 수 있다.
 */
export function uploadAlarmFile(tagId, kind, file) {
  const form = new FormData();
  form.append('tagId', tagId);
  form.append('kind', kind);
  form.append('file', file);
  return axiosInstance.post('/api/scada/uploadAlarmFile', form, { timeout: 120000 }).then((res) => res.data);
}

/** 파일 지우기 — DB 칸을 비우고 서버 폴더의 파일도 지운다 */
export function deleteAlarmFile(tagId, kind) {
  return axiosInstance.post('/api/scada/deleteAlarmFile', { tagId, kind }).then((res) => res.data);
}

/**
 * 파일 주소 — <img src>와 새 탭(PDF)에 그대로 쓴다. 서버가 inline으로 내려 브라우저가 바로 연다.
 *
 * v에 저장 이름(UUID)을 붙인다. 같은 알람에 새 사진을 올리면 이름이 바뀌어 주소가 달라지므로
 * 브라우저가 캐시에 남은 옛 사진을 보여 주지 않는다. 서버는 v를 보지 않는다.
 * 세션 쿠키는 같은 호스트(포트만 다름)라 <img>·새 탭 요청에도 실려 간다.
 */
export function alarmFileUrl(tagId, kind, stored) {
  const base = axiosInstance.defaults.baseURL ?? '';
  return `${base}/api/scada/alarmFile?tagId=${encodeURIComponent(tagId)}&kind=${kind}`
    + `&v=${encodeURIComponent(stored ?? '')}`;
}

/**
 * 램프 실시간값 — C#의 /api/foldertag/values?folderId=6 을 직접 호출한다.
 *
 * folderId를 주면 C#이 그 폴더 태그만 골라 이름·주소까지 붙여서 배열로 준다:
 *   { success, folderId, lastPollAt, tags: [{ name, address, value }, ...] }
 * folderId를 빼면 folders_tags.id를 키로 한 값 맵 전체가 오는데, 그러면 id를
 * 알아야 해서 화면이 DB의 auto increment 값에 묶인다. 이름으로 찾는 쪽을 쓴다.
 *
 * 여기서 배열을 { 이름: 값 } 으로 바꿔 돌려준다 — 화면은 응답 형태를 몰라도 되고,
 * 200개를 매 렌더마다 find로 훑지 않아도 된다.
 *
 * value는 읽기 실패 시 null이다. null은 "꺼짐"이 아니라 "모름"이다.
 */
export function getAlarmLampValues() {
  return plcApiInstance
    .get('/api/foldertag/values', { params: { folderId: ALARM_LAMP_FOLDER_ID } })
    .then((res) => {
      const body = res.data ?? {};
      const values = {};
      (body.tags ?? []).forEach((t) => { values[t.name] = t.value; });
      return { lastPollAt: body.lastPollAt ?? null, values };
    });
}
