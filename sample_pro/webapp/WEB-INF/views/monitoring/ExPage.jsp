<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>PLC 자동 쓰기 테스트</title>
<link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<style>
:root {
  --bg:     #07090F;
  --panel:  #0A0D1A;
  --panel2: #0D1020;
  --border: #1A3A5C;
  --accent: #00F0FF;
  --purple: #B24BF3;
  --green:  #00FF88;
  --text:   #A8D8F0;
  --muted:  #3A5A7A;
  --warn:   #FFB700;
  --err:    #FF3B5C;
  --mono:   'Consolas', monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body { background: var(--bg); color: var(--text); font-family: var(--mono); display: flex; flex-direction: column; height: 100vh; }

.main-wrap { display: flex; flex: 1; overflow: hidden; padding: 12px 14px; gap: 12px; }

/* ══ 좌측 설정 패널 ══ */
.config-panel {
  width: 320px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 8px;
  overflow-y: auto; padding-right: 2px;
}
.config-panel::-webkit-scrollbar { width: 4px; }
.config-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 7px; }
.card-title { font-size: 10px; font-weight: bold; letter-spacing: 1.5px; color: var(--accent); text-transform: uppercase; border-bottom: 1px solid var(--border); padding-bottom: 5px; margin-bottom: 1px; }

label { font-size: 11px; color: var(--muted); }
select, input[type=number] {
  width: 100%; background: var(--panel2); border: 1px solid var(--border);
  color: var(--text); font-family: var(--mono); font-size: 12px;
  padding: 5px 7px; border-radius: 4px; outline: none; transition: border-color .15s;
}
select:focus, input:focus { border-color: var(--accent); }

.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; align-items: end; }
.row2 .field { display: flex; flex-direction: column; gap: 3px; }

/* ── PLC 다중 선택 ── */
.plc-add-row { display: flex; gap: 6px; }
.plc-add-row select { flex: 1; }
.btn-add-plc {
  background: none; border: 1px solid var(--accent); color: var(--accent);
  border-radius: 4px; padding: 5px 10px; font-size: 11px; cursor: pointer;
  font-family: var(--mono); transition: all .15s; flex-shrink: 0;
}
.btn-add-plc:hover { background: #001A2A; }

.plc-tag-list { display: flex; flex-direction: column; gap: 4px; max-height: 160px; overflow-y: auto; }
.plc-tag-list::-webkit-scrollbar { width: 3px; }
.plc-tag-list::-webkit-scrollbar-thumb { background: var(--border); }

.plc-tag {
  display: flex; align-items: center; gap: 6px;
  background: var(--panel2); border: 1px solid var(--border); border-radius: 5px;
  padding: 5px 8px; font-size: 11px;
}
.pt-dot  { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); flex-shrink: 0; transition: all .3s; }
.pt-dot.ok   { background: var(--green); box-shadow: 0 0 6px var(--green); }
.pt-dot.fail { background: var(--err);   box-shadow: 0 0 6px var(--err); animation: blink .4s infinite; }
.pt-dot.disc { background: var(--err);   box-shadow: 0 0 8px var(--err); }
.pt-label { flex: 1; color: var(--text); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.pt-type  { font-size: 9px; color: var(--muted); flex-shrink: 0; }
.pt-del   { background: none; border: none; color: var(--err); cursor: pointer; font-size: 12px; padding: 0 2px; opacity: .5; transition: opacity .15s; }
.pt-del:hover { opacity: 1; }
.plc-empty { font-size: 11px; color: var(--muted); text-align: center; padding: 8px; }

/* ── 값 목록 ── */
.value-list { display: flex; flex-direction: column; gap: 5px; }
.value-row  { display: flex; gap: 5px; align-items: center; }
.value-row input { flex: 1; }
.btn-del-val { background: none; border: 1px solid #3A1A2A; color: var(--err); border-radius: 4px; padding: 3px 7px; font-size: 11px; cursor: pointer; transition: all .15s; flex-shrink: 0; font-family: var(--mono); }
.btn-del-val:hover { background: #3A1A2A; }
.btn-add-val { background: none; border: 1px dashed var(--border); color: var(--muted); border-radius: 4px; padding: 5px; font-size: 11px; cursor: pointer; transition: all .15s; font-family: var(--mono); width: 100%; text-align: center; }
.btn-add-val:hover { border-color: var(--accent); color: var(--accent); }

/* ── 인터벌 ── */
.interval-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.int-btn { background: var(--panel2); border: 1px solid var(--border); color: var(--muted); border-radius: 4px; padding: 6px 3px; font-size: 10px; cursor: pointer; text-align: center; transition: all .15s; font-family: var(--mono); }
.int-btn:hover  { border-color: var(--accent); color: var(--text); }
.int-btn.active { border-color: var(--accent); background: #001A2A; color: var(--accent); font-weight: bold; }

/* ── 시작/정지 ── */
.ctrl-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-start { background: linear-gradient(135deg,#003A1A,#005A28); border: 1px solid var(--green); color: var(--green); border-radius: 6px; padding: 10px; font-size: 13px; font-weight: bold; cursor: pointer; font-family: var(--mono); transition: all .15s; }
.btn-start:hover   { box-shadow: 0 0 14px #00FF8844; }
.btn-start:disabled { opacity: .3; cursor: not-allowed; box-shadow: none; }
.btn-stop  { background: linear-gradient(135deg,#3A0010,#5A0018); border: 1px solid var(--err);  color: var(--err);  border-radius: 6px; padding: 10px; font-size: 13px; font-weight: bold; cursor: pointer; font-family: var(--mono); transition: all .15s; }
.btn-stop:hover    { box-shadow: 0 0 14px #FF3B5C44; }
.btn-stop:disabled  { opacity: .3; cursor: not-allowed; box-shadow: none; }

/* ══ 우측 패널 ══ */
.right-panel { flex: 1; display: flex; flex-direction: column; gap: 8px; overflow: hidden; min-width: 0; }

/* 상태 바 */
.status-bar { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.status-badge { font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 20px; border: 1px solid; letter-spacing: 1.5px; min-width: 110px; text-align: center; transition: all .3s; }
.status-badge.idle       { border-color: var(--muted); color: var(--muted); }
.status-badge.running    { border-color: var(--green); color: var(--green); box-shadow: 0 0 10px #00FF8844; }
.status-badge.warning    { border-color: var(--warn);  color: var(--warn);  animation: blink .6s infinite; }
.status-badge.error      { border-color: var(--err);   color: var(--err);   animation: blink .4s infinite; }
@keyframes blink { 50% { opacity:.4; } }

/* 전체 미니 통계 */
.stat-mini { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; display: flex; gap: 14px; align-items: center; flex-shrink: 0; }
.sm-item { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.sm-label { font-size: 9px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }
.sm-val { font-size: 18px; font-weight: bold; }
.sm-val.ok   { color: var(--green); }
.sm-val.fail { color: var(--err); }
.sm-val.rate { color: var(--accent); }
.sm-val.normal { color: var(--text); font-size: 14px; }

/* 순환 값 */
.cycle-pill { padding: 2px 8px; border-radius: 10px; font-size: 11px; border: 1px solid var(--border); color: var(--muted); transition: all .2s; }
.cycle-pill.active { border-color: var(--accent); color: var(--accent); background: #001A2A; box-shadow: 0 0 7px #00F0FF33; }

/* PLC별 통계 테이블 */
.plc-stat-wrap { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.pst-header, .pst-row { display: grid; grid-template-columns: 26px 1fr 80px 55px 55px 55px 65px 75px 75px; }
.pst-header > div { font-size: 9px; color: var(--muted); padding: 5px 6px; letter-spacing: 1px; text-transform: uppercase; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.pst-header > div:last-child { border-right: none; }
.pst-row > div { font-size: 11px; padding: 6px 6px; border-right: 1px solid #0D1525; border-bottom: 1px solid #0D1525; display: flex; align-items: center; overflow: hidden; }
.pst-row > div:last-child { border-right: none; }
.pst-row:last-child > div { border-bottom: none; }
.pst-row:hover { background: #0D1525; }
.pst-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); transition: all .3s; }
.pst-dot.ok   { background: var(--green); box-shadow: 0 0 5px var(--green); }
.pst-dot.fail { background: var(--err);   box-shadow: 0 0 5px var(--err); animation: blink .4s infinite; }
.pst-dot.disc { background: var(--err);   box-shadow: 0 0 8px var(--err); }
.pst-empty { font-size: 11px; color: var(--muted); text-align: center; padding: 10px; }

/* 로그 */
.log-panel { flex: 1; overflow: hidden; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; display: flex; flex-direction: column; }
.log-header { padding: 6px 10px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.log-title { font-size: 10px; font-weight: bold; color: var(--accent); letter-spacing: 1.5px; }
.btn-clear { background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 4px; padding: 2px 7px; font-size: 10px; cursor: pointer; font-family: var(--mono); transition: all .15s; }
.btn-clear:hover { border-color: var(--err); color: var(--err); }
.log-body { flex: 1; overflow-y: auto; padding: 4px 8px; }
.log-body::-webkit-scrollbar { width: 4px; }
.log-body::-webkit-scrollbar-thumb { background: var(--border); }
.log-row { display: flex; gap: 6px; font-size: 10px; padding: 2px 2px; border-bottom: 1px solid #0A0E18; }
.log-row:hover { background: #0D1525; }
.log-ts   { color: var(--muted); flex-shrink: 0; width: 68px; }
.log-plc  { color: var(--purple); flex-shrink: 0; width: 70px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.log-addr { color: var(--accent); flex-shrink: 0; width: 56px; }
.log-val  { color: var(--text);   flex-shrink: 0; width: 40px; }
.log-result { flex-shrink: 0; width: 40px; font-weight: bold; }
.log-result.ok   { color: var(--green); }
.log-result.fail { color: var(--err); }
.log-result.info { color: var(--warn); }
.log-msg { color: var(--muted); flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
</style>
</head>
<body>
<jsp:include page="/WEB-INF/views/include/monitorNav.jsp"/>

<div class="main-wrap">

  <!-- ════ 좌측 설정 패널 ════ -->
  <div class="config-panel">

    <!-- PLC 다중 선택 -->
    <div class="card">
      <div class="card-title">PLC 목록 <span style="color:var(--muted);font-weight:normal;font-size:9px">(복수)</span></div>
      <div class="plc-add-row">
        <select id="selPlcAdd"><option value="">-- 로딩 중 --</option></select>
        <button class="btn-add-plc" onclick="addPlc()">+ 추가</button>
      </div>
      <div class="plc-tag-list" id="plcTagList">
        <div class="plc-empty">추가된 PLC 없음</div>
      </div>
    </div>

    <!-- 주소 범위 -->
    <div class="card">
      <div class="card-title">주소 범위</div>
      <div class="row2">
        <div class="field"><label>시작 주소</label><input type="number" id="addrStart" value="40001" min="1" max="99999"></div>
        <div class="field"><label>끝 주소</label><input type="number" id="addrEnd" value="40003" min="1" max="99999"></div>
      </div>
      <div style="font-size:10px;color:var(--muted);">
        영역: <span id="addrAreaInfo" style="color:var(--accent);">4x HOLD (word)</span>
        &nbsp;|&nbsp; 주소 수: <span id="addrCount" style="color:var(--text);">3</span>
        <span style="color:var(--muted);font-size:9px"> (max 20)</span>
      </div>
    </div>

    <!-- 값 목록 -->
    <div class="card">
      <div class="card-title">쓰기 값 <span style="color:var(--muted);font-weight:normal;font-size:9px">(순환)</span></div>
      <div class="value-list" id="valueList"></div>
      <button class="btn-add-val" onclick="addValueRow()">+ 값 추가</button>
    </div>

    <!-- 인터벌 -->
    <div class="card">
      <div class="card-title">인터벌</div>
      <div class="interval-grid" id="intervalGrid">
        <div class="int-btn" data-ms="100"   onclick="setIntervalMs(this)">100ms</div>
        <div class="int-btn" data-ms="250"   onclick="setIntervalMs(this)">250ms</div>
        <div class="int-btn active" data-ms="500"   onclick="setIntervalMs(this)">500ms</div>
        <div class="int-btn" data-ms="1000"  onclick="setIntervalMs(this)">1s</div>
        <div class="int-btn" data-ms="2000"  onclick="setIntervalMs(this)">2s</div>
        <div class="int-btn" data-ms="5000"  onclick="setIntervalMs(this)">5s</div>
        <div class="int-btn" data-ms="10000" onclick="setIntervalMs(this)">10s</div>
        <div class="int-btn" data-ms="30000" onclick="setIntervalMs(this)">30s</div>
      </div>
    </div>

    <!-- 시작/정지 -->
    <div class="card">
      <div class="ctrl-btns">
        <button class="btn-start" id="btnStart" onclick="startTest()">&#9654; 시작</button>
        <button class="btn-stop"  id="btnStop"  onclick="stopTest(null)" disabled>&#9632; 정지</button>
      </div>
      <div style="font-size:10px;color:var(--muted);text-align:center;margin-top:2px;" id="stopReason"></div>
    </div>

  </div><!-- /config-panel -->

  <!-- ════ 우측 패널 ════ -->
  <div class="right-panel">

    <!-- 상태 바 -->
    <div class="status-bar" style="flex-shrink:0;">
      <div class="status-badge idle" id="statusBadge">IDLE</div>
      <div style="font-size:10px;color:var(--muted);">경과 <span id="elapsedTime" style="color:var(--text);">00:00:00</span></div>
      <div style="flex:1;"></div>
      <div style="font-size:10px;color:var(--muted);">현재 값: <span id="curValDisplay" style="color:var(--accent);font-weight:bold;">-</span></div>
    </div>

    <!-- 전체 통계 + 순환 표시 -->
    <div class="stat-mini">
      <div class="sm-item"><div class="sm-label">총 시도</div><div class="sm-val normal" id="statTotal">0</div></div>
      <div class="sm-item"><div class="sm-label">성공</div><div class="sm-val ok"     id="statOk">0</div></div>
      <div class="sm-item"><div class="sm-label">실패</div><div class="sm-val fail"   id="statFail">0</div></div>
      <div class="sm-item"><div class="sm-label">성공률</div><div class="sm-val rate" id="statRate">-</div></div>
      <div class="sm-item"><div class="sm-label">틱</div><div class="sm-val normal"   id="statTick">0</div></div>
      <div class="sm-item" style="flex:1;">
        <div class="sm-label">값 순환</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;" id="cycleDisplay">
          <span style="font-size:11px;color:var(--muted);">-</span>
        </div>
      </div>
    </div>

    <!-- PLC별 통계 -->
    <div class="plc-stat-wrap">
      <div class="pst-header">
        <div></div>
        <div>PLC</div>
        <div>TYPE</div>
        <div>총시도</div>
        <div>성공</div>
        <div>실패</div>
        <div>성공률</div>
        <div>연속실패</div>
        <div>응답(ms)</div>
      </div>
      <div id="plcStatBody">
        <div class="pst-empty">PLC를 추가하세요.</div>
      </div>
    </div>

    <!-- 로그 -->
    <div class="log-panel">
      <div class="log-header">
        <div class="log-title">WRITE LOG</div>
        <button class="btn-clear" onclick="clearLog()">CLEAR</button>
      </div>
      <div class="log-body" id="logBody">
        <div class="log-row">
          <div class="log-ts">--:--:--</div>
          <div class="log-plc">SYS</div>
          <div class="log-result info">INFO</div>
          <div class="log-msg">PLC를 추가하고 시작을 눌러주세요.</div>
        </div>
      </div>
    </div>

  </div><!-- /right-panel -->
</div><!-- /main-wrap -->

<script>
var ctx = '<%=ctx%>';

/* ══ 전역 상태 ══ */
var allPlcs    = [];   // DB 전체 PLC 목록
var selPlcs    = [];   // 테스트에 추가된 PLC [{plcId,label,plcType,ip,port}]
var plcStats   = {};   // plcId -> {total,ok,fail,streak,maxStreak,lastMs,disc}
var running    = false;
var tickTimer  = null;
var elTimer    = null;
var valueIndex = 0;
var intervalMs = 500;
var gStats     = { total:0, ok:0, fail:0, tick:0 };
var startTime  = null;
var DISC_THRESHOLD = 5;

/* ══ 초기화 ══ */
$(function() {
    loadPlcList();
    addValueRow(0);
    addValueRow(1);
    addValueRow(100);
    updateAddrInfo();
    $('#addrStart, #addrEnd').on('input', updateAddrInfo);
});

/* ── DB에서 PLC 목록 로드 ── */
function loadPlcList() {
    $.getJSON(ctx + '/plc/dblist', function(data) {
        allPlcs = (data && data.data) || [];
        var sel = $('#selPlcAdd').empty();
        if (!allPlcs.length) { sel.append('<option value="">등록된 PLC 없음</option>'); return; }
        sel.append('<option value="">-- PLC 선택 --</option>');
        allPlcs.forEach(function(p) {
            sel.append('<option value="' + p.plcId + '">' + escHtml(p.label) + ' [' + p.plcType + ']</option>');
        });
    }).fail(function() {
        $('#selPlcAdd').html('<option value="">로드 실패</option>');
        addLog('SYS', '', '', 'INFO', '/plc/dblist 로드 실패');
    });
}

/* ── PLC 추가 ── */
function addPlc() {
    var id = $('#selPlcAdd').val();
    if (!id) return;
    if (selPlcs.find(function(p){ return p.plcId === id; })) {
        addLog('SYS', '', '', 'INFO', '이미 추가된 PLC: ' + id);
        return;
    }
    var p = allPlcs.find(function(x){ return x.plcId === id; });
    if (!p) return;
    selPlcs.push(p);
    plcStats[id] = { total:0, ok:0, fail:0, streak:0, maxStreak:0, lastMs:'-', disc:false };
    $('#selPlcAdd').val('');
    renderPlcTags();
    renderPlcStatTable();
    updateAddrInfo();
}

/* ── PLC 제거 ── */
function removePlc(id) {
    if (running) { addLog('SYS','','','INFO','실행 중에는 PLC를 제거할 수 없습니다.'); return; }
    selPlcs = selPlcs.filter(function(p){ return p.plcId !== id; });
    delete plcStats[id];
    renderPlcTags();
    renderPlcStatTable();
}

/* ── PLC 태그 렌더링 ── */
function renderPlcTags() {
    var list = $('#plcTagList').empty();
    if (!selPlcs.length) { list.append('<div class="plc-empty">추가된 PLC 없음</div>'); return; }
    selPlcs.forEach(function(p) {
        var tag = $('<div class="plc-tag"></div>');
        tag.append('<div class="pt-dot" id="dot_' + p.plcId + '"></div>');
        tag.append('<div class="pt-label">' + escHtml(p.label) + '</div>');
        tag.append('<div class="pt-type">'  + escHtml(p.plcType) + '</div>');
        tag.append('<button class="pt-del" onclick="removePlc(\'' + escHtml(p.plcId) + '\')">&#10005;</button>');
        list.append(tag);
    });
}

/* ── PLC 통계 테이블 렌더링 ── */
function renderPlcStatTable() {
    var body = $('#plcStatBody').empty();
    if (!selPlcs.length) { body.append('<div class="pst-empty">PLC를 추가하세요.</div>'); return; }
    selPlcs.forEach(function(p) {
        var st   = plcStats[p.plcId] || {};
        var rate = st.total > 0 ? ((st.ok / st.total) * 100).toFixed(1) + '%' : '-';
        var dotCls = st.disc ? 'disc' : (st.streak > 0 ? 'fail' : (st.ok > 0 ? 'ok' : ''));
        var row = $('<div class="pst-row" id="prow_' + p.plcId + '"></div>');
        row.append('<div><div class="pst-dot ' + dotCls + '" id="pdot_' + p.plcId + '"></div></div>');
        row.append('<div style="color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(p.label) + '</div>');
        row.append('<div style="color:var(--muted);font-size:10px;">' + escHtml(p.plcType) + '</div>');
        row.append('<div id="pst_total_'  + p.plcId + '" style="color:var(--text);">'    + (st.total  || 0) + '</div>');
        row.append('<div id="pst_ok_'     + p.plcId + '" style="color:var(--green);">'   + (st.ok     || 0) + '</div>');
        row.append('<div id="pst_fail_'   + p.plcId + '" style="color:var(--err);">'     + (st.fail   || 0) + '</div>');
        row.append('<div id="pst_rate_'   + p.plcId + '" style="color:var(--accent);">'  + rate             + '</div>');
        row.append('<div id="pst_streak_' + p.plcId + '" style="color:var(--muted);">'   + (st.streak || 0) + '</div>');
        row.append('<div id="pst_ms_'     + p.plcId + '" style="color:var(--text);">'    + (st.lastMs || '-') + '</div>');
        body.append(row);
    });
}

/* ══ 주소 영역 헬퍼 ══ */
function isModbusType(t) { return t && t.toLowerCase().indexOf('modbus') >= 0; }
function isBitArea(addr) { return (addr>=1&&addr<=9999)||(addr>=10001&&addr<=19999)||(addr>=20001&&addr<=29999); }
function getModbusArea(addr) {
    if (addr>=1    &&addr<=9999)  return {label:'0x COIL', bit:true,  ro:false};
    if (addr>=10001&&addr<=19999) return {label:'1x COIL', bit:true,  ro:false};
    if (addr>=20001&&addr<=29999) return {label:'2x DI',   bit:true,  ro:true };
    if (addr>=30001&&addr<=39999) return {label:'3x INPUT',bit:false, ro:true };
    if (addr>=40001&&addr<=49999) return {label:'4x HOLD', bit:false, ro:false};
    return {label:'RAW', bit:false, ro:false};
}

function updateAddrInfo() {
    var s = parseInt($('#addrStart').val()) || 0;
    var e = parseInt($('#addrEnd').val())   || s;
    if (e < s) e = s;
    $('#addrCount').text(Math.min(e - s + 1, 20));
    var modPLC = selPlcs.find(function(p){ return isModbusType(p.plcType); });
    if (modPLC) {
        var a = getModbusArea(s);
        $('#addrAreaInfo').text(a.label + (a.bit ? ' (bit)' : ' (word)') + (a.ro ? ' ⚠ READ ONLY' : ''));
    } else {
        $('#addrAreaInfo').text('Word');
    }
}

/* ══ 값 목록 ══ */
function addValueRow(def) {
    var val = (def !== undefined) ? def : '';
    var row = $('<div class="value-row"></div>');
    row.append('<input type="number" class="val-input" placeholder="값" value="' + val + '">');
    row.append('<button class="btn-del-val" onclick="removeValueRow(this)">&#10005;</button>');
    $('#valueList').append(row);
    updateCycleDisplay();
}
function removeValueRow(btn) {
    if ($('#valueList .value-row').length <= 1) return;
    $(btn).closest('.value-row').remove();
    updateCycleDisplay();
}
function getValues() {
    var v = [];
    $('#valueList .val-input').each(function() { var s = $(this).val().trim(); if (s !== '') v.push(Number(s)); });
    return v;
}

/* ══ 순환 값 표시 ══ */
function updateCycleDisplay() {
    var vals = getValues();
    var d = $('#cycleDisplay').empty();
    if (!vals.length) { d.append('<span style="font-size:11px;color:var(--muted);">-</span>'); return; }
    vals.forEach(function(v, i) {
        d.append('<div class="cycle-pill' + (i === (valueIndex % vals.length) ? ' active' : '') + '" id="cpill_' + i + '">' + v + '</div>');
    });
}
function highlightPill(idx) {
    var vals = getValues();
    if (!vals.length) return;
    $('#cycleDisplay .cycle-pill').removeClass('active');
    $('#cpill_' + (idx % vals.length)).addClass('active');
}

/* ══ 인터벌 ══ */
function setIntervalMs(el) {
    $('#intervalGrid .int-btn').removeClass('active');
    $(el).addClass('active');
    intervalMs = parseInt($(el).data('ms'));
    if (running) { clearInterval(tickTimer); tickTimer = setInterval(doTick, intervalMs); }
}

/* ══ 시작 / 정지 ══ */
function startTest() {
    if (!selPlcs.length) { addLog('SYS', '', '', 'INFO', 'PLC를 1개 이상 추가하세요.'); return; }
    var start = parseInt($('#addrStart').val());
    var end   = parseInt($('#addrEnd').val());
    if (isNaN(start) || start < 1) { addLog('SYS', '', '', 'INFO', '시작 주소를 확인하세요.'); return; }
    if (isNaN(end) || end < start) end = start;
    if (!getValues().length) { addLog('SYS', '', '', 'INFO', '값을 입력하세요.'); return; }

    // Modbus 읽기전용 영역 차단
    for (var i = 0; i < selPlcs.length; i++) {
        if (isModbusType(selPlcs[i].plcType)) {
            var area = getModbusArea(start);
            if (area.ro) { addLog('SYS', '', '', 'INFO', '⚠ ' + area.label + ' 읽기 전용 - 쓰기 불가'); return; }
        }
    }

    running = true;
    valueIndex = 0;
    gStats = { total:0, ok:0, fail:0, tick:0 };
    selPlcs.forEach(function(p) {
        plcStats[p.plcId] = { total:0, ok:0, fail:0, streak:0, maxStreak:0, lastMs:'-', disc:false };
    });
    startTime = Date.now();
    $('#stopReason').text('');
    setStatus('running', 'RUNNING');
    $('#btnStart').prop('disabled', true);
    $('#btnStop').prop('disabled', false);
    renderPlcStatTable();

    var addrCnt = Math.min(end - start + 1, 20);
    addLog('SYS', '', '', 'INFO',
        '▶ 시작 | PLC ' + selPlcs.length + '대 | 범위:' + start + '~' + (start + addrCnt - 1) + ' | ' + intervalMs + 'ms');

    elTimer   = setInterval(updateElapsed, 1000);
    doTick();
    tickTimer = setInterval(doTick, intervalMs);
}

function stopTest(reason) {
    if (!running) return;
    running = false;
    clearInterval(tickTimer); clearInterval(elTimer);
    tickTimer = null; elTimer = null;
    var msg = reason || '수동 정지';
    addLog('SYS', '', '', 'INFO', '■ 정지 | ' + msg);
    setStatus('idle', 'STOPPED');
    $('#btnStart').prop('disabled', false);
    $('#btnStop').prop('disabled', true);
    $('#stopReason').text(msg);
    selPlcs.forEach(function(p) { refreshDot(p.plcId); });
}

/* ══ 메인 틱 ══ */
function doTick() {
    var start   = parseInt($('#addrStart').val());
    var end     = parseInt($('#addrEnd').val());
    if (isNaN(end) || end < start) end = start;
    var addrCnt = Math.min(end - start + 1, 20);

    var vals = getValues();
    if (!vals.length) return;

    var curVal = vals[valueIndex % vals.length];
    highlightPill(valueIndex);
    $('#curValDisplay').text(curVal);
    valueIndex++;
    gStats.tick++;
    $('#statTick').text(gStats.tick);

    var addrs = [];
    for (var i = 0; i < addrCnt; i++) addrs.push(start + i);

    // 모든 PLC에 병렬 쓰기 (각 PLC 내부는 순차)
    selPlcs.forEach(function(p) {
        var st = plcStats[p.plcId];
        if (!st || st.disc) return;  // 끊긴 PLC 스킵
        writeSequential(p, addrs, curVal, 0);
    });
}

/* ── PLC 한 대의 주소 목록을 순차 쓰기 ── */
function writeSequential(plc, addrs, val, idx) {
    if (idx >= addrs.length) return;
    var addr  = addrs[idx];
    var isBit = isModbusType(plc.plcType) && isBitArea(addr);
    var url   = ctx + (isBit ? '/plc/writeBit/' : '/plc/write/') + plc.plcId;
    var t0    = Date.now();

    $.ajax({
        url: url, type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ address: addr, value: val }),
        timeout: 5000,
        success: function(res) {
            var elapsed = Date.now() - t0;
            if (res && res.success === false) {
                onResult(plc, addr, val, isBit, false, elapsed, res.error || 'C# 오류');
            } else {
                onResult(plc, addr, val, isBit, true, elapsed, '');
            }
            writeSequential(plc, addrs, val, idx + 1);
        },
        error: function(xhr, status, err) {
            var msg = status + (err ? ' / ' + err : '') +
                (xhr.responseText ? ' → ' + xhr.responseText.substring(0, 60) : '');
            onResult(plc, addr, val, isBit, false, Date.now() - t0, msg);
            writeSequential(plc, addrs, val, idx + 1);  // 실패해도 다음 주소 계속
        }
    });
}

/* ── 결과 처리 ── */
function onResult(plc, addr, val, isBit, ok, ms, msg) {
    var st = plcStats[plc.plcId];
    if (!st) return;

    st.total++; gStats.total++;
    if (ok) {
        st.ok++; gStats.ok++;
        st.streak = 0;
        st.lastMs = ms;
    } else {
        st.fail++; gStats.fail++;
        st.streak++;
        if (st.streak > st.maxStreak) st.maxStreak = st.streak;
    }

    // 연속 실패 임계값 → 끊김 처리
    if (!st.disc && st.streak >= DISC_THRESHOLD) {
        st.disc = true;
        addLog(plc.label, addr, val, 'FAIL',
            '⚠ 통신 끊김 감지 (연속 실패 ' + st.streak + '회) - ' + plc.plcId);
        // 전체 PLC 끊김 시 자동 정지
        if (selPlcs.every(function(p){ return plcStats[p.plcId] && plcStats[p.plcId].disc; })) {
            stopTest('전체 PLC 통신 끊김');
        }
    }

    updatePlcRow(plc.plcId, st);
    updateGlobalStats();
    refreshDot(plc.plcId);

    // 로그: OK는 첫 번째 주소만 기록 (로그 과부하 방지), FAIL은 항상
    if (!ok || addr === parseInt($('#addrStart').val())) {
        addLog(plc.label, addr, val, ok ? 'OK' : 'FAIL', ok ? '(' + ms + 'ms)' : msg);
    }
}

/* ── PLC 행 데이터 업데이트 ── */
function updatePlcRow(id, st) {
    var rate = st.total > 0 ? ((st.ok / st.total) * 100).toFixed(1) + '%' : '-';
    var rateColor = parseFloat(rate) >= 99 ? 'var(--green)' : parseFloat(rate) >= 90 ? 'var(--warn)' : 'var(--err)';
    var streakColor = st.streak >= DISC_THRESHOLD ? 'var(--err)' : st.streak > 0 ? 'var(--warn)' : 'var(--muted)';
    $('#pst_total_'  + id).text(st.total);
    $('#pst_ok_'     + id).text(st.ok);
    $('#pst_fail_'   + id).text(st.fail);
    $('#pst_rate_'   + id).text(rate).css('color', rateColor);
    $('#pst_streak_' + id).text(st.streak).css('color', streakColor);
    $('#pst_ms_'     + id).text(st.lastMs !== '-' ? st.lastMs + 'ms' : '-');
}

function refreshDot(id) {
    var st = plcStats[id]; if (!st) return;
    var cls = st.disc ? 'disc' : (st.streak > 0 ? 'fail' : (st.ok > 0 ? 'ok' : ''));
    $('#dot_'  + id).removeClass('ok fail disc').addClass(cls);
    $('#pdot_' + id).removeClass('ok fail disc').addClass(cls);
}

function updateGlobalStats() {
    $('#statTotal').text(gStats.total);
    $('#statOk').text(gStats.ok);
    $('#statFail').text(gStats.fail);
    var rate    = gStats.total > 0 ? ((gStats.ok / gStats.total) * 100).toFixed(1) + '%' : '-';
    var rateNum = parseFloat(rate);
    $('#statRate').text(rate).css('color', rateNum >= 99 ? 'var(--green)' : rateNum >= 90 ? 'var(--warn)' : 'var(--err)');

    if (running) {
        var anyDisc    = selPlcs.some(function(p){ return plcStats[p.plcId] && plcStats[p.plcId].disc; });
        var anyStreak  = selPlcs.some(function(p){ return plcStats[p.plcId] && plcStats[p.plcId].streak > 0; });
        if (anyDisc)   setStatus('error',   'ERROR');
        else if (anyStreak) setStatus('warning', 'WARNING');
        else           setStatus('running', 'RUNNING');
    }
}

function setStatus(cls, text) {
    $('#statusBadge').removeClass('idle running warning error').addClass(cls).text(text);
}

function updateElapsed() {
    if (!startTime) return;
    var s = Math.floor((Date.now() - startTime) / 1000);
    $('#elapsedTime').text(pad2(Math.floor(s/3600)) + ':' + pad2(Math.floor((s%3600)/60)) + ':' + pad2(s%60));
}
function pad2(n) { return n < 10 ? '0' + n : '' + n; }

/* ══ 로그 ══ */
var logCount = 0, MAX_LOG = 600;
function addLog(plcLabel, addr, val, result, msg) {
    var now = new Date();
    var ts  = pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
    var body = $('#logBody');
    if (logCount >= MAX_LOG) { body.find('.log-row:last').remove(); } else { logCount++; }
    var rc  = result === 'OK' ? 'ok' : result === 'FAIL' ? 'fail' : 'info';
    var row = $('<div class="log-row"></div>')
        .append('<div class="log-ts">'  + ts + '</div>')
        .append('<div class="log-plc">' + escHtml(String(plcLabel || '').substring(0, 10)) + '</div>')
        .append('<div class="log-addr">' + (addr !== '' && addr !== undefined ? 'A:' + addr : '') + '</div>')
        .append('<div class="log-val">'  + (val  !== '' && val  !== undefined ? 'V:' + val  : '') + '</div>')
        .append('<div class="log-result ' + rc + '">' + result + '</div>')
        .append('<div class="log-msg">' + escHtml(String(msg)) + '</div>');
    body.prepend(row);
}
function clearLog() { $('#logBody').empty(); logCount = 0; addLog('SYS','','','INFO','로그 초기화'); }
function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

$(document).on('input', '.val-input', function() { updateCycleDisplay(); });
</script>
</body>
</html>