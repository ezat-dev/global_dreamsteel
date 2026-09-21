/* ===========================================================================
   분위기제어 작화(AtmosphereOverview) 위 배관 부속이 보는 태그.

   구동화면의 driveArtTags.js, 연소화면의 combustionArtTags.js와 같은 이유로 따로 둔다 —
   그림(툴팁)과 화면(색)이 같은 태그 이름을 봐야 하는데, AtmospherePage가
   AtmosphereOverview를 import 하므로 반대 방향으로는 가져올 수 없다.

   값 규칙: 1이면 초록, 0이거나 못 읽으면 회색.
   연소화면 부속(0이면 빨강)과 다르다 — 화면마다 사용자가 정한 대로다.

   이름의 add_ 는 폴더 10의 기존 태그(add_gas_open_cmd, add_air_open_cmd)와 맞춘 것이다.
   화면에 적힌 글자는 'ADDTION'이지만 태그 쪽은 add_로 통일한다.

   주소는 아직 임시(M300)다. 실주소를 알게 되면 DB의 address만 UPDATE 하면 되고
   이 파일은 손대지 않아도 된다 — 이름으로 읽기 때문이다.
   =========================================================================== */

const RULE = '값이 1이면 초록 / 0이거나 못 읽으면 회색';

/* 키는 작화 클래스 이름 그대로다 — 클래스(on-<키> / off-<키>)와 짝이 눈으로 맞춰진다.
   다섯 개 모두 왼쪽 위 배관에 있다.
     motor-1    x 202 y  43  ADDTION BLOWE 블로워
     blowe-pre  x 328 y   0  공기 압력 조절밸브
     blowe-sol  x 454 y  14  공기 솔레노이드 밸브
     gas-pre    x 232 y 172  가스 압력 조절밸브
     gas-sol    x 368 y 183  가스 솔레노이드 밸브 */
export const FITTING_TAGS = {
  'motor-1': { tag: 'add_blowe_motor_lamp', label: 'ADDTION BLOWE 블로워' },
  'blowe-pre': { tag: 'add_blowe_valve_lamp', label: 'ADDTION BLOWE 압력 조절밸브' },
  'blowe-sol': { tag: 'add_blowe_sol_valve_lamp', label: 'ADDTION BLOWE 솔레노이드 밸브' },
  'gas-pre': { tag: 'add_gas_valve_lamp', label: 'ADDTION GAS 압력 조절밸브' },
  'gas-sol': { tag: 'add_gas_sol_valve_lamp', label: 'ADDTION GAS 솔레노이드 밸브' },
};

/* 그림 위에 마우스를 올렸을 때 뜨는 글. 화면의 다른 title들과 같은 꼴이다. */
export const fittingTitle = (cls) => {
  const t = FITTING_TAGS[cls];
  return `${t.label} / ${t.tag} — ${RULE}`;
};

/* 발생기 위 경광등(작화 alarm-1, x 1565~1605 / y 36~80).
   위 다섯과 규칙이 반대다 — 0이 정상(초록)이고 1이 이상(빨강)이다.
   그림이 원래 빨간 경광등이라 1일 때는 아무것도 걸지 않는다. */
export const BEACON = { cls: 'alarm-1', tag: 'generator_lamp', label: '발생기 경광등' };

export const beaconTitle = () =>
  `${BEACON.label} / ${BEACON.tag} — 값이 0이면 초록 / 1이면 빨강 / 못 읽으면 회색`;

/* 무대에 붙는 클래스. AtmospherePage.css의 선택자와 짝이 맞아야 한다.
   초록·회색 둘 다 클래스를 붙인다 — 둘 다 filter를 걸어야 해서, 한쪽만 붙이고
   나머지를 '규칙 없음'으로 두면 0일 때 가스 밸브의 주황이 그대로 남는다. */
export const fittingOnClass = (cls) => `on-${cls}`;
export const fittingOffClass = (cls) => `off-${cls}`;
