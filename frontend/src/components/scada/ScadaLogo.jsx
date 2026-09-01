import { useState } from 'react';

/**
 * 회사 로고. 이미지 파일은 frontend/public/logo.png에 둔다(빌드 없이 교체 가능).
 * 파일이 없거나 깨졌으면 회사명 텍스트로 대체해서, 로고를 아직 안 넣은 상태에서도
 * 레이아웃이 무너지지 않게 한다.
 */
export default function ScadaLogo({ className = '' }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`hmi-logo ${className}`.trim()}>
      {failed ? (
        <span className="hmi-logo-text">(주)글로벌드림스틸</span>
      ) : (
        <img src="/logo.png" alt="(주)글로벌드림스틸" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
