import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n';

/**
 * 한/영 전환 버튼 — 상단 제목줄(로그아웃 왼쪽)과 로그인 화면에 둔다.
 *
 * 버튼 글자는 "바뀔 언어"다(한국어 화면이면 EN, 영어 화면이면 한). 누르면 화면 전체가
 * 새로고침 없이 바뀌고, 고른 언어는 이 기기에 기억된다(i18n/index.js).
 * 글자는 사전(common.lang)에서 가져온다 — 영어 사전의 label이 '한'이다.
 */
export default function LangToggle({ className = '' }) {
  const { t, i18n } = useTranslation();
  const next = i18n.language === 'en' ? 'ko' : 'en';

  return (
    <button
      type="button"
      className={`hmi-lang ${className}`.trim()}
      onClick={() => setLanguage(next)}
      title={t('lang.title')}
      aria-label={t('lang.title')}
    >
      {t('lang.label')}
    </button>
  );
}
