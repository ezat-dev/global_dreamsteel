<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="../common_style.jsp" %>
<style>
.modal-overlay { display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;align-items:center;justify-content:center; }
.modal-overlay.show { display:flex; }
.modal-box { background:var(--white);border-radius:14px;padding:28px 32px;width:500px;box-shadow:0 8px 40px rgba(0,0,0,.18);max-height:90vh;overflow-y:auto; }
.modal-title { font-size:16px;font-weight:700;margin-bottom:20px;color:var(--text); }
.modal-grid  { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
.modal-actions { display:flex;justify-content:flex-end;gap:8px;margin-top:24px; }
.search-bar { display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap; }
.btn-danger { padding:4px 10px;border-radius:6px;border:1px solid var(--red);background:none;color:var(--red);font-size:12px;cursor:pointer;transition:all .13s; }
.btn-danger:hover { background:var(--red-l); }
</style>
<body>
<div class="page-wrap">
  <div class="page-header">
    <div>
      <div class="page-title">사용자 관리</div>
      <div class="page-sub">tb_company_employee · 전체 <strong id="totalCnt">0</strong>명</div>
    </div>
    <button class="btn-primary" onclick="openModal()" data-perm="add">➕ 사용자 추가</button>
  </div>

  <div class="card">
    <div class="search-bar">
      <div class="card-title" style="margin:0">직원 목록</div>
      <input class="form-input" type="text" id="searchQ" placeholder="이름·아이디·부서 검색" style="width:220px;margin-left:auto" oninput="renderTable()">
      <select class="form-select" id="filterUse" style="width:110px" onchange="renderTable()">
        <option value="">전체</option>
        <option value="Y">활성</option>
        <option value="N">비활성</option>
      </select>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th>No</th><th>아이디</th><th>이름</th><th>부서</th><th>직책</th>
          <th>핸드폰</th><th>직통번호</th><th>등록일</th><th>상태</th><th>관리</th>
        </tr>
      </thead>
      <tbody id="empBody">
        <tr><td colspan="10" style="text-align:center;padding:40px;color:var(--muted)">불러오는 중…</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- 추가/수정 모달 -->
<div class="modal-overlay" id="empModal">
  <div class="modal-box">
    <div class="modal-title" id="modalTitle">➕ 사용자 추가</div>
    <input type="hidden" id="fEmpId">
    <div class="modal-grid">
      <div class="form-field">
        <label class="form-label">아이디 *</label>
        <input class="form-input" type="text" id="fId" placeholder="로그인 아이디" style="width:100%">
      </div>
      <div class="form-field">
        <label class="form-label">비밀번호 <span id="pwHint" style="font-weight:400;color:var(--muted)">(필수)</span></label>
        <input class="form-input" type="password" id="fPw" placeholder="비밀번호" style="width:100%">
      </div>
      <div class="form-field">
        <label class="form-label">이름 *</label>
        <input class="form-input" type="text" id="fName" style="width:100%">
      </div>
      <div class="form-field">
        <label class="form-label">부서</label>
        <input class="form-input" type="text" id="fDept" placeholder="예) 생산팀" style="width:100%">
      </div>
      <div class="form-field">
        <label class="form-label">직책</label>
        <input class="form-input" type="text" id="fTitle" placeholder="예) 과장" style="width:100%">
      </div>
      <div class="form-field">
        <label class="form-label">핸드폰</label>
        <input class="form-input" type="text" id="fMobile" placeholder="010-0000-0000" style="width:100%">
      </div>
      <div class="form-field" style="grid-column:1/-1">
        <label class="form-label">직통번호</label>
        <input class="form-input" type="text" id="fDirect" placeholder="내선번호" style="width:100%">
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="closeModal()">취소</button>
      <button class="btn-primary" onclick="saveEmp()">저장</button>
    </div>
  </div>
</div>

<script>
var base = '${pageContext.request.contextPath}';
var empData = [];

/* ── 목록 로드 ── */
function loadList(){
  fetch(base + '/emp/list')
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.success){ empData = d.data || []; renderTable(); }
    });
}

/* ── 렌더링 ── */
function renderTable(){
  var _p = (window.__PERMS && window.__PERMS['user/manage']) || {};
  var canEdit = _p.canEdit !== 'N';
  var canDel  = _p.canDel  !== 'N';
  var q   = document.getElementById('searchQ').value.trim().toLowerCase();
  var use = document.getElementById('filterUse').value;
  var list = empData.filter(function(r){
    var matchQ   = !q || (r.emp_name||'').toLowerCase().includes(q)
                      || (r.id||'').toLowerCase().includes(q)
                      || (r.dept_name||'').toLowerCase().includes(q);
    var matchUse = !use || r.use_yn === use;
    return matchQ && matchUse;
  });
  document.getElementById('totalCnt').textContent = empData.length;
  if(!list.length){
    document.getElementById('empBody').innerHTML =
      '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--muted)">데이터가 없습니다.</td></tr>';
    return;
  }
  var html = '';
  list.forEach(function(r, i){
    var active = r.use_yn === 'Y';
    html += '<tr>'
      + '<td>'+(i+1)+'</td>'
      + '<td style="font-family:monospace;font-size:12px">'+ esc(r.id) +'</td>'
      + '<td style="font-weight:600">'+ esc(r.emp_name) +'</td>'
      + '<td>'+ esc(r.dept_name) +'</td>'
      + '<td>'+ esc(r.title_name) +'</td>'
      + '<td style="font-size:12px">'+ esc(r.mobile_no) +'</td>'
      + '<td style="font-size:12px">'+ esc(r.direct_no) +'</td>'
      + '<td style="font-size:11px;color:var(--muted)">'+ esc(r.reg_date) +'</td>'
      + '<td><span class="badge '+(active?'badge-ok':'badge-off')+'">'+(active?'활성':'비활성')+'</span></td>'
      + '<td style="display:flex;gap:4px">'
      +   (canEdit ? '<button class="btn-outline btn-sm" onclick="openEdit('+ r.emp_id +')">수정</button>' : '')
      +   (canEdit ? '<button class="btn-outline btn-sm" style="color:var(--orange);border-color:var(--orange)" onclick="toggleEmp('+ r.emp_id +')">'+(active?'비활성화':'활성화')+'</button>' : '')
      +   (canDel  ? '<button class="btn-danger btn-sm" onclick="deleteEmp('+ r.emp_id +', \''+ esc(r.emp_name) +'\')">삭제</button>' : '')
      + '</td>'
      + '</tr>';
  });
  document.getElementById('empBody').innerHTML = html;
}

/* ── 모달 열기 (추가) ── */
function openModal(){
  document.getElementById('modalTitle').textContent = '➕ 사용자 추가';
  document.getElementById('pwHint').textContent = '(필수)';
  document.getElementById('fEmpId').value = '';
  document.getElementById('fId').value    = '';
  document.getElementById('fPw').value    = '';
  document.getElementById('fName').value  = '';
  document.getElementById('fDept').value  = '';
  document.getElementById('fTitle').value = '';
  document.getElementById('fMobile').value= '';
  document.getElementById('fDirect').value= '';
  document.getElementById('empModal').classList.add('show');
}

/* ── 모달 열기 (수정) ── */
function openEdit(empId){
  var r = empData.find(function(e){ return e.emp_id == empId; });
  if(!r) return;
  document.getElementById('modalTitle').textContent = '✏️ 사용자 수정';
  document.getElementById('pwHint').textContent = '(빈칸이면 유지)';
  document.getElementById('fEmpId').value = r.emp_id;
  document.getElementById('fId').value    = r.id || '';
  document.getElementById('fPw').value    = '';
  document.getElementById('fName').value  = r.emp_name || '';
  document.getElementById('fDept').value  = r.dept_name || '';
  document.getElementById('fTitle').value = r.title_name || '';
  document.getElementById('fMobile').value= r.mobile_no || '';
  document.getElementById('fDirect').value= r.direct_no || '';
  document.getElementById('empModal').classList.add('show');
}

function closeModal(){ document.getElementById('empModal').classList.remove('show'); }

/* ── 저장 ── */
function saveEmp(){
  var empId = document.getElementById('fEmpId').value;
  var id    = document.getElementById('fId').value.trim();
  var pw    = document.getElementById('fPw').value;
  var name  = document.getElementById('fName').value.trim();
  if(!id){ alert('아이디를 입력하세요.'); return; }
  if(!name){ alert('이름을 입력하세요.'); return; }
  if(!empId && !pw){ alert('비밀번호를 입력하세요.'); return; }

  var body = {
    emp_id:     empId || null,
    id:         id,
    pw_no:      pw,
    emp_name:   name,
    dept_name:  document.getElementById('fDept').value.trim(),
    title_name: document.getElementById('fTitle').value.trim(),
    mobile_no:  document.getElementById('fMobile').value.trim(),
    direct_no:  document.getElementById('fDirect').value.trim()
  };

  fetch(base + '/emp/save', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if(d.success){ closeModal(); loadList(); }
    else alert('저장 실패: ' + (d.message||'오류'));
  });
}

/* ── 토글 ── */
function toggleEmp(empId){
  fetch(base + '/emp/toggle', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({emp_id: empId})
  })
  .then(function(r){ return r.json(); })
  .then(function(d){ if(d.success) loadList(); else alert('처리 실패'); });
}

/* ── 삭제 ── */
function deleteEmp(empId, name){
  if(!confirm('"'+ name +'" 을(를) 삭제하시겠습니까?')) return;
  fetch(base + '/emp/delete', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({emp_id: empId})
  })
  .then(function(r){ return r.json(); })
  .then(function(d){ if(d.success) loadList(); else alert('삭제 실패'); });
}

function esc(s){ return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

loadList();
</script>
</body>
</html>
