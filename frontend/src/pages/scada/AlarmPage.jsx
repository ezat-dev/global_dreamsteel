import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconChevronLeft, IconChevronRight, IconPaperclip } from '@tabler/icons-react';
import {
  ALARM_LAMP_FOLDER_ID, getAlarmLampValues, getAlarmTagList, lampNameOf,
} from '../../api/scada/alarmTagApi';
import { writeTag } from '../../api/scada/foldertagApi';
import useLiveTagRead from '../../components/scada/useLiveTagRead';
import { alarmMsgOf } from '../../components/scada/alarmMsg';
import { useHoldMs } from '../../components/scada/HoldMsContext';
import { beginPress, endPress } from '../../components/scada/pressGuard';
import AlarmDetailModal from '../../components/scada/AlarmDetailModal';
import { useAuth } from '../../context/AuthContext';
import './AlarmPage.css';

/* ===========================================================================
   알람 화면 — ez_scada.tb_alarm_tag의 알람 정의를 격자로 늘어놓고,
   램프 값(folders_tags, 알람 주소 +200)이 1이 된 칸만 빨갛게 켠다.

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

/* 윗줄 오른쪽의 조작 버튼 둘.

   다른 화면의 조작 버튼과 달리 짝이 되는 _lamp 태그가 없다 — 값을 쓰는 태그와
   상태를 읽는 태그가 같은 하나다(싸이몬도 같은 번지에 Bit Momentary로 쓰고 있었다).
   그래서 폴링으로 받은 그 태그 값이 1이면 버튼이 초록으로 켜진다.

   주소는 X 영역이다. X는 보통 입력 릴레이라 CPU가 매 스캔 덮어쓰지만, 입력 유닛이
   점유하지 않은 번지는 내부 릴레이처럼 값이 남는다 — 싸이몬이 이 방식으로 돌고 있다. */
const ACTION_BUTTONS = [
  { tag: 'alarm_reset', text: 'ALARM RESET' },
  { tag: 'alarm_horn_stop', text: 'HORN STOP' },
];

function lampState(raw) {
  if (raw == null || raw === '') return UNKNOWN;
  const n = Number(raw);
  if (!Number.isFinite(n)) return UNKNOWN;
  return n > 0 ? ON : OFF;
}

const pad2 = (n) => String(n).padStart(2, '0');
const clockText = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

export default function AlarmPage() {
  const { t, i18n } = useTranslation('alarm');
  const [tags, setTags] = useState([]);
  const [polledValues, setPolledValues] = useState(null);   // null = 아직 한 번도 못 받음
  const [page, setPage] = useState(0);

  const [tagError, setTagError] = useState('');
  const [valueError, setValueError] = useState('');
  const [writeError, setWriteError] = useState('');
  const [lastOk, setLastOk] = useState(null);
  // C#이 마지막으로 PLC를 읽은 시각. 응답은 오는데 이 값이 멈춰 있으면 폴러가 죽은 것이다.
  const [polledAt, setPolledAt] = useState(null);

  /* 누름 상태 — heldTag는 지금 누르고 있는 태그(진행 바), armedTag는 2초를 채워
     1이 나간 태그(노란 테두리)다. 값 자체는 폴링이 알려주므로 여기서 꾸미지 않는다. */
  const [heldTag, setHeldTag] = useState('');
  const [armedTag, setArmedTag] = useState('');
  const heldRef = useRef(null);
  const armedRef = useRef(false);
  const holdTimerRef = useRef(null);

  /* 이만큼 누르고 있어야 1이 나간다. 다른 화면의 조작 버튼과 같은 값이다(엔지니어링 화면의
     누름 시간, 기본 2초) — 경보를 지우는 조작이라 스치듯 눌려서 나가면 안 된다. */
  const holdMs = useHoldMs();

  /* 두 버튼은 자기 값이 곧 램프라(짝이 되는 _lamp가 없다) 누른 태그를 그대로 읽는다.
     values는 폴링값에 그 한 태그만 얹힌 것이고, 아래 렌더는 이것만 보면 된다. */
  const { values, readWhileHeld, clearLive } = useLiveTagRead(ALARM_LAMP_FOLDER_ID, polledValues);
  /* 쓰기 순서를 지키기 위한 사슬. 1과 0을 각각 따로 보내면 0이 먼저 도착해서
     비트가 1로 남을 수 있다 — 1이 끝난 뒤에 0을 보낸다. */
  const chainRef = useRef(Promise.resolve());

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

  /* 누르는 순간에는 아무것도 보내지 않는다 — holdMs를 채워야 1이 나간다.
     그 뒤로는 싸이몬의 Bit Momentary와 같다(떼면 0). 다른 화면과 같은 방식이다. */
  const handlePress = (name) => {
    if (heldRef.current) return;   // 두 개를 동시에 누르는 상황은 만들지 않는다
    heldRef.current = name;
    armedRef.current = false;
    setHeldTag(name);
    setArmedTag('');
    setWriteError('');

    holdTimerRef.current = setTimeout(() => {
      armedRef.current = true;
      // 지금부터 이 버튼의 0이 나가야 한다 — 그 전에는 로그인 화면으로 넘어가지 않는다(pressGuard)
      beginPress();
      setArmedTag(name);
      chainRef.current = writeTag(ALARM_LAMP_FOLDER_ID, name, 1)
        /* 1이 실제로 나갔을 때만 읽는다 — 쓰기가 실패했으면 읽어 봐야 0이다.
           폴링(최악 2초 지연)을 기다리지 않고 버튼이 바로 초록이 되게 하는 것이다. */
        .then(() => readWhileHeld(name, () => heldRef.current === name))
        .catch((e) => setWriteError(`${name} — ${e.message}`));
    }, holdMs);
  };

  const handleRelease = () => {
    const name = heldRef.current;
    if (!name) return;
    heldRef.current = null;
    setHeldTag('');
    setArmedTag('');

    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;

    /* 직접 읽어 둔 값을 버리고 폴링에 맡긴다 — 떼면 0이 나가므로 꺼지는 것이 맞다.
       아직 안 읽었으면 예약만 취소한다(뗀 뒤에는 읽을 이유가 없다). */
    clearLive();

    // 누름 시간을 못 채웠으면 1을 보낸 적이 없으니 0도 보낼 필요가 없다
    if (!armedRef.current) return;
    armedRef.current = false;

    /* 1이 실패했어도 0은 보낸다 — 나갔는지 안 나갔는지 모르는 상태로 두는 것보다
       확실히 내리는 쪽이 안전하다.
       log=false: 이 0은 사람이 한 조작이 아니라 누름의 자동 해제다. */
    chainRef.current = chainRef.current
      .then(() => writeTag(ALARM_LAMP_FOLDER_ID, name, 0, false))
      .catch((e) => setWriteError(t('releaseFailed', { name, msg: e.message })))
      .finally(endPress);
  };

  /* 뗌을 버튼이 아니라 window에서 받는다. 손가락이 버튼 밖으로 나가서 떼도, 창이
     포커스를 잃어도(탭 전환·알림창) 반드시 0이 나가게 하려는 것이다.
     핸들러가 ref와 setState만 건드려서 렌더마다 새로 걸 필요가 없다. */
  useEffect(() => {
    const release = () => handleRelease();
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);

    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      /* 화면을 떠날 때 누르고 있던 것이 있으면 내린다(다른 화면과 같다). 타이머도 여기서 거둔다.
         안 내리면 0이 안 나가 비트가 1로 남고, pressGuard의 "누르는 중"도 안 풀려
         이후 로그인 화면으로 넘어가는 것이 매번 30초씩 늦어진다. */
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    () => (values ? tags.filter((tag) => lampState(values[lampNameOf(tag.tagName)]) === ON).length : 0),
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

        {/* 조작 버튼은 윗줄 오른쪽에 둔다. 예전에는 격자의 마지막 줄이었는데 두 가지가
            걸렸다 — 격자 한 줄(10칸)을 통째로 써서 알람 칸이 그만큼 납작해지고,
            '보는 칸' 99개 사이에 '누르는 것' 둘이 같은 모양으로 섞여 있었다.
            발생 건수와 함께 두면 이 줄이 '판을 다루는 줄'이 되어 구분도 분명해진다. */}
        <div className="al-ops">
          {/* 값을 쓰는 태그와 상태를 읽는 태그가 같다 — 폴링으로 받은 그 값이 1이면
              초록으로 켜진다. 못 읽었으면 점선(is-unknown)으로 '모름'을 표시한다.
              disabled를 걸지 않는 이유는 다른 화면과 같다: 비활성 요소는 뗌 이벤트를
              못 받아서 비트가 1로 남는다. */}
          {ACTION_BUTTONS.map((b) => {
            const state = values ? lampState(values[b.tag]) : null;
            return (
              <button
                type="button"
                key={b.tag}
                className={`al-action${state === ON ? ' is-on' : ''}`
                  + (state === UNKNOWN ? ' is-unknown' : '')
                  + (heldTag === b.tag ? ' is-held' : '')
                  + (armedTag === b.tag ? ' is-armed' : '')}
                onPointerDown={() => handlePress(b.tag)}
                data-tag={b.tag}
                title={t('holdTip', { tag: b.tag, sec: holdMs / 1000 })}
              >
                {b.text}
                {heldTag === b.tag && (
                  <span className="al-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
                )}
              </button>
            );
          })}

          {/* 발생 건수는 전체 기준이다 — 다른 페이지에서 울리고 있는 것도 놓치지 않게 */}
          <div className={`al-count${activeCount > 0 ? ' is-alarm' : ''}`}>
            {t('activeCount', { n: activeCount })}
          </div>
        </div>
      </div>

      {/* 쓰기 실패도 같은 줄에 띄운다 — 버튼을 눌렀는데 아무 반응이 없을 때
          (태그 이름 오타·PLC 거부·통신 끊김) 이유가 보여야 한다. 제일 최근 일이므로 앞에 둔다. */}
      {(writeError || tagError || valueError || staleWarning || (!values && !tagError)) && (
        <div className={`al-banner${writeError || tagError || valueError || staleWarning ? ' is-error' : ''}`}>
          {writeError || tagError || valueError || staleWarning || t('waitingValues')}
          {!writeError && valueError && lastOk && ` ${t('lastReceived', { time: clockText(lastOk) })}`}
        </div>
      )}

      <div className="al-grid">
        {cells.map((tag, i) => {
          if (!tag) return <div key={`empty-${i}`} className="al-cell is-empty" />;

          /* 값을 한 번도 못 받았으면 상태를 판정하지 않는다 —
             통신 전인데 전부 '정상'으로 보이면 알람이 없는 것으로 오해한다.

             짝이 되는 램프 태그가 없거나 비활성(enabled=0)이면 응답에 아예 없으므로
             undefined가 되고, lampState가 UNKNOWN(점선)을 돌려준다. */
          const lampName = lampNameOf(tag.tagName);
          const state = values ? lampState(values[lampName]) : null;
          // 설명이나 파일이 있는 칸 — 오른쪽 위에 클립 표시를 달아 눌러 볼 게 있음을 알린다
          const hasInfo = !!(tag.alarmDesc || tag.pdfFile || tag.imgFile);

          /* 누르면 설명·파일 창. 칸은 div라 화면 잠금(<fieldset disabled>)에 막히지 않는다 —
             조회 권한도 열어서 볼 수 있고, 고치기는 창이 canEdit으로 막는다. */
          return (
            <div
              key={tag.tagName}
              className={`al-cell${state === ON ? ' on' : ''}${state === UNKNOWN ? ' is-unknown' : ''}`}
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
