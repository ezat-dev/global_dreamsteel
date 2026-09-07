import axios from 'axios';

/* ===========================================================================
   C#(PlcApiServer) 직통 인스턴스.

   자바 백엔드(axiosInstance)와 따로 두는 이유가 세 가지 있다.

   1) 주소를 자동으로 못 찾는다.
      자바는 프론트와 같은 PC에 있다고 보고 window.location.hostname:8081로 찾지만,
      C#은 별도 머신에서 돌기 때문에 그 규칙이 통하지 않는다. 그래서 주소를
      VITE_PLC_API_URL로 받는다 — PLC PC의 IP가 바뀌면 이 값을 고쳐 다시 빌드해야 한다.

   2) 타임아웃이 짧아야 한다.
      1초마다 부르는 경로라 자바 쪽 기본값(10초)을 쓰면, C#이 멈춘 순간 응답을
      기다리는 요청이 계속 쌓인다. 한 주기 안에 끝나거나 실패하게 2초로 둔다.

   3) 세션 쿠키를 보내지 않는다.
      C#은 인증이 없고 쿠키를 보지 않는다. withCredentials를 켜면 CORS 규칙만
      까다로워진다(AllowAnyOrigin과 credentials는 같이 못 쓴다).
   =========================================================================== */

// 값이 없으면 프론트와 같은 호스트의 5050을 본다 — C#과 웹을 같은 PC에서 돌리는
// 개발·단독 설치 상황에서는 설정 없이 그냥 동작한다.
const defaultBaseUrl = `http://${window.location.hostname}:5050`;

const plcApiInstance = axios.create({
  baseURL: import.meta.env.VITE_PLC_API_URL || defaultBaseUrl,
  timeout: 2000,
});

export default plcApiInstance;
