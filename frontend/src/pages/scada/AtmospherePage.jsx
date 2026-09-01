import { useState } from 'react';
import AtmosConditionPanel from '../../components/scada/AtmosConditionPanel';
import AtmosValvePanel from '../../components/scada/AtmosValvePanel';
import './AtmospherePage.css';

// 자동모드 전환 조건 — 순서와 문구는 현장 HMI 화면 그대로.
// on은 PLC 상태라 지금은 전부 꺼짐으로 두고, 연동 때 폴링 값으로 채운다.
const CONDITIONS = [
  { key: 'blower', label: 'ADDTION AIR BLOWER ON' },
  { key: 'airSol', label: 'ADDTION AIR SOL VLAVE ON' },
  { key: 'airPress', label: 'ADDTION AIR PRESSURE 정상' },
  { key: 'gasSol', label: 'ADDTION GAS SOL VLAVE ON' },
  { key: 'gasPress', label: 'ADDTION GAS PRESSURE 정상' },
  { key: 'refTemp', label: '허용 기준온도 도달' },
  { key: 'genGas', label: '발생기 GAS OPEN' },
];

export default function AtmospherePage() {
  const [conditions] = useState(() => CONDITIONS.map((c) => ({ ...c, on: false })));

  const [valve, setValve] = useState({
    pv: '0',
    sv: '1050',
    mv: '0',
    p: '3.0',
    i: '120',
    d: '30',
    refTemp: '800',
    refTempReached: false,
    manualMv: '0',
    manualMode: true,
  });

  const handleValveChange = (field, value) => {
    setValve((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="at-page">
      <AtmosValvePanel data={valve} onChange={handleValveChange} />
      <AtmosConditionPanel conditions={conditions} />
    </div>
  );
}
