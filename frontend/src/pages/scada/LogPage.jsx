import { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import HmiTable from '../../components/scada/HmiTable';
import { getLogList } from '../../api/scada/logApi';
// 라이브러리 기본 스타일을 먼저 깔고, AlarmHistPage.css의 .ah-cal 규칙이 HMI 톤으로 덮어쓴다.
import 'react-datepicker/dist/react-datepicker.css';
/* 툴바·달력·표 레이아웃이 경보이력 화면과 같아서 그 CSS를 그대로 쓴다(ah-* 클래스).
   따로 복제하면 한쪽만 고쳐지는 일이 생긴다. */
import './AlarmHistPage.css';

/* ===========================================================================
   로그 화면 — scada_log 조회

   조작 이력이다: 누가(user_id, user_name) 어떤 PLC 주소(address)에 어떤 값(send_value)을
   언제(insert_date) 써 넣었는지. 컬럼 field는 DB 컬럼을 카멜케이스로 바꾼 이름 그대로 쓴다
   (send_value → sendValue). MyBatis에 mapUnderscoreToCamelCase가 켜져 있어서
   백엔드가 따로 매핑하지 않아도 이 이름으로 내려온다.

   log_id는 표에 넣지 않는다 — PK라 작업자가 볼 이유가 없다. 정렬은 백엔드가
   log_id DESC로 하고 있어서 최신이 위에 온다(NO 열이 그 순서다).
   =========================================================================== */

registerLocale('ko', ko);

/* 입력칸에 보이는 형식이자 직접 타이핑할 때 파싱되는 형식.
   달력에서는 분 단위까지만 고를 수 있고(라이브러리 제약), 초까지 지정하려면
   칸에 직접 적으면 된다. */
const TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/* 한 페이지에 뿌릴 행 수. HmiTable 기본값(20)을 덮어쓴다.
   화면에서 20/50/100/200 중에 다시 고를 수 있고, 여기 값은 처음 열었을 때의 선택이다.
   모듈 상수로 두는 이유는 매 렌더 새 객체를 넘기지 않기 위해서다. */
const LOG_OPTIONS = { paginationSize: 50 };

export default function LogPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 기록시각 조회 범위. DatePicker가 다루는 값이라 Date 객체이고, 비어 있으면 null이다.
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

    const params = {};
    if (start) params.startTime = format(start, TIME_FORMAT);
    if (end) params.endTime = format(end, TIME_FORMAT);

    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError('');

    getLogList(params)
      .then((res) => {
        if (reqId === reqIdRef.current) setRows(res.data ?? []);
      })
      .catch((e) => {
        if (reqId === reqIdRef.current) {
          setRows([]);
          setError(e.response?.data?.message ?? '로그를 불러오지 못했습니다.');
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
    /* 연·월을 골라 뛸 수 있게 한다 — 화살표만 있으면 2년 전으로 가려고 24번 눌러야 한다.
       'select'는 OS 기본 드롭다운이라 자리를 덜 먹고 터치로도 고르기 쉽다. */
    showMonthDropdown: true,
    showYearDropdown: true,
    dropdownMode: 'select',
    /* 달력 제목 — 기본값 'LLLL yyyy'는 ko 로케일에서 "9월 2026"으로 나온다.
       우리가 읽는 순서(년→월)로 바꾼다. */
    dateFormatCalendar: 'yyyy년 M월',
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
     없는 컬럼들이 남는 공간을 widthGrow 비율대로 나눠 갖는다. 번호/ID/시각처럼 값
     길이가 일정한 컬럼은 width로 고정하고, 주소·전송값만 늘어나게 둔다. */
  const columns = useMemo(
    () => [
      { title: 'NO', formatter: 'rownum', hozAlign: 'center', width: 60 },
      { title: '아이디', field: 'userId', width: 120, hozAlign: 'center' },
      { title: '이름', field: 'userName', width: 110, hozAlign: 'center' },
      { title: '태그주소', field: 'address', minWidth: 160, widthGrow: 2, tooltip: true, hozAlign: 'center' },
      { title: '전송값', field: 'sendValue', minWidth: 120, widthGrow: 1, hozAlign: 'center' },
      {
        // yyyy-MM-dd HH:mm:ss 가 딱 들어가는 폭. 더 주면 가운데만 비어 보인다.
        title: '기록시각', field: 'insertDate', width: 180, hozAlign: 'center',
        /* TIMESTAMP를 String으로 받기 때문에 드라이버에 따라 '2026-09-02 15:21:07.0'처럼
           소수부가 붙어 올 수 있다. 초까지만 잘라서 다른 화면의 시각 표기와 맞춘다. */
        formatter: (cell) => (cell.getValue() ?? '').slice(0, 19),
      },
    ],
    []
  );

  return (
    <div className="ah-page">
      <div className="ah-toolbar">
        <div className="ah-filter">
          <label className="ah-label" htmlFor="log-start">기록시각</label>
          {/* maxDate/minDate로 달력에서 뒤집힌 범위를 못 고르게 막고,
              칸에 직접 적어 넣은 경우는 search가 한 번 더 걸러낸다. */}
          <DatePicker
            {...calProps}
            id="log-start"
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
        <HmiTable data={rows} columns={columns} options={LOG_OPTIONS} height="100%" />
      </div>
    </div>
  );
}
