import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserList, updateUser } from '../../api/scada/scadaUserApi';
import ScreenAuthGrid, { pickScreenAuth } from './ScreenAuthGrid';

/* ===========================================================================
   사용자 정보 수정 모달 — 관리자 전용.

   위쪽 목록에서 행을 고르면 아래 폼에 값이 채워지고, 고친 뒤 [수정]을 누르면
   그 한 행을 통째로 덮어쓴다. 삭제도 여기서 한다 — 상태를 '삭제'로 바꿔 저장하면
   delete_yn이 'Y'가 된다. 그래서 삭제 버튼을 따로 두지 않았다.

   DB에서는 지우지 않지만(소프트 삭제) 화면에서는 지운 것과 같다 — getUserList가
   delete_yn = 'Y'인 행을 안 내려서 목록에 다시 나타나지 않고, 따라서 '사용'으로
   되돌리는 복구도 이 화면에서는 못 한다. 되살리려면 DB에서 직접 고쳐야 한다.
   그래서 삭제한 뒤에는 폼을 비운다 — 남겨 두면 화면에 없는 사용자를 계속 고칠 수 있다.

   목록은 Tabulator(HmiTable) 대신 평범한 표로 그린다 — 모달 안의 짧은 목록이라
   페이징·정렬이 필요 없고, 조건부로 열리고 닫히는 자리에 표 인스턴스를 만들고
   부수는 비용이 아깝다.
   =========================================================================== */

const MAX_LEN = 50;

// 글자는 사전(common.user.*)에서 — 렌더할 때 t로 꺼낸다
const ROLES = [
  { value: '2', key: 'roleUser' },
  { value: '1', key: 'roleAdmin' },
];

const STATES = [
  { value: 'N', key: 'stateActive' },
  { value: 'Y', key: 'stateDeleted' },
];

const roleKey = (v) => (String(v) === '1' ? 'roleAdmin' : 'roleUser');

/**
 * @param onClose  닫기
 * @param onSaved  저장 성공 시 호출 — 저장된 사용자 정보를 넘긴다
 */
export default function UserEditModal({ onClose, onSaved }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const busy = loading || saving;

  /* 목록의 한 행을 폼 값으로 바꾼다. 화면 권한은 pickScreenAuth를 거치는데,
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
        } else if (keepId != null) {
          /* 저장한 사용자가 목록에서 사라졌다 = 삭제 처리된 것이다(getUserList가
             delete_yn = 'Y'인 행을 안 내린다). 폼을 비워야 한다 — 안 비우면 방금 지운
             사용자의 값이 그대로 남고, 그 상태에서 수정을 누르면 소프트 삭제라 행이
             DB에 그대로 있어서 UPDATE가 성공한다. 화면에는 없는 사용자가 고쳐진다. */
          setSelectedId(null);
          setForm(null);
        }
      })
      .catch((e) => {
        setRows([]);
        setError(e.response?.data?.message ?? t('user.listFailed'));
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

    const userName = (form.userName ?? '').trim();

    if (!form.userPassword) { setError(t('user.enterPassword')); return; }
    if (!userName) { setError(t('user.enterName')); return; }

    /* 되돌리기 어려운 변경이라 한 번 물어본다. 상태를 '삭제'로 바꿀 때만이고,
       이름·권한만 고치는 흔한 경우에는 막지 않는다. */
    const original = rows.find((u) => u.id === form.id);
    if (form.deleteYn === 'Y' && original?.deleteYn !== 'Y') {
      if (!window.confirm(t('user.deleteConfirm', { name: userName }))) return;
    }

    const payload = {
      id: form.id,
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
        // 비밀번호 중복 같은 사유는 서버 메시지가 가장 정확하다.
        setError(err.response?.data?.message ?? t('user.editFailed'));
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
        <div className="hmi-umodal-title">{t('user.editTitle')}</div>

        {/* ── 목록 ── */}
        <div className="hmi-ulist">
          <table>
            <thead>
              <tr>
                <th>{t('user.name')}</th>
                <th>{t('user.role')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  // 삭제된 행은 목록에 오지 않으므로 그것을 구분하는 표시는 두지 않는다
                  className={row.id === selectedId ? 'is-selected' : ''}
                  onClick={() => selectRow(row)}
                >
                  <td>{row.userName}</td>
                  <td>{t(`user.${roleKey(row.userRole)}`)}</td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr className="hmi-ulist-empty">
                  <td colSpan={2}>{loading ? t('user.loading') : t('user.noUsers')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 폼 ── 행을 고르기 전에는 안내만 띄운다 */}
        {form ? (
          <div className="hmi-umodal-body">
            <div className="hmi-umodal-row">
              <label htmlFor="ue-pw">{t('user.password')}</label>
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
              <label htmlFor="ue-name">{t('user.name')}</label>
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
              <span className="hmi-umodal-rowlabel">{t('user.role')}</span>
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
                    {t(`user.${role.key}`)}
                  </label>
                ))}
              </div>
            </div>

            <div className="hmi-umodal-row">
              <span className="hmi-umodal-rowlabel">{t('user.state')}</span>
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
                    {t(`user.${state.key}`)}
                  </label>
                ))}
              </div>
            </div>

            <ScreenAuthGrid
              idPrefix="ue"
              value={form}
              onChange={setAuth}
              disabled={isAdminRole || busy}
              note={isAdminRole ? t('auth.adminNote') : undefined}
            />

            {error && <div className="hmi-umodal-error">{error}</div>}
          </div>
        ) : (
          <div className="hmi-umodal-body">
            {error
              ? <div className="hmi-umodal-error">{error}</div>
              : <div className="hmi-umodal-hint">{t('user.selectHint')}</div>}
          </div>
        )}

        <div className="hmi-umodal-foot">
          <button type="submit" className="hmi-btn is-primary" disabled={busy || !form}>
            {saving ? t('user.saving') : t('user.save')}
          </button>
          <button type="button" className="hmi-btn" onClick={onClose} disabled={saving}>
            {t('user.close')}
          </button>
        </div>
      </form>
    </div>
  );
}
