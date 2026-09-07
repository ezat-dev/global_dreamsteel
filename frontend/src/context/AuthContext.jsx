import { createContext, useContext, useState } from 'react';
import SCADA_MENU, { AUTH_CONTROL, AUTH_NONE, AUTH_VIEW } from '../constants/scadaMenu';

const STORAGE_KEY = 'scada_user';
const MENU_BY_KEY = new Map(SCADA_MENU.map((m) => [m.key, m]));
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  /**
   * @param userData 로그인 API 응답의 사용자 정보
   * @param remember true면 브라우저를 닫아도 유지(localStorage), false면 탭 종료 시 로그아웃(sessionStorage)
   */
  const login = (userData, remember = true) => {
    setUser(userData);
    try {
      const store = remember ? localStorage : sessionStorage;
      store.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // localStorage/sessionStorage 사용 불가 환경이어도 로그인 자체는 동작하도록 무시
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  /* scada_user.user_role은 VARCHAR라 '1'로 내려온다(숫자 1이 아니다).
     권한이 없으면(로그인 응답에 user_role이 없던 시절의 저장값 등) 관리자로 보지 않는다 —
     기능을 감추는 쪽이 안전한 기본값이다.

     화면마다 따로 비교하지 않고 여기서 한 번만 판단한다. 판정 기준이 바뀌어도
     이 줄만 고치면 메뉴·라우트·버튼이 같이 따라온다. */
  const isAdmin = String(user?.userRole ?? '') === '1';

  /**
   * 화면 하나에 대한 권한 레벨 — 0 없음 / 1 조회 / 2 제어.
   *
   * 판정을 여기 한 곳에 모은다. 메뉴바·메인화면 타일·라우트 차단·제어 잠금이 모두
   * 이 함수를 거치므로, 기준이 바뀌어도 고칠 곳이 하나다.
   *
   * 권한 컬럼이 없는 화면(메인화면)과, 응답에 값이 아예 실려 오지 않은 경우는 제어로 본다.
   * 백엔드가 아직 컬럼을 안 내려주는 동안에도 지금과 똑같이 동작하게 하려는 것이다 —
   * 반대로 두면 배포하는 순간 모든 화면이 사라져서 현장이 멈춘다.
   * 그래서 로그인 응답에 auth_* 8개가 반드시 실려야 한다(빠지면 권한이 조용히 무시된다).
   */
  const screenLevel = (key) => {
    const menu = MENU_BY_KEY.get(key);
    if (!menu) return AUTH_NONE;
    if (menu.adminOnly) return isAdmin ? AUTH_CONTROL : AUTH_NONE;
    if (isAdmin || !menu.authField) return AUTH_CONTROL;

    const raw = user?.[menu.authField];
    if (raw == null || raw === '') return AUTH_CONTROL;
    const level = Number(raw);
    return Number.isFinite(level) ? level : AUTH_CONTROL;
  };

  /** 화면이 메뉴에 보이고 들어갈 수 있는지 */
  const canView = (key) => screenLevel(key) >= AUTH_VIEW;

  /* 조작할 것이 없는 화면(트렌드·경보이력)은 조회 권한만 있으면 그만이다.
     여기서 제어 권한까지 요구하면 조회 버튼이 잠겨서 화면을 열어 준 의미가 없어진다. */
  const canControl = (key) => {
    const menu = MENU_BY_KEY.get(key);
    const need = menu?.control ? AUTH_CONTROL : AUTH_VIEW;
    return screenLevel(key) >= need;
  };

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, screenLevel, canView, canControl, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
