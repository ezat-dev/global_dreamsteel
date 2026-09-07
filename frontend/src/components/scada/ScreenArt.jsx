/* ===========================================================================
   메인화면 타일에 들어가는 화면별 선화(線畵).

   아이콘 라이브러리의 일반 아이콘 대신 이 설비를 그린다 — 컨베이어·버너·쿨링타워처럼
   현장에서 부르는 그 물건이 보여야 어디로 가는 타일인지 한눈에 잡힌다.

   색은 전부 currentColor다. 타일이 글자색을 정하면 그림이 같이 따라오고,
   hover에서 액센트로 물들 때도 규칙을 한 곳에서 관리할 수 있다.
   =========================================================================== */

// 48x48 좌표계, 선 굵기 1.5 — 아홉 장이 같은 굵기여야 한 세트로 보인다.
const BOX = { viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor' };
const LINE = { strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

/* 강조선 — 그림마다 한 군데만 굵게 둬서 눈이 먼저 닿을 곳을 정한다.
   (제품, 불꽃, 수은주처럼 그 화면의 주인공에 해당하는 부분) */
const KEY = { strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };

/** 구동화면 — 컨베이어 벨트와 그 위를 지나는 제품 */
function DriveArt() {
  return (
    <svg {...BOX} aria-hidden="true">
      <path {...LINE} d="M4 30h40" />
      <circle {...LINE} cx="10" cy="35" r="3.5" />
      <circle {...LINE} cx="24" cy="35" r="3.5" />
      <circle {...LINE} cx="38" cy="35" r="3.5" />
      {/* 지나가는 제품 */}
      <rect {...KEY} x="17" y="18" width="14" height="9" rx="1" />
      <path {...LINE} d="M36 22h7m0 0-3-3m3 3-3 3" />
    </svg>
  );
}

/** 연소화면 — 가스 배관과 버너 노즐, 그 위의 불꽃 */
function CombustionArt() {
  return (
    <svg {...BOX} aria-hidden="true">
      {/* 불꽃 */}
      <path {...KEY} d="M24 8c4 5 6 8 6 12a6 6 0 0 1-12 0c0-2 .8-3.6 2-5 .4 1.6 1.4 2.6 2.6 2.6C24.6 17.6 26 15 24 8Z" />
      {/* 노즐과 배관 */}
      <path {...LINE} d="M18 30h12l-2 4H20l-2-4Z" />
      <path {...LINE} d="M24 34v6M8 40h32" />
      <path {...LINE} d="M14 40v-4M34 40v-4" />
    </svg>
  );
}

/** 온도제어 — 눈금이 있는 온도계와 설정값 표시 */
function TempArt() {
  return (
    <svg {...BOX} aria-hidden="true">
      <path {...LINE} d="M22 10a4 4 0 0 1 8 0v18a7 7 0 1 1-8 0V10Z" />
      {/* 수은주 */}
      <path {...KEY} d="M26 20v13" />
      <circle cx="26" cy="35" r="3" fill="currentColor" stroke="none" />
      {/* 눈금 */}
      <path {...LINE} d="M14 14h5M14 20h5M14 26h5" />
      {/* 설정값 표시 */}
      <path {...LINE} d="M36 22h6" />
      <path {...LINE} d="M39 19v6" />
    </svg>
  );
}

/** 분위기제어 — 두 가스 배관이 합쳐지고 밸브를 지나 로로 들어간다 */
function AtmosphereArt() {
  return (
    <svg {...BOX} aria-hidden="true">
      <path {...LINE} d="M6 14h10a6 6 0 0 1 6 6v2" />
      <path {...LINE} d="M6 34h10a6 6 0 0 0 6-6v-2" />
      {/* 밸브 */}
      <path {...KEY} d="M22 20h8v8h-8z" />
      <path {...LINE} d="M26 20v-5M22 15h8" />
      {/* 로로 투입 */}
      <path {...LINE} d="M30 24h6m0 0-3-3m3 3-3 3" />
      <path {...LINE} d="M40 16v16" />
    </svg>
  );
}

/** 쿨링타워 — 잘록한 냉각탑과 아래 집수조 */
function CoolingArt() {
  return (
    <svg {...BOX} aria-hidden="true">
      <path {...LINE} d="M14 8h20l-6 14 6 14H14l6-14L14 8Z" />
      {/* 집수조 수면 */}
      <path {...KEY} d="M8 40h32" />
      {/* 떨어지는 물 */}
      <path {...LINE} d="M20 28v5M24 30v4M28 28v5" />
    </svg>
  );
}

/** 트랜드 — 눈금 위의 꺾은선 두 줄 */
function TrendArt() {
  return (
    <svg {...BOX} aria-hidden="true">
      <path {...LINE} d="M8 8v32h32" />
      <path {...LINE} opacity=".45" d="M8 32h32M8 22h32M8 14h32" />
      <path {...KEY} d="M12 32l7-9 6 6 6-12 5 7" />
      <path {...LINE} opacity=".55" d="M12 37l7-4 6 3 6-6 5 4" />
    </svg>
  );
}

/** 알람화면 — 실제 화면의 격자, 한 칸만 켜져 있다 */
function AlarmArt() {
  return (
    <svg {...BOX} aria-hidden="true">
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => {
        const on = r === 1 && c === 2;
        return (
          <rect
            key={`${r}-${c}`}
            {...(on ? KEY : LINE)}
            x={9 + c * 11}
            y={11 + r * 11}
            width="9"
            height="8"
            rx="1.5"
            fill={on ? 'currentColor' : 'none'}
          />
        );
      }))}
    </svg>
  );
}

/** 경보이력 — 기간으로 조회하는 목록 */
function AlarmHistArt() {
  return (
    <svg {...BOX} aria-hidden="true">
      <path {...LINE} d="M8 12h20M8 20h20M8 28h14" />
      <circle {...KEY} cx="32" cy="32" r="9" />
      <path {...LINE} d="M32 28v4l3 2" />
    </svg>
  );
}

/** 로그 — 조작 이력. 누가 무엇을 바꿨는지 */
function LogArt() {
  return (
    <svg {...BOX} aria-hidden="true">
      <path {...LINE} d="M11 8h18l8 8v24H11V8Z" />
      <path {...LINE} d="M29 8v8h8" />
      <path {...KEY} d="M17 26h14M17 32h9" />
      <path {...LINE} opacity=".55" d="M17 20h8" />
    </svg>
  );
}

const ART = {
  drive: DriveArt,
  combustion: CombustionArt,
  temp: TempArt,
  atmosphere: AtmosphereArt,
  cooling: CoolingArt,
  trend: TrendArt,
  alarm: AlarmArt,
  alarmHistory: AlarmHistArt,
  log: LogArt,
};

/**
 * 화면 key에 맞는 선화를 그린다. 없는 key면 아무것도 그리지 않는다
 * (화면이 새로 늘었을 때 그림 없이도 타일은 정상 동작해야 한다).
 *
 * @param name scadaMenu의 key ('drive', 'combustion', …)
 */
export default function ScreenArt({ name, className = '' }) {
  const Art = ART[name];
  if (!Art) return null;

  return (
    <span className={`hmi-tile-art ${className}`.trim()}>
      <Art />
    </span>
  );
}

/* ===========================================================================
   메인화면 배경 — 열처리 라인 전체를 왼쪽에서 오른쪽으로 한 줄에 그린다.

     입구 POCKET → 입구 컨베이어 → 노(7존, 아래 버너) → 쿨링챔버 → 출구 POCKET

   장식이지만 아무 그림이나 놓은 게 아니라, 이 설비의 공정 순서가 그대로다.
   아주 연하게 깔아 타일 글자를 방해하지 않는다(.hmi-home-art의 opacity).
   =========================================================================== */

const ZONE_COUNT = 7;
const ZONE_X0 = 330;   // 노 시작 x
const ZONE_W = 62;     // 존 하나 폭

export function FurnaceLineArt() {
  return (
    <svg viewBox="0 0 1200 150" fill="none" stroke="currentColor" aria-hidden="true">
      {/* 바닥 */}
      <path {...LINE} d="M20 128h1160" />

      {/* 입구 POCKET */}
      <path {...LINE} d="M40 60h90v52H40z" />
      <path {...LINE} d="M40 74h90M40 88h90" />

      {/* 입구 컨베이어 — 롤러 위의 제품 */}
      <path {...LINE} d="M150 112h160" />
      {[168, 200, 232, 264, 296].map((x) => (
        <circle key={`in-${x}`} {...LINE} cx={x} cy={119} r="6" />
      ))}
      <path {...LINE} d="M214 96h34v12h-34z" />

      {/* 노 본체 — 존 칸막이와 아래 버너 */}
      <path {...LINE} d="M330 52h434v60H330z" />
      {Array.from({ length: ZONE_COUNT - 1 }, (_, i) => {
        const x = ZONE_X0 + ZONE_W * (i + 1);
        return <path key={`div-${i}`} {...LINE} d={`M${x} 52v60`} />;
      })}
      {/* 존마다 버너 불꽃 하나 */}
      {Array.from({ length: ZONE_COUNT }, (_, i) => {
        const cx = ZONE_X0 + ZONE_W * i + ZONE_W / 2;
        return (
          <path
            key={`flame-${i}`}
            {...LINE}
            d={`M${cx} 126c2.6-3.4 4-5.4 4-8a4 4 0 0 0-8 0c0 2.6 1.4 4.6 4 8Z`}
          />
        );
      })}
      {/* 노 안을 지나는 제품 */}
      <path {...LINE} d="M470 76h150" />

      {/* 쿨링챔버 — 위에서 물이 떨어진다 */}
      <path {...LINE} d="M784 52h150v60H784z" />
      {[820, 850, 880, 910].map((x) => (
        <path key={`drop-${x}`} {...LINE} d={`M${x} 64v14`} />
      ))}
      <path {...LINE} d="M784 96h150" />

      {/* 출구 컨베이어 */}
      <path {...LINE} d="M950 112h100" />
      {[966, 998, 1030].map((x) => (
        <circle key={`out-${x}`} {...LINE} cx={x} cy={119} r="6" />
      ))}

      {/* 출구 POCKET */}
      <path {...LINE} d="M1070 60h90v52h-90z" />
      <path {...LINE} d="M1070 74h90M1070 88h90" />
    </svg>
  );
}
