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

/* 모터 11개 전부. 키는 작화 클래스 이름 그대로다 — 그림과 회색 클래스(gray-<키>)가
   같은 이름을 쓰게 되어 어느 자리인지 헷갈릴 일이 없다.

   자리와 태그를 짝지은 근거는 작화 좌표다(overview 기준, 왼쪽 위가 0,0).
   회전감지 셋은 전부 아래줄(y≈360)의 같은 모터 그림이라 짝이 갈린다.
     ent-motor-1   x   0 y 124  입구 왼쪽 끝(가로 기어드)
     ent-motor-2   x 170 y 175  그 오른쪽(통 모터)
     ent-motor-3   x 497 y 160  DOOR(x 494~) 바로 위 — NOTES의 '입구문 열림'이 붙는 자리
     ent-motor-4   x 332 y 360  NOTES의 'STOPPER 하강 감지'가 오른쪽 옆에 붙는 자리
     main-motor-1  x 633 y 365  MAIN 존(x 609~1136) 아래
     main-motor-2  x1162 y 365  MAIN 존 오른쪽 밖 = CC 쪽 아래
     exit-motor-1  x1347 y   0  출구 위쪽 둘 중 위
     exit-motor-2  x1347 y  49  출구 위쪽 둘 중 아래(x가 1번과 같아 위아래로 갈린다)
     exit-motor-3  x1553 y 174  통 모터
     exit-motor-4  x1723 y 172  출구 오른쪽 끝
     exit-motor-5  x1403 y 360  출구 아래줄 */
export const MOTOR_TAGS = {
  'ent-motor-1': { tag: 'charge_motor1_lamp', label: '입구 모터 1' },
  'ent-motor-2': { tag: 'charge_motor2_lamp', label: '입구 모터 2' },
  'ent-motor-3': { tag: 'charge_door_open_lamp', label: '입구문 열림' },
  'ent-motor-4': { tag: 'charge_stopper_down_detect_lamp', label: 'STOPPER 하강 감지' },
  'main-motor-1': { tag: 'main_table_drive_conveyor_rotate_detect_lamp', label: 'MAIN TABLE DRIVE 컨베이어 회전감지' },
  'main-motor-2': { tag: 'cc_table_drive_conveyor_rotate_detect_lamp', label: 'CC TABLE DRIVE 컨베이어 회전감지' },
  'exit-motor-1': { tag: 'discharge_motor1_lamp', label: '출구 모터 1' },
  'exit-motor-2': { tag: 'discharge_motor2_lamp', label: '출구 모터 2' },
  'exit-motor-3': { tag: 'discharge_motor3_lamp', label: '출구 모터 3' },
  'exit-motor-4': { tag: 'discharge_motor4_lamp', label: '출구 모터 4' },
  'exit-motor-5': { tag: 'discharge_table_drive_conveyor_rotate_detect_lamp', label: '출구 TABLE DRIVE 컨베이어 회전감지' },
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

/* 모터는 작화 클래스 이름으로 찾는다. 값이 0이라 회색이어도 툴팁은 떠야 한다 —
   값이 안 들어올 때야말로 어느 태그를 봐야 하는지 알아야 하기 때문이다. */
export const motorTitle = (cls) => artTitle(MOTOR_TAGS[cls]);

/* 회색으로 만들 때 무대에 붙는 클래스. DrivePage.css의 선택자와 짝이 맞아야 한다. */
export const motorGrayClass = (cls) => `gray-${cls}`;
