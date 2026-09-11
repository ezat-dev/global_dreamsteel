import { useEffect, useRef, useState } from 'react';
import TempZonePanel from '../../components/scada/TempZonePanel';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { writeTag } from '../../api/scada/foldertagApi';
import './TempPage.css';

const ZONE_COUNT = 7;

/* 이 화면의 PLC 태그가 든 폴더 — ez_scada.folders.id (폴더 이름 '온도화면').
   DB에 만든 행의 id와 반드시 같아야 한다. 틀리면 오류가 아니라 태그 0개 응답으로
   조용히 실패하니, 값이 전부 '---'로 나오면 여기를 먼저 본다. */
const TC_FOLDER_ID = 8;

/* 자동/수동 모드 버튼을 이만큼 누르고 있어야 전환 요청이 나간다.
   momentary 비트라 누르는 동안 1, 떼면 0이다(싸이몬과 같다).
   스치듯 눌린 것으로 제어 모드가 바뀌면 안 되니 시간을 둔다.
   CSS 애니메이션 길이도 이 값을 inline style로 받아 간다(두 곳에 적으면 어긋난다). */
const MODE_HOLD_MS = 2000;

// 존 번호만 있으면 된다 — 값·모드가 전부 PLC 태그에서 오므로 화면이 들고 있을 상태가 없다.
const ZONES = Array.from({ length: ZONE_COUNT }, (_, i) => i + 1);

export default function TempPage() {
  /* PV/SV/MV 실시간값. 존 7개를 화면이 한 번만 폴링해서 나눠 준다 —
     패널마다 폴링하면 요청이 7배가 된다. */
  const { values: tagValues, error: tagValueError } = useFolderTagValues(TC_FOLDER_ID);

  const [writeError, setWriteError] = useState('');

  /* 숫자 쓰기 — 숫자패드에서 [입력]을 누른 값이 여기로 온다.
     누름 시간을 요구하지 않는다: 숫자패드의 [입력] 자체가 이미 확인 단계라서,
     한 번 더 확인을 받으면 값 하나 바꾸는 데 두 번 확인하게 된다. */
  const handleWrite = (name, value) => {
    setWriteError('');
    return writeTag(TC_FOLDER_ID, name, value)
      .catch((e) => setWriteError(`${name} — ${e.message}`));
  };

  /* ── 자동/수동 모드 버튼 (momentary) ──────────────────────────────────
     누르고 MODE_HOLD_MS를 채우면 1, 떼면 0. PLC가 그 전환 요청을 받아 모드를 바꾸고,
     결과는 램프 태그(_cmd_lamp)로 돌아온다. */

  // 지금 누르고 있는 태그 — 진행 바를 그리는 데만 쓴다(버튼을 비활성화하지 않는다)
  const [heldTag, setHeldTag] = useState('');

  /* 누름 상태를 ref로도 들고 있는다. window 이벤트 핸들러가 state를 보면 첫 렌더의
     값에 갇히고, 뗌을 놓치면 비트가 1로 남는다. */
  const heldRef = useRef(null);
  const armedRef = useRef(false);
  const holdTimerRef = useRef(null);
  /* 쓰기 순서를 지키기 위한 사슬. 1과 0을 따로 보내면 짧게 눌렀을 때 0이 먼저
     도착해서 비트가 1로 남을 수 있다 — 1이 끝난 뒤에 0을 보낸다. */
  const chainRef = useRef(Promise.resolve());

  const handleModePress = (name) => {
    if (heldRef.current) return;   // 두 개를 동시에 누르는 상황은 만들지 않는다
    heldRef.current = name;
    armedRef.current = false;
    setHeldTag(name);
    setWriteError('');

    holdTimerRef.current = setTimeout(() => {
      armedRef.current = true;
      chainRef.current = writeTag(TC_FOLDER_ID, name, 1)
        .catch((e) => setWriteError(`${name} — ${e.message}`));
    }, MODE_HOLD_MS);
  };

  const handleModeRelease = () => {
    const name = heldRef.current;
    if (!name) return;
    heldRef.current = null;
    setHeldTag('');

    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;

    // 시간을 못 채웠으면 1을 보낸 적이 없으니 0도 보낼 필요가 없다
    if (!armedRef.current) return;
    armedRef.current = false;

    /* 1이 실패했어도 0은 보낸다 — 나갔는지 모르는 상태로 두는 것보다 확실히 내리는
       쪽이 안전하다. log=false: 이 0은 사람이 한 조작이 아니라 누름의 자동 해제다. */
    chainRef.current = chainRef.current
      .then(() => writeTag(TC_FOLDER_ID, name, 0, false))
      .catch((e) => setWriteError(`${name} 해제 실패 — ${e.message}`));
  };

  /* 뗌을 버튼이 아니라 window에서 받는다.
     손가락이 버튼 밖으로 나가서 떼도, 창이 포커스를 잃어도(탭 전환·알림창) 반드시
     0이 나가게 하려는 것이다. 버튼의 onPointerUp만 믿으면 그런 경우에 비트가 1로
     남고, PLC는 전환 요청이 계속 걸려 있는 상태가 된다.
     핸들러가 ref와 setState만 건드려서 렌더마다 새로 걸 필요가 없다. */
  useEffect(() => {
    const release = () => handleModeRelease();
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);

    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      release();   // 화면을 떠날 때 누르고 있던 것이 있으면 내린다
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tz-grid">
      {ZONES.map((n) => (
        <TempZonePanel
          key={n}
          zoneNo={n}
          values={tagValues}
          onWrite={handleWrite}
          onModePress={handleModePress}
          heldTag={heldTag}
          holdMs={MODE_HOLD_MS}
        />
      ))}

      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
    </div>
  );
}
