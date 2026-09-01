<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>TAG CONTROL</title>
    <%-- <%@include file="../include/pluginpage.jsp" %> --%>
    <%-- <jsp:include page="../include/tabBar.jsp"/> --%>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body {
            background: #07090F; color: #A8D8F0;
            font-family: 'Consolas', monospace;
            padding: 20px; display: flex; flex-direction: column;
        }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #1A3A5C; border-radius: 2px; }

        .page-title { font-size: 20px; font-weight: bold; color: #00F0FF; text-shadow: 0 0 12px #00F0FF66; margin-bottom: 4px; flex-shrink: 0; }
        .page-sub   { font-size: 10px; color: #B24BF3; opacity: .6; margin-bottom: 14px; flex-shrink: 0; }
        .divider    { height: 1px; background: linear-gradient(90deg, #00F0FF33, transparent); margin-bottom: 14px; flex-shrink: 0; }

        .main-grid {
            display: grid; grid-template-columns: 1fr 220px;
            gap: 14px; flex: 1; min-height: 0;
        }
        .left-col { display: flex; flex-direction: column; gap: 14px; min-height: 0; }

        .panel { background: #0D1128; border: 1px solid #1A3A5C; border-radius: 4px; display: flex; flex-direction: column; min-height: 0; }
        .panel-head { display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-bottom: 1px solid #0D1A2E; font-size: 10px; font-weight: bold; letter-spacing: 1px; flex-shrink: 0; }
        .panel-head .acc { width: 3px; height: 14px; border-radius: 2px; flex-shrink: 0; }

        /* ══ 도형 패널 ══ */
        .shape-panel { flex-shrink: 0; }
        .shape-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; padding: 14px; }

        .shape-card {
            background: #060A18; border: 1px solid #1A3A5C; border-radius: 6px;
            padding: 12px 10px 10px; display: flex; flex-direction: column;
            align-items: center; gap: 8px; position: relative;
            transition: border-color .3s, box-shadow .3s;
            overflow: hidden;
        }
        .shape-card::after {
            content: ''; position: absolute; inset: 0;
            background: radial-gradient(circle at 50% 50%, transparent 60%, #00F0FF08);
            opacity: 0; transition: opacity .4s;
        }
        .shape-card.active { border-color: #00F0FF55; box-shadow: 0 0 12px #00F0FF11 inset; }
        .shape-card.active::after { opacity: 1; }

        .shape-wrap { width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; position: relative; }

        /* ── SVG 도형 애니메이션 — 각각 독립 keyframe ── */
        .shape-svg { width: 64px; height: 64px; }

        /* 1) 깜빡임 — circle */
        @keyframes anim-blink { 0%,45%,55%,100%{opacity:1;} 50%{opacity:.05;} }
        .do-blink  { animation: anim-blink .9s ease-in-out infinite; }

        /* 2) 펄스 확대 — rect */
        @keyframes anim-pulse { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 2px #00FF88);} 50%{transform:scale(1.14);filter:drop-shadow(0 0 10px #00FF88);} }
        .do-pulse  { animation: anim-pulse 1s ease-in-out infinite; transform-origin: center; }

        /* 3) Y축 회전 — diamond */
        @keyframes anim-rotateY { to { transform: rotateY(360deg); } }
        .do-rotateY { animation: anim-rotateY 1.2s linear infinite; transform-style: preserve-3d; }

        /* 4) 진동 — triangle */
        @keyframes anim-shake { 0%,100%{transform:translateX(0) rotate(0deg);} 20%{transform:translateX(-4px) rotate(-3deg);} 40%{transform:translateX(4px) rotate(3deg);} 60%{transform:translateX(-3px) rotate(-2deg);} 80%{transform:translateX(3px) rotate(2deg);} }
        .do-shake  { animation: anim-shake .35s ease-in-out infinite; transform-origin: center; }

        /* 5) 글로우 + Z 회전 — hexagon */
        @keyframes anim-glow { 0%,100%{filter:drop-shadow(0 0 3px #B24BF3) brightness(1);transform:rotate(0deg);} 50%{filter:drop-shadow(0 0 16px #B24BF3) brightness(1.4);transform:rotate(30deg);} }
        .do-glow   { animation: anim-glow 1.4s ease-in-out infinite; transform-origin: center; }

        /* OFF 상태: 모든 애니메이션 제거 */
        .shape-svg-off { animation: none !important; filter: none !important; transform: none !important; opacity: .4; }

        /* 태그 라벨 */
        .shape-tag { font-size: 9px; color: #2A4A6A; text-align: center; }
        .shape-tag b { color: #B24BF3; font-size: 10px; display: block; }

        .shape-inp-row { display: flex; align-items: center; gap: 4px; width: 100%; }
        .s-inp {
            flex: 1; background: #060A18; border: 1px solid #1A3A5C;
            color: #00F0FF; font-family: 'Consolas', monospace;
            font-size: 10px; font-weight: bold;
            padding: 3px 5px; border-radius: 2px; outline: none; width: 0; text-align: center;
        }
        .s-inp:focus { border-color: #00F0FF; }
        .s-apply {
            background: transparent; border: 1px solid #00F0FF; color: #00F0FF;
            font-family: 'Consolas', monospace; font-size: 9px; font-weight: bold;
            padding: 3px 6px; border-radius: 2px; cursor: pointer; white-space: nowrap; transition: all .15s; flex-shrink: 0;
        }
        .s-apply:hover { background: #00F0FF; color: #07090F; }

        .shape-val { font-size: 14px; font-weight: bold; color: #00F0FF; min-width: 40px; text-align: center; }
        .shape-badge { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%; background: #2A4A6A; transition: all .3s; }
        .shape-badge.on  { background: #00FF88; box-shadow: 0 0 6px #00FF88; }

        /* 도형 패널 하단 제어 */
        .shape-ctrl { display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-top: 1px solid #0D1A2E; flex-shrink: 0; background: #060A18; border-radius: 0 0 4px 4px; }
        .ctrl-label { font-size: 10px; color: #5A7FA0; }
        .countdown-ring { position: relative; width: 28px; height: 28px; flex-shrink: 0; }
        .countdown-ring svg { position: absolute; top:0; left:0; width:28px; height:28px; }
        .ring-bg  { fill:none; stroke:#1A3A5C; stroke-width:3; }
        .ring-bar { fill:none; stroke:#00F0FF; stroke-width:3; stroke-linecap:round; stroke-dasharray:75.4; stroke-dashoffset:75.4; transition:stroke-dashoffset .1s linear; transform:rotate(-90deg); transform-origin:50% 50%; }
        .ring-txt { font-size:9px; fill:#00F0FF; font-family:'Consolas',monospace; dominant-baseline:middle; text-anchor:middle; }
        .btn-toggle {
            height: 26px; padding: 0 12px; background: transparent;
            border: 1px solid #00FF88; color: #00FF88;
            font-family: 'Consolas', monospace; font-size: 10px; font-weight: bold;
            cursor: pointer; border-radius: 2px; transition: all .15s;
        }
        .btn-toggle:hover { background: #00FF88; color: #07090F; }
        .btn-toggle.active { background: #00FF8822; }
        .toggle-status { font-size: 10px; color: #2A4A6A; margin-left: 4px; }

        /* ══ 온도 패널 ══ */
        .temp-panel { flex: 1; min-height: 0; }
        .temp-scroll { flex: 1; overflow-y: auto; min-height: 0; padding: 12px 14px; }
        .temp-cfg-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 8px 14px; border-bottom: 1px solid #0D1A2E; flex-shrink: 0; }
        .t-cfg-label { font-size: 10px; color: #5A7FA0; white-space: nowrap; }
        .t-cfg-inp {
            background: #060A18; border: 1px solid #1A3A5C;
            color: #00F0FF; font-family: 'Consolas', monospace;
            font-size: 11px; font-weight: bold;
            padding: 3px 7px; border-radius: 2px; width: 76px; outline: none;
        }
        .t-cfg-inp:focus { border-color: #00F0FF; }
        .btn-small {
            height: 24px; padding: 0 12px; background: transparent;
            font-family: 'Consolas', monospace; font-size: 10px; font-weight: bold;
            cursor: pointer; border-radius: 2px; transition: all .15s; white-space: nowrap;
        }
        .btn-cyan { border: 1px solid #00F0FF; color: #00F0FF; }
        .btn-cyan:hover { background: #00F0FF; color: #07090F; }
        .btn-purple { border: 1px solid #B24BF3; color: #B24BF3; }
        .btn-purple:hover { background: #B24BF3; color: #07090F; }
        .btn-red { border: 1px solid #FF4466; color: #FF4466; }
        .btn-red:hover { background: #FF4466; color: #07090F; }

        /* 온도 그리드 */
        .temp-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .temp-card {
            background: #060A18; border: 1px solid #1A3A5C; border-radius: 6px;
            padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 4px;
            position: relative; overflow: hidden; transition: border-color .3s;
        }
        .temp-card::before {
            content: ''; position: absolute; bottom: 0; left: 0; right: 0;
            height: var(--fill, 0%); background: var(--fill-color, #00F0FF11);
            transition: height .5s ease, background .5s; z-index: 0;
        }
        .temp-card > * { position: relative; z-index: 1; }
        .temp-addr  { font-size: 10px; color: #B24BF3; font-weight: bold; }
        .temp-label { font-size: 9px; color: #2A4A6A; }
        .thermo-svg { width: 22px; height: 56px; }
        .temp-val {
            font-size: 17px; font-weight: bold; color: #00F0FF;
            text-shadow: 0 0 8px #00F0FF66; transition: color .4s, text-shadow .4s;
        }
        .temp-val.hot  { color: #FF4466; text-shadow: 0 0 10px #FF446688; }
        .temp-val.warm { color: #FFD060; text-shadow: 0 0 10px #FFD06088; }
        .temp-val.cool { color: #00F0FF; text-shadow: 0 0 10px #00F0FF66; }
        .temp-val.cold { color: #4488FF; text-shadow: 0 0 10px #4488FF66; }
        .temp-unit { font-size: 9px; color: #2A4A6A; }

        /* ── 상태바 ── */
        .sbar { display: flex; align-items: center; gap: 10px; padding: 6px 14px; background: #060A18; border-top: 1px solid #0D1A2E; border-radius: 0 0 4px 4px; font-size: 11px; flex-shrink: 0; }
        .s-dot { width: 7px; height: 7px; border-radius: 50%; background: #2A4A6A; flex-shrink: 0; transition: all .3s; }
        .s-dot.ok  { background: #00FF88; box-shadow: 0 0 5px #00FF88; }
        .s-dot.err { background: #FF4466; box-shadow: 0 0 5px #FF4466; }
        .s-msg { color: #5A7FA0; font-size: 11px; }
        .s-msg.ok  { color: #00FF88; }
        .s-msg.err { color: #FF4466; }
        .s-cnt { margin-left: auto; color: #2A4A6A; font-size: 10px; }
        .spin { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #1A3A5C; border-top-color: #00F0FF; flex-shrink: 0; }
        .spin.on { animation: spinA .6s linear infinite; }
        @keyframes spinA { to { transform: rotate(360deg); } }

        /* ── 콘솔 ── */
        .con-panel { background: #030508; border: 1px solid #0D1A2E; border-radius: 4px; display: flex; flex-direction: column; min-height: 0; }
        .con-head  { display: flex; align-items: center; justify-content: space-between; padding: 7px 12px; border-bottom: 1px solid #0D1A2E; font-size: 10px; font-weight: bold; color: #2A4A6A; letter-spacing: 1px; flex-shrink: 0; }
        .con-body  { flex: 1; overflow-y: auto; min-height: 0; padding: 6px 10px; font-size: 10px; line-height: 1.8; }
        .log-line { display: flex; gap: 6px; }
        .log-t  { color: #2A4A6A; flex-shrink: 0; font-size: 9px; }
        .log-r  { color: #00F0FF; word-break: break-all; }
        .log-w  { color: #00FF88; word-break: break-all; }
        .log-e  { color: #FF4466; word-break: break-all; }
        .log-x  { color: #5A7FA0; word-break: break-all; }
        .btn-cl { background: transparent; border: 1px solid #1A3A5C; color: #2A4A6A; font-family: 'Consolas', monospace; font-size: 9px; padding: 2px 7px; cursor: pointer; border-radius: 2px; }
        .btn-cl:hover { border-color: #FF4466; color: #FF4466; }
    </style>
</head>
<body>
<script>var now_page_code = "b01";</script>

<div class="page-title">TAG  CONTROL</div>
<div class="page-sub">// 도형 상태 모니터링  ·  실시간 온도 시각화</div>
<div class="divider"></div>

<div class="main-grid">
    <div class="left-col">

        <!-- ① 도형 패널 -->
        <div class="panel shape-panel">
            <div class="panel-head">
                <div class="acc" style="background:#B24BF3"></div>
                <span style="color:#B24BF3">SHAPE  MONITOR  —  태그 상태 시각화</span>
                <span style="margin-left:auto"><span class="spin on" id="shapeSpin"></span></span>
            </div>
            <div class="shape-grid" id="shapeGrid"></div>
            <!-- 하단 토글 컨트롤 -->
            <div class="shape-ctrl">
                <button class="btn-toggle" id="btnAutoToggle" onclick="toggleAutoWrite()">▶  3초 자동 토글 시작</button>
                <div class="countdown-ring" id="countdownRing" style="display:none">
                    <svg viewBox="0 0 28 28">
                        <circle class="ring-bg"  cx="14" cy="14" r="12"/>
                        <circle class="ring-bar" id="ringBar" cx="14" cy="14" r="12"/>
                        <text class="ring-txt" x="14" y="14" id="ringTxt">3</text>
                    </svg>
                </div>
                <span class="toggle-status" id="toggleStatus">중지됨</span>
                <span class="s-dot" id="shapeDot" style="margin-left:auto"></span>
                <span class="s-msg" id="shapeMsg">폴링 대기</span>
                <span class="s-cnt" id="shapeCnt"></span>
            </div>
        </div>

        <!-- ② 온도 패널 -->
        <div class="panel temp-panel">
            <div class="panel-head">
                <div class="acc" style="background:#FF4466"></div>
                <span style="color:#FF4466">TEMPERATURE  —  실시간 온도 모니터링</span>
            </div>
            <div class="temp-cfg-row">
                <span class="t-cfg-label">시작 D주소</span>
                <input class="t-cfg-inp" id="tempStart" type="number" value="12000" min="0" max="65535">
                <span class="t-cfg-label">개수</span>
                <input class="t-cfg-inp" id="tempCount" type="number" value="10" min="1" max="20" style="width:52px">
                <button class="btn-small btn-cyan" onclick="applyTempRange()">APPLY</button>
                <button class="btn-small btn-purple" onclick="writeRandomTemps()" id="btnRandom">🎲 RANDOM</button>
                <button class="btn-small btn-red"    onclick="writeZeroTemps()"   id="btnZero">✕ CLEAR</button>
                <span style="font-size:10px; color:#2A4A6A; margin-left:6px" id="tempRangeLabel"></span>
            </div>
            <div class="temp-scroll">
                <div class="temp-grid" id="tempGrid"></div>
            </div>
            <div class="sbar">
                <div class="s-dot" id="tempDot"></div>
                <span class="s-msg" id="tempMsg">폴링 대기</span>
                <span class="s-cnt" id="tempCnt"></span>
            </div>
        </div>

    </div><!-- /left-col -->

    <!-- ③ 콘솔 -->
    <div class="con-panel">
        <div class="con-head"><span>▸  LOG</span><button class="btn-cl" onclick="clearLog()">CLR</button></div>
        <div class="con-body" id="conBody"></div>
    </div>
</div>

<script>
var SPRING_READ  = '/sample_pro/plc/read';
var SPRING_WRITE = '/sample_pro/plc/write';

var readTimer   = null;
var pollCount   = 0;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   도형 설정
   animClass: CSS 클래스명 (do-blink 등)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
var shapes = [
    { id:0, addr:12000, label:'PUMP-1',  shape:'circle',   animClass:'do-blink',   offColor:'#1A3A5C', onColor:'#00F0FF' },
    { id:1, addr:12001, label:'VALVE-A', shape:'rect',     animClass:'do-pulse',   offColor:'#1A3A5C', onColor:'#00FF88' },
    { id:2, addr:12002, label:'MOTOR-1', shape:'diamond',  animClass:'do-rotateY', offColor:'#1A3A5C', onColor:'#FFD060' },
    { id:3, addr:12003, label:'FAN-B',   shape:'triangle', animClass:'do-shake',   offColor:'#1A3A5C', onColor:'#FF4466' },
    { id:4, addr:12004, label:'LIGHT-1', shape:'hexagon',  animClass:'do-glow',    offColor:'#1A3A5C', onColor:'#B24BF3' }
];

/* ── SVG 생성 ── */
function makeShapeSvg(type, color, id, off) {
    var c   = off ? '#1A3A5C' : color;
    var cls = 'shape-svg' + (off ? ' shape-svg-off' : '');
    var inner = '';
    if (type === 'circle') {
        inner = '<circle cx="32" cy="32" r="26" fill="' + c + '22" stroke="' + c + '" stroke-width="2.5"/>'
              + '<circle cx="32" cy="32" r="14" fill="' + c + '55"/>';
    } else if (type === 'rect') {
        inner = '<rect x="6" y="10" width="52" height="44" rx="5" fill="' + c + '22" stroke="' + c + '" stroke-width="2.5"/>'
              + '<rect x="14" y="18" width="36" height="28" rx="3" fill="' + c + '55"/>';
    } else if (type === 'diamond') {
        inner = '<polygon points="32,3 61,32 32,61 3,32" fill="' + c + '22" stroke="' + c + '" stroke-width="2.5"/>'
              + '<polygon points="32,13 51,32 32,51 13,32" fill="' + c + '55"/>';
    } else if (type === 'triangle') {
        inner = '<polygon points="32,3 63,61 1,61" fill="' + c + '22" stroke="' + c + '" stroke-width="2.5"/>'
              + '<polygon points="32,15 53,56 11,56" fill="' + c + '55"/>';
    } else if (type === 'hexagon') {
        inner = '<polygon points="32,2 58,17 58,47 32,62 6,47 6,17" fill="' + c + '22" stroke="' + c + '" stroke-width="2.5"/>'
              + '<polygon points="32,12 50,22 50,42 32,52 14,42 14,22" fill="' + c + '55"/>';
    }
    return '<svg id="shapesvg_' + id + '" class="' + cls + '" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">'
         + inner + '</svg>';
}

/* ── 도형 패널 렌더 ── */
function buildShapeGrid() {
    var html = '';
    for (var i = 0; i < shapes.length; i++) {
        var s = shapes[i];
        html += '<div class="shape-card" id="scard_' + s.id + '">';
        html += '  <div class="shape-badge" id="sbadge_' + s.id + '"></div>';
        html += '  <div class="shape-wrap">' + makeShapeSvg(s.shape, s.onColor, s.id, true) + '</div>';
        html += '  <div class="shape-val" id="sval_' + s.id + '">—</div>';
        html += '  <div class="shape-tag"><b>' + s.label + '</b><span id="stagaddr_' + s.id + '">D' + s.addr + '</span></div>';
        html += '  <div class="shape-inp-row">';
        html += '    <input class="s-inp" id="sinp_' + s.id + '" value="D' + s.addr + '" placeholder="D주소">';
        html += '    <button class="s-apply" onclick="applyShapeAddr(' + s.id + ')">SET</button>';
        html += '  </div>';
        html += '</div>';
    }
    document.getElementById('shapeGrid').innerHTML = html;
}

/* ── 도형 주소 변경 ── */
function applyShapeAddr(id) {
    var raw  = document.getElementById('sinp_' + id).value.trim().toUpperCase().replace(/^D/,'');
    var addr = parseInt(raw);
    if (isNaN(addr) || addr < 0 || addr > 65535) { alert('유효한 D주소 (예: D10000)'); return; }
    shapes[id].addr = addr;
    document.getElementById('stagaddr_' + id).textContent = 'D' + addr;
    clog('SHAPE[' + id + '] 주소 → D' + addr, 'w');
}
function updateShape(id, val) {
    var s     = shapes[id];
    var svg   = document.getElementById('shapesvg_' + id);
    var badge = document.getElementById('sbadge_' + id);
    var valEl = document.getElementById('sval_' + id);
    var card  = document.getElementById('scard_' + id);
    if (!svg) return;

    // 1. 텍스트 및 기본 상태 업데이트
    valEl.textContent = (val === 0 ? 'OFF' : 'ON');

    if (val === 0) {
        // ── OFF 상태 ──
        recolorSvg(svg, s.offColor);
        // shape-svg-off 클래스를 추가하여 애니메이션을 강제로 끕니다.
        svg.setAttribute('class', 'shape-svg shape-svg-off'); 
        badge.className = 'shape-badge';
        card.className  = 'shape-card';
    } else {
        // ── ON 상태 ──
        recolorSvg(svg, s.onColor);
        // 중요: 기존 off 클래스를 제거하고 animClass(예: do-blink)만 남깁니다.
        svg.setAttribute('class', 'shape-svg ' + s.animClass);
        badge.className = 'shape-badge on';
        card.className  = 'shape-card active';
    }
}

function recolorSvg(svg, color) {
    var els = svg.querySelectorAll('polygon, circle, rect');
    for (var i = 0; i < els.length; i++) {
        if (i % 2 === 0) { els[i].setAttribute('fill', color + '22'); els[i].setAttribute('stroke', color); }
        else              { els[i].setAttribute('fill', color + '55'); }
    }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   도형 자동 토글 (3초 주기)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
var autoToggleTimer  = null;
var autoToggleActive = false;
var toggleValues     = [0,0,0,0,0]; // 현재 쓰여진 값
var countdownVal     = 3;
var countdownInter   = null;
var RING_CIRC        = 75.4; // 2π × 12

function toggleAutoWrite() {
    if (!autoToggleActive) {
        autoToggleActive = true;
        document.getElementById('btnAutoToggle').textContent = '■  자동 토글 중지';
        document.getElementById('btnAutoToggle').classList.add('active');
        document.getElementById('countdownRing').style.display = '';
        document.getElementById('toggleStatus').textContent = '3초마다 토글 중...';
        document.getElementById('toggleStatus').style.color = '#00FF88';
        doToggleWrite(); // 즉시 1회
        startCountdown();
        autoToggleTimer = setInterval(function(){ doToggleWrite(); startCountdown(); }, 3000);
    } else {
        autoToggleActive = false;
        clearInterval(autoToggleTimer); autoToggleTimer = null;
        clearInterval(countdownInter);  countdownInter  = null;
        document.getElementById('btnAutoToggle').textContent = '▶  3초 자동 토글 시작';
        document.getElementById('btnAutoToggle').classList.remove('active');
        document.getElementById('countdownRing').style.display = 'none';
        document.getElementById('toggleStatus').textContent = '중지됨';
        document.getElementById('toggleStatus').style.color = '#2A4A6A';
    }
}

function doToggleWrite() {
    for (var i = 0; i < shapes.length; i++) {
        toggleValues[i] = toggleValues[i] ? 0 : 1;
        writeSingle(shapes[i].addr, toggleValues[i], i);
    }
}

function writeSingle(addr, val, shapeIdx) {
    fetch(SPRING_WRITE, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ address: addr, value: val })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
        if (d.success) {
            updateShape(shapeIdx, val);
            clog('WRITE D' + addr + '=' + val, 'w');
        } else {
            clog('WRITE FAIL D' + addr + ': ' + (d.error||''), 'e');
        }
    })
    .catch(function(e){ clog('WRITE ERR D' + addr + ': ' + e.message, 'e'); });
}

/* 카운트다운 링 */
function startCountdown() {
    clearInterval(countdownInter);
    countdownVal = 3;
    updateRing(countdownVal);
    var tick = 0;
    countdownInter = setInterval(function(){
        tick += 0.1;
        var remain = Math.max(0, 3 - tick);
        updateRing(remain);
        if (remain <= 0) clearInterval(countdownInter);
    }, 100);
}
function updateRing(remain) {
    var pct    = remain / 3;
    var offset = RING_CIRC - RING_CIRC * pct;
    document.getElementById('ringBar').style.strokeDashoffset = offset;
    document.getElementById('ringTxt').textContent = Math.ceil(remain);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   온도 설정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
var tempStartAddr = 12000;
var tempCountVal  = 10;
var TEMP_MAX = 100;

function applyTempRange() {
    var s = parseInt(document.getElementById('tempStart').value) || 12000;
    var c = parseInt(document.getElementById('tempCount').value) || 10;
    if (c < 1) c = 1; if (c > 20) c = 20;
    tempStartAddr = s; tempCountVal = c;
    buildTempGrid();
    clog('TEMP 범위 D' + s + '~D' + (s+c-1), 'w');
}

function buildTempGrid() {
    document.getElementById('tempRangeLabel').textContent =
        '// D' + tempStartAddr + ' ~ D' + (tempStartAddr + tempCountVal - 1);
    var html = '';
    for (var i = 0; i < tempCountVal; i++) {
        var addr = tempStartAddr + i;
        html += '<div class="temp-card" id="tcard_' + i + '" style="--fill:0%;--fill-color:#00F0FF11">';
        html += '  <div class="temp-addr">D' + addr + '</div>';
        html += '  <div class="temp-label">TEMP-' + (i+1) + '</div>';
        html += '  ' + makeThermoSvg(i, 0, '#00F0FF');
        html += '  <div class="temp-val cool" id="tval_' + i + '">0</div>';
        html += '  <div class="temp-unit">° val</div>';
        html += '</div>';
    }
    document.getElementById('tempGrid').innerHTML = html;
}

function makeThermoSvg(id, pct, color) {
    var fillH = Math.round(pct * 0.36);
    var y2    = 44 - fillH;
    return '<svg id="tsvg_' + id + '" class="thermo-svg" viewBox="0 0 24 60" xmlns="http://www.w3.org/2000/svg">'
         + '<rect x="9" y="4" width="6" height="38" rx="3" fill="#0D1128" stroke="#1A3A5C" stroke-width="1.5"/>'
         + '<rect id="tfill_' + id + '" x="10.5" y="' + y2 + '" width="3" height="' + fillH + '" rx="1.5" fill="' + color + '"/>'
         + '<line x1="9" y1="14" x2="7" y2="14" stroke="#1A3A5C" stroke-width="1"/>'
         + '<line x1="9" y1="24" x2="7" y2="24" stroke="#1A3A5C" stroke-width="1"/>'
         + '<line x1="9" y1="34" x2="7" y2="34" stroke="#1A3A5C" stroke-width="1"/>'
         + '<circle cx="12" cy="50" r="7" id="tbulbOuter_' + id + '" fill="' + color + '44" stroke="' + color + '" stroke-width="1.5"/>'
         + '<circle cx="12" cy="50" r="4"  id="tbulb_'      + id + '" fill="' + color + '"/>'
         + '</svg>';
}

function updateTemp(i, val) {
    var card  = document.getElementById('tcard_' + i);
    var valEl = document.getElementById('tval_' + i);
    if (!card || !valEl) return;

    // 수치 뒤에 °C 단위를 붙여서 표시
    valEl.textContent = val + "°C";
    var color, cls, fillColor;
    if      (val >= 80) { color='#FF4466'; cls='hot';  fillColor='#FF446622'; }
    else if (val >= 50) { color='#FFD060'; cls='warm'; fillColor='#FFD06022'; }
    else if (val >= 20) { color='#00F0FF'; cls='cool'; fillColor='#00F0FF11'; }
    else                { color='#4488FF'; cls='cold'; fillColor='#4488FF11'; }
    valEl.className = 'temp-val ' + cls;
    var pct   = Math.min(100, Math.max(0, val / TEMP_MAX * 100));
    card.style.setProperty('--fill',       pct + '%');
    card.style.setProperty('--fill-color', fillColor);
    var fillH = Math.round(pct * 0.36);
    var y2    = 44 - fillH;
    var tf = document.getElementById('tfill_' + i);
    var tb = document.getElementById('tbulb_' + i);
    var to = document.getElementById('tbulbOuter_' + i);
    if (tf) { tf.setAttribute('y', y2); tf.setAttribute('height', fillH); tf.setAttribute('fill', color); }
    if (tb) { tb.setAttribute('fill', color); }
    if (to) { to.setAttribute('fill', color + '44'); to.setAttribute('stroke', color); }
}

/* ── 랜덤 온도 쓰기 ── */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   자동 랜덤 쓰기 제어 변수
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
var isRandomLooping = false; // 현재 무한 루프 상태인지 체크

function writeRandomTemps() {
    if (isRandomLooping) {
        clog('이미 랜덤 쓰기가 동작 중입니다.', 'x');
        return;
    }

    isRandomLooping = true;
    document.getElementById('btnRandom').textContent = '⏹ STOP RANDOM';
    document.getElementById('btnRandom').classList.replace('btn-purple', 'btn-red');
    // 버튼의 onclick을 중지 함수로 잠시 교체하거나, 로직 내부에서 판단하도록 함
    document.getElementById('btnRandom').onclick = stopRandomLoop;

    clog('무한 랜덤 쓰기 시작', 'w');
    runRandomCycle();
}

// 한 주기(D주소 전체)를 쓰는 핵심 로직
function runRandomCycle() {
    if (!isRandomLooping) return; // 중지 상태면 실행 안 함

    var count = tempCountVal;
    
    function writeOne(idx) {
        // 모든 주소를 다 썼다면?
        if (idx >= count) {
            if (isRandomLooping) {
                // 2초 대기 후 다음 주기 다시 시작 (무한 반복의 핵심)
                setTimeout(runRandomCycle, 2000); 
                clog('--- 한 주기 완료 (2초 후 재시작) ---', 'x');
            }
            return;
        }

        if (!isRandomLooping) return; // 중간에 멈췄을 경우 중단

        var addr = tempStartAddr + idx;
        var val  = Math.floor(Math.random() * 100) + 1;

        fetch(SPRING_WRITE, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ address: addr, value: val })
        })
        .then(function(r){ return r.json(); })
        .then(function(d){
            if (d.success) { 
                updateTemp(idx, val); 
                clog('AUTO WRITE D' + addr + '=' + val, 'w'); 
            }
            writeOne(idx + 1); // 다음 주소로
        })
        .catch(function(e){ 
            clog('ERR D' + addr + ': ' + e.message, 'e'); 
            writeOne(idx + 1); 
        });
    }

    writeOne(0); // 0번 인덱스부터 쓰기 시작
}

// 멈춤 기능
function stopRandomLoop() {
    isRandomLooping = false;
    document.getElementById('btnRandom').textContent = '🎲 RANDOM';
    document.getElementById('btnRandom').classList.replace('btn-red', 'btn-purple');
    document.getElementById('btnRandom').onclick = writeRandomTemps;
    clog('무한 랜덤 쓰기 중지됨', 'e');
}

/* ── 온도 전부 0으로 ── */
function writeZeroTemps() {
    document.getElementById('btnZero').textContent = '⏳ 클리어 중...';
    document.getElementById('btnZero').disabled = true;
    function writeOne(idx) {
        if (idx >= tempCountVal) {
            document.getElementById('btnZero').textContent = '✕ CLEAR';
            document.getElementById('btnZero').disabled = false;
            clog('CLEAR 완료', 'w');
            return;
        }
        var addr = tempStartAddr + idx;
        fetch(SPRING_WRITE, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ address: addr, value: 0 })
        })
        .then(function(r){ return r.json(); })
        .then(function(d){ updateTemp(idx, 0); writeOne(idx + 1); })
        .catch(function(e){ writeOne(idx + 1); });
    }
    writeOne(0);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   폴링 (읽기)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function startReading() {
    fetchShapes();
    fetchTemps();
    readTimer = setInterval(function(){ fetchShapes(); fetchTemps(); }, 1000);
}

function fetchShapes() {
    var addrs = shapes.map(function(s){ return s.addr; });
    var minA  = Math.min.apply(null, addrs);
    var maxA  = Math.max.apply(null, addrs);
    var cnt   = Math.min(50, maxA - minA + 1);
    fetch(SPRING_READ + '?start=' + minA + '&count=' + cnt)
        .then(function(r){ return r.json(); })
        .then(function(data){
            if (!data.success) { setShapeStatus('에러', 'err'); return; }
            setShapeStatus('OK', 'ok');
            for (var i = 0; i < shapes.length; i++) {
                var off = shapes[i].addr - minA;
                var val = (off >= 0 && off < data.values.length) ? (data.values[off] || 0) : 0;
                // 자동 토글 중에는 로컬 값 사용 (쓰기 직후 read lag 방지)
                if (!autoToggleActive) updateShape(shapes[i].id, val);
            }
            pollCount++;
            document.getElementById('shapeCnt').textContent = '총 ' + pollCount + '회  ' + new Date().toLocaleTimeString('ko-KR');
        })
        .catch(function(e){ setShapeStatus('오류', 'err'); clog('SHAPE ERR ' + e.message, 'e'); });
}

function fetchTemps() {
    fetch(SPRING_READ + '?start=' + tempStartAddr + '&count=' + tempCountVal)
        .then(function(r){ return r.json(); })
        .then(function(data){
            if (!data.success) { setTempStatus('에러', 'err'); return; }
            setTempStatus('수신 완료', 'ok');
            document.getElementById('tempCnt').textContent =
                'D' + tempStartAddr + '~D' + (tempStartAddr + tempCountVal - 1) + '  ' + new Date().toLocaleTimeString('ko-KR');
            for (var i = 0; i < Math.min(data.values.length, tempCountVal); i++) {
                updateTemp(i, data.values[i] || 0);
            }
        })
        .catch(function(e){ setTempStatus('오류', 'err'); clog('TEMP ERR ' + e.message, 'e'); });
}

function setShapeStatus(msg, cls) {
    document.getElementById('shapeMsg').textContent = msg;
    document.getElementById('shapeMsg').className   = 's-msg ' + (cls||'');
    document.getElementById('shapeDot').className   = 's-dot ' + (cls||'');
}
function setTempStatus(msg, cls) {
    document.getElementById('tempMsg').textContent = msg;
    document.getElementById('tempMsg').className   = 's-msg ' + (cls||'');
    document.getElementById('tempDot').className   = 's-dot ' + (cls||'');
}
function clog(msg, type) {
    var body = document.getElementById('conBody');
    if (!body) return;
    var t   = new Date().toLocaleTimeString('ko-KR');
    var cls = {r:'log-r',w:'log-w',e:'log-e',x:'log-x'}[type]||'log-x';
    body.innerHTML += '<div class="log-line"><span class="log-t">' + t + '</span><span class="' + cls + '">' + msg + '</span></div>';
    body.scrollTop  = body.scrollHeight;
}
function clearLog() { document.getElementById('conBody').innerHTML = ''; }

/* ── 초기화 ── */
buildShapeGrid();
buildTempGrid();
applyTempRange();
startReading();
</script>
</body>
</html>
