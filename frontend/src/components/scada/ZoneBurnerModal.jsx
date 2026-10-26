import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { lampClassOf, lampOf } from '../../api/scada/foldertagApi';

/* ===========================================================================
   존 개별연소 모달 — 연소화면에서 "N ZONE 개별연소" 이름표를 누르면 열린다.

   버너 수는 연소화면 그림의 그 존 불꽃 개수와 같다 — 위 줄 4·4·4·3·3·3·4개,
   아래 줄은 존마다 4개라 존별로 8/8/8/7/7/7/8개다(엑셀·알람 태그와도 일치).
   번호는 위 줄 왼쪽부터 1번이고, 아래 줄 왼쪽부터 그다음 번호로 이어진다
   (예: 1존은 위 1~4, 아래 5~8 / 4존은 위 1~3, 아래 4~7).
   창도 그림처럼 위 줄 / 아래 줄 두 칸으로 나눠 그린다 — 한 줄로 8개를 쌓으면
   태블릿 높이를 넘고, 그림과 같은 배치라 어느 불꽃인지 바로 맞춰 볼 수 있다.

   버튼마다 태그가 두 개씩 붙는다(알람화면의 alarm_1000 ↔ alarm_1000_lamp와 같은 규칙):
     _cmd        누르는 동안 1, 떼면 0 (싸이몬의 Bit_Momentary와 같다)
     _cmd_lamp   지금 걸려 있는지. 이 값이 버튼을 진하게 할지 결정한다

   momentary라서 onClick이 아니라 onPointerDown으로 누름만 받고, 뗌은 화면(CombustionPage)이
   window에서 받는다 — 손가락이 버튼 밖에서 떨어져도 0이 반드시 나가야 하기 때문이다.
   같은 이유로 버튼에 disabled를 걸지 않는다(비활성 요소는 뗌 이벤트를 못 받는다).

   누른 즉시 램프 색을 바꾸지 않는다. 명령을 보내고, _cmd_lamp가 올라오는 다음 폴링에서
   바뀐다 — 인터록으로 PLC가 거부하면 색이 안 바뀌는 게 정확한 표시다.
   낙관적으로 켜면 설비는 안 움직이는데 화면만 켜진 상태가 된다.
   (누르고 있다는 것 자체는 is-held로 따로 표시한다 — 그건 PLC 상태 주장이 아니라 입력 반응이다.)
   =========================================================================== */

/* 존 번호 → [위 줄 버너 수, 아래 줄 버너 수]. 연소화면 그림의 불꽃 개수 그대로다. */
const ZONE_BURNERS = {
  1: [4, 4], 2: [4, 4], 3: [4, 4], 4: [3, 4], 5: [3, 4], 6: [3, 4], 7: [4, 4],
};

/* 존 번호 → 줄별 버너 번호. 예: 4존 → [{ row: 'top', nos: [1,2,3] }, { row: 'bottom', nos: [4,5,6,7] }]
   row는 사전 키다(combustion.json의 modal.top = 위 줄 / modal.bottom = 아래 줄). */
const burnerRows = (zone) => {
  const [top, bottom] = ZONE_BURNERS[zone];
  const range = (from, n) => Array.from({ length: n }, (_, i) => from + i);
  return [
    { row: 'top', nos: range(1, top) },
    { row: 'bottom', nos: range(top + 1, bottom) },
  ];
};

/* 명령 태그 이름 — ez_scada.folders_tags.name과 반드시 같아야 한다.
   램프 이름은 여기에 '_lamp'를 붙인 것이고, 그 규칙은 foldertagApi의 lampOf가 갖고 있다
   (프로젝트 전체가 같은 규칙을 쓰므로 화면별로 다시 정의하지 않는다). */
export const burnerCmd = (zone, no, action) => `cb_z${zone}_b${no}_${action}_cmd`;
export const purgeCmd = (zone) => `cb_z${zone}_purge_cmd`;
export const purgeStopCmd = (zone) => `cb_z${zone}_purge_stop_cmd`;

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
  const { t } = useTranslation('combustion');
  const holdTip = (cmd) => t('common:hmi.holdSend', { cmd, lamp: lampOf(cmd), sec: holdMs / 1000 });

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const lampClass = (cmdName, onClassName) => lampClassOf(values, cmdName, onClassName);

  /* 누름 버튼 하나 — 램프 색·누름 표시·진행 바가 모든 버튼에 똑같이 붙는다. */
  const pressButton = (cmd, className, label) => (
    <button
      type="button"
      key={cmd}
      className={className
        + (heldTag === cmd ? ' is-held' : '')
        + (armedTag === cmd ? ' is-armed' : '')}
      onPointerDown={() => onPress(cmd)}
      data-tag={cmd}
      title={holdTip(cmd)}
    >
      {label}
      {heldTag === cmd && (
        <span className="cb-hold-bar" style={{ animationDuration: `${holdMs}ms` }} />
      )}
    </button>
  );

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
          <span>{t('modal.title', { zone })}</span>
          <button
            type="button"
            className="cb-zmodal-close"
            onClick={onClose}
            aria-label={t('common:hmi.close')}
          >
            ✕
          </button>
        </div>

        <div className="cb-zmodal-body">
          {/* 위 줄 / 아래 줄 두 칸 — 그림의 불꽃 줄과 같은 순서다 */}
          <div className="cb-zmodal-burners">
            {burnerRows(zone).map(({ row, nos }) => (
              <div className="cb-zmodal-col" key={row}>
                <div className="cb-zmodal-colhead">{t(`modal.${row}`)}</div>
                {nos.map((no) => (
                  <div className="cb-zmodal-row" key={no}>
                    <span className="cb-zmodal-name">{`${zone}-${no}`}</span>

                    {/* 두 칸 다 버튼이면서 램프다 — 눌러서 명령을 보내고,
                        걸린 쪽이 진하게 남는다(연소화면 본판 .cb-onoff와 같은 모양). */}
                    <span className="cb-onoff cb-zmodal-state">
                      {pressButton(burnerCmd(zone, no, 'on'),
                        `hmi-lampbox${lampClass(burnerCmd(zone, no, 'on'), ' is-on')}`, t('modal.burnOn'))}
                      {pressButton(burnerCmd(zone, no, 'off'),
                        `hmi-lampbox${lampClass(burnerCmd(zone, no, 'off'), ' is-alarm')}`, t('modal.burnOff'))}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 존 단위 퍼지 시작 / 정지 — 버너와 같은 규칙(_cmd + _cmd_lamp)이다.
              시작은 사진처럼 빨간 버튼(퍼지 중이면 초록), 정지는 버너 OFF와 같은 램프 칸
              (걸려 있으면 빨강)이다. 태그가 folders_tags에 없으면 누를 때
              "태그를 찾을 수 없음"이 화면 아래 안내로 뜬다 — 태그만 넣으면 코드 수정 없이 동작한다. */}
          <div className="cb-zmodal-purgerow">
            <span className="cb-zmodal-name">{`${zone}ZONE PURGE`}</span>
            {pressButton(purgeCmd(zone),
              `cb-zmodal-purge${lampClass(purgeCmd(zone), ' is-on')}`, t('modal.purgeStart'))}
            {pressButton(purgeStopCmd(zone),
              `cb-zmodal-purgestop hmi-lampbox${lampClass(purgeStopCmd(zone), ' is-alarm')}`, t('modal.purgeStop'))}
          </div>
        </div>
      </div>
    </div>
  );
}
