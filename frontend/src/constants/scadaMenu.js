// SCADA(HMI) 화면 메뉴 — 화면 하단 메뉴바와 라우팅, 상단 제목 표시에 모두 쓰인다.
// title은 상단 제목바에 그대로 찍히고, label은 하단 메뉴 버튼에 찍힌다.
// (제목바는 "구 동 화 면"처럼 자간을 벌려 표시하는데, 자간은 CSS로 준다.)
//
// hideMenuBar: 그 화면에서는 하단 메뉴바를 감춘다. 메인화면은 화면 전체가 이미
// 이동 버튼판이라 아래에 같은 메뉴가 또 깔리면 중복이다.
//
// adminOnly: 관리자(user_role '1')에게만 보인다. 사용자별 권한으로 줄 수 없다.
// 지금은 쓰는 화면이 없다 — 로그·엔지니어링도 사용자별 권한으로 옮겼다.
// 판정은 AuthContext의 screenLevel 한 곳이 하고, 메뉴·타일·주소 직접 입력이 다 그걸 따른다.
//
// authField: 이 화면의 권한이 담긴 scada_user 컬럼(camelCase). 값은 0 없음 / 1 조회 / 2 제어.
// 키에서 컬럼명을 유추하지 않고 적어 둔다 — alarmHistory ↔ authAlarmHist처럼 어긋나는
// 짝이 있어서, 규칙으로 만들면 예외를 기억해야 한다.
//
// control: 이 화면에 "조작"이라 부를 것이 있는지. 경보이력·로그는 조회 화면이라
// 1과 2가 같은 뜻이고, 여기에 제어 잠금을 걸면 조회 버튼까지 잠겨 화면이 무용지물이 된다.
// 권한 편집 UI도 이 표시를 보고 2단계/3단계를 그린다.
//
// lockScreen: false면 제어 권한이 없어도 화면 전체를 잠그지 않는다(ScadaLayout의 fieldset).
// 화면 대부분이 조회이고 일부만 "제어"인 화면에 쓴다 — 트렌드가 그렇다. 조회·자동갱신·
// 선 토글·메모·내려받기는 조회 권한으로 되고, y축 범위 수정만 제어 권한이 있어야 한다.
// 그 일부는 화면이 canControl로 직접 막는다. 적지 않으면 지금처럼 화면 전체를 잠근다.
//
// defaultAuth: 새 사용자의 기본 권한과, 권한 값이 아예 안 실려 왔을 때 쓸 값.
// 적지 않으면 control 화면은 2, 조회 화면은 1이다(scada_user DDL의 DEFAULT와 같다).
// 로그·엔지니어링은 원래 관리자만 보던 화면이라 0(없음)으로 둔다 — DDL도 DEFAULT 0이다.
// 둘을 맞춰야 한다: 화면 기본값과 DB 기본값이 어긋나면 보이는 것과 저장되는 것이 달라진다.

/** 권한 레벨 — 숫자로 두어 비교를 >= 하나로 끝낸다.
    메뉴 배열보다 위에 둔다 — 아래 defaultAuth가 이 값을 쓰는데, const는 선언 전에
    읽으면 오류라 순서가 바뀌면 이 파일을 불러오는 순간 화면 전체가 죽는다. */
export const AUTH_NONE = 0;
export const AUTH_VIEW = 1;
export const AUTH_CONTROL = 2;

const SCADA_MENU = [
  { key: 'main', label: '메인화면', title: '메인화면', path: '/', hideMenuBar: true },
  { key: 'drive', label: '구동화면', title: '구동화면', path: '/drive', authField: 'authDrive', control: true },
  { key: 'combustion', label: '연소화면', title: '연소화면', path: '/combustion', authField: 'authCombustion', control: true },
  { key: 'temp', label: '온도제어', title: '온도제어', path: '/temp', authField: 'authTemp', control: true },
  { key: 'atmosphere', label: '분위기제어', title: '분위기제어', path: '/atmosphere', authField: 'authAtmosphere', control: true },
  { key: 'cooling', label: '쿨링타워', title: '쿨링타워', path: '/cooling', authField: 'authCooling', control: true },
  /* 트렌드는 거의 조회 화면이지만 선별 y축 범위 수정(모든 기기 공통 설정)이 있어 제어 단계를 둔다.
     기본은 조회 — DB의 auth_trend DEFAULT 1과 맞춘다. 화면은 잠그지 않고 범위 수정만 막는다. */
  {
    key: 'trend', label: '트렌드', title: '트렌드', path: '/trend',
    authField: 'authTrend', control: true, defaultAuth: AUTH_VIEW, lockScreen: false,
  },
  { key: 'alarm', label: '알람화면', title: '알람화면', path: '/alarm', authField: 'authAlarm', control: true },
  /* 지금 떠 있는 경보만 — 왼쪽 경보이력(발생), 오른쪽 알람화면(램프 켜짐). 보기 전용이라
     control이 없다(없음/조회 두 단계). 기본은 조회 — DB의 auth_alarm_now DEFAULT 1과 맞춘다. */
  {
    key: 'alarmNow', label: '현재경보', title: '현재경보', path: '/alarmNow',
    authField: 'authAlarmNow', defaultAuth: AUTH_VIEW,
  },
  { key: 'alarmHistory', label: '경보이력', title: '경보이력', path: '/alarmHistory', authField: 'authAlarmHist' },
  /* 설비 설정값(시간·온도 기준·PV 보정)을 바꾸는 화면이다. 처음엔 관리자 전용이었는데
     사용자별로 열 수 있게 바꿨다 — 기본은 없음이라 관리자가 사용자 정보 수정에서 열어 줘야 보인다. */
  {
    key: 'engineering', label: '엔지니어링', title: '엔지니어링', path: '/engineering',
    authField: 'authEngineering', control: true, defaultAuth: AUTH_NONE,
  },
  /* 조작 이력 화면. 조회만 하는 화면이라 control이 없다(없음/조회 두 단계).
     예전에는 관리자 전용이었다 — 기본을 없음으로 두어 그 상태를 그대로 이어 간다. */
  { key: 'log', label: '로그', title: '로그', path: '/log', authField: 'authLog', defaultAuth: AUTH_NONE },
];

export default SCADA_MENU;

/** 권한을 사용자별로 줄 수 있는 화면들 — 권한 편집 격자가 그리는 순서 그대로다. */
export const AUTH_SCREENS = SCADA_MENU.filter((m) => m.authField);

/**
 * 로그인한 사용자에게 보여줄 메뉴만 걸러낸다(하단 메뉴바·메인화면 타일 공용).
 * @param canView AuthContext의 canView(key) — 관리자 여부와 화면별 권한을 함께 본다.
 */
export function filterScadaMenu(canView) {
  return SCADA_MENU.filter((m) => canView(m.key));
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
