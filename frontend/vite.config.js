import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5051,
    // localhost/::1 뿐 아니라 같은 네트워크의 다른 기기에서도 접속 가능하게 모든 인터페이스에 바인딩
    host: true,
    // 5051이 이미 사용 중이면 다른 포트로 조용히 넘어가지 않고 바로 에러를 낸다
    // (포트 충돌을 못 알아채고 엉뚱한 포트에 뜨는 걸 방지)
    strictPort: true,
  },
});
