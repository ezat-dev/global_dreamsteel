import { useEffect, useState } from 'react';
import CombustionOverview from '../../components/scada/CombustionOverview';
import HmiTable from '../../components/scada/HmiTable';
import { LedInput } from '../../components/scada/HmiParts';
import { useStageScale } from '../../components/scada/useStageScale';
import { getAlarmList } from '../../api/scada/alarmHistApi';
// 작화 도구가 뽑아준 설비 그림 스타일. 우리 CSS보다 먼저 깐다.
import './combustionOverview.css';
import './CombustionPage.css';

/* ===========================================================================
   연소화면

   설비 그림은 작화 원본(CombustionOverview + combustionOverview.css)을 그대로 쓰고,
   그 위에 개도·존 PV/SV·조작판을 얹는다.

   원본이 2101x532px 고정 크기다. 가로가 약 4:1로 길어 구동화면처럼 가로 기준으로
   배율을 잡는다. 얹는 것들도 같이 줄어들어야 하므로 스케일 안쪽에 두고, 위치는 전부
   그림 좌표계(2101x532) 기준 px로 적는다.

   값은 아직 전부 더미다. PLC 연동 때 state 자리만 폴링 결과로 바꾸면 된다.
   =========================================================================== */

/* 작화 그림 자체는 1155x469다.
   무대를 1400으로 더 넓게 잡는 이유는, 사진에서 연소 BLOWER·버너 쿨링 패널이
   그림 오른쪽 "바깥"에 놓이기 때문이다. 그 자리(1155~1400)를 미리 비워 둔다.

   ※ 크기를 잴 때 주의 — 이 작화는 rotate(-180deg) + transform-origin: 0 0 인 조각이
     많다. 그러면 left/top의 왼쪽·위쪽으로 그려져서, left+width로 폭을 재면 실제보다
     훨씬 크게 나온다(처음에 2101로 잘못 쟀다). 네 꼭짓점을 변환해서 재야 한다. */
const DRAW_W = 1279;   // 그림이 실제로 그려지는 폭 (0 ~ 1279)
const STAGE_W = 1285;  // 얹는 것이 전부 그림 안에 들어와서 그림 폭 그대로 쓴다
const STAGE_H = 469;   // 그림 아래끝

/* 그림에 y가 음수인 조각이 하나 있다(pipe135, y -39~0). 그대로 두면 위가 잘리므로
   그림과 오버레이를 통째로 이만큼 내린다. 덕분에 아래 좌표는 전부 작화 원본 기준
   그대로 쓸 수 있다(작화의 y 0 = 오버레이의 y 0). */
const DRAW_SHIFT = 39;

// 무대는 그림만 담는다(개별연소 판은 무대 밖 .cb-zonebar).
const STAGE_TOTAL_H = DRAW_SHIFT + STAGE_H;

/* ---------------------------------------------------------------------------
   존 좌표 — 작화 CSS에서 확인한 실제 값

     상단 개도 for-N-zone-per : 중심 x 199 + (N-1)*147,  y  92~121
     하단 개도 rev-N-zone-per : 중심 x 267 + (i)*147,    y 466~496
     존 박스   zon-box        : x 120~1155, y 191~369
     MAIN GAS  main-gas       : x   0~ 378, y   0~ 93
     압력계    gas-pre        : x 258~ 289, y   8~ 39
     솔밸브    gas-sol        : x 310~ 354, y   9~ 38
     오른쪽 배관 끝           : x 2101 (여기에 연소 BLOWER 패널이 붙는다)

   ※ 하단 개도는 작화 이름이 역순이다(rev-1이 맨 오른쪽). 화면에는 사진대로
     왼쪽부터 1존으로 표시하므로, PLC 연동 때 어느 쪽이 맞는지 확인이 필요하다.
   ------------------------------------------------------------------------- */
const ZONES = [1, 2, 3, 4, 5, 6, 7];

const TOP_CX0 = 199;   // 상단 1존 중심
const BOT_CX0 = 267;   // 하단 맨 왼쪽 중심
const ZONE_STEP = 147;

const topCx = (n) => TOP_CX0 + (n - 1) * ZONE_STEP;
const botCx = (n) => BOT_CX0 + (n - 1) * ZONE_STEP;

const PER_TOP = 96;    // 상단 개도 글씨 top (박스 y 92~121 안쪽)
const PER_BOT = 470;   // 하단 개도 글씨 top (박스 y 466~496 안쪽)

// 존 박스(y 191~369) 안에서 이름표·PV·SV가 놓이는 높이
const ZONE_TITLE_TOP = 215;
const ZONE_PV_TOP = 258;
const ZONE_SV_TOP = 302;
const ZONE_BOX_W = 128;   // 존 하나가 쓰는 폭(간격 147보다 좁게 잡아 여백을 둔다)

/* 그림 아래(y 469~) — 존 이름표와 개별연소 판.
   하단 개도 글씨(PER_BOT 470)가 그림 아래끝과 겹치므로 이름표는 그보다 아래에서 시작한다. */
const NAME_TOP = 490;
const BURN_TOP = 518;
const BURN_H = 90;

/* 상단·우측 설비 패널. plate는 제목 띠, state는 그 아래 두 글자가 놓이는 자리다. */
const DEVICE_PANELS = [
  {
    key: 'mainGas', tone: 'gas', title: 'MAIN GAS',
    plate: { left: 25, top: 2, width: 190 },
    // 제목판(25~215) 아래 가운데에 오도록. left를 키우면 오른쪽으로 쏠린다.
    state: { left: 15, top: 40, width: 210 },
    on: 'OPEN', off: 'CLOSE',
  },
  /* 연소 BLOWER는 작화가 깔아둔 파란 패널 바탕(main-blower2, x 1038~1279 / y 0~64)
     위에 그대로 얹는다. main-blower1.png는 블로워 그림이 아니라 이 패널의 배경이다. */
  {
    key: 'blower', tone: 'blue', title: '연소 BLOWER',
    plate: { left: 1052, top: 3, width: 214 },
    state: { left: 1052, top: 36, width: 214 },
    on: 'ON', off: 'OFF',
  },
  /* 버너 쿨링은 바탕이 없어서 CSS로 그린다. 사진처럼 연소 BLOWER 아래에 두되,
     7존 개도(for-7-zone-per, x 1047~1115 / y 91~120)를 가리지 않게 오른쪽으로 민다. */
  {
    key: 'burnerCool', tone: 'blue', title: '버너 쿨링',
    plate: { left: 1128, top: 78, width: 150 },
    state: { left: 1128, top: 111, width: 150 },
    on: 'ON', off: 'OFF', stacked: true,
  },
];

/* 배관 부속 아래에 붙는 상태 글씨. cx는 그 부속이 그려지는 가운데 x다. */
const PIPE_LABELS = [
  { key: 'gasPre', cx: 273, top: 44, text: '압력 정상' },
  { key: 'gasSol', cx: 332, top: 44, text: 'SOL닫힘' },
  // 블로워 압력계(blower-pre, x 920~957 / y 4~43) 바로 아래
  { key: 'blowPre', cx: 938, top: 48, text: '압력 이상' },
];

/* 좌측 하단 경보 목록 — 경보이력·구동화면과 같은 API(getAlarmList)를 그대로 쓴다.
   좁은 칸이라 컬럼을 줄였다. 컬럼이 바뀌면 표를 통째로 다시 만들기 때문에
   모듈 상수로 둔다(매 렌더 새 배열을 넘기면 표가 계속 재생성된다). */
const ALARM_COLUMNS = [
  { title: '발생시각', field: 'occurTimeStr', width: 145, hozAlign: 'center' },
  { title: '태그이름', field: 'tagName', minWidth: 110, widthGrow: 2, tooltip: true, hozAlign: 'center' },
  { title: '경보주석', field: 'alarmMsg', minWidth: 130, widthGrow: 3, tooltip: true, hozAlign: 'center' },
  {
    title: '경보상태', field: 'alarmStatus', width: 90, hozAlign: 'center',
    // DB(vw_alarm_history)는 ACTIVE / CLEARED로 준다. ACTIVE만 빨간 '발생'이다.
    formatter: (cell) => (cell.getValue() === 'ACTIVE'
      ? '<span class="ht-badge on">발생</span>'
      : '<span class="ht-badge off">해제</span>'),
  },
];

/* 낮은 칸이라 페이지 넘김 줄이 자리를 너무 먹는다. 대신 세로 스크롤로 본다. */
const ALARM_OPTIONS = { pagination: false };

// 화면 맨 아래 조작판 — 실화/버너 경보와 퍼지
const ACTION_PANELS = [
  { key: 'misfire', title: '실화 ALARM', items: ['실화', 'RESET'] },
  { key: 'burner', title: 'BURNER ALARM', items: ['이상', 'RESET'] },
  { key: 'purge', title: 'ALL PURGE', items: ['ON', 'PURGE 준비', 'PURGE 중', 'PURGE 완료'] },
];

export default function CombustionPage() {
  /* 가로 기준으로 잡아 좌우 여백을 없앤다. 그림만 담으면 1285x508(약 2.5:1)이라
     1080 화면에서 아래 판들까지 세로가 맞는다. */
  const [stageRef, scale] = useStageScale(STAGE_W);

  /* PLC 상태·설정값. 지금은 사진과 같은 더미다. */
  const [devices] = useState({ mainGas: false, blower: false, burnerCool: false });
  const [zoneBurn] = useState(() => ZONES.map(() => false));

  /* 존별 SV — 작업자가 넣는 설정값이라 화면에서 바꿀 수 있다
     (PV는 PLC가 주는 현재값이라 표시만 한다). */
  const [zoneSv, setZoneSv] = useState(() => ZONES.map(() => '0'));

  const handleZoneSv = (idx, value) => {
    setZoneSv((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  /* 좌측 하단 경보 목록. 조회 조건 없이 전부 받는다 — 범위 지정은 경보이력 화면 몫이다.
     화면을 벗어난 뒤 응답이 도착해도 state를 건드리지 않게 한다
     (개발 모드의 StrictMode는 effect를 두 번 실행한다). */
  const [alarms, setAlarms] = useState([]);
  const [alarmError, setAlarmError] = useState('');

  useEffect(() => {
    let alive = true;

    getAlarmList()
      .then((res) => {
        if (alive) setAlarms(res.data ?? []);
      })
      .catch((e) => {
        if (alive) setAlarmError(e.response?.data?.message ?? '경보를 불러오지 못했습니다.');
      });

    return () => { alive = false; };
  }, []);

  return (
    <div className="cb-page">
      {/* 줄인 뒤의 실제 높이만큼만 자리를 차지하게 한다 */}
      <div className="cb-stage" ref={stageRef} style={{ height: STAGE_TOTAL_H * scale }}>
        <div
          className="cb-stage-inner"
          style={{
            width: STAGE_W,
            height: STAGE_TOTAL_H,
            transform: `scale(${scale})`,
            visibility: scale ? 'visible' : 'hidden',
          }}
        >
          {/* 그림과 오버레이를 함께 내려서 y가 음수인 조각(pipe135)이 안 잘리게 한다.
              이 안쪽은 좌표가 작화 원본 기준 그대로다. */}
          <div className="cb-shift" style={{ top: DRAW_SHIFT }}>
            <CombustionOverview />

          <div className="cb-overlay">
            {/* ── 설비 제목판 + 상태 두 글자 ── */}
            {DEVICE_PANELS.map((d) => (
              <span className="cb-dev" key={d.key}>
                <em className={`cb-plate cb-plate--${d.tone}`} style={d.plate}>{d.title}</em>
                <em className={`cb-onoff${d.stacked ? ' is-stacked' : ''}`} style={d.state}>
                  <b className={devices[d.key] ? 'is-on' : ''}>{d.on}</b>
                  <b className={devices[d.key] ? '' : 'is-on'}>{d.off}</b>
                </em>
              </span>
            ))}

            {PIPE_LABELS.map((l) => (
              <span
                className="cb-pipe-label"
                key={l.key}
                style={{ left: l.cx, top: l.top, transform: 'translateX(-50%)' }}
              >
                {l.text}
              </span>
            ))}

            {/* ── 개도 % — 작화가 그려둔 박스 위에 글씨만 얹는다 ── */}
            {ZONES.map((n) => (
              <span className="cb-per" key={`top${n}`} style={{ left: topCx(n), top: PER_TOP }}>
                #### %
              </span>
            ))}
            {ZONES.map((n) => (
              <span className="cb-per" key={`bot${n}`} style={{ left: botCx(n), top: PER_BOT }}>
                #### %
              </span>
            ))}

            {/* ── 존 이름표 + PV/SV ── */}
            {ZONES.map((n) => (
              <span
                className="cb-zone-title"
                key={`zt${n}`}
                style={{ left: topCx(n), top: ZONE_TITLE_TOP, width: ZONE_BOX_W }}
              >
                {`${n}ZONE`}
              </span>
            ))}
            {ZONES.map((n) => (
              <span
                className="cb-val-row"
                key={`pv${n}`}
                style={{ left: topCx(n), top: ZONE_PV_TOP, width: ZONE_BOX_W }}
              >
                <b>PV</b>
                {/* 단위는 박스 밖에 — 아래 SV(LedInput)가 단위를 밖에 그려서 높이를 맞춘다 */}
                <em className="cb-val is-pv">####</em>
                <em className="cb-unit">℃</em>
              </span>
            ))}
            {ZONES.map((n) => (
              <span
                className="cb-val-row"
                key={`sv${n}`}
                style={{ left: topCx(n), top: ZONE_SV_TOP, width: ZONE_BOX_W }}
              >
                <b>SV</b>
                {/* 눌러서 숫자패드로 넣는다. 파란 박스 모양은 CombustionPage.css가 덮어쓴다. */}
                <LedInput
                  value={zoneSv[n - 1]}
                  onChange={(v) => handleZoneSv(n - 1, v)}
                  size="sm"
                  unit="℃"
                  label={`${n}ZONE 설정온도`}
                  min={0}
                  max={9999}
                />
              </span>
            ))}

          </div>
          </div>
        </div>
      </div>

      {/* ===== 존 이름표 + 개별연소 판 =====
          무대 밖에 둔다. 안에 넣으면 무대가 세로로 길어져(1285x650) 배율이 높이에 묶이고
          좌우에 여백이 생긴다. 그림만 두면 1285x508이라 폭이 꽉 찬다.
          폭을 "줄인 그림과 똑같이" 잡아서, 존 위치를 %로 주면 그림과 정확히 맞는다. */}
      <div className="cb-zonebar" style={{ width: STAGE_W * scale }}>
        {ZONES.map((n) => (
          /* 존 기둥(topCx)에 맞춘다. botCx는 하단 개도 박스 좌표라 68px 오른쪽으로 치우쳐 있다. */
          <div
            className="cb-burn"
            key={`burn${n}`}
            style={{ left: `${(topCx(n) / STAGE_W) * 100}%`, width: ZONE_STEP * scale * 0.94 }}
          >
            <span className="cb-plate cb-plate--zone">{`NO.${n}ZONE`}</span>
            <span className="cb-onoff">
              <b className={zoneBurn[n - 1] ? 'is-on' : ''}>연소 ON</b>
              <b className={zoneBurn[n - 1] ? '' : 'is-on'}>연소 OFF</b>
            </span>
            <span className="cb-plate cb-plate--zone">{`${n}ZONE 개별연소`}</span>
          </div>
        ))}
      </div>

      {/* ===== 무대 밖 — 경보 목록과 조작판 (글씨가 배율에 안 눌리도록 밖에 둔다) ===== */}
      <div className="cb-bottom">
        <div className="cb-alarm">
          {alarmError && <div className="cb-alarm-error">{alarmError}</div>}
          <HmiTable data={alarms} columns={ALARM_COLUMNS} options={ALARM_OPTIONS} height="100%" />
        </div>

        {ACTION_PANELS.map((p) => (
          <div className="cb-action" key={p.key}>
            <span className="cb-plate cb-plate--action">{p.title}</span>
            <div className="cb-action-row">
              {p.items.map((it) => (
                <button type="button" className="cb-action-btn" key={it} disabled>{it}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
