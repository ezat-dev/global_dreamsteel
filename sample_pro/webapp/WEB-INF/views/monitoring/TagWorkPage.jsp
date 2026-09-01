<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>TAG WORKSPACE</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }
body {
    background: #07090F; color: #A8D8F0;
    font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
    padding: 20px 24px;
    display: flex; flex-direction: column; gap: 12px;
}

/* ══ 헤더 ══ */
.page-header { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid #00F0FF44; flex-shrink: 0; }
.page-title  { font-size: 24px; font-weight: bold; color: #00F0FF; text-shadow: 0 0 14px #00F0FF88; }
.page-sub    { font-size: 10px; color: #B24BF3; opacity: .7; margin-top: 4px; }
.active-badge { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: bold; color: #00F0FF; }
.active-dot  { width: 7px; height: 7px; border-radius: 50%; background: #00F0FF; box-shadow: 0 0 8px #00F0FF; animation: pulse 1.6s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* ══ 툴바 ══ */
.toolbar { display: flex; align-items: center; background: #0D1128; border: 1px solid #00F0FF44; padding: 10px 16px; flex-shrink: 0; box-shadow: 0 0 14px #00F0FF18; gap: 0; }
.tb-section { display: flex; align-items: center; gap: 8px; }
.tb-label   { font-size: 9px; font-weight: bold; color: #00F0FF; opacity: .8; white-space: nowrap; letter-spacing: 1px; }
.tb-label.purple { color: #B24BF3; }
.tb-label.yellow { color: #FFD060; }
.tb-sep     { width: 1px; background: #00F0FF22; align-self: stretch; margin: 0 14px; }
.tb-spacer  { flex: 1; }

/* ── D주소 입력 (툴바) ── */
.d-prefix { font-size: 13px; font-weight: bold; color: #00F0FF; background: #060A18; border: 1px solid #00F0FF44; border-right: none; height: 34px; padding: 0 8px; display: flex; align-items: center; }
.d-inp { width: 86px; height: 34px; background: #060A18; border: 1px solid #1A3A5C; color: #00F0FF; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 13px; font-weight: bold; padding: 0 8px; outline: none; }
.d-inp:focus { border-color: #00F0FF; }
.d-range-sep { font-size: 12px; color: #2A4A6A; padding: 0 4px; }

/* ── 폴더 선택 ── */
.folder-select { width: 180px; height: 34px; background: #0D1128; border: 1px solid #00F0FF55; color: #00F0FF; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 12px; padding: 0 10px; cursor: pointer; outline: none; }
.folder-select option { background: #0A0E20; }

/* ══ 버튼 ══ */
.btn { height: 34px; padding: 0 14px; background: transparent; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 0; transition: all .15s; white-space: nowrap; letter-spacing: .5px; }
.btn:disabled { opacity: .3; cursor: default; }
.btn-cyan   { border: 1px solid #00F0FF; color: #00F0FF; }
.btn-cyan:not(:disabled):hover   { background: #00F0FF; color: #07090F; box-shadow: 0 0 10px #00F0FF88; }
.btn-green  { border: 1px solid #00FF88; color: #00FF88; }
.btn-green:not(:disabled):hover  { background: #00FF88; color: #07090F; box-shadow: 0 0 10px #00FF8888; }
.btn-red    { border: 1px solid #FF4466; color: #FF4466; }
.btn-red:not(:disabled):hover    { background: #FF4466; color: #07090F; box-shadow: 0 0 10px #FF446688; }
.btn-yellow { border: 1px solid #FFD060; color: #FFD060; }
.btn-yellow:not(:disabled):hover { background: #FFD060; color: #07090F; box-shadow: 0 0 10px #FFD06088; }

/* ══ 다중선택 액션 바 ══ */
.sel-bar { display: none; align-items: center; gap: 12px; background: #0A1525; border: 1px solid #FFD06044; padding: 7px 16px; flex-shrink: 0; font-size: 11px; }
.sel-bar.show { display: flex; }
.sel-cnt  { color: #FFD060; font-weight: bold; }
.sel-hint { color: #2A4A6A; font-size: 10px; }
.sel-plc  { height: 28px; background: #060A18; border: 1px solid #FFD06055; color: #FFD060; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 11px; padding: 0 8px; outline: none; cursor: pointer; }
.sel-plc option { background: #0A0E20; }
.btn-sm { height: 28px; padding: 0 12px; background: transparent; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 10px; font-weight: bold; cursor: pointer; border-radius: 0; transition: all .15s; white-space: nowrap; }
.btn-sm-yellow { border: 1px solid #FFD060; color: #FFD060; }
.btn-sm-yellow:hover { background: #FFD060; color: #07090F; }
.btn-sm-red    { border: 1px solid #FF4466; color: #FF4466; }
.btn-sm-red:hover    { background: #FF4466; color: #07090F; }

/* ══ 테이블 ══ */
.table-wrap   { flex: 1; min-height: 0; background: #0D1128; border: 1px solid #00F0FF33; box-shadow: 0 0 20px #00F0FF0F; display: flex; flex-direction: column; }
.table-scroll { flex: 1; overflow-y: auto; min-height: 0; }
.table-scroll::-webkit-scrollbar { width: 4px; }
.table-scroll::-webkit-scrollbar-thumb { background: #1A3A5C; border-radius: 2px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
thead th { position: sticky; top: 0; z-index: 1; background: #060A1C; color: #00F0FF; font-size: 10px; font-weight: bold; letter-spacing: 1px; padding: 11px 14px; border-bottom: 2px solid #00F0FF33; text-align: left; }
tbody tr { border-bottom: 1px solid #0F1E35; transition: background .1s; cursor: pointer; user-select: none; }
tbody tr:nth-child(even) { background: #08091A; }
tbody tr:hover    { background: #0C1830; }
tbody tr.selected { background: #12304A !important; outline: 1px solid #00F0FF22; }
tbody td { padding: 10px 14px; vertical-align: middle; }
.col-name { color: #E0F4FF; font-weight: 600; }
.col-addr { color: #00F0FF; font-weight: bold; }
.col-type { color: #B24BF3; }
.col-time { color: #6A8FAF; font-size: 11px; }
.plc-ls  { color: #00FF88; font-size: 10px; font-weight: bold; }
.plc-mit { color: #B24BF3; font-size: 10px; font-weight: bold; }
.empty-row td { color: #2A4A6A; text-align: center; padding: 40px; }

/* ══ 모달 공통 ══ */
.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.65); z-index: 999; align-items: center; justify-content: center; }
.modal-overlay.show { display: flex; }
.modal-box { background: #0D1128; border: 1px solid #2A4A6A; padding: 22px 26px; box-shadow: 0 0 40px #00F0FF22; }
.modal-box h3 { font-size: 13px; color: #FFD060; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; padding-bottom: 12px; border-bottom: 1px solid #1A3A5C; margin-bottom: 14px; }
.modal-field { margin-bottom: 12px; }
.modal-field label { display: block; font-size: 10px; color: #5A7FA0; margin-bottom: 5px; letter-spacing: .5px; }
.modal-inp, .modal-sel { width: 100%; height: 34px; background: #060A18; border: 1px solid #1A3A5C; color: #00F0FF; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 13px; padding: 0 10px; outline: none; transition: border-color .15s; }
.modal-inp:focus, .modal-sel:focus { border-color: #00F0FF; }
.modal-sel { cursor: pointer; }
.modal-sel option { background: #0A0E20; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; padding-top: 14px; border-top: 1px solid #1A3A5C; }
.modal-err { font-size: 11px; color: #FF4466; margin-top: 8px; display: none; }

/* D주소 입력 그룹 (모달) */
.d-grp { display: flex; height: 34px; }
.d-grp .dp { background: #0A1020; border: 1px solid #1A3A5C; border-right: none; color: #00F0FF; font-weight: bold; font-size: 14px; padding: 0 10px; display: flex; align-items: center; flex-shrink: 0; }
.d-grp input { flex: 1; background: #060A18; border: 1px solid #1A3A5C; color: #00F0FF; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 13px; padding: 0 10px; outline: none; width: 0; }
.d-grp input:focus { border-color: #00F0FF; }

/* 범위 모달 */
.range-row { display: flex; align-items: center; gap: 10px; }
.range-row .d-grp { flex: 1; }
.range-tilde { color: #2A4A6A; font-size: 18px; flex-shrink: 0; }
.range-preview { margin-top: 8px; font-size: 10px; color: #5A7FA0; min-height: 16px; }
.range-preview span { color: #FFD060; }

/* ══ 토스트 ══ */
.toast { position: fixed; bottom: 24px; right: 24px; padding: 10px 18px; font-size: 12px; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; border-radius: 2px; z-index: 9999; opacity: 0; transition: opacity .3s; }
.toast.show { opacity: 1; }
.toast.ok  { background: #071A10; border: 1px solid #00FF88; color: #00FF88; }
.toast.err { background: #1A0709; border: 1px solid #FF4466; color: #FF4466; }



/* ══ 2컬럼 워크스페이스 ══ */
.workspace{
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 2fr 5fr; /* 2:5 */
  gap: 12px;
}

/* 좌측 패널 */
.panel-left{
  min-height: 0;
  background: #0D1128;
  border: 1px solid #00F0FF33;
  box-shadow: 0 0 20px #00F0FF0F;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.panel-title{
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 800;
  color: #00F0FF;
  margin-bottom: 10px;
}

.left-tools{
  display:flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.left-search{
  height: 34px;
  background: #060A18;
  border: 1px solid #1A3A5C;
  color: #00F0FF;
  padding: 0 10px;
  outline: none;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
  font-size: 12px;
}
.left-search:focus{ border-color:#00F0FF; }

.left-btns{
  display:flex;
  gap: 8px;
}

/* 폴더 리스트 */
.folder-list{
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid #00F0FF22;
  padding-top: 8px;
}
.folder-list::-webkit-scrollbar{ width:4px; }
.folder-list::-webkit-scrollbar-thumb{ background:#1A3A5C; border-radius:2px; }

.folder-item{
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}
.folder-item:hover{
  background:#0C1830;
  border-color:#00F0FF22;
}
.folder-item.active{
  background:#12304A;
  border-color:#00F0FF55;
  box-shadow: 0 0 10px #00F0FF22;
}
.folder-name{ color:#E0F4FF; font-weight:700; font-size: 12px; }
.folder-id{ color:#2A4A6A; font-size: 10px; }

.folder-empty{
  color:#2A4A6A;
  padding: 18px 10px;
  text-align: center;
  font-size: 12px;
}

/* 우측 패널 */
.panel-right{
  min-height: 0;
  display:flex;
  flex-direction: column;
  gap: 10px;
}

/* 우측 toolbar는 박스처럼 */
.toolbar-right{
  border-radius: 6px;
}
</style>
</head>
<body>

<!-- ══ 헤더 ══ -->
<div class="page-header">
    <div>
        <div class="page-title">TAG  WORKSPACE</div>
        <div class="page-sub">// Manage and monitor system tags</div>
    </div>
    <div class="active-badge"><div class="active-dot"></div>ACTIVE</div>
</div>

    <div class="tb-sep"></div>

 <!-- ══ 워크스페이스 (좌 폴더 / 우 태그) ══ -->
<div class="workspace">

  <!-- ───────── 좌측 : Folder Panel (2) ───────── -->
  <aside class="panel-left">
    <div class="panel-title">FOLDERS</div>

    <div class="left-tools">
      <input id="folderSearch" class="left-search" placeholder="폴더 검색..." oninput="filterFolderList()">
      <div class="left-btns">
        <button class="btn btn-cyan" onclick="openFolderModal()">+ FOLDER</button>
        <button class="btn btn-red" id="btnDelFolder" onclick="deleteFolder()" disabled>✕</button>
      </div>
    </div>

    <!-- hidden select 유지 (기존 loadTags() 호환) -->
    <select class="folder-select" id="folderSelect" onchange="loadTags()" style="display:none;">
      <option value="0">— 폴더 선택 —</option>
    </select>

    <div id="folderList" class="folder-list">
      <div class="folder-empty">폴더를 불러오는 중...</div>
    </div>
  </aside>

  <!-- ───────── 우측 : Tag Panel (5) ───────── -->
  <section class="panel-right">
    <!-- 기존 툴바의 TAG/AUTO GEN 부분을 우측 상단으로 -->
    <div class="toolbar toolbar-right">
      <div class="tb-section">
        <span class="tb-label purple">TAG</span>
        <button class="btn btn-green" onclick="openTagModal('add')">+ ADD</button>
        <button class="btn btn-cyan"  id="btnEdit"   onclick="openTagModal('edit')" disabled>✎ EDIT</button>
        <button class="btn btn-red"   id="btnDelete" onclick="deleteSelectedTags()" disabled>✕ DELETE</button>
      </div>

      <div class="tb-sep"></div>

      <div class="tb-section">
        <span class="tb-label yellow">AUTO  GEN</span>
        <select class="d-prefix" id="genDevice" style="cursor:pointer;">
          <option value="D">D</option><option value="M">M</option><option value="L">L</option>
          <option value="X">X</option><option value="Y">Y</option><option value="B">B</option>
          <option value="W">W</option><option value="R">R</option>
        </select>
        <input class="d-inp" id="genFrom" type="number" min="0" max="65535" placeholder="시작">
        <span class="d-range-sep">~</span>
        <input class="d-inp" id="genTo"   type="number" min="0" max="65535" placeholder="끝">
        <button class="btn btn-yellow" onclick="openRangeModal()">⚡ 생성</button>
      </div>

      <div class="tb-spacer"></div>
      <button class="btn btn-cyan" onclick="loadTags()">↻ REFRESH</button>
    </div>

    <!-- 기존 다중선택 바 -->
    <div class="sel-bar" id="selBar">
      <span class="sel-cnt" id="selCnt">0개 선택됨</span>
      <span class="sel-hint">Shift+클릭 범위선택</span>
      <span style="flex:1"></span>
      <span style="font-size:10px;color:#5A7FA0;margin-right:4px">PLC 일괄 변경</span>
      <select class="sel-plc" id="selPlcSel"></select>
      <button class="btn-sm btn-sm-yellow" onclick="bulkChangePlc()">적용</button>
      <button class="btn-sm btn-sm-red"    onclick="clearSelection()">선택 해제</button>
    </div>

    <!-- 기존 테이블 -->
    <div class="table-wrap">
      <div class="table-scroll">
        <table>
          <thead>
          <tr>
            <th style="width:38px">
              <input type="checkbox" id="chkAll" onchange="toggleAllCheck(this)"
                     title="전체선택" style="cursor:pointer;accent-color:#00F0FF">
            </th>
            <th style="width:200px">NAME</th>
            <th style="width:140px">ADDRESS</th>
            <th style="width:100px">TYPE</th>
            <th style="width:150px">PLC</th>
            <th style="width:90px">ENABLED</th>
          </tr>
          </thead>
          <tbody id="tagBody">
          <tr class="empty-row">
            <td colspan="6">폴더를 선택하면 태그 목록이 표시됩니다</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

  </section>
</div>

<!-- ══ 폴더 추가 모달 ══ -->
<div class="modal-overlay" id="folderModal">
    <div class="modal-box" style="width:380px">
        <h3>FOLDER  추가</h3>
        <div class="modal-field">
            <label>폴더 이름 *</label>
            <input class="modal-inp" id="folderName" type="text" placeholder="예: 1호기 라인"
                   onkeydown="if(event.key==='Enter') confirmFolder()">
        </div>
        <div class="modal-err" id="folderErr"></div>
        <div class="modal-actions">
            <button class="btn btn-red"    onclick="closeFolderModal()">취소</button>
            <button class="btn btn-yellow" onclick="confirmFolder()">추가</button>
        </div>
    </div>
</div>

<!-- ══ 태그 추가/수정 모달 ══ -->
<div class="modal-overlay" id="tagModal">
    <div class="modal-box" style="width:440px">
        <h3 id="tagModalTitle">TAG  추가</h3>
        <input type="hidden" id="tagId">

        <div class="modal-field">
            <label>태그 이름 *</label>
            <input class="modal-inp" id="tagName" type="text" placeholder="예: 컨베이어_속도">
        </div>
        <div class="modal-field">
            <label>주소  (디바이스영역+주소, 예: D100, M200)</label>
            <input class="modal-inp" id="tagAddress" type="text" placeholder="예: D10000, M100">
        </div>
        <div style="display:flex;gap:10px;">
            <div class="modal-field" style="flex:1">
                <label>타입</label>
                <select class="modal-sel" id="tagType">
                    <option value="WORD">WORD</option>
                    <option value="BIT">BIT</option>
                </select>
            </div>
            <div class="modal-field" style="flex:1">
                <label>PLC *</label>
                <select class="modal-sel" id="tagPlcId"></select>
            </div>
            <div class="modal-field" style="flex:1">
                <label>사용</label>
                <select class="modal-sel" id="tagEnabled">
                    <option value="1">ON</option>
                    <option value="0">OFF</option>
                </select>
            </div>
        </div>
        <div class="modal-err" id="tagErr"></div>
        <div class="modal-actions">
            <button class="btn btn-red"    onclick="closeTagModal()">취소</button>
            <button class="btn btn-yellow" id="tagSaveBtn" onclick="confirmTag()">저장</button>
        </div>
    </div>
</div>

<!-- ══ 범위 자동생성 모달 ══ -->
<div class="modal-overlay" id="rangeModal">
    <div class="modal-box" style="width:460px">
        <h3>⚡ AUTO  GEN  —  D주소 범위 태그 자동 생성</h3>

        <div class="modal-field">
            <label>디바이스 / 주소 범위 *</label>
            <div class="range-row">
                <select class="modal-sel" id="rDevice" style="max-width:70px;">
                    <option value="D">D</option><option value="M">M</option><option value="L">L</option>
                    <option value="X">X</option><option value="Y">Y</option><option value="B">B</option>
                    <option value="W">W</option><option value="R">R</option>
                </select>
                <div class="d-grp">
                    <input id="rFrom" type="number" min="0" max="65535" placeholder="시작" oninput="updateRangePreview()">
                </div>
                <span class="range-tilde">~</span>
                <div class="d-grp">
                    <input id="rTo" type="number" min="0" max="65535" placeholder="끝" oninput="updateRangePreview()">
                </div>
            </div>
            <div class="range-preview" id="rangePreview">주소를 입력하면 미리보기가 표시됩니다</div>
        </div>

        <div class="modal-field">
            <label>태그 이름 접두사  (비우면 주소가 이름 — D10000, D10001 ...)</label>
            <input class="modal-inp" id="rPrefix" type="text" placeholder="예: TAG_  →  TAG_10000, TAG_10001 ...">
        </div>

        <div style="display:flex;gap:10px;">
            <div class="modal-field" style="flex:1">
                <label>타입</label>
                <select class="modal-sel" id="rType">
                    <option value="WORD">WORD</option>
                    <option value="BIT">BIT</option>
                </select>
            </div>
            <div class="modal-field" style="flex:1">
                <label>PLC</label>
                <select class="modal-sel" id="rPlcId"></select>
            </div>
        </div>

        <div class="modal-err" id="rangeErr"></div>
        <div class="modal-actions">
            <button class="btn btn-red"    onclick="closeRangeModal()">취소</button>
            <button class="btn btn-yellow" id="rangeGenBtn" onclick="confirmRangeGen()">⚡ 생성</button>
        </div>
    </div>
</div>

<!-- ══ 토스트 ══ -->
<div class="toast" id="toast"></div>

<script>
var ROOT = '<%=request.getContextPath()%>';

// ── 상태 변수 ─────────────────────────────────────────────
var tagRows        = [];   // 현재 로드된 태그 배열
var selectedIds    = {};   // { id: true }
var lastClickIdx   = -1;   // Shift 범위 기준
var tagMode        = 'add';
var plcList        = [];   // tb_plc 목록 (PLC select 채우기용)

// ══ 초기화 ═══════════════════════════════════════════════
window.onload = function() { loadFolders(); loadPlcs(); };

// tb_plc 목록 조회 — TAG 모듈 전용 엔드포인트를 새로 안 만들고 AlarmController의 기존
// /alarm/plc/list(단순 SELECT * FROM tb_plc)를 그대로 재사용한다.
function loadPlcs() {
    fetch(ROOT + '/alarm/plc/list')
    .then(function(r){ return r.json(); })
    .then(function(list) {
        plcList = list || [];
        var optHtml = plcList.map(function(p){
            return '<option value="' + p.plcId + '">' + p.plcId + ' (' + p.ip + ':' + p.port + ')</option>';
        }).join('');
        ['tagPlcId', 'rPlcId', 'selPlcSel'].forEach(function(id){
            var el = document.getElementById(id);
            if (el) el.innerHTML = optHtml;
        });
    })
    .catch(function(e) { showToast('PLC 목록 로드 오류: ' + e.message, 'err'); });
}

// ══ 폴더 ═════════════════════════════════════════════════
function loadFolders() {
    fetch(ROOT + '/tag/folder/list')
    .then(function(r){ return r.json(); })
    .then(function(list) {
        var sel = document.getElementById('folderSelect');
        var prev = sel.value;
        sel.innerHTML = '<option value="0">— 폴더 선택 —</option>';
        (list || []).forEach(function(f) {
            var o = document.createElement('option');
            o.value = f.id; o.textContent = f.name;
            sel.appendChild(o);
        });
        if (prev && prev !== '0') { sel.value = prev; if (sel.value === prev) loadTags(); }
        document.getElementById('btnDelFolder').disabled = !(list && list.length);
        renderFolderList(list);
    })
    .catch(function(e) { showToast('폴더 로드 오류: ' + e.message, 'err'); });
}

function openFolderModal() {
    document.getElementById('folderName').value = '';
    document.getElementById('folderErr').style.display = 'none';
    document.getElementById('folderModal').classList.add('show');
    setTimeout(function(){ document.getElementById('folderName').focus(); }, 80);
}
function closeFolderModal() { document.getElementById('folderModal').classList.remove('show'); }

function confirmFolder() {
    var name = document.getElementById('folderName').value.trim();
    if (!name) { showFieldErr('folderErr', '폴더 이름을 입력하세요.'); return; }
    fetch(ROOT + '/tag/folder/insert', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: name })
    })
    .then(function(r){ return r.json(); })
    .then(function(d) {
        if (d.success) { closeFolderModal(); showToast('폴더 추가 완료','ok'); loadFolders(); }
        else showFieldErr('folderErr', d.error || '추가 실패');
    })
    .catch(function(e) { showFieldErr('folderErr', e.message); });
}

function deleteFolder() {
    var sel = document.getElementById('folderSelect');
    var fid = parseInt(sel.value);
    if (!fid) { showToast('폴더를 선택하세요.','err'); return; }
    if (!confirm('[' + sel.options[sel.selectedIndex].textContent + '] 폴더와 모든 태그를 삭제하시겠습니까?')) return;
    fetch(ROOT + '/tag/folder/delete', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ folderId: fid })
    })
    .then(function(r){ return r.json(); })
    .then(function(d) {
        if (d.success) { showToast('폴더 삭제 완료','ok'); clearTagTable(); loadFolders(); }
        else showToast(d.error || '삭제 실패','err');
    })
    .catch(function(e) { showToast(e.message,'err'); });
}

// ══ 태그 로드 & 렌더 ═════════════════════════════════════
function getFolderId() { return parseInt(document.getElementById('folderSelect').value) || 0; }

function loadTags() {
    var fid = getFolderId();
    if (!fid) { clearTagTable(); return; }
    fetch(ROOT + '/tag/list?folderId=' + fid)
    .then(function(r){ return r.json(); })
    .then(function(list) {
        tagRows = list || [];
        selectedIds = {}; lastClickIdx = -1;
        renderTable();
    })
    .catch(function(e) { showToast('태그 로드 오류: ' + e.message,'err'); });
}

function renderTable() {
    var tbody = document.getElementById('tagBody');
    if (!tagRows.length) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">등록된 태그가 없습니다</td></tr>';
        updateSelBar(); updateChkAll(); return;
    }
    var html = '';
    tagRows.forEach(function(t, idx) {
        var chk  = !!selectedIds[t.id];
        var plcBadge = t.plcType === 'MITSUBISHI'
            ? '<span class="plc-mit">' + esc(t.plcId||'') + '</span>'
            : '<span class="plc-ls">' + esc(t.plcId||'') + '</span>';
        html += '<tr class="' + (chk?'selected':'') + '" data-id="' + t.id + '" data-idx="' + idx + '"'
             + ' onclick="onRowClick(event,this,' + idx + ',' + t.id + ')">'
             + '<td onclick="event.stopPropagation()">'
             +   '<input type="checkbox" class="row-chk" ' + (chk?'checked':'') + ' data-id="' + t.id + '"'
             +   ' onchange="onChkChange(this,' + idx + ',' + t.id + ')"'
             +   ' style="cursor:pointer;accent-color:#00F0FF">'
             + '</td>'
             + '<td class="col-name">' + esc(t.name||'')    + '</td>'
             + '<td class="col-addr">' + esc(t.address||'') + '</td>'
             + '<td class="col-type">' + esc(t.type||'')     + '</td>'
             + '<td>' + plcBadge + '</td>'
             + '<td onclick="event.stopPropagation()">'
             +   '<input type="checkbox" class="row-enabled" ' + (t.enabled===1?'checked':'') + ' data-id="' + t.id + '"'
             +   ' onchange="onEnabledChange(this,' + t.id + ')"'
             +   ' style="cursor:pointer;accent-color:#00FF88">'
             + '</td>'
             + '</tr>';
    });
    tbody.innerHTML = html;
    updateSelBar(); updateChkAll();
}

// ══ 클릭 이벤트 (Shift 범위 선택) ════════════════════════
function onRowClick(e, row, idx, id) {
    if (e.target.tagName === 'INPUT') return; // 체크박스 클릭은 onChkChange가 처리

    if (e.shiftKey && lastClickIdx >= 0) {
        var from = Math.min(lastClickIdx, idx);
        var to   = Math.max(lastClickIdx, idx);
        for (var i = from; i <= to; i++) selectedIds[tagRows[i].id] = true;
    } else {
        if (selectedIds[id]) delete selectedIds[id];
        else                  selectedIds[id] = true;
        lastClickIdx = idx;
    }
    renderTable();
}

function onChkChange(chk, idx, id) {
    if (chk.checked) selectedIds[id] = true;
    else             delete selectedIds[id];
    lastClickIdx = idx;
    // 행 하이라이트 동기화
    var row = chk.closest('tr');
    if (selectedIds[id]) row.classList.add('selected');
    else                  row.classList.remove('selected');
    updateSelBar(); updateChkAll();
}

// 태그 목록의 TIMESTAMP 컬럼을 대체한 ENABLED 토글 — 체크 즉시 /tag/update로 저장하고,
// 실패하면 체크 상태를 롤백한다 (enabled=0인 태그는 LiveTagMonitorService 폴링 대상에서 제외됨).
function onEnabledChange(chk, id) {
    var t = tagRows.find(function(r){ return r.id === id; });
    if (!t) return;
    var enabled = chk.checked ? 1 : 0;
    fetch(ROOT + '/tag/update', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id: t.id, folderId: t.folderId, name: t.name, address: t.address, type: t.type, plcId: t.plcId, enabled: enabled })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
        if (d.success) { t.enabled = enabled; showToast(enabled ? '태그 사용' : '태그 미사용', 'ok'); }
        else { chk.checked = !chk.checked; showToast(d.error||'변경 실패','err'); }
    })
    .catch(function(e){ chk.checked = !chk.checked; showToast(e.message,'err'); });
}

function toggleAllCheck(master) {
    if (master.checked) tagRows.forEach(function(t){ selectedIds[t.id] = true; });
    else                selectedIds = {};
    lastClickIdx = -1;
    renderTable();
}

function updateChkAll() {
    var chkAll = document.getElementById('chkAll');
    var total = tagRows.length;
    var cnt   = Object.keys(selectedIds).length;
    if (!total || cnt === 0)     { chkAll.checked = false; chkAll.indeterminate = false; }
    else if (cnt === total)      { chkAll.checked = true;  chkAll.indeterminate = false; }
    else                         { chkAll.checked = false; chkAll.indeterminate = true;  }
}

function updateSelBar() {
    var cnt = Object.keys(selectedIds).length;
    document.getElementById('selCnt').textContent = cnt + '개 선택됨';
    var bar = document.getElementById('selBar');
    if (cnt > 0) bar.classList.add('show'); else bar.classList.remove('show');
    document.getElementById('btnEdit').disabled   = cnt !== 1;
    document.getElementById('btnDelete').disabled = cnt === 0;
}

function clearSelection() {
    selectedIds = {}; lastClickIdx = -1;
    renderTable();
}

function clearTagTable() {
    tagRows = []; selectedIds = {}; lastClickIdx = -1;
    document.getElementById('tagBody').innerHTML =
        '<tr class="empty-row"><td colspan="6">폴더를 선택하면 태그 목록이 표시됩니다</td></tr>';
    document.getElementById('selBar').classList.remove('show');
    document.getElementById('btnEdit').disabled   = true;
    document.getElementById('btnDelete').disabled = true;
}

// ══ PLC 일괄 변경 ════════════════════════════════════════
function bulkChangePlc() {
    var ids = Object.keys(selectedIds).map(Number);
    if (!ids.length) { showToast('선택된 태그가 없습니다.','err'); return; }
    var plcId = document.getElementById('selPlcSel').value;
    if (!plcId) { showToast('PLC를 선택하세요.','err'); return; }
    if (!confirm(ids.length + '개 태그의 PLC를 [' + plcId + ']으로 변경하시겠습니까?')) return;

    var targets = tagRows.filter(function(t){ return !!selectedIds[t.id]; });
    var fid = getFolderId();
    var done = 0, fail = 0;
    function next(i) {
        if (i >= targets.length) {
            showToast('PLC 변경 완료 (성공:' + done + ' 실패:' + fail + ')', fail?'err':'ok');
            clearSelection(); loadTags(); return;
        }
        var t = targets[i];
        fetch(ROOT + '/tag/update', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ id: t.id, folderId: t.folderId || fid, name: t.name, address: t.address, type: t.type||'WORD', plcId: plcId, enabled: t.enabled })
        })
        .then(function(r){ return r.json(); })
        .then(function(d){ if(d.success) done++; else fail++; next(i+1); })
        .catch(function(){ fail++; next(i+1); });
    }
    next(0);
}

// ══ 태그 삭제 (다중) ═════════════════════════════════════
function deleteSelectedTags() {
    var ids = Object.keys(selectedIds).map(Number);
    if (!ids.length) { showToast('삭제할 태그를 선택하세요.','err'); return; }
    if (!confirm(ids.length + '개 태그를 삭제하시겠습니까?')) return;
    var done = 0, fail = 0;
    function next(i) {
        if (i >= ids.length) {
            showToast('삭제 완료 (성공:' + done + ' 실패:' + fail + ')', fail?'err':'ok');
            clearSelection(); loadTags(); return;
        }
        fetch(ROOT + '/tag/delete', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ id: ids[i] })
        })
        .then(function(r){ return r.json(); })
        .then(function(d){ if(d.success) done++; else fail++; next(i+1); })
        .catch(function(){ fail++; next(i+1); });
    }
    next(0);
}

// ══ 태그 추가/수정 모달 ══════════════════════════════════
function openTagModal(mode) {
    tagMode = mode;
    document.getElementById('tagErr').style.display = 'none';

    if (mode === 'edit') {
        var ids = Object.keys(selectedIds).map(Number);
        if (ids.length !== 1) { showToast('수정할 태그를 1개만 선택하세요.','err'); return; }
        var t = tagRows.find(function(r){ return r.id === ids[0]; });
        if (!t) return;
        document.getElementById('tagModalTitle').textContent = 'TAG  수정';
        document.getElementById('tagSaveBtn').textContent   = '수정';
        document.getElementById('tagId').value      = t.id;
        document.getElementById('tagName').value    = t.name    || '';
        document.getElementById('tagAddress').value = t.address || '';
        document.getElementById('tagType').value    = t.type    || 'WORD';
        document.getElementById('tagPlcId').value   = t.plcId   || '';
        document.getElementById('tagEnabled').value = (t.enabled===0) ? '0' : '1';
    } else {
        document.getElementById('tagModalTitle').textContent = 'TAG  추가';
        document.getElementById('tagSaveBtn').textContent   = '추가';
        document.getElementById('tagId').value      = '';
        document.getElementById('tagName').value    = '';
        document.getElementById('tagAddress').value = '';
        document.getElementById('tagType').value    = 'WORD';
        document.getElementById('tagEnabled').value = '1';
    }
    document.getElementById('tagModal').classList.add('show');
    setTimeout(function(){ document.getElementById('tagName').focus(); }, 80);
}
function closeTagModal() { document.getElementById('tagModal').classList.remove('show'); }

function confirmTag() {
    var name    = document.getElementById('tagName').value.trim();
    var address = document.getElementById('tagAddress').value.trim();
    var type    = document.getElementById('tagType').value;
    var plcId   = document.getElementById('tagPlcId').value;
    var enabled = parseInt(document.getElementById('tagEnabled').value);
    var fid     = getFolderId();

    if (!name)    { showFieldErr('tagErr','태그 이름을 입력하세요.'); return; }
    if (!address) { showFieldErr('tagErr','주소를 입력하세요. (예: D100, M200)'); return; }
    if (!fid)     { showFieldErr('tagErr','폴더를 먼저 선택하세요.'); return; }
    if (!plcId)   { showFieldErr('tagErr','PLC를 선택하세요.'); return; }

    var url  = tagMode==='edit' ? ROOT+'/tag/update' : ROOT+'/tag/insert';
    var body = { folderId:fid, name:name, address:address, type:type, plcId:plcId, enabled:enabled };
    if (tagMode==='edit') body.id = parseInt(document.getElementById('tagId').value);

    fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
    .then(function(r){ return r.json(); })
    .then(function(d) {
        if (d.success) { closeTagModal(); showToast(tagMode==='edit'?'태그 수정 완료':'태그 추가 완료','ok'); loadTags(); }
        else showFieldErr('tagErr', d.error||'저장 실패');
    })
    .catch(function(e){ showFieldErr('tagErr', e.message); });
}

// ══ 범위 자동 생성 ═══════════════════════════════════════
function openRangeModal() {
    var from = document.getElementById('genFrom').value;
    var to   = document.getElementById('genTo').value;
    var dev  = document.getElementById('genDevice').value;
    document.getElementById('rDevice').value  = dev;
    document.getElementById('rFrom').value    = from;
    document.getElementById('rTo').value      = to;
    document.getElementById('rPrefix').value  = '';
    document.getElementById('rType').value    = 'WORD';
    document.getElementById('rangeErr').style.display = 'none';
    document.getElementById('rangeGenBtn').disabled   = false;
    document.getElementById('rangeGenBtn').textContent= '⚡ 생성';
    updateRangePreview();
    document.getElementById('rangeModal').classList.add('show');
}
function closeRangeModal() { document.getElementById('rangeModal').classList.remove('show'); }

function updateRangePreview() {
    var dev  = document.getElementById('rDevice').value;
    var from = parseInt(document.getElementById('rFrom').value);
    var to   = parseInt(document.getElementById('rTo').value);
    var el   = document.getElementById('rangePreview');
    if (isNaN(from)||isNaN(to)) { el.innerHTML='주소를 입력하면 미리보기가 표시됩니다'; return; }
    if (from > to)  { el.innerHTML='<span style="color:#FF4466">시작 주소가 끝 주소보다 큽니다</span>'; return; }
    var cnt = to - from + 1;
    if (cnt > 500)  { el.innerHTML='<span style="color:#FF4466">최대 500개까지 생성 가능합니다</span>'; return; }
    el.innerHTML = '→ <span>' + cnt + '개</span> 태그 생성 예정  (' + dev + from + ' ~ ' + dev + to + ')';
}

function confirmRangeGen() {
    var dev     = document.getElementById('rDevice').value;
    var from    = parseInt(document.getElementById('rFrom').value);
    var to      = parseInt(document.getElementById('rTo').value);
    var prefix  = document.getElementById('rPrefix').value.trim();
    var type    = document.getElementById('rType').value;
    var plcId   = document.getElementById('rPlcId').value;
    var fid     = getFolderId();

    if (isNaN(from)||isNaN(to)) { showFieldErr('rangeErr','주소를 입력하세요.'); return; }
    if (from > to)               { showFieldErr('rangeErr','시작 주소가 끝 주소보다 큽니다.'); return; }
    var cnt = to - from + 1;
    if (cnt > 500) { showFieldErr('rangeErr','최대 500개까지 생성 가능합니다.'); return; }
    if (!fid)      { showFieldErr('rangeErr','폴더를 먼저 선택하세요.'); return; }
    if (!plcId)    { showFieldErr('rangeErr','PLC를 선택하세요.'); return; }

    var btn = document.getElementById('rangeGenBtn');
    btn.disabled = true;
    btn.textContent = '생성 중...';
    document.getElementById('rangeErr').style.display = 'none';

    var tags = [];
    for (var d = from; d <= to; d++) {
        tags.push({ folderId:fid, name: prefix ? (prefix+d) : (dev+d), address: dev+d, type:type, plcId:plcId, enabled:1 });
    }

    var done = 0, fail = 0;
    function next(i) {
        if (i >= tags.length) {
            btn.disabled = false; btn.textContent = '⚡ 생성';
            closeRangeModal();
            showToast(cnt + '개 생성 완료 (성공:' + done + ' 실패:' + fail + ')', fail?'err':'ok');
            loadTags(); return;
        }
        fetch(ROOT + '/tag/insert', {
            method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(tags[i])
        })
        .then(function(r){ return r.json(); })
        .then(function(d){ if(d.success) done++; else fail++; btn.textContent=(i+1)+'/'+tags.length+' 생성 중...'; next(i+1); })
        .catch(function(){ fail++; next(i+1); });
    }
    next(0);
}

// ══ 유틸 ════════════════════════════════════════════════
function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
var _tt = null;
function showToast(msg, type) {
    var el = document.getElementById('toast');
    el.textContent = msg; el.className = 'toast ' + type + ' show';
    if (_tt) clearTimeout(_tt);
    _tt = setTimeout(function(){ el.classList.remove('show'); }, 2800);
}
function showFieldErr(elId, msg) {
    var el = document.getElementById(elId);
    el.textContent = msg; el.style.display = 'block';
}


function renderFolderList(list){
	  var wrap = document.getElementById('folderList');
	  if(!list || list.length === 0){
	    wrap.innerHTML = '<div class="folder-empty">등록된 폴더가 없습니다</div>';
	    return;
	  }

	  var current = document.getElementById('folderSelect').value;
	  var html = '';
	  list.forEach(function(f){
	    var active = (String(f.id) === String(current)) ? ' active' : '';
	    html += '<div class="folder-item' + active + '" data-id="' + f.id + '" onclick="selectFolder(' + f.id + ')">'
	          +   '<div class="folder-name">' + esc(f.name || '') + '</div>'
	          +   '<div class="folder-id">#' + f.id + '</div>'
	          + '</div>';
	  });
	  wrap.innerHTML = html;
	}

	function selectFolder(folderId){
	  var sel = document.getElementById('folderSelect');
	  sel.value = String(folderId);
	  loadTags();              // 기존 함수 그대로 사용
	  // 활성 표시 갱신
	  var items = document.querySelectorAll('#folderList .folder-item');
	  items.forEach(function(it){
	    it.classList.toggle('active', it.getAttribute('data-id') === String(folderId));
	  });
	}

	function filterFolderList(){
		  var q = (document.getElementById('folderSearch').value || '').toLowerCase();
		  var items = document.querySelectorAll('#folderList .folder-item');
		  items.forEach(function(it){
		    var name = (it.querySelector('.folder-name')?.textContent || '').toLowerCase();
		    it.style.display = name.includes(q) ? '' : 'none';
		  });
		}
</script>
</body>
</html>
