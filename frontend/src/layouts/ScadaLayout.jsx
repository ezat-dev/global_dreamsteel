import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';
import SCADA_MENU, { findScadaMenu } from '../constants/scadaMenu';
import ScadaLogo from '../components/scada/ScadaLogo';
import ScadaClock from '../components/scada/ScadaClock';
import { useAuth } from '../context/AuthContext';
import '../styles/scada.css';

/**
 * SCADA(HMI) 화면 공통 뼈대.
 *
 *   ┌────────────┬──────────────────────────┬────────────┐
 *   │   로고     │      화 면  이 름        │  로그아웃  │
 *   ├────────────┴──────────────────────────┴────────────┤
 *   │                    화면 내용(Outlet)               │
 *   ├───────────────────────────────────────────────────┤
 *   │ 메인화면 │ 구동화면 │ 연소화면 │ ... │  경보이력  │
 *   └───────────────────────────────────────────────────┘
 *
 * 화면 제목은 각 페이지가 따로 넘기지 않고 현재 경로로 scadaMenu에서 찾는다.
 * 하단 메뉴와 제목이 항상 같은 출처를 보므로 둘이 어긋날 일이 없다.
 */
export default function ScadaLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const current = findScadaMenu(location.pathname);

  const handleLogout = () => {
    if (!window.confirm('로그아웃하시겠습니까?')) return;
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="hmi-root">
      <div className="hmi-shell">
        <div className="hmi-header">
          <ScadaLogo />

          <div className="hmi-title">
            <span className="hmi-title-text">{current.title}</span>
          </div>

          <ScadaClock />

          <button type="button" className="hmi-logout" onClick={handleLogout}>
            <IconLogout size={16} />
            <span>로그아웃</span>
            {user?.userName && <span className="hmi-logout-user">({user.userName})</span>}
          </button>
        </div>

        <div className="hmi-body">
          <Outlet />
        </div>

        {!current.hideMenuBar && (
          <div className="hmi-menu">
            {SCADA_MENU.map((menu) => (
              <button
                key={menu.key}
                type="button"
                className={`hmi-menu-item${menu.key === current.key ? ' active' : ''}`}
                onClick={() => navigate(menu.path)}
              >
                {menu.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
