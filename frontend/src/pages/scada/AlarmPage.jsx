import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconChevronLeft, IconChevronRight, IconPaperclip } from '@tabler/icons-react';
import {
  ALARM_BLINK, ALARM_ON, ALARM_UNKNOWN, alarmStateOf, getAlarmLampValues,
  getAlarmTagList, isAlarmActive, lampNameOf,
} from '../../api/scada/alarmTagApi';
import { PLC_POLL_MS } from '../../api/scada/foldertagApi';
import { alarmMsgOf } from '../../components/scada/alarmMsg';
import AlarmDetailModal from '../../components/scada/AlarmDetailModal';
import { useAuth } from '../../context/AuthContext';
import './AlarmPage.css';

/* ===========================================================================
   알람 화면 — ez_scada.tb_alarm_tag의 알람 정의를 격자로 늘어놓고,
   발생 비트(alarm_1000, M1000~)가 1이면 빨갛게 깜빡이고, 램프 비트(alarm_1000_lamp,
   알람 주소 +200)도 1이면 빨갛게 켠다. 판정은 alarmTagApi의 alarmStateOf가 한다.

   알람 이름을 화면에 적어 두지 않는다 — 200개가 DB에 있고 PLC가 기준이므로,
   여기서 다시 적으면 둘이 어긋나는 순간 엉뚱한 이름이 켜진다.

   값은 램프 태그 이름(alarm_1000 → alarm_1000_lamp)으로 찾는다. folders_tags.id로
   찾지 않는 것이 요점이다 — id는 auto increment라 DB를 다시 만들거나 태그를 지웠다
   넣으면 바뀌고, 그러면 램프가 조용히 엉뚱한 칸에 붙는다. 이름은 바뀌지 않는다.

   한 화면에 10×10=100칸이 최대라 100개씩 나눠 상단 페이지 버튼으로 넘긴다.
   페이지 수는 태그 수에서 계산하므로, 태그가 늘어도 이 파일은 손댈 필요가 없다.
   =========================================================================== */

const COLS = 10;
const ROWS = 10;
const PER_PAGE = COLS * ROWS;

/* 값 폴링 주기(0.9초, foldertagApi의 PLC_POLL_MS — 모든 화면 공통). C#이 PLC를 읽어
   메모리에 들고 있는 것을 받아오는 것이라 여기서 자주 불러도 PLC 왕복은 늘지 않는다. */
const POLL_MS = PLC_POLL_MS;

/* C#의 lastPollAt이 이만큼 지나 있으면 폴러가 멈춘 것으로 본다.
   1초 주기라 여유를 두고 10초 — PLC 한 대가 응답 없을 때 한 사이클이 몇 초씩
   늘어나는 경우가 있어서, 그걸 고장으로 오해하지 않을 만큼은 길어야 한다. */
const STALE_MS = 10000;

/* ALARM RESET / HORN STOP은 10/30에 화면 머리줄(제목 칸 오른쪽)로 옮겼다 —
   현재경보·경보이력과 같은 자리에 두려고 레이아웃이 그린다(AlarmSwitchButtons). */

const pad2 = (n) => String(n).padStart(2, '0');
const clockText = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

export default function AlarmPage() {
  const { t, i18n } = useTranslation('alarm');
  const [tags, setTags] = useState([]);
  const [polledValues, setPolledValues] = useState(null);   // null = 아직 한 번도 못 받음
  const [page, setPage] = useState(0);

  const [tagError, setTagError] = useState('');
  const [valueError, setValueError] = useState('');
  const [lastOk, setLastOk] = useState(null);
  // C#이 마지막으로 PLC를 읽은 시각. 응답은 오는데 이 값이 멈춰 있으면 폴러가 죽은 것이다.
  const [polledAt, setPolledAt] = useState(null);
  const values = polledValues;

  /* 설명·파일 창 — 연 알람의 tagId. null이면 닫힘.
     행 자체가 아니라 id를 들고 있다가 tags에서 찾는다 — 창에서 저장하면 tags가 바뀌고,
     창은 늘 그 최신 행을 보게 된다. 고치기는 알람화면 "제어" 권한일 때만(조회면 보기만). */
  const [detailId, setDetailId] = useState(null);
  const { canControl } = useAuth();
  const detailTag = detailId == null ? null : tags.find((x) => x.tagId === detailId);

  /** 창에서 저장·올리기·지우기가 끝나면 바뀐 칸만 목록에 합친다(다시 받아 오지 않는다) */
  const patchTag = (patch) => {
    setTags((prev) => prev.map((x) => (x.tagId === detailId ? { ...x, ...patch } : x)));
  };

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
        setTagError(e.response?.data?.message ?? t('tagsFailed'));
      });

    return () => { alive = false; };
    // 한 번만 — t는 실패 문구에만 쓴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 램프 값 폴링.
     setInterval이 아니라 응답을 받은 뒤 다음 타이머를 거는 방식이다 — 응답이 주기보다
     느려질 때 요청이 겹쳐 쌓이는 것을 막는다(PLC가 느려진 순간 요청이 폭주하지 않는다). */
  useEffect(() => {
    let alive = true;
    let timer;

    const tick = () => {
      getAlarmLampValues()
        .then(({ values: next, lastPollAt }) => {
          if (!alive) return;
          // api가 { 램프이름: 값 } 으로 정리해서 준다(C# 응답은 배열이다)
          setPolledValues(next);
          setPolledAt(lastPollAt);
          setValueError('');
          setLastOk(new Date());
        })
        .catch(() => {
          // 값은 지우지 않는다 — 통신이 끊긴 순간 켜져 있던 알람이 사라지면
          // 복구된 것처럼 보인다. 대신 위쪽에 수신 실패를 띄운다.
          if (alive) setValueError(t('plcFailed'));
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

  // 깜빡이는 칸(발생)과 켜진 칸(점등)을 같이 센다
  const activeCount = useMemo(
    () => (values ? tags.filter((tag) => isAlarmActive(alarmStateOf(values, tag.tagName))).length : 0),
    [tags, values],
  );

  /* C#은 응답하는데 폴러만 멈춘 경우 — 값이 얼어붙어서 새 알람이 안 켜진다.
     통신 실패와 달리 화면상으로는 완전히 정상이라, 이것만은 따로 알려야 한다.
     lastOk가 매 주기 갱신되며 재렌더되므로 별도 타이머 없이 계산된다
     (그래서 쓰지 않는 lastOk를 의존성에 넣어 둔다). */
  const staleWarning = useMemo(() => {
    if (!polledAt) return '';
    // C#은 'T' 구분자, 자바를 경유하면 공백 구분자로 올 수 있다
    const at = new Date(String(polledAt).replace(' ', 'T')).getTime();
    if (!Number.isFinite(at)) return '';

    const age = Date.now() - at;
    if (age < STALE_MS) return '';
    return t('stale', { time: clockText(new Date(at)), sec: Math.round(age / 1000) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polledAt, lastOk, t]);

  const range = useMemo(() => {
    const slice = tags.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
    if (!slice.length) return '';
    return `${slice[0].address} ~ ${slice[slice.length - 1].address}`;
  }, [tags, page]);

  return (
    /* hmi-dark — 어두운 배경·유리 판·표 테마는 scada.css의 공용 규칙이 맡는다 */
    <div className="al-page hmi-dark">
      <div className="al-top">
        {/* 페이지 전환 — 100칸이 한 화면의 최대치라 태그 200개를 두 장으로 나눈다 */}
        <div className="al-pager">
          <button
            type="button"
            className="al-pager-arrow"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            title={t('prevPage')}
          >
            {/* 버튼이 36px이라 화살표도 한 단 키운다 — 이 둘이 실제로 누르는 것이다 */}
            <IconChevronLeft size={19} />
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
            title={t('nextPage')}
          >
            <IconChevronRight size={19} />
          </button>

          {range && <span className="al-range">{range}</span>}
        </div>

        {/* 윗줄 오른쪽 — 발생 건수. ALARM RESET / HORN STOP은 머리줄로 옮겼다(맨 위 주석) */}
        <div className="al-ops">
          {/* 발생 건수는 전체 기준이다 — 다른 페이지에서 울리고 있는 것도 놓치지 않게 */}
          <div className={`al-count${activeCount > 0 ? ' is-alarm' : ''}`}>
            {t('activeCount', { n: activeCount })}
          </div>
        </div>
      </div>

      {(tagError || valueError || staleWarning || (!values && !tagError)) && (
        <div className={`al-banner${tagError || valueError || staleWarning ? ' is-error' : ''}`}>
          {tagError || valueError || staleWarning || t('waitingValues')}
          {valueError && lastOk && ` ${t('lastReceived', { time: clockText(lastOk) })}`}
        </div>
      )}

      <div className="al-grid">
        {cells.map((tag, i) => {
          if (!tag) return <div key={`empty-${i}`} className="al-cell is-empty" />;

          /* 값을 한 번도 못 받았으면 상태를 판정하지 않는다 —
             통신 전인데 전부 '정상'으로 보이면 알람이 없는 것으로 오해한다.

             짝이 되는 램프 태그가 없거나 비활성(enabled=0)이면 응답에 아예 없으므로
             alarmStateOf가 UNKNOWN(점선)을 돌려준다.
             깜빡임은 켜진 칸(on)에 is-blink를 더한다 — 설명서 예시·현재경보가 .on으로
             '발생한 칸'을 찾으므로, 깜빡이는 칸도 같은 이름으로 잡혀야 한다. */
          const lampName = lampNameOf(tag.tagName);
          const state = values ? alarmStateOf(values, tag.tagName) : null;
          // 설명이나 파일이 있는 칸 — 오른쪽 위에 클립 표시를 달아 눌러 볼 게 있음을 알린다
          const hasInfo = !!(tag.alarmDesc || tag.pdfFile || tag.imgFile);

          /* 누르면 설명·파일 창. 칸은 div라 화면 잠금(<fieldset disabled>)에 막히지 않는다 —
             조회 권한도 열어서 볼 수 있고, 고치기는 창이 canEdit으로 막는다. */
          return (
            <div
              key={tag.tagName}
              className={`al-cell${state === ALARM_ON ? ' on' : ''}${state === ALARM_BLINK ? ' on is-blink' : ''}`
                + (state === ALARM_UNKNOWN ? ' is-unknown' : '')}
              title={`${t('lampTip', { tag: tag.tagName, address: tag.address, lamp: lampName })}\n${t('detail.openTip')}`}
              role="button"
              tabIndex={0}
              onClick={() => setDetailId(tag.tagId)}
              onKeyDown={(e) => { if (e.key === 'Enter') setDetailId(tag.tagId); }}
            >
              {/* 화면 언어의 경보주석 — 영문(alarm_msg_eng)이 비어 있으면 한글(alarmMsg.js) */}
              {alarmMsgOf(tag, i18n.language) || tag.tagName}
              {hasInfo && (
                <IconPaperclip className="al-cell-mark" size={12} aria-label={t('detail.hasInfo')} />
              )}
            </div>
          );
        })}

      </div>

      {detailTag && (
        <AlarmDetailModal
          tag={detailTag}
          canEdit={canControl('alarm')}
          onChanged={patchTag}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
