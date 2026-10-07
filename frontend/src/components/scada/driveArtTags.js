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

   툴팁에 찍히는 설비 이름(입구 모터 1 등)과 값 규칙 문구는 사전(i18n/{ko,en}/drive.json)에
   있다 — 이름은 art.<태그>, 규칙은 rule.*. 태그를 새로 붙이면 사전 두 곳에도 이름을 넣는다
   (빠뜨리면 툴팁에 키 이름이 찍힌다. npm run i18n:check가 짝을 확인해 준다).
   =========================================================================== */

import i18n from '../../i18n';

/** 사전에서 이 태그의 이름 — 툴팁이 만들어지는 순간의 언어로 */
const nameOf = (tag) => i18n.t(`drive:art.${tag}`);

/* 값 판정 규칙은 작화 위 요소가 전부 같다: 1이면 살아 있는 표시, 0이거나 못 읽으면 죽은
   표시. 통신이 끊겼는데 도는 것처럼 보이면 설비가 도는 줄로 읽히므로 그쪽이 안전하다.
   (문구는 drive:rule.onOff) */

/* 모터 11개 전부. 키는 작화 클래스 이름 그대로다 — 그림과 회색 클래스(gray-<키>)가
   같은 이름을 쓰게 되어 어느 자리인지 헷갈릴 일이 없다.

   자리와 태그를 짝지은 근거는 작화 좌표다(overview 기준, 왼쪽 위가 0,0).
   회전감지 셋은 전부 아래줄(y≈360)의 같은 모터 그림이라 짝이 갈린다.
     ent-motor-1   x   0 y 124  입구 왼쪽 끝(가로 기어드)
     ent-motor-2   x 170 y 175  그 오른쪽(통 모터)
     (ent-motor-3  x 497 y 160  DOOR 바로 위에 있었는데 현장에 없는 설비라 지웠다.
                                위에 붙던 NOTES의 '입구문 열림'도 같이 뺐다)
     ent-motor-4   x 332 y 360  NOTES의 'STOPPER 하강 감지'가 오른쪽 옆에 붙는 자리
     main-motor-1  x 633 y 365  MAIN 존(x 609~1136) 아래
     main-motor-2  x1162 y 365  MAIN 존 오른쪽 밖 = CC 쪽 아래
     exit-motor-1  x1347 y   0  출구 위쪽 둘 중 위
     exit-motor-2  x1347 y  49  출구 위쪽 둘 중 아래(x가 1번과 같아 위아래로 갈린다)
     exit-motor-3  x1553 y 174  통 모터
     exit-motor-4  x1723 y 172  출구 오른쪽 끝
     exit-motor-5  x1403 y 360  출구 아래줄 */
export const MOTOR_TAGS = {
  'ent-motor-1': { tag: 'charge_motor1_lamp' },                              // 입구 모터 1
  'ent-motor-2': { tag: 'charge_motor2_lamp' },                              // 입구 모터 2
  'ent-motor-4': { tag: 'charge_stopper_down_detect_lamp' },                 // STOPPER 하강 감지
  'main-motor-1': { tag: 'main_table_drive_conveyor_rotate_detect_lamp' },   // MAIN TABLE DRIVE 컨베이어 회전감지
  'main-motor-2': { tag: 'cc_table_drive_conveyor_rotate_detect_lamp' },     // CC TABLE DRIVE 컨베이어 회전감지
  'exit-motor-1': { tag: 'discharge_motor1_lamp' },                          // 출구 모터 1
  'exit-motor-2': { tag: 'discharge_motor2_lamp' },                          // 출구 모터 2
  'exit-motor-3': { tag: 'discharge_motor3_lamp' },                          // 출구 모터 3
  'exit-motor-4': { tag: 'discharge_motor4_lamp' },                          // 출구 모터 4
  'exit-motor-5': { tag: 'discharge_table_drive_conveyor_rotate_detect_lamp' }, // 출구 TABLE DRIVE 컨베이어 회전감지
};

/* 컨베이어 롤러. 한 구역의 롤러는 한 축으로 같이 도니까 태그도 구역당 하나다
   (입구 ent-conv-1~12 / 출구 exit-conv-1~6).
   입구 줄 맨 끝의 매쉬 롤러는 빠진다 — 제품 감지 자리라 원래 돌지 않는다. */
export const ROLLER_TAGS = {
  ent: { tag: 'charge_side_conveyor_roller' },      // 입구 SIDE CONVEYOR 롤러
  exit: { tag: 'discharge_side_conveyor_roller' },  // 출구 SIDE CONVEYOR 롤러
};

/* 로 순환 팬 둘. 값이 1이면 돌고 0이거나 못 읽으면 선다.
   키는 DrivePage의 FANS와 같다.
     cc1 x1161   쿨링챔버 판(main-obj-2) 왼쪽
     cc2 x1266   쿨링챔버 판 오른쪽

   DOOR 오른쪽 판에도 하나 있었는데(door, fan1_lamp) 그 자리에 팬이 없다고 확인받아
   화면과 함께 뺐다. 이름은 fan2·fan3 그대로 둔다 — DB 태그 이름이라 여기서 바꿀 것이
   아니고, 되살릴 일이 생기면 fan1_lamp를 다시 넣으면 된다. */
export const FAN_TAGS = {
  cc1: { tag: 'fan2_lamp' },   // 로 순환 팬 2 (쿨링챔버 왼쪽)
  cc2: { tag: 'fan3_lamp' },   // 로 순환 팬 3 (쿨링챔버 오른쪽)
};

/* SIDE CONVEYOR 오르내림 화살표. 한 구역의 같은 방향 넷이 한 태그를 본다.
   hideClass는 DrivePage가 무대에 붙이고 DrivePage.css가 실제로 숨긴다.
   주소는 아직 넷 다 M001이라 같이 나타났다 사라진다. */
export const ARROW_TAGS = [
  { key: 'entUp', tag: 'charge_side_conveyor_arrow_up', hideClass: 'hide-ent-up' },          // 입구 상승
  { key: 'entDown', tag: 'charge_side_conveyor_arrow_down', hideClass: 'hide-ent-down' },    // 입구 하강
  { key: 'exitUp', tag: 'discharge_side_conveyor_arrow_up', hideClass: 'hide-exit-up' },     // 출구 상승
  { key: 'exitDown', tag: 'discharge_side_conveyor_arrow_down', hideClass: 'hide-exit-down' }, // 출구 하강
];

/* 그림 위에 마우스를 올렸을 때 뜨는 글. 어느 태그인지와 값 규칙을 같이 보여준다.
   화면의 다른 title들과 같은 꼴("태그 — 설명")로 맞췄다. */
export const artTitle = ({ tag }) => `${nameOf(tag)} / ${tag} — ${i18n.t('drive:rule.onOff')}`;

/* 화살표는 방향별로 4자리씩 같은 태그를 본다 — key로 찾아 쓴다. */
export const arrowTitle = (key) => artTitle(ARROW_TAGS.find((a) => a.key === key));

/* 모터는 작화 클래스 이름으로 찾는다. 값이 0이라 회색이어도 툴팁은 떠야 한다 —
   값이 안 들어올 때야말로 어느 태그를 봐야 하는지 알아야 하기 때문이다. */
export const motorTitle = (cls) => artTitle(MOTOR_TAGS[cls]);

/* 회색으로 만들 때 무대에 붙는 클래스. DrivePage.css의 선택자와 짝이 맞아야 한다. */
export const motorGrayClass = (cls) => `gray-${cls}`;

/* ---------------------------------------------------------------------------
   입구문과 MAIN 존 구획 8개. 위 요소들과 값 규칙이 다르고, 둘끼리도 다르다.

   입구문은 세 갈래다 — 0이면 빨강, 1이면 초록, 못 읽으면 회색. 빨강·초록이 각각
   닫힘·열림이라 '모름'을 둘 중 하나로 뭉개면 문 상태를 잘못 읽게 된다.
   존 구획은 두 갈래다 — 1이면 오렌지, 0이거나 못 읽으면 작화 그대로. 이쪽은 꺼진
   모습이 곧 원래 색이라 '모름'을 위한 색을 따로 둘 자리가 마땅치 않다.
   ------------------------------------------------------------------------- */

/* 입구문 — 0이면 빨강, 1이면 초록, 못 읽으면 회색.
   예전에는 바로 위 모터(ent-motor-3)가 charge_door_open_lamp를 따로 보고 있어서 같은
   문을 두 태그가 보는 꼴이었는데, 그 모터를 지우면서 이 하나만 남았다. */
export const DOOR_TAG = {
  cls: 'ent-door-1',
  tag: 'ent_door_open_close_lamp',   // 입구문
};
export const doorTitle = () => `${nameOf(DOOR_TAG.tag)} / ${DOOR_TAG.tag} — ${i18n.t('drive:rule.door')}`;

/* MAIN 존 구획 7칸 — 0이거나 못 읽으면 작화 그대로, 1이면 오렌지.
   키는 작화 클래스 이름 그대로다(main-1-zone ~ main-7-zone). 왼쪽부터 1~7존이고,
   x는 609부터 75px 칸이 나란히 붙는다. */
export const ZONE_TAGS = {
  'main-1-zone': { tag: 'main_zone1_lamp' },
  'main-2-zone': { tag: 'main_zone2_lamp' },
  'main-3-zone': { tag: 'main_zone3_lamp' },
  'main-4-zone': { tag: 'main_zone4_lamp' },
  'main-5-zone': { tag: 'main_zone5_lamp' },
  'main-6-zone': { tag: 'main_zone6_lamp' },
  'main-7-zone': { tag: 'main_zone7_lamp' },
};
export const zoneTitle = (cls) => {
  const { tag } = ZONE_TAGS[cls];
  return `${nameOf(tag)} / ${tag} — ${i18n.t('drive:rule.zone')}`;
};

/* SIDE CONVEYOR 레일. 한 줄에 막대(mini-rail) 39개씩 6줄이 한 구역을 이루고,
   구역 전체가 한 축으로 움직이니 태그도 구역당 하나다(롤러와 같은 사정).
   값이 1이면 구르고 0이거나 못 읽으면 선다 — 통신이 끊겼는데 계속 흐르면
   설비가 도는 줄로 읽히므로 세우는 쪽이 안전하다.

   주소가 아직 롤러(charge_side_conveyor_roller)와 같은 M300이라 지금은 롤러와
   레일이 같이 돌고 같이 선다. 실제로도 같은 축이면 나중에 태그를 하나로 합칠 수 있다. */
export const RAIL_TAGS = {
  ent: { tag: 'charge_side_conveyor_rail' },      // 입구 SIDE CONVEYOR 레일
  exit: { tag: 'discharge_side_conveyor_rail' },  // 출구 SIDE CONVEYOR 레일
};

/* 구를 때 무대에 붙는 클래스. 붙지 않은 상태가 '멈춤'이다 —
   화면에 늘 보이는 것이라 서 있는 쪽을 기본으로 둔다. */
export const railRollClass = (key) => `roll-${key}-rail`;

/* 레일 툴팁. 막대(mini-rail) 하나하나에 같은 값을 단다 — 묶음(.ent-rail-N)은
   position: static이라 자식 막대와 영역이 달라서, 거기 달면 엉뚱한 자리에서 뜬다.
   롤러(ent-conv-*)도 같은 이유로 12개에 같은 값을 달고 있다. */
export const railTitle = (key) => {
  const { tag } = RAIL_TAGS[key];
  return `${nameOf(tag)} / ${tag} — ${i18n.t('drive:rule.rail')}`;
};

/* 무대에 붙는 클래스. DrivePage.css의 선택자와 짝이 맞아야 한다.
   입구문은 1이면 초록, 못 읽으면 회색이 붙고 0이면 아무것도 안 붙는다 —
   붙지 않은 상태가 빨강이라 CSS 기본 규칙에 그 색이 적혀 있다.
   존은 오렌지일 때만 붙고, 안 붙은 상태가 작화 그대로다. */
export const doorGreenClass = () => 'green-ent-door';
export const doorGrayClass = () => 'gray-ent-door';
export const zoneHotClass = (cls) => `hot-${cls}`;
