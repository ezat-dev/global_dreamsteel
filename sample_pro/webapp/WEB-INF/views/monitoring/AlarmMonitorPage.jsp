<%@ page contentType="text/html; charset=UTF-8" %>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="<%=ctx%>/css/monitoring/alarm_manage.css">
    <title>알람 모니터</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">

<style>
/* ══════════════════════════════════════
   DESIGN: Industrial Dark — CRT terminal
   느낌의 공장 제어 모니터
══════════════════════════════════════ */
:root {
  --bg-base:      #0a0d12;
  --bg-panel:     #0f1520;
  --bg-panel2:    #121923;
  --bg-row-hover: #1a2235;
  --border:       #1e2d45;
  --border-bright:#2a4060;

  --cyan:         #00d4ff;
  --cyan-dim:     #00a8cc44;
  --green:        #00ff88;
  --green-dim:    #00ff4422;
  --amber:        #ffb700;
  --amber-dim:    #ffb70022;
  --red:          #ff3b5c;
  --red-dim:      #ff3b5c22;
  --purple:       #a855f7;

  --text-p:       #e2eaf4;
  --text-s:       #7a90aa;
  --text-dim:     #3d526a;

  --font-mono:    'Share Tech Mono', monospace;
  --font-ui:      'Noto Sans KR', sans-serif;

  --glow-cyan:    0 0 12px #00d4ff66;
  --glow-green:   0 0 12px #00ff8866;
  --glow-red:     0 0 14px #ff3b5c88;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg-base);
  color: var(--text-p);
  font-family: var(--font-ui);
  font-size: 13px;
  min-height: 100vh;
  /* subtle grid texture */
  background-image:
    linear-gradient(rgba(0,212,255,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,212,255,.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ── HEADER ── */
.header {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, #0d1826 0%, var(--bg-base) 100%);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
    font-family: var(--font-hud);
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--purple);
    text-shadow: var(--purple-glow);

}

.live-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #001a0a;
  border: 1px solid var(--green);
  border-radius: 4px;
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--green);
  text-shadow: var(--glow-green);
  letter-spacing: 1px;
}
.live-dot {
  width: 8px; height: 8px;
  background: var(--green);
  border-radius: 50%;
  box-shadow: var(--glow-green);
  animation: pulse-green 1.2s ease-in-out infinite;
}
@keyframes pulse-green {
  0%,100% { opacity: 1; box-shadow: 0 0 6px #00ff88, 0 0 14px #00ff88; }
  50%      { opacity: .4; box-shadow: none; }
}

.update-time {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-s);
  letter-spacing: 1px;
}
.update-time span { color: var(--cyan); }

/* ── SCAN LINE animation overlay ── */
.scanline {
  pointer-events: none;
  position: fixed; inset: 0; z-index: 9999;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,.08) 2px,
    rgba(0,0,0,.08) 4px
  );
}

/* ── PAGE ── */
.page { padding: 18px 20px 32px; }

/* ── KPI CHIPS ── */
.kpi-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.kpi-chip {
  flex: 1; min-width: 130px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
  position: relative;
  overflow: hidden;
  transition: border-color .2s;
}
.kpi-chip::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
}
.kpi-chip.cyan::before  { background: var(--cyan);  box-shadow: var(--glow-cyan); }
.kpi-chip.green::before { background: var(--green); box-shadow: var(--glow-green);}
.kpi-chip.amber::before { background: var(--amber); }
.kpi-chip.red::before   { background: var(--red);   box-shadow: var(--glow-red);  }
.kpi-chip.purple::before{ background: var(--purple);}

.kpi-label {
  font-size: 10px; color: var(--text-s);
  letter-spacing: 1.5px; text-transform: uppercase;
  margin-bottom: 6px;
}
.kpi-val {
  font-family: var(--font-mono);
  font-size: 26px;
  line-height: 1;
}
.kpi-chip.cyan  .kpi-val { color: var(--cyan);   text-shadow: var(--glow-cyan); }
.kpi-chip.green .kpi-val { color: var(--green);  text-shadow: var(--glow-green);}
.kpi-chip.amber .kpi-val { color: var(--amber); }
.kpi-chip.red   .kpi-val { color: var(--red);    text-shadow: var(--glow-red);  }
.kpi-chip.purple .kpi-val{ color: var(--purple); }

/* ── CHARTS ROW ── */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
}
.chart-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px 10px;
  position: relative;
}
.chart-card-title {
  font-size: 11px;
  color: var(--text-s);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.chart-card-title::before {
  content: '';
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: var(--glow-cyan);
}
.chart-wrap { position: relative; height: 130px; }

/* ── GRID (tables) ── */
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel2);
}
.panel-title {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--cyan);
}
.panel-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-s);
  background: var(--border);
  padding: 2px 8px;
  border-radius: 10px;
}

.table-wrap { overflow-y: auto; max-height: 380px; }
.table-wrap::-webkit-scrollbar { width: 4px; }
.table-wrap::-webkit-scrollbar-track { background: transparent; }
.table-wrap::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 2px; }

table.alarm-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 11px;
}
table.alarm-table thead th {
  position: sticky; top: 0;
  background: #0c1420;
  color: var(--text-s);
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-bright);
  text-align: left;
  white-space: nowrap;
}
table.alarm-table tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background .15s;
}
table.alarm-table tbody tr:hover { background: var(--bg-row-hover); }
table.alarm-table tbody td {
  padding: 7px 10px;
  color: var(--text-p);
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* new row flash */
@keyframes row-flash {
  0%   { background: rgba(0,212,255,.18); }
  100% { background: transparent; }
}
.row-new { animation: row-flash .8s ease-out forwards; }

/* level badges */
.lvl {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  padding: 2px 6px; border-radius: 3px;
  font-family: var(--font-mono);
}
.lvl-1 { background: var(--red-dim);   color: var(--red);   border: 1px solid var(--red);   box-shadow: var(--glow-red); }
.lvl-2 { background: var(--amber-dim); color: var(--amber); border: 1px solid var(--amber); }
.lvl-3 { background: var(--cyan-dim);  color: var(--cyan);  border: 1px solid var(--cyan);  }
.lvl-4 { background: var(--green-dim); color: var(--green); border: 1px solid var(--green); }

/* empty state */
.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 2px;
}
.empty-state::before {
  content: '[ NO DATA ]';
  display: block;
  font-size: 14px;
  color: var(--border-bright);
  margin-bottom: 6px;
}

/* ── REFRESH BAR ── */
.refresh-bar-wrap {
  height: 2px;
  background: var(--border);
  margin: 0 0 16px;
  border-radius: 1px;
  overflow: hidden;
}
.refresh-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--cyan), var(--green));
  box-shadow: var(--glow-cyan);
  border-radius: 1px;
  animation: refresh-progress 2s linear infinite;
  transform-origin: left;
}
@keyframes refresh-progress {
  0%   { width: 0%; }
  100% { width: 100%; }
}
.page-title {
    font-family: var(--font-hud);
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--purple);
    text-shadow: var(--purple-glow);

  
/* ── BLINK on update ── */
@keyframes header-blink {
  0%,100% { opacity:1; }
  50%      { opacity:.3; }
}
.blink { animation: header-blink .3s ease 2; }

/* override: use Alarm Manage header style */
.header { display: none; }
.header-right { display: flex; align-items: center; gap: 12px; }
.page-header .update-time { margin-left: 0; font-size: 10px; color: var(--header-accent); letter-spacing: .5px; }
.page-header .update-time span { color: var(--header-accent); }
</style>
</head>
<body class="theme-alarm">

<div class="scanline"></div>

<!-- ── HEADER ── -->
<div class="header">
  <div class="page-title">⚡ ALARM MONITOR</div>
  <div class="live-badge">
    <div class="live-dot"></div>
    LIVE · 2s
  </div>
 
</div>

<div class="page">

  <div class="page-header">
    <div>

      <div class="page-sub">// Live alarm status</div>
    </div>
    <div class="header-right">
      <div class="active-badge"><div class="active-dot"></div>LIVE</div>
      <div class="update-time" id="updateTimeMain">UPDATED: <span>--:--:--</span></div>
    </div>
  </div>

  <jsp:include page="/WEB-INF/views/include/monitorNav.jsp"/>

  <!-- 리프레시 진행바 -->
  <div class="refresh-bar-wrap"><div class="refresh-bar"></div></div>

  <!-- KPI -->
  <div class="kpi-row">
    <div class="kpi-chip red">
      <div class="kpi-label">Active Alarms</div>
      <div class="kpi-val" id="kpi-active">0</div>
    </div>
    <div class="kpi-chip amber">
      <div class="kpi-label">Level 1 (Critical)</div>
      <div class="kpi-val" id="kpi-lv1">0</div>
    </div>
    <div class="kpi-chip cyan">
      <div class="kpi-label">Level 2</div>
      <div class="kpi-val" id="kpi-lv2">0</div>
    </div>
    <div class="kpi-chip green">
      <div class="kpi-label">Cleared (Recent)</div>
      <div class="kpi-val" id="kpi-cleared">0</div>
    </div>
    <div class="kpi-chip purple">
      <div class="kpi-label">Total History</div>
      <div class="kpi-val" id="kpi-total">0</div>
    </div>
  </div>

  <!-- 차트 -->
  <div class="charts-row">
    <div class="chart-card">
      <div class="chart-card-title">알람 발생 추이 (최근 20회)</div>
      <div class="chart-wrap"><canvas id="chartTrend"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-card-title">레벨별 분포</div>
      <div class="chart-wrap"><canvas id="chartLevel"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-card-title">PLC별 알람 수</div>
      <div class="chart-wrap"><canvas id="chartPlc"></canvas></div>
    </div>
  </div>

  <!-- 테이블 그리드 -->
  <div class="grid">
    <div class="panel">
      <div class="panel-head">
        <div class="panel-title">🔴 Active Alarms</div>
        <div class="panel-count" id="activeCount">0</div>
      </div>
      <div class="table-wrap">
        <table class="alarm-table" id="activeTable">
          <thead>
            <tr>
              <th>Time</th>
              <th>Tag</th>
              <th>Message</th>
              <th>Lv</th>
              <th>PLC</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <div class="panel-title">📋 Recent History</div>
        <div class="panel-count" id="historyCount">0</div>
      </div>
      <div class="table-wrap">
        <table class="alarm-table" id="historyTable">
          <thead>
            <tr>
              <th>Occur</th>
              <th>Clear</th>
              <th>Tag</th>
              <th>Message</th>
              <th>Lv</th>
              <th>PLC</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  </div>

</div><!-- /page -->

<script>
const base = '<%=ctx%>';

/* ══ Chart.js 전역 다크 기본값 ══ */
Chart.defaults.color          = '#7a90aa';
Chart.defaults.borderColor    = '#1e2d45';
Chart.defaults.font.family    = "'Share Tech Mono', monospace";
Chart.defaults.font.size      = 11;

/* ── 추이 차트 (라인) ── */
const trendCtx = document.getElementById('chartTrend').getContext('2d');
const trendChart = new Chart(trendCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Active',
      data: [],
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0,212,255,.08)',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#00d4ff',
      tension: 0.4,
      fill: true
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#1e2d45' }, ticks: { maxTicksLimit: 8 } },
      y: { grid: { color: '#1e2d45' }, beginAtZero: true, ticks: { stepSize: 1 } }
    }
  }
});

/* ── 레벨 도넛 차트 ── */
const levelCtx = document.getElementById('chartLevel').getContext('2d');
const levelChart = new Chart(levelCtx, {
  type: 'doughnut',
  data: {
    labels: ['Lv1', 'Lv2', 'Lv3', 'Lv4'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#ff3b5c', '#ffb700', '#00d4ff', '#00ff88'],
      borderColor: '#0f1520',
      borderWidth: 3,
      hoverOffset: 6
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 400 },
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 10, padding: 10, color: '#7a90aa' }
      }
    }
  }
});

/* ── PLC 바 차트 ── */
const plcCtx = document.getElementById('chartPlc').getContext('2d');
const plcChart = new Chart(plcCtx, {
  type: 'bar',
  data: { labels: [], datasets: [{ label: 'Alarms', data: [],
    backgroundColor: 'rgba(168,85,247,.5)',
    borderColor: '#a855f7', borderWidth: 1, borderRadius: 3 }] },
  options: {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#1e2d45' } },
      y: { grid: { color: '#1e2d45' }, beginAtZero: true, ticks: { stepSize: 1 } }
    }
  }
});

/* ── 추이 히스토리 버퍼 ── */
const TREND_MAX = 20;
const trendHistory = [];

function pushTrend(count) {
  const t = new Date().toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  trendHistory.push({ t, count });
  if (trendHistory.length > TREND_MAX) trendHistory.shift();
  trendChart.data.labels   = trendHistory.map(x => x.t);
  trendChart.data.datasets[0].data = trendHistory.map(x => x.count);
  trendChart.update();
}

function updateLevelChart(list) {
  const cnt = [0,0,0,0];
  list.forEach(a => { const lv = (a.level||1)-1; if(lv>=0&&lv<4) cnt[lv]++; });
  levelChart.data.datasets[0].data = cnt;
  levelChart.update();
}

function updatePlcChart(list) {
  const map = {};
  list.forEach(a => {
    const k = a.plcId || 'Unknown';
    map[k] = (map[k]||0) + 1;
  });
  plcChart.data.labels = Object.keys(map);
  plcChart.data.datasets[0].data = Object.values(map);
  plcChart.update();
}

/* ── 테이블 렌더 ── */
let prevActiveKeys = new Set();

function renderActive(list) {
  const tbody = document.querySelector('#activeTable tbody');
  document.getElementById('activeCount').textContent = list.length;
  document.getElementById('kpi-active').textContent  = list.length;

  const lv1 = list.filter(a => (a.level||1) === 1).length;
  const lv2 = list.filter(a => (a.level||1) === 2).length;
  document.getElementById('kpi-lv1').textContent = lv1;
  document.getElementById('kpi-lv2').textContent = lv2;

  const newKeys = new Set(list.map(a => a.tagName + a.occurTime));

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">정상 운전 중</div></td></tr>';
    prevActiveKeys = newKeys;
    return;
  }

  tbody.innerHTML = '';
  list.forEach(a => {
    const lvl = a.level || 1;
    const key = a.tagName + a.occurTime;
    const isNew = !prevActiveKeys.has(key);
    const tr = document.createElement('tr');
    if (isNew) tr.classList.add('row-new');
    tr.innerHTML =
      '<td>' + (a.occurTime||'').substring(0,19) + '</td>' +
      '<td style="color:var(--cyan)">' + (a.tagName||'') + '</td>' +
      '<td title="'+(a.alarmMsg||'')+'">' + (a.alarmMsg||'').substring(0,28) + '</td>' +
      '<td><span class="lvl lvl-'+lvl+'">LV'+lvl+'</span></td>' +
      '<td style="color:var(--text-s)">' + (a.plcId||'') + '</td>' +
      '<td style="color:var(--amber)">' + (a.valueAtOccur||'') + '</td>';
    tbody.appendChild(tr);
  });
  prevActiveKeys = newKeys;
}

function renderHistory(list) {
  const tbody = document.querySelector('#historyTable tbody');
  document.getElementById('historyCount').textContent  = list.length;
  document.getElementById('kpi-total').textContent     = list.length;
  document.getElementById('kpi-cleared').textContent   = list.filter(a => a.clearTime).length;

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">이력 없음</div></td></tr>';
    return;
  }
  tbody.innerHTML = '';
  list.forEach(a => {
    const lvl = a.level || 1;
    const tr  = document.createElement('tr');
    tr.innerHTML =
      '<td>' + (a.occurTime||'').substring(0,19) + '</td>' +
      '<td style="color:var(--green)">' + (a.clearTime||'').substring(0,19) + '</td>' +
      '<td style="color:var(--cyan)">'  + (a.tagName||'') + '</td>' +
      '<td title="'+(a.alarmMsg||'')+'">' + (a.alarmMsg||'').substring(0,22) + '</td>' +
      '<td><span class="lvl lvl-'+lvl+'">LV'+lvl+'</span></td>' +
      '<td style="color:var(--text-s)">' + (a.plcId||'') + '</td>';
    tbody.appendChild(tr);
  });
}

/* ── 메인 새로고침 ── */
function refreshAll() {
  Promise.all([
    fetch(base + '/alarm/active/list?limit=50').then(r => r.json()),
    fetch(base + '/alarm/history/list?limit=100').then(r => r.json())
  ]).then(([active, history]) => {
    renderActive(active);
    renderHistory(history);
    updateLevelChart(active);
    updatePlcChart([...active, ...history]);
    pushTrend(active.length);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR');
    document.querySelector('#updateTimeMain span').textContent = timeStr;
    /* 헤더 깜빡 효과 */
    const ut = document.getElementById('updateTimeMain');
    ut.classList.remove('blink');
    void ut.offsetWidth;
    ut.classList.add('blink');
  }).catch(() => {
    document.querySelector('#updateTimeMain span').textContent = 'ERROR';
  });
}

refreshAll();
setInterval(refreshAll, 2000);
</script>
</body>
</html>
