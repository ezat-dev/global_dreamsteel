<%@ page contentType="text/html; charset=UTF-8" %>
<%
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>SYSTEM MANUAL</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<%=ctx%>/css/monitoring/monitor_nav.css">
  <style>
    :root {
      --bg: #060810;
      --bg-panel: #0b0e1a;
      --bg-deep: #080b15;
      --bg-hover: #111830;
      --accent: #00f0ff;
      --accent2: #b06cff;
      --border: rgba(0,240,255,.18);
      --border2: rgba(176,108,255,.28);
      --text: #d8edf8;
      --muted: #4a6a88;
      --dim: #1a2e45;
      --ok: #00ff88;
      --warn: #ffb700;
      --err: #ff3b5c;
      --mono: 'Share Tech Mono', monospace;
      --hud: 'Orbitron', sans-serif;
      --sans: 'Noto Sans KR', sans-serif;
      --r: 6px;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }

    body {
      font-family: var(--sans);
      font-size: 12px;
      color: var(--text);
      background: var(--bg);
      display: flex;
      flex-direction: column;
      background-image:
        radial-gradient(ellipse at 15% 85%, rgba(176,108,255,.05) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 10%, rgba(0,240,255,.05) 0%, transparent 50%),
        linear-gradient(rgba(0,240,255,.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,240,255,.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
      overflow: hidden;
    }

    .page-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 22px;
      height: 58px;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(0,240,255,.06) 0%, transparent 100%);
      position: relative;
    }
    .page-header::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--accent2), var(--accent), transparent);
      opacity: .55;
    }
    .title-block { display: flex; flex-direction: column; gap: 2px; }
    .title {
      font-family: var(--hud);
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: var(--accent);
      text-shadow: 0 0 14px rgba(0,240,255,.45);
    }
    .title span { color: var(--accent2); text-shadow: 0 0 14px rgba(176,108,255,.4); }
    .sub {
      font-family: var(--mono);
      font-size: 10px;
      color: var(--muted);
      letter-spacing: 1px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 10px;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid var(--border2);
      color: var(--accent2);
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 2px;
      background: rgba(176,108,255,.08);
    }

    .main {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 12px;
      padding: 12px;
      overflow: hidden;
    }

    .toc {
      min-height: 0;
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--r);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .toc-head {
      padding: 10px 12px;
      background: var(--bg-deep);
      border-bottom: 1px solid var(--border);
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--accent2);
    }
    .toc-body {
      padding: 8px 10px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .toc-body a {
      text-decoration: none;
      color: var(--muted);
      font-family: var(--mono);
      font-size: 11px;
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid transparent;
      transition: all .15s;
    }
    .toc-body a:hover {
      color: var(--accent);
      border-color: var(--border);
      background: var(--bg-hover);
    }

    .content {
      min-height: 0;
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--r);
      overflow: auto;
      padding: 14px 18px 20px;
    }
    .content::-webkit-scrollbar { width: 6px; }
    .content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    .section {
      border: 1px solid var(--border);
      border-radius: var(--r);
      background: var(--bg-deep);
      margin-bottom: 14px;
      overflow: hidden;
    }
    .section-head {
      padding: 10px 14px;
      background: rgba(0,240,255,.05);
      border-bottom: 1px solid var(--border);
      font-family: var(--hud);
      font-size: 12px;
      letter-spacing: 2px;
      color: var(--accent);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-head .tag {
      font-family: var(--mono);
      font-size: 9px;
      color: var(--accent2);
      border: 1px solid var(--border2);
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(176,108,255,.08);
      letter-spacing: 1px;
    }
    .section-body {
      padding: 12px 14px 14px;
      line-height: 1.6;
    }
    .muted { color: var(--muted); }
    .mono { font-family: var(--mono); }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }
    .card {
      background: #0a0d1a;
      border: 1px solid var(--border);
      border-radius: 5px;
      padding: 10px 12px;
    }
    .card h4 {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 2px;
      color: var(--accent2);
      margin-bottom: 6px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid var(--border);
      font-family: var(--mono);
      font-size: 9px;
      color: var(--muted);
      background: #0b1020;
    }
    .pill.ok { color: var(--ok); border-color: rgba(0,255,136,.35); }
    .pill.warn { color: var(--warn); border-color: rgba(255,183,0,.35); }
    .pill.err { color: var(--err); border-color: rgba(255,59,92,.35); }

    pre {
      background: #05070f;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 10px 12px;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--accent);
      overflow: auto;
      margin-top: 8px;
    }
    code { font-family: var(--mono); }

    .note {
      border: 1px dashed var(--border2);
      background: rgba(176,108,255,.06);
      padding: 10px 12px;
      border-radius: 4px;
      margin-top: 8px;
      color: var(--muted);
    }
    .note strong { color: var(--accent2); }

    .flow {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin-top: 8px;
    }
    .flow .step {
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 8px 10px;
      text-align: center;
      background: #0a0d1a;
      font-family: var(--mono);
      font-size: 10px;
      color: var(--muted);
    }
    .flow .arrow { align-self: center; text-align: center; color: var(--accent); font-family: var(--mono); }

    @media (max-width: 980px) {
      .main { grid-template-columns: 1fr; }
      .toc { order: 2; }
    }
  </style>
</head>
<body>

  <div class="page-header">
    <div class="title-block">
      <div class="title">SYSTEM <span>MANUAL</span></div>
      <div class="sub">// DB setup - runtime versions - monitor pages - behavior rules</div>
    </div>
    <div class="badge">LIVE DOC</div>
  </div>

  <jsp:include page="/WEB-INF/views/include/monitorNav.jsp"/>

  <div class="main">
    <!-- TOC -->
    <aside class="toc">
      <div class="toc-head">CONTENTS</div>
      <nav class="toc-body">
        <a href="#overview">01. 시스템 개요</a>
        <a href="#versions">02. 버전/환경</a>
        <a href="#db">03. DB 세팅</a>
        <a href="#setup">04. 프로젝트 셋팅/실행</a>
        <a href="#pages">05. 페이지 안내</a>
        <a href="#alarm">06. 알람 동작</a>
        <a href="#temp">07. 온도 저장</a>
        <a href="#plc">08. PLC • C# • Tomcat 관계</a>
        <a href="#caution">09. 주의사항</a>
      </nav>
    </aside>

    <!-- CONTENT -->
    <main class="content">

      <section class="section" id="overview">
        <div class="section-head">01. SYSTEM OVERVIEW <span class="tag">ARCH</span></div>
        <div class="section-body">
          이 프로젝트는 <span class="mono">Tomcat(Spring MVC)</span> UI와 <span class="mono">C# API</span>가
          분리되어 동작하며, 공통 DB를 통해 알람/온도 데이터를 공유합니다.
          PLC 실제 통신은 C# API에서 담당하고, Tomcat은 화면/CRUD/조회 역할을 수행합니다.
          <div class="flow">
            <div class="step">PLC</div>
            <div class="arrow">-&gt;</div>
            <div class="step">C# API<br>(5050)</div>
            <div class="arrow">-&gt;</div>
            <div class="step">MariaDB<br>(ez_scada)</div>
          </div>
          <div class="note">
            <strong>핵심 요약:</strong> PLC ↔ C# API ↔ DB ↔ Tomcat UI (화면/관리)
          </div>
        </div>
      </section>

      <section class="section" id="versions">
        <div class="section-head">02. VERSION / RUNTIME <span class="tag">ENV</span></div>
        <div class="section-body">
          <div class="grid">
            <div class="card">
              <h4>SPRING / JAVA</h4>
              <div>Spring MVC: <span class="mono">5.3.34</span></div>
              <div>Java: <span class="mono">11</span></div>
            </div>
            <div class="card">
              <h4>WAS / BUILD</h4>
              <div>Tomcat: <span class="mono">9.0.115</span></div>
              <div>Maven: <span class="mono">3.9.x</span></div>
            </div>
            <div class="card">
              <h4>C# API</h4>
              <div>.NET: <span class="mono">net8.0</span></div>
              <div>Port: <span class="mono">5050</span></div>
            </div>
            <div class="card">
              <h4>DB</h4>
              <div>MariaDB / MySQL</div>
              <div>DB: <span class="mono">ez_scada</span></div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="db">
        <div class="section-head">03. DATABASE SETUP <span class="tag">DB</span></div>
        <div class="section-body">
          <div class="grid">
            <div class="card">
              <h4>TOMCAT (SPRING)</h4>
              <div>설정 파일: <code>src/main/resources/spring/config/root-context.xml</code></div>
              <pre><code>url=jdbc:mariadb://localhost:3306/ez_scada
username=root
password=ezat6695!</code></pre>
            </div>
            <div class="card">
              <h4>C# API</h4>
              <div>설정 파일: <code>C:\PlcApiServer\appsettings.json</code></div>
              <pre><code>"ConnectionStrings": {
  "MariaDb": "Server=localhost;Port=3306;Database=ez_scada;User=root;Password=ezat6695!;"
}</code></pre>
            </div>
          </div>
          <div class="note">
            <strong>참고:</strong> <code>src/main/resources/mybatis/config/db.properties</code> 는 현재 미사용(과거 설정)입니다.
          </div>
          <div style="margin-top:10px;">
            <div class="pill ok">필수 테이블</div>
            <div class="muted" style="margin-top:6px;">
              <span class="mono">tb_plc</span>, <span class="mono">tb_alarm_folder</span>,
              <span class="mono">tb_alarm_tag</span>, <span class="mono">tb_alarm_history</span>
            </div>
            <div class="pill warn" style="margin-top:8px;">자동 생성</div>
            <div class="muted" style="margin-top:6px;">
              <span class="mono">tb_temp_tag</span>, <span class="mono">tb_temp_history</span>,
              <span class="mono">tb_temp_snapshot</span> 는 Temp 기능 실행 시 생성됩니다.
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="setup">
        <div class="section-head">04. PROJECT SETUP / RUN <span class="tag">RUN</span></div>
        <div class="section-body">
          <div class="card" style="margin-bottom:10px;">
            <h4>실행 순서</h4>
            <div class="mono">1) MariaDB 시작 → 2) C# API 실행 → 3) Tomcat 실행</div>
          </div>
          <div class="grid">
            <div class="card">
              <h4>TOMCAT BUILD</h4>
              <pre><code>mvn -DskipTests clean package
copy target\sample_pro.war to Tomcat\webapps</code></pre>
              <div class="muted">또는 <code>redeploy.cmd</code> 사용</div>
            </div>
            <div class="card">
              <h4>C# API RUN</h4>
              <pre><code>cd C:\PlcApiServer
dotnet run</code></pre>
              <div class="muted">Listening: <code>http://localhost:5050</code></div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="pages">
        <div class="section-head">05. MONITOR NAV PAGES <span class="tag">UI</span></div>
        <div class="section-body">
          <div class="grid">
            <div class="card">
              <h4>PLC</h4>
              <div>PLC Read/Write 테스트. C# API 필요.</div>
            </div>
            <div class="card">
              <h4>ALARM MANAGE</h4>
              <div>알람 폴더/태그 CRUD, PLC 등록, Excel 업/다운.</div>
            </div>
            <div class="card">
              <h4>ALARM MONITOR</h4>
              <div>실시간 알람/이력 조회 (DB 기반).</div>
            </div>
            <div class="card">
              <h4>TEMP MANAGE</h4>
              <div>온도 태그 등록/수정/삭제. 컬럼 자동 생성.</div>
            </div>
            <div class="card">
              <h4>TEMP MONITOR</h4>
              <div>온도 스냅샷 그래프/모니터링.</div>
            </div>
            <div class="card">
              <h4>ALARM TEMP</h4>
              <div>알람+온도 통합 대시보드.</div>
            </div>
          </div>
          <div class="note">
            <strong>nav 위치:</strong> <code>webapp/WEB-INF/views/include/monitorNav.jsp</code>
          </div>
        </div>
      </section>

      <section class="section" id="alarm">
        <div class="section-head">06. ALARM BEHAVIOR <span class="tag">LOGIC</span></div>
        <div class="section-body">
          <div>알람은 C# API의 백그라운드 서비스가 PLC 값을 읽어 <span class="mono">tb_alarm_history</span>에 기록합니다.</div>
          <div class="grid" style="margin-top:8px;">
            <div class="card">
              <h4>발생</h4>
              <div>값이 ON(기본: 0이 아닌 값) → 신규 행 INSERT (occur_time)</div>
            </div>
            <div class="card">
              <h4>해제</h4>
              <div>값이 OFF(0) → 열린 알람의 clear_time 업데이트</div>
            </div>
            <div class="card">
              <h4>중복 방지</h4>
              <div>ON 상태 지속 중에는 신규 행을 추가하지 않음</div>
            </div>
          </div>
          <div class="note">
            <strong>설정:</strong> <code>C:\PlcApiServer\appsettings.json</code> 의
            <span class="mono">PlcMonitor</span>에서 IntervalMs(기본 1000ms), ChunkSize(기본 100), TreatNonZeroAsOn(true) 조정
          </div>
        </div>
      </section>

      <section class="section" id="temp">
        <div class="section-head">07. TEMP SAVE RULE <span class="tag">DATA</span></div>
        <div class="section-body">
          <div>온도 태그는 <span class="mono">tb_temp_tag</span>에 저장되고, C# API가 주기적으로 스냅샷을 저장합니다.</div>
          <div class="grid" style="margin-top:8px;">
            <div class="card">
              <h4>컬럼 생성 규칙</h4>
              <div>태그명 → 소문자 + 특수문자 “_” → <span class="mono">tag_</span> 접두어</div>
              <div class="muted">예: “탬퍼링1호기” → <span class="mono">tag_t_1</span></div>
            </div>
            <div class="card">
              <h4>저장 방식</h4>
              <div>주기마다 <span class="mono">tb_temp_snapshot</span>에 한 행 INSERT</div>
              <div class="muted">기본 주기 60초 (TempMonitor.IntervalMs)</div>
            </div>
            <div class="card">
              <h4>이름 변경 / 삭제</h4>
              <div>이름 변경 시 컬럼명도 변경됨</div>
              <div class="muted">삭제 시 컬럼은 유지됨(데이터 보존)</div>
            </div>
          </div>
          <div class="note">
            <strong>참고:</strong> <span class="mono">tb_temp_history</span>는 확장용 테이블로 현재 자동 저장 대상은 아닙니다.
          </div>
        </div>
      </section>

      <section class="section" id="plc">
        <div class="section-head">08. PLC • C# • TOMCAT <span class="tag">FLOW</span></div>
        <div class="section-body">
          <div class="grid">
            <div class="card">
              <h4>PLC 등록</h4>
              <div>ALARM MANAGE → PLC 설정</div>
              <div class="muted">저장 테이블: <span class="mono">tb_plc</span></div>
            </div>
            <div class="card">
              <h4>PLC 읽기/쓰기</h4>
              <div>Tomcat → C# API (5050) → PLC</div>
              <div class="muted">PLC ID가 존재해야 조회 가능</div>
            </div>
            <div class="card">
              <h4>모니터링</h4>
              <div>C# 백그라운드가 주기적으로 PLC 읽고 DB 저장</div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="caution">
        <div class="section-head">09. CAUTION <span class="tag">TIP</span></div>
        <div class="section-body">
          <div class="pill warn">필수 체크</div>
          <div class="muted" style="margin-top:6px;">
            C# API가 꺼져 있으면 PLC 읽기/쓰기 및 알람/온도 저장이 동작하지 않습니다.
          </div>
          <div class="pill err" style="margin-top:10px;">자주 발생</div>
          <div class="muted" style="margin-top:6px;">
            PLC ID가 <span class="mono">tb_plc</span>에 없으면 <span class="mono">PLC 'default' not found</span> 오류가 발생합니다.
          </div>
        </div>
      </section>

    </main>
  </div>
</body>
</html>
