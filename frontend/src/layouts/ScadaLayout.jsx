import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';
import { findScadaMenu, filterScadaMenu } from '../constants/scadaMenu';
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
  const { user, canView, canControl, logout } = useAuth();

  const current = findScadaMenu(location.pathname);
  // 하단 메뉴바에는 볼 권한이 있는 화면만 깐다(관리자 전용 화면, 권한 0인 화면이 사라진다).
  const menus = filterScadaMenu(canView);
  const locked = !canControl(current.key);

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
            {/* 잠긴 이유를 적어 두지 않으면 현장에서는 "화면이 고장났다"로 읽힌다.
                화면을 회색으로 덮지 않는 것도 같은 이유다 — 값은 계속 또렷해야 한다. */}
            {locked && <span className="hmi-readonly-badge">조회 전용</span>}
          </div>

          <ScadaClock />

          <button type="button" className="hmi-logout" onClick={handleLogout}>
            <IconLogout size={16} />
            <span>로그아웃</span>
            {user?.userName && <span className="hmi-logout-user">({user.userName})</span>}
          </button>
        </div>

        {/* 제어 권한이 없으면 화면 전체를 한 번에 잠근다.
            fieldset[disabled]는 안의 button/input을 브라우저 차원에서 죽여서
            클릭 이벤트조차 발생하지 않는다(숫자패드도 뜨지 않는다). 화면 9개의
            조작 요소가 전부 button/input이라 이 한 겹으로 빠짐없이 덮인다 —
            div에 onClick을 다는 조작이 생기면 여기서 새므로 그때는 방식을 바꿔야 한다.

            div를 새로 끼우지 않고 .hmi-body 자신을 fieldset으로 둔 이유는,
            .hmi-body > * 선택자가 각 화면의 캔버스를 그리기 때문이다.
            사이에 한 겹을 넣으면 그 선택자가 fieldset을 잡아 9개 화면이 전부 깨진다. */}
        <fieldset className="hmi-body" disabled={locked}>
          <Outlet />
        </fieldset>

        {!current.hideMenuBar && (
          <div className="hmi-menu">
            {menus.map((menu) => (
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
