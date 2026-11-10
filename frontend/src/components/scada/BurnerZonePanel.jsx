import { useTranslation } from 'react-i18next';
import { LedInput } from './HmiParts';
import { ZONE_TOP } from './combustionArtTags';

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

  /* 버너별 펄스제어 순번 — 목록 줄로 늘어놓는 대신 연소화면과 같은 버너 배치도에 칸을 붙인다(모든 존). */
  const orders = Array.from({ length: burners }, (_, i) => ({
    b: i + 1,
    tag: burnerTag.order(zone, i + 1),
    label: t('burner.order', { n: zone, b: i + 1 }),
  }));

  const settings = [
    { tag: burnerTag.purge(zone), label: t('burner.purge'), min: 0, max: 1800, unit: 'sec' },
    { tag: burnerTag.cycle(zone), label: t('burner.cycle'), min: 10, max: 600, unit: 'sec' },
    { tag: burnerTag.count(zone), label: t('burner.count'), min: 1, max: burners },
    { tag: burnerTag.allOn1(zone), label: t('burner.allOn'), min: 0, max: 100, unit: '%' },
    { tag: burnerTag.allOn2(zone), label: t('burner.allOn'), min: 10, max: 100, unit: '%' },
  ];

  /* 배치도의 버너 한 자리 — 버너 그림 + (번호표·순번 칸 한 묶음).
     순번은 불이 붙었는지가 아니라 버너 기기에 매기는 설정이라 불꽃이 아니라 버너 그림을 쓴다.
     번호와 칸을 그림 옆에 나란히 두면 칸이 옆 버너의 번호와 붙어 어느 버너 것인지 헷갈려서,
     그림 바로 밑(아래 줄은 위)에 묶어 세운다.
     번호는 연소화면 번호표와 같다: 위 줄 왼쪽부터 1번, 아래 줄 왼쪽부터 이어서. */
  const mapCell = (o) => (
    <div className="bz-map-cell" key={o.tag}>
      <img className="bz-map-burner" src="/scada/engineering/eng-burner.svg?v=1" alt=""
        title={`${o.label} / ${o.tag}`} />
      <div className="bz-map-set">
        <span className="bz-map-no">{o.b}</span>
        {input(o.tag, o.label, 1, burners)}
      </div>
    </div>
  );

  // 위 줄 버너 수는 연소화면 작화와 같은 표(4·5·6존 3개, 나머지 4개). 아래 줄은 나머지.
  const topCount = ZONE_TOP[zone - 1];

  return (
    <section className="hmi-group bz-panel">
      <span className="hmi-group-title">{t('burner.title', { n: zone })}</span>

      <div className="bz-body">
        {/* 왼쪽 — 설정 목록 + 순번 배치도 */}
        <div className="bz-left">
          <ol className="bz-list">
            {settings.map((s) => (
              <li className="bz-row" key={s.tag}>
                <span className="bz-label">{s.label}</span>
                <span className="bz-value">{input(s.tag, s.label, s.min, s.max, s.unit)}</span>
              </li>
            ))}
          </ol>

          <div className="bz-map">
            <div className="bz-sec-title">{t('burner.orderMap')}</div>
            <div className="bz-map-box">
              <div className="bz-map-row is-top">{orders.slice(0, topCount).map(mapCell)}</div>
              <div className="bz-map-zone">{t('burner.zone', { n: zone })}</div>
              <div className="bz-map-row is-bot">{orders.slice(topCount).map(mapCell)}</div>
            </div>
          </div>
        </div>

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
