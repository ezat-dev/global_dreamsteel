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
   =========================================================================== */

const RULE = '값이 1이면 제 색 / 0이거나 못 읽으면 빨강';

/* 키는 작화 클래스 이름 그대로다 — 빨강 클래스(red-<키>)와 짝이 눈으로 맞춰진다.
   넷 다 작화 위쪽 배관에 있고, 앞 둘이 MAIN GAS 쪽, 뒤 둘이 연소 BLOWER 쪽이다.
     gas-pre     x 258 y  8  MAIN GAS 압력 조절밸브
     gas-sol     x 310 y  9  MAIN GAS 솔레노이드 밸브
     blower-pre  x 920 y  4  연소 BLOWER 압력계 + 밸브
     blower-pump x1001 y 26  연소 BLOWER 송풍기 */
export const FITTING_TAGS = {
  'gas-pre': { tag: 'main_gas_valve_lamp', label: 'MAIN GAS 압력 조절밸브' },
  'gas-sol': { tag: 'main_gas_sol_valve_lamp', label: 'MAIN GAS 솔레노이드 밸브' },
  'blower-pre': { tag: 'combustion_blower_valve_lamp', label: '연소 BLOWER 밸브' },
  'blower-pump': { tag: 'combustion_blower_motor_lamp', label: '연소 BLOWER 송풍기' },
};

/* 그림 위에 마우스를 올렸을 때 뜨는 글. 화면의 다른 title들과 같은 꼴이다. */
export const fittingTitle = (cls) => {
  const t = FITTING_TAGS[cls];
  return `${t.label} / ${t.tag} — ${RULE}`;
};

/* 빨강으로 만들 때 무대에 붙는 클래스. CombustionPage.css의 선택자와 짝이 맞아야 한다. */
export const fittingRedClass = (cls) => `red-${cls}`;

/* ---------------------------------------------------------------------------
   불꽃 뒤의 번개(점화 표시) 53개.

   위 부속들과 값 규칙이 다르다 — 이쪽은 1이면 보이고 0이거나 못 읽으면 숨긴다.
   빨강으로 두지 않는 이유는 번개가 '있다/없다'를 알리는 표시라서다. 꺼진 것을
   빨갛게 두면 점화 이상으로 읽힌다.

   번호는 화면 왼쪽부터 오른쪽으로 1~53이다. 위쪽 줄(for-thun-1~25)은 작화 번호가
   이미 왼→오 순서라 그대로 쓰지만, 아래쪽 줄(rev-thun-1~28)은 rotate(-180deg) 탓에
   작화 번호가 오→왼이라 거꾸로 짝지었다 — thunder26이 rev-thun-28(화면 맨 왼쪽),
   thunder53이 rev-thun-1(화면 맨 오른쪽)이다.

   주소는 53개가 전부 M300으로 같다(임시). 그래서 지금은 다 같이 켜지고 꺼진다.
   실주소가 나오면 DB의 address만 UPDATE 하면 되고 이 파일은 손대지 않는다.
   ------------------------------------------------------------------------- */
const THUNDER_RULE = '값이 1일 때만 보임 / 0이거나 못 읽으면 숨김';

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
  `번개 ${THUNDER_TAGS[cls]} / ${thunderTag(cls)} — ${THUNDER_RULE}`;

/* 숨길 때 무대에 붙는 클래스. combustionOverview.css의 선택자와 짝이 맞아야 한다. */
export const thunderHideClass = (cls) => `hide-${cls}`;
