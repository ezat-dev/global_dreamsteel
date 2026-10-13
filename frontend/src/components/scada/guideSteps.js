/* ===========================================================================
   화면 설명서(ScreenGuide)의 단계 — 화면 key(scadaMenu의 key)마다 한 벌.

   한 단계 = { id, target?, split?, opens? }
     id     : 문구 키. 글자는 사전 guide.json의 <화면key>.<id>.title / .body 에 있다
              (body는 줄 배열 — 줄 수가 한/영 같아야 i18n:check를 통과한다).
     target : 짚을 곳의 CSS 선택자. 여러 개가 걸리면 모두를 감싸는 한 상자로 짚는다
              (예: '.dr-zone' → 1~7ZONE 전체). 없으면 짚지 않고 화면만 어둡게 둔다.
     split  : true면 걸린 요소마다 테두리를 따로 그린다 — 떨어져 있는 곳 둘을 한 상자로
              감싸면 그 사이까지 들어가는 경우(입구·출구 OP PANEL)에 쓴다.
     opens  : 눌러야 열리는 창 안을 짚을 때 — { trigger, check, close } 선택자 셋.
              그 단계에 오면 check가 없을 때 trigger를 눌러 창을 열고, opens가 같은 단계끼리는
              연 채로 넘어가며, 다른 단계로 넘어가거나 설명서를 닫으면 close를 눌러 닫는다.
              같은 창을 쓰는 단계들은 같은 객체를 써야 한다(같은 창인지 객체로 가린다).
              조회 권한이라 화면이 잠겨 있으면 trigger가 눌리지 않아 창이 안 열린다 — 그 단계는
              짚지 않고 설명만 나온다(그 사용자는 어차피 창을 쓸 수 없다).

   선택자는 각 화면이 이미 쓰는 클래스 이름이다. 화면을 고치다 클래스 이름이 바뀌면
   그 단계는 오류 없이 "짚지 않는 카드"로 나온다 — 설명서를 열어 보면 바로 티가 난다.

   여기에 키가 있는 화면만 헤더에 ? 버튼이 생긴다(ScadaLayout).
   =========================================================================== */

/* 연소화면 1ZONE 개별연소 창 — 창 안을 짚는 단계들이 함께 쓴다 */
const CB_ZONE_MODAL = {
  trigger: '.cb-zonebar .cb-plate--btn',   // 첫 번째 = 1ZONE 개별연소
  check: '.cb-zmodal',
  close: '.cb-zmodal-close',
};

const GUIDE_STEPS = {
  drive: [
    { id: 'intro' },
    // 입구(첫 판)와 출구(끝 판) — 윗줄 양 끝이라 따로 짚는다
    { id: 'opPanel', target: '.dr-top > .dr-panel:first-child, .dr-top > .dr-panel:last-child', split: true },
    { id: 'alarmSw', target: '.dr-alarm-sw' },
    { id: 'cond', target: '.dr-top > .dr-cond' },
    { id: 'time', target: '.dr-time' },
    { id: 'drivePanel', target: '.dr-drive' },
    { id: 'zones', target: '.dr-zone' },
    { id: 'facilityOff', target: '.dr-note:has(.dr-note-lamp)' },
    { id: 'stage', target: '.dr-stage' },
    { id: 'alarms', target: '.dr-alarm' },
    { id: 'boards', target: '.dr-board' },
    { id: 'end' },
  ],
  combustion: [
    { id: 'intro' },
    /* .cb-dev 자체는 크기가 0인 묶음이고(안의 제목판·버튼이 각자 absolute) 그 안쪽을 짚는다 */
    { id: 'mainGas', target: '.cb-dev--mainGas > *' },
    { id: 'pipeLamps', target: '.cb-pipe-label' },
    { id: 'blower', target: '.cb-dev--blower > *' },
    { id: 'burnerCool', target: '.cb-dev--burnerCool > *' },
    { id: 'zones', target: '.cb-zone-title, .cb-val-row' },
    { id: 'per', target: '.cb-per--top' },
    { id: 'zoneBurn', target: '.cb-zonebar .cb-onoff' },
    { id: 'zoneModal', target: '.cb-zonebar .cb-plate--btn' },
    // 개별연소 창 안 — 1ZONE 창을 열어 짚는다(버너 4줄 / 존 PURGE 줄)
    { id: 'zmBurners', target: '.cb-zmodal-body > .cb-zmodal-row:not(:last-child)', opens: CB_ZONE_MODAL },
    { id: 'zmPurge', target: '.cb-zmodal-body > .cb-zmodal-row:last-child, .cb-zmodal-close', split: true, opens: CB_ZONE_MODAL },
    { id: 'stage', target: '.cb-stage' },
    { id: 'alarms', target: '.cb-alarm' },
    { id: 'alarmReset', target: '.cb-action--misfire, .cb-action--burner' },
    { id: 'purge', target: '.cb-action--purge' },
    { id: 'end' },
  ],
  /* 온도제어 — 7개 존 판이 모두 같은 구성이라 1ZONE 판(첫 판) 하나로 설명한다 */
  temp: [
    { id: 'intro' },
    { id: 'panel', target: '.tz-grid > .tz-panel:first-child' },
    { id: 'gauges', target: '.tz-grid > .tz-panel:first-child .tz-gauges' },
    { id: 'mode', target: '.tz-grid > .tz-panel:first-child .tz-mode-btn' },
    { id: 'manualMv', target: '.tz-grid > .tz-panel:first-child .tz-manual-mv' },
    { id: 'alarm', target: '.tz-grid > .tz-panel:first-child .tz-side-group:not(.tz-limit)' },
    { id: 'limit', target: '.tz-grid > .tz-panel:first-child .tz-limit' },
    { id: 'end' },
  ],
};

export default GUIDE_STEPS;

/** 이 화면에 설명서가 있는지 — 헤더의 ? 버튼을 그릴지 정한다 */
export const hasGuide = (screenKey) => Boolean(GUIDE_STEPS[screenKey]?.length);
