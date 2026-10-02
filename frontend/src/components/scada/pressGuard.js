/* ===========================================================================
   모멘터리 버튼의 "누르는 중" 표시 — 로그인 화면으로 넘어가는 것을 떼는 0 뒤로 미룬다.

   모멘터리 버튼은 누름 시간을 채우면 1, 손을 떼면 0을 보낸다. 1을 보낸 뒤 손을 떼기 전에
   세션이 끊기면(로그인 유지시간이 다 됨 등) 5초 확인이 401을 받고 그 자리에서 로그인 화면으로
   간다 — 페이지가 바뀌면 0을 보낼 코드가 사라져 PLC 비트가 1로 남는다.

   그래서 1이 나간 순간부터 0을 보내고 끝날 때까지를 "누르는 중"으로 세고(beginPress/endPress),
   axiosInstance는 401을 받으면 runWhenIdle로 넘긴다 — 누르는 중이 없으면 바로, 있으면
   마지막 0이 끝난 뒤에 로그인 화면으로 간다. 서버도 그 0만은 유지시간이 지나도 받아 준다
   (SessionConfig의 allowExpired).

   React 밖의 axiosInstance가 보아야 해서 컨텍스트가 아니라 모듈 변수로 둔다.
   화면을 다시 그릴 일이 없는 값이기도 하다.
   =========================================================================== */

/* 이만큼 기다려도 "끝남"이 안 오면 그냥 넘어간다. endPress를 빠뜨린 버그가 생겨도
   로그인 화면으로 영영 안 가는 일은 없게 하려는 안전장치다. 손으로 누르고 있는 시간과
   0 쓰기(타임아웃 10초)를 넉넉히 덮는다. */
const MAX_WAIT_MS = 30000;

let pressing = 0;
let pendingFn = null;
let fallbackTimer = null;

function flush() {
  clearTimeout(fallbackTimer);
  fallbackTimer = null;
  const fn = pendingFn;
  pendingFn = null;
  if (fn) fn();
}

/** 1이 나간 순간 부른다 — 이제부터 이 버튼의 0이 나가야 한다 */
export function beginPress() {
  pressing += 1;
}

/** 떼는 0을 보내고 끝났을 때 부른다(성공·실패 모두) */
export function endPress() {
  pressing = Math.max(0, pressing - 1);
  if (pressing === 0 && pendingFn) flush();
}

/**
 * 누르는 중인 버튼이 없으면 바로, 있으면 모두 뗀 뒤에 fn을 부른다.
 * 기다리는 동안 다시 불리면(5초 확인이 또 401을 받음) 마지막 것 하나만 남는다.
 */
export function runWhenIdle(fn) {
  if (pressing === 0) {
    fn();
    return;
  }
  pendingFn = fn;
  if (!fallbackTimer) fallbackTimer = setTimeout(flush, MAX_WAIT_MS);
}
