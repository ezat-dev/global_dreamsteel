import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * 볼 권한(레벨 1 이상)이 없는 화면이면 메인화면으로 되돌린다.
 *
 * 메뉴바와 메인화면 타일에서 감추는 것만으로는 주소를 직접 쳐서 들어갈 수 있다.
 * 관리자 전용 화면(로그)도 같은 길로 막힌다 — AuthContext.screenLevel이 adminOnly를
 * 함께 보기 때문에, 화면마다 다른 가드를 둘 필요가 없다.
 *
 * RequireAuth 안쪽에서만 쓰이므로 로그인 여부는 이미 걸러진 상태다. 로그인 화면이 아니라
 * 메인화면으로 보내는 이유는, 로그인은 되어 있으니 다시 로그인할 일이 아니라
 * 그냥 볼 수 없는 화면이기 때문이다.
 */
export default function RequireScreen({ screen, children }) {
  const { canView } = useAuth();

  if (!canView(screen)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
