import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * 관리자(user_role '1')가 아니면 메인화면으로 되돌린다.
 *
 * RequireAuth 안쪽에서만 쓰이므로 로그인 여부는 이미 걸러진 상태다 —
 * 여기서는 권한만 본다. 로그인 화면으로 보내지 않고 메인화면으로 보내는 이유는,
 * 로그인은 되어 있으니 다시 로그인할 일이 아니라 그냥 볼 수 없는 화면이기 때문이다.
 */
export default function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
