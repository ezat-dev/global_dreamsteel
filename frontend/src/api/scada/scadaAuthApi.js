import axiosInstance from '../axiosInstance';

// 로그인 — global_dream.user를 조회한다.
export function login(userId, userPassword) {
  return axiosInstance.post('/api/scada/login', { userId, userPassword }).then((res) => res.data);
}
