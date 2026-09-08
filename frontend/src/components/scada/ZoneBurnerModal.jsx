import { useEffect } from 'react';
import { TAG_ON, TAG_UNKNOWN, tagState } from '../../api/scada/foldertagApi';

/* ===========================================================================
   존 개별연소 모달 — 연소화면에서 "N ZONE 개별연소" 이름표를 누르면 열린다.

   한 존에 버너가 4개 있고, 앞의 둘이 좌측·뒤의 둘이 우측이다(원본 작화 031_1ZONE연소).

   버튼이 9개다 — 버너 4개 × (연소 ON / 연소 OFF) + 존 PURGE 1개.
   버튼마다 태그가 두 개씩 붙는다:
     _cmd    누르면 1을 쓴다(momentary — PLC가 처리하고 스스로 내린다)
     _state  지금 걸려 있는지. 이 값이 버튼을 진하게 할지 결정한다

   누른 즉시 색을 바꾸지 않는다. 명령을 보내고, _state가 올라오는 다음 폴링에서
   바뀐다 — 인터록으로 PLC가 거부하면 색이 안 바뀌는 게 정확한 표시다.
   낙관적으로 켜면 설비는 안 움직이는데 화면만 켜진 상태가 된다.
   =========================================================================== */

// 버너 번호 → 좌/우. 원본 작화의 배치(1·2번이 좌, 3·4번이 우)를 그대로 따른다.
const BURNERS = [
  { no: 1, side: '좌' },
  { no: 2, side: '좌' },
  { no: 3, side: '우' },
  { no: 4, side: '우' },
];

/** 태그 이름 규칙 — folders_tags.name과 반드시 같아야 한다. */
export const burnerTag = (zone, no, action, kind) => `cb_z${zone}_b${no}_${action}_${kind}`;
export const purgeTag = (zone, kind) => `cb_z${zone}_purge_${kind}`;

/**
 * @param zone    존 번호(1~7)
 * @param values  useFolderTagValues의 값 맵. null이면 아직 못 받은 상태
 * @param onWrite (tagName, value) => Promise — 실제 쓰기
 * @param busyTag 지금 쓰기 중인 태그 이름(중복 클릭 방지용). 없으면 ''
 * @param onClose 닫기
 */
export default function ZoneBurnerModal({ zone, values, onWrite, busyTag = '', onClose }) {
  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* 상태 태그 하나를 버튼 클래스로 바꾼다.
     값을 한 번도 못 받았거나 그 태그만 못 읽었으면 '모름'으로 둔다 —
     꺼진 것으로 그리면 실제로 타고 있는 버너를 꺼져 있다고 보여주게 된다. */
  const stateClass = (stateName, onClassName) => {
    if (!values) return ' is-unknown';
    const st = tagState(values[stateName]);
    if (st === TAG_UNKNOWN) return ' is-unknown';
    return st === TAG_ON ? onClassName : '';
  };

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
            const onCmd = burnerTag(zone, b.no, 'on', 'cmd');
            const offCmd = burnerTag(zone, b.no, 'off', 'cmd');
            const onState = burnerTag(zone, b.no, 'on', 'state');
            const offState = burnerTag(zone, b.no, 'off', 'state');

            return (
              <div className="cb-zmodal-row" key={b.no}>
                <span className="cb-zmodal-name">{`${zone}-${b.no} ZONE(${b.side})`}</span>

                {/* 두 칸 다 버튼이면서 램프다 — 눌러서 명령을 보내고,
                    걸린 쪽이 진하게 남는다(연소화면 본판 .cb-onoff와 같은 모양). */}
                <span className="cb-onoff cb-zmodal-state">
                  <button
                    type="button"
                    className={`hmi-lampbox${stateClass(onState, ' is-on')}`}
                    onClick={() => onWrite(onCmd, 1)}
                    disabled={Boolean(busyTag)}
                    title={onCmd}
                  >
                    연소 ON
                  </button>
                  <button
                    type="button"
                    className={`hmi-lampbox${stateClass(offState, ' is-alarm')}`}
                    onClick={() => onWrite(offCmd, 1)}
                    disabled={Boolean(busyTag)}
                    title={offCmd}
                  >
                    연소 OFF
                  </button>
                </span>
              </div>
            );
          })}

          {/* 존 단위 퍼지 — 위 8개와 같은 규칙(명령 + 상태)이지만 버튼 모양이 다르다 */}
          <div className="cb-zmodal-row">
            <span className="cb-zmodal-name">{`${zone}ZONE PURGE`}</span>
            <button
              type="button"
              className={`cb-zmodal-purge${stateClass(purgeTag(zone, 'state'), ' is-on')}`}
              onClick={() => onWrite(purgeTag(zone, 'cmd'), 1)}
              disabled={Boolean(busyTag)}
              title={purgeTag(zone, 'cmd')}
            >
              PURGE 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
