<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MES 로그인</title>

<style>
:root{
  --bg:#eef3f8;
  --bg2:#f8fafc;
  --card:#ffffff;
  --line:#d9e2ec;
  --line2:#e8eef5;
  --text:#1f2937;
  --muted:#6b7280;
  --muted2:#94a3b8;

  --primary:#1f4e79;
  --primary2:#2f6ea5;
  --primary3:#eaf2fb;
  --accent:#2d7ff9;

  --success:#0f9d58;
  --danger:#d93025;

  --shadow-lg:0 24px 60px rgba(15, 23, 42, .12);
  --shadow-md:0 10px 30px rgba(15, 23, 42, .08);
  --shadow-sm:0 4px 14px rgba(15, 23, 42, .06);

  --radius-xl:24px;
  --radius-lg:18px;
  --radius-md:12px;
  --radius-sm:10px;
}

*{box-sizing:border-box;margin:0;padding:0;}
html,body{
  width:100%;
  height:100%;
  font-family:'Segoe UI','Malgun Gothic','Apple SD Gothic Neo',sans-serif;
  color:var(--text);
  background:
    radial-gradient(circle at top left, rgba(47,110,165,.10), transparent 28%),
    radial-gradient(circle at right bottom, rgba(45,127,249,.08), transparent 24%),
    linear-gradient(135deg, var(--bg), var(--bg2));
  overflow:hidden;
}

/* 배경 장식 */
body::before,
body::after{
  content:'';
  position:fixed;
  border-radius:50%;
  filter:blur(80px);
  pointer-events:none;
  z-index:0;
}
body::before{
  width:320px;height:320px;
  top:-100px;left:-100px;
  background:rgba(47,110,165,.10);
}
body::after{
  width:360px;height:360px;
  right:-120px;bottom:-120px;
  background:rgba(45,127,249,.08);
}

.bg-grid{
  position:fixed;
  inset:0;
  background-image:
    linear-gradient(rgba(31,78,121,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31,78,121,.03) 1px, transparent 1px);
  background-size:28px 28px;
  pointer-events:none;
  z-index:0;
}

/* 상단 바 */
.topbar{
  position:fixed;
  top:0;left:0;right:0;
  height:64px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 32px;
  background:rgba(255,255,255,.76);
  backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(217,226,236,.9);
  z-index:20;
}
.topbar-left{
  display:flex;
  align-items:center;
  gap:14px;
}
.topbar-badge{
  width:10px;height:10px;border-radius:50%;
  background:var(--success);
  box-shadow:0 0 0 4px rgba(15,157,88,.12);
}
.topbar-title{
  display:flex;
  flex-direction:column;
  line-height:1.15;
}
.topbar-title strong{
  font-size:14px;
  color:var(--primary);
  letter-spacing:.3px;
}
.topbar-title span{
  font-size:11px;
  color:var(--muted);
  letter-spacing:.8px;
}
.topbar-right{
  display:flex;
  align-items:center;
  gap:12px;
}
.topbar-chip{
  height:36px;
  display:flex;
  align-items:center;
  padding:0 14px;
  border:1px solid var(--line2);
  border-radius:999px;
  background:#fff;
  color:var(--muted);
  font-size:12px;
  box-shadow:var(--shadow-sm);
}

/* 메인 */
.login-shell{
  position:relative;
  z-index:1;
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:96px 24px 32px;
}

.login-frame{
  width:100%;
  max-width:1200px;
  min-height:680px;
  display:grid;
  grid-template-columns: 1.08fr .92fr;
  background:rgba(255,255,255,.88);
  border:1px solid rgba(255,255,255,.75);
  border-radius:32px;
  box-shadow:var(--shadow-lg);
  overflow:hidden;
  backdrop-filter:blur(18px);
}

/* 좌측 브랜드 영역 */
.brand-panel{
  position:relative;
  overflow:hidden;
  padding:56px 52px;
  background:
    linear-gradient(160deg, rgba(31,78,121,.96), rgba(47,110,165,.95));
  color:#fff;
}
.brand-panel::before{
  content:'';
  position:absolute;
  inset:auto -120px -120px auto;
  width:320px;height:320px;
  border-radius:50%;
  background:rgba(255,255,255,.08);
}
.brand-panel::after{
  content:'';
  position:absolute;
  top:-80px;left:-80px;
  width:220px;height:220px;
  border-radius:50%;
  background:rgba(255,255,255,.05);
}
.brand-inner{
  position:relative;
  z-index:2;
  height:100%;
  display:flex;
  flex-direction:column;
}
.brand-logo{
  display:flex;
  align-items:center;
  gap:14px;
  margin-bottom:34px;
}
.brand-logo-box{
  width:60px;height:60px;
  border-radius:18px;
  background:rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.18);
  display:flex;
  align-items:center;
  justify-content:center;
  backdrop-filter:blur(8px);
}
.brand-logo-box img{
  max-width:38px;
  max-height:38px;
  object-fit:contain;
}
.brand-logo-text{
  display:flex;
  flex-direction:column;
  gap:3px;
}
.brand-logo-text strong{
  font-size:22px;
  font-weight:800;
  letter-spacing:.5px;
}
.brand-logo-text span{
  font-size:12px;
  color:rgba(255,255,255,.72);
  letter-spacing:1.5px;
  text-transform:uppercase;
}

.brand-kicker{
  display:inline-flex;
  align-items:center;
  gap:8px;
  width:max-content;
  padding:8px 14px;
  border-radius:999px;
  background:rgba(255,255,255,.10);
  border:1px solid rgba(255,255,255,.14);
  font-size:12px;
  color:rgba(255,255,255,.88);
  margin-bottom:22px;
}
.brand-kicker-dot{
  width:8px;height:8px;border-radius:50%;
  background:#9ee6b8;
}

.brand-title{
  font-size:42px;
  line-height:1.18;
  font-weight:800;
  letter-spacing:-.8px;
  margin-bottom:18px;
}
.brand-title .accent{
  color:#dbeafe;
}
.brand-desc{
  max-width:520px;
  font-size:15px;
  line-height:1.8;
  color:rgba(255,255,255,.82);
  margin-bottom:34px;
}

/* ── 설비 신호 애니메이션 ── */
.signal-wrap{
  position:relative;
  width:100%;
  height:340px;
  flex-shrink:0;
  display:flex;
  align-items:center;
  justify-content:center;
  margin:8px 0 4px;
}
.signal-svg{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
}
/* 중앙 허브 */
.mes-hub{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:2;
}
.hub-core{
  width:64px;height:64px;
  background:linear-gradient(135deg,var(--primary2),var(--accent));
  border-radius:16px;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:2px;
  box-shadow:0 0 24px rgba(45,127,249,.35);
  z-index:3;position:relative;
}
.hub-core span{font-size:10px;font-weight:700;color:#fff;letter-spacing:1px;}
.hub-ring{
  position:absolute;border-radius:50%;
  border:1px solid rgba(45,127,249,.25);
  animation:hubPulse 2.4s ease-out infinite;
}
.r1{width:100px;height:100px;animation-delay:0s;}
.r2{width:140px;height:140px;animation-delay:0.8s;}
.r3{width:180px;height:180px;animation-delay:1.6s;}
@keyframes hubPulse{
  0%{opacity:.7;transform:scale(.9);}
  100%{opacity:0;transform:scale(1.1);}
}
/* 설비 노드 */
.eq-node{
  position:absolute;
  display:flex;flex-direction:column;
  align-items:center;gap:3px;
  transform:translate(-50%,-50%);
  z-index:2;
}
.eq-dot{
  width:10px;height:10px;border-radius:50%;
  background:#9ee6b8;
  box-shadow:0 0 8px rgba(158,230,184,.6);
  animation:dotBlink 1.8s ease-in-out infinite;
}
.node-3 .eq-dot{background:#ff8fa0;box-shadow:0 0 8px rgba(255,143,160,.6);}
@keyframes dotBlink{0%,100%{opacity:1}50%{opacity:.3}}
.eq-label{font-size:10px;color:rgba(255,255,255,.6);letter-spacing:.5px;}
.eq-val{font-size:12px;font-weight:700;color:#fff;font-family:monospace;}

.brand-bottom{
  margin-top:auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding-top:30px;
}
.brand-bottom-left{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}
.soft-pill{
  padding:8px 12px;
  border-radius:999px;
  font-size:11px;
  background:rgba(255,255,255,.10);
  border:1px solid rgba(255,255,255,.14);
  color:rgba(255,255,255,.82);
}
.brand-build{
  font-size:12px;
  color:rgba(255,255,255,.70);
  letter-spacing:1px;
}

/* 우측 로그인 영역 */
.form-panel{
  position:relative;
  padding:56px 52px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.92), rgba(248,250,252,.96));
}
.form-panel::before{
  content:'';
  position:absolute;
  top:32px;right:32px;
  width:96px;height:96px;
  border-radius:24px;
  background:linear-gradient(135deg, rgba(47,110,165,.05), rgba(45,127,249,.08));
  transform:rotate(12deg);
}
.form-inner{
  position:relative;
  z-index:2;
  max-width:420px;
  margin:0 auto;
  height:100%;
  display:flex;
  flex-direction:column;
  justify-content:center;
}
.form-top{
  margin-bottom:28px;
}
.form-top .eyebrow{
  display:inline-block;
  padding:7px 12px;
  border-radius:999px;
  background:var(--primary3);
  color:var(--primary2);
  font-size:12px;
  font-weight:700;
  letter-spacing:.4px;
  margin-bottom:16px;
}
.form-top h2{
  font-size:34px;
  font-weight:800;
  letter-spacing:-.7px;
  color:var(--text);
  margin-bottom:10px;
}
.form-top p{
  font-size:14px;
  line-height:1.7;
  color:var(--muted);
}

.err-box{
  display:none;
  margin-bottom:18px;
  padding:14px 16px;
  border-radius:14px;
  border:1px solid rgba(217,48,37,.16);
  background:rgba(217,48,37,.06);
  color:var(--danger);
  font-size:13px;
  line-height:1.5;
  box-shadow:0 6px 16px rgba(217,48,37,.08);
}

.form-group{
  margin-bottom:18px;
}
.form-label{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:9px;
}
.form-label .left{
  display:flex;
  align-items:center;
  gap:8px;
  color:#334155;
  font-size:13px;
  font-weight:700;
}
.form-label .required{
  color:#ef4444;
  font-size:12px;
}
.input-wrap{
  position:relative;
}
.input-icon{
  position:absolute;
  top:50%;
  left:15px;
  transform:translateY(-50%);
  width:18px;height:18px;
  color:#8aa4bf;
  pointer-events:none;
}
.form-control{
  width:100%;
  height:54px;
  padding:0 16px 0 46px;
  border:1px solid var(--line);
  border-radius:14px;
  background:#fff;
  color:var(--text);
  font-size:14px;
  outline:none;
  transition:.18s ease;
  box-shadow:0 1px 2px rgba(15,23,42,.02);
}
.form-control::placeholder{
  color:#9aa9b9;
}
.form-control:hover{
  border-color:#c7d3df;
}
.form-control:focus{
  border-color:var(--accent);
  box-shadow:0 0 0 4px rgba(45,127,249,.10);
}
.form-control.err{
  border-color:rgba(217,48,37,.45);
  background:rgba(217,48,37,.02);
}

.option-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin:4px 0 22px;
}
.chk-wrap{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:13px;
  color:var(--muted);
  user-select:none;
}
.chk-wrap input{
  width:16px;
  height:16px;
  accent-color:var(--primary2);
}
.option-link{
  font-size:13px;
  color:var(--primary2);
  text-decoration:none;
  font-weight:600;
}
.option-link:hover{
  text-decoration:underline;
}

.btn-login{
  width:100%;
  height:56px;
  border:none;
  border-radius:16px;
  background:linear-gradient(135deg, var(--primary), var(--primary2));
  color:#fff;
  font-size:15px;
  font-weight:800;
  letter-spacing:.8px;
  cursor:pointer;
  transition:.18s ease;
  box-shadow:0 14px 26px rgba(31,78,121,.24);
}
.btn-login:hover{
  transform:translateY(-1px);
  box-shadow:0 16px 32px rgba(31,78,121,.28);
}
.btn-login:active{
  transform:translateY(0);
}
.btn-login:disabled{
  opacity:.72;
  cursor:not-allowed;
  transform:none;
  box-shadow:0 10px 18px rgba(31,78,121,.16);
}

.form-footer{
  margin-top:22px;
  padding-top:18px;
  border-top:1px solid var(--line2);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  color:var(--muted2);
  font-size:12px;
}
.form-footer .strong{
  color:var(--primary2);
  font-weight:700;
}

.security-box{
  margin-top:22px;
  padding:16px 18px;
  border-radius:16px;
  background:linear-gradient(180deg, #ffffff, #f8fbff);
  border:1px solid var(--line2);
  box-shadow:var(--shadow-sm);
}
.security-title{
  display:flex;
  align-items:center;
  gap:8px;
  margin-bottom:8px;
  font-size:13px;
  font-weight:700;
  color:#334155;
}
.security-text{
  font-size:12px;
  color:var(--muted);
  line-height:1.7;
}

/* 반응형 */
@media (max-width: 1024px){
  .login-frame{
    grid-template-columns:1fr;
    max-width:560px;
    min-height:auto;
  }
  .brand-panel{
    padding:34px 30px 28px;
  }
  .brand-title{
    font-size:30px;
  }
  .signal-wrap{ height:230px; }
  .hub-core{ width:52px;height:52px; }
  .brand-bottom{
    margin-top:26px;
    flex-direction:column;
    align-items:flex-start;
  }
  .form-panel{
    padding:38px 30px 34px;
  }
}

@media (max-width: 640px){
  .topbar{
    padding:0 16px;
    height:58px;
  }
  .topbar-chip:nth-child(2){
    display:none;
  }
  .login-shell{
    padding:74px 14px 18px;
  }
  .login-frame{
    border-radius:22px;
  }
  .brand-panel,
  .form-panel{
    padding-left:20px;
    padding-right:20px;
  }
  .brand-title{
    font-size:26px;
  }
  .form-top h2{
    font-size:28px;
  }
}
</style>
</head>
<body>
<div class="bg-grid"></div>

<!-- 상단 바 -->
<div class="topbar">
  <div class="topbar-left">
    <div class="topbar-badge"></div>
    <div class="topbar-title">
      <strong>Manufacturing Execution System</strong>
      <span>Integrated Production Portal</span>
    </div>
  </div>

  <div class="topbar-right">
    <div class="topbar-chip">SYSTEM ONLINE</div>
    <div class="topbar-chip" id="sysClock">--:--:--</div>
  </div>
</div>

<div class="login-shell">
  <div class="login-frame">

    <!-- 좌측 브랜드 패널 -->
    <section class="brand-panel">
      <div class="brand-inner">

        <div class="brand-logo">
          <div class="brand-logo-box">
            <img src="${pageContext.request.contextPath}/img/동우 로고 디자인.png" alt="동우 로고">
          </div>
          <div class="brand-logo-text">
            <strong>DONGWOO MES</strong>
            <span>Smart Factory Platform</span>
          </div>
        </div>

        <div class="brand-kicker">
          <span class="brand-kicker-dot"></span>
          실시간 설비 신호 수신 중
        </div>

        <!-- 설비 신호 애니메이션 -->
        <div class="signal-wrap" id="signalWrap">

          <!-- SVG 연결선 + 신호 펄스 (중심 170,170 r=120) -->
          <svg class="signal-svg" viewBox="0 0 560 340" xmlns="http://www.w3.org/2000/svg" id="signalSvg">
            <g id="svgLines"></g>
            <g id="svgPulses"></g>
          </svg>

          <!-- 중앙 MES 허브 -->
          <div class="mes-hub">
            <div class="hub-ring r1"></div>
            <div class="hub-ring r2"></div>
            <div class="hub-ring r3"></div>
            <div class="hub-core">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
              <span>MES</span>
            </div>
          </div>

          <!-- BCF 노드 12개 (JS로 생성) -->
          <div id="nodeWrap"></div>
        </div>

        <!-- 하단 상태 바 -->
        <div class="brand-bottom">
          <div class="brand-bottom-left">
            <span class="soft-pill">● ONLINE</span>
            <span class="soft-pill" id="sigCount">신호 수신 0</span>
            <span class="soft-pill" id="sigTime">--:--:--</span>
          </div>
          <div class="brand-build">BUILD 2026.04</div>
        </div>

      </div>
    </section>

    <!-- 우측 로그인 패널 -->
    <section class="form-panel">
      <div class="form-inner">

        <div class="form-top">
          <div class="eyebrow">사용자 로그인</div>
          <h2>로그인</h2>
          <p>
            등록된 계정으로 로그인 후 MES 포털에 접속하세요.<br>
            권한에 따라 메뉴 및 기능이 자동으로 적용됩니다.
          </p>
        </div>

        <div class="err-box" id="errBox"></div>

        <form onsubmit="doLogin(event)" autocomplete="on">
          <div class="form-group">
            <label class="form-label" for="userId">
              <span class="left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                아이디
              </span>
              <span class="required">필수</span>
            </label>

            <div class="input-wrap">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                class="form-control"
                type="text"
                id="userId"
                name="userId"
                placeholder="아이디를 입력하세요"
                autocomplete="username"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="userPw">
              <span class="left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                  <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                  <path d="M7 11V8a5 5 0 0 1 10 0v3"></path>
                </svg>
                비밀번호
              </span>
              <span class="required">필수</span>
            </label>

            <div class="input-wrap">
              <span class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                  <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                  <path d="M7 11V8a5 5 0 0 1 10 0v3"></path>
                </svg>
              </span>
              <input
                class="form-control"
                type="password"
                id="userPw"
                name="userPw"
                placeholder="비밀번호를 입력하세요"
                autocomplete="current-password"
              >
            </div>
          </div>

          <div class="option-row">
            <label class="chk-wrap">
              <input type="checkbox" id="rememberId">
              <span>아이디 기억하기</span>
            </label>

            <a href="javascript:void(0)" class="option-link" onclick="focusId()">입력 다시 확인</a>
          </div>

          <button class="btn-login" type="submit" id="btnLogin">MES 로그인</button>
        </form>

        <div class="security-box">
          <div class="security-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            보안 안내
          </div>
          <div class="security-text">
            사용자 인증 후 권한에 따라 접근 가능한 메뉴가 자동 적용됩니다.
            비정상 접근 또는 로그인 실패가 반복될 경우 관리자에게 문의하세요.
          </div>
        </div>

        <div class="form-footer">
          <span>© 2026 <span class="strong">DONGWOO</span> All rights reserved.</span>
          <span>Confidential</span>
        </div>

      </div>
    </section>

  </div>
</div>

<script>
/* 상단 시계 */
(function tick(){
  var now = new Date();
  var pad = function(n){ return String(n).padStart(2,'0'); };
  var txt =
      now.getFullYear() + '-' +
      pad(now.getMonth()+1) + '-' +
      pad(now.getDate()) + '  ' +
      pad(now.getHours()) + ':' +
      pad(now.getMinutes()) + ':' +
      pad(now.getSeconds());
  document.getElementById('sysClock').textContent = txt;
  var t = pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds());
  var el = document.getElementById('sigTime'); if(el) el.textContent = t;
  setTimeout(tick, 1000);
})();

/* BCF 12개 노드 신호 애니메이션 */
(function(){
  var N = 12;
  var CX = 280, CY = 170;   // viewBox 560×340 중심
  var RX = 228, RY = 138;   // 타원 반경 (직사각형 채우기)
  var VW = 560, VH = 340;   // viewBox 크기
  var COLOR_OK  = '#9ee6b8';
  var COLOR_ERR = '#ff8fa0';
  var sigCnt = 0;

  // 상태 배열 (초기: 전부 정상)
  var status = [];
  for(var i = 0; i < N; i++) status.push('정상');

  // 노드 좌표 계산 - 타원 (시계 12시 방향부터 시계방향)
  var pts = [];
  for(var i = 0; i < N; i++){
    var a = (i * 30 - 90) * Math.PI / 180;
    pts.push({ x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a) });
  }

  // SVG 선 그리기
  var linesG = document.getElementById('svgLines');
  pts.forEach(function(p){
    var line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', CX); line.setAttribute('y1', CY);
    line.setAttribute('x2', p.x); line.setAttribute('y2', p.y);
    line.setAttribute('stroke','rgba(255,255,255,.15)');
    line.setAttribute('stroke-width','1');
    line.setAttribute('stroke-dasharray','4 3');
    linesG.appendChild(line);
  });

  // SVG 펄스 생성
  var pulsesG = document.getElementById('svgPulses');
  function makePulse(p, color, delay){
    var path = 'M'+p.x.toFixed(1)+','+p.y.toFixed(1)+' L'+CX+','+CY;
    var c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('r','4');
    c.setAttribute('fill', color);
    c.setAttribute('opacity','.9');
    var am = document.createElementNS('http://www.w3.org/2000/svg','animateMotion');
    am.setAttribute('dur', (1.6 + Math.random()).toFixed(1)+'s');
    am.setAttribute('repeatCount','indefinite');
    am.setAttribute('begin', delay+'s');
    am.setAttribute('path', path);
    c.appendChild(am);
    return c;
  }

  var pulseEls = [];
  pts.forEach(function(p, i){
    var el = makePulse(p, COLOR_OK, (i * 0.25).toFixed(2));
    pulsesG.appendChild(el);
    pulseEls.push(el);
  });

  // HTML 노드 div 생성
  var wrap = document.getElementById('nodeWrap');
  var nodeEls = [];
  pts.forEach(function(p, i){
    // signal-wrap 기준 퍼센트 위치 (viewBox 560×340 기준)
    var div = document.createElement('div');
    div.className = 'eq-node';
    div.style.left = (p.x / VW * 100) + '%';
    div.style.top  = (p.y / VH * 100) + '%';

    var dot = document.createElement('div');
    dot.className = 'eq-dot';

    var label = document.createElement('div');
    label.className = 'eq-label';
    label.textContent = 'BCF-' + String(i+1).padStart(2,'0');

    var val = document.createElement('div');
    val.className = 'eq-val';
    val.textContent = '정상';

    div.appendChild(dot);
    div.appendChild(label);
    div.appendChild(val);
    wrap.appendChild(div);
    nodeEls.push({dot:dot, val:val});
  });

  // 단일 노드 상태 적용
  function applyStatus(i, isOk){
    status[i] = isOk ? '정상' : '비정상';
    var el = nodeEls[i];
    el.dot.style.background = isOk ? COLOR_OK : COLOR_ERR;
    el.dot.style.boxShadow  = isOk ? '0 0 8px rgba(158,230,184,.7)' : '0 0 8px rgba(255,143,160,.7)';
    el.val.textContent      = status[i];
    el.val.style.color      = isOk ? COLOR_OK : COLOR_ERR;
    pulseEls[i].setAttribute('fill', isOk ? COLOR_OK : COLOR_ERR);
  }

  function refreshCount(){
    var ok = 0, err = 0;
    status.forEach(function(s){ if(s === '정상') ok++; else err++; });
    var sc = document.getElementById('sigCount');
    if(sc) sc.textContent = '정상 ' + ok + ' / 비정상 ' + err;
  }

  // 실제 PLC 통신 폴링 (5분 주기, 순차 실행)
  var base = '${pageContext.request.contextPath}';

  function pollOne(i){
    var id = String(i+1).padStart(2,'0');
    return fetch(base + '/plc/read/dongwoo_' + id + '?start=0&count=1')
      .then(function(r){ return r.json(); })
      .then(function(d){ applyStatus(i, !!(d && d.success && d.values)); })
      .catch(function(){ applyStatus(i, false); });
  }

  function pollAll(){
    var chain = Promise.resolve();
    for(var i = 0; i < N; i++){
      (function(idx){
        chain = chain.then(function(){ return pollOne(idx).then(refreshCount); });
      })(i);
    }
    return chain;
  }

  function schedulePoll(){
    pollAll().then(function(){
      setTimeout(schedulePoll, 300000); // 5분 후 재폴링
    });
  }

  schedulePoll();
})();

/* 에러 표시 */
function showErr(msg){
  var box = document.getElementById('errBox');
  box.textContent = '⚠ ' + msg;
  box.style.display = 'block';

  document.getElementById('userId').classList.add('err');
  document.getElementById('userPw').classList.add('err');
}

function clearErr(){
  document.getElementById('errBox').style.display = 'none';
  document.getElementById('userId').classList.remove('err');
  document.getElementById('userPw').classList.remove('err');
}

/* 아이디 포커스 */
function focusId(){
  document.getElementById('userId').focus();
}

/* 아이디 저장 */
(function initRememberId(){
  var savedId = localStorage.getItem('mes_saved_user_id');
  var remember = localStorage.getItem('mes_remember_id');

  if(remember === 'Y' && savedId){
    document.getElementById('userId').value = savedId;
    document.getElementById('rememberId').checked = true;
  }
})();

/* 로그인 */
function doLogin(e){
  e.preventDefault();
  clearErr();

  var id = document.getElementById('userId').value.trim();
  var pw = document.getElementById('userPw').value;
  var rememberId = document.getElementById('rememberId').checked;
  var btn = document.getElementById('btnLogin');

  if(!id){
    showErr('아이디를 입력하세요.');
    document.getElementById('userId').focus();
    return;
  }

  if(!pw){
    showErr('비밀번호를 입력하세요.');
    document.getElementById('userPw').focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = '로그인 처리 중...';

  var loginUrl = '${pageContext.request.contextPath}/user/login';
  console.log('[LOGIN] POST →', loginUrl);

  fetch(loginUrl, {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
    body:'user_id=' + encodeURIComponent(id) + '&user_pw=' + encodeURIComponent(pw)
  })
  .then(function(res){
    console.log('[LOGIN] HTTP status:', res.status, res.statusText);
    return res.text();
  })
  .then(function(raw){
    console.log('[LOGIN] raw response:', raw);
    var data;
    try { data = JSON.parse(raw); } catch(e){ throw new Error('JSON 파싱 실패 (서버 응답: ' + raw.substring(0,200) + ')'); }
    if(data && data.success){
      if(rememberId){
        localStorage.setItem('mes_saved_user_id', id);
        localStorage.setItem('mes_remember_id', 'Y');
      }else{
        localStorage.removeItem('mes_saved_user_id');
        localStorage.removeItem('mes_remember_id');
      }
      btn.textContent = '접속 중...';
      btn.style.background = 'linear-gradient(135deg, #0f9d58, #0b7a45)';
      setTimeout(function(){
        location.href = '${pageContext.request.contextPath}/main_1/main';
      }, 350);
    }else{
      showErr((data && data.message) ? data.message : '아이디 또는 비밀번호가 올바르지 않습니다.');
      btn.disabled = false;
      btn.textContent = 'MES 로그인';
    }
  })
  .catch(function(err){
    console.error('[LOGIN] error:', err);
    showErr('서버 오류: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'MES 로그인';
  });
}

/* 엔터 처리 */
document.addEventListener('keydown', function(e){
  if(e.key === 'Enter'){
    document.getElementById('btnLogin').click();
  }
});
</script>
</body>
</html>