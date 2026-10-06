import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { insertUser } from '../../api/scada/scadaUserApi';
import ScreenAuthGrid, { defaultScreenAuth, pickScreenAuth } from './ScreenAuthGrid';

/* ===========================================================================
   사용자 추가 모달 — scada_user 1행을 만든다.

   권한 값은 DB 주석 그대로 '1' 관리자 / '2' 일반 사용자이며, 기본 선택은 일반이다
   (실수로 관리자를 양산하지 않게 하려는 쪽으로 기울여 둔다).

   길이 제한 50은 scada_user의 VARCHAR(50)에서 온다 — 넘겨 보내면 DB가 자르거나
   거절하므로 칸에서 먼저 막는다.
   =========================================================================== */

const MAX_LEN = 50;

// 글자는 사전(common.user.roleUser/roleAdmin)에서 — 렌더할 때 t로 꺼낸다
const ROLES = [
  { value: '2', key: 'roleUser' },
  { value: '1', key: 'roleAdmin' },
];

const EMPTY = {
  userPassword: '', passwordConfirm: '', userName: '', userRole: '2',
  ...defaultScreenAuth(),
};

/**
 * @param onClose  닫기(취소·성공 후 모두 이걸로 닫는다)
 * @param onCreated 등록 성공 시 호출 — 만들어진 사용자 정보를 넘긴다
 */
export default function UserAddModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ESC로 닫기. 등록 중에는 무시한다 — 응답을 기다리는 중에 창이 사라지면 결과를 알 수 없다.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [submitting, onClose]);

  const setField = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    setError('');
  };

  // 권한 격자는 값(숫자)을 직접 준다 — 이벤트를 거치지 않는다.
  const setAuth = (field, level) => setForm((prev) => ({ ...prev, [field]: level }));

  // 관리자는 전 화면 제어라 격자를 고를 이유가 없다. 값은 그대로 보이되 잠근다.
  const isAdminRole = form.userRole === '1';

  /* 보내기 전에 걸러낸다 — 서버도 검증하겠지만, 왕복 없이 바로 알려주는 게 낫다.
     비밀번호는 앞뒤 공백도 의도일 수 있으므로 그대로 보낸다. 로그인이 비밀번호만으로
     사용자를 찾아서 다른 사람과 겹치면 안 되는데, 그건 서버가 409로 알려 준다. */
  const validate = () => {
    const userName = form.userName.trim();

    if (!form.userPassword) return t('user.enterPassword');
    if (form.userPassword !== form.passwordConfirm) return t('user.passwordMismatch');
    if (!userName) return t('user.enterName');
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    /* pickScreenAuth로 화면 권한만 걸러 담는다 — 폼에만 있는 passwordConfirm 같은 값이
       섞여 나가지 않고, 화면이 감당 못 하는 레벨(조회 화면의 제어)도 여기서 잘린다. */
    const payload = {
      userPassword: form.userPassword,
      userName: form.userName.trim(),
      userRole: form.userRole,
      ...pickScreenAuth(form),
    };

    setSubmitting(true);
    setError('');

    insertUser(payload)
      .then(() => {
        onCreated?.(payload);
        onClose();
      })
      .catch((err) => {
        // 비밀번호 중복 같은 사유는 서버 메시지가 가장 정확하다.
        setError(err.response?.data?.message ?? t('user.addFailed'));
      })
      .finally(() => setSubmitting(false));
  };

  return (
    /* 막을 클릭해도 닫히게 한다. 단 패널 안쪽 클릭이 타고 올라와 닫는 일이 없도록
       이벤트가 막 자신에서 시작했는지 확인한다. */
    <div
      className="hmi-umodal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form className="hmi-umodal" onSubmit={handleSubmit}>
        <div className="hmi-umodal-title">{t('user.addTitle')}</div>

        <div className="hmi-umodal-body">
          <div className="hmi-umodal-row">
            <label htmlFor="ua-pw">{t('user.password')}</label>
            <input
              id="ua-pw"
              className="hmi-umodal-input"
              type="password"
              value={form.userPassword}
              onChange={setField('userPassword')}
              maxLength={MAX_LEN}
              autoFocus
              autoComplete="new-password"
            />
          </div>

          <div className="hmi-umodal-row">
            <label htmlFor="ua-pw2">{t('user.passwordConfirm')}</label>
            <input
              id="ua-pw2"
              className="hmi-umodal-input"
              type="password"
              value={form.passwordConfirm}
              onChange={setField('passwordConfirm')}
              maxLength={MAX_LEN}
              autoComplete="new-password"
            />
          </div>

          <div className="hmi-umodal-row">
            <label htmlFor="ua-name">{t('user.name')}</label>
            <input
              id="ua-name"
              className="hmi-umodal-input"
              value={form.userName}
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
                    checked={form.userRole === role.value}
                    onChange={setField('userRole')}
                  />
                  {t(`user.${role.key}`)}
                </label>
              ))}
            </div>
          </div>

          <ScreenAuthGrid
            idPrefix="ua"
            value={form}
            onChange={setAuth}
            disabled={isAdminRole || submitting}
            note={isAdminRole ? t('auth.adminNote') : undefined}
          />

          {error && <div className="hmi-umodal-error">{error}</div>}
        </div>

        <div className="hmi-umodal-foot">
          {/* 등록 중에는 둘 다 막는다 — 같은 사용자를 두 번 넣거나, 결과를 못 보고 닫는 일 방지 */}
          <button type="submit" className="hmi-btn is-primary" disabled={submitting}>
            {submitting ? t('user.submitting') : t('user.submit')}
          </button>
          <button
            type="button"
            className="hmi-btn"
            onClick={() => { setForm(EMPTY); setError(''); }}
            disabled={submitting}
          >
            {t('user.reset')}
          </button>
          <button type="button" className="hmi-btn" onClick={onClose} disabled={submitting}>
            {t('user.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
