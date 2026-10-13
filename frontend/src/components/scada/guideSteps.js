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
     preview: 평소엔 안 보이는 것(경보일 때만 뜨는 띠 등)을 이 단계에서만 예시로 보여 줄 때 —
              이름 하나. 그 단계에 있는 동안 .hmi-root에 data-sg-preview="<이름>"이 붙고,
              화면 CSS가 그걸 보고 예시를 그린다. 값·PLC는 건드리지 않는다.
              진짜가 하나라도 떠 있으면 화면 CSS가 예시를 그리지 않는다(진짜와 섞이지 않게).
     previewShown: 예시가 실제로 그려졌을 때 보이는 요소의 선택자. 보일 때만 글 중 [[ex]]로
              시작하는 줄("지금 보이는 것은 예시")을 싣는다 — 진짜가 떠 있을 때 틀린 말을 하지 않게.

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

/* 알람화면 첫 칸의 설명·파일 창 — 칸(div)은 조회 권한이어도 눌려서 창이 열린다(보기만) */
const AL_DETAIL = {
  trigger: '.al-grid > .al-cell:first-child',
  check: '.ad-modal',
  close: '.ad-close',
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
  atmosphere: [
    { id: 'intro' },
    /* 제목판·OPEN/CLOSE 칸은 감싸는 묶음이 없어 그 뒤의 설비 상자 그림(.blowe / .gas)을 짚는다.
       둘을 한 상자로 묶으면 블로워 그림 한가운데를 가로지른다 — 따로 짚는다 */
    { id: 'addition', target: '.blowe, .gas', split: true },
    { id: 'pipeLamps', target: '.at-pipe-label' },
    // 그림 속 부속 — 블로워·압력 조절밸브·솔레노이드 밸브·컨트롤 밸브·경광등. 흩어져 있어 따로 짚는다
    {
      id: 'fittings',
      target: '.motor-1, .blowe-pre, .blowe-sol, .gas-pre, .gas-sol, .valve-1, .alarm-1',
      split: true,
    },
    { id: 'valveValues', target: '.at-valve-boxes > .at-box:first-child' },
    { id: 'pid', target: '.at-valve-boxes > .at-box:last-child' },
    { id: 'refTemp', target: '.at-reftemp' },
    { id: 'mode', target: '.at-mode' },
    { id: 'manualMv', target: '.at-manual' },
    { id: 'cond', target: '.at-cond' },
    { id: 'gen', target: '.at-plate--gen, .at-plate--gen + .at-openclose' },
    { id: 'o2', target: '.at-o2' },
    { id: 'end' },
  ],
  cooling: [
    { id: 'intro' },
    { id: 'motor', target: '.cooling-tower .motor-1' },
    // 펌프 넷 — 냉각수펌프 둘(가운데)과 순환펌프 둘(왼쪽 아래)이 떨어져 있어 따로 짚는다
    { id: 'pumps', target: '.cooling-tower .pump-1, .cooling-tower .pump-2, .cooling-tower .pump-3, .cooling-tower .pump-4', split: true },
    {
      id: 'arrows',
      target: '.cooling-tower .arrow-1, .cooling-tower .arrow-2, .cooling-tower .arrow-6, .cooling-tower .arrow-7, '
        + '.cooling-tower .arrow-8, .cooling-tower .arrow-9, .cooling-tower .arrow-11',
      split: true,
    },
    /* 경보 띠는 경보일 때만 보인다 — 진짜 띠가 없으면 이 단계에서만 두 띠를 예시로 띄워 짚는다(CoolingPage.css) */
    { id: 'level', target: '.ct-banner', preview: 'ct-level', previewShown: '.ct-banner.is-off' },
    { id: 'delay', target: '.ct-delay' },
    { id: 'end' },
  ],
  trend: [
    { id: 'intro' },
    { id: 'period', target: '.tr-filter' },
    { id: 'quick', target: '.tr-quick' },
    { id: 'follow', target: '.tr-follow' },
    { id: 'memo', target: '.tr-memo' },
    { id: 'export', target: '.tr-export' },
    { id: 'chart', target: '.tr-chart' },
    /* 오른쪽 판은 한 줄에 이름·스위치·값·범위가 있다. 값 칸과 범위는 위아래로 붙어 있어
       한 상자로 묶으면 서로를 덮는다 — 그 둘은 줄마다 따로 짚는다 */
    { id: 'values', target: '.tr-vbox', split: true },
    { id: 'toggle', target: '.tr-toggle' },
    { id: 'focus', target: '.tr-vlabel' },
    { id: 'range', target: '.tr-vrange', split: true },
    { id: 'end' },
  ],
  alarm: [
    { id: 'intro' },
    { id: 'pager', target: '.al-pager' },
    // 발생한 칸은 경보일 때만 빨갛다 — 발생한 칸이 없으면 이 장에서만 앞 세 칸을 예시로 켠다(AlarmPage.css)
    {
      id: 'cells',
      target: '.al-grid',
      preview: 'al-on',
      previewShown: '.al-grid:not(:has(.al-cell.on)) > .al-cell:not(.is-empty)',
    },
    { id: 'count', target: '.al-count' },
    { id: 'actions', target: '.al-action' },
    { id: 'open', target: '.al-grid > .al-cell:first-child' },
    // 설명·파일 창 안 — 첫 칸의 창을 열어 짚는다. 창 안 section은 설명·사진·PDF 순이다
    { id: 'desc', target: '.ad-body > section.ad-sec:nth-of-type(1)', opens: AL_DETAIL },
    {
      id: 'files',
      target: '.ad-body > section.ad-sec:nth-of-type(2), .ad-body > section.ad-sec:nth-of-type(3)',
      opens: AL_DETAIL,
    },
    { id: 'end' },
  ],
  alarmNow: [
    { id: 'intro' },
    { id: 'hist', target: '.an-hist .ah-table' },
    // 켜진 램프가 없으면 판이 비어 있다 — 그때만 이 장에서 예시 세 칸을 띄운다(AlarmNowPage.css)
    { id: 'lamps', target: '.an-lamp', preview: 'an-lamp', previewShown: '.an-lamps--sample .an-lamp-cell' },
    { id: 'counts', target: '.an-head .al-count', split: true },
    { id: 'end' },
  ],
  alarmHistory: [
    { id: 'intro' },
    // 기간 칸과 조회 버튼만 — 같은 줄 끝의 엑셀 버튼은 따로 짚는다
    { id: 'period', target: '.ah-filter .ah-label, .ah-filter .react-datepicker-wrapper, .ah-filter .ah-btn:not(.is-excel)' },
    { id: 'count', target: '.ah-count' },
    { id: 'filter', target: '.ah-table .tabulator-header-filter', split: true },
    { id: 'table', target: '.ah-table' },
    { id: 'excel', target: '.ah-btn.is-excel' },
    { id: 'end' },
  ],
};

export default GUIDE_STEPS;

/** 이 화면에 설명서가 있는지 — 헤더의 ? 버튼을 그릴지 정한다 */
export const hasGuide = (screenKey) => Boolean(GUIDE_STEPS[screenKey]?.length);
