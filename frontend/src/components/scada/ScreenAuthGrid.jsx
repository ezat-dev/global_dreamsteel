import { AUTH_CONTROL, AUTH_NONE, AUTH_SCREENS, AUTH_VIEW } from '../../constants/scadaMenu';

/* ===========================================================================
   화면별 권한 편집 격자 — 사용자 추가·수정 모달이 같이 쓴다.

   값은 scada_user의 auth_* 컬럼(0 없음 / 1 조회 / 2 제어)이고, 어느 컬럼인지는
   scadaMenu의 authField가 들고 있다. 화면이 늘면 scadaMenu만 고치면 이 격자도 따라온다.

   트렌드·경보이력처럼 조작할 것이 없는 화면은 '제어' 칸을 아예 두지 않는다. 고를 수
   있게 두면 관리자가 제어를 줬다고 생각하지만 조회와 아무 차이가 없어서 오해만 남는다.
   =========================================================================== */

const LEVELS = [
  { value: AUTH_NONE, label: '없음' },
  { value: AUTH_VIEW, label: '조회' },
  { value: AUTH_CONTROL, label: '제어' },
];

/** 화면이 감당할 수 있는 최대 레벨로 자른다 — 조회 화면에 '제어'는 없다. */
export function clampLevel(menu, level) {
  const max = menu.control ? AUTH_CONTROL : AUTH_VIEW;
  const n = Number(level);
  if (!Number.isFinite(n)) return max;
  return Math.min(Math.max(n, AUTH_NONE), max);
}

/**
 * 새 사용자의 기본 권한 — DDL의 DEFAULT와 같은 값으로 맞춘다
 * (제어 화면 2, 조회 화면 1). 둘이 어긋나면 화면에 보이는 기본값과
 * 실제로 저장되는 값이 달라진다.
 */
export function defaultScreenAuth() {
  return Object.fromEntries(
    AUTH_SCREENS.map((m) => [m.authField, m.control ? AUTH_CONTROL : AUTH_VIEW]),
  );
}

/** 사용자 1행에서 권한 컬럼만 뽑아 폼 값으로 만든다. 값이 없는 컬럼은 기본값으로 채운다. */
export function pickScreenAuth(row) {
  const base = defaultScreenAuth();
  if (!row) return base;

  AUTH_SCREENS.forEach((m) => {
    const raw = row[m.authField];
    if (raw != null && raw !== '') base[m.authField] = clampLevel(m, raw);
  });
  return base;
}

/**
 * @param value    { authDrive: 2, authTrend: 1, ... }
 * @param onChange (authField, level) => void
 * @param idPrefix radio name이 겹치지 않게 하는 접두사(모달마다 다르게 준다)
 * @param disabled 관리자를 고른 상태 등 — 값은 보이되 고를 수 없게 한다
 * @param note     격자 위에 띄울 안내문(관리자 안내 등)
 */
export default function ScreenAuthGrid({ value, onChange, idPrefix, disabled = false, note }) {
  /* 8줄을 하나하나 누르는 일이 잦아서 일괄 지정을 둔다.
     화면이 감당하는 최대치로 잘라서 넣는다 — '전체 제어'를 눌러도 트렌드는 조회가 된다. */
  const setAll = (level) => {
    AUTH_SCREENS.forEach((m) => onChange(m.authField, clampLevel(m, level)));
  };

  return (
    <div className={`hmi-authgrid${disabled ? ' is-disabled' : ''}`}>
      <div className="hmi-authgrid-head">
        <span className="hmi-authgrid-caption">화면별 권한</span>

        <div className="hmi-authgrid-presets">
          {LEVELS.map((lv) => (
            <button
              key={lv.value}
              type="button"
              className="hmi-authgrid-preset"
              onClick={() => setAll(lv.value)}
              disabled={disabled}
            >
              전체 {lv.label}
            </button>
          ))}
        </div>
      </div>

      {note && <div className="hmi-authgrid-note">{note}</div>}

      <div>
        {AUTH_SCREENS.map((menu) => {
          const level = clampLevel(menu, value?.[menu.authField]);

          return (
            <div className="hmi-authgrid-row" key={menu.key}>
              <span className="hmi-authgrid-name">{menu.label}</span>

              <div className="hmi-authgrid-opts">
                {LEVELS.map((lv) => {
                  /* 조회 화면의 '제어' 자리는 빈칸으로 남긴다 — 칸을 지우면
                     줄마다 라디오 개수가 달라져서 열이 어긋난다. */
                  if (lv.value === AUTH_CONTROL && !menu.control) {
                    return <span className="hmi-authgrid-blank" key={lv.value} />;
                  }

                  return (
                    <label className="hmi-authgrid-opt" key={lv.value}>
                      <input
                        type="radio"
                        name={`${idPrefix}-${menu.authField}`}
                        checked={level === lv.value}
                        onChange={() => onChange(menu.authField, lv.value)}
                        disabled={disabled}
                      />
                      {lv.label}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
