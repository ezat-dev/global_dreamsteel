<%@ page contentType="text/html; charset=UTF-8" %>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TEMP MONITOR</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">
    <script src="<%=ctx%>/js/highchart/highcharts.js"></script>

<style>
/* ══════════════════════════════════════════
   TEMP MONITOR — Thermal Cyber Dark
   컨셉: 열화상 + 사이버 산업계기판
══════════════════════════════════════════ */
:root {
  --bg:          #060810;
  --bg-panel:    #0b0e1a;
  --bg-deep:     #080b15;
  --bg-hover:    #111830;

  --cyan:        #00f0ff;
  --cyan2:       #00c8e0;
  --cyan-dim:    rgba(0,240,255,.07);
  --cyan-border: rgba(0,240,255,.18);
  --cyan-glow:   0 0 18px rgba(0,240,255,.5);

  --heat1:       #ff6b00;  /* hot orange */
  --heat2:       #ff3b5c;  /* critical red */
  --heat-glow:   0 0 18px rgba(255,107,0,.5);

  --green:       #00ff88;
  --green-glow:  0 0 14px rgba(0,255,136,.5);
  --amber:       #ffb700;
  --purple:      #b06cff;

  --text-p:      #d8edf8;
  --text-s:      #4a6a88;
  --text-dim:    #1e3050;

  --font-mono:   'Share Tech Mono', monospace;
  --font-hud:    'Orbitron', sans-serif;
  --font-ui:     'Noto Sans KR', sans-serif;

  --radius:      6px;
  --border:      1px solid var(--cyan-border);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }

body {
  background: var(--bg);
  color: var(--text-p);
  font-family: var(--font-ui);
  font-size: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* hexagonal grid bg */
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(0,240,255,.04) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(255,107,0,.04) 0%, transparent 50%),
    linear-gradient(rgba(0,240,255,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,.025) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
}

/* ══ SCANLINE ══ */
body::after {
  content: '';
  pointer-events: none;
  position: fixed; inset: 0; z-index: 9999;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 3px,
    rgba(0,0,0,.06) 3px, rgba(0,0,0,.06) 4px
  );
}

/* ══ HEADER ══ */
.page-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  height: 58px;
  border-bottom: 1px solid var(--cyan-border);
  background: linear-gradient(180deg, rgba(0,240,255,.05) 0%, transparent 100%);
  position: relative;
  overflow: hidden;
}
/* header bottom accent line */
.page-header::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyan), var(--heat1), transparent);
  opacity: .6;
}

.page-title {
  font-family: var(--font-hud);
  font-size: 22px; font-weight: 900;
  letter-spacing: 6px; text-transform: uppercase;
  color: var(--cyan);
  text-shadow: var(--cyan-glow);
}
.page-sub {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-s);
  letter-spacing: 1px;
  margin-top: 3px;
}

/* LIVE badge */
.active-badge {
  display: flex; align-items: center; gap: 7px;
  background: rgba(0,255,136,.06);
  border: 1px solid rgba(0,255,136,.35);
  border-radius: 4px;
  padding: 5px 12px;
  font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 2px;
  color: var(--green);
  text-shadow: var(--green-glow);
}
.active-dot {
  width: 8px; height: 8px;
  background: var(--green);
  border-radius: 50%;
  box-shadow: var(--green-glow);
  animation: pulse-live 1.4s ease-in-out infinite;
}
@keyframes pulse-live {
  0%,100% { opacity:1; box-shadow: 0 0 8px var(--green), 0 0 20px var(--green); }
  50%      { opacity:.3; box-shadow: none; }
}

/* clock */
.header-clock {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--cyan);
  text-shadow: var(--cyan-glow);
  letter-spacing: 2px;
}

/* temp badge strip */
.temp-strip {
  display: flex; gap: 8px; align-items: center;
}
.temp-badge {
  font-family: var(--font-mono);
  font-size: 10px; letter-spacing: 1px;
  padding: 4px 10px; border-radius: 3px;
  border: 1px solid;
}
.temp-badge.hot  { color: var(--heat1); border-color: rgba(255,107,0,.4); background: rgba(255,107,0,.08); }
.temp-badge.warn { color: var(--amber); border-color: rgba(255,183,0,.4); background: rgba(255,183,0,.06); }
.temp-badge.ok   { color: var(--green); border-color: rgba(0,255,136,.4); background: rgba(0,255,136,.06); }

/* ══ WORKSPACE ══ */
.workspace {
  flex: 1; min-height: 0;
  display: flex;
  gap: 0;
  overflow: hidden;
}

/* ══ LEFT PANEL ══ */
.panel-left {
  width: 230px; flex-shrink: 0;
  display: flex; flex-direction: column;
  border-right: 1px solid var(--cyan-border);
  background: var(--bg-panel);
  overflow: hidden;
}

.panel-title {
  font-family: var(--font-hud);
  font-size: 10px; letter-spacing: 4px;
  color: var(--cyan);
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--cyan-border);
  background: var(--bg-deep);
  text-shadow: var(--cyan-glow);
  display: flex; align-items: center; gap: 8px;
}
.panel-title::before {
  content: '▶';
  font-size: 8px;
  color: var(--cyan);
  animation: blink-arrow .8s step-end infinite;
}
@keyframes blink-arrow { 0%,100%{opacity:1} 50%{opacity:0} }

.left-tools { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid var(--cyan-border); }

.left-search {
  width: 100%; height: 30px;
  background: var(--bg-deep);
  border: 1px solid var(--cyan-border);
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 1px;
  padding: 0 10px;
  outline: none;
  border-radius: 3px;
  transition: border-color .2s, box-shadow .2s;
}
.left-search::placeholder { color: var(--text-s); }
.left-search:focus { border-color: var(--cyan); box-shadow: 0 0 8px rgba(0,240,255,.3); }

.left-btns { display: flex; gap: 6px; }

/* ══ BUTTONS ══ */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 28px; padding: 0 12px;
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 2px;
  border-radius: 3px; border: 1px solid; cursor: pointer;
  transition: all .15s; text-transform: uppercase;
  background: transparent;
}
.btn-cyan  { color: var(--cyan);  border-color: rgba(0,240,255,.4); }
.btn-cyan:hover  { background: var(--cyan-dim); box-shadow: var(--cyan-glow); }
.btn-red   { color: var(--heat2); border-color: rgba(255,59,92,.4); }
.btn-red:hover   { background: rgba(255,59,92,.1); }
.btn-yellow{ color: var(--amber); border-color: rgba(255,183,0,.4); }
.btn-yellow:hover{ background: rgba(255,183,0,.08); }
.btn { flex: 1; }

/* ══ TAG LIST ══ */
.tag-list {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding: 6px 8px;
}
.tag-list::-webkit-scrollbar { width: 3px; }
.tag-list::-webkit-scrollbar-track { background: transparent; }
.tag-list::-webkit-scrollbar-thumb { background: var(--cyan-border); border-radius: 2px; }

.tag-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer; user-select: none;
  transition: all .15s;
  margin-bottom: 3px;
}
.tag-item:hover { background: var(--bg-hover); border-color: var(--cyan-border); }
.tag-item.active {
  background: rgba(0,240,255,.06);
  border-color: rgba(0,240,255,.3);
  box-shadow: inset 2px 0 0 var(--cyan);
}

/* color dot per tag */
.tag-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0;
}
.tag-item.active .tag-dot { box-shadow: 0 0 6px currentColor; }

.tag-name { color: var(--text-p); font-weight: 500; font-size: 12px; flex: 1; }
.tag-item.active .tag-name { color: var(--cyan); }
.tag-addr { color: var(--text-s); font-family: var(--font-mono); font-size: 9px; }

.tag-item input[type="checkbox"] { display: none; }

.folder-empty {
  padding: 30px 10px; text-align: center;
  color: var(--text-dim); font-family: var(--font-mono);
  font-size: 11px; letter-spacing: 2px;
}

/* ══ RIGHT PANEL ══ */
.panel-right {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* ══ TOOLBAR ══ */
.toolbar {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 18px;
  border-bottom: 1px solid var(--cyan-border);
  background: var(--bg-deep);
}
.tb-section { display: flex; align-items: center; gap: 8px; }
.tb-label {
  font-family: var(--font-mono); font-size: 9px;
  letter-spacing: 2px; text-transform: uppercase;
}
.tb-label.yellow { color: var(--amber); }
.tb-spacer { flex: 1; }

.picker-row { display: flex; align-items: center; gap: 6px; }
.picker-row label { font-family: var(--font-mono); font-size: 9px; color: var(--text-s); letter-spacing: 1px; }
.picker-row input {
  height: 28px;
  background: var(--bg);
  border: 1px solid var(--cyan-border);
  color: var(--cyan);
  font-family: var(--font-mono); font-size: 11px;
  padding: 0 8px; outline: none; border-radius: 3px;
  transition: border-color .2s;
}
.picker-row input:focus { border-color: var(--cyan); box-shadow: 0 0 8px rgba(0,240,255,.25); }

/* quick range buttons active state */
.btn-yellow.active-range { background: rgba(255,183,0,.15); border-color: var(--amber); }

/* ══ CHART AREA ══ */
.chart-outer {
  flex: 1; min-height: 0;
  padding: 14px 18px 14px;
  display: flex; flex-direction: column; gap: 10px;
}

/* stats row above chart */
.chart-stats {
  display: flex; gap: 10px; flex-shrink: 0;
}
.stat-box {
  background: var(--bg-panel);
  border: 1px solid var(--cyan-border);
  border-radius: 4px;
  padding: 8px 14px;
  min-width: 110px;
  position: relative; overflow: hidden;
}
.stat-box::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
}
.stat-box.s-cyan::before  { background: var(--cyan); }
.stat-box.s-hot::before   { background: var(--heat1); }
.stat-box.s-green::before { background: var(--green); }
.stat-box.s-amber::before { background: var(--amber); }

.stat-label { font-family: var(--font-mono); font-size: 9px; color: var(--text-s); letter-spacing: 2px; margin-bottom: 4px; }
.stat-val   { font-family: var(--font-mono); font-size: 20px; line-height: 1; }
.stat-box.s-cyan  .stat-val { color: var(--cyan);  text-shadow: var(--cyan-glow); }
.stat-box.s-hot   .stat-val { color: var(--heat1); text-shadow: var(--heat-glow); }
.stat-box.s-green .stat-val { color: var(--green); text-shadow: var(--green-glow); }
.stat-box.s-amber .stat-val { color: var(--amber); }

.chart-wrap {
  flex: 1; min-height: 0;
  background: var(--bg-panel);
  border: 1px solid var(--cyan-border);
  box-shadow: 0 0 30px rgba(0,240,255,.05), inset 0 0 40px rgba(0,0,0,.3);
  border-radius: var(--radius);
  padding: 10px;
  position: relative;
  overflow: hidden;
}
/* corner decorations */
.chart-wrap::before, .chart-wrap::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  border-color: var(--cyan);
  border-style: solid;
  opacity: .5;
}
.chart-wrap::before { top: 6px; left: 6px;  border-width: 1px 0 0 1px; }
.chart-wrap::after  { bottom: 6px; right: 6px; border-width: 0 1px 1px 0; }

#tempChart { width: 100%; height: 100%; min-height: 340px; }

/* refresh bar */
.refresh-bar-outer {
  height: 2px; background: var(--bg-panel);
  border-radius: 1px; overflow: hidden;
  position: absolute; bottom: 0; left: 0; right: 0;
}
.refresh-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, var(--cyan), var(--heat1));
  box-shadow: var(--cyan-glow);
  animation: none;
  width: 0%;
  transition: width .1s linear;
}

/* ══ EQUIP FILTER TABS ══ */
.equip-bar {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
  padding: 6px 14px;
  border-bottom: 1px solid var(--cyan-border);
  background: var(--bg-deep);
}
.equip-tab {
  padding: 3px 10px; border-radius: 3px;
  border: 1px solid rgba(0,240,255,.2);
  background: transparent;
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 1px; color: var(--text-s);
  cursor: pointer; transition: all .15s;
}
.equip-tab:hover  { border-color: var(--cyan); color: var(--text-p); }
.equip-tab.active { border-color: var(--cyan); background: rgba(0,240,255,.1); color: var(--cyan); box-shadow: 0 0 6px rgba(0,240,255,.3); }

/* ══ HIGHCHARTS overrides (theme) ══ */
.highcharts-background      { fill: transparent !important; }
.highcharts-grid-line       { stroke: rgba(0,240,255,.08) !important; }
.highcharts-axis-line       { stroke: rgba(0,240,255,.2) !important; }
.highcharts-tick            { stroke: rgba(0,240,255,.2) !important; }
.highcharts-axis-labels text{ fill: #4a6a88 !important; font-family: 'Share Tech Mono' !important; font-size: 10px !important; }
.highcharts-title           { fill: var(--cyan) !important; font-family: 'Orbitron' !important; }
.highcharts-legend-item text{ fill: #7a9ab8 !important; font-family: 'Share Tech Mono' !important; }
.highcharts-crosshair       { stroke: rgba(0,240,255,.4) !important; }
.highcharts-tooltip-box     { fill: #080b15 !important; stroke: rgba(0,240,255,.4) !important; }
</style>
</head>
<body class="theme-temp">

<!-- ══ HEADER ══ -->
<div class="page-header">
  <div>
    <div class="page-title">⚡TEMP MONITOR</div>
    <div class="page-sub">// Highcharts time-series · default last 3h</div>
  </div>
  <div class="active-badge"><div class="active-dot"></div>LIVE</div>

  <div class="temp-strip" id="tempStrip" style="margin-left:20px;">
    <!-- filled by JS -->
  </div>

  <div class="header-clock" id="headerClock">--:--:--</div>
</div>

<jsp:include page="/WEB-INF/views/include/monitorNav.jsp"/>

<div class="workspace">

  <!-- ══ LEFT ══ -->
  <aside class="panel-left">
    <div class="panel-title">TAGS</div>
    <div class="left-tools">
      <input id="tagSearch" class="left-search" placeholder="Search tags..." oninput="filterTagList()">
      <div class="left-btns">
        <button class="btn btn-cyan" onclick="selectAll(true)">ALL</button>
        <button class="btn btn-red"  onclick="selectAll(false)">NONE</button>
      </div>
    </div>
    <div id="tagList" class="tag-list">
      <div class="folder-empty">Loading tags...</div>
    </div>
  </aside>

  <!-- ══ RIGHT ══ -->
  <section class="panel-right">

    <!-- 설비 필터 탭 -->
    <div class="equip-bar" id="equipBar">
      <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-s);letter-spacing:2px;margin-right:4px">EQUIP</span>
      <button class="equip-tab active" onclick="setEquip('ALL',this)">ALL</button>
      <button class="equip-tab" onclick="setEquip('BCF1',this)">BCF1</button>
      <button class="equip-tab" onclick="setEquip('BCF2',this)">BCF2</button>
      <button class="equip-tab" onclick="setEquip('BCF3',this)">BCF3</button>
      <button class="equip-tab" onclick="setEquip('BCF4',this)">BCF4</button>
      <button class="equip-tab" onclick="setEquip('BCF5',this)">BCF5</button>
      <button class="equip-tab" onclick="setEquip('BCF6',this)">BCF6</button>
      <button class="equip-tab" onclick="setEquip('BCF7',this)">BCF7</button>
      <button class="equip-tab" onclick="setEquip('BCF8',this)">BCF8</button>
      <button class="equip-tab" onclick="setEquip('BCF9',this)">BCF9</button>
      <button class="equip-tab" onclick="setEquip('BCF10',this)">BCF10</button>
      <button class="equip-tab" onclick="setEquip('BCF11',this)">BCF11</button>
      <button class="equip-tab" onclick="setEquip('BCF12',this)">BCF12</button>
    </div>

    <div class="toolbar">
      <div class="tb-section">
        <span class="tb-label yellow">RANGE</span>
        <div class="picker-row">
          <label>FROM</label>
          <input type="datetime-local" id="fromTime">
          <label>TO</label>
          <input type="datetime-local" id="toTime">
        </div>
        <button class="btn btn-cyan" onclick="applyRange()">APPLY</button>
      </div>
      <div class="tb-spacer"></div>
      <button class="btn btn-yellow" id="qbtn3"  onclick="quickRange(3)">LAST 3H</button>
      <button class="btn btn-yellow" id="qbtn6"  onclick="quickRange(6)">LAST 6H</button>
      <button class="btn btn-yellow" id="qbtn24" onclick="quickRange(24)">LAST 24H</button>
    </div>

    <div class="chart-outer">

      <!-- stat boxes -->
      <div class="chart-stats">
        <div class="stat-box s-cyan">
          <div class="stat-label">ACTIVE TAGS</div>
          <div class="stat-val" id="stat-tags">0</div>
        </div>
        <div class="stat-box s-hot">
          <div class="stat-label">MAX TEMP</div>
          <div class="stat-val" id="stat-max">--</div>
        </div>
        <div class="stat-box s-green">
          <div class="stat-label">MIN TEMP</div>
          <div class="stat-val" id="stat-min">--</div>
        </div>
        <div class="stat-box s-amber">
          <div class="stat-label">DATA POINTS</div>
          <div class="stat-val" id="stat-pts">0</div>
        </div>
      </div>

      <div class="chart-wrap">
        <div id="tempChart"></div>
        <div class="refresh-bar-outer">
          <div class="refresh-bar-inner" id="refreshBar"></div>
        </div>
      </div>

    </div>
  </section>
</div>

<script>
const base = '<%=ctx%>';
let tagList   = [];
let curEquip  = 'ALL';
let chart     = null;

/* ── 색상 팔레트 (Highcharts용) ── */
const PALETTE = [
  '#00f0ff','#ff6b00','#00ff88','#ffb700',
  '#b06cff','#ff3b5c','#00cfbd','#ffd166',
  '#06d6a0','#ef476f','#118ab2','#ffc8dd'
];

/* ── 시계 ── */
setInterval(function(){
  const n = new Date();
  const p = v => String(v).padStart(2,'0');
  document.getElementById('headerClock').textContent =
    p(n.getHours()) + ':' + p(n.getMinutes()) + ':' + p(n.getSeconds());
}, 1000);

/* ── refresh bar 애니 ── */
let rafId = null;
function animateRefreshBar(ms) {
  const bar = document.getElementById('refreshBar');
  let start = null;
  if (rafId) cancelAnimationFrame(rafId);
  function step(ts) {
    if (!start) start = ts;
    const pct = Math.min((ts - start) / ms * 100, 100);
    bar.style.width = pct + '%';
    if (pct < 100) rafId = requestAnimationFrame(step);
  }
  bar.style.width = '0%';
  rafId = requestAnimationFrame(step);
}

/* ── 유틸 ── */
function toLocalInput(dt) {
  const p = n => String(n).padStart(2,'0');
  return dt.getFullYear() + '-' + p(dt.getMonth()+1) + '-' + p(dt.getDate()) +
         'T' + p(dt.getHours()) + ':' + p(dt.getMinutes());
}
function toSqlDateTime(dt) {
  const p = n => String(n).padStart(2,'0');
  return dt.getFullYear() + '-' + p(dt.getMonth()+1) + '-' + p(dt.getDate()) +
         ' ' + p(dt.getHours()) + ':' + p(dt.getMinutes()) + ':00';
}
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function initRange() {
  const now = new Date();
  const from = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  document.getElementById('fromTime').value = toLocalInput(from);
  document.getElementById('toTime').value   = toLocalInput(now);
  document.getElementById('qbtn3').classList.add('active-range');
}

/* ── 태그 목록 ── */
function loadTags() {
  fetch(base + '/temp/cols')
    .then(r => r.json())
    .then(list => {
      tagList = list || [];
      renderTagList();
      applyRange();
    });
}

/* ── 설비 필터 ── */
function setEquip(eq, btn) {
  curEquip = eq;
  document.querySelectorAll('.equip-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTagList();
  applyRange();
}

function renderTagList() {
  const wrap = document.getElementById('tagList');
  if (!tagList.length) {
    wrap.innerHTML = '<div class="folder-empty">[ NO TAGS ]</div>';
    return;
  }
  let html = '';
  tagList.forEach((t, idx) => {
    // equipId 필터: ALL이면 전부, 아니면 해당 설비만
    if (curEquip !== 'ALL' && (t.equipId || '') !== curEquip) return;
    const color = PALETTE[idx % PALETTE.length];
    html +=
      '<div class="tag-item active" data-id="' + t.tempId + '" onclick="onTagClick(event,' + t.tempId + ')">' +
        '<input type="checkbox" id="tag_' + t.tempId + '" checked>' +
        '<div class="tag-dot" style="background:' + color + '; color:' + color + ';"></div>' +
        '<div class="tag-name">' + esc(t.colName || t.tagName) + '</div>' +
        '<div class="tag-addr">' + esc(t.tagName || '') + '</div>' +
      '</div>';
  });
  wrap.innerHTML = html || '<div class="folder-empty">[ NO TAGS ]</div>';
}

function onTagClick(e, tempId) {
  if (e.target.tagName === 'INPUT') return;
  const item = document.querySelector('.tag-item[data-id="' + tempId + '"]');
  const chk  = document.getElementById('tag_' + tempId);
  if (!item || !chk) return;
  chk.checked = !chk.checked;
  item.classList.toggle('active', chk.checked);
  applyRange();
}

function toggleTag(e, tempId) {
  e.stopPropagation();
  const item = document.querySelector('.tag-item[data-id="' + tempId + '"]');
  if (item) item.classList.toggle('active', e.target.checked);
  applyRange();
}

function selectAll(flag) {
  document.querySelectorAll('#tagList input[type="checkbox"]').forEach(chk => {
    chk.checked = flag;
    const id  = chk.id.replace('tag_', '');
    const row = document.querySelector('.tag-item[data-id="' + id + '"]');
    if (row) row.classList.toggle('active', flag);
  });
  applyRange();
}

function filterTagList() {
  const q = (document.getElementById('tagSearch').value || '').toLowerCase();
  document.querySelectorAll('#tagList .tag-item').forEach(it => {
    const name = (it.querySelector('.tag-name')?.textContent || '').toLowerCase()
               + (it.querySelector('.tag-addr')?.textContent || '').toLowerCase();
    it.style.display = name.includes(q) ? '' : 'none';
  });
}

/* ── quick range ── */
function quickRange(hours) {
  ['qbtn3','qbtn6','qbtn24'].forEach(id => document.getElementById(id).classList.remove('active-range'));
  document.getElementById('qbtn' + hours)?.classList.add('active-range');
  const now  = new Date();
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
  document.getElementById('fromTime').value = toLocalInput(from);
  document.getElementById('toTime').value   = toLocalInput(now);
  applyRange();
}

/* ── 데이터 조회 & 차트 ── */
function getSelectedTags() {
  return tagList.filter(t => {
    const chk = document.getElementById('tag_' + t.tempId);
    return chk && chk.checked;
  });
}

function applyRange() {
  const fromInput = document.getElementById('fromTime').value;
  const toInput   = document.getElementById('toTime').value;
  if (!fromInput || !toInput) return;
  const from = new Date(fromInput);
  const to   = new Date(toInput);
  const qs   = '?from=' + encodeURIComponent(toSqlDateTime(from)) +
               '&to='   + encodeURIComponent(toSqlDateTime(to));
  animateRefreshBar(800);
  fetch(base + '/temp/snapshot/range' + qs)
    .then(r => r.json())
    .then(rows => renderChart(rows || []));
}

function renderChart(rows) {
  const selected = getSelectedTags();
  document.getElementById('stat-tags').textContent = selected.length;
  document.getElementById('stat-pts').textContent  = (rows.length * selected.length).toLocaleString();

  const series = selected.map((t, idx) => ({
    name: t.tagName,
    color: PALETTE[tagList.indexOf(t) % PALETTE.length],
    data: [],
    lineWidth: 2,
    marker: { enabled: false, symbol: 'circle' },
    states: { hover: { lineWidth: 3 } }
  }));

  let allVals = [];
  rows.forEach(row => {
    const ts = toTimestamp(row.record_time || row.recordTime || row.recordTimeMs);
    if (!ts) return;
    selected.forEach((t, idx) => {
      const val = row[t.colName];
      const num = (val != null) ? Number(val) : null;
      series[idx].data.push([ts, num]);
      if (num != null) allVals.push(num);
    });
  });

  /* stats */
  if (allVals.length) {
    document.getElementById('stat-max').textContent = Math.max(...allVals).toFixed(1) + '°';
    document.getElementById('stat-min').textContent = Math.min(...allVals).toFixed(1) + '°';
    updateTempStrip(Math.max(...allVals));
  } else {
    document.getElementById('stat-max').textContent = '--';
    document.getElementById('stat-min').textContent = '--';
  }

  if (typeof Highcharts === 'undefined') {
    document.getElementById('tempChart').innerHTML =
      '<div style="color:#ff3b5c;padding:30px;font-family:monospace;">[ Highcharts not loaded ]</div>';
    return;
  }

  const hcOptions = {
    chart: {
      backgroundColor: 'transparent',
      zoomType: 'x',
      style: { fontFamily: "'Share Tech Mono', monospace" },
      animation: { duration: 500 },
      panning: { enabled: true, type: 'x' },
      panKey: 'shift'
    },
    title: {
      text: 'TEMPERATURE TIME SERIES',
      style: { color: 'rgba(0,240,255,.5)', fontSize: '11px', letterSpacing: '3px', fontFamily: "'Orbitron'" }
    },
    xAxis: {
      type: 'datetime',
      lineColor: 'rgba(0,240,255,.2)',
      tickColor: 'rgba(0,240,255,.2)',
      labels: { style: { color: '#4a6a88', fontSize: '10px' }, format: '{value:%H:%M}' },
      crosshair: { color: 'rgba(0,240,255,.3)', dashStyle: 'Dot' }
    },
    yAxis: {
      title: { text: '°C', style: { color: '#4a6a88' } },
      labels: { style: { color: '#4a6a88', fontSize: '10px' },
        formatter: function(){ return this.value + '°'; }
      },
      gridLineColor: 'rgba(0,240,255,.06)',
      plotLines: [{
        value: 0, color: 'rgba(255,107,0,.3)',
        width: 1, dashStyle: 'LongDash',
        label: { text: '0°C', style: { color: '#ff6b00', fontSize: '9px' } }
      }]
    },
    tooltip: {
      backgroundColor: 'rgba(6,8,16,.95)',
      borderColor: 'rgba(0,240,255,.4)',
      borderRadius: 4,
      style: { color: '#d8edf8', fontFamily: "'Share Tech Mono'", fontSize: '11px' },
      shared: true,
      xDateFormat: '%Y-%m-%d %H:%M:%S',
      headerFormat: '<span style="color:#00f0ff;letter-spacing:1px">{point.key}</span><br/>'
    },
    legend: {
      itemStyle: { color: '#7a9ab8', fontFamily: "'Share Tech Mono'", fontSize: '10px' },
      itemHoverStyle: { color: '#00f0ff' }
    },
    plotOptions: {
      series: {
        animation: { duration: 600 },
        turboThreshold: 10000
      }
    },
    series: series,
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  if (!chart) {
    chart = Highcharts.chart('tempChart', hcOptions);
  } else {
    while (chart.series.length) chart.series[0].remove(false);
    series.forEach(s => chart.addSeries(s, false));
    chart.redraw(true);
  }
}

/* ── 헤더 온도 배지 ── */
function updateTempStrip(maxTemp) {
  const strip = document.getElementById('tempStrip');
  let cls = 'ok', label = 'NORMAL';
  if (maxTemp > 80)      { cls = 'hot';  label = 'HIGH ' + maxTemp.toFixed(0) + '°'; }
  else if (maxTemp > 50) { cls = 'warn'; label = 'WARM ' + maxTemp.toFixed(0) + '°'; }
  else                   { label = 'OK  ' + maxTemp.toFixed(0) + '°'; }
  strip.innerHTML = '<div class="temp-badge ' + cls + '">' + label + '</div>';
}

/* ── timestamp 파싱 ── */
function toTimestamp(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v > 100000000000 ? v : v * 1000;
  if (typeof v === 'string') {
    const s = v.includes('T') ? v : v.replace(' ', 'T');
    const t = Date.parse(s);
    return isNaN(t) ? null : t;
  }
  if (typeof v === 'object') {
    if (typeof v.time === 'number') return v.time;
    if (typeof v.epochSecond === 'number')
      return v.epochSecond * 1000 + Math.floor((v.nano || 0) / 1000000);
  }
  return null;
}

initRange();
loadTags();
</script>
</body>
</html>
