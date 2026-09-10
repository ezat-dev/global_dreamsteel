import axios from 'axios';
import { STORAGE_KEY } from '../context/AuthContext';

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

/* 세션이 끊긴 상태를 화면에 반영한다.
   서버 세션과 브라우저의 localStorage는 따로 산다 — 백엔드를 강제 종료하면 세션은
   사라지는데 localStorage는 남아서, 헤더에는 이름이 그대로 보이고 화면도 열린다.
   값 읽기는 C#(5050) 직통이라 그때도 되기 때문에, 어긋남이 "버튼을 눌렀을 때"에야
   드러난다. 그 시점에 저장해 둔 로그인 정보를 비우고 로그인 화면으로 보낸다.

   코드(COMMON_401)로 판단한다 — 메시지 문구로 비교하면 문구를 바꿀 때 조용히 깨진다.
   React 밖이라 훅을 쓸 수 없어서 스토리지를 직접 지우고 주소를 바꾼다. */
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.data?.code === 'COMMON_401') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // 스토리지를 못 쓰는 환경이어도 아래 이동은 해야 한다
      }
      // 이미 로그인 화면이면 그대로 둔다(무한 새로고침 방지)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
