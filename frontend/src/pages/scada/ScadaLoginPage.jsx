import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as loginApi } from '../../api/scada/scadaAuthApi';
import ScadaLogo from '../../components/scada/ScadaLogo';
import '../../styles/scada.css';

/** 회사 홈페이지의 인발 공정 8단계 이미지. public/company/process/ 에 그대로 둔다. */
const PROCESS_STEPS = Array.from(
  { length: 8 },
  (_, i) => `/company/process/in-0${i + 1}.png`,
);

/**
 * SCADA 로그인 화면.
 * global_dream.user를 보는 /api/scada/login을 호출한다.
 * 성공하면 원래 가려던 화면으로, 없으면 메인화면으로 보낸다.
 */
export default function ScadaLoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await loginApi(userId.trim(), password);
      login(res.data, true);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hmi-root">
      <div className="hmi-login">
        {/* 배경 워터마크. 흰 배경을 날리는 합성은 CSS에서 한다(.hmi-login-watermark).
            이미지가 아직 없거나 경로가 틀렸을 때 깨진 아이콘이 뜨면 배경이 지저분해지므로,
            실패한 칸만 감춘다 — flex 칸은 남아서 나머지 간격이 흔들리지 않는다. */}
        <div className="hmi-login-watermark" aria-hidden="true">
          {PROCESS_STEPS.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              draggable="false"
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
          ))}
        </div>

        <div className="hmi-login-box">
          <ScadaLogo className="hmi-logo--login" />
          <div className="hmi-login-titlebar">로그인</div>

          <form className="hmi-login-body" onSubmit={handleSubmit}>
            <div className="hmi-login-field">
              <label htmlFor="scada-login-id">아이디</label>
              <input
                id="scada-login-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="hmi-login-field">
              <label htmlFor="scada-login-pw">비밀번호</label>
              <input
                id="scada-login-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="hmi-login-error">{error}</div>}

            <button type="submit" className="hmi-btn hmi-login-submit" disabled={submitting}>
              {submitting ? '로그인 중...' : '로그인'}
            </button>

            <div className="hmi-login-foot">GLOBAL DREAM STEEL · 사내 폐쇄망 전용</div>
          </form>
        </div>
      </div>
    </div>
  );
}
