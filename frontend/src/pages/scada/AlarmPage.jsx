import { useState } from 'react';
import './AlarmPage.css';

/* ===========================================================================
   알람 화면 — 발생 가능한 알람을 격자로 늘어놓고, 발생한 것만 빨갛게 켠다.
   지금은 배치만 해둔 상태라 전부 꺼짐이다. PLC 연동 때 발생 중인 알람의 key를
   activeKeys에 넣으면 그 칸만 켜진다.

   열 구성(사진과 동일): 1~7ZONE | 입구 계열 | 출구 계열 | 공통
   =========================================================================== */

const ROW_COUNT = 10;

// ZONE 열은 7개가 완전히 같은 구성이라 zone 번호만 바꿔 찍어낸다.
function zoneColumn(n) {
  return [
    ...[1, 2, 3, 4].map((i) => ({ key: `z${n}_ign${i}`, label: `${n}-${i}ZONE\n점화실패` })),
    { key: `z${n}_overheat`, label: `${n}ZONE 온도과열` },
    { key: `z${n}_lowtemp`, label: `${n}ZONE 온도저온` },
    ...[1, 2, 3, 4].map((i) => ({ key: `z${n}_bnr${i}`, label: `${n}-${i}ZONE\nBURNER이상` })),
  ];
}

const INLET_COLUMN = [
  { key: 'in_emg', label: '입구 비상정지' },
  { key: 'in_hydTrip', label: '입구 유압\nUNIT TRIP' },
  { key: 'in_sideConv', label: '입구 SIDE\nCONVEYOR\nTRIP' },
  { key: 'in_doorMotor', label: '입구 DOOR\nMOTOR TRIP' },
  { key: 'in_mainCcTable', label: 'MAIN/CC TABLE\nDRIVE TRIP' },
  { key: 'in_tableDrive', label: '입구 TABLE\nDRIVE TRIP' },
  { key: 'in_tableRot', label: '입구 TABLE\nDRIVE 회전감지\n이상' },
  { key: 'in_mainTableRot', label: 'MAIN TABLE\nDRIVE 회전감지\n이상' },
  { key: 'in_burnBlower', label: '연소 BLOWER\nTRIP' },
];

const OUTLET_COLUMN = [
  { key: 'out_emg', label: '출구 비상정지' },
  { key: 'out_hydTrip', label: '출구 유압\nUNIT TRIP' },
  { key: 'out_sideConv', label: '출구 SIDE\nCONVEYOR\nTRIP' },
  { key: 'out_pocket1', label: 'NO.1 출구\nPOCKET TRIP' },
  { key: 'out_pocket2', label: 'NO.2 출구\nPOCKET TRIP' },
  { key: 'out_tableDrive', label: '출구 TABLE\nDRIVE TRIP' },
  { key: 'out_tableRot', label: '출구 TABLE\nDRIVE 회전감지\n이상' },
  { key: 'out_ccTableRot', label: 'CC TABLE\nDRIVE 회전감지\n이상' },
  { key: 'out_addBlower', label: '첨가 BLOWER\nTRIP' },
];

const COMMON_COLUMN = [
  { key: 'cm_mainAir', label: 'MAIN AIR\n압력 이상' },
  { key: 'cm_mainGas', label: 'MAIN GAS\n압력 이상' },
  { key: 'cm_addAir', label: '첨가 AIR\n압력 이상' },
  { key: 'cm_addGas', label: '첨가 GAS\n압력 이상' },
  { key: 'cm_coolPress', label: '냉각수\n압력이상' },
  { key: 'cm_tempNotReached', label: '허용온도\n미도달상태\n발생기 OPEN' },
  { key: 'cm_hotDriveOff', label: '고온상태시 DRIVE\nOFF상태/조작' },
  { key: 'cm_coolLevelHi', label: '냉각수\nLEVEL HIGH' },
  { key: 'cm_coolLevelLo', label: '냉각수\nLEVEL LOW' },
  { key: 'cm_coolingTower', label: 'COOLING\nTOWER\nALARM 발생' },
];

const COLUMNS = [
  ...[1, 2, 3, 4, 5, 6, 7].map(zoneColumn),
  INLET_COLUMN,
  OUTLET_COLUMN,
  COMMON_COLUMN,
];

export default function AlarmPage() {
  // 발생 중인 알람의 key 집합. PLC 폴링으로 채운다.
  const [activeKeys] = useState(() => new Set());

  // CSS grid는 행 우선으로 흐르므로 같은 순서로 뿌린다(빈 칸은 자리만 차지).
  const cells = [];
  for (let row = 0; row < ROW_COUNT; row += 1) {
    COLUMNS.forEach((column, col) => {
      const item = column[row];
      cells.push(
        item
          ? (
            <div
              key={item.key}
              className={`al-cell${activeKeys.has(item.key) ? ' on' : ''}`}
            >
              {item.label}
            </div>
          )
          : <div key={`empty-${row}-${col}`} className="al-cell is-empty" />
      );
    });
  }

  return (
    <div className="al-page">
      <div className="al-grid">{cells}</div>

      <div className="al-actions">
        <button type="button" className="al-action">ALARM RESET</button>
        <button type="button" className="al-action">HORN STOP</button>
      </div>
    </div>
  );
}
