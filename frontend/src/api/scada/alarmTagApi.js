import axiosInstance from '../axiosInstance';
import plcApiInstance from '../plcApiInstance';

/* ===========================================================================
   알람화면용 — 알람 정의(고정)와 램프 값(실시간)을 따로 가져온다.

   정의는 ez_scada.tb_alarm_tag 200행이고 실행 중에 바뀌지 않으므로 1회만 받는다.
   값은 1초마다 C#(PlcApiServer)에서 직접 받는다 — C#이 이미 백그라운드로 폴링해
   메모리에 들고 있는 것을 꺼내 주는 것이라 자주 불러도 PLC에 추가 부하가 없다.

   서로 다른 서버를 보므로 인스턴스도 둘이다(정의는 자바 8081, 값은 C# 5050).
   =========================================================================== */

/**
 * 알람 정의 목록 — tag_id(=주소) 순서로 내려온다. 이 순서가 곧 화면 격자 순서다.
 * 각 행: tagName, address, alarmMsg, level, lampId
 *
 * lampId는 짝이 되는 램프 태그(folders_tags)의 id다. 값 응답이 이 id를 키로 오기 때문에
 * 목록을 받을 때 같이 받아 둔다 — 화면에 숫자를 적어 두면 DB를 다시 만드는 순간
 * 램프가 엉뚱한 칸에 붙는다.
 */
export function getAlarmTagList() {
  return axiosInstance.get('/api/scada/getAlarmTagList').then((res) => res.data);
}

/**
 * 램프 실시간값 — C#(PlcApiServer)을 직접 호출한다. 자바를 거치지 않는다.
 *   { success, lastPollAt, values: { "<folders_tags.id>": 0|1|null } }
 *
 * 자바 응답과 달리 ApiResponse로 감싸여 있지 않아서 res.data가 곧 이 객체다.
 * 키가 이름이 아니라 folders_tags.id라서, 목록에 실려 온 lampId로 찾는다.
 *
 * C#은 읽기 실패한 태그를 null로 주므로, null은 "꺼짐"이 아니라 "모름"이다.
 */
export function getAlarmLampValues() {
  return plcApiInstance.get('/api/foldertag/values').then((res) => res.data);
}
