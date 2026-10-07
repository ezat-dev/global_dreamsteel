/* ===========================================================================
   경보 문구를 화면 언어로 고른다 — 알람화면·현재경보·경보이력·구동/연소 하단 목록이 같이 쓴다.

   문구는 ez_scada.tb_alarm_tag에 두 칸으로 있다: alarm_msg(한글) / alarm_msg_eng(영문).
   경보이력 뷰(vw_alarm_history)도 이 테이블과 붙여 같은 두 칸을 내려 준다.

   영어 화면이라도 영문 칸이 비어 있으면 한글을 그대로 보여 준다 — 영문을 아직 안 채운
   알람이 빈칸으로 나오면 무슨 경보인지 알 수 없다. 한글 화면은 늘 alarm_msg다.
   =========================================================================== */

/** 한 행(알람 정의 또는 이력)의 문구 — lang은 i18n.language */
export function alarmMsgOf(row, lang) {
  if (!row) return '';
  if (lang === 'en' && row.alarmMsgEng) return row.alarmMsgEng;
  return row.alarmMsg ?? '';
}

/**
 * 표에 넣을 행으로 — 화면 언어의 문구를 msgShown 칸에 붙인다.
 * 표의 열은 이 칸을 쓴다. 그래야 검색칸·정렬·엑셀이 화면에 보이는 글자 기준으로 맞는다
 * (alarmMsg를 쓰면 영어 화면에서 영문으로 검색해도 한글 원문에 대고 찾게 된다).
 */
export function withShownMsg(rows, lang) {
  return (rows ?? []).map((r) => ({ ...r, msgShown: alarmMsgOf(r, lang) }));
}
