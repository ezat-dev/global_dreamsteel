import { useState } from 'react';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { LedInput } from '../../components/scada/HmiParts';
import { writeTag } from '../../api/scada/foldertagApi';
import './EngineeringPage.css';

/* ===========================================================================
   엔지니어링 — 설비 설정값과 온도 보정을 한 화면에서 고친다. 관리자 전용이다
   (scadaMenu.js의 adminOnly).

   다른 화면처럼 값은 폴더 하나를 1초마다 폴링하고, 쓰기는 자바를 거쳐 scada_log에
   남는다. 태그 이름은 아래에 적어 두고 DB(ez_scada.folders_tags)에 같은 이름으로 넣으면
   값이 붙는다 — 주소가 정해지면 DB의 address만 고치면 되고 이 파일은 손대지 않는다.
   태그가 없는 동안은 칸이 '---'로 뜨고, 고치려 하면 "태그를 찾을 수 없음"이 뜬다.
   =========================================================================== */

/* 이 화면의 태그가 든 폴더 — ez_scada.folders.id. 아직 DB에 없다.
   폴더를 만들고 나온 id가 12가 아니면 이 숫자만 바꾸면 된다. 틀리면 오류가 아니라
   태그 0개 응답으로 조용히 실패해서 칸이 전부 '---'로 남으니 그때 여기를 먼저 본다. */
const ENG_FOLDER_ID = 12;

// 판 하나에 줄 여덟. 비어 있는 줄도 번호는 남긴다 — 나중에 항목이 늘 자리다.
const ROWS = 8;

/* 설정 항목. 범위는 확인받은 것이 아니라 임시다(쿨링타워 지연시간과 같은 처리) —
   시간은 음수가 뜻이 없으니 min 0만 두고, 온도 기준은 다른 화면의 존 SV와 같은 0~1000으로 맞췄다.
   퍼지시간의 min 60만은 원본 화면에 적힌 조건이다("최소 1분(60초) 이상"). */
const SECTIONS = [
  {
    key: 'drive',
    title: '구동부 설정',
    items: [
      { tag: 'eng_facility_onoff_temp', label: '설비 ON/OFF TEMP 설정', unit: '℃', min: 0, max: 1000 },
      { tag: 'eng_charge_hyd_unit_hold_time', label: '입구 유압 UNIT 가동후 유지 시간', unit: 'sec', min: 0 },
      { tag: 'eng_discharge_hyd_unit_hold_time', label: '출구 유압 UNIT 가동후 유지 시간', unit: 'sec', min: 0 },
      { tag: 'eng_charge_table_drive_alarm_time', label: '입구 TABLE 구동감지 알람시간', unit: 'sec', min: 0 },
      { tag: 'eng_main_table_drive_alarm_time', label: 'MAIN TABLE 구동감지 알람시간', unit: 'sec', min: 0 },
      { tag: 'eng_cc_table_drive_alarm_time', label: 'C/C TABLE 구동감지 알람시간', unit: 'sec', min: 0 },
      { tag: 'eng_discharge_table_drive_alarm_time', label: '출구 TABLE 구동감지 알람시간', unit: 'sec', min: 0 },
    ],
  },
  {
    key: 'combustion',
    title: '연소부 설정',
    items: [
      { tag: 'eng_purge_open_time', label: '퍼지 OPEN 시간', unit: 'sec', min: 0 },
      {
        tag: 'eng_purge_time', label: '퍼지시간', note: '최소 1분(60초) 이상 PURGE 설정상태',
        unit: 'sec', min: 60,
      },
      { tag: 'eng_purge_close_time', label: '퍼지 CLOSE 시간', unit: 'sec', min: 0 },
    ],
  },
  {
    key: 'atmosphere',
    title: '분위기제어 설정',
    items: [
      { tag: 'eng_atmos_allow_temp_detect_time', label: '분위기 제어 허용온도 감지시간', unit: 'sec', min: 0 },
    ],
  },
];

/* 온도 보정 열 칸. PV는 읽기 전용, PV보정은 고친다.

   1~7존의 PV는 온도제어 화면과 같은 이름(tic_zN_pv)으로 둔다 — 같은 주소(D101 등)를
   보는 값이라 이름이 갈리면 같은 온도를 다른 것처럼 읽게 된다. 태그 이름은 폴더 안에서만
   유일하면 되므로 이 폴더에도 같은 이름으로 한 줄씩 넣으면 된다.
   예열대·냉각대는 아직 어느 화면에도 없는 값이라 이름을 새로 지었다.

   보정값은 음수가 될 수 있어(실측보다 높게 읽히면 빼야 한다) min을 두지 않는다 —
   숫자패드는 min이 0 이상일 때만 빼기 키를 막는다. 범위가 정해지면 min/max를 넣으면 된다. */
const ZONES = [
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
    key: `z${n}`, label: `${n}ZONE`, pv: `tic_z${n}_pv`, offset: `tic_z${n}_pv_offset`,
  })),
  { key: 'preheat', label: '예열대', pv: 'tic_preheat_pv', offset: 'tic_preheat_pv_offset' },
  { key: 'cool1', label: '냉각대 (1)', pv: 'tic_cool1_pv', offset: 'tic_cool1_pv_offset' },
  { key: 'cool2', label: '냉각대 (2)', pv: 'tic_cool2_pv', offset: 'tic_cool2_pv_offset' },
];

export default function EngineeringPage() {
  const { values: tagValues, error: tagValueError } = useFolderTagValues(ENG_FOLDER_ID);
  const [writeError, setWriteError] = useState('');

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
      <div className="eng-sections">
        {SECTIONS.map((s) => (
          <section className={`hmi-group eng-section eng-section--${s.key}`} key={s.key}>
            <span className="hmi-group-title">{s.title}</span>
            <ol className="eng-rows">
              {Array.from({ length: ROWS }, (_, i) => {
                const it = s.items[i];
                return (
                  <li className={`eng-row${it ? '' : ' is-empty'}`} key={i}>
                    <span className="eng-no">{i + 1}.</span>
                    {it && (
                      <>
                        <span className="eng-label">
                          {it.label}
                          {it.note && <small className="eng-note">{it.note}</small>}
                        </span>
                        <span className="eng-value">
                          <LedInput
                            value={text(it.tag)}
                            onChange={(v) => handleWrite(it.tag, v)}
                            color="green"
                            unit={it.unit}
                            size="sm"
                            label={it.label}
                            title={`${it.label} / ${it.tag}`}
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

      <section className="hmi-group eng-tc">
        <span className="hmi-group-title">온도 보정</span>
        <div className="eng-zones">
          {ZONES.map((z) => (
            <div className="eng-zone" key={z.key}>
              <div className="eng-zone-title">{z.label}</div>
              <div className="eng-zone-row">
                <b>PV</b>
                <LedInput
                  value={text(z.pv)}
                  color="red"
                  unit="℃"
                  size="sm"
                  readOnly
                  title={`${z.label} 현재온도(PV) — 읽기 전용 / ${z.pv}`}
                />
              </div>
              <div className="eng-zone-row">
                <b>PV보정</b>
                <LedInput
                  value={text(z.offset)}
                  onChange={(v) => handleWrite(z.offset, v)}
                  color="green"
                  unit="℃"
                  size="sm"
                  label={`${z.label} PV 보정`}
                  title={`${z.label} PV 보정 / ${z.offset}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
    </div>
  );
}
