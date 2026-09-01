import axios from 'axios';

// VITE_API_BASE_URL이 없으면, 지금 프론트에 접속한 주소(호스트명)를 그대로 백엔드 주소로 쓴다.
// localhost:5051로 열든 192.168.x.x:5051로 열든 백엔드(8081)도 같은 호스트를 보게 되어,
// 다른 PC에서 접속했을 때 "그 PC의 localhost:8081"을 잘못 호출하는 문제를 방지한다.
const defaultBaseUrl = `http://${window.location.hostname}:8081`;

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseUrl,
  timeout: 10000,
});

export default axiosInstance;
