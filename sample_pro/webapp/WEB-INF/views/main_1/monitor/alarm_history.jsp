<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../common_style.jsp" %>
<style>
.kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
.kpi-card {
  border-radius:12px; padding:16px 18px; border:1px solid var(--border);
  background:var(--white); box-shadow:var(--shadow);
  display:flex; align-items:center; gap:14px;
}
.kpi-icon { font-size:26px; flex-shrink:0; }
.kpi-val  { font-size:28px; font-weight:800; line-height:1; }
.kpi-lbl  { font-size:11px; color:var(--muted); margin-top:3px; }

.chart-row { display:grid; grid-template-columns:1fr 1fr 2fr; gap:14px; margin-bottom:16px; }
.chart-box { background:var(--white); border:1px solid var(--border); border-radius:12px;
  padding:16px 18px; box-shadow:var(--shadow); }
.chart-title { font-size:12px; font-weight:700; color:var(--muted); margin-bottom:12px; letter-spacing:.3px; }

.filter-bar { background:var(--white); border:1px solid var(--border); border-radius:10px;
  padding:14px 18px; margin-bottom:14px; box-shadow:var(--shadow); }
.total-count { font-size:12px; color:var(--muted); }
.pagination { display:flex; align-items:center; gap:4px; justify-content:center; margin-top:14px; }
.page-btn {
  width:30px; height:30px; border-radius:6px; border:1px solid var(--border);
  background:var(--white); cursor:pointer; font-size:12px; transition:all .13s;
}
.page-btn:hover,.page-btn.active { background:var(--primary);color:#fff;border-color:var(--primary); }
.alarm-row-active { background:#FFF5F5 !important; }
.th-sort {
  cursor: pointer; user-select: none; white-space: nowrap;
  transition: color .13s;
}
.th-sort:hover { color: var(--primary); }
.th-sort::after {
  content: ' ⇅'; font-size: 10px; opacity: .45;
}
.th-sort.asc::after  { content: ' ▲'; opacity: .85; color: var(--primary); }
.th-sort.desc::after { content: ' ▼'; opacity: .85; color: var(--primary); }
</style>
<body>
<div class="page-wrap">
  <div class="page-header">
    <div>
      <div class="page-title">알람 이력</div>
      <div class="page-sub">전체 설비 알람 발생 이력 · 실시간 연동</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <span style="font-size:11px;color:var(--muted)" id="lastUpdate"></span>
      <button class="btn-outline" onclick="downloadExcel()">📥 엑셀 다운로드</button>
      <button class="btn-primary" onclick="loadAll()">🔄 새로고침</button>
    </div>
  </div>

  <!-- KPI 카드 -->
  <div class="kpi-row">
    <div class="kpi-card" style="border-left:4px solid var(--red)">
      <div class="kpi-icon">🔴</div>
      <div><div class="kpi-val" id="kpiActive" style="color:var(--red)">-</div><div class="kpi-lbl">현재 활성 알람</div></div>
    </div>
    <div class="kpi-card" style="border-left:4px solid #2B6CB0">
      <div class="kpi-icon">📅</div>
      <div><div class="kpi-val" id="kpiToday" style="color:#2B6CB0">-</div><div class="kpi-lbl">오늘 발생</div></div>
    </div>
    <div class="kpi-card" style="border-left:4px solid var(--orange)">
      <div class="kpi-icon">🔔</div>
      <div><div class="kpi-val" id="kpiUnack" style="color:var(--orange)">-</div><div class="kpi-lbl">미인지 알람</div></div>
    </div>
    <div class="kpi-card" style="border-left:4px solid var(--green)">
      <div class="kpi-icon">✅</div>
      <div><div class="kpi-val" id="kpiCleared" style="color:var(--green)">-</div><div class="kpi-lbl">해제 완료</div></div>
    </div>
  </div>

  <!-- 차트 행 -->
  <div class="chart-row">
    <div class="chart-box">
      <div class="chart-title">상태별 분포</div>
      <canvas id="chartState" height="180"></canvas>
    </div>
    <div class="chart-box">
      <div class="chart-title">PLC별 알람 수</div>
      <canvas id="chartPlc" height="180"></canvas>
    </div>
    <div class="chart-box" style="position:relative;">
      <div class="chart-title">시간대별 발생 추이 (최근 24h)</div>
      <canvas id="chartTrend" style="position:absolute;top:36px;left:0;right:0;bottom:0;width:100%;height:calc(100% - 36px)"></canvas>
    </div>
  </div>

  <!-- 필터 -->
  <div class="filter-bar">
    <div class="form-row">
      <div class="form-field">
        <label class="form-label">시작일</label>
        <input class="form-input" type="date" id="dateFrom" style="width:140px">
      </div>
      <div class="form-field">
        <label class="form-label">종료일</label>
        <input class="form-input" type="date" id="dateTo" style="width:140px">
      </div>
      <div class="form-field">
        <label class="form-label">PLC</label>
        <select class="form-select" id="selPlc" style="width:130px">
          <option value="">전체</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-label">상태</label>
        <select class="form-select" id="selState" style="width:110px">
          <option value="">전체</option>
          <option value="active">활성</option>
          <option value="cleared">해제됨</option>
        </select>
      </div>
      <div class="form-field" style="align-self:flex-end">
        <button class="btn-primary" onclick="applyFilter()">🔍 조회</button>
      </div>
    </div>
  </div>

  <!-- 테이블 -->
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div class="card-title" style="margin:0">알람 목록</div>
      <span class="total-count" id="totalCount">총 0건</span>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th>
          <th class="th-sort desc" id="thOccur" onclick="toggleSort('occurTime')">발생시각</th>
          <th>PLC</th><th>태그명</th><th>내용</th><th>발생값</th>
          <th class="th-sort" id="thClear" onclick="toggleSort('clearTime')">해제시각</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody id="alarmBody"></tbody>
    </table>
    <div class="pagination" id="pagination"></div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script>
var base = '${pageContext.request.contextPath}';
var allHistory = [];  // history/list 결과
var allActive  = [];  // active/list 결과
var filtered   = [];
var PAGE_SIZE  = 20;
var curPage    = 1;
var curSortCol = 'occurTime';
var curSortDir = 'desc';

var chartState, chartPlc, chartTrend;

/* ── 데이터 로드 ── */
function loadAll(){
  document.getElementById('lastUpdate').textContent = '로딩 중…';
  var p1 = fetch(base + '/alarm/active/list?limit=200').then(function(r){ return r.json(); }).catch(function(){ return []; });
  var p2 = fetch(base + '/alarm/history/list?limit=500').then(function(r){ return r.json(); }).catch(function(){ return []; });
  Promise.all([p1, p2]).then(function(res){
    allActive  = Array.isArray(res[0]) ? res[0] : [];
    allHistory = Array.isArray(res[1]) ? res[1] : [];
    updateKpi();
    buildCharts();
    populatePlcFilter();
    applyFilter();
    var now = new Date();
    document.getElementById('lastUpdate').textContent = '갱신: '
      + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
    window.scrollTo(0,0);
  });
}

/* ── KPI ── */
function updateKpi(){
  var todayStr = new Date().toISOString().slice(0,10);
  var combined = allHistory.slice();
  allActive.forEach(function(a){
    var dup = combined.some(function(h){ return h.tagName===a.tagName && h.occurTime===a.occurTime; });
    if(!dup) combined.push(a);
  });
  document.getElementById('kpiActive').textContent  = allActive.length;
  document.getElementById('kpiToday').textContent   = combined.filter(function(r){ return (r.occurTime||'').slice(0,10) === todayStr; }).length;
  document.getElementById('kpiUnack').textContent   = allActive.filter(function(r){ return !r.ackTime; }).length;
  document.getElementById('kpiCleared').textContent = allHistory.filter(function(r){ return r.clearTime; }).length;
}

/* ── PLC ID → 설비명 치환 ── */
function plcLabel(plcId) {
  if (!plcId) return '-';
  var m = String(plcId).match(/(\d+)$/);
  if (m) return parseInt(m[1], 10) + '호기';
  return plcId;
}

/* ── PLC 필터 드롭다운 ── */
function populatePlcFilter(){
  var ids = {};
  allHistory.forEach(function(r){ if(r.plcId) ids[r.plcId]=1; });
  var sel = document.getElementById('selPlc');
  sel.innerHTML = '<option value="">전체</option>';
  Object.keys(ids).sort().forEach(function(id){
    sel.innerHTML += '<option value="'+id+'">'+plcLabel(id)+'</option>';
  });
}

/* ── 차트 ── */
function buildCharts(){
  /* 상태별 도넛 */
  var activeCnt  = allActive.length;
  var clearedCnt = allHistory.filter(function(r){ return r.clearTime; }).length;

  if(chartState){ chartState.destroy(); }
  chartState = new Chart(document.getElementById('chartState'), {
    type:'doughnut',
    data:{
      labels:['활성','해제'],
      datasets:[{
        data:[activeCnt, clearedCnt],
        backgroundColor:['#E53E3E','#38A169'],
        borderWidth:2, borderColor:'#fff'
      }]
    },
    options:{
      responsive:false, maintainAspectRatio:false, animation:false,
      plugins:{
        legend:{ position:'bottom', labels:{ font:{size:11}, padding:8 } }
      },
      cutout:'62%'
    }
  });

  /* PLC별 바 */
  var plcCnt = {};
  allHistory.forEach(function(r){ var p=r.plcId||'unknown'; plcCnt[p]=(plcCnt[p]||0)+1; });
  var plcKeys = Object.keys(plcCnt).sort(function(a,b){ return plcCnt[b]-plcCnt[a]; }).slice(0,8);

  if(chartPlc){ chartPlc.destroy(); }
  chartPlc = new Chart(document.getElementById('chartPlc'), {
    type:'bar',
    data:{
      labels:plcKeys.map(plcLabel),
      datasets:[{
        label:'알람 수',
        data:plcKeys.map(function(k){ return plcCnt[k]; }),
        backgroundColor:'#4299E1', borderRadius:5
      }]
    },
    options:{
      responsive:false, maintainAspectRatio:false, animation:false, indexAxis:'y',
      plugins:{ legend:{display:false} },
      scales:{ x:{ grid:{color:'#F0F4F8'} }, y:{ ticks:{font:{size:11}} } }
    }
  });

  /* 시간대별 추이 — 최근 24h, 1시간 단위 */
  var now = new Date();
  var bucketStart = new Date(now.getTime() - 23*3600000);
  bucketStart.setMinutes(0,0,0);
  var buckets = [];
  for(var h=0;h<24;h++){
    var t = new Date(bucketStart.getTime() + h*3600000);
    buckets.push({ label: String(t.getHours()).padStart(2,'0')+'시', ts: t.getTime(), cnt:0 });
  }
  var cutoff = bucketStart.getTime();
  allHistory.forEach(function(r){
    var raw = r.occurTime || '';
    var ts  = new Date(raw.replace(' ','T')).getTime();
    if(!ts || isNaN(ts) || ts < cutoff) return;
    for(var i=buckets.length-1;i>=0;i--){
      if(ts >= buckets[i].ts){ buckets[i].cnt++; break; }
    }
  });

  if(chartTrend){ chartTrend.destroy(); }
  chartTrend = new Chart(document.getElementById('chartTrend'), {
    type:'line',
    data:{
      labels:buckets.map(function(b){ return b.label; }),
      datasets:[{
        label:'알람 발생 수',
        data:buckets.map(function(b){ return b.cnt; }),
        borderColor:'#E53E3E', backgroundColor:'rgba(229,62,62,.08)',
        borderWidth:2, pointRadius:3, fill:true, tension:.35
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false, animation:false,
      plugins:{ legend:{display:false} },
      scales:{
        x:{ ticks:{font:{size:10}, maxTicksLimit:12} },
        y:{ beginAtZero:true, grid:{color:'#F0F4F8'}, ticks:{font:{size:10}, stepSize:1} }
      }
    }
  });
}

/* ── 필터 적용 ── */
function applyFilter(){
  curPage = 1;
  var from  = document.getElementById('dateFrom').value;
  var to    = document.getElementById('dateTo').value + 'T23:59:59';
  var plcF  = document.getElementById('selPlc').value;
  var stF   = document.getElementById('selState').value;

  // active + history 합본 (active는 clearTime이 없음)
  var combined = allHistory.slice();
  allActive.forEach(function(a){
    var dup = combined.some(function(h){ return h.tagName===a.tagName && h.occurTime===a.occurTime; });
    if(!dup){ combined.push(a); }
  });

  filtered = combined.filter(function(r){
    if(from && (r.occurTime||'') < from) return false;
    if(to   && (r.occurTime||'') > to  ) return false;
    if(plcF && r.plcId !== plcF        ) return false;
    if(stF === 'active'  && r.clearTime) return false;
    if(stF === 'cleared' && !r.clearTime) return false;
    return true;
  });

  applySortFiltered();

  document.getElementById('totalCount').textContent = '총 '+filtered.length+'건';
  renderPage(1);
}

/* ── 정렬 ── */
function applySortFiltered() {
  var col = curSortCol, dir = curSortDir;
  filtered.sort(function(a, b) {
    var av = a[col] || '', bv = b[col] || '';
    if (av === bv) return 0;
    var cmp = av < bv ? -1 : 1;
    return dir === 'asc' ? cmp : -cmp;
  });
  // 헤더 아이콘 갱신
  ['thOccur','thClear'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('asc','desc');
  });
  var activeId = col === 'occurTime' ? 'thOccur' : 'thClear';
  var el = document.getElementById(activeId);
  if (el) el.classList.add(dir);
}

function toggleSort(col) {
  if (curSortCol === col) {
    curSortDir = curSortDir === 'desc' ? 'asc' : 'desc';
  } else {
    curSortCol = col;
    curSortDir = 'desc';
  }
  applySortFiltered();
  renderPage(1);
}

/* ── 테이블 렌더 ── */
function renderPage(page){
  curPage = page;
  var start = (page-1)*PAGE_SIZE;
  var rows  = filtered.slice(start, start+PAGE_SIZE);
  var html  = '';
  rows.forEach(function(r, i){
    var isActive = !r.clearTime;
    html += '<tr'+(isActive?' class="alarm-row-active"':'')+'>'
          + '<td>'+(start+i+1)+'</td>'
          + '<td style="font-size:12px;font-family:monospace">'+(r.occurTime||'-')+'</td>'
          + '<td><span style="font-size:12px;font-weight:600">'+esc(plcLabel(r.plcId))+'</span></td>'
          + '<td style="font-weight:600">'+esc(r.tagName||'-')+'</td>'
          + '<td>'+esc(r.alarmMsg||'-')+'</td>'
          + '<td style="font-family:monospace;font-size:12px">'+(r.valueAtOccur!=null?r.valueAtOccur:'-')+'</td>'
          + '<td style="font-size:12px;color:var(--muted)">'+(r.clearTime||'—')+'</td>'
          + '<td><span class="badge '+(isActive?'badge-alarm':'badge-ok')+'">'+(isActive?'활성':'해제')+'</span></td>'
          + '</tr>';
  });
  document.getElementById('alarmBody').innerHTML = html || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px">데이터 없음</td></tr>';
  renderPaging();
}

function renderPaging(){
  var total = Math.ceil(filtered.length / PAGE_SIZE);
  var html  = '';
  if(total <= 1){ document.getElementById('pagination').innerHTML=''; return; }
  if(curPage>1)  html += '<button class="page-btn" onclick="renderPage('+(curPage-1)+')">‹</button>';
  var s=Math.max(1,curPage-3), e=Math.min(total,curPage+3);
  for(var p=s;p<=e;p++){
    html += '<button class="page-btn'+(p===curPage?' active':'')+'" onclick="renderPage('+p+')">'+p+'</button>';
  }
  if(curPage<total) html += '<button class="page-btn" onclick="renderPage('+(curPage+1)+')">›</button>';
  document.getElementById('pagination').innerHTML = html;
}

/* ── 엑셀 다운로드 ── */
var BCF_MACHINES = [
  {plcId:'dongwoo_01', label:'BCF_01'},
  {plcId:'dongwoo_02', label:'BCF_02'},
  {plcId:'dongwoo_03', label:'BCF_03'},
  {plcId:'dongwoo_04', label:'BCF_04'},
  {plcId:'dongwoo_05', label:'BCF_05'},
  {plcId:'dongwoo_06', label:'BCF_06'},
  {plcId:'dongwoo_07', label:'BCF_07'},
  {plcId:'dongwoo_08', label:'BCF_08'},
  {plcId:'dongwoo_09', label:'BCF_09'},
  {plcId:'dongwoo_10', label:'BCF_10'},
  {plcId:'dongwoo_11', label:'BCF_11'},
  {plcId:'dongwoo_12', label:'BCF_12'}
];
function downloadExcel(){
  if(typeof XLSX === 'undefined'){ alert('라이브러리 로드 중입니다. 잠시 후 다시 시도해주세요.'); return; }

  var from  = document.getElementById('dateFrom').value;
  var to    = document.getElementById('dateTo').value;
  var toEnd = to + 'T23:59:59';

  // active + history 합본 (중복 제거)
  var combined = allHistory.slice();
  allActive.forEach(function(a){
    var dup = combined.some(function(h){ return h.tagName===a.tagName && h.occurTime===a.occurTime; });
    if(!dup) combined.push(a);
  });

  // 날짜 범위 필터
  var data = combined.filter(function(r){
    if(from && (r.occurTime||'') < from) return false;
    if(to   && (r.occurTime||'') > toEnd) return false;
    return true;
  });

  var wb = XLSX.utils.book_new();
  var HEADER = ['No','발생시각','설비','태그명','알람내용','발생값','해제시각','상태'];

  BCF_MACHINES.forEach(function(m){
    var rows = data.filter(function(r){ return r.plcId === m.plcId; });
    rows.sort(function(a,b){ return (a.occurTime||'') < (b.occurTime||'') ? -1 : 1; });

    var wsData = [HEADER];
    rows.forEach(function(r, i){
      wsData.push([
        i+1,
        r.occurTime  || '-',
        m.label,
        r.tagName    || '-',
        r.alarmMsg   || '-',
        r.valueAtOccur != null ? r.valueAtOccur : '-',
        r.clearTime  || '',
        r.clearTime  ? '해제' : '활성'
      ]);
    });

    var ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      {wch:5},{wch:22},{wch:10},{wch:28},{wch:45},{wch:12},{wch:22},{wch:8}
    ];
    XLSX.utils.book_append_sheet(wb, ws, m.label);
  });

  var fileName = '알람이력_' + from + '_' + to + '.xlsx';
  XLSX.writeFile(wb, fileName);
}

/* ── 유틸 ── */
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── 초기화 ── */
function toLocalDate(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
var today = new Date();
document.getElementById('dateTo').value   = toLocalDate(today);
var m1 = new Date(today); m1.setDate(m1.getDate() - 7);
document.getElementById('dateFrom').value = toLocalDate(m1);

loadAll();
setInterval(loadAll, 300000); // 5분 주기 자동 갱신
</script>
</body>
</html>
