import { useEffect, useRef, useState } from 'react';
import { readTagLive } from '../../api/scada/foldertagApi';

/* ===========================================================================
   조작 버튼을 누른 직후에만, 그 태그 하나를 PLC에서 직접 읽어 화면에 얹는다.

   왜 필요한가 — 화면이 1초마다 받아오는 값은 PLC가 아니라 C#이 2초마다 채우는
   메모리 캐시다. 그래서 2초를 눌러 값을 보내도 램프가 최악 2초 동안 안 바뀐다.
   눌렀는데 아무 반응이 없는 것으로 보여서 한 번 더 누르게 된다.

   읽기는 버튼 한 번에 딱 한 번이다. 주기적으로 부르면 PLC에 실제로 왕복이
   생기므로, 폴링을 이걸로 대신하면 안 된다. 손대는 태그도 누른 그 하나뿐이고
   나머지 수백 개는 그대로 폴링값을 쓴다.

   읽어 온 값을 언제까지 폴링보다 앞에 둘지가 버튼 종류에 따라 갈린다.

     모멘터리(떼면 0이 나가는 버튼) — 누르고 있는 동안만. 떼면 PLC도 0이 되니
       폴링에 넘겨도 맞다. readWhileHeld를 쓰고, 뗄 때 clearLive를 부른다.

     래치(떼도 값이 남는 버튼) — 뗌이 해제 신호가 될 수 없다. 폴링이 같은 값을
       가져올 때까지 붙들고, 그래도 안 오면 3초에서 끊는다. readAndHold를 쓴다.
       3초는 최악의 지연(C# 캐시 2초 + 화면 폴링 1초)에 맞춘 값이다. 상한을 두는
       이유는, PLC가 그 값을 안 받았거나 되돌렸을 때 실제와 다른 화면을 계속
       보여주지 않기 위해서다 — 잠깐 늦는 것보다 그게 나쁘다.
   =========================================================================== */

/* 값을 보낸 뒤 이만큼 있다가 읽는다. 곧바로 읽지 않는 이유가 둘 있다.
   쓰기 직후에는 C#도 "제대로 쓰였나"를 확인하려고 PLC를 한 번 읽으므로 같은 순간에
   요청을 겹쳐 보내지 않으려는 것이고, PLC 래더가 그 입력을 반영할 시간도 준다.
   0.2초는 사람 눈에는 즉시로 보인다. */
const READ_DELAY_MS = 200;

/* 래치 버튼에서 직통값을 붙들고 있는 상한. */
const HOLD_MS = 3000;

/**
 * @param folderId 태그가 속한 폴더 — 쓰기에 쓰는 것과 같은 값을 넘긴다
 * @param polled   폴링으로 받은 { 태그이름: 값 } 맵(없으면 null)
 * @returns {{
 *   values: object|null,   // polled에 직통값을 얹은 것. 화면은 이것만 쓰면 된다
 *   readWhileHeld: Function, // (태그이름, 아직누르고있나) — 모멘터리용
 *   readAndHold: Function,   // (태그이름 또는 이름배열) — 래치용
 *   clearLive: Function      // 직통값 버리기(모멘터리에서 뗄 때)
 * }}
 */
export default function useLiveTagRead(folderId, polled) {
  /* { 태그이름: 값 } 또는 null. 여러 개인 것은 분위기화면 때문이다 —
     한 번 누르면 누른 쪽과 반대쪽 두 태그가 같이 바뀌어서, 누른 쪽만 읽으면
     반대쪽 램프가 한동안 켜진 채 남아 둘 다 켜진 것처럼 보인다. */
  const [live, setLive] = useState(null);

  const readTimerRef = useRef(null);
  const expireTimerRef = useRef(null);
  // 래치로 읽은 값인지 — 폴링 일치로 해제할 대상인지를 가른다
  const latchedRef = useRef(false);

  const clearLive = () => {
    clearTimeout(readTimerRef.current);
    clearTimeout(expireTimerRef.current);
    readTimerRef.current = null;
    expireTimerRef.current = null;
    latchedRef.current = false;
    setLive(null);
  };

  /* 읽기 한 번. 실패는 삼킨다 — 못 읽어도 폴링이 곧 같은 값을 가져오니 이 기능이
     없던 때와 같아질 뿐이고, 조작 자체는 이미 성공한 뒤다. */
  const readOnce = (names) => Promise
    .all(names.map((name) => readTagLive(folderId, name)
      .then((value) => [name, value])))
    .then((pairs) => Object.fromEntries(pairs))
    .catch(() => null);

  /**
   * 모멘터리 버튼용. stillHeld()가 false면 읽지 않는다 — 뗄 때 0을 보내므로
   * 어차피 0이 돌아오고, PLC 왕복만 한 번 더 늘어난다.
   */
  const readWhileHeld = (name, stillHeld) => {
    clearTimeout(readTimerRef.current);
    readTimerRef.current = setTimeout(() => {
      if (!stillHeld()) return;
      readOnce([name]).then((next) => {
        if (!next || !stillHeld()) return;
        latchedRef.current = false;
        setLive(next);
      });
    }, READ_DELAY_MS);
  };

  /** 래치 버튼용. 폴링이 따라오거나 HOLD_MS가 지날 때까지 붙든다. */
  const readAndHold = (nameOrNames) => {
    const names = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames];
    clearTimeout(readTimerRef.current);
    readTimerRef.current = setTimeout(() => {
      readOnce(names).then((next) => {
        if (!next) return;
        latchedRef.current = true;
        setLive(next);
        clearTimeout(expireTimerRef.current);
        expireTimerRef.current = setTimeout(() => {
          latchedRef.current = false;
          setLive(null);
        }, HOLD_MS);
      });
    }, READ_DELAY_MS);
  };

  /* 폴링이 직통값을 따라잡으면 그 자리에서 놓아준다 — 더 붙들 이유가 없고,
     그 뒤에 값이 또 바뀌면 그건 폴링이 보여 줘야 한다. 래치에만 해당한다. */
  useEffect(() => {
    if (!latchedRef.current || !live || !polled) return;
    const caughtUp = Object.keys(live)
      .every((name) => String(polled[name]) === String(live[name]));
    if (!caughtUp) return;
    clearTimeout(expireTimerRef.current);
    expireTimerRef.current = null;
    latchedRef.current = false;
    setLive(null);
  }, [polled, live]);

  // 화면을 떠날 때 타이머가 남아 setState를 부르지 않게 한다
  useEffect(() => () => {
    clearTimeout(readTimerRef.current);
    clearTimeout(expireTimerRef.current);
  }, []);

  /* polled가 아직 null이어도 직통값은 보여 준다 — 나머지 태그는 그대로 '모름'이라
     지금까지와 같고, 방금 누른 버튼만 제 값을 갖는다. */
  const values = live ? { ...(polled ?? {}), ...live } : polled;

  return { values, readWhileHeld, readAndHold, clearLive };
}
