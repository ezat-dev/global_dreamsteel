import { useEffect, useRef, useState } from 'react';
import { getAlarmList } from '../../api/scada/alarmHistApi';

/* 경보 목록 갱신 주기. PLC 값(1초)보다 느린 이유는 두 가지다 —
   경보는 초를 다투는 값이 아니고, 이쪽은 C# 직통이 아니라 자바와 DB를 거친다. */
const POLL_MS = 5000;

/* 한 번에 받을 건수. 화면 하단 목록은 스크롤로 훑어보는 자리라 이 정도면 넉넉하고,
   이력이 쌓인 뒤에도 5초마다 오가는 양이 여기서 묶인다. 범위 조회가 필요하면
   경보이력 화면을 쓴다. */
const LIMIT = 100;

/* 목록이 달라졌는지 판정할 때 볼 필드. 두 화면의 표에 실제로 뜨는 것들이다(지금은 같다).
   historyId는 화면에 없지만 행의 정체라서 같이 본다.

   응답 전체를 비교하지 않는 이유는 vw_alarm_history의 duration_sec 때문이다 —
   timestampdiff(..., current_timestamp())로 그때그때 계산해서, 해제되지 않은 경보가
   하나라도 있으면 조회할 때마다 값이 커진다. 전체를 비교하면 표시 내용이 그대로인데도
   매번 "달라졌다"가 되어 아래 스킵이 아무 일도 하지 않는다.

   표에 컬럼을 더하면 여기에도 그 field를 더해야 한다 — 빠뜨리면 그 값만 바뀌었을 때
   화면이 갱신되지 않는다. */
const SHOWN_FIELDS = ['historyId', 'occurTimeStr', 'tagName', 'alarmMsg', 'alarmStatus'];

/* 표에 뜨는 것만 추려 한 줄로 만든다. 값 안에 들어갈 일이 없는 제어문자로 이어 붙여
   경계를 흐리지 않게 한다('a','b'와 'a,b'가 같은 문자열이 되는 것을 막는다). */
const digest = (rows) =>
  rows.map((r) => SHOWN_FIELDS.map((f) => r[f]).join('\u001f')).join('\u001e');

/**
 * 구동·연소화면 하단의 경보 목록을 5초마다 받아 온다. 화면이 마운트된 동안만 돈다.
 *
 * @returns {{
 *   alarms: Array,   // 최근 경보 (최대 LIMIT건)
 *   error: string    // 통신 실패 안내. 없으면 ''
 * }}
 */
export default function useAlarmList() {
  const [alarms, setAlarms] = useState([]);
  const [error, setError] = useState('');

  /* 직전 응답의 digest. 내용이 그대로면 setAlarms를 부르지 않으려고 들고 있다 —
     아래 tick의 주석 참고. state가 아니라 ref인 이유는 이 값 자체로는 화면이
     달라지지 않아서다(state로 두면 저장할 때마다 한 번 더 렌더된다). */
  const lastDigestRef = useRef('');

  /* setInterval이 아니라 응답을 받은 뒤 다음 타이머를 건다 —
     자바나 DB가 느려졌을 때 요청이 겹쳐 쌓이는 것을 막는다.
     useFolderTagValues와 같은 방식이다. */
  useEffect(() => {
    let alive = true;
    let timer;

    const tick = () => {
      getAlarmList({ limit: LIMIT })
        .then((res) => {
          if (!alive) return;
          setError('');

          /* 표에 보이는 내용이 그대로면 배열을 갈지 않는다. HmiTable은 data가 바뀌면
             replaceData()로 행을 전부 다시 그리는데(HmiTable.jsx), 경보는 대부분
             그대로라 5초마다 멀쩡한 표를 헐어 다시 세우게 된다. 목록을 스크롤해
             보는 중에 튀고, 표 위에 마우스를 올려둔 채면 Tabulator가 사라진 행을
             찾다가 콘솔에 오류를 뱉는다. 참조를 그대로 두면 replaceData가 아예
             불리지 않는다. */
          const next = res.data ?? [];
          const nextDigest = digest(next);
          if (nextDigest !== lastDigestRef.current) {
            lastDigestRef.current = nextDigest;
            setAlarms(next);
          }
        })
        .catch((e) => {
          /* 목록은 지우지 않는다 — 통신이 끊긴 순간 경보가 사라지면 해제된 것처럼
             보인다. 마지막으로 받은 것을 남기고 안내만 띄운다. */
          if (alive) setError(e.response?.data?.message ?? '경보를 불러오지 못했습니다.');
        })
        .finally(() => {
          if (alive) timer = setTimeout(tick, POLL_MS);
        });
    };

    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  return { alarms, error };
}
