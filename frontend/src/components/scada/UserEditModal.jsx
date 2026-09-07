import { useEffect, useState } from 'react';
import { getUserList, updateUser } from '../../api/scada/scadaUserApi';
import ScreenAuthGrid, { pickScreenAuth } from './ScreenAuthGrid';

/* ===========================================================================
   사용자 정보 수정 모달 — 관리자 전용.

   위쪽 목록에서 행을 고르면 아래 폼에 값이 채워지고, 고친 뒤 [수정]을 누르면
   그 한 행을 통째로 덮어쓴다. 삭제도 여기서 한다 — 상태를 '삭제'로 바꿔 저장하면
   delete_yn이 'Y'가 되고, 다시 '사용'으로 되돌리면 복구다. 그래서 삭제 버튼을
   따로 두지 않았다(복구가 같은 자리에서 되는 편이 헷갈리지 않는다).

   목록은 Tabulator(HmiTable) 대신 평범한 표로 그린다 — 모달 안의 짧은 목록이라
   페이징·정렬이 필요 없고, 조건부로 열리고 닫히는 자리에 표 인스턴스를 만들고
   부수는 비용이 아깝다.
   =========================================================================== */

const MAX_LEN = 50;

const ROLES = [
  { value: '2', label: '일반 사용자' },
  { value: '1', label: '관리자' },
];

const STATES = [
  { value: 'N', label: '사용' },
  { value: 'Y', label: '삭제' },
];

const roleLabel = (v) => (String(v) === '1' ? '관리자' : '일반 사용자');

/**
 * @param onClose  닫기
 * @param onSaved  저장 성공 시 호출 — 저장된 사용자 정보를 넘긴다
 */
export default function UserEditModal({ onClose, onSaved }) {
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const busy = loading || saving;

  /* 목록의 한 행을 폼 값으로 바꾼다. 권한 8개는 pickScreenAuth를 거치는데,
     아직 auth_* 컬럼이 내려오지 않는 사용자(예전에 만든 행)도 기본값으로 채워져서
     격자가 빈 채로 뜨지 않게 하기 위함이다. */
  const toForm = (row) => ({ ...row, ...pickScreenAuth(row) });

  /* 목록을 다시 불러온다. keepId를 주면 저장 후에도 같은 사용자가 선택된 채로
     남는다 — 연달아 고칠 때 매번 다시 찾아 누르지 않아도 된다. */
  const loadList = (keepId) => {
    setLoading(true);
    setError('');

    return getUserList()
      .then((res) => {
        const list = res.data ?? [];
        setRows(list);

        const keep = keepId != null ? list.find((u) => u.id === keepId) : null;
        if (keep) {
          setSelectedId(keep.id);
          setForm(toForm(keep));
        }
      })
      .catch((e) => {
        setRows([]);
        setError(e.response?.data?.message ?? '사용자 목록을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    // 열릴 때 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ESC로 닫기. 저장 중에는 무시한다 — 응답을 기다리는 중에 창이 사라지면 결과를 알 수 없다.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [saving, onClose]);

  const selectRow = (row) => {
    if (saving) return;
    setSelectedId(row.id);
    // 목록의 행을 그대로 쓰지 않고 복사한다 — 폼에서 고친 값이 목록에 새어들면
    // [수정]을 누르기 전인데도 표가 바뀐 것처럼 보인다.
    setForm(toForm(row));
    setError('');
  };

  const setField = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    setError('');
  };

  // 권한 격자는 값(숫자)을 직접 준다 — 이벤트를 거치지 않는다.
  const setAuth = (field, level) => setForm((prev) => ({ ...prev, [field]: level }));

  // 관리자는 전 화면 제어라 격자를 고를 이유가 없다. 값은 그대로 보이되 잠근다.
  const isAdminRole = String(form?.userRole ?? '') === '1';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form) return;

    const userId = (form.userId ?? '').trim();
    const userName = (form.userName ?? '').trim();

    if (!userId) { setError('아이디를 입력해주세요.'); return; }
    if (!form.userPassword) { setError('비밀번호를 입력해주세요.'); return; }
    if (!userName) { setError('이름을 입력해주세요.'); return; }

    /* 되돌리기 어려운 변경이라 한 번 물어본다. 상태를 '삭제'로 바꿀 때만이고,
       이름·권한만 고치는 흔한 경우에는 막지 않는다. */
    const original = rows.find((u) => u.id === form.id);
    if (form.deleteYn === 'Y' && original?.deleteYn !== 'Y') {
      if (!window.confirm(`'${userId}' 사용자를 삭제 처리하시겠습니까?\n로그인할 수 없게 됩니다.`)) return;
    }

    const payload = {
      id: form.id,
      userId,
      userPassword: form.userPassword,
      userName,
      userRole: form.userRole,
      deleteYn: form.deleteYn,
      ...pickScreenAuth(form),
    };

    setSaving(true);
    setError('');

    updateUser(payload)
      .then(() => {
        onSaved?.(payload);
        return loadList(payload.id);
      })
      .catch((err) => {
        // 아이디 중복 같은 사유는 서버 메시지가 가장 정확하다.
        setError(err.response?.data?.message ?? '사용자 정보를 수정하지 못했습니다.');
      })
      .finally(() => setSaving(false));
  };

  return (
    /* 막을 클릭해도 닫히게 한다. 단 패널 안쪽 클릭이 타고 올라와 닫는 일이 없도록
       이벤트가 막 자신에서 시작했는지 확인한다. */
    <div
      className="hmi-umodal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form className="hmi-umodal hmi-umodal--wide" onSubmit={handleSubmit}>
        <div className="hmi-umodal-title">사용자 정보 수정</div>

        {/* ── 목록 ── */}
        <div className="hmi-ulist">
          <table>
            <thead>
              <tr>
                <th>아이디</th>
                <th>이름</th>
                <th>권한</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    (row.id === selectedId ? 'is-selected' : '') +
                    (row.deleteYn === 'Y' ? ' is-deleted' : '')
                  }
                  onClick={() => selectRow(row)}
                >
                  <td>{row.userId}</td>
                  <td>{row.userName}</td>
                  <td>{roleLabel(row.userRole)}</td>
                  <td>{row.deleteYn === 'Y' ? '삭제' : '사용'}</td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr className="hmi-ulist-empty">
                  <td colSpan={4}>{loading ? '불러오는 중...' : '사용자가 없습니다.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 폼 ── 행을 고르기 전에는 안내만 띄운다 */}
        {form ? (
          <div className="hmi-umodal-body">
            <div className="hmi-umodal-row">
              <label htmlFor="ue-id">아이디</label>
              <input
                id="ue-id"
                className="hmi-umodal-input"
                value={form.userId ?? ''}
                onChange={setField('userId')}
                maxLength={MAX_LEN}
                autoComplete="off"
              />
            </div>

            <div className="hmi-umodal-row">
              <label htmlFor="ue-pw">비밀번호</label>
              {/* 현재 비밀번호가 채워져 있다. 보이는 채로 두는 편이 관리자가
                  무엇으로 바뀌는지 확인하기 쉬워 type="text"로 둔다. */}
              <input
                id="ue-pw"
                className="hmi-umodal-input"
                value={form.userPassword ?? ''}
                onChange={setField('userPassword')}
                maxLength={MAX_LEN}
                autoComplete="off"
              />
            </div>

            <div className="hmi-umodal-row">
              <label htmlFor="ue-name">이름</label>
              <input
                id="ue-name"
                className="hmi-umodal-input"
                value={form.userName ?? ''}
                onChange={setField('userName')}
                maxLength={MAX_LEN}
                autoComplete="off"
              />
            </div>

            <div className="hmi-umodal-row">
              <span className="hmi-umodal-rowlabel">권한</span>
              <div className="hmi-umodal-roles">
                {ROLES.map((role) => (
                  <label key={role.value}>
                    <input
                      type="radio"
                      name="userRole"
                      value={role.value}
                      checked={String(form.userRole) === role.value}
                      onChange={setField('userRole')}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="hmi-umodal-row">
              <span className="hmi-umodal-rowlabel">상태</span>
              <div className="hmi-umodal-roles">
                {STATES.map((state) => (
                  <label key={state.value}>
                    <input
                      type="radio"
                      name="deleteYn"
                      value={state.value}
                      checked={(form.deleteYn ?? 'N') === state.value}
                      onChange={setField('deleteYn')}
                    />
                    {state.label}
                  </label>
                ))}
              </div>
            </div>

            <ScreenAuthGrid
              idPrefix="ue"
              value={form}
              onChange={setAuth}
              disabled={isAdminRole || busy}
              note={isAdminRole ? '관리자는 모든 화면을 제어할 수 있습니다.' : undefined}
            />

            {error && <div className="hmi-umodal-error">{error}</div>}
          </div>
        ) : (
          <div className="hmi-umodal-body">
            {error
              ? <div className="hmi-umodal-error">{error}</div>
              : <div className="hmi-umodal-hint">수정할 사용자를 위 목록에서 선택하세요.</div>}
          </div>
        )}

        <div className="hmi-umodal-foot">
          <button type="submit" className="hmi-btn is-primary" disabled={busy || !form}>
            {saving ? '저장 중...' : '수정'}
          </button>
          <button type="button" className="hmi-btn" onClick={onClose} disabled={saving}>
            닫기
          </button>
        </div>
      </form>
    </div>
  );
}
