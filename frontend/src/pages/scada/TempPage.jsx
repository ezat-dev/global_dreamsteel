import { useState } from 'react';
import TempZonePanel from '../../components/scada/TempZonePanel';
import './TempPage.css';

const ZONE_COUNT = 7;

// PLC 연동 전 초기값. 전부 0으로 두면 게이지가 다 비어 있어서 입력해도 뭐가 바뀌는지
// 알아보기 어려워서, 실제 침탄로에서 나올 법한 값으로 채워둔다.
const INITIAL_SV = [860, 930, 930, 920, 900, 900, 640];

function makeZone(i) {
  const sv = INITIAL_SV[i] ?? 900;
  return {
    pv: String(sv - 6),
    sv: String(sv),
    mv: String(45),
    // HH/H/L/LL은 허용 범위(0~500 / 0~200 / 0~200 / 0~400)가 SV와 달라서 SV에서 계산하지 않고
    // 범위 안의 임시값을 넣어둔다. 실제 기준값은 PLC 연동 때 채운다.
    hh: '50',
    h: '20',
    l: '20',
    ll: '40',
    p: '3.0',
    i: '120',
    d: '30',
    limitHi: '100',
    limitLo: '0',
    manualMv: '0',
    // 참고 HMI 화면과 같이 수동모드(빨강)에서 시작한다. 누르면 자동모드(초록)로 바뀐다.
    manualMode: true,
  };
}

export default function TempPage() {
  const [zones, setZones] = useState(() =>
    Array.from({ length: ZONE_COUNT }, (_, i) => makeZone(i))
  );

  const handleChange = (index, field, value) => {
    setZones((prev) => prev.map((z, i) => (i === index ? { ...z, [field]: value } : z)));
  };

  return (
    <div className="tz-grid">
      {zones.map((zone, i) => (
        <TempZonePanel
          key={i}
          zoneNo={i + 1}
          zone={zone}
          onChange={(field, value) => handleChange(i, field, value)}
        />
      ))}
    </div>
  );
}
