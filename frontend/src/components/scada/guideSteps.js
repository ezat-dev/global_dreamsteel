/* ===========================================================================
   화면 설명서(ScreenGuide)의 단계 — 화면 key(scadaMenu의 key)마다 한 벌.

   한 단계 = { id, target? }
     id     : 문구 키. 글자는 사전 guide.json의 <화면key>.<id>.title / .body 에 있다
              (body는 줄 배열 — 줄 수가 한/영 같아야 i18n:check를 통과한다).
     target : 짚을 곳의 CSS 선택자. 여러 개가 걸리면 모두를 감싸는 한 상자로 짚는다
              (예: '.dr-zone' → 1~7ZONE 전체). 없으면 화면 가운데에 설명 카드만 띄운다.

   선택자는 각 화면이 이미 쓰는 클래스 이름이다. 화면을 고치다 클래스 이름이 바뀌면
   그 단계는 오류 없이 "짚지 않는 카드"로 나온다 — 설명서를 열어 보면 바로 티가 난다.

   여기에 키가 있는 화면만 헤더에 ? 버튼이 생긴다(ScadaLayout).
   =========================================================================== */

const GUIDE_STEPS = {
  drive: [
    { id: 'intro' },
    { id: 'opPanel', target: '.dr-top > .dr-panel:first-child' },
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
};

export default GUIDE_STEPS;

/** 이 화면에 설명서가 있는지 — 헤더의 ? 버튼을 그릴지 정한다 */
export const hasGuide = (screenKey) => Boolean(GUIDE_STEPS[screenKey]?.length);
