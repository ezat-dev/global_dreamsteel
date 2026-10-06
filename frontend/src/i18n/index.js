import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/* ===========================================================================
   한/영 전환 — react-i18next.

   문구는 언어별 폴더의 JSON 사전에 둔다(ko/, en/). 파일 하나가 묶음(namespace) 하나다 —
   common.json은 메뉴·공통 버튼, 화면마다 파일을 하나씩 더 둔다(alarm.json, drive.json …).
   폴더에 파일을 넣으면 아래 glob이 알아서 읽으므로 이 파일은 고칠 필요가 없다.
   두 언어의 키가 서로 맞는지는 scripts/i18n-check.mjs로 확인한다.

   en/server.json은 사전이 아니라 바꿈표다 — 백엔드가 한글로 보내는 오류 문구를
   영어로 바꾼다(translateServerMessage). 키에 '.'이 들어 있어 i18next 키로 쓰지 않는다.

   고른 언어는 기기마다 브라우저에 기억한다(사용자별이 아니다 — 현장 태블릿은 여럿이 같이 쓴다).
   영어 사전에 키가 빠져 있으면 한국어가 나온다(fallbackLng) — 키 이름이 화면에 찍히지 않는다.
   =========================================================================== */

export const LANG_KEY = 'scada_lang';
export const LANGS = ['ko', 'en'];

const files = import.meta.glob('./*/*.json', { eager: true });

const resources = {};
let serverEn = {};
Object.entries(files).forEach(([path, mod]) => {
  const [, lng, ns] = path.match(/^\.\/(\w+)\/(\w+)\.json$/) ?? [];
  if (!lng || !ns) return;
  const data = mod.default ?? mod;
  if (ns === 'server') {
    if (lng === 'en') serverEn = data;
    return;
  }
  resources[lng] = resources[lng] ?? {};
  resources[lng][ns] = data;
});

function savedLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return LANGS.includes(v) ? v : 'ko';
  } catch {
    return 'ko';
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: savedLang(),
  fallbackLng: 'ko',
  ns: Object.keys(resources.ko ?? {}),
  defaultNS: 'common',
  // React가 이미 이스케이프한다 — 두 번 하면 '&amp;'가 화면에 찍힌다
  interpolation: { escapeValue: false },
  returnNull: false,
});

document.documentElement.lang = i18n.language;

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_KEY, lng);
  } catch {
    // 저장 못 하는 환경이면 다음에 열 때 한국어로 시작할 뿐이다
  }
  document.documentElement.lang = lng;
});

/** 언어 바꾸기 — 화면 전체가 새로고침 없이 바뀐다 */
export function setLanguage(lng) {
  if (LANGS.includes(lng)) i18n.changeLanguage(lng);
}

/**
 * 백엔드가 보낸 한글 문구를 지금 언어로. 한국어면 그대로 돌려준다.
 * 바꿈표(en/server.json)에 없는 문구도 그대로 둔다 — 한글이라도 뜻은 전해진다.
 *
 * 'PLC 쓰기 실패 사유 — 상세' 꼴(writeTag 실패)은 ' — ' 앞의 분류만 바꾸고 뒤의
 * 상세(C#·자바 예외 원문)는 그대로 붙인다.
 */
export function translateServerMessage(msg) {
  if (!msg || typeof msg !== 'string' || i18n.language === 'ko') return msg;
  if (serverEn[msg]) return serverEn[msg];
  const cut = msg.indexOf(' — ');
  if (cut > 0) {
    const head = msg.slice(0, cut);
    if (serverEn[head]) return `${serverEn[head]}${msg.slice(cut)}`;
  }
  return msg;
}

export default i18n;
