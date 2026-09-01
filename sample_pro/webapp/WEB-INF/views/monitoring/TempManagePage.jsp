<%@ page contentType="text/html; charset=UTF-8" %>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TEMP LOGGER</title>
    <link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">

<style>
/* ══════════════════════════════════════════
   TEMP LOGGER — Industrial Cyber Dark
   TEMP MONITOR 시리즈와 동일한 디자인 언어
══════════════════════════════════════════ */
:root {
  --bg:            #060810;
  --bg-panel:      #0b0e1a;
  --bg-deep:       #080b15;
  --bg-hover:      #111830;
  --bg-input:      #07091400;

  --cyan:          #00f0ff;
  --cyan-dim:      rgba(0,240,255,.07);
  --cyan-border:   rgba(0,240,255,.18);
  --cyan-glow:     0 0 18px rgba(0,240,255,.45);

  --green:         #00ff88;
  --green-glow:    0 0 14px rgba(0,255,136,.5);
  --green-border:  rgba(0,255,136,.3);

  --amber:         #ffb700;
  --amber-border:  rgba(255,183,0,.3);

  --red:           #ff3b5c;
  --red-border:    rgba(255,59,92,.35);
  --red-glow:      0 0 14px rgba(255,59,92,.5);

  --purple:        #b06cff;

  --text-p:        #d8edf8;
  --text-s:        #4a6a88;
  --text-dim:      #1a2e45;

  --font-mono:     '맑은 고딕', 'Malgun Gothic', sans-serif;
  --font-hud:      '맑은 고딕', 'Malgun Gothic', sans-serif;
  --font-ui:       '맑은 고딕', 'Malgun Gothic', sans-serif;

  --radius:        5px;
  --tr-h:          32px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }

body {
  background: var(--bg);
  color: var(--text-p);
  font-family: var(--font-ui);
  font-size: 13px;
  height: 100%;
  display: flex; flex-direction: column;
  background-image:
    radial-gradient(ellipse at 10% 80%, rgba(0,240,255,.035) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 10%, rgba(176,108,255,.03) 0%, transparent 50%),
    linear-gradient(rgba(0,240,255,.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,.022) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
}

/* scanline */
body::after {
  content: ''; pointer-events: none;
  position: fixed; inset: 0; z-index: 9999;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 3px,
    rgba(0,0,0,.055) 3px, rgba(0,0,0,.055) 4px
  );
}

/* ══ HEADER ══ */
.page-header {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 14px;
  padding: 0 22px;
  height: 56px;
  border-bottom: 1px solid var(--cyan-border);
  background: linear-gradient(180deg, rgba(0,240,255,.04) 0%, transparent 100%);
  position: relative;
}
.page-header::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--cyan), var(--purple), transparent);
  opacity: .5;
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
  font-size: 10px; color: var(--text-s);
  letter-spacing: 1px; margin-top: 3px;
}

.active-badge {
  display: flex; align-items: center; gap: 7px;
  background: rgba(0,255,136,.06);
  border: 1px solid var(--green-border);
  border-radius: 4px; padding: 4px 12px;
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 2px; color: var(--green);
  text-shadow: var(--green-glow);
}
.active-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--green); box-shadow: var(--green-glow);
  animation: pulse-live 1.4s ease-in-out infinite;
}
@keyframes pulse-live {
  0%,100% { opacity:1; box-shadow: 0 0 8px var(--green), 0 0 20px var(--green); }
  50%      { opacity:.3; box-shadow: none; }
}

.header-clock {
  margin-left: auto;
  font-family: var(--font-mono); font-size: 15px;
  color: var(--cyan); text-shadow: var(--cyan-glow);
  letter-spacing: 3px;
}

/* ══ WORKSPACE ══ */
.workspace {
  flex: 1; min-height: 0;
  display: flex; overflow: hidden;
}

/* ══ LEFT PANEL ══ */
.panel-left {
  width: 220px; flex-shrink: 0;
  display: flex; flex-direction: column;
  border-right: 1px solid var(--cyan-border);
  background: var(--bg-panel);
}

.panel-title {
  font-family: var(--font-hud);
  font-size: 10px; letter-spacing: 4px;
  color: var(--cyan); text-shadow: var(--cyan-glow);
  padding: 11px 14px 10px;
  border-bottom: 1px solid var(--cyan-border);
  background: var(--bg-deep);
  display: flex; align-items: center; gap: 7px;
}
.panel-title::before {
  content: '▶'; font-size: 8px;
  animation: blink-arrow .9s step-end infinite;
}
@keyframes blink-arrow { 0%,100%{opacity:1} 50%{opacity:0} }

.left-tools {
  padding: 9px 10px;
  display: flex; flex-direction: column; gap: 7px;
  border-bottom: 1px solid var(--cyan-border);
}
.left-search {
  width: 100%; height: 28px;
  background: var(--bg-deep); border: 1px solid var(--cyan-border);
  color: var(--cyan); font-family: var(--font-mono);
  font-size: 11px; padding: 0 9px; outline: none; border-radius: 3px;
  transition: border-color .2s, box-shadow .2s;
}
.left-search::placeholder { color: var(--text-s); }
.left-search:focus { border-color: var(--cyan); box-shadow: 0 0 8px rgba(0,240,255,.25); }

.left-btns { display: flex; gap: 5px; }

.folder-list {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 6px 8px;
}
.folder-list::-webkit-scrollbar { width: 3px; }
.folder-list::-webkit-scrollbar-thumb { background: var(--cyan-border); border-radius: 2px; }

.folder-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 9px; margin-bottom: 3px;
  border: 1px solid transparent; border-radius: 4px;
  cursor: pointer; transition: all .15s;
}
.folder-item:hover { background: var(--bg-hover); border-color: var(--cyan-border); }
.folder-item.active {
  background: rgba(0,240,255,.07);
  border-color: rgba(0,240,255,.35);
  box-shadow: inset 2px 0 0 var(--cyan);
}
.folder-name { font-size: 12px; font-weight: 500; color: var(--text-p); }
.folder-item.active .folder-name { color: var(--cyan); }
.folder-id {
  font-family: var(--font-mono); font-size: 9px;
  color: var(--text-s); background: var(--bg-deep);
  padding: 1px 5px; border-radius: 2px;
}
.folder-empty {
  padding: 28px 10px; text-align: center;
  font-family: var(--font-mono); font-size: 11px;
  color: var(--text-dim); letter-spacing: 2px;
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
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 9px 16px;
  border-bottom: 1px solid var(--cyan-border);
  background: var(--bg-deep);
}
.tb-section { display: flex; align-items: center; gap: 7px; }
.tb-label {
  font-family: var(--font-mono); font-size: 9px;
  letter-spacing: 2px; text-transform: uppercase;
}
.tb-label.yellow { color: var(--amber); }
.tb-spacer { flex: 1; }

/* ══ BUTTONS ══ */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 26px; padding: 0 11px;
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 2px;
  border-radius: 3px; border: 1px solid; cursor: pointer;
  transition: all .15s; text-transform: uppercase; background: transparent;
  gap: 5px;
}
.btn-cyan   { color: var(--cyan);  border-color: rgba(0,240,255,.35); }
.btn-cyan:hover   { background: var(--cyan-dim); box-shadow: var(--cyan-glow); }
.btn-green  { color: var(--green); border-color: var(--green-border); }
.btn-green:hover  { background: rgba(0,255,136,.08); box-shadow: var(--green-glow); }
.btn-red    { color: var(--red);   border-color: var(--red-border); }
.btn-red:hover    { background: rgba(255,59,92,.1); box-shadow: var(--red-glow); }
.btn-yellow { color: var(--amber); border-color: var(--amber-border); }
.btn-yellow:hover { background: rgba(255,183,0,.08); }
.btn-purple { color: var(--purple); border-color: rgba(176,108,255,.35); }
.btn-purple:hover { background: rgba(176,108,255,.08); }

/* ══ BODY AREA ══ */
.body-area {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  overflow: hidden;
  padding: 12px 16px;
  gap: 12px;
}

/* ══ FORM BOX ══ */
.form-card {
  flex-shrink: 0;
  background: var(--bg-panel);
  border: 1px solid var(--cyan-border);
  border-radius: var(--radius);
  overflow: hidden;
}
.form-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 14px;
  background: var(--bg-deep);
  border-bottom: 1px solid var(--cyan-border);
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 3px; color: var(--cyan);
}
.form-card-head span { color: var(--text-s); font-size: 9px; }
.form-card-body {
  display: flex; flex-wrap: wrap; gap: 0;
  padding: 10px 14px 12px;
}

.form-field {
  display: flex; flex-direction: column; gap: 4px;
  min-width: 160px; flex: 1; padding: 0 8px 8px 0;
}
.form-label {
  font-family: var(--font-mono); font-size: 9px;
  letter-spacing: 2px; color: var(--text-s); text-transform: uppercase;
}
.inp, .sel {
  height: 30px;
  background: var(--bg-deep);
  border: 1px solid var(--cyan-border);
  color: var(--text-p);
  font-family: var(--font-mono); font-size: 12px;
  padding: 0 9px; outline: none; border-radius: 3px;
  transition: border-color .2s, box-shadow .2s;
  width: 100%;
}
.inp::placeholder { color: var(--text-s); }
.inp:focus, .sel:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 8px rgba(0,240,255,.2);
  color: var(--cyan);
}
.sel { cursor: pointer; }
.sel option { background: #0b0e1a; }

/* id badge inside form */
.id-badge {
  font-family: var(--font-mono); font-size: 11px;
  color: var(--purple); background: rgba(176,108,255,.1);
  border: 1px solid rgba(176,108,255,.3);
  padding: 2px 9px; border-radius: 3px;
}

/* ══ TABLE PANELS ══ */
.table-panel {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  background: var(--bg-panel);
  border: 1px solid var(--cyan-border);
  border-radius: var(--radius);
  overflow: hidden;
}
.table-panel-head {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 14px;
  background: var(--bg-deep);
  border-bottom: 1px solid var(--cyan-border);
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 3px; color: var(--cyan);
}
.table-panel-head .badge {
  font-size: 10px; color: var(--text-s);
  background: var(--bg); border: 1px solid var(--cyan-border);
  padding: 1px 8px; border-radius: 8px; font-family: var(--font-mono);
}
.table-scroll {
  flex: 1; min-height: 0; overflow: auto;
}
.table-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
.table-scroll::-webkit-scrollbar-track { background: transparent; }
.table-scroll::-webkit-scrollbar-thumb { background: var(--cyan-border); border-radius: 2px; }

table {
  width: 100%; border-collapse: collapse;
  font-family: var(--font-mono); font-size: 11px;
}
table thead th {
  position: sticky; top: 0; z-index: 2;
  background: #0a0d1a;
  color: var(--text-s); font-size: 10px;
  letter-spacing: 1.5px; text-transform: uppercase;
  padding: 7px 10px; text-align: left;
  border-bottom: 1px solid rgba(0,240,255,.2);
  white-space: nowrap;
}
table tbody tr {
  border-bottom: 1px solid rgba(0,240,255,.05);
  transition: background .12s;
  cursor: pointer;
}
table tbody tr:hover { background: rgba(0,240,255,.05); }
table tbody tr.selected {
  background: rgba(0,240,255,.09);
  box-shadow: inset 2px 0 0 var(--cyan);
}
table tbody td {
  padding: 7px 10px; color: var(--text-p);
  white-space: nowrap;
}
table tbody td:first-child {
  font-family: var(--font-mono); color: var(--text-s);
}
.empty-row td {
  text-align: center; padding: 24px;
  color: var(--text-dim); font-family: var(--font-mono);
  letter-spacing: 2px;
}

/* enabled toggle */
.toggle-wrap {
  display: flex; align-items: center;
}
.toggle {
  appearance: none; -webkit-appearance: none;
  width: 34px; height: 18px; border-radius: 9px;
  background: #1a2e45; border: 1px solid #2a4060;
  cursor: pointer; position: relative; transition: all .2s;
}
.toggle:checked { background: rgba(0,255,136,.3); border-color: var(--green); }
.toggle::after {
  content: ''; position: absolute;
  top: 2px; left: 2px; width: 12px; height: 12px;
  border-radius: 50%; background: #4a6a88; transition: all .2s;
}
.toggle:checked::after { left: 18px; background: var(--green); box-shadow: var(--green-glow); }

/* tag name in table — colored dot */
.tag-cell { display: flex; align-items: center; gap: 7px; }
.tag-dot-sm {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}

/* history value cells */
.val-cell { color: var(--amber); font-family: var(--font-mono); }
.val-cell.null-val { color: var(--text-dim); }

/* two-section body split */
.tables-row {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column; gap: 12px;
}

/* notification toast */
#toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9998;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px;
  padding: 10px 18px; border-radius: 4px;
  background: var(--bg-deep); border: 1px solid var(--cyan-border);
  color: var(--cyan); box-shadow: var(--cyan-glow);
  opacity: 0; transform: translateY(10px);
  transition: opacity .25s, transform .25s;
  pointer-events: none;
}
#toast.show { opacity: 1; transform: translateY(0); }
#toast.err  { border-color: var(--red-border); color: var(--red); box-shadow: var(--red-glow); }

/* ══ BULK ADD MODAL ══ */
.modal-overlay {
  display: none;
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(2,4,10,.75);
  align-items: center; justify-content: center;
}
.modal-overlay.show { display: flex; }
.modal-box {
  width: min(1400px, 96vw); height: min(820px, 92vh);
  display: flex; flex-direction: column;
  background: var(--bg-panel);
  border: 1px solid var(--cyan-border);
  border-radius: var(--radius);
  box-shadow: 0 0 40px rgba(0,240,255,.15);
  overflow: hidden;
}
.modal-head {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px;
  background: var(--bg-deep);
  border-bottom: 1px solid var(--cyan-border);
}
.modal-title { font-size: 16px; font-weight: 700; color: var(--cyan); text-shadow: var(--cyan-glow); }
.modal-hint  { font-size: 11px; color: var(--text-s); }
.modal-close {
  margin-left: auto; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--red-border); border-radius: 4px;
  color: var(--red); cursor: pointer; background: transparent; font-size: 14px;
}
.modal-close:hover { background: rgba(255,59,92,.1); }
.modal-body {
  flex: 1; min-height: 0; overflow: auto; padding: 12px 18px;
}
.modal-foot {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 18px;
  border-top: 1px solid var(--cyan-border);
  background: var(--bg-deep);
}
.modal-foot .tb-spacer { flex: 1; }

table.bulk-table { width: 100%; border-collapse: collapse; font-size: 13px; }
table.bulk-table th {
  position: sticky; top: 0; z-index: 2;
  background: #0a0d1a; color: var(--text-s);
  font-size: 11px; font-weight: 500;
  padding: 6px 6px; text-align: left; white-space: nowrap;
  border-bottom: 1px solid rgba(0,240,255,.2);
}
table.bulk-table td { padding: 4px 5px; }
table.bulk-table .inp, table.bulk-table .sel { height: 28px; font-size: 12px; padding: 0 6px; }
table.bulk-table tr:hover td { background: rgba(0,240,255,.03); }
.bulk-row-btn {
  width: 26px; height: 26px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 3px; border: 1px solid; cursor: pointer; background: transparent;
  font-size: 13px;
}
.bulk-copy { color: var(--cyan); border-color: var(--cyan-border); }
.bulk-copy:hover { background: var(--cyan-dim); }
.bulk-del  { color: var(--red); border-color: var(--red-border); }
.bulk-del:hover { background: rgba(255,59,92,.1); }
.bulk-actions { display: flex; gap: 4px; }
</style>
</head>
<body class="theme-temp">

<!-- ══ HEADER ══ -->
<div class="page-header">
  <div>
    <div class="page-title">⚡ TEMP MANAGE</div>
    <div class="page-sub">// Register temp tags · auto-snapshot every minute</div>
  </div>
  <div class="active-badge"><div class="active-dot"></div>ACTIVE</div>
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
        <button class="btn btn-cyan"   style="flex:1" onclick="loadTags()">↺ TAGS</button>
        <button class="btn btn-yellow" style="flex:1" onclick="loadHistory()">↺ LOG</button>
      </div>
    </div>
    <div id="tagList" class="folder-list">
      <div class="folder-empty">Loading...</div>
    </div>
  </aside>

  <!-- ══ RIGHT ══ -->
  <section class="panel-right">

    <!-- toolbar -->
    <div class="toolbar">
      <div class="tb-section">
        <span class="tb-label yellow">TAG</span>
        <button class="btn btn-green"  onclick="addTag()">＋ ADD</button>
        <button class="btn btn-purple" onclick="openBulkModal()">☰ LIST ADD</button>
        <button class="btn btn-cyan"   onclick="updateTag()">✎ EDIT</button>
        <button class="btn btn-red"    onclick="deleteTag()">✕ DEL</button>
        <button class="btn btn-purple" onclick="clearForm()">⊘ CLEAR</button>
      </div>
      <div class="tb-spacer"></div>
      <button class="btn btn-cyan"   onclick="loadTags()">↺ REFRESH</button>
      <button class="btn btn-yellow" onclick="loadHistory()">↺ LOG</button>
    </div>

    <div class="body-area">

      <!-- ── FORM CARD ── -->
      <div class="form-card">
        <div class="form-card-head">
          TAG EDITOR
          <span id="editMode">— NEW —</span>
        </div>
        <div class="form-card-body">
          <input type="hidden" id="tempId">
          <div class="form-field">
            <span class="form-label">Tag Name</span>
            <input class="inp" type="text" id="tagName" placeholder="e.g. OVEN_TEMP_1">
          </div>
          <div class="form-field">
            <span class="form-label">Address</span>
            <input class="inp" type="text" id="address" placeholder="D12000">
          </div>
          <div class="form-field">
            <span class="form-label">PLC</span>
            <select class="sel" id="plcSelect"></select>
          </div>
          <div class="form-field" style="max-width:120px;">
            <span class="form-label">설비 (Equip)</span>
            <select class="sel" id="equipId">
              <option value="">-- 미지정 --</option>
              <option value="BCF1">BCF1</option>
              <option value="BCF2">BCF2</option>
              <option value="BCF3">BCF3</option>
              <option value="BCF4">BCF4</option>
              <option value="BCF5">BCF5</option>
              <option value="BCF6">BCF6</option>
              <option value="BCF7">BCF7</option>
              <option value="BCF8">BCF8</option>
              <option value="BCF9">BCF9</option>
              <option value="BCF10">BCF10</option>
              <option value="BCF11">BCF11</option>
              <option value="BCF12">BCF12</option>
            </select>
          </div>
          <div class="form-field" style="max-width:100px;">
            <span class="form-label">Enabled</span>
            <select class="sel" id="enabled">
              <option value="1">ON</option>
              <option value="0">OFF</option>
            </select>
          </div>
          <div class="form-field">
            <span class="form-label">컬럼명 (Col Name)</span>
            <input class="inp" type="text" id="colName" placeholder="비워두면 태그명에서 자동 생성">
          </div>
          <div class="form-field">
            <span class="form-label">트랜드명 (Trend Name)</span>
            <input class="inp" type="text" id="trendName" placeholder="그래프에 표시할 이름">
          </div>
          <div class="form-field">
            <span class="form-label">스케일 (Scale)</span>
            <input class="inp" type="text" id="scale" placeholder="예: +50, -100, *0.01, /2  (비우면 보정 없음)">
          </div>
        </div>
      </div>

      <!-- ── TABLES ── -->
      <div class="tables-row">

        <!-- tag table -->
        <div class="table-panel" style="flex:0 0 auto; max-height:220px;">
          <div class="table-panel-head">
            TAG LIST
            <span class="badge" id="tagCount">0</span>
          </div>
          <div class="table-scroll">
            <table id="tagTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Address</th>
                  <th>PLC</th>
                  <th>설비</th>
                  <th>Enabled</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

        <!-- history table -->
        <div class="table-panel" style="flex:1;">
          <div class="table-panel-head">
            SNAPSHOT LOG
            <span class="badge" id="logCount">0</span>
          </div>
          <div class="table-scroll">
            <table id="historyTable">
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

      </div><!-- /tables-row -->

    </div><!-- /body-area -->
  </section>
</div>

<!-- ══ BULK ADD MODAL ══ -->
<div class="modal-overlay" id="bulkModal">
  <div class="modal-box">
    <div class="modal-head">
      <div class="modal-title">태그 일괄 등록 (LIST ADD)</div>
      <div class="modal-hint">— 행 오른쪽 ⧉ 버튼으로 복사하면 주소·태그명 숫자가 자동으로 +1 됩니다</div>
      <div class="modal-close" onclick="closeBulkModal()">✕</div>
    </div>
    <div class="modal-body">
      <table class="bulk-table">
        <thead>
          <tr>
            <th style="width:36px;">#</th>
            <th style="min-width:150px;">태그명 (Tag Name)</th>
            <th style="min-width:100px;">주소 (Address)</th>
            <th style="min-width:150px;">PLC</th>
            <th style="min-width:90px;">설비</th>
            <th style="min-width:140px;">컬럼명 (Col Name)</th>
            <th style="min-width:140px;">트랜드명 (Trend Name)</th>
            <th style="min-width:110px;">스케일</th>
            <th style="width:70px;">사용</th>
            <th style="width:70px;">동작</th>
          </tr>
        </thead>
        <tbody id="bulkTbody"></tbody>
      </table>
    </div>
    <div class="modal-foot">
      <button class="btn btn-cyan" onclick="addBulkRow()">＋ 행 추가</button>
      <span class="tb-spacer"></span>
      <span class="modal-hint" id="bulkStatus"></span>
      <button class="btn btn-purple" onclick="closeBulkModal()">취소</button>
      <button class="btn btn-green" onclick="saveBulkRows()">전체 저장</button>
    </div>
  </div>
</div>

<!-- toast -->
<div id="toast"></div>

<script>
const base = '<%=ctx%>';
let currentCols = [];
let plcList = [];

const PALETTE = [
  '#00f0ff','#ff6b00','#00ff88','#ffb700',
  '#b06cff','#ff3b5c','#00cfbd','#ffd166',
  '#06d6a0','#ef476f','#118ab2','#ffc8dd'
];

/* ── 시계 ── */
setInterval(function(){
  const n = new Date(), p = v => String(v).padStart(2,'0');
  document.getElementById('headerClock').textContent =
    p(n.getHours()) + ':' + p(n.getMinutes()) + ':' + p(n.getSeconds());
}, 1000);

/* ── toast ── */
function toast(msg, isErr) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (isErr ? ' err' : '');
  clearTimeout(el._tid);
  el._tid = setTimeout(() => el.className = '', 2500);
}

/* ── fetch helper ── */
function jsonFetch(url, options) {
  return fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, options))
    .then(r => r.json());
}

/* ── PLC 목록 ── */
function loadPlcs() {
  fetch(base + '/alarm/plc/list')
    .then(r => r.json())
    .then(list => {
      plcList = list || [];
      const sel = document.getElementById('plcSelect');
      sel.innerHTML = '';
      plcList.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.plcId;
        opt.textContent = p.plcId + ' (' + p.ip + ':' + p.port + ')';
        sel.appendChild(opt);
      });
    });
}

/* ── 태그 목록 ── */
function loadTags() {
  fetch(base + '/temp/tag/list')
    .then(r => r.json())
    .then(list => {
      renderTags(list);
      renderTagList(list);
    });
}

function renderTags(list) {
  const tbody = document.querySelector('#tagTable tbody');
  document.getElementById('tagCount').textContent = (list || []).length;
  tbody.innerHTML = '';
  if (!list || !list.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">[ NO TAGS ]</td></tr>';
    return;
  }
  list.forEach((t, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + t.tempId + '</td>' +
      '<td><div class="tag-cell"><div class="tag-dot-sm" style="background:' + color + ';box-shadow:0 0 5px ' + color + ';"></div>' + esc(t.tagName) + '</div></td>' +
      '<td style="color:var(--text-s)">' + esc(t.address) + '</td>' +
      '<td style="color:var(--purple)">' + esc(t.plcId) + '</td>' +
      '<td style="color:var(--amber)">' + esc(t.equipId || '—') + '</td>' +
      '<td><div class="toggle-wrap"><input type="checkbox" class="toggle" ' + (t.enabled===1?'checked':'') + ' onclick="toggleUse(event,' + t.tempId + ')"></div></td>';
    tr.onclick = function(e) {
      if (e.target.classList.contains('toggle')) return;
      document.querySelectorAll('#tagTable tbody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
      fillForm(t);
    };
    tbody.appendChild(tr);
  });
}

function renderTagList(list) {
  const wrap = document.getElementById('tagList');
  if (!list || !list.length) {
    wrap.innerHTML = '<div class="folder-empty">[ EMPTY ]</div>';
    return;
  }
  const current = document.getElementById('tempId').value;
  let html = '';
  list.forEach((t, idx) => {
    const active = (String(t.tempId) === String(current)) ? ' active' : '';
    const color  = PALETTE[idx % PALETTE.length];
    html +=
      '<div class="folder-item' + active + '" data-id="' + t.tempId + '" onclick="selectTag(' + t.tempId + ')">' +
        '<div style="display:flex;align-items:center;gap:7px;">' +
          '<div style="width:6px;height:6px;border-radius:50%;background:' + color + ';flex-shrink:0;box-shadow:0 0 5px ' + color + '"></div>' +
          '<div class="folder-name">' + esc(t.tagName || '') + '</div>' +
        '</div>' +
        '<div class="folder-id">#' + t.tempId + '</div>' +
      '</div>';
  });
  wrap.innerHTML = html;
}

function selectTag(tempId) {
  document.querySelectorAll('#tagTable tbody tr').forEach(r => {
    const id = r.firstElementChild?.textContent;
    if (id === String(tempId)) r.click();
  });
  document.querySelectorAll('#tagList .folder-item').forEach(it =>
    it.classList.toggle('active', it.getAttribute('data-id') === String(tempId))
  );
  loadHistory();
}

/* ── 폼 ── */
function fillForm(t) {
  document.getElementById('tempId').value = t.tempId;
  document.getElementById('tagName').value = t.tagName || '';
  document.getElementById('address').value = t.address || '';
  document.getElementById('plcSelect').value = t.plcId || '';
  document.getElementById('equipId').value = t.equipId || '';
  document.getElementById('enabled').value = t.enabled || 1;
  document.getElementById('colName').value = t.colName || '';
  document.getElementById('trendName').value = t.trendName || '';
  document.getElementById('scale').value = t.scale || '';
  document.getElementById('editMode').textContent = '— EDITING  #' + t.tempId + ' —';
}

function clearForm() {
  document.getElementById('tempId').value = '';
  document.getElementById('tagName').value = '';
  document.getElementById('address').value = '';
  document.getElementById('equipId').value = '';
  document.getElementById('enabled').value = 1;
  document.getElementById('colName').value = '';
  document.getElementById('trendName').value = '';
  document.getElementById('scale').value = '';
  document.getElementById('editMode').textContent = '— NEW —';
  document.querySelectorAll('#tagTable tbody tr').forEach(r => r.classList.remove('selected'));
}

/* ── CRUD ── */
function addTag() {
  const tag = {
    tagName: document.getElementById('tagName').value.trim(),
    address: document.getElementById('address').value.trim(),
    plcId: document.getElementById('plcSelect').value,
    equipId: document.getElementById('equipId').value || null,
    enabled: parseInt(document.getElementById('enabled').value),
    colName: document.getElementById('colName').value.trim() || null,
    trendName: document.getElementById('trendName').value.trim() || null,
    scale: document.getElementById('scale').value.trim() || null
  };
  if (!tag.tagName) { toast('Tag Name required', true); return; }
  jsonFetch(base + '/temp/tag/insert', { method: 'POST', body: JSON.stringify(tag) })
    .then(res => {
      if (res.success === false) { toast(res.error, true); return; }
      toast('Tag added'); loadTags(); clearForm();
    });
}

function updateTag() {
  const tempId = parseInt(document.getElementById('tempId').value || '0');
  if (!tempId) { toast('Select a tag to edit', true); return; }
  const tag = {
    tempId,
    tagName: document.getElementById('tagName').value.trim(),
    address: document.getElementById('address').value.trim(),
    plcId: document.getElementById('plcSelect').value,
    equipId: document.getElementById('equipId').value || null,
    enabled: parseInt(document.getElementById('enabled').value),
    colName: document.getElementById('colName').value.trim() || null,
    trendName: document.getElementById('trendName').value.trim() || null,
    scale: document.getElementById('scale').value.trim() || null
  };
  jsonFetch(base + '/temp/tag/update', { method: 'POST', body: JSON.stringify(tag) })
    .then(res => {
      if (res.success === false) { toast(res.error, true); return; }
      toast('Tag updated'); loadTags(); clearForm();
    });
}

function deleteTag() {
  const tempId = parseInt(document.getElementById('tempId').value || '0');
  if (!tempId) { toast('Select a tag to delete', true); return; }
  if (!confirm('Delete temp tag #' + tempId + '?')) return;
  jsonFetch(base + '/temp/tag/delete', { method: 'POST', body: JSON.stringify({ tempId }) })
    .then(res => {
      if (res.success === false) { toast(res.error, true); return; }
      toast('Tag deleted'); loadTags(); clearForm();
    });
}

/* ── 히스토리 ── */
function loadHistory() {
  fetch(base + '/temp/cols')
    .then(r => r.json())
    .then(cols => {
      currentCols = (cols || []).map(c => ({ tagName: c.tagName, colName: c.colName }));
      return fetch(base + '/temp/snapshot/list?limit=200');
    })
    .then(r => r.json())
    .then(list => renderHistory(list));
}

function renderHistory(list) {
  const thead = document.querySelector('#historyTable thead');
  const tbody = document.querySelector('#historyTable tbody');
  const cols  = currentCols || [];

  document.getElementById('logCount').textContent = (list || []).length;

  /* 헤더 */
  let hdr = '<tr><th style="min-width:140px;">Time</th>';
  cols.forEach((c, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    hdr += '<th><div style="display:flex;align-items:center;gap:5px;">' +
           '<div style="width:6px;height:6px;border-radius:50%;background:' + color + ';box-shadow:0 0 4px ' + color + '"></div>' +
           esc(c.tagName || c.colName) + '</div></th>';
  });
  hdr += '</tr>';
  thead.innerHTML = hdr;

  if (!list || !list.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="' + (1 + cols.length) + '">[ NO RECORDS ]</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  list.forEach(row => {
    const tr  = document.createElement('tr');
    let html  = '<td style="color:var(--text-s)">' + (row.record_time || row.recordTime || '') + '</td>';
    cols.forEach(c => {
      const val = row[c.colName];
      const cls = (val != null) ? 'val-cell' : 'val-cell null-val';
      html += '<td class="' + cls + '">' + (val != null ? val : '—') + '</td>';
    });
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

/* ── toggle enabled ── */
function toggleUse(e, tempId) {
  e.stopPropagation();
  const checked = e.target.checked ? 1 : 0;
  fetch(base + '/temp/tag/list')
    .then(r => r.json())
    .then(list => {
      const t = (list || []).find(x => x.tempId === tempId);
      if (!t) return;
      return jsonFetch(base + '/temp/tag/update', {
        method: 'POST',
        body: JSON.stringify({ tempId: t.tempId, tagName: t.tagName, address: t.address, plcId: t.plcId, colName: t.colName, trendName: t.trendName || null, equipId: t.equipId || null, scale: t.scale || null, enabled: checked })
      });
    })
    .then(res => {
      if (res && res.success === false) { toast(res.error, true); return; }
      toast(checked ? 'Tag enabled' : 'Tag disabled');
      loadTags(); loadHistory();
    });
}

function filterTagList() {
  const q = (document.getElementById('tagSearch').value || '').toLowerCase();
  document.querySelectorAll('#tagList .folder-item').forEach(it => {
    const name = (it.querySelector('.folder-name')?.textContent || '').toLowerCase();
    it.style.display = name.includes(q) ? '' : 'none';
  });
}

/* ══ 일괄 등록(LIST ADD) 모달 ══════════════════════════════════ */
let bulkRowSeq = 0;

function bulkRowHtml(rid) {
  const plcOptions = plcList.map(p =>
    '<option value="' + p.plcId + '">' + esc(p.plcId) + ' (' + esc(p.ip) + ':' + p.port + ')</option>'
  ).join('');
  const equipOptions = ['', 'BCF1','BCF2','BCF3','BCF4','BCF5','BCF6','BCF7','BCF8','BCF9','BCF10','BCF11','BCF12']
    .map(e => '<option value="' + e + '">' + (e || '-- 미지정 --') + '</option>').join('');

  return '<tr data-rid="' + rid + '">' +
    '<td style="color:var(--text-s)">' + rid + '</td>' +
    '<td><input class="inp bf-tagName" type="text" placeholder="OVEN_TEMP_1"></td>' +
    '<td><input class="inp bf-address" type="text" placeholder="D12000"></td>' +
    '<td><select class="sel bf-plcId">' + plcOptions + '</select></td>' +
    '<td><select class="sel bf-equipId">' + equipOptions + '</select></td>' +
    '<td><input class="inp bf-colName" type="text" placeholder="자동생성"></td>' +
    '<td><input class="inp bf-trendName" type="text"></td>' +
    '<td><input class="inp bf-scale" type="text" placeholder="+50 -100 *0.01 /2"></td>' +
    '<td><select class="sel bf-enabled"><option value="1">ON</option><option value="0">OFF</option></select></td>' +
    '<td class="bulk-actions">' +
      '<button class="bulk-row-btn bulk-copy" title="복사 (주소·태그명 +1)" onclick="duplicateBulkRow(this)">⧉</button>' +
      '<button class="bulk-row-btn bulk-del" title="삭제" onclick="removeBulkRow(this)">✕</button>' +
    '</td>' +
  '</tr>';
}

function openBulkModal() {
  document.getElementById('bulkTbody').innerHTML = '';
  document.getElementById('bulkStatus').textContent = '';
  bulkRowSeq = 0;
  addBulkRow();
  document.getElementById('bulkModal').classList.add('show');
}

function closeBulkModal() {
  document.getElementById('bulkModal').classList.remove('show');
}

function addBulkRow() {
  bulkRowSeq++;
  document.getElementById('bulkTbody').insertAdjacentHTML('beforeend', bulkRowHtml(bulkRowSeq));
}

function removeBulkRow(btn) {
  const tr = btn.closest('tr');
  if (tr) tr.remove();
}

/* 문자열 맨 끝의 숫자 덩어리를 찾아 +1 (자릿수 유지, 예: "OVEN_01" → "OVEN_02", "D100" → "D101") */
function incrementTrailingNumber(str) {
  const s = String(str || '');
  const m = s.match(/(\d+)(\D*)$/);
  if (!m) return s;
  const numStr = m[1];
  let incremented = String(parseInt(numStr, 10) + 1);
  if (incremented.length < numStr.length) incremented = incremented.padStart(numStr.length, '0');
  return s.slice(0, m.index) + incremented + m[2];
}

function duplicateBulkRow(btn) {
  const tr = btn.closest('tr');
  if (!tr) return;
  const get = cls => tr.querySelector('.' + cls).value;

  bulkRowSeq++;
  document.getElementById('bulkTbody').insertAdjacentHTML('beforeend', bulkRowHtml(bulkRowSeq));
  const newTr = document.querySelector('#bulkTbody tr:last-child');
  const set = (cls, val) => { const el = newTr.querySelector('.' + cls); if (el) el.value = val; };

  set('bf-tagName', incrementTrailingNumber(get('bf-tagName')));
  set('bf-address', incrementTrailingNumber(get('bf-address')));
  set('bf-plcId', get('bf-plcId'));
  set('bf-equipId', get('bf-equipId'));
  // 컬럼명은 비워서 새 태그명 기준으로 자동 생성되게 둔다 (그대로 복사하면 원본과 충돌해 _2가 붙어 헷갈림)
  set('bf-trendName', get('bf-trendName'));
  set('bf-scale', get('bf-scale'));
  set('bf-enabled', get('bf-enabled'));
}

function saveBulkRows() {
  const rows = document.querySelectorAll('#bulkTbody tr');
  const tasks = [];
  rows.forEach(tr => {
    const tagName = tr.querySelector('.bf-tagName').value.trim();
    const address = tr.querySelector('.bf-address').value.trim();
    if (!tagName || !address) return;   // 빈 행은 건너뜀
    tasks.push({
      tagName, address,
      plcId: tr.querySelector('.bf-plcId').value,
      equipId: tr.querySelector('.bf-equipId').value || null,
      colName: tr.querySelector('.bf-colName').value.trim() || null,
      trendName: tr.querySelector('.bf-trendName').value.trim() || null,
      scale: tr.querySelector('.bf-scale').value.trim() || null,
      enabled: parseInt(tr.querySelector('.bf-enabled').value)
    });
  });

  if (tasks.length === 0) { toast('등록할 행이 없습니다 (태그명·주소 필수)', true); return; }

  let done = 0, failed = 0;
  document.getElementById('bulkStatus').textContent = '저장 중... (0/' + tasks.length + ')';

  // 한 행씩 순서대로 저장한다 (Promise.all 병렬 아님) — 서버가 컬럼명 자동생성 시 "현재까지 쓰인
  // 컬럼명 목록"을 조회해서 중복을 피하는데, 동시에 여러 행을 보내면 그 조회가 서로 겹쳐서
  // 같은 컬럼명이 중복 생성될 수 있기 때문.
  function next(i) {
    if (i >= tasks.length) {
      document.getElementById('bulkStatus').textContent =
        '완료: ' + (tasks.length - failed) + '/' + tasks.length + (failed ? ' (실패 ' + failed + ')' : '');
      toast(failed ? (tasks.length - failed) + '개 저장, ' + failed + '개 실패' : tasks.length + '개 태그 저장 완료', failed > 0);
      loadTags();
      if (failed === 0) closeBulkModal();
      return;
    }
    jsonFetch(base + '/temp/tag/insert', { method: 'POST', body: JSON.stringify(tasks[i]) })
      .then(res => {
        if (res.success === false) failed++;
        done++;
        document.getElementById('bulkStatus').textContent = '저장 중... (' + done + '/' + tasks.length + ')';
        next(i + 1);
      })
      .catch(() => { failed++; done++; next(i + 1); });
  }
  next(0);
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* window expose */
['loadTags','addTag','updateTag','deleteTag','clearForm','loadHistory','filterTagList','toggleUse',
 'openBulkModal','closeBulkModal','addBulkRow','removeBulkRow','duplicateBulkRow','saveBulkRows']
  .forEach(fn => window[fn] = eval(fn));

loadPlcs(); loadTags(); loadHistory();
</script>
</body>
</html>
