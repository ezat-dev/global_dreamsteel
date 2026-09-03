import { useMemo, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { format, subHours } from 'date-fns';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
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

/* 그릴 선들. key는 tb_temp_snapshot의 컬럼명(= tb_temp_tag.col_name),
   name은 범례에 찍히는 이름(= tb_temp_tag.tag_name)이다. */
const SERIES = [
  { key: '1_zone_pv', name: 'BCF_1_CT_PV', color: '#e02020' },
  { key: '1_zone_sv', name: 'TEST_0820', color: '#f08c00' },
  { key: 'BCF_1_CP_PV', name: 'BCF_1_CP_PV', color: '#2a8fe0' },
  { key: 'BCF_1_CT_SP', name: 'BCF_1_CT_SP', color: '#00a86b' },
  { key: 'BCF_1_UJ_SP', name: 'BCF_1_UJ_SP', color: '#8a4fd0' },
  { key: 'BCF_1_CP_SP', name: 'BCF_1_CP_SP', color: '#b58900' },
  { key: 'BCF_1_C3H8', name: 'BCF_1_C3H8', color: '#0f6fa8' },
];

// 빠른 조회 버튼 — 지금부터 N시간 전까지
const QUICK_HOURS = [1, 3, 6, 12, 24];

const DEFAULT_HOURS = 24;

/* 가짜 시계열. 실제 적재 주기는 30초지만 24시간이면 2880점이라 화면에 과하다.
   구간을 200등분해서 선 모양만 보이게 한다(연동하면 통째로 사라질 코드다). */
function makeDummySeries(start, end) {
  const POINTS = 200;
  const span = end.getTime() - start.getTime();
  if (span <= 0) return [];

  return Array.from({ length: POINTS + 1 }, (_, i) => {
    const t = new Date(start.getTime() + (span * i) / POINTS);
    const row = { t: t.getTime() };
    SERIES.forEach((s, si) => {
      const base = 300 + si * 90;
      row[s.key] = Math.round(base + Math.sin(i / 12 + si) * 45 + Math.sin(i / 3.5 + si) * 8);
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
    timeIntervals: 10,
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

  // 가로축 눈금 — 구간이 길면 날짜까지, 짧으면 시:분만 보여준다.
  const spanHours = (range.end - range.start) / 3600000;
  const tickFormat = spanHours > 24 ? 'MM/dd HH:mm' : 'HH:mm';

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

      <div className="tr-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 12, right: 24, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="#c8c8c8" strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              scale="time"
              tickFormatter={(v) => format(new Date(v), tickFormat)}
              tick={{ fontSize: 11 }}
              stroke="#555555"
              minTickGap={40}
            />
            <YAxis tick={{ fontSize: 11 }} stroke="#555555" width={52} />
            <Tooltip
              labelFormatter={(v) => format(new Date(v), 'yyyy-MM-dd HH:mm:ss')}
              contentStyle={{ fontSize: 12, borderRadius: 0, border: '1px solid #808080' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={1.6}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
