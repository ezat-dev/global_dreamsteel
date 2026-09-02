import { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import HmiTable from '../../components/scada/HmiTable';
import { getAlarmList } from '../../api/scada/alarmHistApi';
// 라이브러리 기본 스타일을 먼저 깔고, AlarmHistPage.css의 .ah-cal 규칙이 HMI 톤으로 덮어쓴다.
import 'react-datepicker/dist/react-datepicker.css';
import './AlarmHistPage.css';

/* ===========================================================================
   경보이력 화면 — global_dreamsteel.alarm_list 조회

   컬럼 field는 DB 컬럼을 카멜케이스로 바꾼 이름 그대로 쓴다(alarm_generate_time →
   alarmGenerateTime). MyBatis 설정에 mapUnderscoreToCamelCase가 켜져 있어서
   백엔드가 따로 매핑하지 않아도 이 이름으로 내려온다.
   =========================================================================== */

// 달력의 요일·월 이름을 한글로 — locale="ko"로 지정한 이름과 짝이 맞아야 한다.
registerLocale('ko', ko);

/* 입력칸에 보이는 형식이자 직접 타이핑할 때 파싱되는 형식.
   달력에서는 분 단위까지만 고를 수 있고(라이브러리 제약), 초까지 지정하려면
   칸에 직접 적으면 된다. */
const TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/* 한 페이지에 뿌릴 행 수. HmiTable 기본값(20)을 덮어쓴다.
   화면에서 20/50/100/200 중에 다시 고를 수 있고, 여기 값은 처음 열었을 때의 선택이다.
   모듈 상수로 두는 이유는 매 렌더 새 객체를 넘기지 않기 위해서다. */
const ALARM_OPTIONS = { paginationSize: 50 };

export default function AlarmHistPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 발생시각 조회 범위. DatePicker가 다루는 값이라 Date 객체이고, 비어 있으면 null이다.
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  /* 마지막으로 보낸 요청 번호. 늦게 도착한 이전 응답이 최신 결과를 덮어쓰지 않게 하고,
     화면을 벗어난 뒤 도착한 응답도 무시하게 한다(StrictMode의 이중 실행 포함). */
  const reqIdRef = useRef(0);

  /* 달력이 펼쳐져 있는지. Enter가 날짜 확정인지 조회인지 구분하는 데만 쓴다
     (아래 handleKeyDown 참고). 화면을 다시 그릴 필요가 없어 state가 아닌 ref로 둔다. */
  const calOpenRef = useRef(false);

  /* 조회 조건을 인자로 받는다 — state를 직접 읽지 않아야 마운트 시 1회 호출과
     버튼 클릭 호출이 같은 함수를 쓸 수 있다. */
  const search = (start, end) => {
    if (start && end && start > end) {
      setError('시작시각이 종료시각보다 뒤입니다.');
      return;
    }
    console.log('search', start, end);

    const params = {};
    if (start) params.startTime = format(start, TIME_FORMAT);
    if (end) params.endTime = format(end, TIME_FORMAT);

    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError('');

    getAlarmList(params)
      .then((res) => {
        if (reqId === reqIdRef.current) setRows(res.data ?? []);
      })
      .catch((e) => {
        if (reqId === reqIdRef.current) {
          setRows([]);
          setError(e.response?.data?.message ?? '경보이력을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (reqId === reqIdRef.current) setLoading(false);
      });
  };

  // 처음 열 때는 범위 없이 전체를 부르고, 이후에는 조회 버튼(또는 Enter)으로만 다시 부른다.
  useEffect(() => {
    search(null, null);
    // 마운트 시 1회만 — search는 인자로만 조건을 받으므로 의존성이 없다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 입력 칸에서 Enter를 치면 조회한다(폼이 없어 기본 제출 동작이 없다).
     단 달력이 펼쳐져 있을 때의 Enter는 라이브러리가 '날짜 선택 확정'으로 쓰므로
     비켜 준다 — 그때 조회를 걸면 아직 반영 전인 이전 값으로 조회하게 된다.
     달력이 닫힌 뒤 한 번 더 누르면 조회된다. */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !calOpenRef.current) search(startTime, endTime);
  };

  // 두 칸이 동시에 열릴 일이 없어 ref 하나를 같이 쓴다.
  const calProps = {
    locale: 'ko',
    dateFormat: TIME_FORMAT,
    showTimeSelect: true,
    timeIntervals: 1,
    timeCaption: '시각',
    isClearable: true,
    className: 'ah-date',
    calendarClassName: 'ah-cal',
    popperClassName: 'ah-cal-pop',
    onKeyDown: handleKeyDown,
    onCalendarOpen: () => { calOpenRef.current = true; },
    onCalendarClose: () => { calOpenRef.current = false; },
  };

  /* columns가 바뀌면 표를 통째로 다시 만들기 때문에 한 번만 만든다.

     폭 배분 — 래퍼가 layout: 'fitColumns'라서, width를 준 컬럼은 고정이고 width가
     없는 컬럼들이 남는 공간을 widthGrow 비율대로 나눠 갖는다. 시각/상태처럼 값 길이가
     일정한 컬럼은 width로 고정하고, 길이가 들쭉날쭉한 텍스트 컬럼(경보주석·태그이름)만
     늘어나게 둔다. 둘 중 하나만 width를 비워두면 그 컬럼이 남는 공간을 전부 먹는다. */
  const columns = useMemo(
    () => [
      { title: 'NO', formatter: 'rownum', hozAlign: 'center', width: 60 },
      { title: '태그이름', field: 'tagName', minWidth: 160, widthGrow: 2, tooltip: true, hozAlign: 'center' },
      { title: '태그주소', field: 'address', width: 120, hozAlign: 'center' },
      { title: '경보주석', field: 'alarmMsg', minWidth: 240, widthGrow: 3, tooltip: true, hozAlign: 'center' },
      {
        title: '경보상태', field: 'alarmStatus', width: 120, hozAlign: 'center',
        /* DB(vw_alarm_history)는 ACTIVE / CLEARED로 주는데 현장에서 읽을 말로 바꿔 보여준다.
           ACTIVE만 빨간 '발생'이고 나머지는 전부 회색 '해제'다 — 지금 값이 둘뿐이지만
           나중에 다른 상태가 늘어도 발생으로 오인하지 않게 ACTIVE만 골라낸다. */
        formatter: (cell) => {
          const on = cell.getValue() === 'ACTIVE';
          return on
            ? '<span class="ht-badge on">발생</span>'
            : '<span class="ht-badge off">해제</span>';
        },
      },
      // yyyy-MM-dd HH:mm:ss 가 딱 들어가는 폭. 더 주면 가운데만 비어 보인다.
      { title: '발생시각', field: 'occurTimeStr', width: 170, hozAlign: 'center' },
      { title: '해제시각', field: 'clearTimeStr', width: 170, hozAlign: 'center' },
    ],
    []
  );

  return (
    <div className="ah-page">
      <div className="ah-toolbar">
        <div className="ah-filter">
          <label className="ah-label" htmlFor="ah-start">발생시각</label>
          {/* maxDate/minDate로 달력에서 뒤집힌 범위를 못 고르게 막고,
              칸에 직접 적어 넣은 경우는 search가 한 번 더 걸러낸다. */}
          <DatePicker
            {...calProps}
            id="ah-start"
            selected={startTime}
            onChange={setStartTime}
            maxDate={endTime ?? undefined}
            placeholderText="시작 시각"
          />
          <span className="ah-tilde">~</span>
          <DatePicker
            {...calProps}
            selected={endTime}
            onChange={setEndTime}
            minDate={startTime ?? undefined}
            placeholderText="종료 시각"
          />
          <button
            type="button"
            className="ah-btn"
            onClick={() => search(startTime, endTime)}
            disabled={loading}
          >
            조회
          </button>
        </div>

        {error && <span className="ah-error">{error}</span>}
        <span className="ah-count">{loading ? '불러오는 중...' : `총 ${rows.length}건`}</span>
      </div>

      <div className="ah-table">
        <HmiTable data={rows} columns={columns} options={ALARM_OPTIONS} height="100%" />
      </div>
    </div>
  );
}
