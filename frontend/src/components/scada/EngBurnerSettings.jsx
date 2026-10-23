import { useState } from 'react';
import useFolderTagValues from './useFolderTagValues';
import { writeTag } from '../../api/scada/foldertagApi';
import BurnerZonePanel from './BurnerZonePanel';

/* ===========================================================================
   엔지니어링 화면의 '버너제어' 탭 — 존 판(BurnerZonePanel)을 2열 격자로 늘어놓는다.
   탭 둘이 이 컴포넌트를 쓴다: 1~4존 / 5~7존(5~7존은 넷째 칸이 빈다).

   태그는 폴더 13 '버너설정'에 따로 둔다 — 엔지니어링의 다른 설정(폴더 12)과 섞지 않고,
   이 탭을 볼 때만 폴링한다(탭을 떠나면 이 컴포넌트가 내려가며 폴링도 멈춘다).
   폴더 id가 바뀌면 이 숫자만 고치면 된다. 틀리면 오류가 아니라 칸이 전부 '---'로 남는다.
   =========================================================================== */
export const BURNER_FOLDER_ID = 13;

/** @param zones 이 탭에 놓을 존 번호들 */
export default function EngBurnerSettings({ zones }) {
  const { values, error: tagValueError } = useFolderTagValues(BURNER_FOLDER_ID);
  const [writeError, setWriteError] = useState('');

  /* 숫자패드가 문자열을 준다. C#은 PLC 워드를 정수로만 쓰므로 정수로 맞춘다
     (숫자패드가 소수점을 이미 막고 있지만 다른 화면들과 같은 마지막 방어선이다). */
  const handleWrite = (tag, value) => {
    const num = Math.round(Number(value));
    if (!Number.isFinite(num)) return;
    setWriteError('');
    writeTag(BURNER_FOLDER_ID, tag, num)
      .catch((e) => setWriteError(`${tag} — ${e.message}`));
  };

  return (
    <>
      <div className="bz-grid">
        {zones.map((n) => (
          <BurnerZonePanel key={n} zone={n} values={values} onWrite={handleWrite} />
        ))}
      </div>

      {(writeError || tagValueError) && (
        <div className="hmi-toast">{writeError || tagValueError}</div>
      )}
    </>
  );
}
