<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../common_style.jsp" %>
<style>
.period-tab { display:flex; gap:6px; margin-bottom:16px; }
.tab-btn {
  padding:6px 18px; border-radius:20px; border:1px solid var(--border);
  background:var(--white); font-size:12px; font-weight:600; cursor:pointer; transition:all .13s;
}
.tab-btn.active { background:var(--primary); color:#fff; border-color:var(--primary); }

.rank-wrap { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
@media(max-width:800px){ .rank-wrap { grid-template-columns:1fr; } }

.chart-wrap { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
@media(max-width:800px){ .chart-wrap { grid-template-columns:1fr; } }

.rank-list { display:flex; flex-direction:column; gap:7px; }
.rank-item {
  display:flex; align-items:center; gap:12px;
  padding:10px 14px; border-radius:9px; border:1px solid var(--border); background:var(--white);
  transition:all .13s;
}
.rank-item:hover { box-shadow:var(--shadow-md); border-color:var(--primary-m); }
.rank-no {
  width:26px; height:26px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:800; flex-shrink:0;
}
.rk-1 { background:#FFD700; color:#7B5800; }
.rk-2 { background:#C0C0C0; color:#4A4A4A; }
.rk-3 { background:#CD7F32; color:#fff; }
.rk-n { background:var(--bg); color:var(--muted); }
.rank-info { flex:1; min-width:0; }
.rank-name  { font-size:13px; font-weight:600; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.rank-sub   { font-size:11px; color:var(--muted); margin-top:1px; }
.rank-bar-wrap { width:100px; flex-shrink:0; }
.rank-bar-bg { height:7px; background:var(--bg); border-radius:4px; overflow:hidden; margin-bottom:3px; }
.rank-bar-fill { height:100%; border-radius:4px; }
.rank-cnt { font-size:11px; color:var(--muted); text-align:right; }

.kpi-mini-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
.kpi-mini { background:var(--white);border:1px solid var(--border);border-radius:10px;padding:12px 16px;text-align:center;box-shadow:var(--shadow); }
.kpi-mini-val { font-size:24px; font-weight:800; }
.kpi-mini-lbl { font-size:11px; color:var(--muted); margin-top:2px; }

.chart-box { background:var(--white); border:1px solid var(--border); border-radius:12px;
  padding:16px 18px; box-shadow:var(--shadow); }
.chart-box-title { font-size:12px; font-weight:700; color:var(--muted); margin-bottom:12px; }

.loading-msg { text-align:center; padding:40px; color:var(--muted); font-size:13px; }
.range-box { display:none; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
.range-box.show { display:flex; }
.range-input {
  padding:6px 10px; border:1px solid var(--border); border-radius:8px;
  font-size:12px; font-weight:700; color:var(--text); outline:none;
  font-family:'Malgun Gothic','맑은 고딕',sans-serif;
}
.range-input:focus { border-color:var(--primary); }
</style>
<body>
<div class="page-wrap">
  <div class="page-header">
    <div>
      <div class="page-title">알람 랭킹</div>
      <div class="page-sub">빈도 기준 알람 분석 · 실시간 연동</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <span style="font-size:11px;color:var(--muted)" id="lastUpdate"></span>
      <button class="btn-primary" onclick="curPeriod==='range'?loadDataRange():loadData()">🔄 새로고침</button>
    </div>
  </div>

  <div class="period-tab">
    <button class="tab-btn" onclick="setPeriod('day',this)">오늘</button>
    <button class="tab-btn" onclick="setPeriod('week',this)">이번 주</button>
    <button class="tab-btn active" onclick="setPeriod('month',this)">이번 달</button>
    <button class="tab-btn" onclick="setPeriod('all',this)">전체</button>
    <button class="tab-btn" onclick="setPeriod('range',this)">기간 지정</button>
  </div>
  <div class="range-box" id="rangeBox">
    <input type="date" class="range-input" id="fromDate">
    <span style="color:var(--muted);font-weight:700">~</span>
    <input type="date" class="range-input" id="toDate">
    <button class="btn-primary" onclick="loadDataRange()">조회</button>
  </div>

  <!-- KPI 미니 -->
  <div class="kpi-mini-row">
    <div class="kpi-mini">
      <div class="kpi-mini-val" id="kpiTotal" style="color:var(--primary)">-</div>
      <div class="kpi-mini-lbl">기간 내 전체 알람</div>
    </div>
    <div class="kpi-mini" id="kpiTopItem">
      <div class="kpi-mini-val" style="color:var(--red)">-</div>
      <div class="kpi-mini-lbl">최다 발생 항목</div>
    </div>
    <div class="kpi-mini" id="kpiTopPlc">
      <div class="kpi-mini-val" style="color:var(--orange)">-</div>
      <div class="kpi-mini-lbl">최다 발생 PLC</div>
    </div>
  </div>

  <!-- 차트 -->
  <div class="chart-wrap">
    <div class="chart-box">
      <div class="chart-box-title">알람 항목 TOP 10 (건수)</div>
      <canvas id="chartItem" height="260"></canvas>
    </div>
    <div class="chart-box">
      <div class="chart-box-title">PLC별 알람 TOP 10 (건수)</div>
      <canvas id="chartPlc" height="260"></canvas>
    </div>
  </div>

  <!-- 랭킹 리스트 -->
  <div class="rank-wrap">
    <div class="card">
      <div class="card-title">알람 항목 TOP 10</div>
      <div class="rank-list" id="itemRanking">
        <div class="loading-msg">로딩 중…</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">PLC별 알람 TOP 10</div>
      <div class="rank-list" id="plcRanking">
        <div class="loading-msg">로딩 중…</div>
      </div>
    </div>
  </div>

  <!-- 등급별 추이 차트 -->
  <div class="card">
    <div class="card-title">등급별 알람 발생 비율</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <canvas id="chartLvDist" height="200"></canvas>
      <canvas id="chartLvBar"  height="200"></canvas>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
var base    = '${pageContext.request.contextPath}';
var rawData = [];       // history API 전체
var curPeriod = 'month';
var charts  = {};

var LV_LABEL = {1:'위험',2:'경고',3:'주의',4:'정보'};
var LV_COLOR = ['#7B2D8B','#DD6B20','#ECC94B','#4299E1'];
var RANK_COLORS = ['#3182CE','#38A169','#DD6B20','#E53E3E','#805AD5','#00B5D8','#ED64A6','#ECC94B','#4299E1','#A0AEC0'];

/* ── 날짜 필터 기준 ── */
function periodStart(p){
  var d = new Date();
  if(p==='day'){   d.setHours(0,0,0,0); }
  else if(p==='week'){  var day=d.getDay(); d.setDate(d.getDate()-day); d.setHours(0,0,0,0); }
  else if(p==='month'){ d.setDate(1); d.setHours(0,0,0,0); }
  else return null; // 'all', 'range'
  return d;
}

function filterByPeriod(data, p){
  if(p==='range') return data; // 서버에서 이미 필터링
  var start = periodStart(p);
  if(!start) return data;
  return data.filter(function(r){
    return new Date(r.occurTime||r.occurrTime||0) >= start;
  });
}

/* ── 집계 ── */
function countBy(data, key){
  var map = {};
  data.forEach(function(r){ var k=r[key]||'unknown'; map[k]=(map[k]||0)+1; });
  return Object.entries(map).sort(function(a,b){ return b[1]-a[1]; });
}

/* dongwoo_04 → BCF4 */
function plcLabel(id){
  var m = (id||'').match(/(\d+)$/);
  return m ? 'BCF' + parseInt(m[1]) : (id||'?');
}

/* 호기_경보내용 복합키 집계 */
function countByItem(data){
  var map = {};
  data.forEach(function(r){
    var k = plcLabel(r.plcId) + '_' + (r.alarmMsg || 'unknown');
    map[k] = (map[k]||0) + 1;
  });
  return Object.entries(map).sort(function(a,b){ return b[1]-a[1]; });
}

/* ── 데이터 로드 ── */
function loadData(){
  document.getElementById('lastUpdate').textContent = '로딩 중…';
  fetch(base + '/alarm/history/list?limit=1000')
    .then(function(r){ return r.json(); })
    .then(function(d){
      rawData = Array.isArray(d) ? d : [];
      renderAll();
      var now = new Date();
      document.getElementById('lastUpdate').textContent = '갱신: '
        + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
    })
    .catch(function(){
      rawData = [];
      renderAll();
      document.getElementById('lastUpdate').textContent = 'API 연결 실패';
    });
}

function setPeriod(p, btn){
  curPeriod = p;
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
  if(btn) btn.classList.add('active');
  var rb = document.getElementById('rangeBox');
  if(p === 'range'){
    rb.classList.add('show');
    /* 기간 탭은 조회 버튼을 눌러야 로드 */
  } else {
    rb.classList.remove('show');
    renderAll();
  }
}

function loadDataRange(){
  var from = document.getElementById('fromDate').value;
  var to   = document.getElementById('toDate').value;
  if(!from || !to){ alert('날짜를 선택하세요'); return; }
  document.getElementById('lastUpdate').textContent = '로딩 중…';
  fetch(base + '/alarm/history/range?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to))
    .then(function(r){ return r.json(); })
    .then(function(d){
      rawData = Array.isArray(d) ? d : [];
      renderAll();
      var now = new Date();
      document.getElementById('lastUpdate').textContent =
        from + ' ~ ' + to + ' (' + rawData.length + '건)';
    })
    .catch(function(){
      rawData = [];
      renderAll();
      document.getElementById('lastUpdate').textContent = '조회 실패';
    });
}

function renderAll(){
  var data = filterByPeriod(rawData, curPeriod);
  renderKpi(data);
  renderRankLists(data);
  renderCharts(data);
  window.scrollTo(0,0);
}

/* ── KPI ── */
function renderKpi(data){
  document.getElementById('kpiTotal').textContent = data.length;

  var byItem = countByItem(data);
  var topItemEl = document.getElementById('kpiTopItem');
  if(byItem.length > 0){
    topItemEl.innerHTML = '<div class="kpi-mini-val" style="color:var(--red);font-size:18px">'+esc(byItem[0][0])+'</div>'
      + '<div class="kpi-mini-lbl">최다 항목 ('+byItem[0][1]+'건)</div>';
  } else {
    topItemEl.innerHTML = '<div class="kpi-mini-val" style="color:var(--red)">—</div><div class="kpi-mini-lbl">최다 발생 항목</div>';
  }

  var byPlc = countBy(data, 'plcId');
  var topPlcEl = document.getElementById('kpiTopPlc');
  if(byPlc.length > 0){
    topPlcEl.innerHTML = '<div class="kpi-mini-val" style="color:var(--orange);font-size:18px">'+esc(byPlc[0][0])+'</div>'
      + '<div class="kpi-mini-lbl">최다 PLC ('+byPlc[0][1]+'건)</div>';
  } else {
    topPlcEl.innerHTML = '<div class="kpi-mini-val" style="color:var(--orange)">—</div><div class="kpi-mini-lbl">최다 발생 PLC</div>';
  }
}

/* ── 랭킹 리스트 ── */
function renderRankLists(data){
  var byItem = countByItem(data).slice(0,10);
  var byPlc  = countBy(data, 'plcId').slice(0,10);
  document.getElementById('itemRanking').innerHTML = buildRankHtml(byItem);
  document.getElementById('plcRanking').innerHTML  = buildRankHtml(byPlc);
}

function buildRankHtml(entries){
  if(!entries.length) return '<div class="loading-msg">데이터 없음</div>';
  var max = entries[0][1];
  return entries.map(function(e,i){
    var pct = Math.round(e[1]/max*100);
    var rCls = i===0?'rk-1':i===1?'rk-2':i===2?'rk-3':'rk-n';
    var barColor = i < 3 ? 'var(--primary)' : 'var(--light)';
    return '<div class="rank-item">'
      + '<div class="rank-no '+rCls+'">'+(i+1)+'</div>'
      + '<div class="rank-info"><div class="rank-name">'+esc(e[0])+'</div></div>'
      + '<div class="rank-bar-wrap">'
      + '  <div class="rank-bar-bg"><div class="rank-bar-fill" style="width:'+pct+'%;background:'+barColor+'"></div></div>'
      + '  <div class="rank-cnt">'+e[1]+'건</div>'
      + '</div>'
      + '</div>';
  }).join('');
}

/* ── 차트 ── */
function destroyChart(key){
  if(charts[key]){ charts[key].destroy(); charts[key]=null; }
}

function renderCharts(data){
  var byItem = countByItem(data).slice(0,10);
  var byPlc  = countBy(data, 'plcId').slice(0,10);

  /* 항목 가로 바 */
  destroyChart('item');
  charts['item'] = new Chart(document.getElementById('chartItem'), {
    type:'bar',
    data:{
      labels: byItem.map(function(e){ return e[0]; }),
      datasets:[{
        label:'알람 건수',
        data: byItem.map(function(e){ return e[1]; }),
        backgroundColor: byItem.map(function(_,i){ return RANK_COLORS[i%RANK_COLORS.length]; }),
        borderRadius:5
      }]
    },
    options:{
      responsive:false, maintainAspectRatio:false, animation:false, indexAxis:'y',
      plugins:{ legend:{display:false} },
      scales:{ x:{grid:{color:'#F0F4F8'}, ticks:{font:{size:10}}}, y:{ticks:{font:{size:11}}} }
    }
  });

  /* PLC 가로 바 */
  destroyChart('plc');
  charts['plc'] = new Chart(document.getElementById('chartPlc'), {
    type:'bar',
    data:{
      labels: byPlc.map(function(e){ return e[0]; }),
      datasets:[{
        label:'알람 건수',
        data: byPlc.map(function(e){ return e[1]; }),
        backgroundColor: byPlc.map(function(_,i){ return RANK_COLORS[i%RANK_COLORS.length]; }),
        borderRadius:5
      }]
    },
    options:{
      responsive:false, maintainAspectRatio:false, animation:false, indexAxis:'y',
      plugins:{ legend:{display:false} },
      scales:{ x:{grid:{color:'#F0F4F8'}, ticks:{font:{size:10}}}, y:{ticks:{font:{size:11}}} }
    }
  });

  /* 등급 도넛 */
  var lvCnt = {1:0,2:0,3:0,4:0};
  data.forEach(function(r){ var l=parseInt(r.level)||0; if(lvCnt[l]!==undefined) lvCnt[l]++; });
  destroyChart('lvDist');
  charts['lvDist'] = new Chart(document.getElementById('chartLvDist'), {
    type:'doughnut',
    data:{
      labels:['위험(Lv1)','경고(Lv2)','주의(Lv3)','정보(Lv4)'],
      datasets:[{
        data:[lvCnt[1],lvCnt[2],lvCnt[3],lvCnt[4]],
        backgroundColor:LV_COLOR, borderWidth:2, borderColor:'#fff'
      }]
    },
    options:{
      responsive:false, maintainAspectRatio:false, animation:false,
      plugins:{ legend:{ position:'right', labels:{ font:{size:11}, padding:10 } } },
      cutout:'55%'
    }
  });

  /* 등급 세로 바 */
  destroyChart('lvBar');
  charts['lvBar'] = new Chart(document.getElementById('chartLvBar'), {
    type:'bar',
    data:{
      labels:['위험(Lv1)','경고(Lv2)','주의(Lv3)','정보(Lv4)'],
      datasets:[{
        label:'건수',
        data:[lvCnt[1],lvCnt[2],lvCnt[3],lvCnt[4]],
        backgroundColor:LV_COLOR,
        borderRadius:6
      }]
    },
    options:{
      responsive:false, maintainAspectRatio:false, animation:false,
      plugins:{ legend:{display:false} },
      scales:{
        x:{ grid:{display:false} },
        y:{ beginAtZero:true, grid:{color:'#F0F4F8'}, ticks:{font:{size:10}} }
      }
    }
  });
}

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

loadData();
</script>
</body>
</html>
