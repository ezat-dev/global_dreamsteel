// SCADA(HMI) 화면 메뉴 — 화면 하단 메뉴바와 라우팅, 상단 제목 표시에 모두 쓰인다.
// title은 상단 제목바에 그대로 찍히고, label은 하단 메뉴 버튼에 찍힌다.
// (제목바는 "구 동 화 면"처럼 자간을 벌려 표시하는데, 자간은 CSS로 준다.)
//
// hideMenuBar: 그 화면에서는 하단 메뉴바를 감춘다. 메인화면은 화면 전체가 이미
// 이동 버튼판이라 아래에 같은 메뉴가 또 깔리면 중복이다.
//
// adminOnly: 관리자(user_role '1')에게만 보인다. 메뉴에서 감추는 것만으로는
// 주소를 직접 쳐서 들어갈 수 있어서, router/scadaRoutes.js에도 같은 표시를 달고
// App.jsx에서 RequireAdmin으로 막는다 — 두 곳을 같이 고쳐야 한다.
const SCADA_MENU = [
  { key: 'main', label: '메인화면', title: '메인화면', path: '/', hideMenuBar: true },
  { key: 'drive', label: '구동화면', title: '구동화면', path: '/drive' },
  { key: 'combustion', label: '연소화면', title: '연소화면', path: '/combustion' },
  { key: 'temp', label: '온도제어', title: '온도제어', path: '/temp' },
  { key: 'atmosphere', label: '분위기제어', title: '분위기제어', path: '/atmosphere' },
  { key: 'cooling', label: '쿨링타워', title: '쿨링타워', path: '/cooling' },
  { key: 'trend', label: '트랜드', title: '트랜드', path: '/trend' },
  { key: 'alarm', label: '알람화면', title: '알람화면', path: '/alarm' },
  { key: 'alarmHistory', label: '경보이력', title: '경보이력', path: '/alarmHistory' },
  { key: 'log', label: '로그', title: '로그', path: '/log', adminOnly: true },
];

export default SCADA_MENU;

/** 로그인한 사용자에게 보여줄 메뉴만 걸러낸다(하단 메뉴바·메인화면 타일 공용). */
export function filterScadaMenu(isAdmin) {
  return isAdmin ? SCADA_MENU : SCADA_MENU.filter((m) => !m.adminOnly);
}

/** 현재 pathname에 해당하는 메뉴를 찾는다. 못 찾으면 메인화면으로 본다. */
export function findScadaMenu(pathname) {
  // '/'는 모든 경로의 접두사이므로 정확히 일치하는 것을 먼저 찾는다.
  return (
    SCADA_MENU.find((m) => m.path === pathname) ??
    SCADA_MENU.find((m) => m.path !== '/' && pathname.startsWith(`${m.path}/`)) ??
    SCADA_MENU[0]
  );
}
