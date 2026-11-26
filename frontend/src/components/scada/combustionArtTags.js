/* ===========================================================================
   연소화면 작화(CombustionOverview) 위 배관 부속이 보는 태그.

   구동화면의 driveArtTags.js와 같은 이유로 따로 둔다 — 그림(툴팁)과 화면(색)이 같은
   태그 이름을 봐야 하는데, CombustionPage가 CombustionOverview를 import 하므로
   반대 방향으로는 가져올 수 없다.

   값 규칙: 1이면 작화 그대로의 제 색, 0이거나 못 읽으면 빨강.
   구동화면 모터(회색)와 다르다 — 이쪽은 '지금 닫혀 있다/멈춰 있다'를 눈에 띄게
   알리는 자리라 빨강으로 정했다.

   주소는 아직 임시(M300)다. 실주소를 알게 되면 DB의 address만 UPDATE 하면 되고
   이 파일은 손대지 않아도 된다 — 이름으로 읽기 때문이다.

   툴팁의 부속 이름과 값 규칙 문구는 사전(i18n/{ko,en}/combustion.json)의 art.<태그>·rule.*에 있다.
   =========================================================================== */

import i18n from '../../i18n';

/* 키는 작화 클래스 이름 그대로다 — 빨강 클래스(red-<키>)와 짝이 눈으로 맞춰진다.
   넷 다 작화 위쪽 배관에 있고, 앞 둘이 MAIN GAS 쪽, 뒤 둘이 연소 BLOWER 쪽이다.
     gas-pre     x 252 y  9  MAIN GAS 압력 조절밸브
     gas-sol     x 317 y  8  MAIN GAS 솔레노이드 밸브
     blower-pre  x 917 y  9  연소 BLOWER 압력 조절밸브
     blower-pump x1001 y 26  연소 BLOWER 송풍기
   (2026-11 압력·솔 그림을 모양에 맞게 바꿔 끼웠다 — combustionOverview.css의 .gas-pre 주석.
    키와 태그는 자리를 따라가므로 그대로다) */
export const FITTING_TAGS = {
  'gas-pre': { tag: 'main_gas_valve_lamp' },
  'gas-sol': { tag: 'main_gas_sol_valve_lamp' },
  'blower-pre': { tag: 'combustion_blower_valve_lamp' },
  'blower-pump': { tag: 'combustion_blower_motor_lamp' },
};

/* 그림 위에 마우스를 올렸을 때 뜨는 글. 화면의 다른 title들과 같은 꼴이다. */
export const fittingTitle = (cls) => {
  const { tag } = FITTING_TAGS[cls];
  return `${i18n.t(`combustion:art.${tag}`)} / ${tag} — ${i18n.t('combustion:rule.fitting')}`;
};

/* 빨강으로 만들 때 무대에 붙는 클래스. CombustionPage.css의 선택자와 짝이 맞아야 한다. */
export const fittingRedClass = (cls) => `red-${cls}`;

/* ---------------------------------------------------------------------------
   버너 자리와 태그 번호 — 둘을 따로 둔다.

   화면 배치(ZONE_TOP / ZONE_BOTTOM): 1~3·7존은 위 4, 아래 4. 4~6존은 위 4, 아래 3.
   (2026-11-26 사용자 정정 — 그 전 그림은 4~6존이 위 3, 아래 4였다.)

   PLC 목록은 '존-버너'로 적는다(No.1 Zone Burner 1-5). 존 안의 버너 번호는 위 줄 왼쪽부터
   1번이고 아래 줄 왼쪽부터 이어진다 — 개별연소 창(ZoneBurnerModal)과 같은 규칙이다.
   그래서 1존은 위 1-1~1-4, 아래 1-5~1-8이고, 4존은 위 4-1~4-4, 아래 4-5~4-7이다.

   태그 번호(combustion_fire38_lamp의 38 등)는 옛 배치(4~6존 위 3개)일 때 화면 왼쪽부터
   센 1~53이다(위 줄 1~25, 아래 줄 26~53). DB의 주소·설명이 이 이름에 '존-버너'로 붙어 있어서
   (38 = 4-4) 배치를 바꿀 때 이름은 그대로 두고, 그림 자리가 같은 버너의 태그를 가리키게 했다.
   그래서 4~6존은 화면 순서와 태그 번호가 어긋난다(4존 위 줄 = 13, 14, 15, 38).
   번호를 다시 매기면 주소 UPDATE가 필요하고 로그 이력이 섞인다 — 사용자 결정으로 이름 유지.
   ------------------------------------------------------------------------- */

/* 존별 위·아래 줄 버너 수 — 화면 그림 그대로다.
   (CombustionPage의 버너 번호표, 엔지니어링 순서 그림, 개별연소 창도 이 둘을 쓴다.) */
export const ZONE_TOP = [4, 4, 4, 4, 4, 4, 4];
export const ZONE_BOTTOM = [4, 4, 4, 3, 3, 3, 4];

/* 태그 번호를 매길 때의 옛 배치 — 태그 이름이 바뀌지 않는 한 고치지 않는다. */
const TAG_TOP = [4, 4, 4, 3, 3, 3, 4];
const TAG_TOP_TOTAL = 25;
const TAG_BOTTOM_EACH = 4;

const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
/** 앞 n개의 합. 예: sumFirst(ZONE_TOP, 2) → 1·2존 위 줄 버너 수 */
const sumFirst = (arr, n) => arr.slice(0, n).reduce((a, b) => a + b, 0);

/** 태그 번호 → { zone, no }. 예: 1 → 1존 1번, 26 → 1존 5번, 38 → 4존 4번, 53 → 7존 8번 */
export const burnerOf = (n) => {
  if (n <= TAG_TOP_TOTAL) {
    let left = n;
    for (let z = 0; z < TAG_TOP.length; z++) {
      if (left <= TAG_TOP[z]) return { zone: z + 1, no: left };
      left -= TAG_TOP[z];
    }
  }
  const i = n - TAG_TOP_TOTAL - 1;             // 옛 아래 줄 0부터
  const zone = Math.floor(i / TAG_BOTTOM_EACH) + 1;
  return { zone, no: TAG_TOP[zone - 1] + (i % TAG_BOTTOM_EACH) + 1 };
};

/** { zone, no } → 태그 번호. burnerOf의 반대다. 예: (4, 4) → 38, (4, 5) → 39 */
const tagNoOf = (zone, no) => {
  const top = TAG_TOP[zone - 1];
  return no <= top
    ? sumFirst(TAG_TOP, zone - 1) + no
    : TAG_TOP_TOTAL + (zone - 1) * TAG_BOTTOM_EACH + (no - top);
};

/** 툴팁에 붙는 '1존 버너 1-5' */
const burnerLabel = (n) => {
  const { zone, no } = burnerOf(n);
  return i18n.t('combustion:art.burner', { zone, no });
};

/* ---------------------------------------------------------------------------
   불꽃 뒤의 번개(점화 표시) 53개 — PLC의 점화 트랜스 출력(Y0E0~, Ignition Tr. On).

   위 부속들과 값 규칙이 다르다 — 이쪽은 1이면 보이고 0이거나 못 읽으면 숨긴다.
   빨강으로 두지 않는 이유는 번개가 '있다/없다'를 알리는 표시라서다. 꺼진 것을
   빨갛게 두면 점화 이상으로 읽힌다.

   작화 클래스 번호는 그림 자리 순서다. 위쪽 줄(for-thun-1~28)은 화면 왼→오로 존마다 4개,
   아래쪽 줄(rev-thun-1~25)은 rotate(-180deg) 탓에 작화 번호가 오→왼이다 — rev-thun-1이
   화면 맨 오른쪽(7존 아래 끝), rev-thun-25가 맨 왼쪽(1존 아래 첫째)이다.
   태그 번호는 자리 → '존-버너' → tagNoOf로 정한다(위 '버너 자리와 태그 번호' 참고).
   예: for-thun-16(4존 위 넷째, 4-4) → 38, rev-thun-25(1존 아래 첫째, 1-5) → 26.

   주소는 DB(sql/combustion_real_tags.sql)에 있다. 바뀌면 address만 UPDATE 하면 되고
   이 파일은 손대지 않는다.
   ------------------------------------------------------------------------- */

const BOTTOM_TOTAL = sumFirst(ZONE_BOTTOM, ZONE_BOTTOM.length);   // 25

/* 작화 클래스 → 태그 번호. 위 28개 + 아래 25개. */
export const THUNDER_TAGS = Object.fromEntries([
  ...ZONE_TOP.flatMap((cnt, z) => range(cnt).map((k) => [
    `for-thun-${sumFirst(ZONE_TOP, z) + k}`,
    tagNoOf(z + 1, k),
  ])),
  /* j: 그 존 아래 줄의 화면 왼쪽부터 순서. 존 번호는 위 줄 뒤에 이어진다. */
  ...ZONE_BOTTOM.flatMap((cnt, z) => range(cnt).map((j) => [
    `rev-thun-${BOTTOM_TOTAL + 1 - (sumFirst(ZONE_BOTTOM, z) + j)}`,
    tagNoOf(z + 1, ZONE_TOP[z] + j),
  ])),
]);

/** 작화 클래스 → 태그 이름. 예: 'for-thun-1' → 'combustion_thunder1_lamp' */
export const thunderTag = (cls) => `combustion_thunder${THUNDER_TAGS[cls]}_lamp`;

/** 그림 위에 뜨는 글. 위 부속들과 같은 꼴이되 값 규칙만 다르다. */
export const thunderTitle = (cls) =>
  `${i18n.t('combustion:art.thunder', { n: THUNDER_TAGS[cls] })} (${burnerLabel(THUNDER_TAGS[cls])}) / ${thunderTag(cls)} — ${i18n.t('combustion:rule.thunder')}`;

/* 숨길 때 무대에 붙는 클래스. combustionOverview.css의 선택자와 짝이 맞아야 한다. */
export const thunderHideClass = (cls) => `hide-${cls}`;

/* ---------------------------------------------------------------------------
   존 불꽃 53개 — PLC의 화염 감지 입력(X040~, Flame Detection).
   번개와 같은 규칙이다: 1이면 보이고 0이거나 못 읽으면 숨긴다.

   불꽃과 번개는 같은 버너 자리에 한 쌍씩 있어서 번호도 번개와 똑같이 짝짓는다
   (for-fire-N ↔ for-thun-N, rev-fire-N ↔ rev-thun-N — 아래 줄이 오→왼인 것도 같다).
   그래서 표를 따로 적지 않고 번개 표에서 이름만 바꿔 만든다.
   ------------------------------------------------------------------------- */

/* 작화 클래스 → 태그 번호. 예: 'for-fire-1' → 1, 'rev-fire-25' → 26 */
export const FIRE_TAGS = Object.fromEntries(
  Object.entries(THUNDER_TAGS).map(([cls, n]) => [cls.replace('-thun-', '-fire-'), n]),
);

/** 작화 클래스 → 태그 이름. 예: 'for-fire-1' → 'combustion_fire1_lamp' */
export const fireTag = (cls) => `combustion_fire${FIRE_TAGS[cls]}_lamp`;

/** 그림 위에 뜨는 글(태그 매핑한 그림에는 툴팁을 단다) */
export const fireTitle = (cls) =>
  `${i18n.t('combustion:art.fire', { n: FIRE_TAGS[cls] })} (${burnerLabel(FIRE_TAGS[cls])}) / ${fireTag(cls)} — ${i18n.t('combustion:rule.thunder')}`;

/* 숨길 때 무대에 붙는 클래스. combustionOverview.css의 선택자와 짝이 맞아야 한다. */
export const fireHideClass = (cls) => `hide-${cls}`;

/* ---------------------------------------------------------------------------
   버너마다 붙은 밸브 두 개 — 노란 가스 밸브(zone-valve.svg, 작화 클래스에 is-outer)와
   흰 공기 밸브(zone-valve-air.svg). PLC의 Gas V/V Open(Y120~) / Air V/V Open(Y160~).
   값 규칙: 1이면 초록, 0이거나 못 읽으면 빨강(위 배관 부속과 같은 '못 읽으면 빨강').

   작화 클래스는 존·자리 번호다(for-<존>-zone-valve-<자리>, rev-<작화 존>-zone-valve-<자리>).
   위 줄은 그대로 왼→오지만, 아래 줄은 rotate(-180deg) 탓에 두 번 뒤집혀 있다 —
     · 작화의 rev-1이 화면 오른쪽 끝(7존 아래)이고 rev-7이 왼쪽 끝(1존 아래)이다.
     · 한 존 안에서도 자리 1이 오른쪽 끝이다(4개면 4, 3개면 3이 왼쪽 끝).
   그래서 rev-R-zone-valve-K는 화면 (8-R)존 아래 줄의 왼쪽에서 (개수+1-K)번째다.
   (불꽃 rev-fire-1이 53번인 것과 같은 사정이다 — 밸브 53번도 rev-1-zone-valve-1이다.)
   태그 번호는 번개와 같이 '존-버너' → tagNoOf로 정한다.
   ------------------------------------------------------------------------- */

/* 작화 클래스 → 태그 번호(1~53). 가스·공기 밸브가 같은 클래스를 나눠 쓴다(is-outer로 갈린다). */
export const VALVE_TAGS = Object.fromEntries([
  ...ZONE_TOP.flatMap((cnt, z) => range(cnt).map((k) => [`for-${z + 1}-zone-valve-${k}`, tagNoOf(z + 1, k)])),
  ...range(7).flatMap((r) => {
    const zone = 8 - r;
    const cnt = ZONE_BOTTOM[zone - 1];
    return range(cnt).map((k) => [
      `rev-${r}-zone-valve-${k}`,
      tagNoOf(zone, ZONE_TOP[zone - 1] + (cnt + 1 - k)),
    ]);
  }),
]);

/** 작화 클래스 → 태그 이름. kind는 'gas' | 'air'. 예: ('for-1-zone-valve-1', 'gas') → 'combustion_gas_valve1_lamp' */
export const valveTag = (cls, kind) => `combustion_${kind}_valve${VALVE_TAGS[cls]}_lamp`;

/** 그림 위에 뜨는 글 */
export const valveTitle = (cls, kind) =>
  `${i18n.t(`combustion:art.${kind}Valve`, { n: VALVE_TAGS[cls] })} (${burnerLabel(VALVE_TAGS[cls])}) / ${valveTag(cls, kind)} — ${i18n.t('combustion:rule.valve')}`;

/* 열렸을 때(1) 무대에 붙는 클래스. CombustionPage.css의 선택자와 짝이 맞아야 한다.
   거꾸로(닫힘에 클래스) 두지 않는 이유 — 기본이 빨강이어야 값을 못 받은 첫 화면도 빨강이다. */
export const valveOnClass = (cls, kind) => `${kind}-on-${cls}`;

/* ---------------------------------------------------------------------------
   존 배경 — 로 안쪽 면(zon-box-2)을 존별로 나눈 7칸(CombustionOverview의 ZONE_SEGS, .zon-seg-N).
   구동화면 MAIN 존 구획과 같은 태그·같은 규칙이다(main_zone1~7_lamp, 1이면 주황,
   0이거나 못 읽으면 작화 그대로). 2026-11-18 사용자 지정 — 버너 뒤 작은 판(*-zone-box)이 아니라
   존 전체 바탕이다. 태그는 구동화면 폴더(9)와 별개로 이 화면 폴더(7)에도 같은 이름·주소로 있어야 한다.
   ------------------------------------------------------------------------- */
export const ZONE_HOT_TAGS = Object.fromEntries(
  range(7).map((n) => [n, `main_zone${n}_lamp`]),
);

/** 판 위에 뜨는 글 — 이름은 구동화면 사전(drive:art.*)을 그대로 쓴다 */
export const zoneBoxTitle = (n) => {
  const tag = ZONE_HOT_TAGS[n];
  return `${i18n.t(`drive:art.${tag}`)} / ${tag} — ${i18n.t('combustion:rule.zone')}`;
};

/* 1일 때 무대에 붙는 클래스. CombustionPage.css의 선택자와 짝이 맞아야 한다. */
export const zoneHotClass = (n) => `hot-zone-${n}`;
