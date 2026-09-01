<%@ page contentType="text/html; charset=UTF-8" %>
<%--
  TagMonitorPage.jsp
  ────────────────────────────────────────────────────────────────
  TAG MANAGE(TagWorkPage.jsp)에서 폴더별로 등록한 folders_tags 태그를
  한 화면에서 실시간으로 보여주는 대시보드. 폴더 카드가 반응형 그리드로
  화면을 채우고, 카드 안에 태그가 타일로 배치된다 (BIT=ON/OFF 알약뱃지,
  WORD=숫자).

  값 자체는 이 페이지가 PLC와 직접 통신하는 게 아니라, C#(PlcApiServer)의
  LiveTagMonitorService가 백그라운드에서 이미 폴링해 메모리에 들고 있는
  값을 Java 쪽 /tag/live/values(TagController.liveValues)가 그대로
  중계해주는 것을 가져다 쓴다 — 그래서 조회 주기를 0.5~5초로 짧게 잡아도
  PLC에는 추가 부하가 없다.

  "구조"(폴더/태그 목록, /tag/folder/list·/tag/list)와 "값"(/tag/live/values)을
  분리해서 갱신한다: 구조는 자주 안 바뀌므로 30초마다, 값은 사용자가 고른
  주기(0.5~5초)로 각각 별도 타이머가 돈다.
--%>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>TAG MONITOR</title>
    <link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">

<style>
/* ══════════════════════════════════════════
   TAG MONITOR — 폴더별 실시간 태그 모니터링
══════════════════════════════════════════ */
:root {
  --bg:           #060810;
  --bg-panel:     #0b0e1a;
  --bg-deep:      #080b15;
  --bg-tile:      #0e1322;

  --cyan:         #00f0ff;
  --cyan-dim:     rgba(0,240,255,.07);
  --cyan-border:  rgba(0,240,255,.18);
  --cyan-glow:    0 0 18px rgba(0,240,255,.45);

  --green:        #00ff88;
  --green-glow:   0 0 14px rgba(0,255,136,.5);
  --green-border: rgba(0,255,136,.35);

  --amber:        #ffb700;
  --red:          #ff3b5c;
  --red-border:   rgba(255,59,92,.35);
  --purple:       #b06cff;

  --text-p:       #d8edf8;
  --text-s:       #4a6a88;
  --text-dim:     #1a2e45;

  --font:         '맑은 고딕', 'Malgun Gothic', sans-serif;
  --radius:       6px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }

body {
  background: var(--bg);
  color: var(--text-p);
  font-family: var(--font);
  font-size: 13px;
  height: 100%;
  display: flex; flex-direction: column;
  background-image:
    radial-gradient(ellipse at 10% 80%, rgba(0,240,255,.035) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 10%, rgba(176,108,255,.03) 0%, transparent 50%);
}

/* ══ HEADER ══ */
.page-header {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 14px;
  padding: 0 22px; height: 56px;
  border-bottom: 1px solid var(--cyan-border);
  background: linear-gradient(180deg, rgba(0,240,255,.04) 0%, transparent 100%);
}
.page-title { font-size: 20px; font-weight: 800; letter-spacing: 3px; color: var(--cyan); text-shadow: var(--cyan-glow); }
.page-sub   { font-size: 11px; color: var(--text-s); margin-top: 2px; }
.active-badge {
  display: flex; align-items: center; gap: 7px;
  background: rgba(0,255,136,.06); border: 1px solid var(--green-border);
  border-radius: 4px; padding: 4px 12px; font-size: 11px; color: var(--green);
}
.active-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: var(--green-glow); animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
.header-clock { margin-left: auto; font-size: 14px; color: var(--cyan); }
.poll-info { font-size: 11px; color: var(--text-s); }

/* ══ TOOLBAR ══ */
.toolbar {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 9px 16px; border-bottom: 1px solid var(--cyan-border); background: var(--bg-deep);
}
.tb-search {
  width: 220px; height: 30px; background: var(--bg-panel); border: 1px solid var(--cyan-border);
  color: var(--cyan); font-size: 12px; padding: 0 10px; outline: none; border-radius: 3px;
}
.tb-search:focus { border-color: var(--cyan); box-shadow: 0 0 8px rgba(0,240,255,.2); }
.tb-sel {
  height: 30px; background: var(--bg-panel); border: 1px solid var(--cyan-border);
  color: var(--text-p); font-size: 12px; padding: 0 8px; border-radius: 3px; cursor: pointer;
}
.tb-spacer { flex: 1; }
.btn {
  height: 30px; padding: 0 14px; background: transparent;
  font-size: 12px; font-weight: 600; border-radius: 3px; border: 1px solid; cursor: pointer;
  transition: all .15s; color: var(--cyan); border-color: rgba(0,240,255,.35);
}
.btn:hover { background: var(--cyan-dim); box-shadow: var(--cyan-glow); }

/* ══ GRID AREA (반응형 — 폴더 카드가 화면을 채움) ══ */
.grid-area {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
  align-content: start;
}
.grid-area::-webkit-scrollbar { width: 6px; }
.grid-area::-webkit-scrollbar-thumb { background: var(--cyan-border); border-radius: 3px; }

.folder-card {
  background: var(--bg-panel);
  border: 1px solid var(--cyan-border);
  border-radius: var(--radius);
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 16px rgba(0,240,255,.05);
}
.folder-card-head {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 8px;
  padding: 9px 14px;
  background: var(--bg-deep);
  border-bottom: 1px solid var(--cyan-border);
}
.folder-card-title { font-size: 13px; font-weight: 700; color: var(--purple); }
.folder-card-count {
  margin-left: auto; font-size: 10px; color: var(--text-s);
  background: var(--bg); border: 1px solid var(--cyan-border);
  padding: 1px 8px; border-radius: 8px;
}
.folder-card-body {
  padding: 10px 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.folder-empty-note { padding: 20px; text-align: center; color: var(--text-dim); font-size: 11px; grid-column: 1 / -1; }

/* ══ 태그 타일 ══ */
.tag-tile {
  background: var(--bg-tile);
  border: 1px solid var(--cyan-border);
  border-radius: 4px;
  padding: 8px 10px;
  display: flex; flex-direction: column; gap: 4px;
  transition: border-color .2s, box-shadow .2s;
}
.tag-tile.stale { opacity: .45; }
.tag-name { font-size: 11px; color: var(--text-p); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tag-meta { font-size: 9px; color: var(--text-s); display: flex; gap: 6px; }
.tag-addr { color: var(--cyan); }
.tag-plc  { color: var(--purple); }

.tag-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
.tag-value.word { color: var(--amber); }
.tag-value.null { color: var(--text-dim); font-size: 12px; font-weight: 400; }

/* BIT 태그: ON/OFF 알약 뱃지 */
.bit-pill {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700; letter-spacing: 1px;
  padding: 3px 10px; border-radius: 10px; border: 1px solid; width: fit-content;
}
.bit-pill.on  { color: var(--green); border-color: var(--green-border); background: rgba(0,255,136,.08); box-shadow: var(--green-glow); }
.bit-pill.off { color: var(--text-s); border-color: var(--cyan-border); background: transparent; }
.bit-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-dim); font-size: 13px; }
</style>
</head>
<body>

<!-- ══ HEADER ══ -->
<div class="page-header">
  <div>
    <div class="page-title">📡 TAG MONITOR</div>
    <div class="page-sub">// 폴더별 실시간 태그 값 (BIT/WORD 통합)</div>
  </div>
  <div class="active-badge"><div class="active-dot"></div>LIVE</div>
  <div class="header-clock" id="headerClock">--:--:--</div>
  <div class="poll-info" id="pollInfo">폴링 정보 로드 중...</div>
</div>

<jsp:include page="/WEB-INF/views/include/monitorNav.jsp"/>

<div class="toolbar">
  <input class="tb-search" id="tagSearch" placeholder="태그/폴더 검색..." oninput="applyFilter()">
  <select class="tb-sel" id="refreshInterval" onchange="restartValueTimer()">
    <option value="500">0.5초</option>
    <option value="1000" selected>1초</option>
    <option value="2000">2초</option>
    <option value="5000">5초</option>
  </select>
  <div class="tb-spacer"></div>
  <button class="btn" onclick="loadStructure()">↺ 구조 새로고침</button>
</div>

<div class="grid-area" id="gridArea">
  <div class="empty-state">폴더/태그를 불러오는 중...</div>
</div>

<script>
var base = '<%=ctx%>';
var folders = [];          // [{id,name}]
var tagsByFolder = {};      // folderId -> [tag,...]
var valueTimer = null;
var structTimer = null;

setInterval(function(){
  var n = new Date(), p = function(v){ return String(v).padStart(2,'0'); };
  document.getElementById('headerClock').textContent = p(n.getHours())+':'+p(n.getMinutes())+':'+p(n.getSeconds());
}, 1000);

// 폴더 목록 + 폴더별 태그 목록을 새로 받아와서 그리드를 다시 그린다 (값이 아니라 "구조" 갱신).
// 태그를 새로 추가/삭제했을 때 반영하기 위한 것이라 값 갱신(refreshValues)보다 훨씬 느리게(30초) 돈다.
function loadStructure() {
  fetch(base + '/tag/folder/list')
    .then(function(r){ return r.json(); })
    .then(function(list){
      folders = list || [];
      return Promise.all(folders.map(function(f){
        return fetch(base + '/tag/list?folderId=' + f.id)
          .then(function(r){ return r.json(); })
          .then(function(tags){ tagsByFolder[f.id] = tags || []; });
      }));
    })
    .then(function(){ renderGrid(); refreshValues(); })
    .catch(function(e){ document.getElementById('gridArea').innerHTML = '<div class="empty-state">로드 실패: ' + e.message + '</div>'; });
}

function renderGrid() {
  var grid = document.getElementById('gridArea');
  if (!folders.length) { grid.innerHTML = '<div class="empty-state">등록된 폴더가 없습니다. TAG MANAGE에서 먼저 만들어주세요.</div>'; return; }

  var html = '';
  folders.forEach(function(f){
    var tags = tagsByFolder[f.id] || [];
    html += '<div class="folder-card" data-folder="' + f.id + '">'
         +    '<div class="folder-card-head">'
         +      '<div class="folder-card-title">' + esc(f.name||'') + '</div>'
         +      '<div class="folder-card-count">' + tags.length + '</div>'
         +    '</div>'
         +    '<div class="folder-card-body">';
    if (!tags.length) {
      html += '<div class="folder-empty-note">태그 없음</div>';
    } else {
      tags.forEach(function(t){
        var isBit = (t.type||'WORD').toUpperCase() === 'BIT';
        html += '<div class="tag-tile" data-tag="' + t.id + '" data-name="' + esc((t.name||'').toLowerCase()) + '">'
             +    '<div class="tag-name" title="' + esc(t.name||'') + '">' + esc(t.name||'') + '</div>'
             +    '<div class="tag-meta"><span class="tag-addr">' + esc(t.address||'') + '</span><span class="tag-plc">' + esc(t.plcId||'') + '</span></div>'
             +    '<div class="tag-value-wrap" id="val_' + t.id + '" data-bit="' + isBit + '">'
             +      (isBit ? bitPillHtml(null) : '<span class="tag-value null">—</span>')
             +    '</div>'
             +  '</div>';
      });
    }
    html += '</div></div>';
  });
  grid.innerHTML = html;
  applyFilter();
}

function bitPillHtml(raw) {
  if (raw === null || raw === undefined) return '<span class="tag-value null">—</span>';
  var on = raw !== 0;
  return '<span class="bit-pill ' + (on?'on':'off') + '"><span class="bit-dot"></span>' + (on?'ON':'OFF') + '</span>';
}

// 현재 그려져 있는 타일들의 값만 갱신한다 (그리드를 다시 그리지 않음 — 깜빡임 없이 숫자/뱃지만 교체).
// 응답에 tagId가 아예 없으면(값 없음) 타일에 .stale을 붙여 흐리게 표시한다 — PLC가 안 붙어 있거나
// 아직 한 번도 폴링되지 않은 태그(예: 연결 안 되는 PLC를 가리키는 태그)를 구분하기 위함.
function refreshValues() {
  fetch(base + '/tag/live/values')
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (!res || res.success === false) { document.getElementById('pollInfo').textContent = '실시간값 조회 실패'; return; }
      var values = res.values || {};
      document.querySelectorAll('.tag-value-wrap').forEach(function(el){
        var tagId = el.closest('.tag-tile').getAttribute('data-tag');
        var raw = values.hasOwnProperty(tagId) ? values[tagId] : undefined;
        var isBit = el.getAttribute('data-bit') === 'true';
        var tile = el.closest('.tag-tile');
        if (raw === undefined) {
          tile.classList.add('stale');
        } else {
          tile.classList.remove('stale');
        }
        if (isBit) {
          el.innerHTML = bitPillHtml(raw === undefined ? null : raw);
        } else {
          el.innerHTML = (raw === undefined || raw === null)
            ? '<span class="tag-value null">—</span>'
            : '<span class="tag-value word">' + raw + '</span>';
        }
      });
      var pollAt = res.lastPollAt ? new Date(res.lastPollAt).toLocaleTimeString('ko-KR') : '-';
      document.getElementById('pollInfo').textContent = '마지막 폴링: ' + pollAt;
    })
    .catch(function(e){ document.getElementById('pollInfo').textContent = '조회 오류: ' + e.message; });
}

function restartValueTimer() {
  if (valueTimer) clearInterval(valueTimer);
  var ms = parseInt(document.getElementById('refreshInterval').value) || 1000;
  valueTimer = setInterval(refreshValues, ms);
}

function applyFilter() {
  var q = (document.getElementById('tagSearch').value || '').toLowerCase();
  document.querySelectorAll('.folder-card').forEach(function(card){
    var tiles = card.querySelectorAll('.tag-tile');
    var folderName = (card.querySelector('.folder-card-title').textContent || '').toLowerCase();
    var anyVisible = folderName.indexOf(q) !== -1;
    tiles.forEach(function(tile){
      var name = tile.getAttribute('data-name') || '';
      var show = !q || folderName.indexOf(q) !== -1 || name.indexOf(q) !== -1;
      tile.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    card.style.display = anyVisible ? '' : 'none';
  });
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.loadStructure = loadStructure;
window.applyFilter = applyFilter;
window.restartValueTimer = restartValueTimer;

loadStructure();
restartValueTimer();
structTimer = setInterval(loadStructure, 30000);  // 폴더/태그 구조는 30초마다 자동 갱신 (추가/삭제 반영)
</script>
</body>
</html>
