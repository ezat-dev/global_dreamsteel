<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../common_style.jsp" %>
<style>
/* ══ page-wrap 오버라이드 (trend 전용: 스크롤 없이 꽉 채우기) ══ */
.page-wrap {
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  padding-top: 14px !important;
  padding-bottom: 14px !important;
}

/* ══ 레이아웃 ══ */
.trend-layout {
  display: grid;
  grid-template-columns: 185px 1fr;
  gap: 14px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
/* grid 자식도 min-height:0 필수 (기본값 auto → 내용만큼 늘어남) */
.trend-layout > * { min-height: 0; }
@media(max-width:900px){ .trend-layout { grid-template-columns:1fr; } }

/* ══ LIVE 뱃지 ══ */
.live-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 20px;
  border: 1px solid rgba(56,161,105,.5);
  background: rgba(56,161,105,.08);
  font-size: 11px; font-weight: 700;
  color: var(--green);
}
.live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--green);
  animation: live-pulse 1.4s ease-in-out infinite;
}
@keyframes live-pulse {
  0%,100%{ opacity:1; box-shadow:0 0 6px var(--green); }
  50%    { opacity:.3; box-shadow:none; }
}
.live-countdown {
  font-size: 10px; color: var(--muted); font-weight: 400;
}

/* ══ KPI 카드 행 ══ */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
}
.kpi-card {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 7px; padding: 5px 9px;
  box-shadow: var(--shadow); border-top: 3px solid var(--primary);
  transition: box-shadow .13s;
}
.kpi-card:hover { box-shadow: var(--shadow-md); }
.kpi-card-lbl { font-size: 10px; color: var(--muted); font-weight: 600; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi-card-val { font-size: 17px; font-weight: 700; color: var(--text); font-family: monospace; line-height: 1.1; }
.kpi-card-sub { font-size: 9px; color: var(--muted); margin-top: 1px; display: flex; gap: 5px; }
.kpi-sub-mn { color: var(--primary); }
.kpi-sub-mx { color: var(--red); }

/* ══ 설비 필터 탭 ══ */
.equip-tabs {
  display: flex; flex-wrap: wrap; gap: 5px;
  padding: 5px 12px;
  background: var(--white); border: 1px solid var(--border);
  border-radius: 12px; box-shadow: var(--shadow);
}
.equip-btn {
  padding: 4px 11px; border-radius: 6px;
  border: 1px solid var(--border); background: var(--white);
  font-size: 11px; font-weight: 700; cursor: pointer;
  transition: all .13s; color: var(--muted);
}
.equip-btn:hover  { border-color: var(--primary-m); color: var(--primary); background: var(--primary-l); }
.equip-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }

/* ══ 태그 패널 ══ */
.tag-panel { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.tag-panel .card { flex: 1; display: flex; flex-direction: column; overflow: hidden; margin: 0; min-height: 0; }

/* 패널 탭 */
.panel-tabs { display: flex; flex-direction: column; gap: 0; margin-bottom: 10px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); flex-shrink: 0; }
.panel-tab {
  flex: 1; padding: 7px 0; border: none; background: var(--white);
  font-size: 12px; font-weight: 700; cursor: pointer; color: var(--muted);
  transition: all .13s;
}
.panel-tab:not(:last-child) { border-bottom: 1px solid var(--border); }
.panel-tab.active { background: var(--primary); color: #fff; }
.panel-tab:hover:not(.active) { background: var(--primary-l); color: var(--primary); }

.tag-search {
  width: 100%; padding: 7px 10px;
  border: 1px solid var(--border); border-radius: 7px;
  font-size: 12px; outline: none; transition: border-color .13s;
  flex-shrink: 0;
}
.tag-search:focus { border-color: var(--primary); }
.tag-list {
  display: flex; flex-direction: column; gap: 4px;
  flex: 1; overflow-y: auto; margin-top: 4px;
}
.tag-list::-webkit-scrollbar { width: 3px; }
.tag-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.tag-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border-radius: 8px; border: 1px solid var(--border); background: var(--white);
  cursor: pointer; transition: all .13s; font-size: 12px; user-select: none;
}
.tag-item:hover { border-color: var(--primary-m); background: var(--primary-l); }
.tag-item.sel   { border-color: var(--primary); background: var(--primary-l); box-shadow: 0 0 0 2px var(--primary-m); }
.tag-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

/* 로트 패널 */
.lot-ctrl { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; flex-shrink: 0; }
.lot-date { flex: 1; padding: 6px 8px; border: 1px solid var(--border); border-radius: 7px; font-size: 12px; outline: none; }
.lot-date:focus { border-color: var(--primary); }
.lot-load-btn { padding: 6px 12px; border-radius: 7px; border: none; background: var(--primary); color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.lot-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.lot-list::-webkit-scrollbar { width: 3px; }
.lot-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.lot-row {
  padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--white); cursor: pointer; transition: all .13s;
  font-size: 12px; user-select: none;
}
.lot-row:hover { border-color: var(--orange); background: #FFFAF0; }
.lot-row.active-lot { border-color: var(--orange); background: #FFFAF0; box-shadow: 0 0 0 2px #FBD38D; }
.lot-num { font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lot-prod { font-size: 10px; color: var(--muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lot-time { font-size: 10px; color: var(--primary); margin-top: 3px; }
.lot-running { color: var(--green); font-weight: 700; }

/* ══ 차트 패널 ══ */
.chart-panel { display: flex; flex-direction: column; gap: 6px; min-height: 0; overflow: hidden; }

/* ══ 툴바 ══ */
.toolbar-box {
  background: var(--white); border: 1px solid var(--border); border-radius: 10px;
  padding: 6px 12px; box-shadow: var(--shadow);
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
}
.period-btn {
  padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border);
  background: var(--white); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .13s; white-space: nowrap;
}
.period-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.tb-sep { width: 1px; height: 20px; background: var(--border); margin: 0 2px; }
.dt-input {
  padding: 5px 8px; border: 1px solid var(--border); border-radius: 6px;
  font-size: 11px; color: var(--text); outline: none;
}
.dt-input:focus { border-color: var(--primary); }
.tb-label { font-size: 11px; color: var(--muted); font-weight: 600; }

/* ══ 차트 박스 ══ */
.chart-box {
  background: #141c2e; border: 1px solid #1e2d4a;
  border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,.4);
  position: relative; flex: 1; display: flex; flex-direction: column;
  min-height: 0; overflow: hidden;
}
#mainChart { flex: 1; min-height: 0; }

/* ══ refresh bar ══ */
.refresh-bar {
  position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
  background: var(--border); border-radius: 0 0 12px 12px; overflow: hidden;
}
.refresh-bar-inner { height: 100%; width: 0%; background: var(--primary); transition: width .1s linear; }

/* ══ alt-drag 평균 ══ */
.avg-overlay {
  position: absolute;
  background: rgba(49,130,206,.1);
  border: 1px solid rgba(49,130,206,.4);
  pointer-events: none; z-index: 10;
}
.avg-tooltip {
  position: absolute; background: var(--white);
  border: 1px solid var(--border); border-radius: 8px;
  padding: 8px 12px; box-shadow: var(--shadow-md);
  font-size: 11px; z-index: 20; pointer-events: auto;
  min-width: 180px; top: 4px; right: 4px;
}
.avg-tooltip-row { display:flex; align-items:center; gap:6px; padding:2px 0; }

/* ══ 줌 리셋 버튼 ══ */
.btn-zoom-reset {
  padding: 4px 10px; border-radius: 6px; border: 1px solid #2d3d5a;
  background: #1e2d45; font-size: 11px; color: #8899bb;
  cursor: pointer; transition: all .13s; display: none;
}
.btn-zoom-reset:hover { border-color: #60A5FA; color: #60A5FA; }
.btn-zoom-reset.visible { display: inline-block; }
.alt-hint { font-size: 10px; color: #5a6a8a; padding: 2px 8px; border: 1px dashed #2d3d5a; border-radius: 4px; }

/* 작업지시 바 */
.jacup-bar {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 10px; padding: 7px 12px; box-shadow: var(--shadow);
  display: none; flex-wrap: wrap; align-items: center; gap: 6px;
  flex-shrink: 0;
}
.jacup-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 16px;
  border: 1px solid rgba(221,107,32,.4);
  background: rgba(221,107,32,.08);
  font-size: 11px; font-weight: 600; color: #7B341E;
  cursor: pointer; transition: all .13s; user-select: none;
}
.jacup-pill:hover { background: rgba(221,107,32,.18); }
.jacup-pill.hidden { opacity: .4; text-decoration: line-through; }
.jacup-pill-dot { width: 7px; height: 7px; border-radius: 50%; background: #DD6B20; flex-shrink: 0; }

/* 메모 바 */
.memo-bar {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 10px; padding: 7px 12px; box-shadow: var(--shadow);
  display: none; flex-wrap: wrap; align-items: center; gap: 6px;
  flex-shrink: 0;
}
.memo-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 16px;
  border: 1px solid rgba(128,90,213,.4);
  background: rgba(128,90,213,.08);
  font-size: 11px; font-weight: 600; color: #553C9A;
  cursor: pointer; transition: all .13s; user-select: none;
}
.memo-pill:hover { background: rgba(128,90,213,.18); }
.memo-pill.hidden { opacity: .4; text-decoration: line-through; }
.memo-pill-dot { width: 7px; height: 7px; border-radius: 50%; background: #805AD5; flex-shrink: 0; }
.memo-pill-del { margin-left: 3px; color: var(--muted); font-size: 14px; line-height: 1; cursor: pointer; font-weight: 400; }
.memo-pill-del:hover { color: var(--red); }

/* 차트 라벨 반투명 */
.cht-jacup-lbl {
  display: inline-block;
  background: rgba(221,107,32,0.45) !important;
  backdrop-filter: blur(2px);
  color: #fff; font-size: 12px; font-weight: 700;
  padding: 5px 10px; border-radius: 6px; line-height: 1.85;
  box-shadow: 0 2px 8px rgba(221,107,32,.45); letter-spacing: .15px;
}
.cht-memo-lbl {
  display: inline-block;
  background: rgba(128,90,213,0.15) !important;
  backdrop-filter: blur(2px);
  color: #fff; font-size: 10px; font-weight: 700;
  padding: 4px 8px; border-radius: 5px; line-height: 1.6;
  box-shadow: 0 2px 6px rgba(128,90,213,.35);
}

/* 메모 모달 */
.memo-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  z-index: 1000; display: none; align-items: center; justify-content: center;
}
.memo-modal {
  background: var(--white); border-radius: 14px;
  padding: 24px 28px; width: 380px; max-width: 94vw;
  box-shadow: 0 8px 40px rgba(0,0,0,.2);
}
.memo-modal-hd { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
.memo-field { margin-bottom: 13px; }
.memo-field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); margin-bottom: 5px; }
.memo-field input, .memo-field textarea {
  width: 100%; padding: 8px 10px; border: 1px solid var(--border);
  border-radius: 7px; font-size: 13px; outline: none;
  transition: border-color .13s; box-sizing: border-box; font-family: inherit;
}
.memo-field input:focus, .memo-field textarea:focus { border-color: var(--primary); }
.memo-field textarea { resize: vertical; min-height: 70px; }
.memo-modal-btns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; }

/* card 패딩 오버라이드 */
.card { padding: 12px 9px; }

/* readability override */
body { font-family: 'Pretendard','Noto Sans KR','Segoe UI',sans-serif; }
.kpi-card-val { font-family: 'Segoe UI','Noto Sans KR',sans-serif; font-variant-numeric: tabular-nums; }
.r-table, .kpi-card-lbl, .kpi-card-sub, .tag-item, .period-btn, .tb-label { font-variant-numeric: tabular-nums; }
</style>
<body>
<div class="page-wrap">


  <!-- KPI 카드 행 (상단) -->
  <div id="kpiWrap" style="flex-shrink:0;display:none">
    <div class="kpi-cards" id="kpiCards" style="margin-bottom:6px"></div>
  </div>
  <!-- 설비 탭 + KPI 토글 (같은 행) -->
  <div class="equip-tabs" style="margin-bottom:10px;flex-shrink:0">
    <span style="font-size:11px;font-weight:700;color:var(--muted);align-self:center;margin-right:4px">설비</span>
    <button class="equip-btn active" onclick="setEquip('ALL',this)">ALL</button>
    <button class="equip-btn" onclick="setEquip('BCF1',this)">BCF1</button>
    <button class="equip-btn" onclick="setEquip('BCF2',this)">BCF2</button>
    <button class="equip-btn" onclick="setEquip('BCF3',this)">BCF3</button>
    <button class="equip-btn" onclick="setEquip('BCF4',this)">BCF4</button>
    <button class="equip-btn" onclick="setEquip('BCF5',this)">BCF5</button>
    <button class="equip-btn" onclick="setEquip('BCF6',this)">BCF6</button>
    <button class="equip-btn" onclick="setEquip('BCF7',this)">BCF7</button>
    <button class="equip-btn" onclick="setEquip('BCF8',this)">BCF8</button>
    <button class="equip-btn" onclick="setEquip('BCF9',this)">BCF9</button>
    <button class="equip-btn" onclick="setEquip('BCF10',this)">BCF10</button>
    <button class="equip-btn" onclick="setEquip('BCF11',this)">BCF11</button>
    <button class="equip-btn" onclick="setEquip('BCF12',this)">BCF12</button>
    <button id="kpiToggleBtn" onclick="toggleKpi()"
      style="margin-left:auto;padding:2px 10px;border-radius:6px;border:1px solid var(--border);
             background:var(--white);font-size:11px;font-weight:700;color:var(--muted);
             cursor:pointer;transition:all .13s;white-space:nowrap"
      onmouseover="this.style.borderColor='var(--primary)';this.style.color='var(--primary)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">
      ▼ KPI 펼치기
    </button>
  </div>

  <div class="trend-layout">

    <!-- ══ 좌측 태그 패널 ══ -->
    <div class="tag-panel">
      <div class="card">
        <!-- 탭 -->
        <div class="panel-tabs">
          <button class="panel-tab active" id="tabTag" onclick="switchPanelTab('tag')">태그 선택</button>
          <button class="panel-tab" id="tabLot" onclick="switchPanelTab('lot')">🔍 로트 검색</button>
        </div>

        <!-- 태그 뷰 -->
        <div id="tagView" style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden">
          <input class="tag-search" id="tagSearch" placeholder="태그 검색..." oninput="filterTags()">
          <div style="display:flex;gap:6px;margin:8px 0;flex-shrink:0">
            <button class="btn-outline btn-sm" onclick="selectAll(true)">전체 선택</button>
            <button class="btn-outline btn-sm" onclick="selectAll(false)">전체 해제</button>
          </div>
          <div class="tag-list" id="tagList">
            <div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">로딩 중…</div>
          </div>
        </div>

        <!-- 로트 검색 뷰 -->
        <div id="lotView" style="display:none;flex-direction:column;flex:1;min-height:0;overflow:hidden">
          <div class="lot-ctrl">
            <input type="date" class="lot-date" id="lotDate">
            <button class="lot-load-btn" onclick="loadLotList()">조회</button>
          </div>
          <div class="lot-list" id="lotList">
            <div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">조회 버튼을 누르세요</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ 우측 차트 패널 ══ -->
    <div class="chart-panel">

      <!-- 툴바 -->
      <div class="toolbar-box">
        <button class="period-btn" onclick="setPeriod('1h',this)">1시간</button>
        <button class="period-btn active" onclick="setPeriod('6h',this)">6시간</button>
        <button class="period-btn" onclick="setPeriod('24h',this)">24시간</button>
        <button class="period-btn" onclick="setPeriod('3d',this)">3일</button>
        <button class="period-btn" onclick="setPeriod('7d',this)">7일</button>
        <div class="tb-sep"></div>
        <span class="tb-label">FROM</span>
        <input class="dt-input" type="datetime-local" id="fromTime">
        <span class="tb-label">TO</span>
        <input class="dt-input" type="datetime-local" id="toTime">
        <button class="period-btn" onclick="applyCustomRange()" style="background:var(--primary);color:#fff;border-color:var(--primary)">적용</button>
        <div class="tb-sep"></div>
        <span class="live-badge" id="liveBadge">
          <span class="live-dot"></span>
          LIVE
          <svg id="liveGauge" width="24" height="24" style="transform:rotate(-90deg)">
            <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(56,161,105,.2)" stroke-width="2.5"/>
            <circle id="liveArc" cx="12" cy="12" r="9" fill="none" stroke="#38A169" stroke-width="2.5"
              stroke-dasharray="56.5" stroke-dashoffset="0" stroke-linecap="round"
              style="transition:stroke-dashoffset .9s linear"/>
          </svg>
        </span>
        <button class="btn-primary" onclick="reloadChart()">↺ 갱신</button>
        <button class="btn-outline btn-sm" onclick="openMemoModal()" style="border-color:rgba(128,90,213,.5);color:#553C9A" data-perm="add">+ 메모</button>
        <button class="btn-outline btn-sm" onclick="saveChartPng()" title="차트 PNG 캡쳐" style="border-color:rgba(59,130,246,.5);color:#1D4ED8">&#128247; 캡쳐</button>
        <button class="btn-outline btn-sm" onclick="saveChartXls()" title="엑셀 저장" style="border-color:rgba(34,197,94,.5);color:#166534">&#128202; 엑셀</button>
        <span style="margin-left:auto;font-size:11px;color:var(--muted)" id="periodLabel">최근 24시간</span>
      </div>

      <!-- 작업지시 바 -->
      <div class="jacup-bar" id="jacupBar"></div>

      <!-- 메모 바 -->
      <div class="memo-bar" id="memoBar"></div>

      <!-- 메인 차트 -->
      <div class="chart-box" id="mainChartBox">
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-bottom:6px;flex-shrink:0">
          <span class="alt-hint">Alt+드래그 → 범위 평균</span>
          <button class="btn-zoom-reset" id="btnZoomReset" onclick="resetZoom()">줌 초기화</button>
        </div>
        <div id="mainChart" style="flex:1;min-height:200px"></div>
        <div class="refresh-bar"><div class="refresh-bar-inner" id="refreshBar"></div></div>
      </div>

    </div>
  </div>
</div>

<!-- 메모 추가 모달 -->
<div class="memo-overlay" id="memoOverlay" onclick="if(event.target===this)closeMemoModal()">
  <div class="memo-modal">
    <div class="memo-modal-hd">메모 추가</div>
    <div class="memo-field">
      <label>시간</label>
      <input type="datetime-local" id="memoTimeVal" step="1">
    </div>
    <div class="memo-field">
      <label>제목 <span style="color:var(--muted);font-weight:400">(최대 10자)</span></label>
      <input type="text" id="memoName" maxlength="10" placeholder="메모 제목을 입력하세요"
             onkeydown="if(event.key==='Enter')saveMemo()">
    </div>
    <div class="memo-field">
      <label>내용 <span style="color:var(--muted);font-weight:400">(최대 100자)</span></label>
      <textarea id="memoDesc" maxlength="100" placeholder="메모 내용을 입력하세요 (선택)"></textarea>
    </div>
    <div class="memo-modal-btns">
      <button class="btn-outline btn-sm" onclick="closeMemoModal()">취소</button>
      <button class="btn-primary btn-sm" onclick="saveMemo()">저장</button>
    </div>
  </div>
</div>

<script>
var base = '${pageContext.request.contextPath}';
</script>
<script src="${pageContext.request.contextPath}/js/html2canvas.min.js"></script>
<script src="${pageContext.request.contextPath}/js/highchart/highcharts.js"></script>
<script src="${pageContext.request.contextPath}/js/highchart/exporting.js"></script>
<script src="${pageContext.request.contextPath}/js/highchart/offline-exporting.js"></script>
<script src="${pageContext.request.contextPath}/js/highchart/export-data.js"></script>
<script>
var tags       = [];
var selTags    = {};
var curEquip   = 'ALL';
var tagColorMap = {}; // colName → 고정 색상 (BCF6/BCF11 제외)
var curPeriod  = '6h';
var isCustom   = false;
var mainChart  = null;
var countdown  = 15;
var countTimer = null;
var memos      = [];
var memoVisible = {};
var curFrom    = '';
var curTo      = '';
var jacups      = [];
var jacupVisible = {};
var chartRows    = [];

var EQUT_MAP = {
  'BCF1': '2420M001', 'BCF2': '2420M002', 'BCF3': '2420M003',
  'BCF4': '2420M004', 'BCF5': '2420M005', 'BCF6': '2420M011',
  'BCF7': '2420M006', 'BCF8': '2420M007', 'BCF9': '2420M008',
  'BCF10': '2420M009', 'BCF11': '2420M010', 'BCF12': '2421M002'
};

var COLORS = [
  '#60A5FA','#F87171','#4ADE80','#FBBF24',
  '#A78BFA','#22D3EE','#F472B6','#FDE047',
  '#93C5FD','#86EFAC','#C084FC','#2DD4BF'
];

var PERIOD_LABEL = {'1h':'최근 1시간','6h':'최근 6시간','24h':'최근 24시간','3d':'최근 3일','7d':'최근 7일'};
var PERIOD_MS    = {'1h':3600000,'6h':21600000,'24h':86400000,'3d':259200000,'7d':604800000};

/* ── 태그의 설비 반환 (equipId 필드 우선, 없으면 tagName 파싱) ── */
function getEquipFromTag(t) {
  if (t.equipId) return t.equipId;
  var name = t.tagName || '';
  var m = name.toUpperCase().match(/BCF[_\-](\d+)/);
  if (!m) m = name.toUpperCase().match(/BCF(\d+)/);
  return m ? 'BCF' + m[1] : null;
}

/* ── Highcharts 전역 설정 ── */
Highcharts.setOptions({
  lang: {
    loading:'로딩 중…', noData:'데이터 없음',
    resetZoom:'줌 초기화', resetZoomTitle:'줌 초기화',
    months:['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
    shortMonths:['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
    weekdays:['일','월','화','수','목','금','토']
  },
  global: { useUTC: false }
});

/* ── 날짜 유틸 ── */
function toLocalInput(dt) {
  var p = function(n){ return String(n).padStart(2,'0'); };
  return dt.getFullYear()+'-'+p(dt.getMonth()+1)+'-'+p(dt.getDate())
       +'T'+p(dt.getHours())+':'+p(dt.getMinutes());
}
function toSqlDateTime(dt) {
  var p = function(n){ return String(n).padStart(2,'0'); };
  return dt.getFullYear()+'-'+p(dt.getMonth()+1)+'-'+p(dt.getDate())
       +' '+p(dt.getHours())+':'+p(dt.getMinutes())+':00';
}
function parseTs(v) {
  if (!v) return null;
  if (typeof v === 'number') return v > 100000000000 ? v : v * 1000;
  var s = typeof v === 'string' ? (v.includes('T') ? v : v.replace(' ','T')) : null;
  if (!s) return null;
  var t = Date.parse(s);
  return isNaN(t) ? null : t;
}
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── refresh bar ── */
var rafId = null;
function animateRefreshBar(ms) {
  var bar = document.getElementById('refreshBar');
  var start = null;
  if (rafId) cancelAnimationFrame(rafId);
  function step(ts) {
    if (!start) start = ts;
    var pct = Math.min((ts - start) / ms * 100, 100);
    bar.style.width = pct + '%';
    if (pct < 100) rafId = requestAnimationFrame(step);
  }
  bar.style.width = '0%';
  rafId = requestAnimationFrame(step);
}

/* ── 실시간 카운트다운 (원형 게이지) ── */
var CIRC = 2 * Math.PI * 9;   // r=9 → 약 56.5
function setGaugeOffset(pct) {  // pct: 1.0=꽉참, 0=빔
  var arc = document.getElementById('liveArc');
  if (arc) arc.style.strokeDashoffset = (CIRC * (1 - pct)).toFixed(2);
}
function startCountdown() {
  if (countTimer) clearInterval(countTimer);
  countdown = 15;
  setGaugeOffset(1);
  countTimer = setInterval(function() {
    countdown--;
    setGaugeOffset(countdown / 15);
    if (countdown <= 0) {
      countdown = 15;
      setGaugeOffset(1);
      if (!isCustom) reloadChart();
    }
  }, 1000);
}

/* ── FROM/TO 초기화 ── */
function initRange() {
  var now  = new Date();
  var from = new Date(now.getTime() - PERIOD_MS[curPeriod]);
  document.getElementById('fromTime').value = toLocalInput(from);
  document.getElementById('toTime').value   = toLocalInput(now);
  // 로트 날짜 기본값: 오늘
  var p = function(n){ return String(n).padStart(2,'0'); };
  document.getElementById('lotDate').value =
    now.getFullYear() + '-' + p(now.getMonth()+1) + '-' + p(now.getDate());
}

/* ── 태그 로드 ── */
function loadTags() {
  console.log('[trend] loadTags()');
  fetch(base + '/temp/cols')
    .then(function(r){ return r.json(); })
    .then(function(d){
      console.log('[trend] /temp/cols response', d);
      tags = Array.isArray(d) ? d : [];
      if (!tags.length) { loadDemoChart(); return; }
      buildTagColorMap();
      initDefaultSelection();
      renderTagList();
      reloadChart();
    })
    .catch(function(){
      loadDemoChart();
    });
}

/* ── 태그 없을 때 빈 안내 ── */
function loadDemoChart() {
  document.getElementById('tagList').innerHTML =
    '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">등록된 태그가 없습니다.<br>태그 관리 페이지에서 태그를 먼저 등록하세요.</div>';
  document.getElementById('kpiCards').innerHTML = '';
  if (mainChart) { mainChart.destroy(); mainChart = null; }
  startCountdown();
}
/* ── 기본 선택 태그 판별: SP/CP 제외 전체 선택 ── */
function isDefaultTag(t) {
  var name = ((t.trendName || t.tagName || t.colName) + '').toLowerCase();
  var segs = name.split(/[\s\-_]+/);
  return !segs.some(function(s){ return s === 'sp'; });
}

function applyDefaultSel(equipId) {
  Object.keys(selTags).forEach(function(k){ selTags[k] = false; });
  tags.forEach(function(t){
    if (getEquipFromTag(t) === equipId) selTags[t.colName] = isDefaultTag(t);
  });
  // 매칭 태그가 하나도 없으면 첫 2개 fallback
  var hasSel = tags.some(function(t){ return selTags[t.colName]; });
  if (!hasSel) {
    var cnt = 0;
    tags.forEach(function(t){
      if (getEquipFromTag(t) === equipId && cnt < 2) { selTags[t.colName] = true; cnt++; }
    });
  }
}

function initDefaultSelection() {
  var firstEquip = null;
  tags.forEach(function(t){
    var eq = getEquipFromTag(t);
    if (eq && !firstEquip) firstEquip = eq;
  });

  curEquip = firstEquip || 'ALL';
  document.querySelectorAll('.equip-btn').forEach(function(b){ b.classList.remove('active'); });
  var targetBtn = document.querySelector('.equip-btn[onclick*="\''+curEquip+'\'"]');
  if (!targetBtn) targetBtn = document.querySelector('.equip-btn');
  if (targetBtn) targetBtn.classList.add('active');

  if (curEquip !== 'ALL') {
    applyDefaultSel(curEquip);
  }
}

/* ── 설비 필터 ── */
function setEquip(eq, btn) {
  curEquip = eq;
  document.querySelectorAll('.equip-btn').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');

  if (eq === 'ALL') {
    Object.keys(selTags).forEach(function(k){ selTags[k] = false; });
    var firstEquip = null;
    tags.forEach(function(t){
      var teq = getEquipFromTag(t);
      if (teq && !firstEquip) firstEquip = teq;
    });
    if (firstEquip) applyDefaultSel(firstEquip);
  } else {
    applyDefaultSel(eq);
  }
  renderTagList();
  reloadChart();
}

/* ── 태그 목록 렌더 ── */
function renderTagList() {
  if (!tags.length) {
    document.getElementById('tagList').innerHTML =
      '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">등록된 태그 없음</div>';
    return;
  }
  var q = (document.getElementById('tagSearch').value || '').toLowerCase();
  var html = '';
  var sortedTags = tags.slice().sort(function(a, b) {
    var aN = (a.colName || a.tagName || '').toLowerCase();
    var bN = (b.colName || b.tagName || '').toLowerCase();
    var aP = /pv/.test(aN) ? 0 : 1;
    var bP = /pv/.test(bN) ? 0 : 1;
    return aP - bP;
  });
  sortedTags.forEach(function(t, i) {
    var displayName = t.trendName || t.tagName || t.colName;
    var subName     = t.colName || t.tagName;
    var teq  = getEquipFromTag(t);
    // 설비 필터
    if (curEquip !== 'ALL' && teq !== curEquip) return;
    // 11_kg 숨김
    var tn = (t.colName || t.tagName || '').toLowerCase();
    if (/11.*kg|kg.*11/.test(tn) || tn.indexOf('11_kg') !== -1) return;
    // 검색 필터
    if (q && !displayName.toLowerCase().includes(q) && !subName.toLowerCase().includes(q) && !(t.address||'').toLowerCase().includes(q)) return;
    var isSel = selTags[t.colName];
    var color = tagColor(t);
    html += '<div class="tag-item'+(isSel?' sel':'')+'" id="ti_'+t.colName+'"'
          + ' onclick="toggleTag(\''+t.colName+'\')">'
          + '<div class="tag-dot" style="background:'+color+'"></div>'
          + '<div style="flex:1;min-width:0">'
          + '  <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(displayName)+'</div>'
          + '  <div style="font-size:10px;color:var(--muted)">'+esc(subName)+'</div>'
          + '</div></div>';
  });
  document.getElementById('tagList').innerHTML = html ||
    '<div style="text-align:center;padding:10px;color:var(--muted);font-size:12px">태그 없음</div>';
}

function filterTags() { renderTagList(); }

function toggleTag(colName) {
  selTags[colName] = !selTags[colName];
  var el = document.getElementById('ti_'+colName);
  if (el) el.classList.toggle('sel', selTags[colName]);
  reloadChart();
}

function selectAll(v) {
  tags.forEach(function(t) {
    var teq = getEquipFromTag(t);
    if (curEquip === 'ALL' || teq === curEquip) selTags[t.colName] = v;
  });
  renderTagList();
  reloadChart();
}

/* ── 기간 선택 ── */
function setPeriod(p, btn) {
  curPeriod = p; isCustom = false;
  document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  document.getElementById('periodLabel').textContent = PERIOD_LABEL[p];
  var now  = new Date();
  var from = new Date(now.getTime() - PERIOD_MS[p]);
  document.getElementById('fromTime').value = toLocalInput(from);
  document.getElementById('toTime').value   = toLocalInput(now);
  reloadChart();
}

function applyCustomRange() {
  isCustom = true;
  document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.remove('active'); });
  var fv = document.getElementById('fromTime').value;
  var tv = document.getElementById('toTime').value;
  if (!fv || !tv) return;
  document.getElementById('periodLabel').textContent = fv.replace('T',' ').slice(0,16) + ' ~ ' + tv.replace('T',' ').slice(0,16);
  reloadChart();
}

/* ── 데이터 조회 & 차트 ── */
function reloadChart() {
  var selList = tags.filter(function(t){
    if (!selTags[t.colName]) return false;
    var n = (t.colName || t.tagName || '').toLowerCase();
    if (/11.*kg|kg.*11/.test(n) || n.indexOf('11_kg') !== -1) return false;
    return true;
  });
  console.log('[trend] reloadChart()', { selCount: selList.length, curEquip: curEquip, curPeriod: curPeriod, isCustom: isCustom });

  if (!selList.length) {
    if (mainChart){ mainChart.destroy(); mainChart = null; }
    document.getElementById('mainChart').innerHTML =
      '<div style="text-align:center;padding:80px 0;color:var(--muted);font-size:13px">좌측에서 태그를 선택하세요</div>';
    document.getElementById('kpiCards').innerHTML = '';
    return;
  }

  var fromStr, toStr;
  if (isCustom) {
    var fv = document.getElementById('fromTime').value;
    var tv = document.getElementById('toTime').value;
    if (!fv || !tv) return;
    fromStr = toSqlDateTime(new Date(fv));
    toStr   = toSqlDateTime(new Date(tv));
  } else {
    var now  = new Date();
    var from = new Date(now.getTime() - PERIOD_MS[curPeriod]);
    fromStr  = toSqlDateTime(from);
    toStr    = toSqlDateTime(now);
  }

  curFrom = fromStr;
  curTo   = toStr;
  console.log('[trend] range', { from: fromStr, to: toStr });
  animateRefreshBar(800);

  fetch(base + '/temp/snapshot/range?from=' + encodeURIComponent(fromStr) + '&to=' + encodeURIComponent(toStr))
    .then(function(r){
      console.log('[trend] /temp/snapshot/range status', r.status);
      return r.json();
    })
    .then(function(rows){
      console.log('[trend] /temp/snapshot/range rows', rows ? rows.length : rows, rows && rows[0]);
      if (!Array.isArray(rows)) rows = [];
      chartRows = rows;
      buildKpiCards(selList, rows);
      buildMainChart(selList, rows);
      loadMemos(curFrom, curTo);
      loadJacupAnnotations(curFrom, curTo);
      if (!isCustom) startCountdown();
    })
    .catch(function(){
      document.getElementById('mainChart').innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--red);font-size:13px">데이터 로드 실패</div>';
    });
}

/* ── KPI 카드 (상단) ── */

function getSnapshotKey(t) {
  if (!t) return null;
  var base = t.colName || t.tagName;
  if (!base) return null;
  var tid = (t.tempId != null) ? String(t.tempId) : '';
  if (tid && base.indexOf(tid + '-') === 0) return base;
  return tid ? (tid + '-' + base) : base;
}

function getSnapshotValue(row, t) {
  if (!row || !t) return NaN;
  var col  = t.colName || null;
  var name = t.tagName || null;
  var key1 = col;
  var key2 = name;
  var key3 = getSnapshotKey(t);
  var key4 = (t.tempId != null && name) ? (String(t.tempId) + '-' + name) : null;
  if (key1 && Object.prototype.hasOwnProperty.call(row, key1)) return row[key1];
  if (key2 && Object.prototype.hasOwnProperty.call(row, key2)) return row[key2];
  if (key3 && Object.prototype.hasOwnProperty.call(row, key3)) return row[key3];
  if (key4 && Object.prototype.hasOwnProperty.call(row, key4)) return row[key4];
  return NaN;
}
function buildKpiCards(selList, rows) {
  var html = '';
  selList.forEach(function(t, i) {
    var isFlow = isFlowTag(t);
    var vals = rows.map(function(row){
      var v = parseFloat(getSnapshotValue(row, t));
      var kpiTagName = (t.trendName || t.tagName || t.colName || '').toLowerCase();
      if (isFlow && !isNaN(v)) {
        if (v > 30000) { v = NaN; }
        else {
          var kpiBcf5 = /[_\-]5([_\-]|$)/.test(kpiTagName);
          var kpiBcf7 = /[_\-]7([_\-]|$)/.test(kpiTagName);
          var kpiBcf8 = /[_\-]8([_\-]|$)/.test(kpiTagName);
          var kpiBcf9 = /[_\-]9([_\-]|$)/.test(kpiTagName);
          var kpiBcf10 = /[_\-]10([_\-]|$)/.test(kpiTagName);
          var kpiBcf11 = /[_\-]11([_\-]|$)/.test(kpiTagName);
          var kpiBcf2  = /[_\-]2([_\-]|$)/.test(kpiTagName);
          var kpiBcf6  = /[_\-]6([_\-]|$)/.test(kpiTagName);
          var kpiBcf12 = /[_\-]12([_\-]|$)/.test(kpiTagName);
          v = /c3h8/.test(kpiTagName) ? (kpiBcf7 ? v / 200 : (kpiBcf5 || kpiBcf8 || kpiBcf10 || kpiBcf11) ? v * 0.00125 : kpiBcf9 ? v * 0.0049 : kpiBcf12 ? v * 0.1 : kpiBcf2 ? v * 0.00152 : kpiBcf6 ? v * 0.01 : (v / 1000) * 3.1) : (v >= 1000 ? v / 1000 : v / 100);
        }
      }
      if (!isNaN(v) && /cp.*pv|pv.*cp/.test(kpiTagName) && /[_\-]7([_\-]|$)|[_\-]9([_\-]|$)/.test(kpiTagName)) {
        v = v * 2;
      }
      if (!isNaN(v) && /cp.*pv|pv.*cp/.test(kpiTagName) && /[_\-]6([_\-]|$)/.test(kpiTagName)) {
        v = v * 0.001;
      }
      if (!isNaN(v) && /유조.*pv|pv.*유조|침탄.*pv|pv.*침탄/.test(kpiTagName) && /[_\-]8([_\-]|$)/.test(kpiTagName)) {
        v = v / 10;
      }
      if (!isNaN(v) && /유조.*sp|sp.*유조|침탄.*sp|sp.*침탄/.test(kpiTagName) && /[_\-]8([_\-]|$)/.test(kpiTagName)) {
        v = v / 10;
      }
      if (!isNaN(v) && /유조.*sp|sp.*유조/.test(kpiTagName) && /[_\-]9([_\-]|$)/.test(kpiTagName)) {
        v = v + 9;
      }
      if (!isNaN(v) && /cp.*pv|pv.*cp/.test(kpiTagName) && /[_\-]9([_\-]|$)/.test(kpiTagName) && v >= 60) {
        v = 0;
      }
      if (!isNaN(v) && /nh3/.test(kpiTagName) && /[_\-]9([_\-]|$)/.test(kpiTagName)) {
        v = v / 100;
      }
      if (!isNaN(v) && /nh3/.test(kpiTagName) && /[_\-]10([_\-]|$)/.test(kpiTagName)) {
        v = v / 10;
      }
      if (!isNaN(v) && /유조.*온도|온도.*유조/.test(kpiTagName) && /[_\-]9([_\-]|$)/.test(kpiTagName)) {
        v = v - 9;
      }
      if (!isNaN(v) && /유조.*온도|온도.*유조/.test(kpiTagName) && /[_\-]7([_\-]|$)/.test(kpiTagName)) {
        v = v + 8;
      }
      return v;
    }).filter(function(v){ return !isNaN(v); });

    var color  = tagColor(t);
    var name   = esc(t.trendName || t.tagName || t.colName);
    var cp     = !isFlow && isCpTag(t);
    var dec    = cp ? 3 : (isFlow ? 2 : 1);

    if (!vals.length) {
      html += '<div class="kpi-card" style="border-top-color:'+color+'">'
            + '<div class="kpi-card-lbl" title="'+name+'">'+name+'</div>'
            + '<div class="kpi-card-val" style="color:var(--muted)">N/A</div>'
            + '</div>';
      return;
    }
    var last = vals[vals.length - 1];
    var sum  = vals.reduce(function(a,b){return a+b;},0);
    var avg  = sum / vals.length;
    var mn   = Math.min.apply(null, vals);
    var mx   = Math.max.apply(null, vals);

    html += '<div class="kpi-card" style="border-top-color:'+color+'">'
          + '<div class="kpi-card-lbl" title="'+name+'">'+name+'</div>'
          + '<div class="kpi-card-val" style="color:'+color+'">'+last.toFixed(dec)+'</div>'
          + '<div class="kpi-card-sub">'
          + '  <span>avg <b>'+avg.toFixed(dec)+'</b></span>'
          + '  <span class="kpi-sub-mn">↓'+mn.toFixed(dec)+'</span>'
          + '  <span class="kpi-sub-mx">↑'+mx.toFixed(dec)+'</span>'
          + '</div>'
          + '</div>';
  });
  document.getElementById('kpiCards').innerHTML = html;
}

/* ── CP 태그 판별 ── */
function isCpTag(t) {
  var name = (t.trendName || t.tagName || t.colName || '').toLowerCase();
  return name.split(/[_\s]+/).indexOf('cp') !== -1 || /cp.*pv|pv.*cp/.test(name);
}

/* ── 유량 태그 판별 (tagName/trendName/colName 에 유량 관련 키워드 포함) ── */
function isFlowTag(t) {
  var name = (t.trendName || t.tagName || t.colName || '').toLowerCase();
  return /flow|gas|유량|n2|nh3|rx|flw|air|c3h8/.test(name);
}

/* ── SP 태그 판별 ── */
function isSpTag(t) {
  var name = (t.trendName || t.tagName || t.colName || '').toLowerCase();
  return name.split(/[_\s]+/).indexOf('sp') !== -1;
}

/* ── 메인 차트 ── */
function buildMainChart(selList, rows) {
  var series = selList.map(function(t, i) {
    var color  = tagColor(t);
    var isFlow = isFlowTag(t);
    var isCp   = !isFlow && isCpTag(t);
    var isSp   = isSpTag(t);
    var isC3h8 = isFlow && /c3h8/.test((t.trendName || t.tagName || t.colName || '').toLowerCase());
    var data = [];
    rows.forEach(function(row) {
      var ts = parseTs(row.record_time || row.recordTime);
      if (!ts) return;
      var v = parseFloat(getSnapshotValue(row, t));
      var tName = (t.trendName || t.tagName || t.colName || '').toLowerCase();
      if (isFlow && !isNaN(v)) {
        if (v > 30000) return;
        var isBcf5 = /[_\-]5([_\-]|$)/.test(tName);
        var isBcf7 = /[_\-]7([_\-]|$)/.test(tName);
        var isBcf8 = /[_\-]8([_\-]|$)/.test(tName);
        var isBcf9 = /[_\-]9([_\-]|$)/.test(tName);
        var isBcf10 = /[_\-]10([_\-]|$)/.test(tName);
        var isBcf11 = /[_\-]11([_\-]|$)/.test(tName);
        var isBcf2  = /[_\-]2([_\-]|$)/.test(tName);
        var isBcf6  = /[_\-]6([_\-]|$)/.test(tName);
        var isBcf12 = /[_\-]12([_\-]|$)/.test(tName);
        v = /c3h8/.test(tName) ? (isBcf7 ? v / 200 : (isBcf5 || isBcf8 || isBcf10 || isBcf11) ? v * 0.00125 : isBcf9 ? v * 0.0049 : isBcf12 ? v * 0.1 : isBcf2 ? v * 0.00152 : isBcf6 ? v * 0.01 : (v / 1000) * 3.1) : (v >= 1000 ? v / 1000 : v / 100);
      }
      if (!isNaN(v) && /cp.*pv|pv.*cp/.test(tName) && /[_\-]7([_\-]|$)|[_\-]9([_\-]|$)/.test(tName)) {
        v = v * 2;
      }
      if (!isNaN(v) && /cp.*pv|pv.*cp/.test(tName) && /[_\-]6([_\-]|$)/.test(tName)) {
        v = v * 0.001;
      }
      if (!isNaN(v) && /유조.*pv|pv.*유조|침탄.*pv|pv.*침탄/.test(tName) && /[_\-]8([_\-]|$)/.test(tName)) {
        v = v / 10;
      }
      if (!isNaN(v) && /유조.*sp|sp.*유조|침탄.*sp|sp.*침탄/.test(tName) && /[_\-]8([_\-]|$)/.test(tName)) {
        v = v / 10;
      }
      if (!isNaN(v) && /유조.*sp|sp.*유조/.test(tName) && /[_\-]9([_\-]|$)/.test(tName)) {
        v = v + 9;
      }
      if (!isNaN(v) && /cp.*pv|pv.*cp/.test(tName) && /[_\-]9([_\-]|$)/.test(tName) && v >= 60) {
        v = 0;
      }
      if (!isNaN(v) && /nh3/.test(tName) && /[_\-]9([_\-]|$)/.test(tName)) {
        v = v / 100;
      }
      if (!isNaN(v) && /nh3/.test(tName) && /[_\-]10([_\-]|$)/.test(tName)) {
        v = v / 10;
      }
      if (!isNaN(v) && /유조.*온도|온도.*유조/.test(tName) && /[_\-]9([_\-]|$)/.test(tName)) {
        v = v - 9;
      }
      if (!isNaN(v) && /유조.*온도|온도.*유조/.test(tName) && /[_\-]7([_\-]|$)/.test(tName)) {
        v = v + 8;
      }
      if (!isNaN(v)) data.push([ts, v]);
    });
    return {
      name: t.trendName || t.tagName || t.colName,
      data: data, color: color, lineWidth: 2,
      yAxis: isC3h8 ? 2 : ((isFlow || isCp) ? 1 : 0),
      isCp: isCp, isFlow: isFlow,
      dashStyle: isSp ? 'Dash' : 'Solid',
      marker: { enabled: data.length < 80, radius: 3 },
      states: { hover: { lineWidth: 3 } }
    };
  });

  document.getElementById('btnZoomReset').classList.remove('visible');

  var yAxisCfg = [
    { min: 0, max: 1000, tickInterval: 50,  endOnTick: false, maxPadding: 0 },
    { min: 0, max: 2.0,  tickInterval: 0.1, endOnTick: false, maxPadding: 0 },
    { min: 0, max: 10,   tickInterval: 1,   endOnTick: false, maxPadding: 0 }
  ];

  if (mainChart) {
    mainChart.update({ series: series, yAxis: yAxisCfg }, true, true);
    attachAltDragAvg(selList, rows);
    applyJacupToChart();
    return;
  }

  mainChart = Highcharts.chart('mainChart', {
    chart: {
      type: 'spline', animation: false,
      zoomType: 'x',
      backgroundColor: '#141c2e',
      plotBackgroundColor: '#0e1623',
      panning: { enabled: true, type: 'x' }, panKey: 'shift',
      style: { fontFamily:"'Segoe UI','Malgun Gothic',sans-serif" },
      height: null,
      clip: true,
      events: {
        selection: function(){ document.getElementById('btnZoomReset').classList.add('visible'); }
      },
      resetZoomButton: { theme: { display: 'none' } }
    },
    title: { text: null },
    xAxis: {
      type: 'datetime',
      lineColor: '#2d3d5a',
      tickColor: '#2d3d5a',
      gridLineColor: '#1a2840',
      labels: { format: '{value:%m/%d %H:%M}', style: { fontSize:'11px', color:'#8899bb' } },
      crosshair: { color: 'rgba(96,165,250,.4)' }
    },
    yAxis: yAxisCfg.map(function(cfg, i) {
      var base = {
        title: { text: null },
        gridLineColor: i === 0 ? '#1a2840' : 'transparent',
        opposite: i !== 0
      };
      if (i === 0)      base.labels = { format: '{value}',     style: { fontSize:'10px', color:'#8899bb' } };
      else if (i === 1) base.labels = { format: '{value:.2f}', style: { fontSize:'10px', color:'#4ADE80' } };
      else              base.labels = { format: '{value:.1f}', style: { fontSize:'10px', color:'#22D3EE' } };
      return Object.assign({}, cfg, base);
    }),
    tooltip: {
      shared: true,
      backgroundColor: '#0d1628',
      borderColor: '#2d3d5a',
      borderRadius: 8,
      style: { color: '#d0ddf0' },
      formatter: function() {
        var s = '<span style="font-size:10px;color:#8899bb">'
              + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x)
              + '</span><br/>';
        this.points.forEach(function(p) {
          var dec = p.series.options.isCp ? 3 : (p.series.options.isFlow ? 2 : 1);
          s += '<span style="color:' + p.series.color + '">●</span> '
             + p.series.name + ': <b>' + p.y.toFixed(dec) + '</b><br/>';
        });
        return s;
      }
    },
    legend: {
      enabled: true,
      backgroundColor: 'transparent',
      itemStyle: { fontSize:'12px', fontWeight:'600', color:'#c0cde0' },
      itemHoverStyle: { color:'#ffffff' }
    },
    plotOptions: { spline: { turboThreshold: 10000 } },
    exporting: {
      enabled: true,
      fallbackToExportServer: false,
      buttons: { contextButton: { menuItems: ['downloadPNG','downloadSVG','separator','downloadCSV','downloadXLS'] } }
    },
    credits: { enabled: false },
    series: series
  });

  attachAltDragAvg(selList, rows);

  // flex 컨테이너 높이 변화 반영
  setTimeout(function(){ if(mainChart) mainChart.reflow(); }, 50);
}

/* ── KPI 카드 접기/펼치기 ── */
var kpiOpen = false;
function toggleKpi() {
  kpiOpen = !kpiOpen;
  document.getElementById('kpiWrap').style.display = kpiOpen ? 'block' : 'none';
  document.getElementById('kpiToggleBtn').textContent = kpiOpen ? '▲ KPI 접기' : '▼ KPI 펼치기';
  if (mainChart) mainChart.reflow();
}

/* ── 줌 초기화 ── */
function resetZoom() {
  if (mainChart) mainChart.zoomOut();
  document.getElementById('btnZoomReset').classList.remove('visible');
}

/* ── Alt+드래그 평균 ── */
var avgOverlay = null;
var avgDrag = { active: false, x0: 0, x1: 0 };
var lastAvgSel = [], lastAvgRows = [];

function attachAltDragAvg(selList, rows) {
  lastAvgSel = selList; lastAvgRows = rows;
  var chartEl = document.getElementById('mainChart');

  // 이전 리스너 제거 방지: 클론 교체 대신 플래그
  chartEl.onmousedown = function(e) {
    if (!e.altKey) return;
    e.preventDefault(); e.stopPropagation();
    clearAvgOverlay();
    avgDrag.active = true;
    var rect = chartEl.getBoundingClientRect();
    avgDrag.x0 = e.clientX - rect.left;
    avgDrag.x1 = avgDrag.x0;
    avgOverlay = document.createElement('div');
    avgOverlay.className = 'avg-overlay';
    chartEl.style.position = 'relative';
    chartEl.appendChild(avgOverlay);
    updateAvgOverlayPos(chartEl);
  };

  document.onmousemove = function(e) {
    if (!avgDrag.active) return;
    var rect = chartEl.getBoundingClientRect();
    avgDrag.x1 = e.clientX - rect.left;
    updateAvgOverlayPos(chartEl);
  };

  document.onmouseup = function(e) {
    if (!avgDrag.active) return;
    avgDrag.active = false;
    if (!mainChart) return;
    var x0px = Math.min(avgDrag.x0, avgDrag.x1);
    var x1px = Math.max(avgDrag.x0, avgDrag.x1);
    if (x1px - x0px < 5) { clearAvgOverlay(); return; }
    var t0 = mainChart.xAxis[0].toValue(x0px - mainChart.plotLeft);
    var t1 = mainChart.xAxis[0].toValue(x1px - mainChart.plotLeft);
    showAvgResult(lastAvgSel, lastAvgRows, t0, t1);
  };
}

function updateAvgOverlayPos(chartEl) {
  if (!avgOverlay || !mainChart) return;
  var pl = mainChart.plotLeft, pt = mainChart.plotTop, ph = mainChart.plotHeight;
  var x0 = Math.min(avgDrag.x0, avgDrag.x1);
  var x1 = Math.max(avgDrag.x0, avgDrag.x1);
  avgOverlay.style.cssText = 'position:absolute;background:rgba(49,130,206,.1);border:1px solid rgba(49,130,206,.4);pointer-events:none;z-index:10;'
    + 'left:'+x0+'px;top:'+pt+'px;width:'+(x1-x0)+'px;height:'+ph+'px';
}

function clearAvgOverlay() {
  if (avgOverlay) { avgOverlay.remove(); avgOverlay = null; }
}

function showAvgResult(selList, rows, t0, t1) {
  var inRange = rows.filter(function(row) {
    var ts = parseTs(row.record_time || row.recordTime);
    return ts !== null && ts >= t0 && ts <= t1;
  });
  if (!inRange.length || !avgOverlay) { clearAvgOverlay(); return; }

  var results = selList.map(function(t) {
    var vals = inRange.map(function(row){ return parseFloat(getSnapshotValue(row, t)); }).filter(function(v){ return !isNaN(v); });
    if (!vals.length) return null;
    var sum = vals.reduce(function(a,b){return a+b;},0);
    return { name: t.tagName||t.colName, color: tagColor(t), avg: sum/vals.length,
             min: Math.min.apply(null,vals), max: Math.max.apply(null,vals), cnt: vals.length };
  }).filter(Boolean);

  if (!results.length) { clearAvgOverlay(); return; }

  var html = '<div class="avg-tooltip">'
    + '<div style="font-weight:700;margin-bottom:6px;font-size:12px">Alt-드래그 평균 ('+ inRange.length +'pts)</div>';
  results.forEach(function(r) {
    html += '<div class="avg-tooltip-row">'
      + '<div style="width:8px;height:8px;border-radius:50%;background:'+r.color+';flex-shrink:0"></div>'
      + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px">'+esc(r.name)+'</span>'
      + '<span style="font-weight:700;margin-left:8px;font-family:monospace">'+r.avg.toFixed(2)+'</span>'
      + '</div>';
  });
  html += '<div style="font-size:10px;color:var(--muted);margin-top:6px;border-top:1px solid var(--border);padding-top:4px">'
    + '<span style="cursor:pointer;color:var(--primary)" onclick="clearAvgOverlay()">닫기</span></div></div>';

  avgOverlay.style.pointerEvents = 'auto';
  avgOverlay.innerHTML = html;
}

function tagIdxOf(t) { var i = tags.indexOf(t); return i >= 0 ? i : 0; }

/* 타입별 색상 팔레트 (같은 타입 여러 채널은 순서대로 다른 색) */
var TYPE_PALETTES = {
  ct_pv:   ['#FF1744'],  /* 침탄pv - 형광 빨강 통일 */
  uj_pv:   ['#4ADE80','#22C55E','#86EFAC','#16A34A','#BBF7D0'],  /* 유조pv - 초록 계열 */
  ct_c3h8: ['#A855F7','#9333EA','#C084FC','#7C3AED'],             /* 침탄c3h8 - 보라 계열 */
  c3h8:    ['#F472B6','#EC4899','#FBCFE8','#DB2777'],             /* c3h8 - 분홍 계열 */
  cp_pv:   ['#22D3EE','#06B6D4','#67E8F9','#0891B2']             /* cp pv - 하늘 계열 */
};

function buildTagColorMap() {
  tagColorMap = {};
  var counter  = {};
  var otherIdx = 0;
  tags.forEach(function(t) {
    var equip = getEquipFromTag(t);
    if (equip === 'BCF6' || equip === 'BCF11') return; /* 6/11호기는 별도 처리 유지 */
    var name = (t.trendName || t.tagName || t.colName || '').toLowerCase();
    var group;
    if      (/침탄.*pv|pv.*침탄/.test(name))          group = 'ct_pv';
    else if (/유조.*pv|pv.*유조/.test(name))           group = 'uj_pv';
    else if (/침탄.*c3h8|c3h8.*침탄/.test(name))      group = 'ct_c3h8';
    else if (/c3h8/.test(name))                        group = 'c3h8';
    else if (/cp.*pv|pv.*cp/.test(name))               group = 'cp_pv';
    else                                               group = null;
    if (group) {
      var idx = counter[group] = (counter[group] || 0);
      tagColorMap[t.colName] = TYPE_PALETTES[group][idx % TYPE_PALETTES[group].length];
      counter[group]++;
    } else {
      tagColorMap[t.colName] = COLORS[otherIdx % COLORS.length];
      otherIdx++;
    }
  });
}

function tagColor(t) {
  var equip = getEquipFromTag(t);
  /* BCF11: 태그별 개별 색상 */
  if (equip === 'BCF11') {
    var n11 = (t.trendName || t.tagName || t.colName || '').toLowerCase();
    if (/1실.*온도.*pv|room1.*temp.*pv/.test(n11))  return '#FF1744';  /* 1실 온도 PV - 형광 빨강 */
    if (/2실.*온도.*pv|room2.*temp.*pv/.test(n11))  return '#FF6D00';  /* 2실 온도 PV - 주황 */
    if (/냉각.*pv|cool.*temp.*pv/.test(n11))        return '#FFD600';  /* 냉각실 온도 PV - 노랑 */
    if (/1실.*cp.*pv|room1.*cp.*pv/.test(n11))      return '#00E5FF';  /* 1실 CP PV - 형광 하늘 */
    if (/2실.*cp.*pv|room2.*cp.*pv/.test(n11))      return '#2979FF';  /* 2실 CP PV - 파랑 */
    if (/1실.*온도.*sp|room1.*temp.*sp/.test(n11))  return '#FF80AB';  /* 1실 온도 SP - 핑크 */
    if (/2실.*온도.*sp|room2.*temp.*sp/.test(n11))  return '#FFAB40';  /* 2실 온도 SP - 연주황 */
    if (/냉각.*sp|cool.*temp.*sp/.test(n11))        return '#FFF176';  /* 냉각실 온도 SP - 연노랑 */
    if (/1실.*cp.*sp|room1.*cp.*sp/.test(n11))      return '#80D8FF';  /* 1실 CP SP - 연하늘 */
    if (/2실.*cp.*sp|room2.*cp.*sp/.test(n11))      return '#82B1FF';  /* 2실 CP SP - 연파랑 */
    if (/1실.*c3h8|room1.*c3h8/.test(n11))          return '#00E676';  /* 1실 C3H8 - 형광 초록 */
    if (/2실.*c3h8|room2.*c3h8/.test(n11))          return '#AA00FF';  /* 2실 C3H8 - 보라 */
    return COLORS[tagIdxOf(t) % COLORS.length];
  }
  /* BCF6: 기존 방식 유지 */
  if (equip === 'BCF6') {
    var n6 = (t.trendName || t.tagName || t.colName || '').toLowerCase();
    if (/침탄2.*pv|pv.*침탄2/.test(n6))        return '#00FF7F';
    if (/침탄.*pv|pv.*침탄/.test(n6))          return '#FF1744';
    if (/유조.*pv|pv.*유조/.test(n6))           return '#4ADE80';
    if (/침탄.*c3h8|c3h8.*침탄/.test(n6))      return '#A855F7';
    if (/c3h8/.test(n6))                        return '#F472B6';
    if (/cp.*pv|pv.*cp/.test(n6))               return '#22D3EE';
    return COLORS[tagIdxOf(t) % COLORS.length];
  }
  /* 그 외: 안정적 캐시 색상 */
  if (t && t.colName && tagColorMap[t.colName]) return tagColorMap[t.colName];
  return COLORS[tagIdxOf(t) % COLORS.length];
}

/* ── 패널 탭 전환 ── */
var curPanelTab = 'tag';
function switchPanelTab(tab) {
  curPanelTab = tab;
  document.getElementById('tabTag').classList.toggle('active', tab === 'tag');
  document.getElementById('tabLot').classList.toggle('active', tab === 'lot');
  document.getElementById('tagView').style.display = tab === 'tag' ? 'flex' : 'none';
  var lv = document.getElementById('lotView');
  lv.style.display = tab === 'lot' ? 'flex' : 'none';
  if (tab === 'lot') loadLotList();
}

/* ── 로트 검색 ── */
var lotActiveSel = null;
function loadLotList() {
  var dateEl = document.getElementById('lotDate');
  var d = dateEl.value;
  if (!d) return;
  var from = d + ' 00:00:00';
  var to   = d + ' 23:59:59';
  var equtCd = EQUT_MAP[curEquip] || '';
  document.getElementById('lotList').innerHTML =
    '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">조회 중…</div>';

  fetch(base + '/work/jacup/range?equtCd=' + encodeURIComponent(equtCd)
      + '&from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to))
    .then(function(r){ return r.json(); })
    .then(function(rows){
      renderLotList(rows);
    })
    .catch(function(){
      document.getElementById('lotList').innerHTML =
        '<div style="text-align:center;padding:20px;color:var(--red);font-size:12px">조회 실패</div>';
    });
}

/* DB 컬럼명 대소문자 무관하게 값 꺼내기 */
function lotVal(row, key) {
  return row[key] || row[key.toLowerCase()] || row[key.toUpperCase()] || '';
}
/* 'YYYY-MM-DD HH:mm:ss' → Date (로컬 시간) */
function parseLotDt(s) {
  if (!s) return null;
  var p = s.split(/[\s\-:]/);
  return new Date(+p[0], +p[1]-1, +p[2], +(p[3]||0), +(p[4]||0), +(p[5]||0));
}

function renderLotList(rows) {
  var el = document.getElementById('lotList');
  if (!rows || !rows.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">데이터 없음</div>';
    return;
  }
  var EQUT_REV = {};
  Object.keys(EQUT_MAP).forEach(function(k){ EQUT_REV[EQUT_MAP[k]] = k; });

  var frag = document.createDocumentFragment();
  rows.forEach(function(r, i) {
    var num      = lotVal(r, 'WORK_INDCT_NUM');
    var prodNm   = lotVal(r, 'PROD_NM');
    var prodNum  = lotVal(r, 'PROD_NUM');
    var custNm   = lotVal(r, 'CUST_NM');
    var equtCd   = lotVal(r, 'EQUT_CD');
    var equtTag  = EQUT_REV[equtCd] || equtCd;
    var startRaw = lotVal(r, 'START_DTTM');
    var endRaw   = lotVal(r, 'END_DTTM');
    var start16  = startRaw.substring(0, 16);
    var end16    = endRaw   ? endRaw.substring(0, 16) : '';

    var isB11 = equtCd === '2420M010';

    var div = document.createElement('div');
    div.className = 'lot-row';
    div.id = 'lotRow_' + i;
    div.dataset.start = startRaw;
    div.dataset.end   = endRaw;
    div.dataset.equt  = equtCd;
    div.dataset.idx   = i;

    div.innerHTML = (custNm ? '<div class="lot-prod" style="color:var(--orange);font-weight:700">' + esc(custNm) + '</div>' : '')
      + '<div class="lot-num">' + esc(num) + (equtTag ? ' <span style="font-size:10px;font-weight:600;color:var(--primary)">· ' + esc(equtTag) + '</span>' : '') + '</div>'
      + (prodNm  ? '<div class="lot-prod">' + esc(prodNm) + '</div>' : '')
      + (isB11   ? '<div class="lot-prod" id="kgRow_' + i + '" style="color:var(--primary)">&#9888; 조회 중…</div>' : '');
      /* 하단 2줄 제거: 품번(prodNum), 시간(lot-time) */

    div.addEventListener('click', function() { selectLot(this); });
    frag.appendChild(div);
  });
  el.innerHTML = '';
  el.appendChild(frag);
  lotActiveSel = null;
  loadKgForBcf11Lots(rows);
}

function selectLot(rowEl) {
  // 이전 선택 해제
  document.querySelectorAll('.lot-row.active-lot').forEach(function(el){ el.classList.remove('active-lot'); });
  rowEl.classList.add('active-lot');
  lotActiveSel = rowEl.dataset.idx;

  var startRaw = rowEl.dataset.start;
  var endRaw   = rowEl.dataset.end;
  var equtCd   = rowEl.dataset.equt;
  if (!startRaw) return;

  var startDt = parseLotDt(startRaw);
  var endDt   = endRaw ? parseLotDt(endRaw) : new Date();
  if (!startDt) return;

  // 해당 설비 태그 자동 선택 (선택된 태그 없을 경우)
  var EQUT_REV = {};
  Object.keys(EQUT_MAP).forEach(function(k){ EQUT_REV[EQUT_MAP[k]] = k; });
  var bcfTag = EQUT_REV[equtCd];
  var selList = tags.filter(function(t){ return selTags[t.colName]; });
  if (!selList.length && bcfTag) {
    tags.forEach(function(t){ selTags[t.colName] = (getEquipFromTag(t) === bcfTag); });
    renderTagList();
  }

  // 전후 10분 여유
  var fromDt = new Date(startDt.getTime() - 10 * 60 * 1000);
  var toDt   = new Date(endDt.getTime()   + 10 * 60 * 1000);

  document.getElementById('fromTime').value = toLocalInput(fromDt);
  document.getElementById('toTime').value   = toLocalInput(toDt);
  isCustom = true;
  document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.remove('active'); });
  var label = startRaw.substring(0,16) + ' ~ ' + (endRaw ? endRaw.substring(0,16) : '현재');
  document.getElementById('periodLabel').textContent = label;
  reloadChart();
}

/* ── 작업지시 어노테이션 ── */
function loadJacupAnnotations(from, to) {
  if (!from || !to) return;
  var equtCd = EQUT_MAP[curEquip] || '';
  fetch(base + '/work/jacup/range?equtCd=' + encodeURIComponent(equtCd)
      + '&from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to))
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (!Array.isArray(d)) return;
      jacups = d;
      d.forEach(function(j){ if (jacupVisible[j.WORK_INDCT_NUM] === undefined) jacupVisible[j.WORK_INDCT_NUM] = true; });
      renderJacupPills();
      applyJacupToChart();
    })
    .catch(function(){});
}

function renderJacupPills() {
  var bar = document.getElementById('jacupBar');
  if (!jacups.length) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  var html = '<span style="font-size:11px;font-weight:700;color:var(--orange);flex-shrink:0;margin-right:2px">작업지시</span>';
  jacups.forEach(function(j){
    var key = j.WORK_INDCT_NUM;
    var vis = jacupVisible[key] !== false;
    var lbl = esc(key || '');
    html += '<span class="jacup-pill'+(vis?'':' hidden')+'" onclick="toggleJacup(\''+key+'\')">'
          + '<span class="jacup-pill-dot"></span>'
          + lbl
          + '</span>';
  });
  bar.innerHTML = html;
}

function applyJacupToChart() {
  if (!mainChart) return;
  var axis = mainChart.xAxis[0];
  (axis.plotLinesAndBands || []).slice().forEach(function(b){
    if (b.id && String(b.id).indexOf('jacup-') === 0) axis.removePlotLine(b.id);
  });
  jacups.forEach(function(j){
    var key = j.WORK_INDCT_NUM;
    if (jacupVisible[key] === false) return;
    var ts = parseTs(j.START_DTTM);
    if (!ts) return;

    var kgStr = '';
    if ((j.EQUT_CD || '') === '2420M010' && chartRows.length) {
      var kgTag = tags.find(function(t){ var c=(t.colName||'').toLowerCase(); return c==='11_kg'||c.indexOf('11_kg')!==-1; });
      if (kgTag) {
        var closest = null, minDiff = Infinity;
        chartRows.forEach(function(row){
          var rt = parseTs(row.record_time || row.recordTime);
          if (rt === null) return;
          var diff = Math.abs(rt - ts);
          if (diff < minDiff) { minDiff = diff; closest = row; }
        });
        if (closest) {
          var kv = parseFloat(getSnapshotValue(closest, kgTag));
          if (!isNaN(kv) && kv > 0) kgStr = kv.toFixed(1) + ' kg';
        }
      }
    }

    axis.addPlotLine({
      id: 'jacup-' + key,
      value: ts, color: '#DD6B20', width: 1.5, dashStyle: 'ShortDash', zIndex: 5,
      label: {
        useHTML: true,
        text: '<span class="cht-jacup-lbl">'
            + (j.CUST_NM  ? '&#127968; ' + esc(j.CUST_NM) + '<br>' : '')
            + (j.PROD_NM  ? '<span style="font-size:11px;font-weight:500">' + esc(j.PROD_NM) + '</span><br>' : '')
            + '<span style="font-size:10px;font-weight:600;opacity:.82;letter-spacing:.3px">' + esc(key||'') + '</span>'
            + (kgStr ? '<br><span style="font-size:11px;font-weight:700">&#9878; ' + kgStr + '</span>' : '')
            + '</span>',
        rotation: 0, align: 'left', x: 3, y: 14
      }
    });
  });
}

function toggleJacup(key) {
  jacupVisible[key] = (jacupVisible[key] === false);
  renderJacupPills();
  applyJacupToChart();
}

/* ── BCF11 로트 목록에서 시작 시점의 11_kg 값 조회 ── */
function loadKgForBcf11Lots(lotRows) {
  lotRows.forEach(function(r, i) {
    if (lotVal(r, 'EQUT_CD') !== '2420M010') return;
    var startRaw = lotVal(r, 'START_DTTM');
    if (!startRaw) return;
    var startMs = parseTs(startRaw);
    if (!startMs) return;
    var fromDt = new Date(startMs - 5 * 60 * 1000);
    var toDt   = new Date(startMs + 5 * 60 * 1000);
    var spanId = 'kgRow_' + i;
    fetch(base + '/temp/snapshot/range?from=' + encodeURIComponent(toSqlDateTime(fromDt))
        + '&to='   + encodeURIComponent(toSqlDateTime(toDt)))
      .then(function(res){ return res.json(); })
      .then(function(snapRows){
        var el = document.getElementById(spanId);
        if (!el) return;
        if (!Array.isArray(snapRows) || !snapRows.length) { el.textContent = ''; return; }
        var kgTag = tags.find(function(t){ var c=(t.colName||'').toLowerCase(); return c==='11_kg'||c.indexOf('11_kg')!==-1; });
        var closest = null, minDiff = Infinity;
        snapRows.forEach(function(row){
          var rt = parseTs(row.record_time || row.recordTime);
          if (rt === null) return;
          var diff = Math.abs(rt - startMs);
          if (diff < minDiff) { minDiff = diff; closest = row; }
        });
        if (!closest) { el.textContent = ''; return; }
        var v = NaN;
        if (kgTag) {
          v = parseFloat(getSnapshotValue(closest, kgTag));
        } else {
          v = parseFloat(closest['11_kg'] !== undefined ? closest['11_kg'] : closest['11_KG']);
        }
        if (!isNaN(v) && v > 0) el.innerHTML = '&#9878; <b>' + v.toFixed(1) + ' kg</b>';
        else el.textContent = '';
      })
      .catch(function(){ var el = document.getElementById(spanId); if (el) el.textContent = ''; });
  });
}

/* ── 차트 PNG 저장 ── */
function saveChartPng() {
  var el = document.getElementById('mainChartBox');
  if (!el) { alert('차트가 없습니다.'); return; }
  html2canvas(el, {
    backgroundColor: '#0d1929',
    scale: 2,
    useCORS: true,
    logging: false
  }).then(function(canvas) {
    var a = document.createElement('a');
    var now = new Date();
    var p = function(n){ return String(n).padStart(2,'0'); };
    var fname = 'chart_' + now.getFullYear() + p(now.getMonth()+1) + p(now.getDate())
              + '_' + p(now.getHours()) + p(now.getMinutes()) + p(now.getSeconds()) + '.png';
    a.href = canvas.toDataURL('image/png');
    a.download = fname;
    a.click();
  });
}

/* ── 엑셀 저장 ── */
function saveChartXls() {
  if (!mainChart) { alert('차트가 없습니다.'); return; }
  mainChart.downloadXLS();
}

/* ── 메모 ── */
function openMemoModal() {
  var now = new Date();
  var p = function(n){ return String(n).padStart(2,'0'); };
  var ts = now.getFullYear()+'-'+p(now.getMonth()+1)+'-'+p(now.getDate())
          +'T'+p(now.getHours())+':'+p(now.getMinutes())+':'+p(now.getSeconds());
  document.getElementById('memoTimeVal').value = ts;
  document.getElementById('memoName').value = '';
  document.getElementById('memoDesc').value = '';
  document.getElementById('memoOverlay').style.display = 'flex';
  setTimeout(function(){ document.getElementById('memoName').focus(); }, 50);
}

function closeMemoModal() {
  document.getElementById('memoOverlay').style.display = 'none';
}

function saveMemo() {
  var name    = document.getElementById('memoName').value.trim();
  var desc    = document.getElementById('memoDesc').value.trim();
  var rawTime = document.getElementById('memoTimeVal').value;
  if (!name)    { alert('메모 제목을 입력하세요'); return; }
  if (!rawTime) { alert('시간을 선택하세요'); return; }
  var regtime = rawTime.replace('T', ' ') + (rawTime.length === 16 ? ':00' : '');
  fetch(base + '/temp/memo/insert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tcName: name, tcDesc: desc, tcRegtime: regtime, tcUserCode: 0 })
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if (d.success === false) { alert(d.error || '저장 실패'); return; }
    closeMemoModal();
    loadMemos(curFrom, curTo);
  })
  .catch(function(){ alert('저장 실패'); });
}

function loadMemos(from, to) {
  if (!from || !to) return;
  fetch(base + '/temp/memo/list?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to))
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (!Array.isArray(d)) return;
      memos = d;
      d.forEach(function(m){
        if (memoVisible[m.tcCnt] === undefined) memoVisible[m.tcCnt] = true;
      });
      renderMemoPills();
      applyMemosToChart();
    })
    .catch(function(){});
}

function renderMemoPills() {
  var bar = document.getElementById('memoBar');
  if (!memos.length) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  var html = '<span style="font-size:11px;font-weight:700;color:var(--muted);flex-shrink:0;margin-right:2px">메모</span>';
  memos.forEach(function(m){
    var vis = memoVisible[m.tcCnt] !== false;
    html += '<span class="memo-pill'+(vis?'':' hidden')+'" onclick="toggleMemo('+m.tcCnt+')">'
          + '<span class="memo-pill-dot"></span>'
          + esc(m.tcName||'')
          + ((!window.__PERMS || !window.__PERMS['trend'] || window.__PERMS['trend'].canDel !== 'N') ? '<span class="memo-pill-del" title="삭제" onclick="event.stopPropagation();deleteMemo('+m.tcCnt+')">&#x00D7;</span>' : '')
          + '</span>';
  });
  bar.innerHTML = html;
}

function applyMemosToChart() {
  if (!mainChart) return;
  var axis = mainChart.xAxis[0];
  // 기존 메모 plotLine 전부 제거
  (axis.plotLinesAndBands || []).slice().forEach(function(b){
    if (b.id && String(b.id).indexOf('memo-') === 0) axis.removePlotLine(b.id);
  });
  // 보이는 메모만 추가
  memos.forEach(function(m){
    if (memoVisible[m.tcCnt] === false) return;
    var ts = parseTs(m.tcRegtime);
    if (!ts) return;
    axis.addPlotLine({
      id: 'memo-' + m.tcCnt,
      value: ts,
      color: '#805AD5',
      width: 1.5,
      dashStyle: 'ShortDash',
      zIndex: 5,
      label: {
        useHTML: true,
        text: '<span class="cht-memo-lbl">'
            + esc(m.tcName||'')
            + (m.tcDesc ? '<br><span style="font-weight:400;font-size:9px;opacity:.92">' + esc(m.tcDesc) + '</span>' : '')
            + (m.tcUserName ? '<br><span style="font-weight:500;font-size:9px;opacity:.75">&#128100; ' + esc(m.tcUserName) + '</span>' : '')
            + '</span>',
        rotation: 0,
        align: 'left',
        x: 3,
        y: 14
      }
    });
  });
}

function toggleMemo(tcCnt) {
  memoVisible[tcCnt] = (memoVisible[tcCnt] === false);
  renderMemoPills();
  applyMemosToChart();
}

function deleteMemo(tcCnt) {
  if (!confirm('메모를 삭제하시겠습니까?')) return;
  fetch(base + '/temp/memo/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tcCnt: tcCnt })
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if (d.success === false) { alert(d.error || '삭제 실패'); return; }
    delete memoVisible[tcCnt];
    loadMemos(curFrom, curTo);
  })
  .catch(function(){ alert('삭제 실패'); });
}

/* ── 초기화 ── */
(function(){
  try {
    var p = window.parent;
    if (p && p !== window) {
      var sb = p.document.getElementById('sidebar');
      if (sb && !sb.classList.contains('collapsed')) sb.classList.add('collapsed');
    }
  } catch(e) {}
})();
initRange();
loadTags();
startCountdown();
window.addEventListener('resize', function(){
  if (mainChart) mainChart.reflow();
});
</script>
</body>
</html>


