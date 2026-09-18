/* ===========================================================================
   구동화면 작화(DriveOverview) 위 요소가 보는 태그 — 이름·툴팁을 여기 한 곳에 모은다.

   왜 따로 빼는가:
     - 그림(DriveOverview)은 툴팁을 달기 위해, 화면(DrivePage)은 값을 읽어 색·표시를
       정하기 위해 같은 태그 이름을 쓴다. 두 파일에 따로 적어 두면 실주소를 알게 돼서
       이름을 바꿀 때 한쪽만 고치고는 "왜 색이 안 바뀌지" 하고 찾게 된다.
     - DrivePage가 DriveOverview를 import 하므로 반대 방향으로는 가져올 수 없다.
       중립인 파일이 하나 있어야 양쪽이 같은 것을 본다.

   툴팁을 다는 이유: 화면의 램프·입력 칸은 전부 태그 이름을 title로 달고 있다.
   값이 이상할 때 화면만 보고 어느 태그를 확인해야 하는지 알 수 있어야 하기 때문이다.
   작화 위 요소도 태그를 매핑하면 같이 단다.

   주소가 아직 임시(M00x·M300)인 것들이 있다. 실주소를 알게 되면 DB의 address만
   UPDATE 하면 되고 이 파일은 손대지 않아도 된다 — 이름으로 읽기 때문이다.
   =========================================================================== */

/* 값 판정 규칙은 작화 위 요소가 전부 같다: 1이면 살아 있는 표시, 0이거나 못 읽으면 죽은
   표시. 통신이 끊겼는데 도는 것처럼 보이면 설비가 도는 줄로 읽히므로 그쪽이 안전하다. */
const RULE = '값이 1일 때만 표시 / 0이거나 못 읽으면 꺼짐';

/* 입구 모터 넷. 자리와 태그를 짝지은 근거는 작화 좌표다.
     1 x 0    왼쪽 끝(가로 기어드)
     2 x 170  그 오른쪽(통 모터)
     3 x 497  DOOR(x 494~) 바로 위 — DrivePage NOTES의 '입구문 열림'이 붙는 자리
     4 x 332  NOTES의 'STOPPER 하강 감지'가 오른쪽 옆에 붙는 자리 */
export const ENT_MOTOR_TAGS = {
  1: { tag: 'charge_motor1_lamp', label: '입구 모터 1' },
  2: { tag: 'charge_motor2_lamp', label: '입구 모터 2' },
  3: { tag: 'charge_door_open_lamp', label: '입구문 열림' },
  4: { tag: 'charge_stopper_down_detect_lamp', label: 'STOPPER 하강 감지' },
};

/* 컨베이어 롤러. 한 구역의 롤러는 한 축으로 같이 도니까 태그도 구역당 하나다
   (입구 ent-conv-1~12 / 출구 exit-conv-1~6).
   입구 줄 맨 끝의 매쉬 롤러는 빠진다 — 제품 감지 자리라 원래 돌지 않는다. */
export const ROLLER_TAGS = {
  ent: { tag: 'charge_side_conveyor_roller', label: '입구 SIDE CONVEYOR 롤러' },
  exit: { tag: 'discharge_side_conveyor_roller', label: '출구 SIDE CONVEYOR 롤러' },
};

/* SIDE CONVEYOR 오르내림 화살표. 한 구역의 같은 방향 넷이 한 태그를 본다.
   hideClass는 DrivePage가 무대에 붙이고 DrivePage.css가 실제로 숨긴다.
   주소는 아직 넷 다 M001이라 같이 나타났다 사라진다. */
export const ARROW_TAGS = [
  { key: 'entUp', tag: 'charge_side_conveyor_arrow_up', label: '입구 SIDE CONVEYOR 상승', hideClass: 'hide-ent-up' },
  { key: 'entDown', tag: 'charge_side_conveyor_arrow_down', label: '입구 SIDE CONVEYOR 하강', hideClass: 'hide-ent-down' },
  { key: 'exitUp', tag: 'discharge_side_conveyor_arrow_up', label: '출구 SIDE CONVEYOR 상승', hideClass: 'hide-exit-up' },
  { key: 'exitDown', tag: 'discharge_side_conveyor_arrow_down', label: '출구 SIDE CONVEYOR 하강', hideClass: 'hide-exit-down' },
];

/* 그림 위에 마우스를 올렸을 때 뜨는 글. 어느 태그인지와 값 규칙을 같이 보여준다.
   화면의 다른 title들과 같은 꼴("태그 — 설명")로 맞췄다. */
export const artTitle = ({ tag, label }) => `${label} / ${tag} — ${RULE}`;

/* 화살표는 방향별로 4자리씩 같은 태그를 본다 — key로 찾아 쓴다. */
export const arrowTitle = (key) => artTitle(ARROW_TAGS.find((a) => a.key === key));
