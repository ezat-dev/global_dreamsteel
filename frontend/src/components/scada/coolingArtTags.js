/* ===========================================================================
   쿨링타워 작화(CoolingOverview) 위 기기가 보는 태그.

   구동·연소·분위기제어의 *ArtTags.js와 같은 이유로 따로 둔다 — 그림(툴팁)과 화면(색)이
   같은 태그 이름을 봐야 하는데, CoolingPage가 CoolingOverview를 import 하므로 반대
   방향으로는 가져올 수 없다.

   주소는 아직 임시(M300)다. 실주소를 알게 되면 DB의 address만 UPDATE 하면 되고
   이 파일은 손대지 않아도 된다 — 이름으로 읽기 때문이다.
   =========================================================================== */

/* 쿨링타워 맨 위의 모터(작화 motor-1, x 222~293 / y 0~74).
   값이 1이면 초록, 0이면 작화 그대로, 못 읽으면 회색이다 — 위 화면들과 달리 0이
   '그대로'인 쪽이라, 안 도는 상태가 원본 색으로 남는다.

   태그 이름은 tank인데 붙는 자리는 모터다(사용자가 정한 이름). 자리를 찾을 때는
   이름 말고 여기 적힌 작화 클래스를 보면 된다. */
export const TOWER_MOTOR = {
  cls: 'motor-1',
  tag: 'cooling_tower_tank_lamp',
  label: '쿨링타워 상부 모터',
};

export const towerMotorTitle = () =>
  `${TOWER_MOTOR.label} / ${TOWER_MOTOR.tag} — 값이 1이면 초록 / 0이면 그대로 / 못 읽으면 회색`;

/* 냉각수 흐름 화살표 아홉. 값이 1이면 깜빡이고 아니면 가만히 있는다 — 색은 안 바뀐다.
   깜빡임은 <img> 요소 자체에 거는 CSS 애니메이션이라 무대에 클래스만 붙이면 된다
   (SVG 안의 애니메이션을 쓰는 롤러·팬·컨트롤밸브와 다르다).

   태그 이름이 작화 클래스 이름 그대로다(사용자가 정한 이름) — 이 화면의 다른 태그와
   달리 snake_case도 _lamp도 아니다. 어느 배관인지는 아래 좌표로 찾는다.

   아래로 내려가는 화살표 셋(arrow-3~5, 타워에서 수조로 떨어지는 물)은 빠졌다. */
export const ARROW_TAGS = [
  { cls: 'arrow-1', tag: 'arrow-1', label: '화살표 1 (타워 위 입구)' },
  { cls: 'arrow-2', tag: 'arrow-2', label: '화살표 2 (왼쪽 상승관)' },
  { cls: 'arrow-6', tag: 'arrow-6', label: '화살표 6 (작은 수조 출구)' },
  { cls: 'arrow-7', tag: 'arrow-7', label: '화살표 7 (큰 수조 출구)' },
  { cls: 'arrow-8', tag: 'arrow-8', label: '화살표 8 (가운데 상승관)' },
  { cls: 'arrow-9', tag: 'arrow-9', label: '화살표 9 (COOLING CHAMBER 위)' },
  { cls: 'arrow-10', tag: 'arrow-10', label: '화살표 10 (RX-발생기 위)' },
  { cls: 'arrow-11', tag: 'arrow-11', label: '화살표 11 (COOLING CHAMBER 아래)' },
  { cls: 'arrow-12', tag: 'arrow-12', label: '화살표 12 (RX-발생기 아래)' },
];

export const arrowTitle = (cls) => {
  const a = ARROW_TAGS.find((x) => x.cls === cls);
  return `${a.label} / ${a.tag} — 값이 1이면 깜빡임`;
};

/* 깜빡일 때 무대에 붙는 클래스. CoolingPage.css의 선택자와 짝이 맞아야 한다. */
export const arrowBlinkClass = (cls) => `blink-${cls}`;
