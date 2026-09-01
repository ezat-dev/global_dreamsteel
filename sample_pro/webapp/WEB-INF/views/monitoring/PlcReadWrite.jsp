<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>PLC MONITOR</title>
<link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body { background: #07090F; color: #A8D8F0; font-family: 'Malgun Gothic', '맑은 고딕', 'Consolas', sans-serif; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }

.page-title { font-size: 18px; font-weight: bold; color: #00F0FF; text-shadow: 0 0 12px #00F0FF66; }
.page-sub   { font-size: 10px; color: #B24BF3; opacity: .6; }
.divider    { height: 1px; background: linear-gradient(90deg, #00F0FF33, transparent); flex-shrink: 0; }

/* ══ PLC 탭 바 ══ */
.plc-tab-bar {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    background: #0A0D1A; border: 1px solid #1A3A5C; border-radius: 4px;
    padding: 6px 10px; overflow-x: auto;
}
.plc-tab-bar::-webkit-scrollbar { height: 3px; }
.plc-tab-bar::-webkit-scrollbar-thumb { background: #1A3A5C; }

.plc-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 3px; cursor: pointer;
    border: 1px solid #1A3A5C; background: #060A18;
    font-size: 11px; font-weight: bold; white-space: nowrap;
    transition: all .15s; position: relative;
}
.plc-tab:hover { border-color: #2A5A8C; background: #0D1828; }
.plc-tab.active { border-color: #00F0FF; background: #001A2A; color: #00F0FF; }
.plc-tab .tab-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #2A4A6A; flex-shrink: 0;
}
.plc-tab .tab-dot.ok  { background: #00FF88; box-shadow: 0 0 4px #00FF88; }
.plc-tab .tab-dot.err { background: #FF4466; box-shadow: 0 0 4px #FF4466; }
.plc-tab .tab-dot.run { background: #00F0FF; box-shadow: 0 0 4px #00F0FF; animation: blink .8s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
.plc-tab .tab-badge { font-size: 9px; opacity: .75; }
.plc-tab .tab-close {
    font-size: 12px; opacity: .4; margin-left: 2px; line-height: 1;
    padding: 0 2px; border-radius: 2px;
}
.plc-tab .tab-close:hover { opacity: 1; color: #FF4466; }

.btn-add-plc {
    height: 30px; padding: 0 12px; background: transparent;
    border: 1px dashed #5A7FA0; color: #8AACCC;
    font-size: 11px;
    cursor: pointer; border-radius: 3px; transition: all .15s; white-space: nowrap;
}
.btn-add-plc:hover { border-color: #00F0FF; color: #00F0FF; }
.btn-add-modbus {
    height: 30px; padding: 0 12px; background: transparent;
    border: 1px dashed #5A7FA0; color: #8AACCC;
    font-size: 11px;
    cursor: pointer; border-radius: 3px; transition: all .15s; white-space: nowrap;
}
.btn-add-modbus:hover { border-color: #4DD0E1; color: #4DD0E1; }

/* ══ 패널 공통 ══ */
.cfg-panel { background: #0D1128; border: 1px solid #1A3A5C; border-radius: 4px; flex-shrink: 0; }
.panel-head { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-bottom: 1px solid #0D1A2E; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
.acc { width: 3px; height: 14px; border-radius: 2px; flex-shrink: 0; }
.cfg-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 8px 14px; }
.cfg-label { font-size: 10px; color: #90AECA; white-space: nowrap; }

.cfg-inp {
    background: #060A18; border: 1px solid #1A3A5C; color: #00F0FF;
    font-family: 'Consolas', monospace; font-size: 12px; font-weight: bold;
    padding: 4px 8px; border-radius: 2px; width: 80px; outline: none;
}
.cfg-inp:focus { border-color: #00F0FF; }
select.cfg-inp { cursor: pointer; }

.plc-inp {
    background: #060A18; border: 1px solid #2A4A6A; color: #FFD060;
    font-family: 'Consolas', monospace; font-size: 13px; font-weight: bold;
    padding: 4px 10px; border-radius: 2px; outline: none;
}
.plc-inp:focus { border-color: #FFD060; }
.plc-inp.ip    { width: 150px; }
.plc-inp.port  { width: 75px; }
.plc-inp.label { width: 130px; color: #A8D8F0; }
select.plc-inp { cursor: pointer; width: 200px; color: #00FF88; border-color: #00FF8855; }

.badge { font-size: 10px; font-weight: bold; letter-spacing: 1px; padding: 2px 8px; border-radius: 2px; }
.badge-ls   { background: #001A10; border: 1px solid #00FF88; color: #00FF88; }
.badge-mits { background: #100018; border: 1px solid #B24BF3; color: #B24BF3; }
.badge-modbus { background: #00141A; border: 1px solid #4DD0E1; color: #4DD0E1; }

.conn-dot { width: 8px; height: 8px; border-radius: 50%; background: #2A4A6A; transition: all .3s; }
.conn-dot.ok  { background: #00FF88; box-shadow: 0 0 5px #00FF88; }
.conn-dot.err { background: #FF4466; box-shadow: 0 0 5px #FF4466; }
.conn-msg { font-size: 11px; color: #90AECA; }
.conn-msg.ok  { color: #00FF88; }
.conn-msg.err { color: #FF4466; }

.btn {
    height: 26px; padding: 0 12px; background: transparent;
    font-size: 11px; font-weight: bold;
    cursor: pointer; border-radius: 2px; transition: all .15s; white-space: nowrap;
}
.btn-cyan   { border: 1px solid #00F0FF; color: #00F0FF; }
.btn-cyan:hover   { background: #00F0FF; color: #07090F; }
.btn-red    { border: 1px solid #FF4466; color: #FF4466; }
.btn-red:hover    { background: #FF4466; color: #07090F; }
.btn-yellow { border: 1px solid #FFD060; color: #FFD060; }
.btn-yellow:hover { background: #FFD060; color: #07090F; }
.btn-green  { border: 1px solid #00FF88; color: #00FF88; }
.btn-green:hover  { background: #00FF88; color: #07090F; }

/* ══ 통계 ══ */
.stats-row { display: grid; grid-template-columns: repeat(5,1fr); gap: 6px; flex-shrink: 0; }
.stat-card { border-radius: 3px; padding: 6px 10px; display: flex; flex-direction: column; align-items: center; gap: 1px; border: 1px solid; }
.sc-label { font-size: 9px; font-weight: bold; letter-spacing: 1px; opacity: .8; }
.sc-val   { font-size: 20px; font-weight: bold; }
.sc-sub   { font-size: 9px; opacity: .65; }
.sc-read-ok    { background: #071410; border-color: #00FF88; color: #00FF88; }
.sc-read-fail  { background: #140709; border-color: #FF4466; color: #FF4466; }
.sc-write-ok   { background: #071318; border-color: #00D4FF; color: #00D4FF; }
.sc-write-fail { background: #140E07; border-color: #FF8844; color: #FF8844; }
.sc-elapsed    { background: #0E0714; border-color: #B24BF3; color: #B24BF3; }

/* ══ 범위/폴링 설정 ══ */
.sbar { display: flex; align-items: center; gap: 8px; padding: 6px 14px; background: #060A18; border-top: 1px solid #0D1A2E; border-radius: 0 0 4px 4px; font-size: 11px; }
.s-dot { width: 7px; height: 7px; border-radius: 50%; background: #2A4A6A; transition: all .3s; }
.s-dot.ok  { background: #00FF88; box-shadow: 0 0 5px #00FF88; }
.s-dot.err { background: #FF4466; box-shadow: 0 0 5px #FF4466; }
.s-msg { color: #90AECA; font-size: 11px; }
.s-msg.ok  { color: #00FF88; }
.s-msg.err { color: #FF4466; }
.s-cnt { margin-left: auto; color: #7090B0; font-size: 10px; }
.spin { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #1A3A5C; border-top-color: #00F0FF; }
.spin.on { animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.chunk-bar-wrap { display: none; align-items: center; gap: 8px; padding: 5px 14px; background: #060A18; border-top: 1px solid #0D1A2E; }
.chunk-bar-wrap.visible { display: flex; }
.chunk-pips { display: flex; gap: 3px; flex-wrap: wrap; }
.chunk-pip { min-width: 16px; height: 16px; padding: 0 2px; border-radius: 2px; border: 1px solid #1A3A5C; background: #060A18; font-size: 8px; font-weight: bold; display: flex; align-items: center; justify-content: center; color: #2A4A6A; transition: all .2s; }
.chunk-pip.active { border-color: #00F0FF; color: #00F0FF; background: #00F0FF1A; animation: pipPulse .6s infinite; }
.chunk-pip.done   { border-color: #00FF8866; color: #00FF88; background: #00FF880D; }
.chunk-pip.err    { border-color: #FF4466; color: #FF4466; background: #FF44660D; }
@keyframes pipPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.chunk-track { flex:1; height:4px; background:#0D1A2E; border-radius:2px; overflow:hidden; }
.chunk-fill  { height:100%; width:0%; background:#00F0FF; border-radius:2px; transition:width .2s; }

/* ══ 3분할 ══ */
.main-grid { display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 12px; flex: 1; min-height: 0; }
.panel { background: #0D1128; border: 1px solid #1A3A5C; border-radius: 4px; display: flex; flex-direction: column; min-height: 0; }
.read-scroll  { flex:1; overflow-y:auto; min-height:0; }
.write-scroll { flex:1; overflow-y:auto; min-height:0; padding:10px 14px; }
.read-scroll::-webkit-scrollbar, .write-scroll::-webkit-scrollbar, .con-body::-webkit-scrollbar { width:3px; }
.read-scroll::-webkit-scrollbar-thumb, .write-scroll::-webkit-scrollbar-thumb, .con-body::-webkit-scrollbar-thumb { background:#1A3A5C; border-radius:2px; }

.r-table { width:100%; border-collapse:collapse; font-size:12px; }
.r-table thead th { position:sticky; top:0; z-index:1; background:#060A18; color:#00F0FF; opacity:.85; font-size:9px; letter-spacing:1px; font-weight:bold; padding:6px 8px; border-bottom:1px solid #1A3A5C; text-align:center; }
.r-table thead th:first-child { text-align:left; }
.r-table tbody td { padding:7px 8px; border-bottom:1px solid #060A18; text-align:center; }
.r-table tbody td:first-child { text-align:left; }
.r-table tbody tr:hover td { background:#0A1828; }
.r-table tbody tr.flash td { animation:fl .4s; }
@keyframes fl { 0%,100%{background:transparent;} 50%{background:#00F0FF0D;} }
.r-table tbody tr.chunk-sep td { border-top:1px solid #1A3A5C55; }
.td-addr { color:#B24BF3; font-weight:bold; font-size:12px; }
.td-dec  { color:#00F0FF; font-weight:bold; font-size:14px; }
.td-hex  { color:#FFD060; font-size:11px; }
.td-bin  { color:#5A7FA0; font-size:9px; letter-spacing:1px; font-family:'Consolas',monospace; }
.td-time { color:#7090B0; font-size:10px; }
.td-area { font-size:9px; white-space:nowrap; }
.area-badge { display:inline-block; padding:1px 6px; border-radius:2px; font-size:9px; font-weight:bold; letter-spacing:.5px; border:1px solid; }
.area-1x { background:#071A0E; border-color:#00FF88; color:#00FF88; }
.area-2x { background:#071418; border-color:#4DD0E1; color:#4DD0E1; }
.area-3x { background:#14100A; border-color:#FFB700; color:#FFB700; }
.area-4x { background:#100A18; border-color:#B24BF3; color:#B24BF3; }
.area-raw{ background:#0A0A0A; border-color:#3A5A7A; color:#3A5A7A; }

.w-chunk-head { font-size:9px; font-weight:bold; color:#6A8AAA; letter-spacing:1px; padding:8px 0 3px; border-top:1px solid #0D1A2E; margin-top:4px; }
.w-chunk-head:first-of-type { border-top:none; margin-top:0; padding-top:0; }
.w-row { display:flex; align-items:center; gap:6px; padding:5px 0; border-bottom:1px solid #0D1A2E; }
.w-addr { width:70px; color:#B24BF3; font-weight:bold; font-size:12px; flex-shrink:0; }
.w-cur  { width:55px; text-align:right; color:#00F0FF; font-weight:bold; font-size:14px; flex-shrink:0; }
.w-arrow { color:#7090B0; font-size:11px; flex-shrink:0; }
.w-inp  { flex:1; min-width:0; background:#060A18; border:1px solid #1A3A5C; color:#FFD060; font-family:'Consolas',monospace; font-size:13px; font-weight:bold; padding:4px 6px; border-radius:2px; text-align:center; outline:none; }
.w-inp:focus { border-color:#FFD060; }
.w-btn  { width:52px; height:28px; background:transparent; border:1px solid #00FF88; color:#00FF88; font-family:'Consolas',monospace; font-size:10px; font-weight:bold; cursor:pointer; border-radius:2px; flex-shrink:0; }
.w-btn:hover { background:#00FF88; color:#07090F; }
.w-hint { font-size:9px; color:#7090B0; margin-top:8px; }

.con-panel { background:#030508; border:1px solid #0D1A2E; border-radius:4px; display:flex; flex-direction:column; min-height:0; }
.con-head  { display:flex; align-items:center; justify-content:space-between; padding:6px 10px; border-bottom:1px solid #0D1A2E; font-size:10px; font-weight:bold; color:#7090B0; letter-spacing:1px; flex-shrink:0; }
.con-body  { flex:1; overflow-y:auto; min-height:0; padding:5px 8px; font-size:10px; line-height:1.8; }
.log-line { display:flex; gap:5px; }
.log-t  { color:#7090B0; flex-shrink:0; font-size:9px; }
.log-r  { color:#00F0FF; word-break:break-all; }
.log-w  { color:#00FF88; word-break:break-all; }
.log-e  { color:#FF4466; word-break:break-all; }
.log-x  { color:#90AECA; word-break:break-all; }
.btn-cl { background:transparent; border:1px solid #1A3A5C; color:#2A4A6A; font-family:'Consolas',monospace; font-size:9px; padding:2px 6px; cursor:pointer; border-radius:2px; }
.btn-cl:hover { border-color:#FF4466; color:#FF4466; }

/* ══ 비트 패널 ══ */
.bit-panel-wrap { background:#0D1128; border:1px solid #1A3A5C; border-radius:4px; flex-shrink:0; }
.bit-panel-head {
  display:flex; align-items:center; gap:8px; padding:8px 14px;
  border-bottom:1px solid #0D1A2E; font-size:10px; font-weight:bold; letter-spacing:1px;
}
.bit-cards { display:flex; flex-wrap:wrap; gap:12px; padding:12px 14px; }
.bit-card {
  background:#060A18; border:1px solid #1A3A5C; border-radius:4px;
  padding:10px 14px;
}
.bit-card-head {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:10px;
}
.bit-card-addr { color:#B24BF3; font-weight:bold; font-size:13px; }
.bit-card-val  { color:#00F0FF; font-size:11px; }
.bit-card-close { cursor:pointer; color:#7090B0; font-size:14px; padding:0 4px; line-height:1; }
.bit-card-close:hover { color:#FF4466; }
.bit-row { display:flex; gap:4px; flex-wrap:nowrap; }
.bit-box {
  width:34px; height:40px; border-radius:3px;
  border:1px solid #1A3A5C; background:#030508;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:2px; transition:all .15s; font-family:'Consolas',monospace; flex-shrink:0;
  cursor:pointer; user-select:none;
}
.bit-box:hover { border-color:#FFD060; background:#1A1200; }
.bit-box:hover .bit-name { color:#FFD06099; }
.bit-box:hover .bit-val  { color:#FFD060; }
.bit-box .bit-name { font-size:9px; color:#7090B0; }
.bit-box .bit-val  { font-size:14px; font-weight:bold; color:#7090B0; }
.bit-box.on { border-color:#00FF88; background:#001A08; }
.bit-box.on .bit-name { color:#00FF8899; }
.bit-box.on .bit-val  { color:#00FF88; text-shadow:0 0 6px #00FF88; }
.bit-box.on:hover { border-color:#FFD060; background:#0A0800; }
.bit-box.writing { border-color:#FFD060 !important; animation:blink .3s 3; }
.bit-label-row { display:flex; gap:4px; margin-top:5px; }
.bit-label-inp {
  width:34px; background:transparent; border:none;
  border-bottom:1px solid #1A3A5C;
  color:#90AECA; font-family:'Consolas',monospace; font-size:8px;
  text-align:center; outline:none; padding:1px 0; flex-shrink:0;
}
.bit-label-inp:focus { border-bottom-color:#FFD060; color:#FFD060; }
.bit-sublabel {
  font-size:8px; color:#90AECA; text-align:center;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  width:34px; flex-shrink:0;
}
.bit-box.on + .bit-sublabel,
.bit-sublabel.on { color:#00FF8899; }

/* ══ Device 선택 pill ══ */
.dev-pills { display:none; margin-left:16px; align-items:center; gap:4px; }
.dev-pills.show { display:flex; }
.dev-pill-label { font-size:9px; color:#7090B0; margin-right:4px; }
.dev-pill {
    padding:2px 10px; border-radius:3px; cursor:pointer;
    background:transparent; border:1px solid #4A2A6A;
    color:#B24BF3; font-family:'Consolas',monospace; font-size:12px; font-weight:bold;
    transition:all .12s; line-height:1.7;
}
/* 디바이스별 inactive 색상 */
.dev-pill[data-dev="D"] { color:#00D4FF; border-color:#00D4FF44; }
.dev-pill[data-dev="W"] { color:#4499FF; border-color:#4499FF44; }
.dev-pill[data-dev="R"] { color:#00E8C0; border-color:#00E8C044; }
.dev-pill[data-dev="M"] { color:#FF8844; border-color:#FF884444; }
.dev-pill[data-dev="L"] { color:#FFD060; border-color:#FFD06044; }
.dev-pill[data-dev="X"] { color:#00FF88; border-color:#00FF8844; }
.dev-pill[data-dev="Y"] { color:#88FF44; border-color:#88FF4444; }
.dev-pill[data-dev="B"] { color:#CC55FF; border-color:#CC55FF44; }
.dev-pill[data-dev="S"] { color:#FF5599; border-color:#FF559944; }
/* 디바이스별 active 색상 */
.dev-pill[data-dev="D"].active { background:#00D4FF; color:#07090F; border-color:#00D4FF; }
.dev-pill[data-dev="W"].active { background:#4499FF; color:#07090F; border-color:#4499FF; }
.dev-pill[data-dev="R"].active { background:#00E8C0; color:#07090F; border-color:#00E8C0; }
.dev-pill[data-dev="M"].active { background:#FF8844; color:#07090F; border-color:#FF8844; }
.dev-pill[data-dev="L"].active { background:#FFD060; color:#07090F; border-color:#FFD060; }
.dev-pill[data-dev="X"].active { background:#00FF88; color:#07090F; border-color:#00FF88; }
.dev-pill[data-dev="Y"].active { background:#88FF44; color:#07090F; border-color:#88FF44; }
.dev-pill[data-dev="B"].active { background:#CC55FF; color:#07090F; border-color:#CC55FF; }
.dev-pill[data-dev="S"].active { background:#FF5599; color:#07090F; border-color:#FF5599; }
/* hover */
.dev-pill[data-dev="D"]:hover:not(.active) { background:#00D4FF1A; border-color:#00D4FF; }
.dev-pill[data-dev="W"]:hover:not(.active) { background:#4499FF1A; border-color:#4499FF; }
.dev-pill[data-dev="R"]:hover:not(.active) { background:#00E8C01A; border-color:#00E8C0; }
.dev-pill[data-dev="M"]:hover:not(.active) { background:#FF88441A; border-color:#FF8844; }
.dev-pill[data-dev="L"]:hover:not(.active) { background:#FFD0601A; border-color:#FFD060; }
.dev-pill[data-dev="X"]:hover:not(.active) { background:#00FF881A; border-color:#00FF88; }
.dev-pill[data-dev="Y"]:hover:not(.active) { background:#88FF441A; border-color:#88FF44; }
.dev-pill[data-dev="B"]:hover:not(.active) { background:#CC55FF1A; border-color:#CC55FF; }
.dev-pill[data-dev="S"]:hover:not(.active) { background:#FF55991A; border-color:#FF5599; }

/* ══ PLC 추가 모달 ══ */
.modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:999; align-items:center; justify-content:center; }
.modal-overlay.show { display:flex; }
.modal-box { background:#0D1128; border:1px solid #2A4A6A; border-radius:6px; padding:20px 24px; width:420px; }
.modal-box h3 { font-size:13px; color:#FFD060; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid #1A3A5C; }
.modal-field { margin-bottom:10px; }
.modal-field label { display:block; font-size:10px; color:#5A7FA0; margin-bottom:4px; }
.modal-field input, .modal-field select { width:100%; }
.modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:14px; padding-top:12px; border-top:1px solid #1A3A5C; }
</style>
</head>
<body>
<script>var now_page_code = "b01";</script>

<div>
  <div class="page-title">PLC  MONITOR</div>
  <div class="page-sub">// Multi-PLC  ·  LS FEnet / Mitsubishi MC3E / Modbus TCP  ·  Browser → Spring → C# → PLC</div>
</div>
<jsp:include page="/WEB-INF/views/include/monitorNav.jsp"/>
<div class="divider"></div>

<!-- ══ PLC 탭 바 ══ -->
<div class="plc-tab-bar" id="plcTabBar">
  <button class="btn-add-modbus" onclick="openModbusAddModal()">Modbus TCP ADD</button>
  <button class="btn-add-plc" onclick="openAddModal()">＋  PLC 추가</button>
</div>

<!-- ══ PLC 접속 설정 (현재 탭) ══ -->
<div class="cfg-panel" id="connPanel">
  <div class="panel-head">
    <div class="acc" style="background:#FFD060"></div>
    <span style="color:#FFD060">PLC  CONNECTION</span>
    <span class="badge badge-ls" id="plcTypeBadge" style="margin-left:8px">LS XGT</span>
    <div class="conn-dot" id="connDot" style="margin-left:10px"></div>
    <span class="conn-msg" id="connMsg">미확인</span>
  </div>
  <div class="cfg-row">
    <span class="cfg-label">제조사</span>
    <select class="plc-inp" id="selPlcType" onchange="onPlcTypeChange()">
      <option value="LS">LS  (XGT / FEnet)</option>
      <option value="MITSUBISHI">Mitsubishi  (Q시리즈 / MC 3E)</option>
      <option value="MODBUS_TCP">Modbus TCP  (Holding Register)</option>
    </select>
    <span class="cfg-label">IP</span>
    <input class="plc-inp ip" id="inpPlcIp" type="text" value="192.168.1.238">
    <span class="cfg-label">Port</span>
    <input class="plc-inp port" id="inpPlcPort" type="number" value="2004">
    <span class="cfg-label">이름</span>
    <input class="plc-inp label" id="inpPlcLabel" type="text" value="PLC-1">
    <button class="btn btn-yellow" onclick="applyConn()">적용</button>
    <button class="btn btn-green"  onclick="pingCurrent()">연결 테스트</button>
  </div>
</div>

<!-- ══ 통계 ══ -->
<div class="stats-row">
  <div class="stat-card sc-read-ok">
    <span class="sc-label">READ  OK</span><span class="sc-val" id="cntReadOk">0</span><span class="sc-sub">청크 성공</span>
  </div>
  <div class="stat-card sc-read-fail">
    <span class="sc-label">READ  FAIL</span><span class="sc-val" id="cntReadFail">0</span><span class="sc-sub">청크 실패</span>
  </div>
  <div class="stat-card sc-write-ok">
    <span class="sc-label">WRITE  OK</span><span class="sc-val" id="cntWriteOk">0</span><span class="sc-sub">성공 횟수</span>
  </div>
  <div class="stat-card sc-write-fail">
    <span class="sc-label">WRITE  FAIL</span><span class="sc-val" id="cntWriteFail">0</span><span class="sc-sub">실패 횟수</span>
  </div>
  <div class="stat-card sc-elapsed">
    <span class="sc-label">ELAPSED</span><span class="sc-val" id="cntElapsed">—</span><span class="sc-sub" id="cntElapsedSub">폴링 미시작</span>
  </div>
</div>

<!-- ══ 범위/폴링 설정 ══ -->
<div class="cfg-panel">
  <div class="panel-head" style="padding:8px 14px">
    <div class="acc" style="background:#B24BF3"></div>
    <span style="color:#B24BF3">RANGE  CONFIG</span>
    <div class="dev-pills" id="mitsDevicePicker">
      <span class="dev-pill-label">DEVICE</span>
      <button class="dev-pill active" data-dev="D" onclick="selectMitsDev(this,'D')">D</button>
      <button class="dev-pill" data-dev="W" onclick="selectMitsDev(this,'W')">W</button>
      <button class="dev-pill" data-dev="R" onclick="selectMitsDev(this,'R')">R</button>
      <button class="dev-pill" data-dev="M" onclick="selectMitsDev(this,'M')">M</button>
      <button class="dev-pill" data-dev="L" onclick="selectMitsDev(this,'L')">L</button>
      <button class="dev-pill" data-dev="X" onclick="selectMitsDev(this,'X')">X</button>
      <button class="dev-pill" data-dev="Y" onclick="selectMitsDev(this,'Y')">Y</button>
      <button class="dev-pill" data-dev="B" onclick="selectMitsDev(this,'B')">B</button>
      <button class="dev-pill" data-dev="S" onclick="selectMitsDev(this,'S')">S</button>
    </div>
    <span style="color:#7090B0; font-size:9px; margin-left:10px" id="chunkInfo"></span>
  </div>
  <!-- LS / Modbus 공용 행 -->
  <div class="cfg-row" id="rangeRowDefault">
    <span class="cfg-label" id="cfgStartLabel">시작 D주소</span>
    <input class="cfg-inp" id="cfgStart" type="number" value="10000" min="0" max="65535">
    <span class="cfg-label">읽을 개수</span>
    <input class="cfg-inp" id="cfgCount" type="number" value="100" min="1" max="9900" oninput="updateChunkInfo()">
    <span class="cfg-label">청크 크기</span>
    <select class="cfg-inp" id="cfgChunkSize" oninput="updateChunkInfo()" style="color:#B24BF3;border-color:#4A2A6A;width:85px">
      <option value="50">50개</option>
      <option value="100" selected>100개</option>
      <option value="200">200개</option>
    </select>
    <span class="cfg-label">폴링 간격</span>
    <select class="cfg-inp" id="cfgInterval" style="width:90px">
      <option value="300">300ms</option>
      <option value="500">500ms</option>
      <option value="1000" selected>1000ms</option>
      <option value="2000">2000ms</option>
      <option value="5000">5000ms</option>
    </select>
    <button class="btn btn-cyan" id="btnStart" onclick="startPolling()">▶  시작</button>
    <button class="btn btn-red"  id="btnStop"  onclick="stopPolling()" style="display:none">■  중지</button>
    <span id="lsNotice" style="display:none;color:#FFD060;font-size:10px;border:1px solid rgba(255,208,96,0.4);padding:2px 8px;border-radius:2px;margin-left:4px">D 영역 지원 · M/C 영역 구현중</span>
  </div>
  <!-- Mitsubishi 전용 행 -->
  <div class="cfg-row" id="rangeRowMits" style="display:none">
    <input type="hidden" id="cfgMitsDevice" value="D">
    <span class="cfg-label">시작 주소</span>
    <input class="cfg-inp" id="cfgMitsStart" type="number" value="0" min="0" max="65535">
    <span class="cfg-label">읽을 개수</span>
    <input class="cfg-inp" id="cfgMitsCount" type="number" value="20" min="1" max="960">
    <span class="cfg-label">폴링 간격</span>
    <select class="cfg-inp" id="cfgMitsInterval" style="width:90px">
      <option value="300">300ms</option>
      <option value="500">500ms</option>
      <option value="1000" selected>1000ms</option>
      <option value="2000">2000ms</option>
      <option value="5000">5000ms</option>
    </select>
    <button class="btn btn-cyan" id="btnStartMits" onclick="startPolling()">▶  시작</button>
    <button class="btn btn-red"  id="btnStopMits"  onclick="stopPolling()" style="display:none">■  중지</button>
  </div>
  <div class="chunk-bar-wrap" id="chunkBarWrap">
    <span style="font-size:9px;color:#5A7FA0;white-space:nowrap">CHUNKS</span>
    <div class="chunk-pips" id="chunkPips"></div>
    <div class="chunk-track"><div class="chunk-fill" id="chunkFill"></div></div>
    <span style="font-size:9px;color:#5A7FA0;min-width:34px;text-align:right" id="chunkProgressTxt">—</span>
  </div>
  <div class="sbar">
    <div class="spin" id="spinner"></div>
    <div class="s-dot" id="sDot"></div>
    <span class="s-msg" id="sMsg">대기 중</span>
    <span class="s-cnt" id="sCnt"></span>
  </div>
</div>

<!-- ══ 3분할 ══ -->
<div class="main-grid">
  <div class="panel">
    <div class="panel-head">
      <div class="acc" style="background:#00F0FF"></div>
      <span style="color:#00F0FF">READ  —  실시간 모니터링</span>
      <span style="color:#7090B0;font-size:10px;margin-left:4px" id="rangeLabel"></span>
    </div>
    <div class="read-scroll">
      <table class="r-table">
        <thead><tr>
          <th style="width:70px" id="readAddrHeader">D주소</th>
          <th style="width:68px">영역</th>
          <th style="width:60px">DEC</th>
          <th style="width:60px">HEX</th>
          <th>BIN</th>
          <th style="width:70px">갱신시각</th>
        </tr></thead>
        <tbody id="readBody">
          <tr><td colspan="6" style="color:#7090B0;text-align:center;padding:24px">폴링 시작 후 표시</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="panel">
    <div class="panel-head">
      <div class="acc" style="background:#00FF88"></div>
      <span style="color:#00FF88">WRITE  —  PLC 값 쓰기</span>
    </div>
    <div class="write-scroll" id="writeBody">
      <div style="color:#7090B0;text-align:center;padding:20px;font-size:11px">폴링 시작 후 표시</div>
    </div>
    <div class="sbar">
      <div class="s-dot" id="wDot"></div>
      <span class="s-msg" id="wMsg">대기 중</span>
    </div>
  </div>
  <div class="con-panel">
    <div class="con-head">
      <span>▸  LOG</span>
      <button class="btn-cl" onclick="clearLog()">CLR</button>
    </div>
    <div class="con-body" id="conBody"></div>
  </div>
</div>

<!-- ══ 비트 패널 ══ -->
<div class="bit-panel-wrap">
  <div class="bit-panel-head">
    <div class="acc" style="background:#FFD060"></div>
    <span style="color:#FFD060">BIT  MONITOR</span>
    <span style="color:#7090B0;font-size:9px;margin-left:6px">// 워드 → 비트 분해  ·  LS D주소 기준</span>
    <div style="margin-left:auto;display:flex;align-items:center;gap:6px">
      <span class="cfg-label">D주소</span>
      <input class="cfg-inp" id="bitAddAddr" type="number" placeholder="예: 2" style="width:72px" onkeydown="if(event.key==='Enter')addBitMonitor()">
      <span class="cfg-label">이름</span>
      <input class="cfg-inp" id="bitAddLabel" type="text" placeholder="선택" style="width:90px;color:#A8D8F0" onkeydown="if(event.key==='Enter')addBitMonitor()">
      <button class="btn btn-yellow" onclick="addBitMonitor()">추가</button>
    </div>
  </div>
  <div class="bit-cards" id="bitCards">
    <div style="color:#2A4A6A;font-size:11px;padding:8px 4px">D주소 입력 후 추가 버튼을 누르세요  //  예: D2 → 비트 0~F 표시</div>
  </div>
</div>

<!-- ══ PLC 추가 모달 ══ -->
<div class="modal-overlay" id="addModal">
  <div class="modal-box">
    <h3>PLC 추가</h3>
    <div class="modal-field">
      <label>ID (영문/숫자, 고유값)</label>
      <input class="plc-inp" id="addId" type="text" placeholder="예: plc2" style="width:100%">
    </div>
    <div class="modal-field">
      <label>표시 이름</label>
      <input class="plc-inp label" id="addLabel" type="text" placeholder="예: 2호기 라인" style="width:100%">
    </div>
    <div class="modal-field">
      <label>제조사</label>
      <select class="plc-inp" id="addType" onchange="onAddTypeChange()" style="width:100%">
        <option value="LS">LS  (XGT / FEnet)</option>
        <option value="MITSUBISHI">Mitsubishi  (Q시리즈 / MC 3E)</option>
        <option value="MODBUS_TCP">Modbus TCP  (Holding Register)</option>
      </select>
    </div>
    <div class="modal-field">
      <label>IP 주소</label>
      <input class="plc-inp ip" id="addIp" type="text" value="192.168.1." style="width:100%">
    </div>
    <div class="modal-field">
      <label>Port</label>
      <input class="plc-inp port" id="addPort" type="number" value="2004" style="width:100%">
    </div>
    <div class="modal-actions">
      <button class="btn btn-red"    onclick="closeAddModal()">취소</button>
      <button class="btn btn-yellow" onclick="confirmAdd()">추가</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="addModbusModal">
  <div class="modal-box">
    <h3>Modbus TCP Add</h3>
    <div class="modal-field">
      <label>ID</label>
      <input class="plc-inp" id="addModbusId" type="text" placeholder="ex: modbus1" style="width:100%">
    </div>
    <div class="modal-field">
      <label>Display Name</label>
      <input class="plc-inp label" id="addModbusLabel" type="text" placeholder="ex: Modbus Line-1" style="width:100%">
    </div>
    <div class="modal-field">
      <label>IP Address</label>
      <input class="plc-inp ip" id="addModbusIp" type="text" value="192.168.1." style="width:100%">
    </div>
    <div class="modal-field">
      <label>Port</label>
      <input class="plc-inp port" id="addModbusPort" type="number" value="502" style="width:100%">
    </div>
    <div class="modal-actions">
      <button class="btn btn-red" onclick="closeModbusAddModal()">Cancel</button>
      <button class="btn btn-yellow" onclick="confirmAddModbus()">Add</button>
    </div>
  </div>
</div>

<script>
// ══════════════════════════════════════════════════════════
//  다중 PLC 상태 관리
//  plcMap[id] = { label, ip, port, plcType,
//                 polling: { timer, elapsed, cycle, ... },
//                 stats:   { readOk, readFail, writeOk, writeFail },
//                 values:  { 'D10000': 123, ... },
//                 prevValues: {} }
// ══════════════════════════════════════════════════════════
var plcMap     = {};   // 등록된 PLC 정보
var currentId  = null; // 현재 선택된 탭 id
var plcIdCount = 1;    // 자동 id 생성 카운터

// ── 탭 렌더 ───────────────────────────────────────────────
function getDefaultPortByType(type) {
    if (type === 'MITSUBISHI') return 6004;
    if (type === 'MODBUS_TCP') return 502;
    return 2004;
}

function nextPlcId(prefix) {
    plcIdCount++;
    return (prefix || 'plc') + plcIdCount;
}

function buildPlcState(id, label, ip, port, plcType) {
    return {
        label: label,
        ip: ip,
        port: port,
        plcType: plcType,
        connOk: null,
        connMsg: '미확인',
        stats:   { readOk:0, readFail:0, writeOk:0, writeFail:0 },
        values:  {},
        prevValues: {},
        chunks:  [],
        polling: { running:false, timer:null, elapsedTimer:null, startTime:null, cycle:0,
                   chunkIdx:0, isChunking:false, writeBuilt:false }
    };
}

function isModbusType(plcType) {
    return plcType === 'MODBUS_TCP';
}

// Modbus 주소가 비트 영역(0x/1x/2x)인지 여부
function isBitArea(addr) {
    return (addr >= 1 && addr <= 9999)
        || (addr >= 10001 && addr <= 19999)
        || (addr >= 20001 && addr <= 29999);
}
// 쓰기 가능 여부 (2x Discrete Input, 3x Input Register는 읽기 전용)
function isReadOnly(addr, plcType, device) {
    if (plcType === 'MITSUBISHI') return device === 'X';
    if (!isModbusType(plcType)) return false;
    return (addr >= 20001 && addr <= 29999) || (addr >= 30001 && addr <= 39999);
}

// 미쓰비시 비트 디바이스 여부 (X/Y/M/L/B/S = 비트, D/W/R = 워드)
function isMitsBitDevice(device) {
    return device === 'X' || device === 'Y' || device === 'M' || device === 'L' || device === 'B' || device === 'S';
}

// X/Y는 8진수 라벨(8,9 없음 · X7 다음이 X10)이라 base+offset을 그냥 더하면 안 되고
// 8진수 연산으로 offset만큼 이동해야 한다. 나머지 디바이스는 10진수라 그냥 더한다.
function mitsAddrAt(baseAddr, offset, device) {
    if (device !== 'X' && device !== 'Y') return baseAddr + offset;
    var real = parseInt(String(baseAddr), 8) + offset;
    return parseInt(real.toString(8), 10);
}

// Modbus 주소 → 영역 배지 HTML (MODBUS_TCP일 때만 표시)
function modbusAreaBadge(addr, plcType) {
    if (!isModbusType(plcType)) return '<span style="color:#2A4A6A;font-size:9px">—</span>';
    if (addr >= 1     && addr <= 9999)  return '<span class="area-badge area-1x">0x COIL</span>';
    if (addr >= 10001 && addr <= 19999) return '<span class="area-badge area-1x">1x COIL</span>';
    if (addr >= 20001 && addr <= 29999) return '<span class="area-badge area-2x">2x DI</span>';
    if (addr >= 30001 && addr <= 39999) return '<span class="area-badge area-3x">3x INPUT</span>';
    if (addr >= 40001 && addr <= 49999) return '<span class="area-badge area-4x">4x HOLD</span>';
    return '<span class="area-badge area-raw">RAW</span>';
}

function getPlcTypeById(plcId) {
    return (plcId && plcMap[plcId] && plcMap[plcId].plcType) ? plcMap[plcId].plcType : 'LS';
}

function addrLabelByType(addr, plcType, device) {
    if (isModbusType(plcType)) return String(addr);
    if (plcType === 'MITSUBISHI') return (device || 'D') + addr;
    return 'D' + addr;
}

function addrLabel(addr, plcId) {
    var pid = plcId || currentId;
    var p   = plcMap[pid];
    var dev = (p && p.polling && p.polling.device) ? p.polling.device : 'D';
    return addrLabelByType(addr, p ? p.plcType : 'LS', dev);
}

function updateRangePanel(plcType) {
    var defRow  = document.getElementById('rangeRowDefault');
    var mitsRow = document.getElementById('rangeRowMits');
    var lsNote  = document.getElementById('lsNotice');
    var startLbl = document.getElementById('cfgStartLabel');
    var addrHdr  = document.getElementById('readAddrHeader');
    var picker   = document.getElementById('mitsDevicePicker');
    if (plcType === 'MITSUBISHI') {
        defRow.style.display  = 'none';
        mitsRow.style.display = '';
        if (picker)  picker.classList.add('show');
        if (addrHdr) addrHdr.textContent = '주소';
    } else {
        defRow.style.display  = '';
        mitsRow.style.display = 'none';
        if (picker)  picker.classList.remove('show');
        var isMB = isModbusType(plcType);
        if (startLbl) startLbl.textContent = isMB ? '시작 주소' : '시작 D주소';
        if (lsNote)   lsNote.style.display = (plcType === 'LS') ? '' : 'none';
        if (addrHdr)  addrHdr.textContent  = isMB ? '주소' : 'D주소';
    }
}

function selectMitsDev(btn, dev) {
    document.querySelectorAll('.dev-pill').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('cfgMitsDevice').value = dev;
    var addrHdr = document.getElementById('readAddrHeader');
    if (addrHdr) addrHdr.textContent = dev + '주소';
}

function updatePollingButtons(running) {
    ['btnStart','btnStartMits'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = running ? 'none' : '';
    });
    ['btnStop','btnStopMits'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = running ? '' : 'none';
    });
}

function renderTabs() {
    var bar = document.getElementById('plcTabBar');
    var html = '';
    Object.keys(plcMap).forEach(function(id) {
        var p   = plcMap[id];
        var pol = p.polling;
        var dotCls = pol.running ? 'run' : (p.connOk === true ? 'ok' : p.connOk === false ? 'err' : '');
        var active  = id === currentId ? ' active' : '';
        html += '<div class="plc-tab' + active + '" id="tab_' + id + '" onclick="selectTab(\'' + id + '\')">'
              + '<div class="tab-dot ' + dotCls + '"></div>'
              + '<span>' + esc(p.label) + '</span>'
              + '<span class="tab-badge">' + p.plcType + '</span>'
              + '<span class="tab-close" onclick="removePlc(event,\'' + id + '\')">✕</span>'
              + '</div>';
    });
    html += '<button class="btn-add-plc" onclick="openAddModal()">＋  PLC 추가</button>';
    html += '<button class="btn-add-modbus" onclick="openModbusAddModal()">Modbus TCP ADD</button>';
    bar.innerHTML = html;
}

function selectTab(id) {
    if (currentId === id) return;
    currentId = id;
    renderTabs();
    loadTabState();
}

function loadTabState() {
    if (!currentId || !plcMap[currentId]) return;
    var p = plcMap[currentId];

    // 접속 설정 패널 반영
    document.getElementById('selPlcType').value  = p.plcType;
    document.getElementById('inpPlcIp').value    = p.ip;
    document.getElementById('inpPlcPort').value  = p.port;
    document.getElementById('inpPlcLabel').value = p.label;
    if (p.plcType === 'MODBUS_TCP') {
        var startEl = document.getElementById('cfgStart');
        var curStart = parseInt(startEl.value, 10);
        if (isNaN(curStart) || curStart >= 10000) {
            startEl.value = 0;
            updateChunkInfo();
        }
    }
    updateTypeBadge(p.plcType);
    updateRangePanel(p.plcType);
    setConnStatus(p.connMsg || '미확인', p.connOk === true ? 'ok' : p.connOk === false ? 'err' : '');

    // 통계
    var s = p.stats;
    document.getElementById('cntReadOk').textContent    = s.readOk;
    document.getElementById('cntReadFail').textContent  = s.readFail;
    document.getElementById('cntWriteOk').textContent   = s.writeOk;
    document.getElementById('cntWriteFail').textContent = s.writeFail;

    // 폴링 버튼
    updatePollingButtons(p.polling.running);
    document.getElementById('spinner').className = 'spin' + (p.polling.running ? ' on' : '');

    // 읽기 테이블/쓰기 패널 재렌더
    if (Object.keys(p.values).length > 0) {
        flushReadTable();
        buildAllWriteRows();
    } else {
        document.getElementById('readBody').innerHTML =
            '<tr><td colspan="6" style="color:#2A4A6A;text-align:center;padding:24px">폴링 시작 후 표시</td></tr>';
        document.getElementById('writeBody').innerHTML =
            '<div style="color:#2A4A6A;text-align:center;padding:20px;font-size:11px">폴링 시작 후 표시</div>';
    }
    setStatus(p.polling.running ? '폴링 중...' : '대기 중', p.polling.running ? '' : '');
}

// ── PLC 추가 ──────────────────────────────────────────────
function openAddModal() {
    var newId = nextPlcId('plc');
    document.getElementById('addId').value    = newId;
    document.getElementById('addLabel').value = 'PLC-' + plcIdCount;
    document.getElementById('addType').value  = 'LS';
    document.getElementById('addIp').value    = '192.168.1.';
    document.getElementById('addPort').value  = getDefaultPortByType('LS');
    document.getElementById('addModal').classList.add('show');
}
function closeAddModal() { document.getElementById('addModal').classList.remove('show'); }
function onAddTypeChange() {
    var t = document.getElementById('addType').value;
    document.getElementById('addPort').value = getDefaultPortByType(t);
}

function confirmAdd() {
    var id      = document.getElementById('addId').value.trim();
    var label   = document.getElementById('addLabel').value.trim() || id;
    var plcType = document.getElementById('addType').value;
    var ip      = document.getElementById('addIp').value.trim();
    var port    = parseInt(document.getElementById('addPort').value);

    if (!id || !ip) { alert('ID와 IP를 입력하세요'); return; }
    if (plcMap[id]) { alert('이미 존재하는 ID입니다: ' + id); return; }

    // C# API에 등록
    fetch('/sample_pro/plc/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ip, port, plcType, label })
    })
    .then(r => r.json())
    .then(d => {
        if (!d.success) { clog('ADD 실패: ' + d.error, 'e'); return; }
        plcMap[id] = {
            label, ip, port, plcType,
            connOk: null, connMsg: '미확인',
            stats:   { readOk:0, readFail:0, writeOk:0, writeFail:0 },
            values:  {},
            prevValues: {},
            chunks:  [],
            polling: { running:false, timer:null, elapsedTimer:null, startTime:null, cycle:0,
                       chunkIdx:0, isChunking:false, writeBuilt:false }
        };
        closeAddModal();
        renderTabs();
        selectTab(id);
        clog('PLC 추가: [' + id + '] ' + label + '  ' + plcType + '  ' + ip + ':' + port, 'w');
    })
    .catch(e => clog('ADD ERR: ' + e.message, 'e'));
}

// ── PLC 제거 ──────────────────────────────────────────────
function openModbusAddModal() {
    var newId = nextPlcId('modbus');
    document.getElementById('addModbusId').value = newId;
    document.getElementById('addModbusLabel').value = 'MODBUS-' + plcIdCount;
    document.getElementById('addModbusIp').value = '192.168.1.';
    document.getElementById('addModbusPort').value = getDefaultPortByType('MODBUS_TCP');
    document.getElementById('addModbusModal').classList.add('show');
}

function closeModbusAddModal() {
    document.getElementById('addModbusModal').classList.remove('show');
}

function confirmAddModbus() {
    var id = document.getElementById('addModbusId').value.trim();
    var label = document.getElementById('addModbusLabel').value.trim() || id;
    var ip = document.getElementById('addModbusIp').value.trim();
    var port = parseInt(document.getElementById('addModbusPort').value, 10);
    var plcType = 'MODBUS_TCP';

    if (!id || !ip) { alert('ID and IP are required'); return; }
    if (plcMap[id]) { alert('ID already exists: ' + id); return; }
    if (isNaN(port) || port < 1 || port > 65535) port = getDefaultPortByType(plcType);

    fetch('/sample_pro/plc/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, ip: ip, port: port, plcType: plcType, label: label })
    })
    .then(r => r.json())
    .then(d => {
        if (!d.success) { clog('ADD FAIL: ' + d.error, 'e'); return; }
        plcMap[id] = buildPlcState(id, label, ip, port, plcType);
        closeModbusAddModal();
        renderTabs();
        selectTab(id);
        clog('PLC ADDED: [' + id + '] ' + label + '  ' + plcType + '  ' + ip + ':' + port, 'w');
    })
    .catch(e => clog('ADD ERR: ' + e.message, 'e'));
}

function removePlc(e, id) {
    e.stopPropagation();
    if (!confirm('[' + plcMap[id].label + '] 을(를) 제거하시겠습니까?')) return;

    var p = plcMap[id];
    if (p.polling.running) {
        clearInterval(p.polling.timer);
        clearInterval(p.polling.elapsedTimer);
    }

    fetch('/sample_pro/plc/remove/' + id, { method: 'DELETE' }).catch(() => {});
    delete plcMap[id];

    if (currentId === id) {
        var ids = Object.keys(plcMap);
        currentId = ids.length ? ids[0] : null;
    }
    renderTabs();
    if (currentId) loadTabState();
    clog('PLC 제거: ' + id, 'x');
}

// ── 접속 설정 적용 ────────────────────────────────────────
function onPlcTypeChange() {
    var t = document.getElementById('selPlcType').value;
    document.getElementById('inpPlcPort').value = getDefaultPortByType(t);
    updateRangePanel(t);
    if (t === 'MODBUS_TCP') {
        var startEl = document.getElementById('cfgStart');
        var curStart = parseInt(startEl.value, 10);
        if (isNaN(curStart) || curStart >= 10000) {
            startEl.value = 0;
            updateChunkInfo();
        }
    }
}

function applyConn() {
    if (!currentId) { alert('PLC를 먼저 추가하세요'); return; }
    var ip      = document.getElementById('inpPlcIp').value.trim();
    var port    = parseInt(document.getElementById('inpPlcPort').value);
    var plcType = document.getElementById('selPlcType').value;
    var label   = document.getElementById('inpPlcLabel').value.trim();

    fetch('/sample_pro/plc/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentId, ip, port, plcType, label })
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            Object.assign(plcMap[currentId], { ip, port, plcType, label });
            updateTypeBadge(plcType);
            setConnStatus('적용 완료', '');
            renderTabs();
            clog('CONFIG 적용 [' + currentId + '] ' + plcType + ' ' + ip + ':' + port, 'w');
        } else {
            clog('CONFIG 실패: ' + d.error, 'e');
        }
    })
    .catch(e => clog('CONFIG ERR: ' + e.message, 'e'));
}

function pingCurrent() {
    if (!currentId) return;
    setConnStatus('테스트 중...', '');
    fetch('/sample_pro/plc/ping/' + currentId)
    .then(r => r.json())
    .then(d => {
        var ok = !!d.success;
        plcMap[currentId].connOk  = ok;
        plcMap[currentId].connMsg = d.message || (ok ? '연결 성공' : '연결 실패');
        setConnStatus(plcMap[currentId].connMsg, ok ? 'ok' : 'err');
        renderTabs();
        clog('PING [' + currentId + '] ' + (ok ? 'OK' : 'FAIL') + '  ' + plcMap[currentId].connMsg, ok ? 'w' : 'e');
    })
    .catch(e => { setConnStatus('오류', 'err'); clog('PING ERR: ' + e.message, 'e'); });
}

function updateTypeBadge(type) {
    var el = document.getElementById('plcTypeBadge');
    if (type === 'MITSUBISHI') { el.textContent = 'Mitsubishi Q'; el.className = 'badge badge-mits'; return; }
    if (type === 'MODBUS_TCP') { el.textContent = 'Modbus TCP';   el.className = 'badge badge-modbus'; return; }
    el.textContent = 'LS XGT';
    el.className = 'badge badge-ls';
}
function setConnStatus(msg, cls) {
    document.getElementById('connMsg').textContent = msg;
    document.getElementById('connMsg').className   = 'conn-msg ' + (cls||'');
    document.getElementById('connDot').className   = 'conn-dot ' + (cls||'');
}

// ── 청크 계산 ─────────────────────────────────────────────
function calcChunks(start, count, size) {
    var res = [], rem = count, cur = start;
    while (rem > 0) { var sz = Math.min(rem,size); res.push({start:cur,count:sz}); cur+=sz; rem-=sz; }
    return res;
}
function updateChunkInfo() {
    var n = Math.ceil((parseInt(document.getElementById('cfgCount').value)||100)
                    / (parseInt(document.getElementById('cfgChunkSize').value)||100));
    document.getElementById('chunkInfo').textContent =
        '// ' + (parseInt(document.getElementById('cfgCount').value)||100) + '개  →  ' + n + '청크';
}
function buildChunkPips(n) {
    var h=''; for(var i=0;i<n;i++) h+='<div class="chunk-pip" id="cpip_'+i+'">'+(i+1)+'</div>';
    document.getElementById('chunkPips').innerHTML = h;
}
function setPip(i,st){ var el=document.getElementById('cpip_'+i); if(el) el.className='chunk-pip'+(st?' '+st:''); }
function setChunkProgress(done,total){
    document.getElementById('chunkFill').style.width=(total?Math.round(done/total*100):0)+'%';
    document.getElementById('chunkProgressTxt').textContent=done+'/'+total;
}

// ── 폴링 ──────────────────────────────────────────────────
function startPolling() {
    if (!currentId) { alert('PLC를 먼저 추가하세요'); return; }
    var p = plcMap[currentId];
    if (p.polling.running) return;

    var isMits = (p.plcType === 'MITSUBISHI');
    var start, count, interval, size, device;
    if (isMits) {
        device   = document.getElementById('cfgMitsDevice').value || 'D';
        start    = parseInt(document.getElementById('cfgMitsStart').value)    || 0;
        count    = Math.min(parseInt(document.getElementById('cfgMitsCount').value) || 20, 960);
        interval = parseInt(document.getElementById('cfgMitsInterval').value) || 1000;
        size     = count;
    } else {
        device   = 'D';
        start    = parseInt(document.getElementById('cfgStart').value)    || 10000;
        count    = parseInt(document.getElementById('cfgCount').value)    || 100;
        interval = parseInt(document.getElementById('cfgInterval').value) || 1000;
        size     = parseInt(document.getElementById('cfgChunkSize').value)|| 100;
    }

    p.polling.device = device;
    p.chunks = calcChunks(start, count, size);
    p.polling.cycle = 0; p.polling.writeBuilt = false;
    p.polling.isChunking = false; p.polling.chunkIdx = 0;
    p.values = {}; p.prevValues = {};

    buildChunkPips(p.chunks.length);
    document.getElementById('chunkBarWrap').classList.add('visible');
    setChunkProgress(0, p.chunks.length);

    p.polling.startTime = Date.now();
    if (p.polling.elapsedTimer) clearInterval(p.polling.elapsedTimer);
    p.polling.elapsedTimer = setInterval(function(){ updateElapsed(currentId); }, 1000);

    document.getElementById('rangeLabel').textContent =
        '// '+addrLabelByType(start, p.plcType, device)+'~'+addrLabelByType(mitsAddrAt(start, count-1, device), p.plcType, device)+'  ('+count+'개  '+p.chunks.length+'청크)';
    updatePollingButtons(true);
    document.getElementById('spinner').classList.add('on');
    p.polling.running = true;
    if (!isMits) updateChunkInfo();
    setStatus('폴링 중...', '');
    renderTabs();
    clog('시작 ['+currentId+'] '+addrLabelByType(start, p.plcType, device)+'~'+addrLabelByType(mitsAddrAt(start, count-1, device), p.plcType, device)+'  간격='+interval+'ms', 'r');

    startChunkCycle(currentId);
    var tid = currentId;
    p.polling.timer = setInterval(function(){
        if (plcMap[tid] && !plcMap[tid].polling.isChunking) startChunkCycle(tid);
    }, interval);
}

function stopPolling() {
    if (!currentId || !plcMap[currentId]) return;
    var p = plcMap[currentId];
    clearInterval(p.polling.timer); p.polling.timer = null;
    clearInterval(p.polling.elapsedTimer); p.polling.elapsedTimer = null;
    p.polling.running = false; p.polling.isChunking = false;

    updatePollingButtons(false);
    document.getElementById('spinner').classList.remove('on');
    document.getElementById('sDot').className = 's-dot';
    document.getElementById('cntElapsedSub').textContent = '폴링 중지';
    setStatus('폴링 중지', '');
    renderTabs();
    clog('중지 ['+currentId+']', 'x');
}

function startChunkCycle(id) {
    var p = plcMap[id]; if (!p) return;
    p.polling.isChunking = true; p.polling.chunkIdx = 0;
    for(var i=0;i<p.chunks.length;i++) setPip(i,'');
    setChunkProgress(0, p.chunks.length);
    fetchNextChunk(id);
}

function fetchNextChunk(id) {
    var p = plcMap[id]; if (!p) return;
    var pol = p.polling;

    if (!pol.isChunking || pol.chunkIdx >= p.chunks.length) {
        pol.isChunking = false; pol.cycle++;
        if (id === currentId) {
            setStatus('수신 완료  (사이클 '+pol.cycle+')', 'ok');
            document.getElementById('sCnt').textContent = '사이클 '+pol.cycle+'회  '+new Date().toLocaleTimeString('ko-KR');
            flushReadTable();
            flushBitPanel();
            if (!pol.writeBuilt) { buildAllWriteRows(); pol.writeBuilt = true; }
            else updateAllWriteCur();
        }
        return;
    }

    var ci = pol.chunkIdx, chunk = p.chunks[ci];
    if (id === currentId) setPip(ci, 'active');

    var useBits = isModbusType(p.plcType) && isBitArea(chunk.start);
    var device  = (p.polling && p.polling.device) ? p.polling.device : 'D';
    var readUrl;
    if (isModbusType(p.plcType)) {
        readUrl = useBits
            ? '/sample_pro/plc/readBits/' + id + '?start=' + chunk.start + '&count=' + chunk.count
            : '/sample_pro/plc/read/'     + id + '?start=' + chunk.start + '&count=' + chunk.count;
    } else {
        readUrl = '/sample_pro/plc/read/' + id + '?start=' + chunk.start + '&count=' + chunk.count;
        if (p.plcType === 'MITSUBISHI') readUrl += '&device=' + encodeURIComponent(device);
    }

    fetch(readUrl)
    .then(function(res){ if(!res.ok) throw new Error('HTTP '+res.status); return res.json(); })
    .then(function(data){
        if(!data.success) throw new Error(data.error||'PLC 오류');
        for(var i=0;i<data.values.length;i++)
            p.values['D'+mitsAddrAt(chunk.start, i, device)] = data.values[i] != null ? data.values[i] : 0;

        p.stats.readOk++;
        if (id === currentId) {
            document.getElementById('cntReadOk').textContent = p.stats.readOk;
            setPip(ci, 'done');
            setChunkProgress(ci+1, p.chunks.length);
        }
        pol.chunkIdx++; fetchNextChunk(id);
    })
    .catch(function(e){
        p.stats.readFail++;
        if (id === currentId) {
            document.getElementById('cntReadFail').textContent = p.stats.readFail;
            setPip(ci, 'err');
            setStatus('청크 오류: '+e.message, 'err');
            clog('CHUNK['+(ci+1)+'] ERR '+e.message, 'e');
        }
        pol.chunkIdx++; fetchNextChunk(id);
    });
}

// ── 읽기 테이블 렌더 ──────────────────────────────────────
function flushReadTable() {
    if (!currentId) return;
    var p = plcMap[currentId];
    var now = new Date().toLocaleTimeString('ko-KR');
    var html = '', firstChunk = true;

    var dev = (p.polling && p.polling.device) ? p.polling.device : 'D';
    p.chunks.forEach(function(chunk, ci) {
        for(var i=0;i<chunk.count;i++){
            var dAddr = mitsAddrAt(chunk.start, i, dev), key='D'+dAddr;
            var val = p.values[key] != null ? p.values[key] : 0;
            var changed = (p.prevValues[key] !== undefined && p.prevValues[key] !== val);
            p.prevValues[key] = val;
            var hex = '0x'+val.toString(16).toUpperCase().padStart(4,'0');
            var bin = val.toString(2).padStart(16,'0').replace(/(.{4})/g,'$1 ').trim();
            var sep = (!firstChunk && i===0) ? ' chunk-sep' : '';
            firstChunk = false;
            html += '<tr class="'+(changed?'flash':'')+sep+'">'
                  + '<td class="td-addr">'+addrLabelByType(dAddr, p.plcType, dev)+'</td>'
                  + '<td class="td-area">'+modbusAreaBadge(dAddr, p.plcType)+'</td>'
                  + '<td class="td-dec">'+val+'</td>'
                  + '<td class="td-hex">'+hex+'</td>'
                  + '<td class="td-bin">'+bin+'</td>'
                  + '<td class="td-time">'+now+'</td></tr>';
        }
    });
    document.getElementById('readBody').innerHTML = html ||
        '<tr><td colspan="6" style="color:#2A4A6A;text-align:center;padding:16px">데이터 없음</td></tr>';
}

function buildAllWriteRows() {
    if (!currentId) return;
    var p = plcMap[currentId];
    var html = '';
    var wDev = (p.polling && p.polling.device) ? p.polling.device : 'D';
    p.chunks.forEach(function(chunk, ci){
        html += '<div class="w-chunk-head">CHUNK '+(ci+1)+'  //  '+addrLabelByType(chunk.start, p.plcType, wDev)+' ~ '+addrLabelByType(mitsAddrAt(chunk.start, chunk.count-1, wDev), p.plcType, wDev)+'</div>';
        for(var i=0;i<chunk.count;i++){
            var dAddr = mitsAddrAt(chunk.start, i, wDev);
            var val   = p.values['D'+dAddr] != null ? p.values['D'+dAddr] : 0;
            var rdOnly  = isReadOnly(dAddr, p.plcType, wDev);
            var isBit   = (isModbusType(p.plcType) && isBitArea(dAddr)) || (p.plcType === 'MITSUBISHI' && isMitsBitDevice(wDev));
            var maxVal  = isBit ? 1 : 65535;
            var inpAttr = rdOnly
                ? ' disabled style="opacity:.35;cursor:not-allowed"'
                : ' onkeydown="if(event.key===\'Enter\')doWrite(\''+currentId+'\','+dAddr+')"';
            var btnHtml = rdOnly
                ? '<span style="font-size:9px;color:#FF446688;width:52px;text-align:center;flex-shrink:0">READ ONLY</span>'
                : '<button class="w-btn" onclick="doWrite(\''+currentId+'\','+dAddr+')">WRITE</button>';
            html += '<div class="w-row">'
                  + '<span class="w-addr">'+addrLabelByType(dAddr, p.plcType, wDev)+'</span>'
                  + modbusAreaBadge(dAddr, p.plcType)
                  + '<span class="w-cur" id="wcur_'+dAddr+'">'+val+'</span>'
                  + '<span class="w-arrow">→</span>'
                  + '<input class="w-inp" id="winp_'+dAddr+'" type="number" value="'+val+'" min="0" max="'+maxVal+'"'+inpAttr+'>'
                  + btnHtml
                  + '</div>';
        }
    });
    html += '<div class="w-hint">값 입력 후 WRITE 또는 Enter</div>';
    document.getElementById('writeBody').innerHTML = html;
}

function updateAllWriteCur() {
    if (!currentId) return;
    var p = plcMap[currentId];
    Object.keys(p.values).forEach(function(key){
        var el = document.getElementById('wcur_'+key.substring(1));
        if (el) el.textContent = p.values[key];
    });
}

// ── 쓰기 ──────────────────────────────────────────────────
function doWrite(plcId, dAddr) {
    var p = plcMap[plcId];
    if (!p) return;

    var isMits = (p.plcType === 'MITSUBISHI');
    var device = (p.polling && p.polling.device) ? p.polling.device : 'D';

    // 2x / 3x 영역(Modbus) / X 디바이스(Mitsubishi)는 읽기 전용
    if (isReadOnly(dAddr, p.plcType, device)) {
        clog('WRITE BLOCKED ['+addrLabel(dAddr, plcId)+'] 읽기 전용 영역', 'e');
        setWriteStatus('읽기 전용 영역', 'err');
        return;
    }

    var inp = document.getElementById('winp_'+dAddr);
    if (!inp) return;
    var val = parseInt(inp.value);

    // 1x Coil(Modbus) / 비트 디바이스(Mitsubishi): 0 또는 1만 허용
    var isBit = (isModbusType(p.plcType) && isBitArea(dAddr)) || (isMits && isMitsBitDevice(device));
    if (isBit) {
        if (val !== 0 && val !== 1) { alert('비트 영역은 0 또는 1만 입력 가능합니다'); return; }
    } else {
        if (isNaN(val)||val<0||val>65535) { alert('0 ~ 65535 사이 정수'); return; }
    }

    clog('WRITE ['+plcId+'] '+addrLabel(dAddr, plcId)+'='+val+(isBit?' (BIT)':''), 'w');

    var writeUrl  = isBit ? '/sample_pro/plc/writeBit/' + plcId : '/sample_pro/plc/write/' + plcId;
    var bodyObj   = isBit ? { address: dAddr, value: val === 1 } : { address: dAddr, value: val };
    if (isMits) bodyObj.device = device;
    var writeBody = JSON.stringify(bodyObj);

    fetch(writeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: writeBody
    })
    .then(r => r.json())
    .then(function(d){
        if (d.success) {
            plcMap[plcId].stats.writeOk++;
            if (plcId === currentId) {
                document.getElementById('cntWriteOk').textContent = plcMap[plcId].stats.writeOk;
                setWriteStatus(addrLabel(dAddr, plcId)+' ← '+val+'  완료', 'ok');
                plcMap[plcId].values['D'+dAddr] = val;
                var el = document.getElementById('wcur_'+dAddr);
                if (el) el.textContent = val;
            }
        } else {
            plcMap[plcId].stats.writeFail++;
            if (plcId === currentId) {
                document.getElementById('cntWriteFail').textContent = plcMap[plcId].stats.writeFail;
                setWriteStatus('실패: '+(d.error||''), 'err');
            }
        }
    })
    .catch(function(e){
        clog('WRITE ERR '+e.message, 'e');
        setWriteStatus('오류: '+e.message, 'err');
    });
}

// ── 유틸 ──────────────────────────────────────────────────
function updateElapsed(id) {
    if (!plcMap[id] || id !== currentId) return;
    var sec = Math.floor((Date.now()-plcMap[id].polling.startTime)/1000);
    var h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60;
    document.getElementById('cntElapsed').textContent    = (h?pad(h)+':':'')+pad(m)+':'+pad(s);
    document.getElementById('cntElapsedSub').textContent = '폴링 경과';
}
function pad(n){ return n<10?'0'+n:''+n; }
function setStatus(msg,cls){
    document.getElementById('sMsg').textContent=msg;
    document.getElementById('sMsg').className='s-msg '+(cls||'');
    document.getElementById('sDot').className='s-dot '+(cls||'');
}
function setWriteStatus(msg,cls){
    document.getElementById('wMsg').textContent=msg;
    document.getElementById('wMsg').className='s-msg '+(cls||'');
    document.getElementById('wDot').className='s-dot '+(cls||'');
}
function clog(msg,type){
    var body=document.getElementById('conBody'); if(!body) return;
    var t=new Date().toLocaleTimeString('ko-KR');
    var cls={r:'log-r',w:'log-w',e:'log-e',x:'log-x'}[type]||'log-x';
    body.innerHTML+='<div class="log-line"><span class="log-t">'+t+'</span><span class="'+cls+'">'+msg+'</span></div>';
    body.scrollTop=body.scrollHeight;
}
function clearLog(){ document.getElementById('conBody').innerHTML=''; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ══════════════════════════════════════════════════════════
//  비트 패널
// ══════════════════════════════════════════════════════════
var bitMonitorList = []; // [{addr, label, bitLabels:[16개]}]

var bitPanelTimer = null;

function startBitPanelTimer() {
    if (bitPanelTimer) return;
    bitPanelTimer = setInterval(function() {
        // 메인 폴링이 꺼져있을 때만 독립 읽기
        if (!currentId || !plcMap[currentId] || plcMap[currentId].polling.running) return;
        flushBitPanel();
    }, 1000);
}
startBitPanelTimer();

function addBitMonitor() {
    var addr = parseInt(document.getElementById('bitAddAddr').value);
    var lbl  = (document.getElementById('bitAddLabel').value || '').trim();
    if (isNaN(addr) || addr < 0) { alert('D주소를 입력하세요'); return; }
    if (bitMonitorList.some(function(b){ return b.addr === addr; })) {
        alert('이미 등록됨: D' + addr); return;
    }
    bitMonitorList.push({ addr: addr, label: lbl || ('D' + addr), bitLabels: new Array(16).fill('') });
    document.getElementById('bitAddAddr').value  = '';
    document.getElementById('bitAddLabel').value = '';
    renderBitCards();
    flushBitPanel(); // 추가 즉시 한 번 읽기
}

function removeBitMonitor(addr) {
    bitMonitorList = bitMonitorList.filter(function(b){ return b.addr !== addr; });
    renderBitCards();
}

function setBitLabel(addr, bit, val) {
    var b = bitMonitorList.find(function(x){ return x.addr === addr; });
    if (b) b.bitLabels[bit] = val;
}

function renderBitCards() {
    if (!bitMonitorList.length) {
        document.getElementById('bitCards').innerHTML =
            '<div style="color:#2A4A6A;font-size:11px;padding:8px 4px">D주소 입력 후 추가 버튼을 누르세요  //  예: D2 → 비트 0~F 표시</div>';
        return;
    }
    var html = '';
    bitMonitorList.forEach(function(b) {
        var val = (currentId && plcMap[currentId] && plcMap[currentId].values['D'+b.addr] != null)
                  ? plcMap[currentId].values['D'+b.addr] : 0;
        var hex = '0x'+val.toString(16).toUpperCase().padStart(4,'0');

        html += '<div class="bit-card">'
              + '<div class="bit-card-head">'
              + '<span class="bit-card-addr">'+esc(b.label)+'</span>'
              + '<span class="bit-card-val" id="bval_'+b.addr+'">DEC: '+val+'  HEX: '+hex+'</span>'
              + '<span class="bit-card-close" onclick="removeBitMonitor('+b.addr+')">✕</span>'
              + '</div>'
              + '<div class="bit-row">';

        // 비트 F(15) → 0 순서로 표시
        for (var bit = 15; bit >= 0; bit--) {
            var bitName = bit.toString(16).toUpperCase();
            var isOn    = (val >> bit) & 1;
            html += '<div class="bit-box'+(isOn?' on':'')+'" id="bbox_'+b.addr+'_'+bit+'"'
                  + ' onclick="writeBitFromPanel('+b.addr+','+bit+')"'
                  + ' title="D'+b.addr+' bit'+bitName+'  클릭 시 토글 쓰기">'
                  + '<span class="bit-name">'+bitName+'</span>'
                  + '<span class="bit-val">'+isOn+'</span>'
                  + '</div>';
        }
        html += '</div><div class="bit-label-row">';
        for (var bit2 = 15; bit2 >= 0; bit2--) {
            html += '<input class="bit-label-inp" type="text" maxlength="5"'
                  + ' value="'+esc(b.bitLabels[bit2]||'')+'"'
                  + ' placeholder="'+bit2.toString(16).toUpperCase()+'"'
                  + ' title="비트 '+bit2.toString(16).toUpperCase()+' 레이블"'
                  + ' oninput="setBitLabel('+b.addr+','+bit2+',this.value)">';
        }
        html += '</div></div>';
    });
    document.getElementById('bitCards').innerHTML = html;
}

function writeBitFromPanel(addr, bit) {
    if (!currentId || !plcMap[currentId]) { clog('BIT WRITE: PLC 미선택', 'e'); return; }
    var p = plcMap[currentId];
    var curVal  = p.values['D'+addr] != null ? p.values['D'+addr] : 0;
    var newVal  = curVal ^ (1 << bit);  // 해당 비트 토글
    var bitName = bit.toString(16).toUpperCase();

    // 버튼 애니메이션
    var el = document.getElementById('bbox_'+addr+'_'+bit);
    if (el) { el.classList.add('writing'); setTimeout(function(){ el.classList.remove('writing'); }, 400); }

    clog('BIT WRITE ['+currentId+'] D'+addr+' bit'+bitName+' → '+(((newVal>>bit)&1)?'ON':'OFF')+'  (word: '+curVal+' → '+newVal+')', 'w');

    fetch('/sample_pro/plc/write/'+currentId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, value: newVal })
    })
    .then(function(r){ return r.json(); })
    .then(function(d) {
        if (d.success) {
            p.stats.writeOk++;
            p.values['D'+addr] = newVal;
            document.getElementById('cntWriteOk').textContent = p.stats.writeOk;
            setWriteStatus('D'+addr+' bit'+bitName+' → '+(((newVal>>bit)&1)?'ON':'OFF')+'  완료', 'ok');
            // 비트 패널 즉시 반영
            flushBitPanel();
            // 쓰기 패널 현재값도 갱신
            var wcur = document.getElementById('wcur_'+addr);
            if (wcur) wcur.textContent = newVal;
        } else {
            p.stats.writeFail++;
            document.getElementById('cntWriteFail').textContent = p.stats.writeFail;
            setWriteStatus('BIT WRITE 실패: '+(d.error||''), 'err');
            clog('BIT WRITE FAIL: '+(d.error||''), 'e');
        }
    })
    .catch(function(e) {
        setWriteStatus('BIT WRITE 오류: '+e.message, 'err');
        clog('BIT WRITE ERR: '+e.message, 'e');
    });
}

function updateBitCardDisplay(addr, val) {
    var hex = '0x'+val.toString(16).toUpperCase().padStart(4,'0');
    var valEl = document.getElementById('bval_'+addr);
    if (valEl) valEl.textContent = 'DEC: '+val+'  HEX: '+hex;
    for (var bit = 15; bit >= 0; bit--) {
        var isOn = (val >> bit) & 1;
        var el   = document.getElementById('bbox_'+addr+'_'+bit);
        if (!el) continue;
        el.className = 'bit-box'+(isOn?' on':'');
        var valSpan = el.querySelector('.bit-val');
        if (valSpan) valSpan.textContent = isOn;
    }
}

function flushBitPanel() {
    if (!bitMonitorList.length || !currentId || !plcMap[currentId]) return;
    var p = plcMap[currentId];

    bitMonitorList.forEach(function(b) {
        // 현재 폴링 범위 안에 있는지 확인
        var inRange = p.chunks.some(function(chunk) {
            return b.addr >= chunk.start && b.addr < chunk.start + chunk.count;
        });

        if (inRange) {
            // 폴링 캐시 값 사용
            var val = p.values['D'+b.addr] != null ? p.values['D'+b.addr] : 0;
            updateBitCardDisplay(b.addr, val);
        } else {
            // 폴링 범위 밖 → 직접 fetch
            fetch('/sample_pro/plc/read/'+currentId+'?start='+b.addr+'&count=1')
            .then(function(r){ return r.json(); })
            .then(function(d) {
                if (d.success && d.values && d.values.length > 0) {
                    var val = d.values[0] != null ? d.values[0] : 0;
                    p.values['D'+b.addr] = val;
                    updateBitCardDisplay(b.addr, val);
                }
            })
            .catch(function(){});
        }
    });
}

// ── 초기화: 기존 C# 등록 PLC 목록 불러오기 ────────────────
updateChunkInfo();
fetch('/sample_pro/plc/list')
.then(r => r.json())
.then(function(list){
    (Array.isArray(list) ? list : []).forEach(function(item){
        plcMap[item.id] = {
            label: item.label || item.id,
            ip: item.ip, port: item.port, plcType: item.plcType,
            connOk: null, connMsg: '미확인',
            stats:   { readOk:0, readFail:0, writeOk:0, writeFail:0 },
            values:  {}, prevValues: {}, chunks: [],
            polling: { running:false, timer:null, elapsedTimer:null, startTime:null,
                       cycle:0, chunkIdx:0, isChunking:false, writeBuilt:false }
        };
    });

    // 없으면 default 자동 추가
    if (!Object.keys(plcMap).length) {
        plcMap['default'] = {
            label:'PLC-1', ip:'192.168.1.238', port:2004, plcType:'LS',
            connOk:null, connMsg:'미확인',
            stats:{readOk:0,readFail:0,writeOk:0,writeFail:0},
            values:{}, prevValues:{}, chunks:[],
            polling:{running:false,timer:null,elapsedTimer:null,startTime:null,
                     cycle:0,chunkIdx:0,isChunking:false,writeBuilt:false}
        };
        fetch('/sample_pro/plc/add',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({id:'default',ip:'192.168.1.238',port:2004,plcType:'LS',label:'PLC-1'})});
    }

    var ids = Object.keys(plcMap);
    currentId = ids[0] || null;
    renderTabs();
    if (currentId) loadTabState();
})
.catch(function(){
    // list 실패 시 default 생성
    plcMap['default'] = {
        label:'PLC-1', ip:'192.168.1.238', port:2004, plcType:'LS',
        connOk:null, connMsg:'미확인',
        stats:{readOk:0,readFail:0,writeOk:0,writeFail:0},
        values:{}, prevValues:{}, chunks:[],
        polling:{running:false,timer:null,elapsedTimer:null,startTime:null,
                 cycle:0,chunkIdx:0,isChunking:false,writeBuilt:false}
    };
    currentId = 'default';
    renderTabs(); loadTabState();
});
</script>
</body>
</html>
