import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSettingList } from '../../api/scada/scadaSettingApi';

/* ===========================================================================
   버튼 누름 시간(ms) — 모멘터리·래치 버튼이 이만큼 눌려야 값을 보낸다.

   예전에는 화면마다 2000이 상수로 박혀 있었다. 엔지니어링 화면에서 고칠 수 있게
   DB(scada_setting의 hold_ms)로 옮겼고, 모든 화면이 여기 한 곳에서 읽는다.

   언제 다시 받나 — 화면을 옮길 때마다(refreshKey), 그리고 30초마다.
   엔지니어링 화면에서 고친 기기는 저장 즉시 바뀌고(setHoldMs), 다른 태블릿은
   그 다음 화면 이동이나 30초 안에 따라온다.

   못 받으면 2초로 둔다 — 자바가 꺼졌거나, API가 아직 없는 백엔드이거나, 값이
   범위 밖(0~5000)인 경우다. 값이 이상하다고 버튼이 멎으면 안 되므로, 예전과 같은
   2초로 물러선다. 한 번 받은 뒤에 실패하면 마지막으로 받은 값을 그대로 쓴다.
   =========================================================================== */

export const HOLD_MS_KEY = 'hold_ms';
export const DEFAULT_HOLD_MS = 2000;
export const HOLD_MS_MIN = 0;
export const HOLD_MS_MAX = 5000;

/** DB 문자열을 ms 정수로. 숫자가 아니거나 범위 밖이면 null — 부르는 쪽이 기본값을 쓴다. */
export function parseHoldMs(raw) {
  const n = Number(raw);
  if (raw == null || raw === '' || !Number.isInteger(n)) return null;
  if (n < HOLD_MS_MIN || n > HOLD_MS_MAX) return null;
  return n;
}

const HoldMsContext = createContext({
  holdMs: DEFAULT_HOLD_MS,
  setHoldMs: () => {},
  refresh: () => {},
});

/**
 * @param refreshKey 바뀔 때마다 다시 받는다 — ScadaLayout이 현재 경로를 넘긴다(화면 이동 = 다시 받기)
 */
export function HoldMsProvider({ refreshKey, children }) {
  const [holdMs, setHoldMs] = useState(DEFAULT_HOLD_MS);

  /* autoPoll — 30초 타이머로 부를 때만 켠다. 화면 이동 때 부르는 것도 사람이 보낸
     요청은 아니지만, 그건 checkSession이 이미 같은 순간을 로그에 남기고 있다. */
  const refresh = useCallback((autoPoll = false) => {
    getSettingList({ autoPoll })
      .then((res) => {
        const row = (res.data ?? []).find((r) => r.settingKey === HOLD_MS_KEY);
        const ms = parseHoldMs(row?.settingValue);
        setHoldMs(ms ?? DEFAULT_HOLD_MS);
      })
      .catch(() => {
        /* 마지막으로 받은 값을 그대로 둔다(처음이면 기본 2초).
           401은 axiosInstance가 로그인 화면으로 보낸다 — 화면을 보고만 있어도 세션이 죽으면
           로그인으로 돌아가는 것은 의도한 동작이다. 그 일은 주로 ScadaLayout의 5초 checkSession이
           맡고, 이 조회도 같은 401을 받으면 같은 길로 간다. */
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  useEffect(() => {
    const timer = setInterval(() => refresh(true), 30000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <HoldMsContext.Provider value={{ holdMs, setHoldMs, refresh }}>
      {children}
    </HoldMsContext.Provider>
  );
}

/** 지금 적용 중인 누름 시간(ms) */
export function useHoldMs() {
  return useContext(HoldMsContext).holdMs;
}

/** 엔지니어링 화면처럼 값을 바꾸거나 다시 받아야 하는 쪽이 쓴다 */
export function useHoldMsControl() {
  return useContext(HoldMsContext);
}
