<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
    String uri = request.getRequestURI();
    boolean isEzAttendPage = uri != null && (uri.endsWith("/ez_in_out/attend/list") || uri.endsWith("/ez_in_out/attend/record-list"));
    if (!isEzAttendPage && session.getAttribute("loginEmp") == null && session.getAttribute("loginUser") == null) {
        String loginUrl = request.getContextPath() + "/main_1/login";
%>
<!DOCTYPE html><html><head><script>
window.top.location.replace('<%=loginUrl%>');
</script></head><body></body></html>
<%
        return;
    }
%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
:root {
  --bg:        #F0F4F8;
  --white:     #FFFFFF;
  --primary:   #3182CE;
  --primary-d: #2B6CB0;
  --primary-l: #EBF8FF;
  --primary-m: #BEE3F8;
  --green:     #38A169;
  --green-l:   #F0FFF4;
  --orange:    #DD6B20;
  --orange-l:  #FFFAF0;
  --red:       #E53E3E;
  --red-l:     #FFF5F5;
  --purple:    #6B46C1;
  --purple-l:  #FAF5FF;
  --text:      #2D3748;
  --muted:     #718096;
  --light:     #A0AEC0;
  --border:    #E2E8F0;
  --shadow:    0 1px 4px rgba(0,0,0,.07);
  --shadow-md: 0 4px 16px rgba(0,0,0,.10);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; font-family: 'Segoe UI','Malgun Gothic',sans-serif; background: var(--bg); color: var(--text); }

.page-wrap { padding: 22px 24px; height: 100vh; overflow-y: auto; }
.page-wrap::-webkit-scrollbar { width: 5px; }
.page-wrap::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
}
.page-title { font-size: 20px; font-weight: 700; color: var(--text); }
.page-sub   { font-size: 12px; color: var(--muted); margin-top: 3px; }

/* 카드 */
.card {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 12px; box-shadow: var(--shadow); padding: 18px 20px;
}
.card-title {
  font-size: 13px; font-weight: 700; color: var(--text);
  margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
}
.card-title::before { content:''; width:3px; height:15px; background:var(--primary); border-radius:2px; }

/* 테이블 */
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th {
  background: var(--bg); color: var(--muted); font-size: 11px;
  font-weight: 600; text-align: left; padding: 9px 12px;
  border-bottom: 2px solid var(--border); white-space: nowrap;
}
.data-table td {
  padding: 10px 12px; border-bottom: 1px solid var(--border);
  color: var(--text); vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--primary-l); }

/* 버튼 */
.btn-primary {
  padding: 7px 16px; border-radius: 7px;
  border: none; background: var(--primary); color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background .13s;
}
.btn-primary:hover { background: var(--primary-d); }
.btn-outline {
  padding: 7px 16px; border-radius: 7px;
  border: 1px solid var(--border); background: var(--white);
  color: var(--muted); font-size: 13px; cursor: pointer;
  transition: all .13s;
}
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }
.btn-sm { padding: 4px 10px; font-size: 11px; border-radius: 5px; }

/* 배지 */
.badge {
  display: inline-flex; align-items: center; padding: 2px 8px;
  border-radius: 20px; font-size: 11px; font-weight: 600;
  white-space: nowrap;
}
.badge-ok    { background: #F0FFF4; color: var(--green);  border: 1px solid #9AE6B4; }
.badge-warn  { background: #FFFAF0; color: var(--orange); border: 1px solid #FBD38D; }
.badge-alarm { background: #FFF5F5; color: var(--red);    border: 1px solid #FEB2B2; }
.badge-off   { background: var(--bg); color: var(--light); border: 1px solid var(--border); }
.badge-blue  { background: var(--primary-l); color: var(--primary); border: 1px solid var(--primary-m); }

/* 폼 */
.form-row  { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 11px; color: var(--muted); font-weight: 600; }
.form-input, .form-select {
  padding: 7px 10px; border: 1px solid var(--border);
  border-radius: 7px; font-size: 13px; color: var(--text);
  background: var(--white); outline: none; transition: border-color .13s;
}
.form-input:focus, .form-select:focus { border-color: var(--primary); }

/* 구분선 */
.divider { height: 1px; background: var(--border); margin: 16px 0; }
</style>
<script>
(function(){
  var base = (window.location.pathname.split('/sample_pro')[0] || '') + '/sample_pro';
  // 현재 페이지 URL 추출 (예: 'trend', 'equip/monitor')
  var path = window.location.pathname;
  var idx  = path.indexOf('/main_1/');
  if(idx < 0) return;  // main_1 페이지가 아니면 스킵
  var pageUrl = path.substring(idx + 8);  // '/main_1/' 이후

  fetch(base + '/perm/my')
    .then(function(r){ return r.json(); })
    .then(function(perms){
      window.__PERMS = perms || {};
      var p = perms[pageUrl];
      if(!p) return;  // DB에 없으면 전체 허용

      // 화면 숨김 (canView=N)
      if(p.canView === 'N'){
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:12px;color:#718096">'
          + '<div style="font-size:48px">🔒</div>'
          + '<div style="font-size:18px;font-weight:700">접근 권한이 없습니다</div>'
          + '<div style="font-size:13px">관리자에게 권한을 요청하세요</div>'
          + '</div>';
        return;
      }
      // 버튼 숨김
      if(p.canAdd  === 'N') document.querySelectorAll('[data-perm="add"]').forEach(function(el){ el.style.display='none'; });
      if(p.canEdit === 'N') document.querySelectorAll('[data-perm="edit"]').forEach(function(el){ el.style.display='none'; });
      if(p.canDel  === 'N') document.querySelectorAll('[data-perm="del"]').forEach(function(el){ el.style.display='none'; });
    })
    .catch(function(){});
})();
</script>
