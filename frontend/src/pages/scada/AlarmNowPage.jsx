import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HmiTable from '../../components/scada/HmiTable';
import { getAlarmList } from '../../api/scada/alarmHistApi';
import { getAlarmLampValues, getAlarmTagList, lampNameOf } from '../../api/scada/alarmTagApi';
/* 표·안내줄은 경보이력(ah-*), 알람 칸은 알람화면(al-*)의 것을 그대로 쓴다 —
   같은 정보를 다른 모양으로 그리면 화면을 오갈 때 다른 것처럼 보인다. */
import './AlarmHistPage.css';
import './AlarmPage.css';
import './AlarmNowPage.css';

/* ===========================================================================
   현재 경보 — 지금 떠 있는 경보만 모아 보는 화면(보기 전용).

   왼쪽  : 경보이력 중 '발생'(해제 시각이 없는 행)만. ez_scada.vw_alarm_history의 alarm_status = 'ACTIVE'.
           C#이 알람 태그가 1이 될 때 넣고 0이 될 때 해제 시각을 찍는다.
   오른쪽: 알람화면의 램프(alarm_xxxx_lamp) 중 값이 1인 것만.

   두 쪽은 출처가 다르다(이력은 C#이 기록한 것, 램프는 PLC 값). 어긋나는 경우는 나중에
   따로 다루기로 하고, 지금은 각자 있는 그대로 보여 준다.

   이 화면은 띄워 두고 보는 화면이라 스스로 갱신한다 — 경보이력 화면(조회 버튼으로만
   다시 받음)과 다르다. 이력은 5초(구동·연소 하단 목록과 같은 주기), 램프는 1초(알람화면과 같은 주기).
   =========================================================================== */

/* 이력 다시 받는 주기. 타이머 조회라 autoPoll을 붙여 접근 로그에 남기지 않는다. */
const HIST_POLL_MS = 5000;

/* 램프 값 주기 — C#이 메모리에 들고 있는 값을 받는 것이라 PLC 부하가 늘지 않는다(알람화면과 같다). */
const LAMP_POLL_MS = 1000;

/** 램프 값 → 켜짐 여부. null(못 읽음)은 켜짐이 아니다 — 오른쪽에 안 올린다. */
const isOn = (raw) => {
  if (raw == null || raw === '') return false;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0;
};

export default function AlarmNowPage() {
  const { t } = useTranslation('alarmNow');

  /* 표 옵션 — 언어가 바뀔 때만 새로 만든다(HmiTable이 그때 표를 다시 만들며 읽는다) */
  const tableOptions = useMemo(() => ({
    paginationSize: 20,
    paginationSizeSelector: false,
    // 비어 있는 것이 정상인 화면이다 — '데이터 없음'이 아니라 무슨 뜻인지 말해 준다
    placeholder: t('empty'),
  }), [t]);

  /* ── 왼쪽: 발생 중인 이력 ───────────────────────────────────────────── */
  const [histRows, setHistRows] = useState([]);
  const [histLoaded, setHistLoaded] = useState(false);
  const [histError, setHistError] = useState('');

  useEffect(() => {
    let alive = true;
    let timer;
    let first = true;
    let lastJson = '';

    /* 응답을 받은 뒤 다음 타이머를 건다 — 느릴 때 요청이 겹쳐 쌓이지 않게(알람화면과 같은 방식).
       첫 조회만 사람이 들어온 것이라 로그에 남기고, 이후 5초 조회는 autoPoll이다. */
    const tick = () => {
      getAlarmList({ alarmStatus: 'ACTIVE', ...(first ? {} : { autoPoll: 1 }) })
        .then((res) => {
          if (!alive) return;
          const next = res.data ?? [];
          /* 바뀐 게 없으면 표를 건드리지 않는다 — 5초마다 같은 데이터를 다시 넣으면
             표가 다시 그려지면서 보던 페이지·행 높이 계산이 매번 흔들린다. */
          const json = JSON.stringify(next);
          if (json !== lastJson) {
            lastJson = json;
            setHistRows(next);
          }
          setHistLoaded(true);
          setHistError('');
        })
        .catch((e) => {
          // 목록은 지우지 않는다 — 통신이 끊긴 순간 경보가 사라지면 해제된 것처럼 보인다
          if (alive) setHistError(e.response?.data?.message ?? t('histFailed'));
        })
        .finally(() => {
          first = false;
          if (alive) timer = setTimeout(tick, HIST_POLL_MS);
        });
    };

    tick();
    return () => { alive = false; clearTimeout(timer); };
    // 한 번만 건다 — t는 실패 문구에만 쓰고, 언어를 바꿨다고 폴링을 다시 걸 일은 아니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 경보이력 화면과 같은 열에서 '경보상태'·'해제시각'만 뺐다 — 여기 있는 행은 전부
     발생 중이라 두 칸은 늘 같은 값(발생 / 빈칸)이다.
     열 머리의 검색칸도 뺐다 — 지금 떠 있는 경보만 보여서 보통 몇 건이라 거를 일이 없고,
     머리 높이만 차지한다. */
  const columns = useMemo(
    () => [
      { title: 'NO', formatter: 'rownum', hozAlign: 'center', width: 56 },
      { title: t('common:alarmCol.tagName'), field: 'tagName', minWidth: 110, widthGrow: 2, tooltip: true, hozAlign: 'center' },
      { title: t('common:alarmCol.address'), field: 'address', width: 90, hozAlign: 'center' },
      { title: t('common:alarmCol.alarmMsg'), field: 'alarmMsg', minWidth: 160, widthGrow: 3, tooltip: true, hozAlign: 'center' },
      { title: t('common:alarmCol.occurTime'), field: 'occurTimeStr', width: 150, hozAlign: 'center' },
    ],
    // 언어가 바뀌면 열 제목을 새로 만든다(표도 다시 그려진다)
    [t],
  );

  /* ── 오른쪽: 켜진 램프 ─────────────────────────────────────────────── */
  const [tags, setTags] = useState([]);
  const [tagError, setTagError] = useState('');
  const [lampValues, setLampValues] = useState(null);   // null = 아직 한 번도 못 받음
  const [lampError, setLampError] = useState('');

  // 알람 정의 — 실행 중 바뀌지 않으므로 1회만(알람화면과 같다)
  useEffect(() => {
    let alive = true;
    getAlarmTagList()
      .then((res) => { if (alive) { setTags(res.data ?? []); setTagError(''); } })
      .catch((e) => {
        if (alive) setTagError(e.response?.data?.message ?? t('tagsFailed'));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    let timer;
    const tick = () => {
      getAlarmLampValues()
        .then(({ values }) => {
          if (!alive) return;
          setLampValues(values);
          setLampError('');
        })
        .catch(() => {
          // 값은 지우지 않는다 — 끊긴 순간 켜져 있던 램프가 사라지면 복구된 것처럼 보인다
          if (alive) setLampError(t('plcFailed'));
        })
        .finally(() => {
          if (alive) timer = setTimeout(tick, LAMP_POLL_MS);
        });
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 켜진 것만, 왼쪽 표와 같은 순서(발생시각 최신순)로.
     램프에는 켜진 시각이 따로 없어서, 왼쪽 이력에서 같은 태그의 자리를 가져와 그 순서를 따른다 —
     두 쪽 순서가 같아야 같은 경보를 눈으로 맞춰 보기 쉽다.
     이력에 없는 램프(기록이 아직 안 됐거나 어긋난 것)는 맨 뒤에, 알람 정의 순서(=주소 순)로 둔다.
     왼쪽은 5초, 램프는 1초마다 바뀌므로 새로 켜진 램프는 최대 5초간 맨 뒤에 있다가 제자리로 온다. */
  const activeLamps = useMemo(() => {
    if (!lampValues) return [];
    const histOrder = new Map();
    histRows.forEach((r, i) => { if (!histOrder.has(r.tagName)) histOrder.set(r.tagName, i); });

    return tags
      .map((tag, addrIdx) => ({ tag, addrIdx }))
      .filter(({ tag }) => isOn(lampValues[lampNameOf(tag.tagName)]))
      .sort((a, b) => {
        const ha = histOrder.get(a.tag.tagName) ?? Infinity;
        const hb = histOrder.get(b.tag.tagName) ?? Infinity;
        return ha !== hb ? ha - hb : a.addrIdx - b.addrIdx;
      })
      .map(({ tag }) => tag);
  }, [tags, lampValues, histRows]);

  /* 오른쪽이 비었을 때 문구 — 값을 아직 못 받았거나 못 받는 중이면 '없음'이라고 하지 않는다
     (통신이 안 되는데 경보가 없다고 하면 안심하게 된다). */
  let lampEmpty = t('noLamps');
  if (tagError) lampEmpty = tagError;
  else if (!lampValues) lampEmpty = lampError || t('waitingValues');

  return (
    /* hmi-dark — 어두운 배경·유리 판·표 테마는 scada.css의 공용 규칙이 맡는다 */
    <div className="an-page hmi-dark">
      {/* ── 왼쪽: 경보이력 중 발생 ── */}
      <section className="an-col an-hist ah-page">
        <div className="an-head">
          <span className="an-title">{t('histTitle')}</span>
          {histError && <span className="ah-error">{histError}</span>}
          <span className={`al-count${histRows.length > 0 ? ' is-alarm' : ''}`}>
            {histLoaded ? t('activeCount', { n: histRows.length }) : t('common:list.loading')}
          </span>
        </div>
        <div className="ah-table">
          <HmiTable data={histRows} columns={columns} options={tableOptions} height="100%" fitRows />
        </div>
      </section>

      {/* ── 오른쪽: 알람화면 중 켜진 램프 ── */}
      <section className="an-col an-lamp">
        <div className="an-head">
          <span className="an-title">{t('lampTitle')}</span>
          {lampValues && lampError && <span className="ah-error">{lampError}</span>}
          <span className={`al-count${activeLamps.length > 0 ? ' is-alarm' : ''}`}>
            {lampValues ? t('activeCount', { n: activeLamps.length }) : t('waiting')}
          </span>
        </div>

        {activeLamps.length > 0 ? (
          <div className="an-lamps">
            {activeLamps.map((tag) => (
              <div
                key={tag.tagName}
                className="al-cell on an-lamp-cell"
                title={t('lampTip', { tag: tag.tagName, address: tag.address, lamp: lampNameOf(tag.tagName) })}
              >
                <span className="an-lamp-msg">{tag.alarmMsg || tag.tagName}</span>
                <span className="an-lamp-tag">{`${tag.tagName} · ${tag.address}`}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={`an-empty${tagError || (!lampValues && lampError) ? ' is-error' : ''}`}>
            {lampEmpty}
          </div>
        )}
      </section>
    </div>
  );
}
