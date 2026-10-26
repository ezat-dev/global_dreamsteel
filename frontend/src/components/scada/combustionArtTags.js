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
     gas-pre     x 258 y  8  MAIN GAS 압력 조절밸브
     gas-sol     x 310 y  9  MAIN GAS 솔레노이드 밸브
     blower-pre  x 920 y  4  연소 BLOWER 압력계 + 밸브
     blower-pump x1001 y 26  연소 BLOWER 송풍기 */
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
   버너 번호 — 그림의 버너 53개를 화면 왼쪽부터 1~53으로 센다(위 줄 1~25, 아래 줄 26~53).
   번개·불꽃·밸브 태그가 모두 이 번호를 쓴다(combustion_fire26_lamp 등).

   PLC 목록은 '존-버너'로 적는다(No.1 Zone Burner 1-5). 존 안의 버너 번호는 위 줄 왼쪽부터
   1번이고 아래 줄 왼쪽부터 이어진다 — 개별연소 창(ZoneBurnerModal)과 같은 규칙이다.
   그래서 1존은 위 1~4 → 1-1~1-4, 아래 26~29 → 1-5~1-8이다.
   ------------------------------------------------------------------------- */

/* 존별 위 줄 버너 수. 아래 줄은 존마다 4개다. */
const ZONE_TOP = [4, 4, 4, 3, 3, 3, 4];
const TOP_TOTAL = ZONE_TOP.reduce((a, b) => a + b, 0);   // 25
const BOTTOM_EACH = 4;

/** 화면 번호 → { zone, no }. 예: 1 → 1존 1번, 26 → 1존 5번, 53 → 7존 8번 */
export const burnerOf = (n) => {
  if (n <= TOP_TOTAL) {
    let left = n;
    for (let z = 0; z < ZONE_TOP.length; z++) {
      if (left <= ZONE_TOP[z]) return { zone: z + 1, no: left };
      left -= ZONE_TOP[z];
    }
  }
  const i = n - TOP_TOTAL - 1;                 // 아래 줄 0부터
  const zone = Math.floor(i / BOTTOM_EACH) + 1;
  return { zone, no: ZONE_TOP[zone - 1] + (i % BOTTOM_EACH) + 1 };
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

   번호는 위 버너 번호(화면 왼쪽부터 1~53)다. 위쪽 줄(for-thun-1~25)은 작화 번호가
   이미 왼→오 순서라 그대로 쓰지만, 아래쪽 줄(rev-thun-1~28)은 rotate(-180deg) 탓에
   작화 번호가 오→왼이라 거꾸로 짝지었다 — thunder26이 rev-thun-28(화면 맨 왼쪽),
   thunder53이 rev-thun-1(화면 맨 오른쪽)이다.

   주소는 DB(sql/combustion_real_tags.sql)에 있다. 바뀌면 address만 UPDATE 하면 되고
   이 파일은 손대지 않는다.
   ------------------------------------------------------------------------- */

/* 작화 클래스 → 태그 번호. 위 25개 + 아래 28개. */
export const THUNDER_TAGS = {
  'for-thun-1': 1, 'for-thun-2': 2, 'for-thun-3': 3, 'for-thun-4': 4,
  'for-thun-5': 5, 'for-thun-6': 6, 'for-thun-7': 7, 'for-thun-8': 8,
  'for-thun-9': 9, 'for-thun-10': 10, 'for-thun-11': 11, 'for-thun-12': 12,
  'for-thun-13': 13, 'for-thun-14': 14, 'for-thun-15': 15, 'for-thun-16': 16,
  'for-thun-17': 17, 'for-thun-18': 18, 'for-thun-19': 19, 'for-thun-20': 20,
  'for-thun-21': 21, 'for-thun-22': 22, 'for-thun-23': 23, 'for-thun-24': 24,
  'for-thun-25': 25,
  'rev-thun-28': 26, 'rev-thun-27': 27, 'rev-thun-26': 28, 'rev-thun-25': 29,
  'rev-thun-24': 30, 'rev-thun-23': 31, 'rev-thun-22': 32, 'rev-thun-21': 33,
  'rev-thun-20': 34, 'rev-thun-19': 35, 'rev-thun-18': 36, 'rev-thun-17': 37,
  'rev-thun-16': 38, 'rev-thun-15': 39, 'rev-thun-14': 40, 'rev-thun-13': 41,
  'rev-thun-12': 42, 'rev-thun-11': 43, 'rev-thun-10': 44, 'rev-thun-9': 45,
  'rev-thun-8': 46, 'rev-thun-7': 47, 'rev-thun-6': 48, 'rev-thun-5': 49,
  'rev-thun-4': 50, 'rev-thun-3': 51, 'rev-thun-2': 52, 'rev-thun-1': 53,
};

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

/* 작화 클래스 → 태그 번호. 예: 'for-fire-1' → 1, 'rev-fire-28' → 26 */
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
     · 한 존 안에서도 자리 1이 오른쪽, 4가 왼쪽이다.
   그래서 rev-R-zone-valve-K는 화면 (8-R)존 아래 줄의 왼쪽에서 (5-K)번째다.
   (불꽃 rev-fire-1이 53번인 것과 같은 사정이다 — 밸브 53번도 rev-1-zone-valve-1이다.)
   ------------------------------------------------------------------------- */

const TOP_START = ZONE_TOP.map((_, z) => 1 + ZONE_TOP.slice(0, z).reduce((a, b) => a + b, 0));
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

/* 작화 클래스 → 버너 번호(1~53). 가스·공기 밸브가 같은 클래스를 나눠 쓴다(is-outer로 갈린다). */
export const VALVE_TAGS = Object.fromEntries([
  ...ZONE_TOP.flatMap((cnt, z) => range(cnt).map((k) => [`for-${z + 1}-zone-valve-${k}`, TOP_START[z] + k - 1])),
  ...range(7).flatMap((r) => range(BOTTOM_EACH).map((k) => [
    `rev-${r}-zone-valve-${k}`,
    TOP_TOTAL + 1 + (7 - r) * BOTTOM_EACH + (BOTTOM_EACH - k),
  ])),
]);

/** 작화 클래스 → 태그 이름. kind는 'gas' | 'air'. 예: ('for-1-zone-valve-1', 'gas') → 'combustion_gas_valve1_lamp' */
export const valveTag = (cls, kind) => `combustion_${kind}_valve${VALVE_TAGS[cls]}_lamp`;

/** 그림 위에 뜨는 글 */
export const valveTitle = (cls, kind) =>
  `${i18n.t(`combustion:art.${kind}Valve`, { n: VALVE_TAGS[cls] })} (${burnerLabel(VALVE_TAGS[cls])}) / ${valveTag(cls, kind)} — ${i18n.t('combustion:rule.valve')}`;

/* 열렸을 때(1) 무대에 붙는 클래스. CombustionPage.css의 선택자와 짝이 맞아야 한다.
   거꾸로(닫힘에 클래스) 두지 않는 이유 — 기본이 빨강이어야 값을 못 받은 첫 화면도 빨강이다. */
export const valveOnClass = (cls, kind) => `${kind}-on-${cls}`;
