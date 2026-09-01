<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../common_style.jsp" %>
<style>
.perm-layout { display:grid; grid-template-columns:240px 1fr; gap:16px; }
@media(max-width:800px){ .perm-layout{grid-template-columns:1fr} }

.user-list-card { max-height: calc(100vh - 160px); overflow-y:auto; }
.perm-table-card { max-height: calc(100vh - 160px); overflow:auto; }

.user-item {
  display:flex; align-items:center; gap:10px; padding:9px 12px;
  border-radius:8px; border:1px solid var(--border); background:var(--white);
  cursor:pointer; margin-bottom:6px; transition:all .13s; font-size:13px;
}
.user-item:hover { border-color:var(--primary-m); background:var(--primary-l); }
.user-item.active { border-color:var(--primary); background:var(--primary-l); box-shadow:0 0 0 2px var(--primary-m); font-weight:700; }
.user-avatar-sm { width:30px; height:30px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; }

.perm-table { width:100%; border-collapse:collapse; font-size:13px; }
.perm-table th { background:var(--bg); padding:10px 14px; text-align:center; font-size:11px; font-weight:700; color:var(--muted); border-bottom:2px solid var(--border); white-space:nowrap; }
.perm-table th:first-child { text-align:left; }
.perm-table td { padding:10px 14px; border-bottom:1px solid var(--border); vertical-align:middle; }
.perm-table td:not(:first-child) { text-align:center; }
.perm-table tr:last-child td { border-bottom:none; }
.perm-table tbody tr:hover td { background:var(--primary-l); }
.page-icon { font-size:15px; margin-right:6px; }
.page-name { font-weight:600; }
.page-url  { font-size:10px; color:var(--muted); margin-top:2px; }

/* 토글 스위치 */
.tog { position:relative; width:40px; height:22px; display:inline-block; cursor:pointer; vertical-align:middle; }
.tog input { opacity:0; width:0; height:0; position:absolute; }
.tog-slider { position:absolute; inset:0; background:#CBD5E0; border-radius:22px; transition:.2s; }
.tog-slider::before { content:''; position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:.2s; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.tog input:checked + .tog-slider           { background:var(--primary); }
.tog input:checked + .tog-slider.tog-grn   { background:var(--green);  }
.tog input:checked + .tog-slider.tog-org   { background:var(--orange); }
.tog input:checked + .tog-slider.tog-red   { background:var(--red);    }
.tog input:checked + .tog-slider::before   { transform:translateX(18px); }

.all-row { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; align-items:center; }
.all-row span { font-size:11px; color:var(--muted); font-weight:600; }
</style>
<body>
<div class="page-wrap">
  <div class="page-header">
    <div>
      <div class="page-title">권한 부여</div>
      <div class="page-sub" id="subTitle">사용자를 선택하세요</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn-outline" onclick="allAllow()">전체 허용</button>
      <button class="btn-outline" onclick="allDeny()">전체 제한</button>
      <button class="btn-primary" onclick="savePerms()" data-perm="edit">저장</button>
    </div>
  </div>

  <div class="perm-layout">
    <!-- 사용자 목록 -->
    <div class="card user-list-card">
      <div class="card-title">사용자</div>
      <div id="userList"><div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">로딩 중…</div></div>
    </div>

    <!-- 권한 테이블 -->
    <div class="card perm-table-card">
      <div class="card-title" id="permTitle">권한 설정</div>
      <div id="noSel" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">좌측에서 사용자를 선택하세요</div>
      <div id="permArea" style="display:none">
        <div class="all-row">
          <span>일괄 설정</span>
          <button class="btn-outline btn-sm" onclick="colAllow('canView')">화면 전체허용</button>
          <button class="btn-outline btn-sm" onclick="colDeny('canView')">화면 전체제한</button>
          <button class="btn-outline btn-sm" onclick="colAllow('canAdd')">추가 전체허용</button>
          <button class="btn-outline btn-sm" onclick="colAllow('canEdit')">수정 전체허용</button>
          <button class="btn-outline btn-sm" onclick="colAllow('canDel')">삭제 전체허용</button>
        </div>
        <table class="perm-table">
          <thead>
            <tr>
              <th style="width:200px">페이지</th>
              <th>화면 표시</th>
              <th>추가</th>
              <th>수정</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody id="permBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<script>
var base = '${pageContext.request.contextPath}';
var selEmpId = null;
var permData = {};  // { pageUrl: {canView,canAdd,canEdit,canDel} }

var PAGES = [
  { url:'alarm/history',        name:'알람 이력',       icon:'🔔' },
  { url:'alarm/ranking',        name:'알람 랭킹',       icon:'🏆' },
  { url:'trend',                name:'트렌드',          icon:'📈' },
  { url:'user/manage',          name:'사용자 관리',     icon:'👤' },
  { url:'user/permission',      name:'권한 부여',       icon:'🔐' }
];

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* 사용자 목록 로드 */
fetch(base+'/emp/list')
  .then(function(r){ return r.json(); })
  .then(function(d){
    if(!d.success || !d.data){ document.getElementById('userList').innerHTML='<div style="color:var(--red);font-size:12px;padding:10px">로드 실패</div>'; return; }
    var html='';
    d.data.forEach(function(emp){
      var init = (emp.emp_name||'?').charAt(0);
      html += '<div class="user-item" id="u_'+emp.emp_id+'" onclick="selectUser('+emp.emp_id+',\''+esc(emp.emp_name)+'\')">'
            + '<div class="user-avatar-sm">'+init+'</div>'
            + '<div><div style="font-size:13px;font-weight:600">'+esc(emp.emp_name)+'</div>'
            + '<div style="font-size:10px;color:var(--muted)">'+esc(emp.dept_name||'')+'</div></div>'
            + '</div>';
    });
    document.getElementById('userList').innerHTML = html || '<div style="padding:10px;color:var(--muted);font-size:12px">사용자 없음</div>';
  });

function selectUser(empId, name) {
  selEmpId = empId;
  document.querySelectorAll('.user-item').forEach(function(el){ el.classList.remove('active'); });
  var el = document.getElementById('u_'+empId);
  if(el) el.classList.add('active');
  document.getElementById('subTitle').textContent = name + ' 님 권한 설정';
  document.getElementById('permTitle').textContent = name + ' 권한';

  fetch(base+'/perm/list?empId='+empId)
    .then(function(r){ return r.json(); })
    .then(function(data){
      var list = Array.isArray(data) ? data : [];
      permData = {};
      list.forEach(function(p){ permData[p.pageUrl] = p; });
      renderPermTable();
      document.getElementById('noSel').style.display = 'none';
      document.getElementById('permArea').style.display = 'block';
    })
    .catch(function(){ renderPermTable(); document.getElementById('noSel').style.display='none'; document.getElementById('permArea').style.display='block'; });
}

function renderPermTable() {
  var html = '';
  PAGES.forEach(function(page){
    var p = permData[page.url] || {};
    var view = (p.canView !== 'N');
    var add  = (p.canAdd  !== 'N');
    var edit = (p.canEdit !== 'N');
    var del  = (p.canDel  !== 'N');
    html += '<tr>'
          + '<td><span class="page-icon">'+page.icon+'</span><span class="page-name">'+esc(page.name)+'</span>'
          + '<div class="page-url">/main_1/'+page.url+'</div></td>'
          + '<td><label class="tog"><input type="checkbox" data-url="'+page.url+'" data-col="canView"'+(view?' checked':'')+'><span class="tog-slider tog-grn"></span></label></td>'
          + '<td><label class="tog"><input type="checkbox" data-url="'+page.url+'" data-col="canAdd"'+(add?' checked':'')+'><span class="tog-slider"></span></label></td>'
          + '<td><label class="tog"><input type="checkbox" data-url="'+page.url+'" data-col="canEdit"'+(edit?' checked':'')+'><span class="tog-slider tog-org"></span></label></td>'
          + '<td><label class="tog"><input type="checkbox" data-url="'+page.url+'" data-col="canDel"'+(del?' checked':'')+'><span class="tog-slider tog-red"></span></label></td>'
          + '</tr>';
  });
  document.getElementById('permBody').innerHTML = html;
}

function collectPerms() {
  var result = [];
  PAGES.forEach(function(page){
    var getVal = function(col){
      var el = document.querySelector('input[data-url="'+page.url+'"][data-col="'+col+'"]');
      return el && el.checked ? 'Y' : 'N';
    };
    result.push({ pageUrl:page.url, canView:getVal('canView'), canAdd:getVal('canAdd'), canEdit:getVal('canEdit'), canDel:getVal('canDel') });
  });
  return result;
}

function colAllow(col){ document.querySelectorAll('input[data-col="'+col+'"]').forEach(function(el){ el.checked=true; }); }
function colDeny(col) { document.querySelectorAll('input[data-col="'+col+'"]').forEach(function(el){ el.checked=false; }); }
function allAllow()   { ['canView','canAdd','canEdit','canDel'].forEach(colAllow); }
function allDeny()    { ['canView','canAdd','canEdit','canDel'].forEach(colDeny); }

function savePerms() {
  if(!selEmpId){ alert('사용자를 선택하세요'); return; }
  fetch(base+'/perm/save', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ empId: selEmpId, perms: collectPerms() })
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if(d.success){ alert('저장되었습니다.'); }
    else { alert(d.error||'저장 실패'); }
  })
  .catch(function(){ alert('저장 실패'); });
}
</script>
</body>
</html>
