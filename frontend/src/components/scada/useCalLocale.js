import { registerLocale } from 'react-datepicker';
import { enUS, ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

/* ===========================================================================
   달력(react-datepicker)의 언어 설정 — 경보이력·로그·트렌드·트렌드 메모가 같이 쓴다.

   달력의 요일·월 이름, 시각 목록(오후 3:00 / 3:00 PM)은 locale 이름으로 고른다.
   이름과 date-fns 로케일을 짝지어 한 번 등록해 두고, 지금 언어의 이름을 돌려준다.

   달력 제목 형식도 언어마다 다르다 — 기본값 'LLLL yyyy'는 ko에서 "9월 2026"이라
   한국어는 '2026년 9월', 영어는 'September 2026'으로 둔다(common.cal.title).
   =========================================================================== */

registerLocale('ko', ko);
registerLocale('en', enUS);

/** 달력 props 중 언어에 따라 바뀌는 것만 — 각 화면의 calProps에 펼쳐 넣는다 */
export default function useCalLocale() {
  const { t, i18n } = useTranslation();
  return {
    locale: i18n.language === 'en' ? 'en' : 'ko',
    timeCaption: t('cal.time'),
    dateFormatCalendar: t('cal.title'),
    /* 오른쪽 시각 목록 — 기본값('p')은 로케일을 따라 영어에서 "3:00 PM"이 된다.
       입력칸(yyyy-MM-dd HH:mm…)과 같은 24시간제로 맞춘다. */
    timeFormat: 'HH:mm',
  };
}
