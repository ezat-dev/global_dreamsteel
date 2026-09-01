<%@ page contentType="text/html; charset=UTF-8" %>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>ALARM WORKSPACE</title>
    <link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">

<style>
/* ══════════════════════════════════════════
   ALARM WORKSPACE — Cyber Dark Series
   TEMP MONITOR / TEMP LOGGER 동일 디자인 언어
══════════════════════════════════════════ */
:root {
  --bg:           #060810;
  --bg-panel:     #0b0e1a;
  --bg-deep:      #080b15;
  --bg-hover:     #111830;
  --bg-modal:     #0d1225;

  --cyan:         #00f0ff;
  --cyan-dim:     rgba(0,240,255,.07);
  --cyan-border:  rgba(0,240,255,.18);
  --cyan-glow:    0 0 18px rgba(0,240,255,.45);

  --green:        #00ff88;
  --green-glow:   0 0 14px rgba(0,255,136,.5);
  --green-border: rgba(0,255,136,.3);

  --amber:        #ffb700;
  --amber-border: rgba(255,183,0,.3);

  --red:          #ff3b5c;
  --red-border:   rgba(255,59,92,.35);
  --red-glow:     0 0 14px rgba(255,59,92,.5);

  --purple:       #b06cff;
  --purple-border:rgba(176,108,255,.35);
  --purple-glow:  0 0 14px rgba(176,108,255,.5);

  --text-p:       #d8edf8;
  --text-s:       #4a6a88;
  --text-dim:     #1a2e45;

  --font-mono:    '맑은 고딕', 'Malgun Gothic', sans-serif;
  --font-hud:     '맑은 고딕', 'Malgun Gothic', sans-serif;
  --font-ui:      '맑은 고딕', 'Malgun Gothic', sans-serif;
  --radius:       5px;
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
    radial-gradient(ellipse at 5% 90%, rgba(176,108,255,.04) 0%, transparent 50%),
    radial-gradient(ellipse at 95% 5%,  rgba(0,240,255,.04)  0%, transparent 50%),
    linear-gradient(rgba(0,240,255,.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,.02) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
}

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
  padding: 0 22px; height: 56px;
  border-bottom: 1px solid var(--cyan-border);
  background: linear-gradient(180deg, rgba(176,108,255,.05) 0%, transparent 100%);
  position: relative;
}
.page-header::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--purple), var(--cyan), transparent);
  opacity: .5;
}

.page-title {
  font-family: var(--font-hud);
  font-size: 22px; font-weight: 900;
  letter-spacing: 5px; text-transform: uppercase;
  color: var(--purple);
  text-shadow: var(--purple-glow);
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
  0%,100%{ opacity:1; box-shadow:0 0 8px var(--green),0 0 20px var(--green); }
  50%    { opacity:.3; box-shadow:none; }
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
  font-size: 10px; letter-spacing: 4px; color: var(--purple);
  text-shadow: var(--purple-glow);
  padding: 11px 14px 10px;
  border-bottom: 1px solid var(--cyan-border);
  background: var(--bg-deep);
  display: flex; align-items: center; gap: 7px;
}
.panel-title::before {
  content: '▶'; font-size: 8px; color: var(--purple);
  animation: blink-arr .9s step-end infinite;
}
@keyframes blink-arr { 0%,100%{opacity:1} 50%{opacity:0} }

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
  flex: 1; min-height: 0; overflow-y: auto; padding: 6px 8px;
}
.folder-list::-webkit-scrollbar { width: 3px; }
.folder-list::-webkit-scrollbar-thumb { background: var(--cyan-border); border-radius: 2px; }

.folder-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 9px; margin-bottom: 3px;
  border: 1px solid transparent; border-radius: 4px;
  cursor: pointer; transition: all .15s;
}
.folder-item:hover { background: var(--bg-hover); border-color: var(--cyan-border); }
.folder-item.active {
  background: rgba(176,108,255,.08);
  border-color: rgba(176,108,255,.4);
  box-shadow: inset 2px 0 0 var(--purple);
}
.folder-icon { font-size: 12px; flex-shrink: 0; }
.folder-name { font-size: 12px; font-weight: 500; color: var(--text-p); flex: 1; margin-left: 6px; }
.folder-item.active .folder-name { color: var(--purple); }
.folder-id {
  font-family: var(--font-mono); font-size: 9px;
  color: var(--text-s); background: var(--bg-deep);
  padding: 1px 5px; border-radius: 2px;
}
.folder-empty {
  padding: 30px 10px; text-align: center;
  font-family: var(--font-mono); font-size: 11px;
  color: var(--text-dim); letter-spacing: 2px;
}

/* ══ RIGHT PANEL ══ */
.panel-right {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; overflow: hidden;
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
.tb-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 2px; text-transform: uppercase; }
.tb-label.purple { color: var(--purple); text-shadow: var(--purple-glow); }
.tb-spacer { flex: 1; }

/* ══ BUTTONS ══ */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 26px; padding: 0 11px;
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 2px;
  border-radius: 3px; border: 1px solid; cursor: pointer;
  transition: all .15s; text-transform: uppercase; background: transparent;
}
.btn-cyan   { color: var(--cyan);   border-color: rgba(0,240,255,.35); }
.btn-cyan:hover   { background: var(--cyan-dim); box-shadow: var(--cyan-glow); }
.btn-green  { color: var(--green);  border-color: var(--green-border); }
.btn-green:hover  { background: rgba(0,255,136,.08); box-shadow: var(--green-glow); }
.btn-red    { color: var(--red);    border-color: var(--red-border); }
.btn-red:hover    { background: rgba(255,59,92,.1); box-shadow: var(--red-glow); }
.btn-yellow { color: var(--amber);  border-color: var(--amber-border); }
.btn-yellow:hover { background: rgba(255,183,0,.08); }
.btn-purple { color: var(--purple); border-color: var(--purple-border); }
.btn-purple:hover { background: rgba(176,108,255,.1); box-shadow: var(--purple-glow); }

/* ══ BODY AREA ══ */
.body-area {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  overflow: hidden; padding: 12px 16px; gap: 12px;
}

/* ══ FORM CARD ══ */
.form-card {
  flex-shrink: 0;
  background: var(--bg-panel);
  border: 1px solid var(--cyan-border);
  border-radius: var(--radius); overflow: hidden;
}
.form-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 14px;
  background: var(--bg-deep);
  border-bottom: 1px solid var(--cyan-border);
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 3px; color: var(--purple);
}
.form-card-head span { color: var(--text-s); font-size: 9px; }

.form-card-body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px 12px;
  padding: 10px 14px 12px;
}
.form-field { display: flex; flex-direction: column; gap: 4px; }
.form-field.span-full { grid-column: 1 / -1; }
.form-label {
  font-family: var(--font-mono); font-size: 9px;
  letter-spacing: 2px; color: var(--text-s); text-transform: uppercase;
}

.inp, .sel, .txt {
  background: var(--bg-deep);
  border: 1px solid var(--cyan-border);
  color: var(--text-p);
  font-family: var(--font-mono); font-size: 12px;
  padding: 0 9px; outline: none; border-radius: 3px;
  transition: border-color .2s, box-shadow .2s;
  width: 100%;
}
.inp, .sel { height: 30px; }
.txt { padding: 7px 9px; height: 54px; resize: none; line-height: 1.5; }
.inp::placeholder, .txt::placeholder { color: var(--text-s); }
.inp:focus, .sel:focus, .txt:focus {
  border-color: var(--purple);
  box-shadow: 0 0 8px rgba(176,108,255,.25);
  color: var(--text-p);
}
.sel { cursor: pointer; }
.sel option { background: #0b0e1a; }

/* level select color coding */
.sel#level option[value="1"] { color: var(--cyan); }
.sel#level option[value="2"] { color: var(--amber); }
.sel#level option[value="3"] { color: var(--red); }

/* ══ TABLE PANEL ══ */
.table-panel {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  background: var(--bg-panel);
  border: 1px solid var(--cyan-border);
  border-radius: var(--radius); overflow: hidden;
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
  padding: 1px 8px; border-radius: 8px;
}
.table-scroll {
  flex: 1; min-height: 0; overflow: auto;
}
.table-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
.table-scroll::-webkit-scrollbar-thumb { background: var(--cyan-border); border-radius: 2px; }

table { width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: 11px; }
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
  transition: background .12s; cursor: pointer;
}
table tbody tr:hover { background: rgba(0,240,255,.05); }
table tbody tr.selected {
  background: rgba(176,108,255,.09);
  box-shadow: inset 2px 0 0 var(--purple);
}
table tbody td { padding: 7px 10px; color: var(--text-p); white-space: nowrap; }
table tbody td:first-child { color: var(--text-s); }

.empty-row td {
  text-align: center; padding: 24px;
  color: var(--text-dim); font-family: var(--font-mono); letter-spacing: 2px;
}

/* level badges in table */
.lvl-badge {
  display: inline-block; font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 3px; border: 1px solid;
  font-family: var(--font-mono); letter-spacing: 1px;
}
.lvl-1 { color: var(--cyan);  border-color: rgba(0,240,255,.4);  background: rgba(0,240,255,.07); }
.lvl-2 { color: var(--amber); border-color: rgba(255,183,0,.4);  background: rgba(255,183,0,.06); }
.lvl-3 { color: var(--red);   border-color: rgba(255,59,92,.4);  background: rgba(255,59,92,.07); box-shadow: var(--red-glow); }

.enabled-y { color: var(--green); }
.enabled-n { color: var(--text-s); }

/* toggle switch */
.toggle {
  appearance: none; -webkit-appearance: none;
  width: 34px; height: 18px; border-radius: 9px;
  background: #1a2e45; border: 1px solid #2a4060;
  cursor: pointer; position: relative; transition: all .2s;
}
.toggle:checked { background: rgba(0,255,136,.25); border-color: var(--green); }
.toggle::after {
  content: ''; position: absolute;
  top: 2px; left: 2px; width: 12px; height: 12px;
  border-radius: 50%; background: #4a6a88; transition: all .2s;
}
.toggle:checked::after { left: 18px; background: var(--green); box-shadow: var(--green-glow); }

/* ══ MODAL ══ */
.modal-overlay {
  display: none; position: fixed; inset: 0; z-index: 1000;
  background: rgba(3,5,12,.85);
  backdrop-filter: blur(4px);
  align-items: center; justify-content: center;
}
.modal-overlay.show { display: flex; }

.modal-box {
  background: var(--bg-modal);
  border: 1px solid rgba(176,108,255,.4);
  border-radius: 8px;
  width: 560px; max-width: 95vw;
  box-shadow: 0 0 40px rgba(176,108,255,.2), 0 0 80px rgba(0,0,0,.6);
  overflow: hidden;
  animation: modal-in .2s ease;
}
@keyframes modal-in {
  from { opacity:0; transform: scale(.96) translateY(-8px); }
  to   { opacity:1; transform: none; }
}

.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px;
  background: rgba(176,108,255,.08);
  border-bottom: 1px solid rgba(176,108,255,.3);
  font-family: var(--font-hud); font-size: 13px; letter-spacing: 3px;
  color: var(--purple); text-shadow: var(--purple-glow);
}
.modal-head .close-btn {
  background: none; border: none; color: var(--text-s);
  font-size: 16px; cursor: pointer; line-height: 1; padding: 0 4px;
  transition: color .15s;
}
.modal-head .close-btn:hover { color: var(--red); }

.modal-body { padding: 14px 18px; }

.modal-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px;
  margin-bottom: 12px;
}
.modal-grid .span-full { grid-column: 1 / -1; }
.modal-label {
  font-family: var(--font-mono); font-size: 9px;
  letter-spacing: 2px; color: var(--text-s);
  text-transform: uppercase; margin-bottom: 4px;
}
.modal-inp, .modal-sel {
  width: 100%; height: 30px;
  background: var(--bg-deep); border: 1px solid var(--cyan-border);
  color: var(--text-p); font-family: var(--font-mono); font-size: 12px;
  padding: 0 9px; outline: none; border-radius: 3px;
  transition: border-color .2s;
}
.modal-inp:focus, .modal-sel:focus {
  border-color: var(--purple); box-shadow: 0 0 8px rgba(176,108,255,.2);
}
.modal-sel { cursor: pointer; }
.modal-sel option { background: #0b0e1a; }

.modal-actions {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 10px 18px 14px;
  border-bottom: 1px solid var(--cyan-border);
}

.modal-table-wrap {
  padding: 14px 18px 16px;
}
.modal-table-title {
  font-family: var(--font-mono); font-size: 10px;
  letter-spacing: 3px; color: var(--cyan); margin-bottom: 8px;
}
.modal-scroll { max-height: 200px; overflow-y: auto; }
.modal-scroll::-webkit-scrollbar { width: 3px; }
.modal-scroll::-webkit-scrollbar-thumb { background: var(--cyan-border); border-radius: 2px; }

/* ══ TOAST ══ */
#toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9998;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px;
  padding: 10px 18px; border-radius: 4px;
  background: var(--bg-deep); border: 1px solid var(--cyan-border);
  color: var(--cyan); box-shadow: var(--cyan-glow);
  opacity: 0; transform: translateY(10px);
  transition: opacity .25s, transform .25s; pointer-events: none;
}
#toast.show { opacity: 1; transform: translateY(0); }
#toast.err  { border-color: var(--red-border); color: var(--red); box-shadow: var(--red-glow); }
#toast.ok   { border-color: var(--green-border); color: var(--green); box-shadow: var(--green-glow); }

/* folder-select hidden */
.folder-select { display: none !important; }

/* inline prompt dialog replacement */
.prompt-overlay {
  display: none; position: fixed; inset: 0; z-index: 2000;
  background: rgba(3,5,12,.8); backdrop-filter: blur(3px);
  align-items: center; justify-content: center;
}
.prompt-overlay.show { display: flex; }
.prompt-box {
  background: var(--bg-modal);
  border: 1px solid var(--cyan-border);
  border-radius: 6px; padding: 20px 22px; width: 340px;
  box-shadow: var(--cyan-glow);
  animation: modal-in .18s ease;
}
.prompt-box label {
  display: block; font-family: var(--font-mono);
  font-size: 10px; color: var(--cyan); letter-spacing: 2px; margin-bottom: 8px;
}
.prompt-box input {
  width: 100%; height: 32px;
  background: var(--bg-deep); border: 1px solid var(--cyan-border);
  color: var(--text-p); font-family: var(--font-mono); font-size: 13px;
  padding: 0 10px; outline: none; border-radius: 3px; margin-bottom: 12px;
}
.prompt-box input:focus { border-color: var(--cyan); }
.prompt-actions { display: flex; gap: 8px; justify-content: flex-end; }

/* ══ BULK ADD (LIST ADD) MODAL ══ */
.modal-box.modal-box-lg {
  width: min(1400px, 96vw); height: min(820px, 92vh);
  display: flex; flex-direction: column;
  animation: modal-in .2s ease;
}
.modal-box-lg .modal-body { flex: 1; min-height: 0; overflow: auto; padding: 12px 18px; }
.modal-box-lg .modal-head-sub { font-size: 10px; color: var(--text-s); letter-spacing: 0; text-transform: none; margin-left: 10px; }
.modal-box-lg .modal-foot {
  flex-shrink: 0; display: flex; align-items: center; gap: 10px;
  padding: 10px 18px; border-top: 1px solid var(--cyan-border); background: var(--bg-deep);
}
.modal-box-lg .modal-foot .tb-spacer { flex: 1; }

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
  border-radius: 3px; border: 1px solid; cursor: pointer; background: transparent; font-size: 13px;
}
.bulk-copy { color: var(--cyan);  border-color: var(--cyan-border); }
.bulk-copy:hover { background: var(--cyan-dim); }
.bulk-del  { color: var(--red);   border-color: var(--red-border); }
.bulk-del:hover  { background: rgba(255,59,92,.1); }
.bulk-actions { display: flex; gap: 4px; }
</style>
</head>
<body class="theme-alarm">

<!-- ══ HEADER ══ -->
<div class="page-header">
  <div>
    <div class="page-title">⚡ALARM MANAGE</div>
    <div class="page-sub">// Manage alarm folders and tags</div>
  </div>
  <div class="active-badge"><div class="active-dot"></div>ACTIVE</div>
  <div class="header-clock" id="headerClock">--:--:--</div>
</div>

<jsp:include page="/WEB-INF/views/include/monitorNav.jsp"/>

<div class="workspace">

  <!-- ══ LEFT ══ -->
  <aside class="panel-left">
    <div class="panel-title">FOLDERS</div>
    <div class="left-tools">
      <input id="folderSearch" class="left-search" placeholder="폴더 검색..." oninput="filterFolderList()">
      <div class="left-btns">
        <button class="btn btn-purple" style="flex:1" onclick="addFolder()">＋ NEW</button>
        <button class="btn btn-red"    style="flex:1" onclick="deleteFolder()">✕ DEL</button>
      </div>
    </div>
    <select class="folder-select" id="folderSelect"></select>
    <div id="folderList" class="folder-list">
      <div class="folder-empty">로딩중...</div>
    </div>
  </aside>

  <!-- ══ RIGHT ══ -->
  <section class="panel-right">

    <div class="toolbar">
      <div class="tb-section">
        <span class="tb-label purple">ALARM TAG</span>
        <button class="btn btn-green"  onclick="addTag()">＋ ADD</button>
        <button class="btn btn-purple" onclick="openBulkModal()">☰ LIST ADD</button>
        <button class="btn btn-cyan"   onclick="updateTag()">✎ EDIT</button>
        <button class="btn btn-red"    onclick="deleteTag()">✕ DEL</button>
        <button class="btn btn-purple" onclick="clearForm()">⊘ CLEAR</button>
        <button class="btn btn-cyan"   onclick="downloadExcel()">EXCEL DOWN</button>
        <button class="btn btn-yellow" onclick="triggerExcelUpload()">EXCEL UP</button>
      </div>
      <div class="tb-spacer"></div>
      <button class="btn btn-cyan"   onclick="loadTags()">↺ REFRESH</button>
      <button class="btn btn-yellow" onclick="openPlcModal()">⚙ PLC</button>
    </div>

    <input type="file" id="excelFile" accept=".xlsx,.xls" style="display:none">

    <div class="body-area">

      <!-- FORM -->
      <div class="form-card">
        <div class="form-card-head">
          TAG EDITOR
          <span id="editMode">— NEW —</span>
        </div>
        <div class="form-card-body">
          <input type="hidden" id="tagId">
          <div class="form-field">
            <span class="form-label">태그명</span>
            <input class="inp" type="text" id="tagName" placeholder="예: D12000">
          </div>
          <div class="form-field">
            <span class="form-label">주소</span>
            <input class="inp" type="text" id="address" placeholder="예: D12000">
          </div>
          <div class="form-field">
            <span class="form-label">PLC</span>
            <select class="sel" id="plcSelect"></select>
          </div>
          <div class="form-field">
            <span class="form-label">레벨</span>
            <select class="sel" id="level">
              <option value="1">1 — INFO</option>
              <option value="2">2 — WARN</option>
              <option value="3">3 — ERROR</option>
            </select>
          </div>
          <div class="form-field" style="max-width:120px;">
            <span class="form-label">활성</span>
            <select class="sel" id="enabled">
              <option value="1">ON</option>
              <option value="0">OFF</option>
            </select>
          </div>
          <div class="form-field span-full">
            <span class="form-label">메시지</span>
            <textarea class="txt" id="alarmMsg" placeholder="알람 메시지"></textarea>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-panel">
        <div class="table-panel-head">
          TAG LIST
          <span class="badge" id="tagCount">0</span>
        </div>
        <div class="table-scroll">
          <table id="tagTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tag</th>
                <th>Address</th>
                <th>PLC</th>
                <th>Message</th>
                <th>Level</th>
                <th>Enabled</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

    </div>
  </section>
</div>

<!-- ══ PLC MODAL ══ -->
<div class="modal-overlay" id="plcModal">
  <div class="modal-box">
    <div class="modal-head">
      ⚙ PLC MANAGER
      <button class="close-btn" onclick="closePlcModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-grid">
        <div>
          <div class="modal-label">PLC ID</div>
          <input class="modal-inp" id="plcId" type="text" placeholder="예: plc2">
        </div>
        <div>
          <div class="modal-label">Label</div>
          <input class="modal-inp" id="plcLabel" type="text" placeholder="예: 라인2">
        </div>
        <div>
          <div class="modal-label">Type</div>
          <select class="modal-sel" id="plcType">
            <option value="LS">LS</option>
            <option value="MITSUBISHI">MITSUBISHI</option>
          </select>
        </div>
        <div>
          <div class="modal-label">IP</div>
          <input class="modal-inp" id="plcIp" type="text" placeholder="192.168.1.10">
        </div>
        <div>
          <div class="modal-label">Port</div>
          <input class="modal-inp" id="plcPort" type="number" value="2004">
        </div>
        <div>
          <div class="modal-label">Enabled</div>
          <select class="modal-sel" id="plcEnabled">
            <option value="1">ON</option>
            <option value="0">OFF</option>
          </select>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-red"   onclick="closePlcModal()">✕ 닫기</button>
      <button class="btn btn-green" onclick="savePlc()">✔ 저장</button>
    </div>
    <div class="modal-table-wrap">
      <div class="modal-table-title">REGISTERED PLCs</div>
      <div class="modal-scroll">
        <table id="plcTable">
          <thead>
            <tr>
              <th>ID</th><th>IP</th><th>Port</th><th>Type</th><th>Label</th><th>Use</th><th></th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- ══ BULK ADD (LIST ADD) MODAL ══ -->
<div class="modal-overlay" id="bulkModal">
  <div class="modal-box modal-box-lg">
    <div class="modal-head">
      <div>☰ 태그 일괄 등록 (LIST ADD)<span class="modal-head-sub" id="bulkFolderHint"></span></div>
      <button class="close-btn" onclick="closeBulkModal()">✕</button>
    </div>
    <div class="modal-body">
      <table class="bulk-table">
        <thead>
          <tr>
            <th style="width:36px;">#</th>
            <th style="min-width:170px;">태그명</th>
            <th style="min-width:110px;">주소</th>
            <th style="min-width:150px;">PLC</th>
            <th style="min-width:90px;">레벨</th>
            <th style="min-width:200px;">메시지</th>
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
      <span class="modal-head-sub" id="bulkStatus"></span>
      <button class="btn btn-purple" onclick="closeBulkModal()">취소</button>
      <button class="btn btn-green" onclick="saveBulkRows()">전체 저장</button>
    </div>
  </div>
</div>

<!-- ══ CUSTOM PROMPT ══ -->
<div class="prompt-overlay" id="promptOverlay">
  <div class="prompt-box">
    <label id="promptLabel">폴더명 입력</label>
    <input type="text" id="promptInput" placeholder="">
    <div class="prompt-actions">
      <button class="btn btn-red"   onclick="promptCancel()">취소</button>
      <button class="btn btn-green" onclick="promptOk()">확인</button>
    </div>
  </div>
</div>

<!-- toast -->
<div id="toast"></div>

<script>
const base = '<%=ctx%>';
let promptResolve = null;
let plcList = [];

/* ── 시계 ── */
setInterval(() => {
  const n = new Date(), p = v => String(v).padStart(2,'0');
  document.getElementById('headerClock').textContent =
    p(n.getHours())+':'+p(n.getMinutes())+':'+p(n.getSeconds());
}, 1000);

/* ── toast ── */
function toast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (type ? ' '+type : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = '', 2500);
}

/* ── custom prompt ── */
function customPrompt(label, placeholder='') {
  return new Promise(resolve => {
    promptResolve = resolve;
    document.getElementById('promptLabel').textContent = label;
    document.getElementById('promptInput').value = '';
    document.getElementById('promptInput').placeholder = placeholder;
    document.getElementById('promptOverlay').classList.add('show');
    setTimeout(() => document.getElementById('promptInput').focus(), 50);
  });
}
function promptOk() {
  const val = document.getElementById('promptInput').value.trim();
  document.getElementById('promptOverlay').classList.remove('show');
  if (promptResolve) { promptResolve(val); promptResolve = null; }
}
function promptCancel() {
  document.getElementById('promptOverlay').classList.remove('show');
  if (promptResolve) { promptResolve(null); promptResolve = null; }
}
document.getElementById('promptInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') promptOk();
  if (e.key === 'Escape') promptCancel();
});

/* ── jsonFetch ── */
function jsonFetch(url, options) {
  return fetch(url, Object.assign({ headers: {'Content-Type':'application/json'} }, options))
    .then(r => r.json());
}

/* ── FOLDERS ── */
function loadFolders() {
  fetch(base + '/alarm/folder/list').then(r => r.json()).then(list => {
    const sel = document.getElementById('folderSelect');
    const prev = sel.value;
    sel.innerHTML = '';
    (list||[]).forEach(f => {
      const o = document.createElement('option');
      o.value = f.folderId; o.textContent = f.folderName;
      sel.appendChild(o);
    });
    if (prev && prev !== '0') sel.value = prev;
    if (list && list.length) {
      if (!sel.value) sel.value = list[0].folderId;
      loadTags();
    } else { clearTable(); }
    renderFolderList(list);
  });
}

function renderFolderList(list) {
  const wrap = document.getElementById('folderList');
  if (!list || !list.length) {
    wrap.innerHTML = '<div class="folder-empty">[ 폴더 없음 ]</div>'; return;
  }
  const current = document.getElementById('folderSelect').value;
  wrap.innerHTML = list.map(f => {
    const active = String(f.folderId) === String(current) ? ' active' : '';
    return '<div class="folder-item'+active+'" data-id="'+f.folderId+'" onclick="selectFolder('+f.folderId+')">'
      + '<span class="folder-icon">📁</span>'
      + '<div class="folder-name">'+esc(f.folderName||'')+'</div>'
      + '<div class="folder-id">#'+f.folderId+'</div>'
      + '</div>';
  }).join('');
}

function selectFolder(folderId) {
  document.getElementById('folderSelect').value = String(folderId);
  loadTags();
  document.querySelectorAll('#folderList .folder-item').forEach(it =>
    it.classList.toggle('active', it.getAttribute('data-id') === String(folderId))
  );
}

async function addFolder() {
  const name = await customPrompt('새 폴더명 입력', '예: LINE_1_ALARMS');
  if (!name) return;
  jsonFetch(base+'/alarm/folder/insert', { method:'POST', body:JSON.stringify({folderName:name}) })
    .then(res => {
      if (res.success === false) { toast(res.error, 'err'); return; }
      toast('폴더 추가됨', 'ok'); loadFolders();
    });
}

function deleteFolder() {
  const folderId = parseInt(document.getElementById('folderSelect').value||'0');
  if (!folderId) { toast('폴더를 선택하세요', 'err'); return; }
  if (!confirm('폴더를 삭제할까요?')) return;
  jsonFetch(base+'/alarm/folder/delete', { method:'POST', body:JSON.stringify({folderId}) })
    .then(res => {
      if (res.success === false) { toast(res.error, 'err'); return; }
      toast('폴더 삭제됨', 'ok'); loadFolders();
    });
}

function filterFolderList() {
  const q = (document.getElementById('folderSearch').value||'').toLowerCase();
  document.querySelectorAll('#folderList .folder-item').forEach(it => {
    const name = (it.querySelector('.folder-name')?.textContent||'').toLowerCase();
    it.style.display = name.includes(q) ? '' : 'none';
  });
}

/* ── TAGS ── */
function loadTags() {
  const folderId = parseInt(document.getElementById('folderSelect').value||'0');
  fetch(base+'/alarm/tag/list?folderId='+folderId)
    .then(r => r.json()).then(renderTags);
}

const LVL_LABEL = { 1:'INFO', 2:'WARN', 3:'ERROR' };
const LVL_CLS   = { 1:'lvl-1', 2:'lvl-2', 3:'lvl-3' };

function renderTags(list) {
  const tbody = document.querySelector('#tagTable tbody');
  document.getElementById('tagCount').textContent = (list||[]).length;
  if (!list||!list.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">[ 알람 태그 없음 ]</td></tr>'; return;
  }
  tbody.innerHTML = '';
  list.forEach(t => {
    const tr = document.createElement('tr');
    const lvlCls = LVL_CLS[t.level]||'lvl-1';
    const lvlTxt = LVL_LABEL[t.level]||t.level;
    tr.innerHTML =
      '<td>'+t.tagId+'</td>'+
      '<td style="color:var(--text-p);font-weight:500">'+esc(t.tagName)+'</td>'+
      '<td style="color:var(--text-s)">'+esc(t.address)+'</td>'+
      '<td style="color:var(--purple)">'+esc(t.plcId||'')+'</td>'+
      '<td title="'+esc(t.alarmMsg||'')+'" style="color:var(--text-s)">'+esc((t.alarmMsg||'').substring(0,28))+'</td>'+
      '<td><span class="lvl-badge '+lvlCls+'">'+lvlTxt+'</span></td>'+
      '<td class="'+(t.enabled===1?'enabled-y':'enabled-n')+'">'+(t.enabled===1?'● ON':'○ OFF')+'</td>';
    tr.onclick = () => {
      document.querySelectorAll('#tagTable tbody tr').forEach(r=>r.classList.remove('selected'));
      tr.classList.add('selected');
      fillForm(t);
    };
    tbody.appendChild(tr);
  });
}

function fillForm(t) {
  document.getElementById('tagId').value  = t.tagId;
  document.getElementById('tagName').value= t.tagName||'';
  document.getElementById('address').value= t.address||'';
  document.getElementById('plcSelect').value= t.plcId||'';
  document.getElementById('level').value  = t.level||1;
  document.getElementById('alarmMsg').value= t.alarmMsg||'';
  document.getElementById('enabled').value= t.enabled||1;
  document.getElementById('editMode').textContent = '— EDITING #'+t.tagId+' —';
}

function clearForm() {
  ['tagId','tagName','address','alarmMsg'].forEach(id => document.getElementById(id).value='');
  document.getElementById('level').value = 1;
  document.getElementById('enabled').value = 1;
  document.getElementById('editMode').textContent = '— NEW —';
  document.querySelectorAll('#tagTable tbody tr').forEach(r=>r.classList.remove('selected'));
}

function addTag() {
  const folderId = parseInt(document.getElementById('folderSelect').value||'0');
  const tag = {
    folderId, tagName: document.getElementById('tagName').value.trim(),
    address: document.getElementById('address').value.trim(),
    plcId: document.getElementById('plcSelect').value,
    alarmMsg: document.getElementById('alarmMsg').value.trim(),
    level: parseInt(document.getElementById('level').value),
    enabled: parseInt(document.getElementById('enabled').value)
  };
  if (!tag.tagName) { toast('태그명을 입력하세요', 'err'); return; }
  jsonFetch(base+'/alarm/tag/insert', { method:'POST', body:JSON.stringify(tag) })
    .then(res => {
      if (res.success===false) { toast(res.error,'err'); return; }
      toast('태그 추가됨','ok'); loadTags(); clearForm();
    });
}

function updateTag() {
  const tagId = parseInt(document.getElementById('tagId').value||'0');
  if (!tagId) { toast('수정할 태그를 선택하세요','err'); return; }
  const tag = {
    tagId, folderId: parseInt(document.getElementById('folderSelect').value||'0'),
    tagName: document.getElementById('tagName').value.trim(),
    address: document.getElementById('address').value.trim(),
    plcId: document.getElementById('plcSelect').value,
    alarmMsg: document.getElementById('alarmMsg').value.trim(),
    level: parseInt(document.getElementById('level').value),
    enabled: parseInt(document.getElementById('enabled').value)
  };
  jsonFetch(base+'/alarm/tag/update', { method:'POST', body:JSON.stringify(tag) })
    .then(res => {
      if (res.success===false) { toast(res.error,'err'); return; }
      toast('태그 수정됨','ok'); loadTags(); clearForm();
    });
}

function deleteTag() {
  const tagId = parseInt(document.getElementById('tagId').value||'0');
  if (!tagId) { toast('삭제할 태그를 선택하세요','err'); return; }
  if (!confirm('태그를 삭제할까요?')) return;
  jsonFetch(base+'/alarm/tag/delete', { method:'POST', body:JSON.stringify({tagId}) })
    .then(res => {
      if (res.success===false) { toast(res.error,'err'); return; }
      toast('태그 삭제됨','ok'); loadTags(); clearForm();
    });
}

function clearTable() { document.querySelector('#tagTable tbody').innerHTML=''; }

/* ── PLCs ── */
function loadPlcs() {
  fetch(base+'/alarm/plc/list').then(r=>r.json()).then(list => {
    plcList = list || [];
    const sel = document.getElementById('plcSelect');
    sel.innerHTML = '';
    plcList.forEach(p => {
      const o = document.createElement('option');
      o.value = p.plcId;
      o.textContent = p.plcId+' ('+p.ip+':'+p.port+')';
      sel.appendChild(o);
    });
    renderPlcTable(list);
  });
}

function renderPlcTable(list) {
  const tbody = document.querySelector('#plcTable tbody');
  tbody.innerHTML = '';
  (list||[]).forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>'+esc(p.plcId||'')+'</td>'+
      '<td style="color:var(--text-s)">'+esc(p.ip||'')+'</td>'+
      '<td style="color:var(--text-s)">'+esc(p.port||'')+'</td>'+
      '<td style="color:var(--amber)">'+esc(p.plcType||'')+'</td>'+
      '<td>'+esc(p.label||'')+'</td>'+
      '<td class="'+(p.enabled===1?'enabled-y':'enabled-n')+'">'+(p.enabled===1?'●':'○')+'</td>'+
      '<td><button class="btn btn-red" style="height:20px;padding:0 7px;font-size:9px" onclick="event.stopPropagation();deletePlc(\''+p.plcId+'\')">✕</button></td>';
    tr.onclick = () => fillPlcForm(p);
    tbody.appendChild(tr);
  });
}

function fillPlcForm(p) {
  document.getElementById('plcId').value    = p.plcId||'';
  document.getElementById('plcLabel').value = p.label||'';
  document.getElementById('plcType').value  = p.plcType||'LS';
  document.getElementById('plcIp').value    = p.ip||'';
  document.getElementById('plcPort').value  = p.port||2004;
  document.getElementById('plcEnabled').value = p.enabled===1?'1':'0';
}

function savePlc() {
  const plc = {
    plcId:   document.getElementById('plcId').value.trim(),
    label:   document.getElementById('plcLabel').value.trim(),
    plcType: document.getElementById('plcType').value,
    ip:      document.getElementById('plcIp').value.trim(),
    port:    parseInt(document.getElementById('plcPort').value||'2004'),
    enabled: parseInt(document.getElementById('plcEnabled').value||'1')
  };
  jsonFetch(base+'/alarm/plc/add', { method:'POST', body:JSON.stringify(plc) })
    .then(res => {
      if (res.success===false) { toast(res.error,'err'); return; }
      toast('PLC 저장됨','ok');
      clearPlcForm(); loadPlcs();
    });
}

function clearPlcForm() {
  ['plcId','plcLabel','plcIp'].forEach(id => document.getElementById(id).value='');
  document.getElementById('plcPort').value = '2004';
  document.getElementById('plcType').value = 'LS';
  document.getElementById('plcEnabled').value = '1';
}

function deletePlc(plcId) {
  if (!confirm('PLC '+plcId+' 삭제?')) return;
  jsonFetch(base+'/alarm/plc/remove', { method:'POST', body:JSON.stringify({plcId}) })
    .then(res => {
      if (res.success===false) { toast(res.error,'err'); return; }
      toast('PLC 삭제됨','ok'); loadPlcs();
    });
}

function openPlcModal()  { document.getElementById('plcModal').classList.add('show'); loadPlcs(); }
function closePlcModal() { document.getElementById('plcModal').classList.remove('show'); }

function downloadExcel() {
  window.location = base + '/alarm/excel/download';
}

function triggerExcelUpload() {
  document.getElementById('excelFile').click();
}

document.getElementById('excelFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch(base + '/alarm/excel/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data && data.success === false) {
      toast(data.error || '엑셀 업로드 실패', 'err');
    } else {
      const ins = data.inserted || 0;
      const upd = data.updated || 0;
      const errCnt = (data.errors && data.errors.length) ? data.errors.length : 0;
      if (errCnt > 0) {
        toast(`업로드 완료 (추가 ${ins}, 수정 ${upd}, 실패 ${errCnt})`, 'err');
        console.warn('Excel import errors:', data.errors);
      } else {
        toast(`업로드 완료 (추가 ${ins}, 수정 ${upd})`, 'ok');
      }
      loadTags();
    }
  } catch (err) {
    toast('엑셀 업로드 실패: ' + err.message, 'err');
  }
  e.target.value = '';
});
/* ══ 일괄 등록(LIST ADD) 모달 ══════════════════════════════════ */
let bulkRowSeq = 0;

function bulkRowHtml(rid) {
  const plcOptions = plcList.map(p =>
    '<option value="'+p.plcId+'">'+esc(p.plcId)+' ('+esc(p.ip)+':'+p.port+')</option>'
  ).join('');

  return '<tr data-rid="'+rid+'">'+
    '<td style="color:var(--text-s)">'+rid+'</td>'+
    '<td><input class="inp bf-tagName" type="text" placeholder="예: D12000"></td>'+
    '<td><input class="inp bf-address" type="text" placeholder="예: D12000"></td>'+
    '<td><select class="sel bf-plcId">'+plcOptions+'</select></td>'+
    '<td><select class="sel bf-level"><option value="1">1-INFO</option><option value="2">2-WARN</option><option value="3">3-ERROR</option></select></td>'+
    '<td><input class="inp bf-alarmMsg" type="text" placeholder="알람 메시지"></td>'+
    '<td><select class="sel bf-enabled"><option value="1">ON</option><option value="0">OFF</option></select></td>'+
    '<td class="bulk-actions">'+
      '<button class="bulk-row-btn bulk-copy" title="복사 (주소·태그명 +1)" onclick="duplicateBulkRow(this)">⧉</button>'+
      '<button class="bulk-row-btn bulk-del" title="삭제" onclick="removeBulkRow(this)">✕</button>'+
    '</td>'+
  '</tr>';
}

function openBulkModal() {
  const folderId = parseInt(document.getElementById('folderSelect').value||'0');
  if (!folderId) { toast('폴더를 먼저 선택하세요', 'err'); return; }
  const folderName = document.querySelector('#folderList .folder-item.active .folder-name')?.textContent || '';
  document.getElementById('bulkFolderHint').textContent = '— 대상 폴더: ' + folderName + ' (#' + folderId + ')';

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

/* 문자열 맨 끝의 숫자 덩어리를 찾아 +1 (자릿수 유지, 예: "D100" → "D101") */
function incrementTrailingNumber(str) {
  const s = String(str||'');
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
  const get = cls => tr.querySelector('.'+cls).value;

  bulkRowSeq++;
  document.getElementById('bulkTbody').insertAdjacentHTML('beforeend', bulkRowHtml(bulkRowSeq));
  const newTr = document.querySelector('#bulkTbody tr:last-child');
  const set = (cls, val) => { const el = newTr.querySelector('.'+cls); if (el) el.value = val; };

  set('bf-tagName', incrementTrailingNumber(get('bf-tagName')));
  set('bf-address', incrementTrailingNumber(get('bf-address')));
  set('bf-plcId', get('bf-plcId'));
  set('bf-level', get('bf-level'));
  set('bf-alarmMsg', get('bf-alarmMsg'));
  set('bf-enabled', get('bf-enabled'));
}

function saveBulkRows() {
  const folderId = parseInt(document.getElementById('folderSelect').value||'0');
  if (!folderId) { toast('폴더를 먼저 선택하세요', 'err'); return; }

  const rows = document.querySelectorAll('#bulkTbody tr');
  const tasks = [];
  rows.forEach(tr => {
    const tagName = tr.querySelector('.bf-tagName').value.trim();
    const address = tr.querySelector('.bf-address').value.trim();
    if (!tagName || !address) return;   // 빈 행은 건너뜀
    tasks.push({
      folderId, tagName, address,
      plcId: tr.querySelector('.bf-plcId').value,
      level: parseInt(tr.querySelector('.bf-level').value),
      alarmMsg: tr.querySelector('.bf-alarmMsg').value.trim(),
      enabled: parseInt(tr.querySelector('.bf-enabled').value)
    });
  });

  if (tasks.length === 0) { toast('등록할 행이 없습니다 (태그명·주소 필수)', 'err'); return; }

  let done = 0, failed = 0;
  document.getElementById('bulkStatus').textContent = '저장 중... (0/'+tasks.length+')';

  function next(i) {
    if (i >= tasks.length) {
      document.getElementById('bulkStatus').textContent =
        '완료: '+(tasks.length-failed)+'/'+tasks.length+(failed?' (실패 '+failed+')':'');
      toast(failed ? (tasks.length-failed)+'개 저장, '+failed+'개 실패' : tasks.length+'개 태그 저장 완료', failed>0?'err':'ok');
      loadTags();
      if (failed === 0) closeBulkModal();
      return;
    }
    jsonFetch(base+'/alarm/tag/insert', { method:'POST', body:JSON.stringify(tasks[i]) })
      .then(res => {
        if (res.success === false) failed++;
        done++;
        document.getElementById('bulkStatus').textContent = '저장 중... ('+done+'/'+tasks.length+')';
        next(i+1);
      })
      .catch(() => { failed++; done++; next(i+1); });
  }
  next(0);
}

/* esc */
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* expose */
['loadFolders','loadTags','addFolder','deleteFolder','addTag','updateTag','deleteTag',
 'clearForm','downloadExcel','triggerExcelUpload','openPlcModal','closePlcModal','savePlc','filterFolderList','selectFolder',
 'openBulkModal','closeBulkModal','addBulkRow','removeBulkRow','duplicateBulkRow','saveBulkRows']
  .forEach(fn => window[fn] = eval(fn));

document.getElementById('folderSelect').addEventListener('change', loadTags);
loadFolders();
loadPlcs();
</script>
</body>
</html>





