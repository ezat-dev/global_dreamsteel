import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lampClassOf, lampOf } from '../../api/scada/foldertagApi';

/* ===========================================================================
   존 개별연소 모달 — 연소화면에서 "N ZONE 개별연소" 이름표를 누르면 열린다.
   그 존이 가려지지 않게 존 옆에 열리고, 제목줄을 끌어서 옮길 수 있다(아래 '창 위치').

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

/* 창 위치 — 그 존이 가려지지 않게 존 옆에 연다(존이 화면 왼쪽 절반이면 오른쪽 옆, 아니면 왼쪽 옆).
   좁은 화면에서 옆자리가 모자라면 화면 안으로 밀어 넣으므로 조금 겹칠 수 있다 — 그때는
   제목줄을 끌어서 옮긴다. 화면 가장자리와 존 사이에 둘 여백(px). */
const EDGE = 12;
const GAP = 14;
/* 존 옆자리가 760px보다 좁으면(태블릿에서 가운데 존) 창을 그 자리만큼 줄인다. 이보다 좁게는
   줄이지 않는다 — 420px이면 글자를 줄인 촘촘한 배치(is-compact)로 버너 두 칸이 들어간다.
   그보다 좁은 자리는 조금 겹치게 두고 끌어서 옮기게 한다. 600px 아래부터 촘촘한 배치를 쓴다. */
const NATURAL_W = 760;
const MIN_W = 420;
const COMPACT_BELOW = 600;

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

  /* ── 창 위치 ─────────────────────────────────────────────────────────────
     좌표는 막(.cb-zmodal-scrim) 안의 px다. 막이 position: fixed라 보통은 화면 기준이지만,
     설명서를 열면 화면 전체(.hmi-shell)가 transform: scale로 줄어서 막도 그 안에 갇힌다
     (transform이 걸린 조상이 fixed의 기준이 된다). 그래서 화면에서 잰 값(getBoundingClientRect)을
     배율 k로 나눠 막 안의 좌표로 바꾼다 — 안 그러면 설명서를 연 상태에서 창이 엉뚱한 데 뜬다. */
  const modalRef = useRef(null);
  const [size, setSize] = useState(null); // { w, compact, side, colL, colR } — 창 폭과 놓을 쪽
  const [pos, setPos] = useState(null);   // null = 아직 안 쟀다(첫 프레임은 숨긴다)
  const dragRef = useRef(null);

  const box = () => {
    const scrim = modalRef.current?.parentElement;
    if (!scrim || !scrim.offsetWidth) return null;
    const r = scrim.getBoundingClientRect();
    return { r, k: r.width / scrim.offsetWidth, w: scrim.offsetWidth, h: scrim.offsetHeight };
  };

  /** 창이 막 밖으로 나가지 않게 — 제목줄을 잃어버리면 다시 끌 수 없다 */
  const clamp = (x, y) => {
    const b = box();
    const m = modalRef.current;
    if (!b || !m) return { x, y };
    const maxX = Math.max(EDGE, b.w - m.offsetWidth - EDGE);
    const maxY = Math.max(EDGE, b.h - m.offsetHeight - EDGE);
    return { x: Math.min(Math.max(EDGE, x), maxX), y: Math.min(Math.max(EDGE, y), maxY) };
  };

  /* 처음 열 때(그리고 다른 존으로 바뀔 때) 그 존 옆에 놓는다. 두 단계다 —
     ① 놓을 쪽과 폭을 정하고(옆자리가 좁으면 폭을 줄인다), ② 그 폭으로 그려진 높이를 재서 자리를 잡는다.
     폭이 바뀌면 줄바꿈이 달라져 높이도 바뀌므로 한 번에 못 한다. 둘 다 그리기 전에 끝나서
     (useLayoutEffect) 창이 한가운데에 잠깐 떴다가 옮겨지는 깜빡임은 없다.
     존 칸은 개별연소 판(.cb-burn)으로 잰다 — 그림의 존 기둥과 폭·위치를 맞춰 둔 판이다. */
  useLayoutEffect(() => {
    const b = box();
    if (!b) return;
    const natural = Math.min(NATURAL_W, b.w - EDGE * 2);
    const col = document.querySelectorAll('.cb-zonebar .cb-burn')[zone - 1];
    if (!col) {
      setSize({ w: natural, compact: natural < COMPACT_BELOW, side: 'center' });
      return;
    }
    const c = col.getBoundingClientRect();
    const colL = (c.left - b.r.left) / b.k;
    const colR = (c.right - b.r.left) / b.k;
    const side = (colL + colR) / 2 < b.w / 2 ? 'right' : 'left';
    const avail = side === 'right' ? b.w - colR - GAP - EDGE : colL - GAP - EDGE;
    const w = Math.max(Math.min(MIN_W, natural), Math.min(natural, avail));
    setSize({ w, compact: w < COMPACT_BELOW, side, colL, colR });
  }, [zone]);

  useLayoutEffect(() => {
    const b = box();
    const m = modalRef.current;
    if (!size || !b || !m) return;
    let x = (b.w - size.w) / 2;
    if (size.side === 'right') x = size.colR + GAP;
    if (size.side === 'left') x = size.colL - GAP - size.w;
    setPos(clamp(x, (b.h - m.offsetHeight) / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // 창 크기가 바뀌면(태블릿 회전 등) 화면 안으로 다시 넣는다
  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clamp(p.x, p.y) : p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 제목줄을 끌어서 옮긴다. pointer capture로 손가락·마우스가 제목줄 밖으로 나가도 계속 따라온다.
     닫기(✕)를 누른 것은 끌기가 아니다. */
  const onDragStart = (e) => {
    if (e.button !== 0 || !pos || e.target.closest('.cb-zmodal-close')) return;
    const b = box();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, k: b ? b.k : 1 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setPos(clamp(d.ox + (e.clientX - d.sx) / d.k, d.oy + (e.clientY - d.sy) / d.k));
  };
  const onDragEnd = () => { dragRef.current = null; };

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
      <div
        className={`cb-zmodal${size?.compact ? ' is-compact' : ''}`}
        ref={modalRef}
        style={{
          ...(size ? { width: size.w } : {}),
          ...(pos ? { left: pos.x, top: pos.y } : { visibility: 'hidden' }),
        }}
      >
        <div
          className="cb-zmodal-title"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
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
