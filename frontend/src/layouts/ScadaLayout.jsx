import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';
import { findScadaMenu, filterScadaMenu } from '../constants/scadaMenu';
import ScadaLogo from '../components/scada/ScadaLogo';
import ScadaClock from '../components/scada/ScadaClock';
import { useAuth } from '../context/AuthContext';
import { checkSession } from '../api/scada/scadaAuthApi';
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

  /* 화면을 옮길 때마다 서버 세션이 살아 있는지 확인한다.

     JSP는 화면 이동이 곧 서버 요청이라 이게 거저 됐는데, 리액트 라우터는 서버에 아무것도
     보내지 않는다. 값 읽기까지 C# 직통이라 자바 세션이 죽어도 화면은 멀쩡히 돌고 헤더에
     이름도 그대로 보인다 — 그대로 두면 버튼을 누를 때에야 로그인 화면으로 튕긴다.

     조회 API에 세션 검사를 넣는 방법도 있었지만, 자바를 부르는 화면이 9개 중 5개뿐이라
     (온도제어·분위기제어·쿨링타워·메인은 C#만 본다) 화면마다 동작이 갈린다. 레이아웃 한
     곳에 두면 화면이 늘어도 자동으로 따라온다.

     응답과 실패를 모두 버린다. 401이면 axiosInstance가 저장소를 비우고 로그인 화면으로
     보내고, 그 밖의 실패(자바가 꺼짐 등)로 화면을 막을 이유는 없다 — 값 읽기는 C# 직통이라
     자바가 없어도 화면은 제 몫을 한다.

     한 화면을 계속 켜두면 옮길 일이 없어 검사할 기회도 없다. 그 사이 세션이 죽으면 여전히
     버튼을 누를 때 알게 되는데, 보고만 있는 동안은 조작도 없으니 그대로 둔다. */
  useEffect(() => {
    checkSession().catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    if (!window.confirm('로그아웃하시겠습니까?')) return;
    logout();
    navigate('/login', { replace: true });
  };

  /* 안드로이드 태블릿에서 버튼을 1초쯤 누르고 있으면 브라우저의 롱프레스 메뉴
     (다운로드·공유·인쇄)가 떠서 조작을 가로챈다. 이 화면의 조작 버튼은 2초를 눌러야
     값이 나가는 모멘터리라, 정상 조작이 매번 그 메뉴에 막힌다.

     touch-action / user-select로는 막히지 않는다 — 롱프레스 메뉴는 contextmenu
     이벤트로 뜨므로 그 이벤트를 막아야 한다(작화 그림 위에서는 '이미지 다운로드'로 뜬다).

     문서 전체를 막지는 않는다. 표의 글자는 그대로 끌어서 복사할 수 있어야 하고,
     PC에서 오른쪽 클릭도 살려 둔다 — 버튼과 그림 위에서만 막는다. */
  const blockLongPressMenu = (e) => {
    if (e.target.closest?.('button, img, svg, input, .hmi-lampbox')) e.preventDefault();
  };

  return (
    <div className="hmi-root" onContextMenu={blockLongPressMenu}>
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
