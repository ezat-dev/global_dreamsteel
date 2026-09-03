import axios from 'axios';

// VITE_API_BASE_URL이 없으면, 지금 프론트에 접속한 주소(호스트명)를 그대로 백엔드 주소로 쓴다.
// localhost:5051로 열든 192.168.x.x:5051로 열든 백엔드(8081)도 같은 호스트를 보게 되어,
// 다른 PC에서 접속했을 때 "그 PC의 localhost:8081"을 잘못 호출하는 문제를 방지한다.
const defaultBaseUrl = `http://${window.location.hostname}:8081`;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseUrl,
  timeout: 10000,
  /* 프론트(5051)와 백엔드(8081)가 다른 오리진이라, 이걸 켜지 않으면 브라우저가
     세션 쿠키(JSESSIONID)를 실어 보내지 않는다 — 로그인할 때 담아 둔 서버 세션이
     다음 요청에서 새 세션으로 갈려 버린다. 백엔드는 CorsConfig에서 이미
     allowCredentials(true)로 받아 줄 준비가 되어 있다. */
  withCredentials: true,
});

export default axiosInstance;
