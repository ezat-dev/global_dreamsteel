import { useEffect, useMemo, useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { getAlarmLampValues, getAlarmTagList } from '../../api/scada/alarmTagApi';
import './AlarmPage.css';

/* ===========================================================================
   알람 화면 — ez_scada.tb_alarm_tag의 알람 정의를 격자로 늘어놓고,
   램프 값(folders_tags, 알람 주소 +200)이 1이 된 칸만 빨갛게 켠다.

   알람 이름을 화면에 적어 두지 않는다 — 200개가 DB에 있고 PLC가 기준이므로,
   여기서 다시 적으면 둘이 어긋나는 순간 엉뚱한 이름이 켜진다.

   값 응답은 folders_tags.id를 키로 오므로, 목록에 같이 담겨 오는 lampId로 찾는다.
   id를 이 파일에 적어 두지 않는 것이 요점이다 — 적어 두면 DB를 다시 만들거나
   태그를 지웠다 넣는 순간 램프가 조용히 엉뚱한 칸에 붙는다.

   한 화면에 10×10=100칸이 최대라 100개씩 나눠 상단 페이지 버튼으로 넘긴다.
   페이지 수는 태그 수에서 계산하므로, 태그가 늘어도 이 파일은 손댈 필요가 없다.
   =========================================================================== */

const COLS = 10;
const ROWS = 10;
const PER_PAGE = COLS * ROWS;

/* 값 폴링 주기. C#이 1초마다 PLC를 읽고 메모리에 들고 있는 것을 받아오는 것이라
   여기서 자주 불러도 PLC 왕복은 늘지 않는다. */
const POLL_MS = 1000;

/* C#의 lastPollAt이 이만큼 지나 있으면 폴러가 멈춘 것으로 본다.
   1초 주기라 여유를 두고 10초 — PLC 한 대가 응답 없을 때 한 사이클이 몇 초씩
   늘어나는 경우가 있어서, 그걸 고장으로 오해하지 않을 만큼은 길어야 한다. */
const STALE_MS = 10000;

/** 램프 상태 — C#은 읽기 실패를 null로 준다. null은 '꺼짐'이 아니라 '모름'이다. */
const ON = 'on';
const OFF = 'off';
const UNKNOWN = 'unknown';

function lampState(raw) {
  if (raw == null || raw === '') return UNKNOWN;
  const n = Number(raw);
  if (!Number.isFinite(n)) return UNKNOWN;
  return n > 0 ? ON : OFF;
}

const pad2 = (n) => String(n).padStart(2, '0');
const clockText = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

export default function AlarmPage() {
  const [tags, setTags] = useState([]);
  const [values, setValues] = useState(null);   // null = 아직 한 번도 못 받음
  const [page, setPage] = useState(0);

  const [tagError, setTagError] = useState('');
  const [valueError, setValueError] = useState('');
  const [lastOk, setLastOk] = useState(null);
  // C#이 마지막으로 PLC를 읽은 시각. 응답은 오는데 이 값이 멈춰 있으면 폴러가 죽은 것이다.
  const [polledAt, setPolledAt] = useState(null);

  /* 알람 정의 — 실행 중 바뀌지 않으므로 1회만 */
  useEffect(() => {
    let alive = true;

    getAlarmTagList()
      .then((res) => {
        if (!alive) return;
        setTags(res.data ?? []);
        setTagError('');
      })
      .catch((e) => {
        if (!alive) return;
        setTags([]);
        setTagError(e.response?.data?.message ?? '알람 목록을 불러오지 못했습니다.');
      });

    return () => { alive = false; };
  }, []);

  /* 램프 값 폴링.
     setInterval이 아니라 응답을 받은 뒤 다음 타이머를 거는 방식이다 — 응답이 주기보다
     느려질 때 요청이 겹쳐 쌓이는 것을 막는다(PLC가 느려진 순간 요청이 폭주하지 않는다). */
  useEffect(() => {
    let alive = true;
    let timer;

    const tick = () => {
      getAlarmLampValues()
        .then((res) => {
          if (!alive) return;
          /* C#을 직접 부르면 res가 { success, lastPollAt, values }이고,
             나중에 자바를 경유하게 되면 res.data가 그 객체가 된다 — 둘 다 받는다. */
          const body = res?.data ?? res ?? {};
          setValues(body.values ?? body);
          setPolledAt(body.lastPollAt ?? null);
          setValueError('');
          setLastOk(new Date());
        })
        .catch(() => {
          // 값은 지우지 않는다 — 통신이 끊긴 순간 켜져 있던 알람이 사라지면
          // 복구된 것처럼 보인다. 대신 위쪽에 수신 실패를 띄운다.
          if (alive) setValueError('PLC 값을 받지 못했습니다.');
        })
        .finally(() => {
          if (alive) timer = setTimeout(tick, POLL_MS);
        });
    };

    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  const pageCount = Math.max(1, Math.ceil(tags.length / PER_PAGE));

  // 태그가 줄어들어 현재 페이지가 없어졌을 때(재조회 등) 빈 화면이 남지 않게 되돌린다
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  /* 마지막 페이지가 100개보다 적어도 빈 칸을 채워 넣는다 —
     격자 높이와 아래 조작 버튼 위치가 페이지마다 흔들리지 않아야 한다. */
  const cells = useMemo(() => {
    const slice = tags.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
    return [...slice, ...Array(Math.max(0, PER_PAGE - slice.length)).fill(null)];
  }, [tags, page]);

  const activeCount = useMemo(
    () => (values ? tags.filter((t) => lampState(values[t.lampId]) === ON).length : 0),
    [tags, values],
  );

  /* C#은 응답하는데 폴러만 멈춘 경우 — 값이 얼어붙어서 새 알람이 안 켜진다.
     통신 실패와 달리 화면상으로는 완전히 정상이라, 이것만은 따로 알려야 한다.
     lastOk가 매 주기 갱신되며 재렌더되므로 별도 타이머 없이 계산된다
     (그래서 쓰지 않는 lastOk를 의존성에 넣어 둔다). */
  const staleWarning = useMemo(() => {
    if (!polledAt) return '';
    // C#은 'T' 구분자, 자바를 경유하면 공백 구분자로 올 수 있다
    const t = new Date(String(polledAt).replace(' ', 'T')).getTime();
    if (!Number.isFinite(t)) return '';

    const age = Date.now() - t;
    if (age < STALE_MS) return '';
    return `PLC 폴링이 멈춘 것 같습니다 — 마지막 폴링 ${clockText(new Date(t))}`
      + ` (${Math.round(age / 1000)}초 전). 값이 갱신되지 않고 있습니다.`;
  }, [polledAt, lastOk]);

  const range = useMemo(() => {
    const slice = tags.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
    if (!slice.length) return '';
    return `${slice[0].address} ~ ${slice[slice.length - 1].address}`;
  }, [tags, page]);

  return (
    <div className="al-page">
      <div className="al-top">
        {/* 페이지 전환 — 100칸이 한 화면의 최대치라 태그 200개를 두 장으로 나눈다 */}
        <div className="al-pager">
          <button
            type="button"
            className="al-pager-arrow"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            title="이전 페이지"
          >
            <IconChevronLeft size={16} />
          </button>

          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`al-pager-btn${i === page ? ' is-on' : ''}`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}

          <button
            type="button"
            className="al-pager-arrow"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pageCount - 1}
            title="다음 페이지"
          >
            <IconChevronRight size={16} />
          </button>

          {range && <span className="al-range">{range}</span>}
        </div>

        {/* 발생 건수는 전체 기준이다 — 다른 페이지에서 울리고 있는 것도 놓치지 않게 */}
        <div className={`al-count${activeCount > 0 ? ' is-alarm' : ''}`}>
          발생 {activeCount}건
        </div>
      </div>

      {(tagError || valueError || staleWarning || (!values && !tagError)) && (
        <div className={`al-banner${tagError || valueError || staleWarning ? ' is-error' : ''}`}>
          {tagError || valueError || staleWarning || '값 수신 대기 중...'}
          {valueError && lastOk && ` (마지막 수신 ${clockText(lastOk)})`}
        </div>
      )}

      <div className="al-grid">
        {cells.map((tag, i) => {
          if (!tag) return <div key={`empty-${i}`} className="al-cell is-empty" />;

          /* 값을 한 번도 못 받았으면 상태를 판정하지 않는다 —
             통신 전인데 전부 '정상'으로 보이면 알람이 없는 것으로 오해한다.

             lampId가 없는 알람(짝이 되는 램프 태그가 없는 경우)도 '모름'이다.
             values[undefined]는 항상 undefined라서 lampState가 UNKNOWN을 돌려준다. */
          const state = values ? lampState(values[tag.lampId]) : null;

          return (
            <div
              key={tag.tagName}
              className={`al-cell${state === ON ? ' on' : ''}${state === UNKNOWN ? ' is-unknown' : ''}`}
              title={`${tag.tagName} / ${tag.address}`
                + (tag.lampId ? ` / 램프 #${tag.lampId}` : ' / 램프 태그 없음')}
            >
              {tag.alarmMsg || tag.tagName}
            </div>
          );
        })}

        {/* 조작 버튼은 격자의 마지막 줄에 둔다. 격자 밖에 두면 그 줄만 높이가 달라진다
            (grid-auto-rows: 1fr이 11개 줄을 같은 높이로 맞춘다). */}
        {Array.from({ length: COLS - 2 }, (_, i) => (
          <div key={`action-empty-${i}`} className="al-cell is-empty" />
        ))}
        <button type="button" className="al-action">ALARM RESET</button>
        <button type="button" className="al-action">HORN STOP</button>
      </div>
    </div>
  );
}
