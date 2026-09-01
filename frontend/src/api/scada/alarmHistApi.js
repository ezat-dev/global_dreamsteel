import axiosInstance from '../axiosInstance';

// 경보이력 조회 — global_dreamsteel.alarm_list
// 응답은 ApiResponse 형태({ success, code, message, data })라 호출부에서 res.data로 목록을 꺼낸다.
export function getAlarmList(params) {
  return axiosInstance.get('/api/scada/getAlarmList', { params }).then((res) => res.data);
}
