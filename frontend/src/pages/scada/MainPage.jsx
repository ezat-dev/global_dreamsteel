import { useNavigate } from 'react-router-dom';
import SCADA_MENU from '../../constants/scadaMenu';

/**
 * 메인화면 — 로그인 직후 들어오는 화면 이동 버튼판.
 *
 * 버튼 목록을 여기에 따로 적지 않고 scadaMenu에서 자기 자신(메인화면)만 빼고 만든다.
 * 메뉴가 늘거나 이름이 바뀌면 scadaMenu 한 곳만 고치면 하단 메뉴바·상단 제목·이 화면이
 * 같이 따라온다.
 */
export default function MainPage() {
  const navigate = useNavigate();
  const items = SCADA_MENU.filter((m) => m.key !== 'main');

  return (
    <div className="hmi-mainmenu">
      <div className="hmi-mainmenu-grid">
        {items.map((menu) => (
          <button
            key={menu.key}
            type="button"
            className="hmi-mainmenu-tile"
            onClick={() => navigate(menu.path)}
          >
            {menu.label}
          </button>
        ))}
      </div>
    </div>
  );
}
