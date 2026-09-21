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
