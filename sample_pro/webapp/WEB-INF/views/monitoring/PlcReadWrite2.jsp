<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>PLC MONITOR</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body { background: #07090F; color: #A8D8F0; font-family: 'Consolas', monospace; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }

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
.plc-tab .tab-badge { font-size: 9px; opacity: .5; }
.plc-tab .tab-close {
    font-size: 12px; opacity: .4; margin-left: 2px; line-height: 1;
    padding: 0 2px; border-radius: 2px;
}
.plc-tab .tab-close:hover { opacity: 1; color: #FF4466; }

.btn-add-plc {
    height: 30px; padding: 0 12px; background: transparent;
    border: 1px dashed #2A4A6A; color: #2A4A6A;
    font-family: 'Consolas', monospace; font-size: 11px;
    cursor: pointer; border-radius: 3px; transition: all .15s; white-space: nowrap;
}
.btn-add-plc:hover { border-color: #00F0FF; color: #00F0FF; }

/* ══ 패널 공통 ══ */
.cfg-panel { background: #0D1128; border: 1px solid #1A3A5C; border-radius: 4px; flex-shrink: 0; }
.panel-head { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-bottom: 1px solid #0D1A2E; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
.acc { width: 3px; height: 14px; border-radius: 2px; flex-shrink: 0; }
.cfg-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 8px 14px; }
.cfg-label { font-size: 10px; color: #5A7FA0; white-space: nowrap; }

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

.conn-dot { width: 8px; height: 8px; border-radius: 50%; background: #2A4A6A; transition: all .3s; }
.conn-dot.ok  { background: #00FF88; box-shadow: 0 0 5px #00FF88; }
.conn-dot.err { background: #FF4466; box-shadow: 0 0 5px #FF4466; }
.conn-msg { font-size: 11px; color: #5A7FA0; }
.conn-msg.ok  { color: #00FF88; }
.conn-msg.err { color: #FF4466; }

.btn {
    height: 26px; padding: 0 12px; background: transparent;
    font-family: 'Consolas', monospace; font-size: 11px; font-weight: bold;
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
.sc-label { font-size: 9px; font-weight: bold; letter-spacing: 1px; opacity: .6; }
.sc-val   { font-size: 20px; font-weight: bold; }
.sc-sub   { font-size: 9px; opacity: .4; }
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
.s-msg { color: #5A7FA0; font-size: 11px; }
.s-msg.ok  { color: #00FF88; }
.s-msg.err { color: #FF4466; }
.s-cnt { margin-left: auto; color: #2A4A6A; font-size: 10px; }
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
.r-table thead th { position:sticky; top:0; z-index:1; background:#060A18; color:#00F0FF; opacity:.5; font-size:9px; letter-spacing:1px; font-weight:bold; padding:6px 8px; border-bottom:1px solid #1A3A5C; text-align:center; }
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
.td-bin  { color:#2A4A6A; font-size:9px; letter-spacing:1px; }
.td-time { color:#2A4A6A; font-size:10px; }

.w-chunk-head { font-size:9px; font-weight:bold; color:#1A3A5C; letter-spacing:1px; padding:8px 0 3px; border-top:1px solid #0D1A2E; margin-top:4px; }
.w-chunk-head:first-of-type { border-top:none; margin-top:0; padding-top:0; }
.w-row { display:flex; align-items:center; gap:6px; padding:5px 0; border-bottom:1px solid #0D1A2E; }
.w-addr { width:70px; color:#B24BF3; font-weight:bold; font-size:12px; flex-shrink:0; }
.w-cur  { width:55px; text-align:right; color:#00F0FF; font-weight:bold; font-size:14px; flex-shrink:0; }
.w-arrow { color:#2A4A6A; font-size:11px; flex-shrink:0; }
.w-inp  { flex:1; min-width:0; background:#060A18; border:1px solid #1A3A5C; color:#FFD060; font-family:'Consolas',monospace; font-size:13px; font-weight:bold; padding:4px 6px; border-radius:2px; text-align:center; outline:none; }
.w-inp:focus { border-color:#FFD060; }
.w-btn  { width:52px; height:28px; background:transparent; border:1px solid #00FF88; color:#00FF88; font-family:'Consolas',monospace; font-size:10px; font-weight:bold; cursor:pointer; border-radius:2px; flex-shrink:0; }
.w-btn:hover { background:#00FF88; color:#07090F; }
.w-hint { font-size:9px; color:#2A4A6A; margin-top:8px; }

.con-panel { background:#030508; border:1px solid #0D1A2E; border-radius:4px; display:flex; flex-direction:column; min-height:0; }
.con-head  { display:flex; align-items:center; justify-content:space-between; padding:6px 10px; border-bottom:1px solid #0D1A2E; font-size:10px; font-weight:bold; color:#2A4A6A; letter-spacing:1px; flex-shrink:0; }
.con-body  { flex:1; overflow-y:auto; min-height:0; padding:5px 8px; font-size:10px; line-height:1.8; }
.log-line { display:flex; gap:5px; }
.log-t  { color:#2A4A6A; flex-shrink:0; font-size:9px; }
.log-r  { color:#00F0FF; word-break:break-all; }
.log-w  { color:#00FF88; word-break:break-all; }
.log-e  { color:#FF4466; word-break:break-all; }
.log-x  { color:#5A7FA0; word-break:break-all; }
.btn-cl { background:transparent; border:1px solid #1A3A5C; color:#2A4A6A; font-family:'Consolas',monospace; font-size:9px; padding:2px 6px; cursor:pointer; border-radius:2px; }
.btn-cl:hover { border-color:#FF4466; color:#FF4466; }

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
  <div class="page-sub">// Multi-PLC  ·  LS FEnet / Mitsubishi MC3E  ·  Browser → Spring → C# → PLC</div>
</div>
<div class="divider"></div>

<!-- ══ PLC 탭 바 ══ -->
<div class="plc-tab-bar" id="plcTabBar">
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
    <span style="color:#2A4A6A; font-size:9px; margin-left:8px" id="chunkInfo"></span>
  </div>
  <div class="cfg-row">
    <span class="cfg-label">시작 D주소</span>
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
      <span style="color:#2A4A6A;font-size:10px;margin-left:4px" id="rangeLabel"></span>
    </div>
    <div class="read-scroll">
      <table class="r-table">
        <thead><tr>
          <th style="width:70px">D주소</th>
          <th style="width:60px">DEC</th>
          <th style="width:60px">HEX</th>
          <th>BIN</th>
          <th style="width:70px">갱신시각</th>
        </tr></thead>
        <tbody id="readBody">
          <tr><td colspan="5" style="color:#2A4A6A;text-align:center;padding:24px">폴링 시작 후 표시</td></tr>
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
      <div style="color:#2A4A6A;text-align:center;padding:20px;font-size:11px">폴링 시작 후 표시</div>
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
    updateTypeBadge(p.plcType);
    setConnStatus(p.connMsg || '미확인', p.connOk === true ? 'ok' : p.connOk === false ? 'err' : '');

    // 통계
    var s = p.stats;
    document.getElementById('cntReadOk').textContent    = s.readOk;
    document.getElementById('cntReadFail').textContent  = s.readFail;
    document.getElementById('cntWriteOk').textContent   = s.writeOk;
    document.getElementById('cntWriteFail').textContent = s.writeFail;

    // 폴링 버튼
    document.getElementById('btnStart').style.display = p.polling.running ? 'none' : '';
    document.getElementById('btnStop').style.display  = p.polling.running ? '' : 'none';
    document.getElementById('spinner').className = 'spin' + (p.polling.running ? ' on' : '');

    // 읽기 테이블/쓰기 패널 재렌더
    if (Object.keys(p.values).length > 0) {
        flushReadTable();
        buildAllWriteRows();
    } else {
        document.getElementById('readBody').innerHTML =
            '<tr><td colspan="5" style="color:#2A4A6A;text-align:center;padding:24px">폴링 시작 후 표시</td></tr>';
        document.getElementById('writeBody').innerHTML =
            '<div style="color:#2A4A6A;text-align:center;padding:20px;font-size:11px">폴링 시작 후 표시</div>';
    }
    setStatus(p.polling.running ? '폴링 중...' : '대기 중', p.polling.running ? '' : '');
}

// ── PLC 추가 ──────────────────────────────────────────────
function openAddModal() {
    plcIdCount++;
    document.getElementById('addId').value    = 'plc' + plcIdCount;
    document.getElementById('addLabel').value = 'PLC-' + plcIdCount;
    document.getElementById('addIp').value    = '192.168.1.';
    document.getElementById('addPort').value  = 2004;
    document.getElementById('addModal').classList.add('show');
}
function closeAddModal() { document.getElementById('addModal').classList.remove('show'); }
function onAddTypeChange() {
    var t = document.getElementById('addType').value;
    document.getElementById('addPort').value = t === 'MITSUBISHI' ? 6004 : 2004;
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
    document.getElementById('inpPlcPort').value = t === 'MITSUBISHI' ? 6004 : 2004;
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
    if (type === 'MITSUBISHI') { el.textContent = 'Mitsubishi Q'; el.className = 'badge badge-mits'; }
    else                       { el.textContent = 'LS XGT';       el.className = 'badge badge-ls'; }
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

    var start    = parseInt(document.getElementById('cfgStart').value)    || 10000;
    var count    = parseInt(document.getElementById('cfgCount').value)    || 100;
    var interval = parseInt(document.getElementById('cfgInterval').value) || 1000;
    var size     = parseInt(document.getElementById('cfgChunkSize').value)|| 100;

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
        '// D'+start+'~D'+(start+count-1)+'  ('+count+'개  '+p.chunks.length+'청크)';
    document.getElementById('btnStart').style.display = 'none';
    document.getElementById('btnStop').style.display  = '';
    document.getElementById('spinner').classList.add('on');
    p.polling.running = true;
    updateChunkInfo();
    setStatus('폴링 중...', '');
    renderTabs();
    clog('시작 ['+currentId+'] D'+start+'~D'+(start+count-1)+'  간격='+interval+'ms', 'r');

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

    document.getElementById('btnStart').style.display = '';
    document.getElementById('btnStop').style.display  = 'none';
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
            if (!pol.writeBuilt) { buildAllWriteRows(); pol.writeBuilt = true; }
            else updateAllWriteCur();
        }
        return;
    }

    var ci = pol.chunkIdx, chunk = p.chunks[ci];
    if (id === currentId) setPip(ci, 'active');

    fetch('/sample_pro/plc/read/' + id + '?start=' + chunk.start + '&count=' + chunk.count)
    .then(function(res){ if(!res.ok) throw new Error('HTTP '+res.status); return res.json(); })
    .then(function(data){
        if(!data.success) throw new Error(data.error||'PLC 오류');
        for(var i=0;i<data.values.length;i++)
            p.values['D'+(chunk.start+i)] = data.values[i] != null ? data.values[i] : 0;

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

    p.chunks.forEach(function(chunk, ci) {
        for(var i=0;i<chunk.count;i++){
            var dAddr = chunk.start+i, key='D'+dAddr;
            var val = p.values[key] != null ? p.values[key] : 0;
            var changed = (p.prevValues[key] !== undefined && p.prevValues[key] !== val);
            p.prevValues[key] = val;
            var hex = '0x'+val.toString(16).toUpperCase().padStart(4,'0');
            var bin = val.toString(2).padStart(16,'0').replace(/(.{4})/g,'$1 ').trim();
            var sep = (!firstChunk && i===0) ? ' chunk-sep' : '';
            firstChunk = false;
            html += '<tr class="'+(changed?'flash':'')+sep+'">'
                  + '<td class="td-addr">D'+dAddr+'</td>'
                  + '<td class="td-dec">'+val+'</td>'
                  + '<td class="td-hex">'+hex+'</td>'
                  + '<td class="td-bin">'+bin+'</td>'
                  + '<td class="td-time">'+now+'</td></tr>';
        }
    });
    document.getElementById('readBody').innerHTML = html ||
        '<tr><td colspan="5" style="color:#2A4A6A;text-align:center;padding:16px">데이터 없음</td></tr>';
}

function buildAllWriteRows() {
    if (!currentId) return;
    var p = plcMap[currentId];
    var html = '';
    p.chunks.forEach(function(chunk, ci){
        html += '<div class="w-chunk-head">CHUNK '+(ci+1)+'  //  D'+chunk.start+' ~ D'+(chunk.start+chunk.count-1)+'</div>';
        for(var i=0;i<chunk.count;i++){
            var dAddr = chunk.start+i;
            var val   = p.values['D'+dAddr] != null ? p.values['D'+dAddr] : 0;
            html += '<div class="w-row">'
                  + '<span class="w-addr">D'+dAddr+'</span>'
                  + '<span class="w-cur" id="wcur_'+dAddr+'">'+val+'</span>'
                  + '<span class="w-arrow">→</span>'
                  + '<input class="w-inp" id="winp_'+dAddr+'" type="number" value="'+val+'" min="0" max="65535"'
                  + ' onkeydown="if(event.key===\'Enter\')doWrite(\''+currentId+'\','+dAddr+')">'
                  + '<button class="w-btn" onclick="doWrite(\''+currentId+'\','+dAddr+')">WRITE</button>'
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
    var inp = document.getElementById('winp_'+dAddr);
    if (!inp) return;
    var val = parseInt(inp.value);
    if (isNaN(val)||val<0||val>65535) { alert('0 ~ 65535 사이 정수'); return; }
    clog('WRITE ['+plcId+'] D'+dAddr+'='+val, 'w');

    fetch('/sample_pro/plc/write/' + plcId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: dAddr, value: val })
    })
    .then(r => r.json())
    .then(function(d){
        if (d.success) {
            plcMap[plcId].stats.writeOk++;
            if (plcId === currentId) {
                document.getElementById('cntWriteOk').textContent = plcMap[plcId].stats.writeOk;
                setWriteStatus('D'+dAddr+' ← '+val+'  완료', 'ok');
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
