import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconUserPlus, IconUserEdit } from '@tabler/icons-react';
import { filterScadaMenu } from '../../constants/scadaMenu';
import UserAddModal from '../../components/scada/UserAddModal';
import UserEditModal from '../../components/scada/UserEditModal';
import { useAuth } from '../../context/AuthContext';

/**
 * 메인화면 — 로그인 직후 들어오는 화면 이동 버튼판.
 *
 * 버튼 목록을 여기에 따로 적지 않고 scadaMenu에서 자기 자신(메인화면)만 빼고 만든다.
 * 메뉴가 늘거나 이름이 바뀌면 scadaMenu 한 곳만 고치면 하단 메뉴바·상단 제목·이 화면이
 * 같이 따라온다.
 *
 * 우측 상단(헤더의 로그아웃 버튼 바로 아래)에 사용자 추가 버튼을 둔다 — 관리자에게만.
 */
export default function MainPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // 권한이 되는 화면 중 자기 자신(메인화면)만 뺀다 — 관리자 전용 타일은 사라진다.
  const items = filterScadaMenu(isAdmin).filter((m) => m.key !== 'main');

  return (
    <div className="hmi-mainmenu">
      {/* 관리자 전용 버튼 묶음 — 헤더의 로그아웃 아래에 세로로 쌓인다.
          폭·정렬은 .hmi-admintools 한 곳에서 관리한다. */}
      {isAdmin && (
        <div className="hmi-admintools">
          <button type="button" className="hmi-adminbtn" onClick={() => setAddOpen(true)}>
            {/* 로그아웃 버튼의 IconLogout과 같은 크기 */}
            <IconUserPlus size={16} />
            <span>사용자 추가</span>
          </button>

          <button type="button" className="hmi-adminbtn" onClick={() => setEditOpen(true)}>
            <IconUserEdit size={16} />
            <span>사용자 정보 수정</span>
          </button>
        </div>
      )}

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

      {addOpen && (
        <UserAddModal
          onClose={() => setAddOpen(false)}
          onCreated={(created) => window.alert(`사용자 '${created.userId}'를 등록했습니다.`)}
        />
      )}

      {/* 수정 모달은 저장 후에도 닫지 않는다 — 여러 명을 이어서 고치는 일이 흔하다 */}
      {editOpen && (
        <UserEditModal
          onClose={() => setEditOpen(false)}
          onSaved={(saved) => window.alert(`사용자 '${saved.userId}' 정보를 수정했습니다.`)}
        />
      )}
    </div>
  );
}
