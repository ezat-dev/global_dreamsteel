import { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format, subHours } from 'date-fns';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'react-datepicker/dist/react-datepicker.css';
import './TrendPage.css';

/* ===========================================================================
   트랜드 — 온도 태그의 시계열 추이

   지금은 화면만이다. 값은 아래 makeDummySeries가 만들어내는 가짜 데이터고,
   DB(ez_scada.tb_temp_snapshot) 조회는 아직 붙이지 않았다.

   붙일 때는 getTrendList(startTime, endTime)를 부르고 rows를 그대로 <LineChart data>에
   넘기면 된다. 컬럼 이름이 곧 dataKey라서(SERIES의 key = tb_temp_tag.col_name) 변환이
   필요 없다. 다만 스냅샷 테이블은 컬럼이 태그 등록에 따라 늘어나므로, 백엔드 반환을
   List<Map<String,Object>>로 받아야 한다(ScadaAlarm 같은 고정 POJO로는 못 담는다).
   =========================================================================== */

registerLocale('ko', ko);

const TIME_FORMAT = 'yyyy-MM-dd HH:mm';

/* 오른쪽 판의 한 줄 = 차트의 한 선. 목록이 하나뿐이라 판의 이름·색과 그래프의
   이름·색이 어긋날 수 없고, 줄의 토글이 곧 그 선의 표시 여부가 된다.

   key는 tb_temp_snapshot의 컬럼명(= tb_temp_tag.col_name)이 될 자리다. 지금은 가짜
   데이터를 만드는 이름일 뿐이고, DB를 붙일 때 실제 컬럼명으로 바꾸면 된다.
   color는 참고 화면의 LED 색을 따른다. O2만 단위가 mmV이고 나머지는 ℃다
   (단위가 다르면 y축도 갈라진다 — 아래 chartOptions의 yAxis 참고). */
const VALUE_ROWS = [
  { key: 'zone1', label: '1ZONE', color: '#ff8fa3', unit: '℃' },
  { key: 'zone2', label: '2ZONE', color: '#ffe000', unit: '℃' },
  { key: 'zone3', label: '3ZONE', color: '#ff8c00', unit: '℃' },
  { key: 'zone4', label: '4ZONE', color: '#ff1a1a', unit: '℃' },
  { key: 'zone5', label: '5ZONE', color: '#ff00e0', unit: '℃' },
  { key: 'zone6', label: '6ZONE', color: '#9933ff', unit: '℃' },
  { key: 'zone7', label: '7ZONE', color: '#c8a2ff', unit: '℃' },
  { key: 'preheat', label: '예 열 대', color: '#ff77c8', unit: '℃' },
  { key: 'cool1', label: '냉 각 대 (1)', color: '#ff9ec4', unit: '℃' },
  { key: 'cool2', label: '냉 각 대 (2)', color: '#9a9a1e', unit: '℃' },
  { key: 'o2', label: 'O2 (PV)', color: '#ff1a1a', unit: 'mmV' },
];

// 빠른 조회 버튼 — 지금부터 N시간 전까지
const QUICK_HOURS = [1, 3, 6, 12, 24];

const DEFAULT_HOURS = 24;

/* mmV 값은 ℃와 자릿수가 달라서 한 축에 같이 그리면 한쪽이 납작해진다.
   단위별로 y축을 나누고, 이 표로 어느 축에 붙일지 정한다. */
const AXIS_BY_UNIT = { '℃': 0, mmV: 1 };

/* 가짜 시계열. 실제 적재 주기는 30초지만 24시간이면 2880점이라 화면에 과하다.
   구간을 200등분해서 선 모양만 보이게 한다(연동하면 통째로 사라질 코드다). */
function makeDummySeries(start, end) {
  const POINTS = 200;
  const span = end.getTime() - start.getTime();
  if (span <= 0) return [];

  return Array.from({ length: POINTS + 1 }, (_, i) => {
    const t = new Date(start.getTime() + (span * i) / POINTS);
    const row = { t: t.getTime() };
    VALUE_ROWS.forEach((r, si) => {
      // mmV는 온도와 자릿수가 달라야 두 축이 갈린 게 보인다
      const base = r.unit === 'mmV' ? 600 : 200 + si * 80;
      const swing = r.unit === 'mmV' ? 60 : 45;
      row[r.key] = Math.round(base + Math.sin(i / 12 + si) * swing + Math.sin(i / 3.5 + si) * 8);
    });
    return row;
  });
}

export default function TrendPage() {
  const [start, setStart] = useState(() => subHours(new Date(), DEFAULT_HOURS));
  const [end, setEnd] = useState(() => new Date());

  /* 빠른 버튼으로 잡은 구간이면 그 시간을, 직접 고른 구간이면 null.
     어느 버튼이 눌린 상태인지 표시하는 데만 쓴다. */
  const [quick, setQuick] = useState(DEFAULT_HOURS);

  const [error, setError] = useState('');

  /* 차트 칸의 실제 높이. Highcharts가 컨테이너 높이를 스스로 읽게 두면
     (chart.height 미지정 + 컨테이너 height: 100%) 처음 잰 값에 머물러 칸을 다 못 쓴다.
     여기서 재서 chart.height로 직접 넘기면 .highcharts-background가 칸과 같아진다. */
  const chartBoxRef = useRef(null);
  const [chartH, setChartH] = useState(0);

  useEffect(() => {
    const el = chartBoxRef.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      // 1px 미만 차이는 무시 — 소수점 흔들림으로 차트를 다시 그리지 않게 한다
      setChartH((prev) => (Math.abs(prev - h) < 1 ? prev : h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* 오른쪽 판의 토글로 감춘 선들. { key: true } 형태로, 여기 있는 선만 안 그린다.
     선을 지우는 게 아니라 감추기만 하므로 다시 켜면 그대로 돌아온다. */
  const [hidden, setHidden] = useState({});

  const toggleSeries = (key) => {
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 조회한 구간. 조회 버튼을 눌러야 그래프가 바뀌도록 입력값과 분리해 둔다.
  const [range, setRange] = useState(() => ({
    start: subHours(new Date(), DEFAULT_HOURS),
    end: new Date(),
  }));

  const rows = useMemo(() => makeDummySeries(range.start, range.end), [range]);

  const search = (s, e) => {
    if (!s || !e) {
      setError('시작·종료 시각을 모두 넣어주세요.');
      return;
    }
    if (s >= e) {
      setError('시작시각이 종료시각보다 뒤입니다.');
      return;
    }
    setError('');
    setRange({ start: s, end: e });
  };

  const applyQuick = (hours) => {
    const now = new Date();
    const from = subHours(now, hours);
    setStart(from);
    setEnd(now);
    setQuick(hours);
    setError('');
    setRange({ start: from, end: now });
  };

  /* 달력 팝업의 생김새는 경보이력 화면에서 만든 HMI 테마(.ah-cal)를 그대로 쓴다.
     모든 CSS가 한 파일로 번들되므로 클래스만 지정하면 적용된다. */
  const calProps = {
    locale: 'ko',
    dateFormat: TIME_FORMAT,
    showTimeSelect: true,
    // 1분 단위 — 경보이력·로그 화면과 같게 맞춘다(10분 단위면 원하는 시각을 못 고른다)
    timeIntervals: 1,
    timeCaption: '시각',
    /* 연·월을 골라 뛸 수 있게 한다 — 화살표만 있으면 2년 전으로 가려고 24번 눌러야 한다.
       'select'는 OS 기본 드롭다운이라 자리를 덜 먹고 터치로도 고르기 쉽다. */
    showMonthDropdown: true,
    showYearDropdown: true,
    dropdownMode: 'select',
    /* 달력 제목 — 기본값 'LLLL yyyy'는 ko 로케일에서 "9월 2026"으로 나온다.
       우리가 읽는 순서(년→월)로 바꾼다. */
    dateFormatCalendar: 'yyyy년 M월',
    className: 'ah-date',
    calendarClassName: 'ah-cal',
    popperClassName: 'ah-cal-pop',
    /* 팝업은 항상 입력칸 아래로. preventOverflow를 켜면 위로 뒤집혀 제목바를 덮는다.
       왼쪽이 잘리던 건 조회줄 자체를 안쪽으로 들여놓아(.tr-toolbar padding) 해결한다. */
    popperPlacement: 'bottom-start',
  };

  /* Highcharts 옵션. rows나 hidden이 바뀔 때만 다시 만든다 — 매 렌더 새 객체를
     넘기면 차트를 통째로 다시 그린다.

     선을 껐다 켜는 건 오른쪽 판의 토글이 맡는다. 범례는 끈다 — 둘 다 켜 두면
     Highcharts가 자기 상태로 토글해 버려서 판의 토글과 어긋난다.
     가로축 눈금 형식(구간이 길면 날짜까지)은 Highcharts가 알아서 골라 준다. */
  const chartOptions = useMemo(() => ({
    chart: {
      type: 'line',
      backgroundColor: 'transparent',
      // 잰 칸 높이를 그대로 쓴다. 0(아직 못 잼)이면 null로 넘겨 Highcharts 기본값에 맡긴다.
      height: chartH || null,
      // 화면 전체 글꼴(맑은 고딕)을 그대로 쓴다. 기본값은 한글이 어색하게 나온다.
      style: { fontFamily: 'inherit' },
      /* 위·아래 여백을 최소로 — 그림판이 칸을 상하로 꽉 쓰게 한다.
         [위, 오른쪽, 아래, 왼쪽] */
      spacing: [6, 16, 2, 2],
      animation: false,
    },
    title: { text: null },
    // 우측 하단 highcharts.com 표시 제거
    credits: { enabled: false },
    // 서버가 준 시각을 그대로 현지 시각으로 읽는다(끄면 UTC로 해석해 9시간 밀린다).
    time: { useUTC: false },

    xAxis: {
      type: 'datetime',
      lineColor: '#555555',
      tickColor: '#555555',
      labels: { style: { fontSize: '11px', color: '#555555' } },
    },
    /* 축 둘 — 0번은 왼쪽 ℃, 1번은 오른쪽 mmV.
       O2(mmV)를 온도와 같은 축에 그리면 자릿수가 달라 한쪽이 납작해진다. */
    yAxis: [
      {
        title: { text: '℃', style: { fontSize: '11px', color: '#555555' } },
        gridLineColor: '#c8c8c8',
        gridLineDashStyle: 'Dash',
        labels: { style: { fontSize: '11px', color: '#555555' } },
      },
      {
        title: { text: 'mmV', style: { fontSize: '11px', color: '#555555' } },
        opposite: true,
        // 오른쪽 축 눈금선까지 그리면 왼쪽 것과 겹쳐 지저분해진다
        gridLineWidth: 0,
        labels: { style: { fontSize: '11px', color: '#555555' } },
      },
    ],

    /* 범례도 쓰고 오른쪽 토글도 쓴다. 범례 클릭은 아래 legendItemClick에서
       Highcharts 자체 토글을 막고 우리 hidden 상태를 바꾸게 해서 둘을 한 상태로 묶었다
       (그냥 두면 Highcharts가 자기 상태로 껐다 켜서 토글과 어긋난다). */
    legend: {
      itemStyle: { fontSize: '12px', fontWeight: '600', color: '#101010' },
      itemHiddenStyle: { color: '#9a9a9a' },
      margin: 6,
      padding: 0,
    },

    tooltip: {
      shared: true,
      xDateFormat: '%Y-%m-%d %H:%M:%S',
      borderColor: '#808080',
      borderRadius: 0,
      style: { fontSize: '12px' },
    },

    plotOptions: {
      series: {
        animation: false,
        lineWidth: 1.6,
        // 200점이라 점을 찍으면 선이 안 보인다. 마우스를 올렸을 때만 표시한다.
        marker: { enabled: false, states: { hover: { enabled: true, radius: 3 } } },
        // 한 선에 마우스를 올려도 나머지를 흐리게 하지 않는다(HMI에서는 다 같이 봐야 한다).
        states: { inactive: { opacity: 1 } },
        events: {
          /* 범례를 눌러도 오른쪽 토글과 같은 상태를 건드리게 한다.
             preventDefault로 Highcharts 자체 토글을 막고 hidden만 바꾸면,
             series.visible이 다시 계산되면서 범례와 토글이 함께 움직인다.
             this가 series라서 화살표 함수를 쓰면 안 된다. */
          legendItemClick() {
            const row = VALUE_ROWS[this.index];
            if (row) toggleSeries(row.key);
            return false;
          },
        },
      },
    },

    series: VALUE_ROWS.map((r) => ({
      name: r.label,
      color: r.color,
      yAxis: AXIS_BY_UNIT[r.unit] ?? 0,
      // 토글이 꺼진 선은 감춘다(데이터는 그대로 들고 있어 다시 켜면 즉시 보인다)
      visible: !hidden[r.key],
      // Highcharts는 [x, y] 쌍의 배열을 받는다.
      data: rows.map((d) => [d.t, d[r.key]]),
    })),
  }), [rows, hidden, chartH]);

  return (
    <div className="tr-page">
      <div className="tr-toolbar">
        <div className="tr-filter">
          <label className="tr-label" htmlFor="tr-start">기간</label>
          <DatePicker
            {...calProps}
            id="tr-start"
            selected={start}
            onChange={(d) => { setStart(d); setQuick(null); }}
            maxDate={end ?? undefined}
            placeholderText="시작 시각"
          />
          <span className="tr-tilde">~</span>
          <DatePicker
            {...calProps}
            selected={end}
            onChange={(d) => { setEnd(d); setQuick(null); }}
            minDate={start ?? undefined}
            placeholderText="종료 시각"
          />
          <button type="button" className="tr-btn" onClick={() => search(start, end)}>조회</button>
        </div>

        {/* 지금부터 N시간 전까지 — 누르면 위 입력칸도 같이 채워지고 바로 조회된다 */}
        <div className="tr-quick">
          {QUICK_HOURS.map((h) => (
            <button
              type="button"
              key={h}
              className={`tr-btn tr-quick-btn${quick === h ? ' is-on' : ''}`}
              onClick={() => applyQuick(h)}
            >
              {`${h}시간`}
            </button>
          ))}
        </div>

        {error && <span className="tr-error">{error}</span>}

        <span className="tr-range">
          {`${format(range.start, TIME_FORMAT)} ~ ${format(range.end, TIME_FORMAT)}`}
        </span>
      </div>

      {/* 차트와 현재값 판을 가로로 나눈다 — 판은 폭 고정, 차트가 남는 폭을 차지한다 */}
      <div className="tr-body">
        <div className="tr-chart" ref={chartBoxRef}>
          {/* 높이는 chart.height로 직접 넘기므로(위 chartH) 컨테이너에는 폭만 준다.
              여기에 height: 100%를 같이 주면 SVG 높이와 겹쳐 흔들린다. */}
          <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
            containerProps={{ style: { width: '100%' } }}
          />
        </div>

        {/* 현재값 판 + 그래프 표시 토글. 값은 PLC가 붙으면 채운다(지금은 전부 0).
            토글이 곧 차트 범례 역할이라 그래프 쪽 범례는 꺼 두었다. */}
        <div className="tr-values">
          {VALUE_ROWS.map((r) => {
            const on = !hidden[r.key];
            return (
              <div className="tr-vrow" key={r.key}>
                <span className="tr-vlabel">{r.label}</span>

                <button
                  type="button"
                  className={`tr-toggle${on ? ' is-on' : ''}`}
                  onClick={() => toggleSeries(r.key)}
                  aria-pressed={on}
                  title={`${r.label} 그래프 ${on ? '숨기기' : '보이기'}`}
                >
                  {/* 손잡이 — 켜지면 오른쪽으로 미끄러진다(CSS transform) */}
                  <i />
                </button>

                <span className="tr-vbox">
                  <em style={{ color: r.color }}>0</em>
                  <i style={{ color: r.color }}>{r.unit}</i>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
