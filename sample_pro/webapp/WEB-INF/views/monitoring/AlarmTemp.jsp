<%@ page contentType="text/html; charset=UTF-8" %>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>온도 알람 모니터링</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=IBM+Plex+Mono:wght@300;400;500;600&family=Russo+One&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
<link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">
<style>
:root {
  --ink:        #08090f;
  --surface:    #0d0f1c;
  --panel:      #111526;
  --panel-2:    #161a2e;
  --rim:        rgba(255,255,255,.06);
  --rim-hi:     rgba(255,255,255,.11);

  --acid:   #c6ff00;
  --fire:   #ff4545;
  --sun:    #ffad0a;
  --ice:    #38bdf8;
  --mint:   #00e5a0;

  --acid-d: rgba(198,255,0,.12);
  --fire-d: rgba(255,69,69,.12);
  --sun-d:  rgba(255,173,10,.1);
  --ice-d:  rgba(56,189,248,.1);
  --mint-d: rgba(0,229,160,.1);

  --t1: #eef2ff;
  --t2: #8b95b3;
  --t3: #3f485f;
  --t4: #1e2438;

  --mono: 'IBM Plex Mono', monospace;
  --sans: 'Noto Sans KR', sans-serif;
  --disp: 'Russo One', sans-serif;
  --r: 6px; --r2: 10px;
}
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
html, body { height:100%; overflow:hidden; }
body {
  font-family: var(--sans); font-size:12px;
  color: var(--t1); background: var(--ink);
  display:flex; flex-direction:column; height:100%;
  background-image:
    linear-gradient(rgba(198,255,0,.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(198,255,0,.022) 1px, transparent 1px),
    radial-gradient(ellipse 70% 50% at 50% -5%, rgba(198,255,0,.07) 0%, transparent 55%),
    radial-gradient(ellipse 40% 60% at 95% 90%, rgba(56,189,248,.05) 0%, transparent 50%);
  background-size: 40px 40px, 40px 40px, 100% 100%, 100% 100%;
}
body::before {
  content:''; pointer-events:none; position:fixed; inset:0; z-index:9999;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.04) 2px, rgba(0,0,0,.04) 3px);
}

/* ══ HEADER ══ */
.hd {
  flex-shrink:0; height:52px;
  display:flex; align-items:center;
  background:var(--surface); border-bottom:1px solid var(--rim);
  position:relative; z-index:20;
}
.hd-logo {
  display:flex; align-items:center; gap:12px;
  padding:0 20px; height:100%; border-right:1px solid var(--rim); min-width:240px;
}
.hd-mark {
  width:32px; height:32px; background:var(--acid); border-radius:4px;
  display:flex; align-items:center; justify-content:center;
  font-family:var(--disp); font-size:14px; color:var(--ink); flex-shrink:0;
}
.hd-title { font-family:var(--disp); font-size:15px; letter-spacing:1px; color:var(--t1); line-height:1.1; }
.hd-title span { color:var(--acid); }
.hd-sub { font-family:var(--mono); font-size:9px; color:var(--t3); letter-spacing:1px; margin-top:2px; }

.hd-status {
  flex:1; display:flex; align-items:center; gap:6px; padding:0 16px; height:100%;
}
.chip {
  display:flex; align-items:center; gap:6px; padding:4px 12px;
  border-radius:20px; font-family:var(--mono); font-size:10px;
  border:1px solid transparent; white-space:nowrap; letter-spacing:.4px;
}
.chip.live { background:var(--fire-d); border-color:rgba(255,69,69,.28); color:var(--fire); }
.chip .dot { width:6px; height:6px; border-radius:50%; background:var(--fire); box-shadow:0 0 6px var(--fire); animation:bl 1.1s ease-in-out infinite; }
@keyframes bl { 0%,100%{opacity:1;} 50%{opacity:.1;} }
.chip.ok { background:var(--mint-d); border-color:rgba(0,229,160,.2); color:var(--mint); }
.chip.warn { background:var(--sun-d); border-color:rgba(255,173,10,.25); color:var(--sun); }
.chip.danger { background:var(--fire-d); border-color:rgba(255,69,69,.3); color:var(--fire); animation:cp 1.6s ease-in-out infinite; }
@keyframes cp { 0%,100%{opacity:1;} 50%{opacity:.55;} }

.hd-refresh { display:flex; align-items:center; gap:4px; margin-left:auto; }
.hd-refresh-lbl { font-family:var(--mono); font-size:9px; color:var(--t3); margin-right:2px; }

.hd-clock {
  padding:0 20px; height:100%; border-left:1px solid var(--rim);
  display:flex; flex-direction:column; align-items:flex-end; justify-content:center; gap:2px;
}
.clock-t { font-family:var(--mono); font-size:20px; font-weight:500; color:var(--t1); letter-spacing:3px; line-height:1; }
.clock-d { font-family:var(--mono); font-size:9px; color:var(--t3); letter-spacing:1.5px; }

.rf-bar { position:fixed; top:52px; left:0; right:0; height:2px; z-index:100; background:var(--t4); }
.rf-fill { height:100%; background:linear-gradient(90deg,var(--acid),var(--mint)); box-shadow:0 0 8px var(--acid); width:0%; }

/* ══ LAYOUT ══ */
.main {
  flex:1; min-height:0;
  display:grid;
  grid-template-rows: 84px 1fr;
  grid-template-columns: 1fr 296px;
  gap:8px; padding:8px; overflow:hidden;
}

/* ── KPI ── */
.kpi-row { grid-column:1/-1; grid-row:1; display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
.kpi {
  background:var(--panel); border:1px solid var(--rim); border-radius:var(--r2);
  padding:12px 14px 12px 18px; position:relative; overflow:hidden;
  display:flex; flex-direction:column; justify-content:space-between;
}
.kpi-stripe { position:absolute; left:0; top:10px; bottom:10px; width:3px; border-radius:0 3px 3px 0; }
.kpi.k-fire .kpi-stripe { background:var(--fire); box-shadow:0 0 10px var(--fire); }
.kpi.k-sun  .kpi-stripe { background:var(--sun);  box-shadow:0 0 8px var(--sun); }
.kpi.k-ice  .kpi-stripe { background:var(--ice);  box-shadow:0 0 8px var(--ice); }
.kpi.k-mint .kpi-stripe { background:var(--mint); box-shadow:0 0 8px var(--mint); }
.kpi.k-acid .kpi-stripe { background:var(--acid); box-shadow:0 0 8px var(--acid); }
.kpi-lbl { font-size:11px; color:var(--t2); font-weight:500; display:flex; align-items:center; gap:5px; }
.kpi-num { font-family:var(--mono); font-size:30px; font-weight:600; line-height:1; letter-spacing:-1px; }
.kpi.k-fire .kpi-num { color:var(--fire); text-shadow:0 0 20px rgba(255,69,69,.45); }
.kpi.k-sun  .kpi-num { color:var(--sun); }
.kpi.k-ice  .kpi-num { color:var(--ice); }
.kpi.k-mint .kpi-num { color:var(--mint); }
.kpi.k-acid .kpi-num { color:var(--acid); }
.kpi-hint { font-family:var(--mono); font-size:9px; color:var(--t3); }

/* ── PANEL BASE ── */
.panel { background:var(--panel); border:1px solid var(--rim); border-radius:var(--r2); display:flex; flex-direction:column; min-height:0; overflow:hidden; }
.ph {
  flex-shrink:0; height:38px; display:flex; align-items:center; justify-content:space-between;
  padding:0 14px; border-bottom:1px solid var(--rim); background:var(--panel-2);
}
.ph-l { display:flex; align-items:center; gap:8px; }
.ph-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.ph-name { font-family:var(--mono); font-size:10px; font-weight:500; color:var(--t2); letter-spacing:1.5px; text-transform:uppercase; }
.ph-badge { font-family:var(--mono); font-size:10px; padding:2px 9px; border-radius:10px; border:1px solid var(--rim); color:var(--t2); background:var(--ink); }
.ph-badge.danger { color:var(--fire); border-color:rgba(255,69,69,.3); background:var(--fire-d); animation:cp 1.6s ease-in-out infinite; }

.btns { display:flex; gap:2px; }
.btn {
  font-family:var(--mono); font-size:9px; padding:3px 8px; border-radius:4px;
  border:1px solid var(--rim); background:transparent; color:var(--t3);
  cursor:pointer; transition:all .15s; letter-spacing:.5px;
}
.btn.on { background:var(--acid-d); border-color:rgba(198,255,0,.3); color:var(--acid); }
.btn:hover:not(.on) { color:var(--t1); border-color:var(--rim-hi); }

/* ── 하단 왼쪽 ── */
.left { grid-column:1; grid-row:2; display:grid; grid-template-rows:1fr 1fr; gap:8px; min-height:0; }

/* 차트 */
.chart-wrap { flex:1; min-height:0; padding:10px 12px 8px; }
.chart-wrap canvas { width:100%!important; height:100%!important; }
.legend {
  flex-shrink:0; padding:5px 12px; display:flex; gap:4px; flex-wrap:wrap;
  border-top:1px solid var(--rim); background:var(--panel-2);
}
.leg-item {
  display:flex; align-items:center; gap:5px;
  font-family:var(--mono); font-size:10px; color:var(--t2);
  padding:2px 7px; border-radius:4px; border:1px solid transparent;
  cursor:pointer; transition:all .15s; user-select:none;
}
.leg-item:hover { border-color:var(--rim-hi); color:var(--t1); }
.leg-item.off { opacity:.25; }
.leg-line { width:18px; height:2px; border-radius:1px; flex-shrink:0; }

/* 알람 목록 */
.alarm-filter {
  flex-shrink:0; display:flex; gap:3px; padding:5px 9px;
  border-bottom:1px solid var(--rim); background:var(--panel-2);
}
.fbtn {
  font-family:var(--mono); font-size:9px; padding:3px 9px; border-radius:4px;
  border:1px solid var(--rim); background:transparent; color:var(--t3);
  cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:5px;
}
.fbtn .bc { font-size:9px; padding:0 5px; border-radius:8px; background:var(--t4); color:var(--t2); min-width:16px; text-align:center; }
.fbtn.on-all  { color:var(--t1); border-color:var(--rim-hi); }
.fbtn.on-all .bc { background:var(--rim-hi); }
.fbtn.on-lv1  { background:var(--fire-d); border-color:rgba(255,69,69,.3); color:var(--fire); }
.fbtn.on-lv1 .bc { background:var(--fire); color:#fff; }
.fbtn.on-lv2  { background:var(--sun-d); border-color:rgba(255,173,10,.3); color:var(--sun); }
.fbtn.on-lv2 .bc { background:var(--sun); color:var(--ink); }
.fbtn.on-lv3  { background:var(--ice-d); border-color:rgba(56,189,248,.25); color:var(--ice); }
.fbtn.on-lv3 .bc { background:var(--ice); color:var(--ink); }
.fbtn:hover:not([class*="on-"]) { color:var(--t1); border-color:var(--rim-hi); }

.a-scroll { flex:1; min-height:0; overflow-y:auto; }
.a-scroll::-webkit-scrollbar { width:3px; }
.a-scroll::-webkit-scrollbar-thumb { background:var(--rim-hi); border-radius:2px; }

.a-tbl { width:100%; border-collapse:collapse; }
.a-tbl th {
  position:sticky; top:0; background:var(--panel-2);
  font-family:var(--mono); font-size:9px; color:var(--t3); font-weight:400;
  letter-spacing:1px; text-transform:uppercase; padding:6px 10px;
  text-align:left; border-bottom:1px solid var(--rim); white-space:nowrap;
}
.a-tbl td { padding:8px 10px; vertical-align:middle; border-bottom:1px solid var(--rim); }
.a-tbl tr { transition:background .12s; cursor:pointer; }
.a-tbl tr:hover td { background:var(--panel-2); }
.a-tbl tr:last-child td { border-bottom:none; }
.lv-wrap { display:flex; align-items:center; gap:5px; }
.lv-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.r-lv1 .lv-dot { background:var(--fire); box-shadow:0 0 6px var(--fire); }
.r-lv2 .lv-dot { background:var(--sun); }
.r-lv3 .lv-dot { background:var(--ice); }
.lv-txt { font-family:var(--mono); font-size:10px; font-weight:600; }
.r-lv1 .lv-txt { color:var(--fire); }
.r-lv2 .lv-txt { color:var(--sun); }
.r-lv3 .lv-txt { color:var(--ice); }
.c-tag  { font-family:var(--mono); font-size:11px; color:var(--t1); font-weight:500; }
.c-msg  { font-size:11px; color:var(--t2); }
.c-val  { font-family:var(--mono); font-size:12px; color:var(--sun); font-weight:600; text-align:right; white-space:nowrap; }
.c-time { font-family:var(--mono); font-size:10px; color:var(--t3); text-align:right; white-space:nowrap; }
@keyframes rf { 0%,100%{opacity:1;} 50%{opacity:.25;} }
.new-r td { animation:rf .5s ease 3; }
.empty-r td { text-align:center; padding:28px; font-family:var(--mono); font-size:11px; color:var(--t3); letter-spacing:2px; }

/* ── 오른쪽 ── */
.right { grid-column:2; grid-row:2; display:flex; flex-direction:column; gap:8px; min-height:0; overflow:hidden; }

/* 센서 카드 */
.s-cards { padding:7px; display:flex; flex-direction:column; gap:5px; }
.s-card {
  background:var(--panel-2); border:1px solid var(--rim); border-radius:var(--r);
  padding:9px 11px; position:relative; overflow:hidden; transition:all .2s;
}
.s-card.w { border-color:rgba(255,173,10,.3); background:var(--sun-d); }
.s-card.c { border-color:rgba(255,69,69,.35); background:var(--fire-d); animation:cg 2s ease-in-out infinite; }
@keyframes cg { 0%,100%{box-shadow:none;} 50%{box-shadow:inset 0 0 12px rgba(255,69,69,.14);} }
.s-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:8px; }
.s-name { font-size:11px; color:var(--t2); font-weight:500; }
.s-badge { font-family:var(--mono); font-size:8px; padding:1px 6px; border-radius:3px; letter-spacing:.5px; }
.s-badge.ok   { background:var(--mint-d); color:var(--mint); border:1px solid rgba(0,229,160,.2); }
.s-badge.warn { background:var(--sun-d);  color:var(--sun);  border:1px solid rgba(255,173,10,.3); }
.s-badge.crit { background:var(--fire-d); color:var(--fire); border:1px solid rgba(255,69,69,.3); }
.s-bot { display:flex; align-items:flex-end; justify-content:space-between; }
.s-val { font-family:var(--mono); font-size:24px; font-weight:600; line-height:1; }
.s-val.ok   { color:var(--t1); }
.s-val.warn { color:var(--sun); }
.s-val.crit { color:var(--fire); text-shadow:0 0 14px rgba(255,69,69,.5); }
.s-unit { font-family:var(--mono); font-size:10px; color:var(--t3); margin-bottom:2px; margin-left:2px; }
.s-thr { display:flex; gap:3px; }
.s-chip { font-family:var(--mono); font-size:8px; padding:1px 5px; border-radius:3px; color:var(--t3); background:var(--ink); border:1px solid var(--t4); }
.s-gauge { position:absolute; bottom:0; left:0; height:3px; transition:width .7s ease; opacity:.65; }

/* 타임라인 */
.tl-body { flex:1; min-height:0; overflow-y:auto; padding:10px; }
.tl-body::-webkit-scrollbar { width:3px; }
.tl-body::-webkit-scrollbar-thumb { background:var(--rim-hi); border-radius:2px; }
.tl-item { display:flex; gap:10px; padding-bottom:13px; position:relative; }
.tl-item::after { content:''; position:absolute; left:6px; top:14px; bottom:0; width:1px; background:linear-gradient(var(--rim-hi),transparent); }
.tl-item:last-child::after { display:none; }
.tl-node { width:13px; height:13px; border-radius:50%; flex-shrink:0; margin-top:1px; position:relative; z-index:1; }
.tl-node.n1 { background:var(--fire); box-shadow:0 0 8px rgba(255,69,69,.55); }
.tl-node.n2 { background:var(--sun);  box-shadow:0 0 6px rgba(255,173,10,.45); }
.tl-node.n3 { background:var(--ice);  box-shadow:0 0 6px rgba(56,189,248,.4); }
.tl-in { flex:1; min-width:0; }
.tl-h  { display:flex; align-items:center; justify-content:space-between; margin-bottom:2px; }
.tl-tag  { font-family:var(--mono); font-size:11px; color:var(--t1); font-weight:500; }
.tl-time { font-family:var(--mono); font-size:9px; color:var(--t3); }
.tl-msg  { font-size:11px; color:var(--t2); }
.tl-val  { font-family:var(--mono); font-size:10px; color:var(--sun); margin-top:2px; }
.tl-empty { padding:28px; text-align:center; font-family:var(--mono); font-size:11px; color:var(--t3); letter-spacing:2px; }

/* TOAST */
#toast {
  position:fixed; top:60px; right:16px; z-index:9998;
  font-family:var(--sans); font-size:12px; font-weight:500;
  padding:9px 14px 9px 11px; border-radius:var(--r);
  opacity:0; transform:translateY(-8px);
  transition:opacity .2s, transform .2s; pointer-events:none;
  background:var(--panel); border:1px solid rgba(255,69,69,.4); color:var(--t1);
  box-shadow:0 8px 28px rgba(0,0,0,.5); display:flex; align-items:center; gap:8px;
}
.toast-lbl { background:var(--fire); color:#fff; font-family:var(--mono); font-size:9px; padding:1px 7px; border-radius:10px; font-weight:600; }
#toast.show { opacity:1; transform:translateY(0); }
</style>
</head>
<body>

<div class="rf-bar"><div class="rf-fill" id="rfFill"></div></div>

<!-- HEADER -->
<div class="hd">
  <div class="hd-logo">
    <div class="hd-mark">TM</div>
    <div>
      <div class="hd-title">온도 <span>알람</span> 모니터링</div>
      <div class="hd-sub">TEMPERATURE ALARM SYSTEM</div>
    </div>
  </div>
  <div class="hd-status">
    <div class="chip live"><div class="dot"></div>실시간 감시 중</div>
    <div class="chip ok" id="hdSys">시스템 정상</div>
    <div class="chip ok" id="hdAlarm">활성 알람 없음</div>
    <div class="hd-refresh">
      <span class="hd-refresh-lbl">갱신 주기</span>
      <button class="btn on" onclick="setRf(3,this)">3초</button>
      <button class="btn"    onclick="setRf(5,this)">5초</button>
      <button class="btn"    onclick="setRf(10,this)">10초</button>
    </div>
  </div>
  <div class="hd-clock">
    <div class="clock-t" id="hClock">--:--:--</div>
    <div class="clock-d" id="hDate">----.--.-- (--)</div>
  </div>
</div>

<jsp:include page="/WEB-INF/views/include/monitorNav.jsp"/>

<div class="main">

  <!-- KPI -->
  <div class="kpi-row">
    <div class="kpi k-fire">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">🔴 활성 알람</div>
      <div class="kpi-num" id="kpiActive">0</div>
      <div class="kpi-hint" id="kpiActiveSub">현재 발생 중</div>
    </div>
    <div class="kpi k-sun">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">⚠️ 위험 (1등급)</div>
      <div class="kpi-num" id="kpiLv1">0</div>
      <div class="kpi-hint">즉시 조치 필요</div>
    </div>
    <div class="kpi k-ice">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">🌡️ 최고 온도</div>
      <div class="kpi-num" id="kpiMax">--°</div>
      <div class="kpi-hint" id="kpiMaxTag">측정 중…</div>
    </div>
    <div class="kpi k-mint">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">✅ 정상 센서</div>
      <div class="kpi-num" id="kpiNorm">0</div>
      <div class="kpi-hint">임계값 이하 운전</div>
    </div>
    <div class="kpi k-acid">
      <div class="kpi-stripe"></div>
      <div class="kpi-lbl">📊 오늘 총 알람</div>
      <div class="kpi-num" id="kpiToday">0</div>
      <div class="kpi-hint">금일 누적</div>
    </div>
  </div>

  <!-- 하단 왼쪽 -->
  <div class="left">
    <!-- 차트 -->
    <div class="panel">
      <div class="ph">
        <div class="ph-l">
          <div class="ph-dot" style="background:var(--acid);box-shadow:0 0 6px var(--acid)"></div>
          <div class="ph-name">온도 추이</div>
        </div>
        <div class="btns">
          <button class="btn on" onclick="setRange(1,this)">1시간</button>
          <button class="btn"    onclick="setRange(3,this)">3시간</button>
          <button class="btn"    onclick="setRange(6,this)">6시간</button>
          <button class="btn"    onclick="setRange(24,this)">24시간</button>
        </div>
      </div>
      <div class="chart-wrap"><canvas id="tempChart"></canvas></div>
      <div class="legend" id="legend"></div>
    </div>
    <!-- 알람 목록 -->
    <div class="panel">
      <div class="ph">
        <div class="ph-l">
          <div class="ph-dot" style="background:var(--fire);box-shadow:0 0 6px var(--fire);animation:bl 1.1s ease-in-out infinite"></div>
          <div class="ph-name">활성 알람 목록</div>
        </div>
        <span class="ph-badge danger" id="activeCnt">0건</span>
      </div>
      <div class="alarm-filter">
        <button class="fbtn on-all" onclick="setFilter(0,this)">전체 <span class="bc" id="fc0">0</span></button>
        <button class="fbtn"        onclick="setFilter(1,this)">위험 <span class="bc" id="fc1">0</span></button>
        <button class="fbtn"        onclick="setFilter(2,this)">경고 <span class="bc" id="fc2">0</span></button>
        <button class="fbtn"        onclick="setFilter(3,this)">주의 <span class="bc" id="fc3">0</span></button>
      </div>
      <div class="a-scroll">
        <table class="a-tbl">
          <thead><tr>
            <th style="width:70px">등급</th>
            <th style="width:100px">태그명</th>
            <th>알람 내용</th>
            <th style="width:80px;text-align:right">현재값</th>
            <th style="width:115px;text-align:right">발생 시각</th>
          </tr></thead>
          <tbody id="alarmTbody">
            <tr class="empty-r"><td colspan="5">활성 알람 없음 — 정상 운전 중</td></tr>
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
          <div class="ph-dot" style="background:var(--mint);box-shadow:0 0 5px var(--mint)"></div>
          <div class="ph-name">센서 현황</div>
        </div>
        <span class="ph-badge" id="sTime">--:--:--</span>
      </div>
      <div class="s-cards" id="sCards"></div>
    </div>
    <!-- 알람 이력 -->
    <div class="panel" style="flex:1;min-height:0;">
      <div class="ph">
        <div class="ph-l">
          <div class="ph-dot" style="background:var(--ice);box-shadow:0 0 5px var(--ice)"></div>
          <div class="ph-name">알람 이력</div>
        </div>
        <span class="ph-badge" id="tlCnt">0건</span>
      </div>
      <div class="tl-body" id="tlBody">
        <div class="tl-empty">이력 없음</div>
      </div>
    </div>
  </div>

</div>

<div id="toast"></div>

<script>
const base = '<%=ctx%>';
const DAYS = ['일','월','화','수','목','금','토'];
const LVL  = {1:'위험',2:'경고',3:'주의'};
const DEFAULT_THR = {
  tag_temp1:{warn:50,crit:55}, tag_temp1_2:{warn:49,crit:54},
  tag_temp2:{warn:80,crit:88}, tag_temp3:{warn:32,crit:36}, tag_t_1234:{warn:105,crit:115}
};
const PAL = ['#c6ff00','#38bdf8','#00e5a0','#ffad0a','#f472b6','#818cf8','#fb923c','#34d399','#f87171','#a78bfa'];

let tagMeta=[], hiddenSet=new Set(), thrMap={};
let chart=null, rangeH=1, filterLv=0;
let prevKeys=new Set(), rfMs=3000, timer=null, rfRaf=null;

/* 시계 */
function tick(){
  const n=new Date(), p=v=>String(v).padStart(2,'0');
  document.getElementById('hClock').textContent=p(n.getHours())+':'+p(n.getMinutes())+':'+p(n.getSeconds());
  document.getElementById('hDate').textContent=n.getFullYear()+'.'+p(n.getMonth()+1)+'.'+p(n.getDate())+' ('+DAYS[n.getDay()]+')';
}
setInterval(tick,1000); tick();

/* 프로그레스 바 */
function animBar(ms){
  const el=document.getElementById('rfFill'); let st=null;
  if(rfRaf) cancelAnimationFrame(rfRaf);
  function step(ts){ if(!st)st=ts; const p=Math.min((ts-st)/ms*100,100); el.style.width=p+'%'; if(p<100)rfRaf=requestAnimationFrame(step); }
  el.style.width='0%'; rfRaf=requestAnimationFrame(step);
}

/* 갱신 주기 */
function setRf(sec,btn){
  rfMs=sec*1000;
  document.querySelectorAll('.hd-refresh .btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  if(timer) clearInterval(timer);
  timer=setInterval(refresh,rfMs);
}

/* 필터 */
function setFilter(lv,btn){
  filterLv=lv;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('on-all','on-lv1','on-lv2','on-lv3'));
  if(lv===0) btn.classList.add('on-all');
  else btn.classList.add('on-lv'+lv);
  renderTable(window._alarms||[]);
}

/* 범위 */
function setRange(h,btn){
  rangeH=h;
  document.querySelectorAll('.btns .btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on'); loadChart();
}

/* 유틸 */
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function toTs(v){
  if(!v)return null;
  if(typeof v==='number')return v>1e11?v:v*1000;
  const s=String(v).includes('T')?String(v):String(v).replace(' ','T');
  const t=Date.parse(s); return isNaN(t)?null:t;
}
function toSql(dt){
  const p=n=>String(n).padStart(2,'0');
  return dt.getFullYear()+'-'+p(dt.getMonth()+1)+'-'+p(dt.getDate())+' '+p(dt.getHours())+':'+p(dt.getMinutes())+':00';
}
function fmtTs(s){ return (s||'').substring(0,19).replace('T',' '); }
function p2(v){ return String(v).padStart(2,'0'); }

/* Toast */
function showToast(msg){
  const el=document.getElementById('toast');
  el.innerHTML=`<span class="toast-lbl">NEW</span>${msg}`;
  el.classList.add('show'); clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('show'),3500);
}

/* ════ 태그 메타 ════ */
function loadMeta(){
  return fetch(base+'/temp/cols').then(r=>r.json()).then(list=>{
    tagMeta=(list||[]).map((c,i)=>({tagName:c.tagName,colName:c.colName,color:PAL[i%PAL.length]}));
    thrMap={}; tagMeta.forEach(t=>{ thrMap[t.colName]=DEFAULT_THR[t.colName]||{warn:80,crit:95}; });
    renderLegend(); renderSCards({});
  });
}
function renderLegend(){
  document.getElementById('legend').innerHTML=tagMeta.map(t=>
    `<div class="leg-item${hiddenSet.has(t.colName)?' off':''}" onclick="toggleTag('${t.colName}')">
       <div class="leg-line" style="background:${t.color};box-shadow:0 0 4px ${t.color}60"></div>${esc(t.tagName)}
     </div>`).join('');
}
function toggleTag(cn){
  hiddenSet.has(cn)?hiddenSet.delete(cn):hiddenSet.add(cn);
  renderLegend();
  if(chart){ const ds=chart.data.datasets.find(d=>d.colName===cn); if(ds){ds.hidden=hiddenSet.has(cn);chart.update('none');} }
}

/* ════ 차트 ════ */
function loadChart(){
  const now=new Date(), from=new Date(now-rangeH*3600000);
  const qs='?from='+encodeURIComponent(toSql(from))+'&to='+encodeURIComponent(toSql(now));
  fetch(base+'/temp/snapshot/range'+qs).then(r=>r.json()).then(rows=>{ updateChart(rows||[]); updateSCards(rows||[]); });
}

function updateChart(rows){
  const ann={};
  tagMeta.forEach((t,i)=>{
    const th=thrMap[t.colName]||{};
    ann['w'+i]={type:'line',yMin:th.warn,yMax:th.warn,borderColor:t.color+'40',borderWidth:1.2,borderDash:[5,4]};
    ann['c'+i]={type:'line',yMin:th.crit,yMax:th.crit,borderColor:'rgba(255,69,69,.35)',borderWidth:1.2,borderDash:[3,3]};
  });
  const nd=tagMeta.map(t=>
    rows.map(row=>{
      const ts=toTs(row.record_time||row.recordTime);
      const v=row[t.colName];
      return ts?{x:ts,y:v!=null?Number(v):null}:null;
    }).filter(Boolean)
  );
  const flat=nd.flat().map(p=>p.y).filter(v=>v!=null);
  if(flat.length){
    document.getElementById('kpiMax').textContent=Math.max(...flat).toFixed(1)+'°';
    if(rows.length){
      const last=rows[rows.length-1]; let mxT='',mxV=-Infinity;
      tagMeta.forEach(t=>{ const v=Number(last[t.colName]||0); if(v>mxV){mxV=v;mxT=t.tagName;} });
      document.getElementById('kpiMaxTag').textContent=mxT;
    }
  }
  Chart.defaults.color='#3f485f';
  Chart.defaults.borderColor='rgba(198,255,0,.05)';
  Chart.defaults.font.family="'IBM Plex Mono',monospace";
  Chart.defaults.font.size=11;

  if(!chart){
    chart=new Chart(document.getElementById('tempChart').getContext('2d'),{
      type:'line',
      data:{ datasets:tagMeta.map((t,i)=>({
        colName:t.colName, label:t.tagName, data:nd[i],
        borderColor:t.color, backgroundColor:t.color+'10',
        borderWidth:2, pointRadius:0, pointHoverRadius:5,
        tension:0.3, fill:false, hidden:hiddenSet.has(t.colName)
        /* 실선 — borderDash 없음 */
      }))},
      options:{
        responsive:true, maintainAspectRatio:false,
        animation:{duration:500,easing:'easeInOutQuart'},
        parsing:false,
        scales:{
          x:{type:'time',time:{tooltipFormat:'HH:mm:ss',displayFormats:{minute:'HH:mm',hour:'HH시'}},
             grid:{color:'rgba(198,255,0,.04)',drawBorder:false},ticks:{color:'#3f485f',maxTicksLimit:8}},
          y:{grid:{color:'rgba(198,255,0,.04)',drawBorder:false},ticks:{color:'#3f485f',callback:v=>v+'°'}}
        },
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:'#0d0f1c',borderColor:'rgba(198,255,0,.25)',borderWidth:1,
            titleColor:'#8b95b3',bodyColor:'#eef2ff',padding:10,
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
    /* ── 데이터만 교체 → 선이 사라지지 않음 ── */
    tagMeta.forEach((t,i)=>{
      const ds=chart.data.datasets.find(d=>d.colName===t.colName);
      if(ds){ ds.data=nd[i]; ds.hidden=hiddenSet.has(t.colName); }
    });
    chart.options.plugins.annotation.annotations=ann;
    chart.update('none');
  }
}

/* ════ 센서 카드 ════ */
function renderSCards(row){
  document.getElementById('sCards').innerHTML=tagMeta.map(t=>{
    const v=row[t.colName], num=v!=null?Number(v):null;
    const th=thrMap[t.colName]||{};
    let cls='',valCls='ok',badge='정상',bCls='ok';
    if(num!=null&&num>=th.crit){cls='c';valCls='crit';badge='위험';bCls='crit';}
    else if(num!=null&&num>=th.warn){cls='w';valCls='warn';badge='경고';bCls='warn';}
    const pct=num!=null?Math.min(Math.max((num-10)/((th.crit||100)*1.12-10)*100,0),100):0;
    const gc=valCls==='crit'?'var(--fire)':valCls==='warn'?'var(--sun)':t.color;
    return `<div class="s-card ${cls}">
      <div class="s-top"><div class="s-name">${esc(t.tagName)}</div><div class="s-badge ${bCls}">${badge}</div></div>
      <div class="s-bot">
        <div style="display:flex;align-items:baseline">
          <span class="s-val ${valCls}">${num!=null?num.toFixed(1):'--'}</span>
          <span class="s-unit">°C</span>
        </div>
        <div class="s-thr">
          <span class="s-chip">경고 ${th.warn}°</span>
          <span class="s-chip">위험 ${th.crit}°</span>
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

/* ════ 알람 ════ */
function loadAlarms(){
  Promise.all([
    fetch(base+'/alarm/active/list?limit=50').then(r=>r.json()).catch(()=>[]),
    fetch(base+'/alarm/history/list?limit=100').then(r=>r.json()).catch(()=>[])
  ]).then(([active,history])=>{
    active=active||[]; history=history||[];
    window._alarms=active;
    renderTable(active); renderTl(history);
    const newKeys=new Set(active.map(a=>a.tagName+'_'+a.occurTime));
    let nc=0; newKeys.forEach(k=>{ if(!prevKeys.has(k))nc++; });
    if(nc>0) showToast(`새 알람 ${nc}건이 발생했습니다`);
    prevKeys=newKeys;
    const cnt=active.length, lv1=active.filter(a=>(a.level||1)===1).length;
    document.getElementById('kpiActive').textContent=cnt;
    document.getElementById('kpiLv1').textContent=lv1;
    document.getElementById('kpiActiveSub').textContent=cnt>0?`위험 ${lv1}건 포함`:'현재 발생 중';
    document.getElementById('activeCnt').textContent=cnt+'건';
    [0,1,2,3].forEach(lv=>{
      const c=lv===0?cnt:active.filter(a=>(a.level||1)===lv).length;
      const el=document.getElementById('fc'+lv); if(el)el.textContent=c;
    });
    const as=document.getElementById('hdAlarm');
    if(cnt===0){as.className='chip ok';as.textContent='활성 알람 없음';}
    else if(lv1>0){as.className='chip danger';as.textContent=`위험 ${lv1}건 발생!`;}
    else{as.className='chip warn';as.textContent=`알람 ${cnt}건 발생`;}
    const today=new Date().toDateString();
    document.getElementById('kpiToday').textContent=history.filter(a=>new Date(a.occurTime||'').toDateString()===today).length;
    document.getElementById('tlCnt').textContent=Math.min(history.length,30)+'건';
  });
}

function renderTable(list){
  const tb=document.getElementById('alarmTbody');
  const fl=filterLv===0?list:list.filter(a=>(a.level||1)===filterLv);
  if(!fl.length){tb.innerHTML=`<tr class="empty-r"><td colspan="5">활성 알람 없음 — 정상 운전 중</td></tr>`;return;}
  tb.innerHTML=fl.map(a=>{
    const lv=a.level||1, key=a.tagName+'_'+a.occurTime, isN=!prevKeys.has(key);
    const val=a.valueAtOccur!=null?Number(a.valueAtOccur).toFixed(2)+'°C':'--';
    return `<tr class="r-lv${lv}${isN?' new-r':''}" onclick="hlTag('${esc(a.tagName||'')}')">
      <td><div class="lv-wrap r-lv${lv}"><div class="lv-dot"></div><span class="lv-txt">LV${lv} ${LVL[lv]||''}</span></div></td>
      <td class="c-tag">${esc(a.tagName||'—')}</td>
      <td class="c-msg">${esc(a.alarmMsg||'알람 발생')}</td>
      <td class="c-val">${val}</td>
      <td class="c-time">${fmtTs(a.occurTime)}</td>
    </tr>`;
  }).join('');
}

function renderTl(list){
  const w=document.getElementById('tlBody');
  const r=list.slice(0,30);
  if(!r.length){w.innerHTML='<div class="tl-empty">이력 없음</div>';return;}
  w.innerHTML=r.map(a=>{
    const lv=a.level||1, val=a.valueAtOccur!=null?Number(a.valueAtOccur).toFixed(1)+'°C':'';
    return `<div class="tl-item">
      <div class="tl-node n${lv}"></div>
      <div class="tl-in">
        <div class="tl-h"><span class="tl-tag">${esc(a.tagName||'—')}</span><span class="tl-time">${fmtTs(a.occurTime).substring(11)}</span></div>
        <div class="tl-msg">${esc(a.alarmMsg||'')}</div>
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

/* ════ MAIN ════ */
function refresh(){ animBar(rfMs); loadChart(); loadAlarms(); }
loadMeta().then(()=>{ refresh(); timer=setInterval(refresh,rfMs); });
</script>
</body>
</html>
