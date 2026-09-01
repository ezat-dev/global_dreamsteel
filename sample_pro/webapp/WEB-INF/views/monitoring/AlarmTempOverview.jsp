<%@ page contentType="text/html; charset=UTF-8" isELIgnored="true" %>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>TEMP ALARM OVERVIEW</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
<link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">
<style>
/* ══════════════════════════════════════════
   TEMP ALARM OVERVIEW
   Thermal Cyber Dark — TempMonitor 헤더 스타일
══════════════════════════════════════════ */
:root {
  --bg:          #060810;
  --bg-panel:    #0b0e1a;
  --bg-deep:     #080b15;
  --bg-hover:    #111830;

  --cyan:        #00f0ff;
  --cyan-dim:    rgba(0,240,255,.07);
  --cyan-b:      rgba(0,240,255,.18);
  --cyan-glow:   0 0 18px rgba(0,240,255,.45);

  --heat:        #ff6b00;
  --heat-b:      rgba(255,107,0,.35);
  --heat-dim:    rgba(255,107,0,.08);
  --heat-glow:   0 0 18px rgba(255,107,0,.5);

  --red:         #ff3b5c;
  --red-b:       rgba(255,59,92,.35);
  --red-dim:     rgba(255,59,92,.08);
  --red-glow:    0 0 16px rgba(255,59,92,.5);

  --amber:       #ffb700;
  --amber-b:     rgba(255,183,0,.3);
  --amber-dim:   rgba(255,183,0,.07);

  --green:       #00ff88;
  --green-b:     rgba(0,255,136,.35);
  --green-dim:   rgba(0,255,136,.07);
  --green-glow:  0 0 14px rgba(0,255,136,.5);

  --ice:         #38bdf8;
  --ice-b:       rgba(56,189,248,.3);
  --ice-dim:     rgba(56,189,248,.08);

  --purple:      #b06cff;

  --t1: #d8edf8;
  --t2: #4a6a88;
  --t3: #1e3050;
  --t4: #0d1828;

  --mono: 'Share Tech Mono', monospace;
  --hud:  'Orbitron', sans-serif;
  --sans: 'Noto Sans KR', sans-serif;

  --r: 4px; --r2: 6px;
}

*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
html, body { height:100%; overflow:hidden; }

body {
  font-family: var(--sans); font-size:12px;
  color: var(--t1); background: var(--bg);
  display:flex; flex-direction:column; height:100%;
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(0,240,255,.03) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 15%, rgba(255,107,0,.04) 0%, transparent 50%),
    linear-gradient(rgba(0,240,255,.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,.022) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
}
body::after {
  content:''; pointer-events:none; position:fixed; inset:0; z-index:9999;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.05) 3px, rgba(0,0,0,.05) 4px);
}

/* ══ HEADER — TempMonitor 스타일 ══ */
.page-header {
  flex-shrink:0; height:58px;
  display:flex; align-items:center; gap:14px;
  padding:0 22px;
  border-bottom:1px solid var(--cyan-b);
  background: linear-gradient(180deg, rgba(0,240,255,.05) 0%, transparent 100%);
  position:relative; overflow:hidden;
}
.page-header::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, var(--cyan), var(--heat), transparent);
  opacity:.55;
}

.h-title-block { display:flex; flex-direction:column; gap:2px; }
.h-title {
  font-family: var(--hud);
  font-size:20px; font-weight:900; letter-spacing:5px; text-transform:uppercase;
  color:var(--cyan); text-shadow:var(--cyan-glow);
}
.h-title span { color: var(--purple); text-shadow:var(--purple-glow); }
.h-sub { font-family:var(--mono); font-size:9px; color:var(--t2); letter-spacing:1px; }

/* LIVE badge */
.live-badge {
  display:flex; align-items:center; gap:7px;
  background:var(--green-dim); border:1px solid var(--green-b);
  border-radius:3px; padding:4px 12px;
  font-family:var(--mono); font-size:11px; letter-spacing:2px;
  color:var(--green); text-shadow:var(--green-glow);
}
.live-dot {
  width:8px; height:8px; border-radius:50%;
  background:var(--green); box-shadow:var(--green-glow);
  animation:live-pulse 1.4s ease-in-out infinite;
}
@keyframes live-pulse { 0%,100%{opacity:1;box-shadow:0 0 8px var(--green),0 0 20px var(--green);} 50%{opacity:.2;box-shadow:none;} }

/* 온도 상태 배지 */
.temp-strip { display:flex; gap:6px; align-items:center; }
.temp-badge {
  font-family:var(--mono); font-size:10px; letter-spacing:1px;
  padding:3px 10px; border-radius:3px; border:1px solid;
}
.temp-badge.hot  { color:var(--heat);  border-color:var(--heat-b);  background:var(--heat-dim); }
.temp-badge.warn { color:var(--amber); border-color:var(--amber-b); background:var(--amber-dim); }
.temp-badge.ok   { color:var(--green); border-color:var(--green-b); background:var(--green-dim); }

/* 갱신 주기 */
.hd-refresh { display:flex; align-items:center; gap:4px; }
.hd-refresh-lbl { font-family:var(--mono); font-size:9px; color:var(--t2); }

/* 시계 */
.h-clock { margin-left:auto; font-family:var(--mono); font-size:15px; color:var(--cyan); text-shadow:var(--cyan-glow); letter-spacing:2px; }

/* ── 공통 버튼 ── */
.hbtn {
  font-family:var(--mono); font-size:9px; letter-spacing:1px; text-transform:uppercase;
  padding:3px 10px; border-radius:3px; border:1px solid var(--cyan-b);
  background:transparent; color:var(--t2); cursor:pointer; transition:all .15s;
}
.hbtn.on  { background:var(--cyan-dim); border-color:var(--cyan); color:var(--cyan); }
.hbtn:hover:not(.on) { color:var(--t1); border-color:rgba(0,240,255,.35); }

/* Refresh bar */
.rf-bar { position:fixed; top:58px; left:0; right:0; height:2px; z-index:100; background:var(--t4); }
.rf-fill { height:100%; background:linear-gradient(90deg,var(--cyan),var(--heat)); box-shadow:0 0 8px var(--cyan); width:0%; }

/* ══ LAYOUT ══ */
.main {
  flex:1; min-height:0;
  display:grid;
  grid-template-rows: 80px 1fr;
  grid-template-columns: 1fr 280px;
  gap:8px; padding:8px; overflow:hidden;
}

/* ── KPI ROW ── */
.kpi-row { grid-column:1/-1; grid-row:1; display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
.kpi {
  background:var(--bg-panel); border:1px solid var(--cyan-b); border-radius:var(--r2);
  padding:10px 14px 10px 18px; position:relative; overflow:hidden;
  display:flex; flex-direction:column; justify-content:space-between;
}
.kpi-stripe { position:absolute; left:0; top:8px; bottom:8px; width:2px; border-radius:0 2px 2px 0; }
.kpi.k-red   .kpi-stripe { background:var(--red);   box-shadow:var(--red-glow); }
.kpi.k-heat  .kpi-stripe { background:var(--heat);  box-shadow:var(--heat-glow); }
.kpi.k-cyan  .kpi-stripe { background:var(--cyan);  box-shadow:var(--cyan-glow); }
.kpi.k-green .kpi-stripe { background:var(--green); box-shadow:var(--green-glow); }
.kpi.k-amb   .kpi-stripe { background:var(--amber); }
.kpi-lbl { font-family:var(--mono); font-size:9px; color:var(--t2); letter-spacing:2px; text-transform:uppercase; }
.kpi-num { font-family:var(--mono); font-size:28px; font-weight:400; line-height:1; letter-spacing:-1px; }
.kpi.k-red   .kpi-num { color:var(--red);   text-shadow:var(--red-glow); }
.kpi.k-heat  .kpi-num { color:var(--heat);  text-shadow:var(--heat-glow); }
.kpi.k-cyan  .kpi-num { color:var(--cyan);  text-shadow:var(--cyan-glow); }
.kpi.k-green .kpi-num { color:var(--green); text-shadow:var(--green-glow); }
.kpi.k-amb   .kpi-num { color:var(--amber); }
.kpi-hint { font-family:var(--mono); font-size:8px; color:var(--t3); letter-spacing:1px; }

/* ── PANEL BASE ── */
.panel { background:var(--bg-panel); border:1px solid var(--cyan-b); border-radius:var(--r2); display:flex; flex-direction:column; min-height:0; overflow:hidden; }
.ph {
  flex-shrink:0; height:36px; display:flex; align-items:center; justify-content:space-between;
  padding:0 13px; border-bottom:1px solid var(--cyan-b); background:var(--bg-deep);
}
.ph-l { display:flex; align-items:center; gap:8px; }
.ph-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.ph-name { font-family:var(--hud); font-size:9px; font-weight:700; color:var(--cyan); letter-spacing:3px; text-transform:uppercase; text-shadow:var(--cyan-glow); }
.ph-badge { font-family:var(--mono); font-size:10px; padding:1px 9px; border-radius:8px; border:1px solid var(--cyan-b); color:var(--t2); background:var(--bg); }
.ph-badge.danger { color:var(--red); border-color:var(--red-b); background:var(--red-dim); animation:blink-badge 1.5s ease-in-out infinite; }
@keyframes blink-badge { 0%,100%{opacity:1;} 50%{opacity:.5;} }

/* ── 하단 왼쪽 ── */
.left { grid-column:1; grid-row:2; display:grid; grid-template-rows:1fr 1fr; gap:8px; min-height:0; }

/* 차트 툴바 */
.chart-toolbar {
  flex-shrink:0; display:flex; align-items:center; gap:8px;
  padding:5px 10px; border-bottom:1px solid var(--cyan-b);
  background:var(--bg-deep); flex-wrap:wrap;
}
.tb-sep { width:1px; height:16px; background:var(--cyan-b); flex-shrink:0; }
.tb-lbl { font-family:var(--mono); font-size:9px; color:var(--t2); letter-spacing:1px; white-space:nowrap; }
.dt-input {
  height:24px; background:var(--bg); border:1px solid var(--cyan-b);
  color:var(--cyan); font-family:var(--mono); font-size:10px;
  padding:0 7px; outline:none; border-radius:3px; transition:border-color .2s;
}
.dt-input:focus { border-color:var(--cyan); box-shadow:0 0 6px rgba(0,240,255,.25); }
.dt-input::-webkit-calendar-picker-indicator { filter:invert(.4) sepia(1) saturate(2) hue-rotate(170deg); cursor:pointer; }
.qbtn {
  font-family:var(--mono); font-size:9px; letter-spacing:1px;
  padding:3px 9px; border-radius:3px; border:1px solid var(--amber-b);
  background:transparent; color:var(--amber); cursor:pointer; transition:all .15s; white-space:nowrap;
}
.qbtn.on { background:var(--amber-dim); border-color:var(--amber); }
.qbtn:hover:not(.on) { background:var(--amber-dim); }
.apply-btn {
  font-family:var(--mono); font-size:9px; letter-spacing:1px;
  padding:3px 10px; border-radius:3px; border:1px solid var(--cyan-b);
  background:var(--cyan-dim); color:var(--cyan); cursor:pointer; transition:all .15s;
}
.apply-btn:hover { box-shadow:var(--cyan-glow); border-color:var(--cyan); }

/* 차트 영역 */
.chart-wrap { flex:1; min-height:0; padding:8px 12px 6px; position:relative; }
.chart-wrap canvas { width:100%!important; height:100%!important; }
.legend {
  flex-shrink:0; padding:5px 12px; display:flex; gap:4px; flex-wrap:wrap;
  border-top:1px solid var(--cyan-b); background:var(--bg-deep);
}
.leg-item {
  display:flex; align-items:center; gap:5px;
  font-family:var(--mono); font-size:10px; color:var(--t2);
  padding:2px 7px; border-radius:3px; border:1px solid transparent;
  cursor:pointer; transition:all .15s; user-select:none;
}
.leg-item:hover { border-color:var(--cyan-b); color:var(--t1); }
.leg-item.off { opacity:.25; }
.leg-line { width:16px; height:2px; border-radius:1px; flex-shrink:0; }

/* ── 알람 목록 ── */
.alarm-filter {
  flex-shrink:0; display:flex; gap:3px; padding:5px 9px;
  border-bottom:1px solid var(--cyan-b); background:var(--bg-deep);
}
.fbtn {
  font-family:var(--mono); font-size:9px; padding:3px 9px; border-radius:3px;
  border:1px solid var(--cyan-b); background:transparent; color:var(--t2);
  cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:4px; letter-spacing:.5px;
}
.fbtn .bc { font-size:9px; padding:0 5px; border-radius:8px; background:var(--bg); color:var(--t2); min-width:16px; text-align:center; }
.fbtn.on-all { color:var(--t1); border-color:rgba(0,240,255,.4); background:var(--cyan-dim); }
.fbtn.on-all .bc { background:var(--cyan); color:var(--bg); }
.fbtn.on-lv1 { background:var(--red-dim); border-color:var(--red-b); color:var(--red); }
.fbtn.on-lv1 .bc { background:var(--red); color:#fff; }
.fbtn.on-lv2 { background:var(--amber-dim); border-color:var(--amber-b); color:var(--amber); }
.fbtn.on-lv2 .bc { background:var(--amber); color:var(--bg); }
.fbtn.on-lv3 { background:var(--ice-dim); border-color:var(--ice-b); color:var(--ice); }
.fbtn.on-lv3 .bc { background:var(--ice); color:var(--bg); }
.fbtn:hover:not([class*="on-"]) { color:var(--t1); background:var(--bg-hover); }

.a-scroll { flex:1; min-height:0; overflow-y:auto; }
.a-scroll::-webkit-scrollbar { width:3px; }
.a-scroll::-webkit-scrollbar-thumb { background:var(--cyan-b); border-radius:2px; }

/* 알람 테이블 — 컬럼 최적화 */
.a-tbl { width:100%; border-collapse:collapse; table-layout:fixed; }
.a-tbl th {
  position:sticky; top:0; background:var(--bg-deep);
  font-family:var(--mono); font-size:9px; color:var(--t2); font-weight:400;
  letter-spacing:1px; text-transform:uppercase; padding:5px 8px;
  text-align:left; border-bottom:1px solid var(--cyan-b); white-space:nowrap;
}
.a-tbl td { padding:7px 8px; vertical-align:middle; border-bottom:1px solid var(--t4); }
.a-tbl tr { transition:background .12s; cursor:pointer; }
.a-tbl tr:hover td { background:var(--bg-hover); }
.a-tbl tr:last-child td { border-bottom:none; }

/* 컬럼 폭 */
.col-lv   { width:76px; }
.col-tag  { width:110px; }
.col-msg  { /* flex */ }
.col-val  { width:72px; }
.col-time { width:120px; }

.lv-cell { display:flex; align-items:center; gap:5px; }
.lv-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.r-lv1 .lv-dot { background:var(--red);   box-shadow:0 0 5px var(--red); }
.r-lv2 .lv-dot { background:var(--amber); }
.r-lv3 .lv-dot { background:var(--ice); }
.lv-txt { font-family:var(--mono); font-size:10px; font-weight:600; white-space:nowrap; }
.r-lv1 .lv-txt { color:var(--red); }
.r-lv2 .lv-txt { color:var(--amber); }
.r-lv3 .lv-txt { color:var(--ice); }

.c-tag  { font-family:var(--mono); font-size:11px; color:var(--t1); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.c-msg  { font-size:11px; color:var(--t2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:0; }
.c-val  { font-family:var(--mono); font-size:11px; color:var(--amber); font-weight:600; text-align:right; white-space:nowrap; }
.c-time { font-family:var(--mono); font-size:10px; color:var(--t2); text-align:right; white-space:nowrap; }

@keyframes row-new { 0%,100%{opacity:1;} 50%{opacity:.2;} }
.new-r td { animation:row-new .5s ease 3; }
.empty-r td { text-align:center; padding:24px; font-family:var(--mono); font-size:11px; color:var(--t3); letter-spacing:2px; }

/* ── 오른쪽 ── */
.right { grid-column:2; grid-row:2; display:flex; flex-direction:column; gap:8px; min-height:0; overflow:hidden; }

/* 센서 카드 */
.s-cards { padding:6px; display:flex; flex-direction:column; gap:4px; }
.s-card {
  background:var(--bg-deep); border:1px solid var(--cyan-b); border-radius:var(--r);
  padding:8px 10px; position:relative; overflow:hidden; transition:all .2s;
}
.s-card.w { border-color:var(--amber-b); background:var(--amber-dim); }
.s-card.c { border-color:var(--red-b); background:var(--red-dim); animation:crit-glow 2s ease-in-out infinite; }
@keyframes crit-glow { 0%,100%{box-shadow:none;} 50%{box-shadow:inset 0 0 10px rgba(255,59,92,.12);} }
.s-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:6px; }
.s-name { font-size:11px; color:var(--t1); font-weight:500; }
.s-badge { font-family:var(--mono); font-size:8px; padding:1px 6px; border-radius:2px; letter-spacing:.5px; }
.s-badge.ok   { background:var(--green-dim); color:var(--green); border:1px solid var(--green-b); }
.s-badge.warn { background:var(--amber-dim); color:var(--amber); border:1px solid var(--amber-b); }
.s-badge.crit { background:var(--red-dim);   color:var(--red);   border:1px solid var(--red-b); }
.s-bot { display:flex; align-items:flex-end; justify-content:space-between; }
.s-val { font-family:var(--mono); font-size:22px; font-weight:400; line-height:1; }
.s-val.ok   { color:var(--t1); }
.s-val.warn { color:var(--amber); }
.s-val.crit { color:var(--red); text-shadow:var(--red-glow); }
.s-unit { font-family:var(--mono); font-size:10px; color:var(--t2); margin-bottom:1px; margin-left:2px; }
.s-thr  { display:flex; gap:3px; }
.s-chip { font-family:var(--mono); font-size:8px; padding:1px 5px; border-radius:2px; color:var(--t2); background:var(--bg); border:1px solid var(--t3); }
.s-gauge { position:absolute; bottom:0; left:0; height:2px; transition:width .7s ease; opacity:.7; }

/* 타임라인 */
.tl-body { flex:1; min-height:0; overflow-y:auto; padding:8px 10px; }
.tl-body::-webkit-scrollbar { width:3px; }
.tl-body::-webkit-scrollbar-thumb { background:var(--cyan-b); border-radius:2px; }
.tl-item { display:flex; gap:9px; padding-bottom:12px; position:relative; }
.tl-item::after { content:''; position:absolute; left:5px; top:13px; bottom:0; width:1px; background:linear-gradient(var(--cyan-b),transparent); }
.tl-item:last-child::after { display:none; }
.tl-node { width:11px; height:11px; border-radius:50%; flex-shrink:0; margin-top:2px; position:relative; z-index:1; }
.tl-node.n1 { background:var(--red);   box-shadow:0 0 7px rgba(255,59,92,.55); }
.tl-node.n2 { background:var(--amber); box-shadow:0 0 5px rgba(255,183,0,.4); }
.tl-node.n3 { background:var(--ice);   box-shadow:0 0 5px rgba(56,189,248,.4); }
.tl-in { flex:1; min-width:0; }
.tl-h  { display:flex; align-items:center; justify-content:space-between; margin-bottom:2px; }
.tl-tag  { font-family:var(--mono); font-size:11px; color:var(--t1); font-weight:500; }
.tl-time { font-family:var(--mono); font-size:9px; color:var(--t2); }
.tl-msg  { font-size:11px; color:var(--t2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tl-val  { font-family:var(--mono); font-size:10px; color:var(--amber); margin-top:2px; }
.tl-empty { padding:24px; text-align:center; font-family:var(--mono); font-size:11px; color:var(--t3); letter-spacing:2px; }

/* TOAST */
#toast {
  position:fixed; top:66px; right:18px; z-index:9998;
  font-family:var(--sans); font-size:12px; font-weight:500;
  padding:9px 14px 9px 11px; border-radius:var(--r2);
  opacity:0; transform:translateY(-8px);
  transition:opacity .2s, transform .2s; pointer-events:none;
  background:var(--bg-panel); border:1px solid var(--red-b); color:var(--t1);
  box-shadow:0 8px 28px rgba(0,0,0,.6), var(--red-glow);
  display:flex; align-items:center; gap:8px;
}
.toast-lbl { background:var(--red); color:#fff; font-family:var(--mono); font-size:9px; padding:1px 7px; border-radius:8px; font-weight:600; letter-spacing:1px; }
#toast.show { opacity:1; transform:translateY(0); }
</style>
</head>
<body>

<div class="rf-bar"><div class="rf-fill" id="rfFill"></div></div>

<!-- ══ HEADER — TempMonitor 스타일 ══ -->
<div class="page-header">
  <div class="h-title-block">
    <div class="h-title">⚡TEMP <span>ALARM</span> OVERVIEW</div>
    <div class="h-sub">// Real-time temperature alarm monitoring dashboard</div>
  </div>

  <div class="live-badge"><div class="live-dot"></div>LIVE</div>

  <div class="temp-strip" id="tempStrip">
    <div class="temp-badge ok">NORMAL</div>
  </div>

  <div class="hd-refresh" style="margin-left:8px;">
    <span class="hd-refresh-lbl" style="margin-right:4px;">REFRESH</span>
    <button class="hbtn on" onclick="setRf(3,this)">3s</button>
    <button class="hbtn"    onclick="setRf(5,this)">5s</button>
    <button class="hbtn"    onclick="setRf(10,this)">10s</button>
  </div>

  <div class="h-clock" id="hClock">--:--:--</div>
</div>

<jsp:include page="/WEB-INF/views/include/monitorNav.jsp"/>

<div class="main">

  <!-- KPI ROW -->
  <div class="kpi-row">
    <div class="kpi k-red">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">Active Alarms</div>
      <div class="kpi-num" id="kpiActive">0</div>
      <div class="kpi-hint" id="kpiActiveSub">현재 발생 중</div>
    </div>
    <div class="kpi k-heat">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">Critical (Lv.1)</div>
      <div class="kpi-num" id="kpiLv1">0</div>
      <div class="kpi-hint">즉시 조치 필요</div>
    </div>
    <div class="kpi k-cyan">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">Max Temperature</div>
      <div class="kpi-num" id="kpiMax">--°</div>
      <div class="kpi-hint" id="kpiMaxTag">측정 중…</div>
    </div>
    <div class="kpi k-green">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">Normal Sensors</div>
      <div class="kpi-num" id="kpiNorm">0</div>
      <div class="kpi-hint">임계값 이하 운전</div>
    </div>
    <div class="kpi k-amb">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">Today's Alarms</div>
      <div class="kpi-num" id="kpiToday">0</div>
      <div class="kpi-hint">금일 누적</div>
    </div>
  </div>

  <!-- 하단 왼쪽 -->
  <div class="left">

    <!-- 차트 패널 -->
    <div class="panel">
      <div class="ph">
        <div class="ph-l">
          <div class="ph-dot" style="background:var(--cyan);box-shadow:var(--cyan-glow)"></div>
          <div class="ph-name">Temperature Trend</div>
        </div>
      </div>
      <!-- 차트 툴바: Quick Range + 날짜 범위 직접 선택 -->
      <div class="chart-toolbar">
        <span class="tb-lbl">QUICK</span>
        <button class="qbtn on" id="qbtn1"  onclick="quickRange(1,this)">1H</button>
        <button class="qbtn"    id="qbtn3"  onclick="quickRange(3,this)">3H</button>
        <button class="qbtn"    id="qbtn6"  onclick="quickRange(6,this)">6H</button>
        <button class="qbtn"    id="qbtn24" onclick="quickRange(24,this)">24H</button>
        <div class="tb-sep"></div>
        <span class="tb-lbl">FROM</span>
        <input type="datetime-local" id="fromDt" class="dt-input">
        <span class="tb-lbl">TO</span>
        <input type="datetime-local" id="toDt"   class="dt-input">
        <button class="apply-btn" onclick="applyRange()">APPLY</button>
      </div>
      <div class="chart-wrap"><canvas id="tempChart"></canvas></div>
      <div class="legend" id="legend"></div>
    </div>

    <!-- 알람 목록 패널 -->
    <div class="panel">
      <div class="ph">
        <div class="ph-l">
          <div class="ph-dot" style="background:var(--red);box-shadow:var(--red-glow);animation:live-pulse 1.2s ease-in-out infinite"></div>
          <div class="ph-name">Active Alarm List</div>
        </div>
        <span class="ph-badge danger" id="activeCnt">0</span>
      </div>
      <div class="alarm-filter">
        <button class="fbtn on-all" onclick="setFilter(0,this)">ALL <span class="bc" id="fc0">0</span></button>
        <button class="fbtn"        onclick="setFilter(1,this)">CRITICAL <span class="bc" id="fc1">0</span></button>
        <button class="fbtn"        onclick="setFilter(2,this)">WARNING  <span class="bc" id="fc2">0</span></button>
        <button class="fbtn"        onclick="setFilter(3,this)">CAUTION  <span class="bc" id="fc3">0</span></button>
      </div>
      <div class="a-scroll">
        <table class="a-tbl">
          <thead><tr>
            <th class="col-lv">Level</th>
            <th class="col-tag">Tag</th>
            <th class="col-msg">Message</th>
            <th class="col-val" style="text-align:right">Value</th>
            <th class="col-time" style="text-align:right">Occurred</th>
          </tr></thead>
          <tbody id="alarmTbody">
            <tr class="empty-r"><td colspan="5">No active alarms — System normal</td></tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <!-- 오른쪽 -->
  <div class="right">
    <!-- 센서 현황 -->
    <div class="panel" style="flex-shrink:0;">
      <div class="ph">
        <div class="ph-l">
          <div class="ph-dot" style="background:var(--green);box-shadow:var(--green-glow)"></div>
          <div class="ph-name">Sensor Status</div>
        </div>
        <span class="ph-badge" id="sTime">--:--:--</span>
      </div>
      <div class="s-cards" id="sCards"></div>
    </div>
    <!-- 알람 이력 -->
    <div class="panel" style="flex:1;min-height:0;">
      <div class="ph">
        <div class="ph-l">
          <div class="ph-dot" style="background:var(--ice);box-shadow:0 0 6px var(--ice)"></div>
          <div class="ph-name">Event Timeline</div>
        </div>
        <span class="ph-badge" id="tlCnt">0</span>
      </div>
      <div class="tl-body" id="tlBody">
        <div class="tl-empty">[ NO EVENTS ]</div>
      </div>
    </div>
  </div>

</div>

<div id="toast"></div>

<script>
/* ════ CONFIG ════ */
const base = '<%=ctx%>';
const DAYS = ['일','월','화','수','목','금','토'];
const LVL  = {1:'CRITICAL', 2:'WARNING', 3:'CAUTION'};
const DEFAULT_THR = {
  tag_temp1:{warn:50,crit:55}, tag_temp1_2:{warn:49,crit:54},
  tag_temp2:{warn:80,crit:88}, tag_temp3:{warn:32,crit:36}, tag_t_1234:{warn:105,crit:115}
};
const PAL = ['#00f0ff','#ff6b00','#00ff88','#ffb700','#b06cff','#ff3b5c','#00cfbd','#ffd166','#06d6a0','#ef476f'];

/* ════ STATE ════ */
let tagMeta=[], hiddenSet=new Set(), thrMap={};
let chart=null, filterLv=0;
let prevKeys=new Set(), rfMs=3000, timer=null, rfRaf=null;
/* 범위 모드: 'quick' | 'custom' */
let rangeMode='quick', rangeH=1;

/* ════ CLOCK ════ */
function tick(){
  const n=new Date(), p=v=>String(v).padStart(2,'0');
  document.getElementById('hClock').textContent=p(n.getHours())+':'+p(n.getMinutes())+':'+p(n.getSeconds());
}
setInterval(tick,1000); tick();

/* ════ PROGRESS BAR ════ */
function animBar(ms){
  const el=document.getElementById('rfFill'); let st=null;
  if(rfRaf) cancelAnimationFrame(rfRaf);
  function step(ts){ if(!st)st=ts; const p=Math.min((ts-st)/ms*100,100); el.style.width=p+'%'; if(p<100)rfRaf=requestAnimationFrame(step); }
  el.style.width='0%'; rfRaf=requestAnimationFrame(step);
}

/* ════ 갱신 주기 ════ */
function setRf(sec,btn){
  rfMs=sec*1000;
  document.querySelectorAll('.hd-refresh .hbtn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  if(timer) clearInterval(timer);
  timer=setInterval(refresh, rfMs);
}

/* ════ RANGE ════ */
function toLocalDt(dt){
  const p=n=>String(n).padStart(2,'0');
  return dt.getFullYear()+'-'+p(dt.getMonth()+1)+'-'+p(dt.getDate())+'T'+p(dt.getHours())+':'+p(dt.getMinutes());
}
function toSql(dt){
  const p=n=>String(n).padStart(2,'0');
  return dt.getFullYear()+'-'+p(dt.getMonth()+1)+'-'+p(dt.getDate())+' '+p(dt.getHours())+':'+p(dt.getMinutes())+':00';
}

function quickRange(h, btn){
  rangeMode='quick'; rangeH=h;
  document.querySelectorAll('.qbtn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  /* datetime-local 값도 동기화 */
  const now=new Date(), from=new Date(now-h*3600000);
  document.getElementById('fromDt').value=toLocalDt(from);
  document.getElementById('toDt').value=toLocalDt(now);
  loadChart();
}

function applyRange(){
  const fv=document.getElementById('fromDt').value;
  const tv=document.getElementById('toDt').value;
  if(!fv||!tv) return;
  rangeMode='custom';
  document.querySelectorAll('.qbtn').forEach(b=>b.classList.remove('on'));
  loadChart();
}

function getCurrentRange(){
  if(rangeMode==='custom'){
    const fv=document.getElementById('fromDt').value;
    const tv=document.getElementById('toDt').value;
    if(fv&&tv) return { from:new Date(fv), to:new Date(tv) };
  }
  const now=new Date(), from=new Date(now-rangeH*3600000);
  return { from, to:now };
}

/* ════ 필터 ════ */
function setFilter(lv,btn){
  filterLv=lv;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('on-all','on-lv1','on-lv2','on-lv3'));
  if(lv===0) btn.classList.add('on-all');
  else btn.classList.add('on-lv'+lv);
  renderTable(window._alarms||[]);
}

/* ════ 유틸 ════ */
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function toTs(v){
  if(!v) return null;
  if(typeof v==='number') return v>1e11?v:v*1000;
  const s=String(v).includes('T')?String(v):String(v).replace(' ','T');
  const t=Date.parse(s); return isNaN(t)?null:t;
}
function fmtTs(s){ return (s||'').substring(0,19).replace('T',' '); }
function p2(v){ return String(v).padStart(2,'0'); }

/* ════ TOAST ════ */
function showToast(msg){
  const el=document.getElementById('toast');
  el.innerHTML=`<span class="toast-lbl">NEW</span>${msg}`;
  el.classList.add('show'); clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('show'),3500);
}

/* ════ HEADER 온도 배지 ════ */
function updateTempBadge(maxVal){
  const strip=document.getElementById('tempStrip');
  let cls='ok', label='NORMAL';
  if(maxVal>80)      { cls='hot';  label='HIGH '+maxVal.toFixed(0)+'°'; }
  else if(maxVal>50) { cls='warn'; label='WARM '+maxVal.toFixed(0)+'°'; }
  else               { label='OK '+maxVal.toFixed(0)+'°'; }
  strip.innerHTML=`<div class="temp-badge ${cls}">${label}</div>`;
}

/* ════ META ════ */
function loadMeta(){
  return fetch(base+'/temp/cols').then(r=>r.json()).then(list=>{
    tagMeta=(list||[]).map((c,i)=>({tagName:c.tagName, colName:c.colName, color:PAL[i%PAL.length]}));
    thrMap={}; tagMeta.forEach(t=>{ thrMap[t.colName]=DEFAULT_THR[t.colName]||{warn:80,crit:95}; });
    renderLegend(); renderSCards({});
    /* 초기 datetime 세팅 */
    const now=new Date(), from=new Date(now-rangeH*3600000);
    document.getElementById('fromDt').value=toLocalDt(from);
    document.getElementById('toDt').value=toLocalDt(now);
  });
}

function renderLegend(){
  document.getElementById('legend').innerHTML=tagMeta.map(t=>
    `<div class="leg-item${hiddenSet.has(t.colName)?' off':''}" onclick="toggleTag('${t.colName}')">
       <div class="leg-line" style="background:${t.color};box-shadow:0 0 4px ${t.color}80"></div>${esc(t.tagName)}
     </div>`).join('');
}
function toggleTag(cn){
  hiddenSet.has(cn)?hiddenSet.delete(cn):hiddenSet.add(cn);
  renderLegend();
  if(chart){ const ds=chart.data.datasets.find(d=>d.colName===cn); if(ds){ds.hidden=hiddenSet.has(cn);chart.update('none');} }
}

/* ════ CHART ════ */
function loadChart(){
  const {from,to}=getCurrentRange();
  const qs='?from='+encodeURIComponent(toSql(from))+'&to='+encodeURIComponent(toSql(to));
  fetch(base+'/temp/snapshot/range'+qs).then(r=>r.json()).then(rows=>{ updateChart(rows||[]); updateSCards(rows||[]); });
}

function updateChart(rows){
  /* 어노테이션 */
  const ann={};
  tagMeta.forEach((t,i)=>{
    const th=thrMap[t.colName]||{};
    ann['w'+i]={type:'line',yMin:th.warn,yMax:th.warn,borderColor:t.color+'44',borderWidth:1.2,borderDash:[5,4]};
    ann['c'+i]={type:'line',yMin:th.crit,yMax:th.crit,borderColor:'rgba(255,59,92,.4)',borderWidth:1.2,borderDash:[3,3]};
  });
  /* 데이터 */
  const nd=tagMeta.map(t=>
    rows.map(row=>{
      const ts=toTs(row.record_time||row.recordTime);
      const v=row[t.colName];
      return ts?{x:ts,y:v!=null?Number(v):null}:null;
    }).filter(Boolean)
  );
  /* KPI */
  const flat=nd.flat().map(p=>p.y).filter(v=>v!=null);
  if(flat.length){
    const mx=Math.max(...flat);
    document.getElementById('kpiMax').textContent=mx.toFixed(1)+'°';
    updateTempBadge(mx);
    if(rows.length){
      const last=rows[rows.length-1]; let mxT='',mxV=-Infinity;
      tagMeta.forEach(t=>{ const v=Number(last[t.colName]||0); if(v>mxV){mxV=v;mxT=t.tagName;} });
      document.getElementById('kpiMaxTag').textContent=mxT;
    }
  }

  Chart.defaults.color='#4a6a88';
  Chart.defaults.borderColor='rgba(0,240,255,.06)';
  Chart.defaults.font.family="'Share Tech Mono',monospace";
  Chart.defaults.font.size=10;

  if(!chart){
    chart=new Chart(document.getElementById('tempChart').getContext('2d'),{
      type:'line',
      data:{ datasets:tagMeta.map((t,i)=>({
        colName:t.colName, label:t.tagName, data:nd[i],
        borderColor:t.color, backgroundColor:t.color+'0f',
        borderWidth:2, pointRadius:0, pointHoverRadius:5,
        tension:0.3, fill:false, hidden:hiddenSet.has(t.colName)
        /* 실선 — borderDash 없음 */
      }))},
      options:{
        responsive:true, maintainAspectRatio:false,
        animation:{duration:500, easing:'easeInOutQuart'},
        parsing:false,
        scales:{
          x:{
            type:'time',
            time:{tooltipFormat:'HH:mm:ss', displayFormats:{minute:'HH:mm', hour:'HH:mm'}},
            grid:{color:'rgba(0,240,255,.05)', drawBorder:false},
            ticks:{color:'#4a6a88', maxTicksLimit:8, font:{size:10}}
          },
          y:{
            grid:{color:'rgba(0,240,255,.05)', drawBorder:false},
            ticks:{color:'#4a6a88', callback:v=>v+'°', font:{size:10}}
          }
        },
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:'rgba(6,8,16,.97)',
            borderColor:'rgba(0,240,255,.35)', borderWidth:1,
            titleColor:'#4a6a88', bodyColor:'#d8edf8', padding:10,
            titleFont:{family:"'Share Tech Mono'", size:10},
            bodyFont:{family:"'Share Tech Mono'", size:11},
            callbacks:{
              title:items=>new Date(items[0].parsed.x).toLocaleTimeString('ko-KR'),
              label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y!=null?ctx.parsed.y.toFixed(2)+'°C':'--'}`
            }
          },
          annotation:{annotations:ann}
        },
        interaction:{mode:'index',intersect:false}
      }
    });
  } else {
    /* ── 데이터만 교체 → 선 유지 ── */
    tagMeta.forEach((t,i)=>{
      const ds=chart.data.datasets.find(d=>d.colName===t.colName);
      if(ds){ ds.data=nd[i]; ds.hidden=hiddenSet.has(t.colName); }
    });
    chart.options.plugins.annotation.annotations=ann;
    chart.update('none');
  }
}

/* ════ SENSOR CARDS ════ */
function renderSCards(row){
  document.getElementById('sCards').innerHTML=tagMeta.map(t=>{
    const v=row[t.colName], num=v!=null?Number(v):null;
    const th=thrMap[t.colName]||{};
    let cls='',valCls='ok',badge='NORMAL',bCls='ok';
    if(num!=null&&num>=th.crit){cls='c';valCls='crit';badge='CRITICAL';bCls='crit';}
    else if(num!=null&&num>=th.warn){cls='w';valCls='warn';badge='WARNING';bCls='warn';}
    const pct=num!=null?Math.min(Math.max((num-10)/((th.crit||100)*1.12-10)*100,0),100):0;
    const gc=valCls==='crit'?'var(--red)':valCls==='warn'?'var(--amber)':t.color;
    return `<div class="s-card ${cls}">
      <div class="s-top"><div class="s-name">${esc(t.tagName)}</div><div class="s-badge ${bCls}">${badge}</div></div>
      <div class="s-bot">
        <div style="display:flex;align-items:baseline">
          <span class="s-val ${valCls}">${num!=null?num.toFixed(1):'--'}</span>
          <span class="s-unit">°C</span>
        </div>
        <div class="s-thr">
          <span class="s-chip">WARN ${th.warn}°</span>
          <span class="s-chip">CRIT ${th.crit}°</span>
        </div>
      </div>
      <div class="s-gauge" style="width:${pct}%;background:${gc}"></div>
    </div>`;
  }).join('');
}
function updateSCards(rows){
  renderSCards(rows.length?rows[rows.length-1]:{});
  const n=new Date();
  document.getElementById('sTime').textContent=p2(n.getHours())+':'+p2(n.getMinutes())+':'+p2(n.getSeconds());
  let ok=0;
  const last=rows.length?rows[rows.length-1]:{};
  tagMeta.forEach(t=>{ if(Number(last[t.colName]||0)<(thrMap[t.colName]?.warn||80))ok++; });
  document.getElementById('kpiNorm').textContent=ok;
}

/* ════ ALARMS ════ */
function loadAlarms(){
  Promise.all([
    fetch(base+'/alarm/active/list?limit=50').then(r=>r.json()).catch(()=>[]),
    fetch(base+'/alarm/history/list?limit=100').then(r=>r.json()).catch(()=>[])
  ]).then(([active,history])=>{
    active=active||[]; history=history||[];
    window._alarms=active;
    renderTable(active); renderTl(history);
    /* 새 알람 감지 */
    const nk=new Set(active.map(a=>a.tagName+'_'+a.occurTime));
    let nc=0; nk.forEach(k=>{ if(!prevKeys.has(k))nc++; });
    if(nc>0) showToast(`${nc} new alarm${nc>1?'s':''} triggered`);
    prevKeys=nk;
    /* KPI */
    const cnt=active.length, lv1=active.filter(a=>(a.level||1)===1).length;
    document.getElementById('kpiActive').textContent=cnt;
    document.getElementById('kpiLv1').textContent=lv1;
    document.getElementById('kpiActiveSub').textContent=cnt>0?`Lv.1 critical: ${lv1}`:'System normal';
    document.getElementById('activeCnt').textContent=cnt;
    [0,1,2,3].forEach(lv=>{
      const c=lv===0?cnt:active.filter(a=>(a.level||1)===lv).length;
      const el=document.getElementById('fc'+lv); if(el)el.textContent=c;
    });
    /* 헤더 온도 배지 업데이트 (알람 없을 때) */
    if(cnt===0&&flat_last!=null) updateTempBadge(flat_last);
    const today=new Date().toDateString();
    document.getElementById('kpiToday').textContent=history.filter(a=>new Date(a.occurTime||'').toDateString()===today).length;
    document.getElementById('tlCnt').textContent=Math.min(history.length,30);
  });
}

let flat_last=null;

function renderTable(list){
  const tb=document.getElementById('alarmTbody');
  const fl=filterLv===0?list:list.filter(a=>(a.level||1)===filterLv);
  if(!fl.length){tb.innerHTML=`<tr class="empty-r"><td colspan="5">No active alarms — System normal</td></tr>`;return;}
  tb.innerHTML=fl.map(a=>{
    const lv=a.level||1, key=a.tagName+'_'+a.occurTime, isN=!prevKeys.has(key);
    const val=a.valueAtOccur!=null?Number(a.valueAtOccur).toFixed(1)+'°':'--';
    return `<tr class="r-lv${lv}${isN?' new-r':''}" onclick="hlTag('${esc(a.tagName||'')}')">
      <td class="col-lv"><div class="lv-cell r-lv${lv}"><div class="lv-dot"></div><span class="lv-txt">${LVL[lv]||'LV'+lv}</span></div></td>
      <td class="col-tag c-tag" title="${esc(a.tagName||'')}">${esc(a.tagName||'—')}</td>
      <td class="col-msg c-msg" title="${esc(a.alarmMsg||'')}">${esc(a.alarmMsg||'Alarm triggered')}</td>
      <td class="col-val c-val">${val}</td>
      <td class="col-time c-time">${fmtTs(a.occurTime)}</td>
    </tr>`;
  }).join('');
}

function renderTl(list){
  const w=document.getElementById('tlBody');
  const r=list.slice(0,30);
  if(!r.length){w.innerHTML='<div class="tl-empty">[ NO EVENTS ]</div>';return;}
  w.innerHTML=r.map(a=>{
    const lv=a.level||1, val=a.valueAtOccur!=null?Number(a.valueAtOccur).toFixed(1)+'°C':'';
    return `<div class="tl-item">
      <div class="tl-node n${lv}"></div>
      <div class="tl-in">
        <div class="tl-h"><span class="tl-tag">${esc(a.tagName||'—')}</span><span class="tl-time">${fmtTs(a.occurTime).substring(11)}</span></div>
        <div class="tl-msg" title="${esc(a.alarmMsg||'')}">${esc(a.alarmMsg||'')}</div>
        ${val?`<div class="tl-val">${val}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

function hlTag(tn){
  if(!chart)return;
  chart.data.datasets.forEach(ds=>{ ds.borderWidth=ds.label===tn?3.5:1; });
  chart.update('none');
  setTimeout(()=>{ if(!chart)return; chart.data.datasets.forEach(ds=>{ds.borderWidth=2;}); chart.update('none'); },3000);
}

/* ════ MAIN LOOP ════ */
function refresh(){ animBar(rfMs); loadChart(); loadAlarms(); }
loadMeta().then(()=>{ refresh(); timer=setInterval(refresh,rfMs); });
</script>
</body>
</html>
