import { useEffect, useState } from 'react';
import { getFolderTagValues } from '../../api/scada/foldertagApi';

/* 값 폴링 주기. C#이 자기 주기로 PLC를 읽어 메모리에 들고 있는 것을 받아오는 것이라
   화면이 자주 불러도 PLC 왕복은 늘지 않는다. */
const POLL_MS = 1000;

/* C#의 lastPollAt이 이만큼 지나 있으면 폴러가 멈춘 것으로 본다.
   1초 주기라 여유를 두고 10초 — PLC 한 대가 응답 없을 때 한 사이클이 몇 초씩
   늘어나는 경우가 있어서, 그걸 고장으로 오해하지 않을 만큼은 길어야 한다. */
const STALE_MS = 10000;

const pad2 = (n) => String(n).padStart(2, '0');
const clockText = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

/**
 * 한 폴더의 태그 값을 1초마다 받아 온다. 화면이 마운트된 동안만 돈다.
 *
 * @param folderId ez_scada.folders.id. null/undefined면 폴링하지 않는다.
 * @returns {{
 *   values: object|null,   // { 태그이름: 값 }. null이면 아직 한 번도 못 받음
 *   error: string,         // 통신 실패 또는 폴러 정지 안내. 없으면 ''
 *   ready: boolean         // 한 번이라도 받았는지 — 상태 판정을 시작해도 되는지
 * }}
 */
export default function useFolderTagValues(folderId) {
  const [values, setValues] = useState(null);
  const [error, setError] = useState('');
  const [lastOk, setLastOk] = useState(null);
  const [polledAt, setPolledAt] = useState(null);

  /* setInterval이 아니라 응답을 받은 뒤 다음 타이머를 거는 방식이다 —
     응답이 주기보다 느려질 때 요청이 겹쳐 쌓이는 것을 막는다(C#이 멈춘 순간
     setInterval이면 요청이 폭주한다). */
  useEffect(() => {
    if (folderId == null) return undefined;

    let alive = true;
    let timer;

    const tick = () => {
      getFolderTagValues(folderId)
        .then(({ values: next, lastPollAt }) => {
          if (!alive) return;
          setValues(next);
          setPolledAt(lastPollAt);
          setError('');
          setLastOk(new Date());
        })
        .catch(() => {
          /* 값은 지우지 않는다 — 통신이 끊긴 순간 켜져 있던 램프가 사라지면
             정상으로 돌아온 것처럼 보인다. 마지막 값을 남기고 안내만 띄운다. */
          if (alive) setError('PLC 값을 받지 못했습니다.');
        })
        .finally(() => {
          if (alive) timer = setTimeout(tick, POLL_MS);
        });
    };

    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [folderId]);

  /* C#은 응답하는데 폴링 스레드만 멈춘 경우 — 값이 얼어붙어서 상태가 갱신되지 않는데
     화면상으로는 완전히 정상으로 보인다. 통신 실패와 달리 아무 표시가 없어서 따로 잡는다. */
  let staleText = '';
  if (!error && polledAt) {
    // C#은 'T' 구분자로 준다. 자바를 경유하게 되면 공백일 수 있어 함께 처리한다.
    const t = new Date(String(polledAt).replace(' ', 'T')).getTime();
    if (Number.isFinite(t) && Date.now() - t >= STALE_MS) {
      staleText = `PLC 폴링이 멈춘 것 같습니다 — 마지막 폴링 ${clockText(new Date(t))}`
        + ` (${Math.round((Date.now() - t) / 1000)}초 전). 값이 갱신되지 않고 있습니다.`;
    }
  }

  let text = error || staleText;
  if (error && lastOk) text += ` (마지막 수신 ${clockText(lastOk)})`;
  if (!text && !values) text = '값 수신 대기 중...';

  return { values, error: text, ready: values != null };
}
