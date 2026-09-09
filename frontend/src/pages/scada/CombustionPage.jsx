import { useEffect, useState } from 'react';
import CombustionOverview from '../../components/scada/CombustionOverview';
import HmiTable from '../../components/scada/HmiTable';
import { LedInput } from '../../components/scada/HmiParts';
import ZoneBurnerModal from '../../components/scada/ZoneBurnerModal';
import { useStageStretch } from '../../components/scada/useStageScale';
import useFolderTagValues from '../../components/scada/useFolderTagValues';
import { getAlarmList } from '../../api/scada/alarmHistApi';
import { TAG_OFF, lampClassOf, lampOf, writeTag } from '../../api/scada/foldertagApi';
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

/* 그림 아래끝. 작화 조각 대부분이 transform-origin: 0 0 에 rotate(-180deg)라
   CSS의 top이 아래쪽 끝이고 실제 자리는 top-height ~ top 이다. 그래서 top만 봐도
   (469), top+height로 봐도(532) 둘 다 틀리고, 회전을 반영해 재면 475다.
   짧게 잡으면 아래가 잘리고, 길게 잡으면 그만큼 아래에 빈 띠가 생긴다. */
const STAGE_H = 475;

/* 예전에는 y가 음수인 조각(pipe135) 때문에 그림 전체를 39px 내려야 했다.
   지금 작화 CSS에는 음수 top이 하나도 없어서(최소 0) 내릴 필요가 없다 —
   0이 아니면 그만큼 위쪽에 빈 띠가 생기고 그림은 그만큼 눌린다. */
const DRAW_SHIFT = 0;

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

/* 이 화면의 PLC 태그가 든 폴더 — ez_scada.folders.id.
   DB에 만든 행의 id와 반드시 같아야 한다. 틀리면 오류가 아니라 값이 안 오는
   형태로 조용히 실패하니(태그 0개 응답), 값이 전부 '모름'으로 나오면 여기를 먼저 본다. */
const CB_FOLDER_ID = 7;

const TOP_CX0 = 199;   // 상단 1존 중심
/* 하단 개도 박스도 상단과 같은 x에 있다(199, 346, … 1081).
   전에 267로 잡혀 있던 건 잘못 잰 값이다 — rev-* 조각은 transform-origin: 0 0 에
   rotate(-180deg)가 걸려 있어서, CSS의 left(1115)가 오른쪽 끝이고 실제 가운데는
   left - width/2 (1081)다. 그래서 글씨가 박스 오른쪽으로 68px(=박스 폭) 밀려 있었다. */
const BOT_CX0 = TOP_CX0;
const ZONE_STEP = 147;

const topCx = (n) => TOP_CX0 + (n - 1) * ZONE_STEP;
const botCx = (n) => BOT_CX0 + (n - 1) * ZONE_STEP;

const PER_TOP = 96;    // 상단 개도 글씨 top (박스 y 91~121 안쪽)
const PER_BOT = 442;   // 하단 개도 글씨 top (박스 y 437~467 안쪽 — 회전 반영 후 실제 자리)

// 존 박스(y 191~369) 안에서 이름표·PV·SV가 놓이는 높이
const ZONE_TITLE_TOP = 215;
const ZONE_PV_TOP = 258;
const ZONE_SV_TOP = 302;
const ZONE_BOX_W = 128;   // 존 하나가 쓰는 폭(간격 147보다 좁게 잡아 여백을 둔다)

/* 존 설정온도(SV) 허용 범위(℃) — 7개 존이 모두 같다.
   숫자패드가 이 범위를 벗어난 값은 확정하지 못하게 막는다. */
const ZONE_SV_MIN = 0;
const ZONE_SV_MAX = 1000;

/* (존 이름표·개별연소 판의 좌표 상수가 여기 있었는데, 그 판들이 무대 밖 .cb-zonebar로
   빠지면서 쓰이지 않게 되어 지웠다. 지금 위치는 CombustionPage.css의 .cb-zonebar가 잡는다.) */

/* 상단·우측 설비 패널. plate는 제목 띠, state는 그 아래 두 글자가 놓이는 자리다.

   onCmd/offCmd가 있으면 두 칸이 조작 버튼이 되고(누르면 그 태그에 1), 램프는
   명령 이름 + '_lamp'를 읽는다. 없으면 예전처럼 표시 전용 램프로 남는다 —
   태그가 준비된 설비만 하나씩 살릴 수 있게 이렇게 갈라 두었다. */
const DEVICE_PANELS = [
  {
    key: 'mainGas', tone: 'gas', title: 'MAIN GAS',
    plate: { left: 25, top: 2, width: 190 },
    // 제목판(25~215) 아래 가운데에 오도록. left를 키우면 오른쪽으로 쏠린다.
    state: { left: 15, top: 40, width: 210 },
    on: 'OPEN', off: 'CLOSE',
    onCmd: 'main_gas_open_cmd',   // M320 / 램프 M620 — 1이면 초록
    offCmd: 'main_gas_close_cmd', // M321 / 램프 M621 — 0이면 빨강(논리가 반대다)
    offLitWhen: TAG_OFF,
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

/* 배관 부속 아래에 붙는 상태 램프. cx는 그 부속이 그려지는 가운데 x다.
   tone은 켜진 색 — 'on' 초록(정상), 'alarm' 빨강(이상·닫힘). */
const PIPE_LABELS = [
  { key: 'gasPre', cx: 273, top: 44, text: '압력 정상', tone: 'on' },
  { key: 'gasSol', cx: 332, top: 44, text: 'SOL닫힘', tone: 'alarm' },
  // 블로워 압력계(blower-pre, x 920~957 / y 4~43) 바로 아래
  { key: 'blowPre', cx: 938, top: 48, text: '압력 이상', tone: 'alarm' },
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

/* 화면 맨 아래 조작판 — 실화/버너 경보와 퍼지.
   RESET만 누르는 버튼(btn)이고 나머지는 PLC 상태를 비추는 램프(lamp)다.
   램프의 tone은 켜졌을 때의 색이고, 지금은 PLC가 없어 전부 꺼진 회색으로 나온다. */
const ACTION_PANELS = [
  {
    key: 'misfire',
    title: '실화 ALARM',
    items: [{ text: '실화', tone: 'alarm' }, { text: 'RESET', kind: 'btn' }],
  },
  {
    key: 'burner',
    title: 'BURNER ALARM',
    items: [{ text: '이상', tone: 'alarm' }, { text: 'RESET', kind: 'btn' }],
  },
  {
    key: 'purge',
    title: 'ALL PURGE',
    items: [
      { text: 'ON', tone: 'on' },
      { text: 'PURGE 준비', tone: 'on' },
      { text: 'PURGE 중', tone: 'on' },
      { text: 'PURGE 완료', tone: 'on' },
    ],
  },
];

export default function CombustionPage() {
  /* 가로 기준으로 잡아 좌우 여백을 없앤다. 그림만 담으면 1285x508(약 2.5:1)이라
     1080 화면에서 아래 판들까지 세로가 맞는다. */
  /* 가로·세로를 각각 칸에 맞춘다 — 좌우 여백 없이 꽉 채우는 대신 그림이 조금 늘어난다.
     비율을 지키면(useStageScale) 아래 판들(.cb-zonebar 104 + .cb-bottom 96)이 세로를
     먼저 가져가는 만큼 그림이 작아지고 좌우가 비게 된다. */
  const [stageRef, scale] = useStageStretch(STAGE_W, STAGE_TOTAL_H);

  /* PLC 상태·설정값. 지금은 사진과 같은 더미다. */
  const [devices] = useState({ mainGas: false, blower: false, burnerCool: false });
  const [zoneBurn] = useState(() => ZONES.map(() => false));

  /* 개별연소 모달을 띄운 존 번호. null이면 닫힘.
     존마다 창을 따로 두지 않고 번호만 바꿔 끼운다 — 내용이 존 번호로만 갈린다. */
  const [burnerZone, setBurnerZone] = useState(null);

  /* PLC 태그 값 — 이 화면이 한 번만 폴링해서 모달까지 같이 쓴다.
     모달이 따로 폴링하면 창을 열 때마다 요청이 하나 더 붙는다. */
  const { values: tagValues, error: tagValueError } = useFolderTagValues(CB_FOLDER_ID);

  /* 쓰기 진행 중인 태그 이름 — 응답 오기 전에 또 누르는 것을 막는다.
     설비 명령이라 같은 명령이 두 번 나가는 상황을 만들지 않는 편이 낫다. */
  const [busyTag, setBusyTag] = useState('');
  const [writeError, setWriteError] = useState('');

  /** 명령 태그의 램프 상태 → 클래스. 켜졌을 때 무슨 색인지, 몇일 때 켜지는지는 부르는 쪽이 정한다. */
  const lampClass = (cmdName, onClassName, litWhen) =>
    lampClassOf(tagValues, cmdName, onClassName, litWhen);

  const handleWrite = (name, value) => {
    setBusyTag(name);
    setWriteError('');

    return writeTag(CB_FOLDER_ID, name, value)
      .catch((e) => setWriteError(`${name} — ${e.message}`))
      .finally(() => setBusyTag(''));
  };

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
      {/* 높이를 인라인으로 못박지 않는다 — 남는 세로를 그대로 차지해야 그 크기를 재서
          배율을 낼 수 있다(높이를 배율로 정하면 서로를 참조해 0에서 못 벗어난다). */}
      <div className="cb-stage" ref={stageRef}>
        <div
          className="cb-stage-inner"
          style={{
            width: STAGE_W,
            height: STAGE_TOTAL_H,
            transform: `scale(${scale.x}, ${scale.y})`,
            visibility: scale.x ? 'visible' : 'hidden',
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

                {/* 두 칸 다 램프다. 걸린 쪽만 켜진다 — on쪽은 초록, off쪽은 빨강.
                    명령 태그가 있는 설비는 그 램프가 버튼도 겸한다(모양은 같다). */}
                <em className={`cb-onoff${d.stacked ? ' is-stacked' : ''}`} style={d.state}>
                  {d.onCmd ? (
                    <>
                      <button
                        type="button"
                        className={`hmi-lampbox${lampClass(d.onCmd, ' is-on', d.onLitWhen)}`}
                        onClick={() => handleWrite(d.onCmd, 1)}
                        disabled={Boolean(busyTag)}
                        data-tag={d.onCmd}
                        title={`${d.onCmd} / 램프 ${lampOf(d.onCmd)}`}
                      >
                        {d.on}
                      </button>
                      <button
                        type="button"
                        className={`hmi-lampbox${lampClass(d.offCmd, ' is-alarm', d.offLitWhen)}`}
                        onClick={() => handleWrite(d.offCmd, 1)}
                        disabled={Boolean(busyTag)}
                        data-tag={d.offCmd}
                        title={`${d.offCmd} / 램프 ${lampOf(d.offCmd)}`}
                      >
                        {d.off}
                      </button>
                    </>
                  ) : (
                    /* 아직 태그가 없는 설비(연소 BLOWER·버너 쿨링) — 더미값 표시 전용 */
                    <>
                      <b className={`hmi-lampbox${devices[d.key] ? ' is-on' : ''}`}>{d.on}</b>
                      <b className={`hmi-lampbox${devices[d.key] ? '' : ' is-alarm'}`}>{d.off}</b>
                    </>
                  )}
                </em>
              </span>
            ))}

            {PIPE_LABELS.map((l) => (
              <span
                className={`cb-pipe-label hmi-lampbox is-${l.tone}`}
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
                  min={ZONE_SV_MIN}
                  max={ZONE_SV_MAX}
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
      <div className="cb-zonebar">
        {ZONES.map((n) => (
          /* 존 기둥(topCx)에 맞춘다. botCx는 하단 개도 박스 좌표라 68px 오른쪽으로 치우쳐 있다. */
          <div
            className="cb-burn"
            key={`burn${n}`}
            style={{ left: `${(topCx(n) / STAGE_W) * 100}%`, width: ZONE_STEP * scale.x * 0.94 }}
          >
            <span className="cb-plate cb-plate--zone">{`NO.${n}ZONE`}</span>
            {/* 사진처럼 "연소"와 "ON/OFF"를 두 줄로 — 칸이 좁아 한 줄로는 안 들어간다
                (.hmi-lampbox에 white-space: pre-line이 걸려 있어 \n이 줄바꿈이 된다). */}
            <span className="cb-onoff">
              <b className={`hmi-lampbox${zoneBurn[n - 1] ? ' is-on' : ''}`}>{'연소\nON'}</b>
              <b className={`hmi-lampbox${zoneBurn[n - 1] ? '' : ' is-alarm'}`}>{'연소\nOFF'}</b>
            </span>
            {/* 이름표지만 누르면 그 존의 버너 4개 운전창이 열린다 */}
            <button
              type="button"
              className="cb-plate cb-plate--zone cb-plate--btn"
              onClick={() => setBurnerZone(n)}
            >
              {`${n}ZONE 개별연소`}
            </button>
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
              {p.items.map((it) => (it.kind === 'btn'
                ? (
                  <button type="button" className="cb-action-btn" key={it.text} disabled>
                    {it.text}
                  </button>
                )
                : (
                  /* 램프는 눌리는 것이 아니라 상태 표시라 button이 아닌 span이다.
                     지금은 PLC 값이 없어 꺼진 상태(회색)로만 나온다. */
                  <span className="cb-action-lamp hmi-lampbox" key={it.text}>{it.text}</span>
                )))}
            </div>
          </div>
        ))}
      </div>

      {burnerZone !== null && (
        <ZoneBurnerModal
          zone={burnerZone}
          values={tagValues}
          onWrite={handleWrite}
          busyTag={busyTag}
          onClose={() => setBurnerZone(null)}
        />
      )}

      {/* 쓰기 실패·값 수신 실패 안내. 화면 아래에 떠서 작화를 가리지 않는다 —
          버튼을 눌렀는데 아무 반응이 없을 때 이유를 알 수 있어야 한다. */}
      {(writeError || tagValueError) && (
        <div className="cb-toast">{writeError || tagValueError}</div>
      )}
    </div>
  );
}
