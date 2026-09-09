import { useState } from 'react';
import TempZonePanel from '../../components/scada/TempZonePanel';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { writeTag } from '../../api/scada/foldertagApi';
import './TempPage.css';

const ZONE_COUNT = 7;

/* 이 화면의 PLC 태그가 든 폴더 — ez_scada.folders.id (폴더 이름 '온도화면').
   DB에 만든 행의 id와 반드시 같아야 한다. 틀리면 오류가 아니라 태그 0개 응답으로
   조용히 실패하니, 값이 전부 '---'로 나오면 여기를 먼저 본다. */
const TC_FOLDER_ID = 8;

/* 값 칸은 전부 PLC 태그에서 온다. 여기 남은 건 아직 태그가 없는 자동/수동 모드 버튼뿐이다.
   참고 HMI 화면과 같이 수동모드(빨강)에서 시작한다. 누르면 자동모드(초록)로 바뀐다. */
function makeZone() {
  return { manualMode: true };
}

export default function TempPage() {
  const [zones, setZones] = useState(() =>
    Array.from({ length: ZONE_COUNT }, () => makeZone())
  );

  /* PV/SV/MV 실시간값. 존 7개를 화면이 한 번만 폴링해서 나눠 준다 —
     패널마다 폴링하면 요청이 7배가 된다. */
  const { values: tagValues, error: tagValueError } = useFolderTagValues(TC_FOLDER_ID);

  const [writeError, setWriteError] = useState('');

  /* 숫자 쓰기 — 숫자패드에서 [입력]을 누른 값이 여기로 온다.
     연소화면의 버튼처럼 2초 누름을 요구하지 않는다: 숫자패드의 [입력] 자체가
     이미 확인 단계라서, 한 번 더 확인을 받으면 값 하나 바꾸는 데 두 번 확인하게 된다. */
  const handleWrite = (name, value) => {
    setWriteError('');
    return writeTag(TC_FOLDER_ID, name, value)
      .catch((e) => setWriteError(`${name} — ${e.message}`));
  };

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
          values={tagValues}
          onWrite={handleWrite}
          onChange={(field, value) => handleChange(i, field, value)}
        />
      ))}

      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
    </div>
  );
}
