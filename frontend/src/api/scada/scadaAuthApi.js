import axiosInstance from '../axiosInstance';

// 로그인 — global_dream.user를 조회한다.
export function login(userId, userPassword) {
  return axiosInstance.post('/api/scada/login', { userId, userPassword }).then((res) => res.data);
}

/* 서버 세션이 살아 있는지만 확인한다. 화면을 옮길 때마다 ScadaLayout이 한 번씩 부른다.

   JSP는 화면 이동이 곧 서버 요청이라 세션이 끊기면 그 자리에서 로그인 화면으로 돌아갔는데,
   리액트 라우터는 서버에 아무것도 보내지 않는다. 값 읽기까지 C# 직통이라, 자바 세션이
   죽어도 화면은 멀쩡히 돌고 헤더에 이름도 그대로 보인다 — 버튼을 누를 때에야 드러난다.
   이 요청이 그 빈자리를 메운다.

   응답은 쓰지 않는다. 세션이 없으면 자바가 COMMON_401을 주고, axiosInstance의 인터셉터가
   저장해 둔 로그인 정보를 지우고 로그인 화면으로 보낸다 — 여기서 할 일이 없다. */
export function checkSession() {
  return axiosInstance.get('/api/scada/checkSession').then((res) => res.data);
}
