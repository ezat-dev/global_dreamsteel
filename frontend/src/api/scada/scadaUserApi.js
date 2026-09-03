import axiosInstance from '../axiosInstance';

/**
 * 사용자 등록 — scada_user에 1행 넣는다.
 *
 * @param payload userId, userPassword, userName, userRole('1' 관리자 / '2' 일반)
 */
export function insertUser(payload) {
  return axiosInstance.post('/api/scada/insertUser', payload).then((res) => res.data);
}

/**
 * 사용자 목록 — 관리자 화면 전용. 삭제 표시된 사용자도 함께 내려온다.
 * 각 행: id, userId, userPassword, userName, userRole, deleteYn
 */
export function getUserList() {
  return axiosInstance.get('/api/scada/getUserList').then((res) => res.data);
}

/**
 * 사용자 수정 — id로 한 행을 통째로 덮어쓴다.
 *
 * 삭제 전용 API는 없다. deleteYn을 'Y'로 담아 보내면 소프트 삭제이고,
 * 'N'으로 되돌리면 복구다.
 *
 * @param payload id, userId, userPassword, userName, userRole, deleteYn
 */
export function updateUser(payload) {
  return axiosInstance.post('/api/scada/updateUser', payload).then((res) => res.data);
}
