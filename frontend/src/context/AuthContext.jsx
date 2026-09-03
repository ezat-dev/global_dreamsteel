import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'scada_user';
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

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
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
