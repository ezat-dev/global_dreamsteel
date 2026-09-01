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

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
