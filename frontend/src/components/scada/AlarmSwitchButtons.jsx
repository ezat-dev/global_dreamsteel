import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { getTagValueByName, tagState, TAG_ON, TAG_UNKNOWN, writeTag } from '../../api/scada/foldertagApi';
import { ALARM_LAMP_FOLDER_ID } from '../../api/scada/alarmTagApi';
import useLiveTagRead from './useLiveTagRead';
import { beginPress, endPress } from './pressGuard';

/* ===========================================================================
   ALARM RESET / HORN STOP — 화면 머리줄(제목 칸 오른쪽)에 두는 두 버튼.
   알람화면·현재경보·경보이력이 같은 자리에 같은 모양으로 쓴다(ScadaLayout이 그린다).

   다른 조작 버튼과 달리 누름 지연 시간이 없다 — 누르는 순간 1, 떼면 0이다(2026-10-30 요청).
   경보를 끄고 경보음을 멈추는 버튼이라 기다리게 할 이유가 없고, 설비를 움직이는 버튼이 아니다.
   대신 너무 짧게 톡 치면 PLC가 1을 못 볼 수 있어서, 1을 쓴 뒤 최소 MIN_PULSE_MS는 지나야 0을 보낸다.

   값을 쓰는 태그와 상태를 읽는 태그가 같은 하나다(짝이 되는 _lamp가 없다) — 1인 동안 초록.
   상태는 이 두 태그만 1초마다 이름으로 받는다(폴더 전체를 받을 이유가 없다).
   =========================================================================== */

const SWITCHES = [
  { tag: 'alarm_reset', text: 'ALARM RESET' },
  { tag: 'alarm_horn_stop', text: 'HORN STOP' },
];

const POLL_MS = 1000;
/* 1을 쓴 뒤 0을 보내기까지의 최소 간격. PLC 스캔(수십 ms)이 1을 확실히 한 번은 보게 한다 */
const MIN_PULSE_MS = 300;

/**
 * @param folderId 쓰기·읽기에 쓸 폴더(태그 이름이 폴더 안에서만 유일하다). 기본 알람화면 폴더(6)
 * @param canPress false면 버튼을 잠근다(그 화면의 제어 권한이 없을 때)
 * @param className 묶음에 덧붙일 클래스 — 놓이는 자리마다 모양을 맞추는 데 쓴다
 * @param btnClassName 버튼에 덧붙일 클래스
 */
export default function AlarmSwitchButtons({
  folderId = ALARM_LAMP_FOLDER_ID, canPress = true, className = '', btnClassName = '',
}) {
  const { t } = useTranslation();
  const [polled, setPolled] = useState(null);
  const { values, readWhileHeld, clearLive } = useLiveTagRead(folderId, polled);
  const [heldTag, setHeldTag] = useState('');
  const [error, setError] = useState('');

  /* 누름 상태는 ref로도 들고 있는다 — window 핸들러가 state를 보면 첫 렌더 값에 갇혀
     뗌을 놓치고, 그러면 비트가 1로 남는다. */
  const heldRef = useRef(null);
  const onAtRef = useRef(0);
  // 1과 0의 순서를 지키는 사슬 — 따로 보내면 짧게 눌렀을 때 0이 먼저 도착할 수 있다
  const chainRef = useRef(Promise.resolve());

  // 상태 폴링 — 응답을 받은 뒤 다음 타이머를 건다(느릴 때 요청이 쌓이지 않게)
  useEffect(() => {
    let alive = true;
    let timer;
    const tick = () => {
      Promise.all(SWITCHES.map((s) => getTagValueByName(folderId, s.tag).then((v) => [s.tag, v])))
        .then((pairs) => { if (alive) setPolled(Object.fromEntries(pairs)); })
        .catch(() => {})   // 값은 지우지 않는다 — 못 받는 동안은 마지막 상태(또는 모름)
        .finally(() => { if (alive) timer = setTimeout(tick, POLL_MS); });
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [folderId]);

  const handlePress = (name) => {
    if (!canPress || heldRef.current) return;
    heldRef.current = name;
    setHeldTag(name);
    setError('');
    beginPress();   // 지금부터 이 버튼의 0이 나가야 한다(그 전에는 로그인 화면으로 넘어가지 않는다)
    onAtRef.current = Date.now();
    chainRef.current = writeTag(folderId, name, 1)
      .then(() => {
        onAtRef.current = Date.now();
        // 폴링(최악 2초 지연)을 기다리지 않고 바로 초록이 되게 그 태그만 PLC에서 읽는다
        readWhileHeld(name, () => heldRef.current === name);
      })
      .catch((e) => setError(`${name} — ${e.message}`));
  };

  const handleRelease = () => {
    const name = heldRef.current;
    if (!name) return;
    heldRef.current = null;
    setHeldTag('');
    clearLive();
    /* 1이 실패했어도 0은 보낸다 — 확실히 내리는 쪽이 안전하다.
       log=false: 이 0은 사람이 한 조작이 아니라 누름의 자동 해제다. */
    chainRef.current = chainRef.current
      .then(() => new Promise((r) => setTimeout(r, Math.max(0, MIN_PULSE_MS - (Date.now() - onAtRef.current)))))
      .then(() => writeTag(folderId, name, 0, false))
      .catch((e) => setError(t('hmi.releaseFailed', { name, msg: e.message })))
      .finally(endPress);
  };

  /* 뗌은 버튼이 아니라 window에서 받는다 — 손가락이 버튼 밖에서 떨어져도, 창이 포커스를
     잃어도 0이 반드시 나가야 한다. 화면을 떠날 때 누르고 있던 것도 내린다. */
  useEffect(() => {
    const release = () => handleRelease();
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const stateClass = (name) => {
    if (!values) return ' is-unknown';
    const st = tagState(values[name]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === TAG_ON ? ' is-on' : '';
  };

  return (
    <div className={`hmi-alarm-sw ${className}`.trim()}>
      {SWITCHES.map((b) => (
        <button
          type="button"
          key={b.tag}
          className={`hmi-alarm-sw-btn ${btnClassName}`.trim() + stateClass(b.tag)
            + (heldTag === b.tag ? ' is-held' : '')}
          onPointerDown={() => handlePress(b.tag)}
          disabled={!canPress}
          data-tag={b.tag}
          title={t('hmi.pressMomentary', { tag: b.tag })}
        >
          {b.text}
        </button>
      ))}
      {/* 쓰기 실패 안내 — 화면 틀(.hmi-root)로 꺼내서 띄운다. 머리줄 제목 칸은 backdrop-filter가
          걸려 있어 그 안의 position: fixed가 제목 칸 기준이 되어 버린다(화면 아래가 아니라 칸 안에 뜬다). */}
      {error && createPortal(<div className="hmi-toast is-dark">{error}</div>,
        document.querySelector('.hmi-root') ?? document.body)}
    </div>
  );
}
