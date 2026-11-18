import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { LedInput } from '../../components/scada/HmiParts';
import { writeTag } from '../../api/scada/foldertagApi';
import EngBurnerSettings from '../../components/scada/EngBurnerSettings';
import { getSettingList, updateSetting } from '../../api/scada/scadaSettingApi';
import {
  HOLD_MS_KEY, HOLD_MS_MAX, HOLD_MS_MIN, useHoldMsControl,
} from '../../components/scada/HoldMsContext';
import './EngineeringPage.css';

/* ===========================================================================
   엔지니어링 — 설비 설정값과 온도 보정, 화면 조작 설정(버튼 누름 시간)을 한 화면에서
   고친다. 들어올 수 있는 사람은 사용자별 권한(scadaMenu.js의 authEngineering)으로 정한다.

   다른 화면처럼 값은 폴더 하나를 1초마다 폴링하고, 쓰기는 자바를 거쳐 scada_log에
   남는다. 태그 이름은 아래에 적어 두고 DB(ez_scada.folders_tags)에 같은 이름으로 넣으면
   값이 붙는다 — 주소가 정해지면 DB의 address만 고치면 되고 이 파일은 손대지 않는다.
   태그가 없는 동안은 칸이 '---'로 뜨고, 고치려 하면 "태그를 찾을 수 없음"이 뜬다.

   화면 글자는 사전 i18n/{ko,en}/engineering.json에 있다 — 판 제목 section.<key>,
   항목 이름 item.<태그>, 설명 note.<태그>, 온도 보정 칸 zone.<key>.
   =========================================================================== */

/* 이 화면의 태그가 든 폴더 — ez_scada.folders.id. 아직 DB에 없다.
   폴더를 만들고 나온 id가 12가 아니면 이 숫자만 바꾸면 된다. 틀리면 오류가 아니라
   태그 0개 응답으로 조용히 실패해서 칸이 전부 '---'로 남으니 그때 여기를 먼저 본다. */
const ENG_FOLDER_ID = 12;

/* 로그인 유지 시간 — scada_setting의 키와 상한(분). 서버 updateSetting도 같은 0~1440으로 막는다. */
const SESSION_LIMIT_KEY = 'session_limit_min';
const SESSION_LIMIT_MAX_MIN = 1440;

// 판 하나에 줄 여덟. 비어 있는 줄도 번호는 남긴다 — 나중에 항목이 늘 자리다.
const ROWS = 8;

/* 설정 항목. 범위는 확인받은 것이 아니라 임시다(쿨링타워 지연시간과 같은 처리) —
   시간은 음수가 뜻이 없으니 min 0만 두고, 온도 기준은 다른 화면의 존 SV와 같은 0~1000으로 맞췄다. */
/* 항목 이름은 사전의 item.<태그>, note: true면 그 아래 설명(note.<태그>)이 붙는다.
   spare: true는 태그 없이 자리만 있는 예비 줄 — 빈 줄처럼 번호만 보인다(글자·입력칸 없음). */
const SECTIONS = [
  {
    key: 'drive',   // 구동부 설정
    items: [
      { tag: 'eng_facility_onoff_temp', unit: '℃', min: 0, max: 1000 },   // 설비 ON/OFF TEMP 설정
      { tag: 'eng_charge_hyd_unit_hold_time', unit: 'sec', min: 0 },        // 입구 유압 UNIT 가동후 유지 시간
      { tag: 'eng_discharge_hyd_unit_hold_time', unit: 'sec', min: 0 },     // 출구 유압 UNIT 가동후 유지 시간
      { tag: 'eng_charge_table_drive_alarm_time', unit: 'sec', min: 0 },    // 입구 TABLE 구동감지 알람시간
      { tag: 'eng_main_table_drive_alarm_time', unit: 'sec', min: 0 },      // MAIN TABLE 구동감지 알람시간
      { tag: 'eng_cc_table_drive_alarm_time', unit: 'sec', min: 0 },        // C/C TABLE 구동감지 알람시간
      { tag: 'eng_discharge_table_drive_alarm_time', unit: 'sec', min: 0 }, // 출구 TABLE 구동감지 알람시간
    ],
  },
  {
    /* 구동부 자동운전 TIME 설정 — 2026-11-18 사용자 지시로 연소부 설정(퍼지 3개) 자리를 대신한다.
       구동화면 윗줄에 있던 '출구 구동부 자동운전 TIME 설정' 판을 옮겨 온 것이다.
       1~4줄 입구, 5~8줄 출구. 넷째 줄은 둘 다 자리만 있는 예비 칸(spare)이다.

       출구 셋은 구동화면에서 쓰던 이름 그대로(DB에는 이 폴더 12에 같은 주소 R960/R962/R964로
       한 줄씩 넣는다). 입구 셋은 출구와 짝이 되게 이름만 지어 두었다 — 매핑은 나중에 하고,
       DB에 없는 동안은 '---'로 남는다. min/max는 구동화면에서 쓰던 그대로다. */
    key: 'autoTime',
    items: [
      { tag: 'charge_product_sort_delay_time', unit: 'sec', min: 0, max: 600 },       // 입구제품 정렬(지연)시간
      { tag: 'charge_product_detect_clear_time', unit: 'sec', min: 0, max: 600 },     // 입구 제품 감지 해제TIME
      { tag: 'charge_side_conveyor_forward_time', unit: 'sec', min: 15, max: 50 },    // 입구 SIDE CONVEYOR 전진 TIME
      { spare: true },                                                                 // 예비(번호만)
      // groupStart — 여기부터 출구. 줄 위에 굵은 선을 그어 입구와 가른다(EngineeringPage.css .is-group-start)
      { tag: 'discharge_product_sort_delay_time', unit: 'sec', min: 0, max: 600, groupStart: true }, // 출구제품 정렬(지연)시간
      { tag: 'discharge_product_detect_clear_time', unit: 'sec', min: 0, max: 600 },  // 출구 제품 감지 해제TIME
      { tag: 'discharge_side_conveyor_forward_time', unit: 'sec', min: 15, max: 50 }, // 출구 SIDE CONVEYOR 전진 TIME
      { spare: true },                                                                 // 예비(번호만)
    ],
  },
  {
    key: 'atmosphere',   // 분위기제어 설정
    items: [
      { tag: 'eng_atmos_allow_temp_detect_time', unit: 'sec', min: 0 },     // 분위기 제어 허용온도 감지시간
    ],
  },
];

/* 온도 보정 판(1~7존·예열대·냉각대 PV / PV보정)은 2026-11-18 사용자 지시로 지웠다 —
   한동안 CSS로 숨겨 둔 채였다. */

/* 화면 위 탭. 글자는 사전의 tab.<key>. 버너제어 탭은 놓을 존(zones)만 다르다. */
const TABS = [
  { key: 'basic' },
  { key: 'burnerA', zones: [1, 2, 3, 4] },
  { key: 'burnerB', zones: [5, 6, 7] },
];

export default function EngineeringPage() {
  const { t } = useTranslation('engineering');
  const { values: tagValues, error: tagValueError } = useFolderTagValues(ENG_FOLDER_ID);
  // 지금 탭(TABS의 key). 처음엔 기본 설정 — 화면 설명서도 이 탭을 설명한다
  const [tab, setTab] = useState('basic');
  const [writeError, setWriteError] = useState('');

  /* 버튼 누름 시간 — PLC 태그가 아니라 DB(scada_setting의 hold_ms)에 있는 화면 설정이다.
     그래서 위 폴링이 아니라 HoldMsContext가 들고 있는 값을 보여 준다.
     작업자는 초(소수 한 자리)로 보고 넣고, DB에는 ms 정수로 들어간다 — 1.5초 → 1500.
     scada_log에는 남기지 않는다(PLC 조작이 아니다). */
  const { holdMs, setHoldMs, refresh: refreshHoldMs } = useHoldMsControl();

  const handleHoldWrite = (value) => {
    /* 숫자패드가 소수 한 자리까지만 받으므로 ×1000 뒤의 반올림은 부동소수 오차
       (1.1 × 1000 = 1100.0000000000002)를 지우는 것뿐이다 — 값이 바뀌지 않는다. */
    const ms = Math.round(Number(value) * 1000);
    if (!Number.isFinite(ms) || ms < HOLD_MS_MIN || ms > HOLD_MS_MAX) return;
    setWriteError('');
    updateSetting(HOLD_MS_KEY, ms)
      // 이 기기는 바로 바꾼다. 다른 기기는 화면 이동이나 30초 안에 따라온다(HoldMsContext)
      .then(() => setHoldMs(ms))
      .catch((e) => {
        setWriteError(`${t('hold.label')} — ${e.response?.data?.message ?? e.message}`);
        // 저장이 됐는지 모르는 채로 두지 않는다 — DB에 실제로 있는 값을 다시 받아 보여 준다
        refreshHoldMs();
      });
  };

  /* 로그인 유지 시간 — DB(scada_setting의 session_limit_min)에 분 단위로 있다. 0 = 무제한.
     로그인한 시각부터 세고, 지나면 서버(SessionConfig)가 막는다 — 화면은 5초 안에
     로그인으로 간다(ScadaLayout). 화면도 분으로 보고 넣는다 — 시간 단위(0.1시간 = 6분)로 두면
     1분 같은 값을 못 넣고, 6분이 "0.1"로 보여 헷갈렸다.

     이 값은 이 화면만 쓰므로 HoldMsContext처럼 공유하지 않고, 열 때 한 번 받는다.
     null = 아직 못 받음 — '---'로 보여 준다(0으로 그리면 "무제한"으로 읽힌다). */
  const [sessionLimitMin, setSessionLimitMin] = useState(null);

  const loadSessionLimit = () => {
    getSettingList()
      .then((res) => {
        const row = (res.data ?? []).find((r) => r.settingKey === SESSION_LIMIT_KEY);
        const min = Number(row?.settingValue);
        setSessionLimitMin(row && Number.isInteger(min) ? min : null);
      })
      .catch(() => setSessionLimitMin(null));
  };

  useEffect(() => {
    loadSessionLimit();
    // 열 때 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSessionLimitWrite = (value) => {
    // 숫자패드가 정수만 받는다(decimals 기본 0). 반올림은 마지막 방어선이다
    const min = Math.round(Number(value));
    if (!Number.isFinite(min) || min < 0 || min > SESSION_LIMIT_MAX_MIN) return;
    setWriteError('');
    updateSetting(SESSION_LIMIT_KEY, min)
      .then(() => setSessionLimitMin(min))
      .catch((e) => {
        setWriteError(`${t('session.label')} — ${e.response?.data?.message ?? e.message}`);
        loadSessionLimit();
      });
  };

  /* 값을 못 받았으면 0이 아니라 '---'다 — 0으로 그리면 "설정이 0"으로 읽힌다 */
  const text = (tag) => {
    const v = tagValues?.[tag];
    return v == null || v === '' ? '---' : String(v);
  };

  /* 숫자패드가 문자열을 준다. C#은 PLC 워드를 정수로만 읽고 쓰므로 정수로 맞춘다
     (숫자패드가 소수점을 이미 막고 있지만 다른 화면들과 같은 마지막 방어선이다). */
  const handleWrite = (tag, value) => {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return;
    setWriteError('');
    writeTag(ENG_FOLDER_ID, tag, num)
      .catch((e) => setWriteError(`${tag} — ${e.message}`));
  };

  return (
    /* hmi-dark — 어두운 배경·유리 판은 scada.css의 공용 규칙이 맡는다 */
    <div className="eng-page hmi-dark">
      {/* 탭 — 기본 설정(아래 판들) / 버너제어 1~4존 / 버너제어 5~7존.
          버너제어는 존 판이 커서 한 화면에 넷까지만 둔다(EngBurnerSettings).
          button이 아니라 div다 — 조회 권한이면 본문이 <fieldset disabled>라 button은 눌리지 않는데,
          조회 권한도 탭을 넘겨 값을 볼 수는 있어야 한다(알람화면 칸과 같은 이유). */}
      <div className="eng-tabs" role="tablist">
        {TABS.map((tb) => (
          <div
            role="tab"
            tabIndex={0}
            key={tb.key}
            data-tab={tb.key}
            aria-selected={tab === tb.key}
            className={`eng-tab${tab === tb.key ? ' is-on' : ''}`}
            onClick={() => setTab(tb.key)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTab(tb.key); }}
          >
            {t(`tab.${tb.key}`)}
          </div>
        ))}
      </div>

      {tab !== 'basic' && <EngBurnerSettings zones={TABS.find((tb) => tb.key === tab).zones} />}

      {tab === 'basic' && (
      <>
      <div className="eng-sections">
        {SECTIONS.map((s) => (
          <section className={`hmi-group eng-section eng-section--${s.key}`} key={s.key}>
            <span className="hmi-group-title">{t(`section.${s.key}`)}</span>
            <ol className="eng-rows">
              {Array.from({ length: ROWS }, (_, i) => {
                /* 예비(spare) 줄은 빈 줄과 똑같이 번호만 남긴다 — 자리를 지켜 입구·출구가 넷씩 맞게 */
                const it = s.items[i]?.spare ? null : s.items[i];
                const label = it ? t(`item.${it.tag}`) : '';
                return (
                  <li
                    className={`eng-row${it ? '' : ' is-empty'}${it?.groupStart ? ' is-group-start' : ''}`}
                    key={i}
                  >
                    <span className="eng-no">{i + 1}.</span>
                    {it && (
                      <>
                        <span className="eng-label">
                          {label}
                          {it.note && <small className="eng-note">{t(`note.${it.tag}`)}</small>}
                        </span>
                        <span className="eng-value">
                          <LedInput
                            value={text(it.tag)}
                            onChange={(v) => handleWrite(it.tag, v)}
                            color="green"
                            unit={it.unit}
                            size="sm"
                            label={label}
                            title={`${label} / ${it.tag}`}
                            min={it.min}
                            max={it.max}
                          />
                        </span>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {/* 화면 조작 설정 — PLC가 아니라 웹이 쓰는 값이라 판을 따로 둔다.
          위 판 셋에 끼우면 넷째 판이 생겨 칸이 좁아지고, PLC 설정값과 섞여 보인다. */}
      <section className="hmi-group eng-section eng-section--operation">
        <span className="hmi-group-title">{t('section.operation')}</span>
        <ol className="eng-rows eng-rows--operation">
          <li className="eng-row">
            <span className="eng-no">1.</span>
            <span className="eng-label">
              {t('hold.label')}
              <small className="eng-note">{t('hold.note')}</small>
            </span>
            <span className="eng-value">
              <LedInput
                value={(holdMs / 1000).toFixed(1)}
                onChange={handleHoldWrite}
                color="green"
                unit="sec"
                size="sm"
                label={t('hold.label')}
                title={t('hold.tip', { key: HOLD_MS_KEY, ms: holdMs })}
                min={HOLD_MS_MIN / 1000}
                max={HOLD_MS_MAX / 1000}
                decimals={1}
              />
            </span>
          </li>
          <li className="eng-row">
            <span className="eng-no">2.</span>
            <span className="eng-label">
              {t('session.label')}
              <small className="eng-note">{t('session.note')}</small>
            </span>
            <span className="eng-value">
              <LedInput
                value={sessionLimitMin == null ? '---' : String(sessionLimitMin)}
                onChange={handleSessionLimitWrite}
                color="green"
                unit="min"
                size="sm"
                label={t('session.padLabel')}
                title={t('session.tip', {
                  key: SESSION_LIMIT_KEY,
                  value: sessionLimitMin == null ? t('session.unread') : t('session.minutes', { n: sessionLimitMin }),
                })}
                min={0}
                max={SESSION_LIMIT_MAX_MIN}
              />
            </span>
          </li>
        </ol>
      </section>

      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
      </>
      )}
    </div>
  );
}
