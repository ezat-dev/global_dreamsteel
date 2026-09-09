import { useEffect } from 'react';
import { lampClassOf, lampOf } from '../../api/scada/foldertagApi';

/* ===========================================================================
   존 개별연소 모달 — 연소화면에서 "N ZONE 개별연소" 이름표를 누르면 열린다.

   한 존에 버너가 4개 있고, 앞의 둘이 좌측·뒤의 둘이 우측이다(원본 작화 031_1ZONE연소).

   버튼이 9개다 — 버너 4개 × (연소 ON / 연소 OFF) + 존 PURGE 1개.
   버튼마다 태그가 두 개씩 붙는다(알람화면의 alarm_1000 ↔ alarm_1000_lamp와 같은 규칙):
     _cmd        누르는 동안 1, 떼면 0 (싸이몬의 Bit_Momentary와 같다)
     _cmd_lamp   지금 걸려 있는지. 이 값이 버튼을 진하게 할지 결정한다

   momentary라서 onClick이 아니라 onPointerDown으로 누름만 받고, 뗌은 화면(CombustionPage)이
   window에서 받는다 — 손가락이 버튼 밖에서 떨어져도 0이 반드시 나가야 하기 때문이다.
   같은 이유로 버튼에 disabled를 걸지 않는다(비활성 요소는 뗌 이벤트를 못 받는다).

   설비에는 존별로 버너가 8/8/8/7/7/7/8개 있지만(엑셀·알람 태그·folders_tags 모두 일치)
   이 모달은 원본 작화대로 4개만 조작한다 — 나머지 버너는 이 창에서 켜고 끌 수 없다.
   개수를 늘릴 일이 생기면 아래 BURNERS만 고치면 된다.

   누른 즉시 램프 색을 바꾸지 않는다. 명령을 보내고, _cmd_lamp가 올라오는 다음 폴링에서
   바뀐다 — 인터록으로 PLC가 거부하면 색이 안 바뀌는 게 정확한 표시다.
   낙관적으로 켜면 설비는 안 움직이는데 화면만 켜진 상태가 된다.
   (누르고 있다는 것 자체는 is-held로 따로 표시한다 — 그건 PLC 상태 주장이 아니라 입력 반응이다.)
   =========================================================================== */

// 버너 번호 → 좌/우. 원본 작화의 배치(1·2번이 좌, 3·4번이 우)를 그대로 따른다.
const BURNERS = [
  { no: 1, side: '좌' },
  { no: 2, side: '좌' },
  { no: 3, side: '우' },
  { no: 4, side: '우' },
];

/* 명령 태그 이름 — ez_scada.folders_tags.name과 반드시 같아야 한다.
   램프 이름은 여기에 '_lamp'를 붙인 것이고, 그 규칙은 foldertagApi의 lampOf가 갖고 있다
   (프로젝트 전체가 같은 규칙을 쓰므로 화면별로 다시 정의하지 않는다). */
export const burnerCmd = (zone, no, action) => `cb_z${zone}_b${no}_${action}_cmd`;
export const purgeCmd = (zone) => `cb_z${zone}_purge_cmd`;

/**
 * @param zone    존 번호(1~7)
 * @param values  useFolderTagValues의 값 맵. null이면 아직 못 받은 상태
 * @param onPress (tagName) => void — 누름. 대기시간을 채웠을 때의 1 쓰기와
 *                뗌의 0 쓰기는 모두 화면(CombustionPage)이 맡는다
 * @param heldTag 지금 누르고 있는 태그. 진행 바를 그리는 데 쓴다
 * @param armedTag 대기시간을 채워 1이 나간 태그
 * @param holdMs  눌러야 하는 시간(ms). 진행 바 애니메이션 길이와 같은 값이어야 한다
 * @param onClose 닫기
 */
export default function ZoneBurnerModal({
  zone, values, onPress, heldTag = '', armedTag = '', holdMs = 2000, onClose,
}) {
  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const lampClass = (cmdName, onClassName) => lampClassOf(values, cmdName, onClassName);

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
            const onCmd = burnerCmd(zone, b.no, 'on');    // cb_z1_b1_on_cmd
            const offCmd = burnerCmd(zone, b.no, 'off');  // cb_z1_b1_off_cmd

            return (
              <div className="cb-zmodal-row" key={b.no}>
                <span className="cb-zmodal-name">{`${zone}-${b.no} ZONE(${b.side})`}</span>

                {/* 두 칸 다 버튼이면서 램프다 — 눌러서 명령을 보내고,
                    걸린 쪽이 진하게 남는다(연소화면 본판 .cb-onoff와 같은 모양). */}
                <span className="cb-onoff cb-zmodal-state">
                  <button
                    type="button"
                    className={`hmi-lampbox${lampClass(onCmd, ' is-on')}`
                      + (heldTag === onCmd ? ' is-held' : '')
                      + (armedTag === onCmd ? ' is-armed' : '')}
                    onPointerDown={() => onPress(onCmd)}
                    data-tag={onCmd}
                    title={`${onCmd} / 램프 ${lampOf(onCmd)} — 2초 누르면 전송`}
                  >
                    연소 ON
                    {heldTag === onCmd && (
                      <span className="cb-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
                    )}
                  </button>
                  <button
                    type="button"
                    className={`hmi-lampbox${lampClass(offCmd, ' is-alarm')}`
                      + (heldTag === offCmd ? ' is-held' : '')
                      + (armedTag === offCmd ? ' is-armed' : '')}
                    onPointerDown={() => onPress(offCmd)}
                    data-tag={offCmd}
                    title={`${offCmd} / 램프 ${lampOf(offCmd)} — 2초 누르면 전송`}
                  >
                    연소 OFF
                    {heldTag === offCmd && (
                      <span className="cb-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
                    )}
                  </button>
                </span>
              </div>
            );
          })}

          {/* 존 단위 퍼지 — 위 8개와 같은 규칙(_cmd + _cmd_lamp)이지만 버튼 모양이 다르다.
              folders_tags에 아직 purge 태그가 없어서 지금 누르면 "태그를 찾을 수 없음"이
              뜬다(화면 아래 안내로 보인다). 태그를 넣으면 코드 수정 없이 동작한다. */}
          <div className="cb-zmodal-row">
            <span className="cb-zmodal-name">{`${zone}ZONE PURGE`}</span>
            <button
              type="button"
              className={`cb-zmodal-purge${lampClass(purgeCmd(zone), ' is-on')}`
                + (heldTag === purgeCmd(zone) ? ' is-held' : '')
                + (armedTag === purgeCmd(zone) ? ' is-armed' : '')}
              onPointerDown={() => onPress(purgeCmd(zone))}
              data-tag={purgeCmd(zone)}
              title={`${purgeCmd(zone)} / 램프 ${lampOf(purgeCmd(zone))} — 2초 누르면 전송`}
            >
              PURGE 시작
              {heldTag === purgeCmd(zone) && (
                <span className="cb-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
