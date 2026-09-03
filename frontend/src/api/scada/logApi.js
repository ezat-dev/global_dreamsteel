import axiosInstance from '../axiosInstance';

// 로그 조회 — scada_log(조작 이력: PLC 주소에 써 넣은 값)
// 응답은 ApiResponse 형태({ success, code, message, data })라 호출부에서 res.data로 목록을 꺼낸다.
export function getLogList(params) {
  return axiosInstance.get('/api/scada/getLogList', { params }).then((res) => res.data);
}
