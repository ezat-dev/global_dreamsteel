import { useTranslation } from 'react-i18next';
import { LedInput } from './HmiParts';

/* ===========================================================================
   존 하나의 버너제어 사용자 설정 판 — 엔지니어링 화면의 '버너제어' 탭(EngBurnerSettings)이 쓴다.

   양식은 'PLC Point Configuration_EZ26391_버너설정(임시).xlsx'의 버너설정 시트 그대로다
   (주소는 그 뒤 '_261030 (버너부분 수정).xlsx'로 갱신 — 퍼지 타이머만 옮겨졌다).
     왼쪽  퍼지 타이머 / 펄스제어 싸이클 타이머 / 버너수량 / 전 버너 켜짐 출력치 ×2 / 버너별 펄스제어 순번
     오른쪽 펄스제어 온도제어 출력구간(버너 수만큼) — "앞 구간 상한 % ~ 이 구간 상한 % → 켤 버너 수"

   주소는 존마다 100개씩이다(1존 R100~R199, 2존 R200~R299 …). 태그 이름은 bc_zN_… 이고
   주소는 DB(ez_scada.folders_tags, 폴더 13 '버너설정')에만 적는다 — 등록 SQL은 sql/burner_settings_tags.sql.
   주소가 바뀌면 DB의 address만 고치면 되고 이 파일은 손대지 않는다.

   범위는 시트의 '설정범위' 칸 그대로다. 순번·구간 버너 수는 그 존의 버너 수까지로 막는다
   (시트는 1~8이지만 4·5·6존은 버너가 7개라 8을 넣을 수 없게 한다).
   =========================================================================== */

/** 존별 버너 수 — 시트: 1·2·3·7존 8개, 4·5·6존 7개 */
export const ZONE_BURNERS = { 1: 8, 2: 8, 3: 8, 4: 7, 5: 7, 6: 7, 7: 8 };


/** 태그 이름 — DB의 folders_tags.name과 반드시 같아야 한다(등록 SQL과 같은 규칙) */
export const burnerTag = {
  purge: (n) => `bc_z${n}_purge_timer`,            // R n10 퍼지 타이머 (초) — 10/30 주소표에서 R n30 → R n10
  cycle: (n) => `bc_z${n}_pulse_cycle_timer`,      // R n32 펄스제어 싸이클 타이머 (초)
  count: (n) => `bc_z${n}_pulse_burner_count`,     // R n34 펄스제어 버너수량 (개)
  allOn1: (n) => `bc_z${n}_all_on_output_1`,       // R n38 전 버너 켜짐 출력치 (%)
  allOn2: (n) => `bc_z${n}_all_on_output_2`,       // R n39 전 버너 켜짐 출력치 (%)
  order: (n, b) => `bc_z${n}_b${b}_pulse_order`,   // R n41~ 버너 n-b 펄스제어 순번
  secHi: (n, k) => `bc_z${n}_sec${k}_high`,        // R n51~ 구간 k 상한 (%) — 구간 수 = 버너 수
  secCount: (n, k) => `bc_z${n}_sec${k}_burners`,  // R n61~ 구간 k 켤 버너 수 (개)
};

/**
 * @param zone    존 번호(1~7)
 * @param values  폴더 13을 폴링한 { 태그이름: 값 }. null이면 아직 못 받음
 * @param onWrite (tag, value) => void — 숫자패드로 확정한 값을 쓴다
 */
export default function BurnerZonePanel({ zone, values, onWrite }) {
  const { t } = useTranslation('engineering');
  const burners = ZONE_BURNERS[zone];
  // 출력구간도 버너 수만큼이다(4·5·6존은 7구간) — 시트는 8구간 양식 하나뿐이지만 사용자 확인
  const sections = Array.from({ length: burners }, (_, i) => i + 1);

  // 값을 못 받았으면 0이 아니라 '---' — 0으로 그리면 "설정이 0"으로 읽힌다
  const text = (tag) => {
    const v = values?.[tag];
    return v == null || v === '' ? '---' : String(v);
  };

  /** 입력칸 하나 — 표시·입력·범위·툴팁(태그 이름)을 한 번에 붙인다 */
  const input = (tag, label, min, max, unit) => (
    <LedInput
      value={text(tag)}
      onChange={(v) => onWrite(tag, v)}
      color="green"
      size="sm"
      unit={unit}
      label={`${t('burner.zone', { n: zone })} ${label}`}
      title={`${label} / ${tag}`}
      min={min}
      max={max}
    />
  );

  const settings = [
    { tag: burnerTag.purge(zone), label: t('burner.purge'), min: 0, max: 1800, unit: 'sec' },
    { tag: burnerTag.cycle(zone), label: t('burner.cycle'), min: 10, max: 600, unit: 'sec' },
    { tag: burnerTag.count(zone), label: t('burner.count'), min: 1, max: burners },
    { tag: burnerTag.allOn1(zone), label: t('burner.allOn'), min: 0, max: 100, unit: '%' },
    { tag: burnerTag.allOn2(zone), label: t('burner.allOn'), min: 10, max: 100, unit: '%' },
    ...Array.from({ length: burners }, (_, i) => ({
      tag: burnerTag.order(zone, i + 1),
      label: t('burner.order', { n: zone, b: i + 1 }),
      min: 1,
      max: burners,
    })),
  ];

  return (
    <section className="hmi-group bz-panel">
      <span className="hmi-group-title">{t('burner.title', { n: zone })}</span>

      <div className="bz-body">
        {/* 왼쪽 — 설정 목록 */}
        <ol className="bz-list">
          {settings.map((s) => (
            <li className="bz-row" key={s.tag}>
              <span className="bz-label">{s.label}</span>
              <span className="bz-value">{input(s.tag, s.label, s.min, s.max, s.unit)}</span>
            </li>
          ))}
        </ol>

        {/* 오른쪽 — 출력구간. 구간 k의 시작(아래끝)은 앞 구간의 상한과 같은 값이다 — PLC에 따로 칸이
            없고 한 레지스터를 두 자리에서 보여 준다. 그래서 시작칸도 입력칸으로 두되, 고치면 앞 구간의
            상한(secHi(k-1))이 바뀐다(앞 줄의 상한 칸도 같이 바뀐다). 1구간 시작은 0 고정이라 표시 전용 칸이다. */}
        <div className="bz-sections">
          <div className="bz-sec-title">{t('burner.secTitle')}</div>
          <table className="bz-sec-table">
            <tbody>
              {sections.map((k) => {
                const hiLabel = `${t('burner.sec', { k })} ${t('burner.secHigh')}`;
                const loLabel = `${t('burner.sec', { k })} ${t('burner.secLow')}`;
                const cntLabel = `${t('burner.sec', { k })} ${t('burner.secBurners')}`;
                return (
                  <tr key={k}>
                    <th scope="row">{t('burner.sec', { k })}</th>
                    {/* 1구간 시작은 0 고정 — 고칠 수 없는 칸이지만 아래 줄들과 같은 칸 모양(표시 전용)으로
                        둬야 세로줄이 맞는다. 글자로 두면 칸 폭·% 자리가 달라 어긋난다. */}
                    {k === 1 ? (
                      <td>
                        <LedInput value="0" color="green" size="sm" unit="%" readOnly
                          title={`${t('burner.sec', { k })} ${t('burner.secLowFixed')}`} />
                      </td>
                    ) : (
                      <td>{input(burnerTag.secHi(zone, k - 1), loLabel, 0, 100, '%')}</td>
                    )}
                    <td className="bz-sec-sep">~</td>
                    <td>{input(burnerTag.secHi(zone, k), hiLabel, 0, 100, '%')}</td>
                    <td className="bz-sec-sep">→</td>
                    <td>{input(burnerTag.secCount(zone, k), cntLabel, 0, burners, t('burner.unitBurners'))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
