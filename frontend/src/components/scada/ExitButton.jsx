import { IconPower } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

/**
 * 종료 버튼 — 상단 제목줄(로그아웃 왼쪽)과 로그인 화면(한/영 왼쪽)에 둔다.
 *
 * 누른 기기의 브라우저 창을 닫는다(서버 PC면 서버 PC의 키오스크 크롬, 태블릿이면
 * 그 태블릿의 크롬 탭). 기기끼리 연동하지 않는다.
 *
 * 크롬은 '뒤로 가기 기록이 없는 창'만 스크립트로 닫게 해 준다. 그래서 앱 안의 화면 이동을
 * 전부 replace로 해서 기록을 한 칸으로 유지한다(ScadaLayout 하단 메뉴, MainPage,
 * ScadaLoginPage, axiosInstance). 바로가기(키오스크·홈 화면)로 연 창은 첫 칸이 이 앱이라 닫힌다.
 * 주소창에 직접 쳐서 연 탭처럼 앞에 다른 기록이 있으면 크롬이 막는다 — 그때는 창이
 * 그대로 남으므로 안내만 띄운다. 안드로이드는 탭이 닫히고 크롬 앱 자체는 남는다.
 *
 * 로그아웃은 하지 않는다 — 다음에 켤 때 로그인 유지 설정을 그대로 따른다.
 */
export default function ExitButton({ className = '' }) {
  const { t } = useTranslation();

  const handleExit = () => {
    if (!window.confirm(t('layout.exitConfirm'))) return;
    window.close();
    /* 닫혔으면 이 타이머는 돌지 않는다. 남아 있으면 크롬이 막은 것이다. */
    setTimeout(() => {
      if (!window.closed) window.alert(t('layout.exitBlocked'));
    }, 300);
  };

  return (
    <button
      type="button"
      className={`hmi-exit ${className}`.trim()}
      onClick={handleExit}
      title={t('layout.exit')}
    >
      <IconPower size={16} />
      <span>{t('layout.exit')}</span>
    </button>
  );
}
