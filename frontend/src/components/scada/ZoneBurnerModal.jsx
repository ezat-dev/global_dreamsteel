import { useEffect } from 'react';

/* ===========================================================================
   존 개별연소 모달 — 연소화면에서 "N ZONE 개별연소" 이름표를 누르면 열린다.

   한 존에 버너가 4개 있고, 앞의 둘이 좌측·뒤의 둘이 우측이다(원본 작화 031_1ZONE연소).
   연소 ON/OFF는 조작 버튼이 아니라 PLC 상태 표시다 — 연소화면 본판(.cb-onoff)과
   같은 규칙으로 걸린 쪽만 진하게 남긴다.

   PURGE 시작은 조작 버튼인데, PLC 쓰기 API가 아직 없어서 화면 아래 조작판
   (ACTION_PANELS)과 마찬가지로 disabled로 둔다. 연동되면 onPurge를 받아 붙이면 된다.
   =========================================================================== */

// 버너 번호 → 좌/우. 원본 작화의 배치(1·2번이 좌, 3·4번이 우)를 그대로 따른다.
const BURNERS = [
  { no: 1, side: '좌' },
  { no: 2, side: '좌' },
  { no: 3, side: '우' },
  { no: 4, side: '우' },
];

/**
 * @param zone    존 번호(1~7)
 * @param burners 버너 4개의 연소 상태 boolean 배열. 없으면 전부 OFF로 본다
 *                (PLC 값이 아직 안 붙어서, 모르는 상태를 ON으로 그리지 않는다).
 * @param onClose 닫기
 */
export default function ZoneBurnerModal({ zone, burners, onClose }) {
  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    /* 막을 클릭해도 닫히게 한다. 단 패널 안쪽 클릭이 타고 올라와 닫는 일이 없도록
       이벤트가 막 자신에서 시작했는지 확인한다. */
    <div
      className="cb-zmodal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cb-zmodal">
        <div className="cb-zmodal-title">
          <span>{`${zone}ZONE BURNER 운전`}</span>
          <button
            type="button"
            className="cb-zmodal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="cb-zmodal-body">
          {BURNERS.map((b) => {
            const on = Boolean(burners?.[b.no - 1]);
            return (
              <div className="cb-zmodal-row" key={b.no}>
                <span className="cb-zmodal-name">{`${zone}-${b.no} ZONE(${b.side})`}</span>
                <span className="cb-onoff cb-zmodal-state">
                  <b className={on ? 'is-on' : ''}>연소 ON</b>
                  <b className={on ? '' : 'is-on'}>연소 OFF</b>
                </span>
              </div>
            );
          })}

          {/* 존 단위 퍼지 — 위 4줄과 달리 조작이라 버튼이다 */}
          <div className="cb-zmodal-row cb-zmodal-row--purge">
            <span className="cb-zmodal-name">{`${zone}ZONE PURGE`}</span>
            <button type="button" className="cb-action-btn" disabled>PURGE 시작</button>
          </div>
        </div>
      </div>
    </div>
  );
}
