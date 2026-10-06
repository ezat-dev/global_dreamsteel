import { useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconUserPlus, IconUserEdit } from '@tabler/icons-react';
import { filterScadaMenu } from '../../constants/scadaMenu';
import ScreenArt, { FurnaceLineArt } from '../../components/scada/ScreenArt';
import UserAddModal from '../../components/scada/UserAddModal';
import UserEditModal from '../../components/scada/UserEditModal';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

/**
 * 메인화면 — 로그인 직후 들어오는 화면 이동판.
 *
 * 타일 목록을 여기에 따로 적지 않고 scadaMenu에서 자기 자신(메인화면)만 빼고 만든다.
 * 메뉴가 늘거나 이름이 바뀌면 scadaMenu 한 곳만 고치면 하단 메뉴바·상단 제목·이 화면이
 * 같이 따라온다.
 *
 * 타일 그림은 ScreenArt가 화면 key로 골라 그린다(설비 선화).
 * 우측 상단(헤더의 로그아웃 버튼 바로 아래)에 관리자 전용 버튼을 둔다.
 */
export default function MainPage() {
  const navigate = useNavigate();
  const { isAdmin, canView } = useAuth();
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  /* 이 화면에서만 본문 칸의 스크롤을 막는다.

     타일 아홉 개짜리 이동판이라 굴려서 보는 자리가 아닌데, 기기에 따라 몇 px이 모자라
     스크롤이 생기고 그러면 우측 상단 관리자 버튼이 스크롤바 폭만큼 왼쪽으로 밀린다.
     클래스를 CSS가 아니라 여기서 붙이는 이유는, .hmi-body가 모든 화면이 함께 쓰는
     칸이라 이 화면에 있을 때만 걸어야 하기 때문이다. 화면을 떠날 때 반드시 뗀다.

     useEffect가 아니라 useLayoutEffect다. useEffect는 브라우저가 화면을 그린 뒤에
     실행돼서, 타일이 그려져 넘친 순간과 클래스가 붙는 순간 사이에 한 프레임이 보인다 —
     새로고침할 때마다 스크롤바가 번쩍 생겼다가 사라지고 버튼이 밀렸다 돌아왔다.
     useLayoutEffect는 그리기 전에 실행되므로 그 중간 상태가 화면에 나오지 않는다
     (숫자패드가 위치를 잡을 때 쓰는 것과 같은 이유다). */
  useLayoutEffect(() => {
    const body = document.querySelector('.hmi-body');
    body?.classList.add('is-noscroll');
    return () => body?.classList.remove('is-noscroll');
  }, []);

  // 볼 권한이 있는 화면 중 자기 자신(메인화면)만 뺀다 —
  // 관리자 전용 타일과 권한 0으로 막아 둔 화면이 사라진다.
  const items = filterScadaMenu(canView).filter((m) => m.key !== 'main');

  return (
    /* hmi-dark — 이 화면은 원래 어두운 크롬 위에 유리 타일로 떠 있어서 바탕은 바꿀 게
       없지만, 여기서 띄우는 사용자 추가·수정 모달이 공용 --hmi-* 토큰(밝은 쪽)을 쓴다.
       클래스를 붙여 모달까지 같은 테마로 맞춘다. 타일·관리자 버튼은 --g-* 유리 토큰만
       써서 영향을 받지 않는다. */
    <div className="hmi-mainmenu hmi-dark">
      {/* 배경 — 이 설비의 공정 순서를 한 줄로 그려 아주 연하게 깔다.
          장식이지만 아무 그림이 아니라 입구 POCKET부터 출구까지의 생산 라인이다. */}
      <div className="hmi-home-art" aria-hidden="true">
        <FurnaceLineArt />
      </div>

      {/* 관리자 전용 버튼 묶음 — 헤더의 로그아웃 아래에 세로로 쌓인다.
          폭·정렬은 .hmi-admintools 한 곳에서 관리한다. */}
      {isAdmin && (
        <div className="hmi-admintools">
          <button type="button" className="hmi-adminbtn" onClick={() => setAddOpen(true)}>
            {/* 로그아웃 버튼의 IconLogout과 같은 크기 */}
            <IconUserPlus size={16} />
            <span>{t('main.addUser')}</span>
          </button>

          <button type="button" className="hmi-adminbtn" onClick={() => setEditOpen(true)}>
            <IconUserEdit size={16} />
            <span>{t('main.editUser')}</span>
          </button>
        </div>
      )}

      {/* 타일이 열 개를 넘으면(관리자 — 로그·엔지니어링이 보인다) 3열이 아니라 5열로 깐다.
          3열이면 넷째 줄이 생기는데, 이 화면은 스크롤을 막아 두었기 때문에(아래
          is-noscroll) 태블릿에서 넷째 줄이 그대로 잘린다. 5열이면 두 줄로 끝난다.
          열한 개 이상(현재경보가 생긴 뒤의 관리자)이면 5열로도 셋째 줄이 생기므로
          6열로 늘린다(is-xwide) — 역시 두 줄로 끝나게 하려는 것이다. */}
      <div
        className={`hmi-mainmenu-grid${items.length > 9 ? ' is-wide' : ''}`
          + `${items.length > 10 ? ' is-xwide' : ''}`}
      >
        {items.map((menu) => (
          <button
            key={menu.key}
            type="button"
            className="hmi-mainmenu-tile"
            onClick={() => navigate(menu.path)}
          >
            <ScreenArt name={menu.key} />
            <span className="hmi-tile-label">{t(`menu.${menu.key}`, { defaultValue: menu.label })}</span>
          </button>
        ))}
      </div>

      {addOpen && (
        <UserAddModal
          onClose={() => setAddOpen(false)}
          onCreated={(created) => window.alert(t('main.created', { name: created.userName }))}
        />
      )}

      {/* 수정 모달은 저장 후에도 닫지 않는다 — 여러 명을 이어서 고치는 일이 흔하다 */}
      {editOpen && (
        <UserEditModal
          onClose={() => setEditOpen(false)}
          onSaved={(saved) => window.alert(t('main.saved', { name: saved.userName }))}
        />
      )}
    </div>
  );
}
