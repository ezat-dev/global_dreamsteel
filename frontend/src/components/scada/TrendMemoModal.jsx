import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { format, parse, isValid } from 'date-fns';
import { useTranslation } from 'react-i18next';
import 'react-datepicker/dist/react-datepicker.css';
import { insertTrendMemo, updateTrendMemo, deleteTrendMemo } from '../../api/scada/trendMemoApi';
import useCalLocale from './useCalLocale';

/* ===========================================================================
   트랜드 메모 모달 — 추가·수정·삭제를 한 창에서 한다.

   memo(고칠 메모)를 받으면 수정 모드, 안 받으면 추가 모드다. 창을 둘로 나누지 않은
   이유는 칸 구성이 똑같기 때문이다 — 나누면 같은 폼을 두 벌 관리해야 한다.

   시각은 트랜드 조회줄과 같은 달력(react-datepicker)으로 받는다. 브라우저 기본
   datetime-local을 쓰면 크롬·엣지마다 생김새가 달라 이 화면에서만 튄다.
   설정(CAL_PROPS)은 TrendPage의 조회 달력에서 그대로 가져왔다 — 한쪽을 고치면
   다른 쪽도 같이 고쳐야 두 달력이 계속 같아 보인다.
   =========================================================================== */

/* 칸 길이는 tb_temp_memo의 컬럼 길이 그대로다. 더 받아 봐야 DB에서 잘린다.
   제목이 10자로 짧은 건 깃발 옆에 붙는 글자라서다 — 길면 그래프를 덮는다. */
const TITLE_MAX = 10;         // tb_temp_memo.tc_name  VARCHAR(10)
const CONTENT_MAX = 100;      // tb_temp_memo.tc_desc  VARCHAR(100)

/* 서버와 주고받는 이름은 컬럼 이름 그대로다(tc_regtime → tcRegtime).
   폼 안에서는 짧은 이름을 쓰고, 보낼 때만 tc_로 바꿔 담는다. */

const TIME_FORMAT = 'yyyy-MM-dd HH:mm';
const SERVER_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/* 달력 설정 — TrendPage 조회줄의 calProps와 같은 값이다. 둘이 같아 보여야 하므로
   한쪽을 고치면 다른 쪽도 고칠 것. 언어에 따라 바뀌는 locale·timeCaption·달력 제목은
   useCalLocale이 따로 준다(아래 컴포넌트에서 펼쳐 넣는다). */
const CAL_PROPS = {
  dateFormat: TIME_FORMAT,
  showTimeSelect: true,
  // 1분 단위 — 10분 단위면 메모를 남기려는 시각을 정확히 못 고른다
  timeIntervals: 1,
  showMonthDropdown: true,
  showYearDropdown: true,
  dropdownMode: 'select',
  className: 'ah-date tm-date',
  wrapperClassName: 'tm-datewrap',
  calendarClassName: 'ah-cal',
  popperClassName: 'ah-cal-pop',
  popperPlacement: 'bottom-start',
};

/** 서버가 준 'yyyy-MM-dd HH:mm:ss' → 달력이 다루는 Date. 못 읽으면 지금. */
function toDate(serverTime) {
  if (!serverTime) return new Date();
  const d = parse(String(serverTime), SERVER_FORMAT, new Date());
  return isValid(d) ? d : new Date();
}

/** 달력이 준 Date → 서버가 받는 'yyyy-MM-dd HH:mm:ss'. 초는 항상 00으로 맞춘다. */
function toServerValue(date) {
  return `${format(date, TIME_FORMAT)}:00`;
}

/**
 * @param memo      고칠 메모. 없으면 추가 모드.
 * @param defaultTime 추가 모드에서 시각 칸의 기본값(Date). 없으면 지금.
 * @param onClose   닫기 — 취소·성공 후 모두 이걸로 닫는다
 * @param onSaved   추가·수정·삭제가 끝난 뒤 호출. 목록을 다시 부르는 쪽에서 쓴다.
 */
export default function TrendMemoModal({ memo, defaultTime, onClose, onSaved }) {
  const { t } = useTranslation('trend');
  const calLocale = useCalLocale();
  const editing = Boolean(memo?.tcCnt);

  // memoTime만 Date다(달력이 Date를 주고받는다). 나머지 두 칸은 글자.
  const [form, setForm] = useState(() => ({
    memoTime: editing ? toDate(memo.tcRegtime) : (defaultTime ?? new Date()),
    title: memo?.tcName ?? '',
    content: memo?.tcDesc ?? '',
  }));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* ESC로 닫기. 저장 중에는 무시한다 — 응답을 기다리는 중에 창이 사라지면 결과를 알 수 없다.
     지우기 확인이 떠 있으면 ESC가 그것만 먼저 거둔다.
     달력이 펼쳐져 있을 때도 넘긴다 — 그 ESC는 달력을 접으라는 뜻이고, 접는 일은
     react-datepicker가 스스로 한다. 여기서 같이 닫으면 창까지 사라진다. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || submitting) return;
      if (document.querySelector('.ah-cal')) return;
      if (confirmDelete) setConfirmDelete(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [submitting, confirmDelete, onClose]);

  const setField = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    setError('');
  };

  /* 보내기 전에 걸러낸다 — 서버도 검증하겠지만 왕복 없이 바로 알려주는 게 낫다. */
  const validate = () => {
    if (!form.memoTime) return t('memo.enterTime');
    if (!form.title.trim()) return t('memo.enterTitle');
    return '';
  };

  const run = (promise, failMsg) => {
    setSubmitting(true);
    setError('');
    promise
      .then(() => {
        onSaved?.();
        onClose();
      })
      .catch((err) => setError(err.response?.data?.message ?? failMsg))
      .finally(() => setSubmitting(false));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const payload = {
      tcRegtime: toServerValue(form.memoTime),
      tcName: form.title.trim(),
      tcDesc: form.content.trim(),
    };

    if (editing) {
      run(updateTrendMemo({ ...payload, tcCnt: memo.tcCnt }), t('memo.updateFailed'));
    } else {
      run(insertTrendMemo(payload), t('memo.saveFailed'));
    }
  };

  const handleDelete = () => {
    run(deleteTrendMemo(memo.tcCnt), t('memo.deleteFailed'));
  };

  return (
    /* 막을 클릭해도 닫히게 한다. 단 패널 안쪽 클릭이 타고 올라와 닫는 일이 없도록
       이벤트가 막 자신에서 시작했는지 확인한다(사용자 모달과 같은 방식). */
    <div
      className="hmi-umodal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form className="hmi-umodal" onSubmit={handleSubmit}>
        <div className="hmi-umodal-title">{editing ? t('memo.editTitle') : t('memo.addTitle')}</div>

        <div className="hmi-umodal-body">
          <div className="hmi-umodal-row">
            <label htmlFor="tm-time">{t('memo.time')}</label>
            <DatePicker
              {...CAL_PROPS}
              {...calLocale}
              id="tm-time"
              selected={form.memoTime}
              onChange={(d) => {
                setForm((prev) => ({ ...prev, memoTime: d }));
                setError('');
              }}
              placeholderText={t('memo.timePlaceholder')}
            />
          </div>

          <div className="hmi-umodal-row">
            {/* 10자에서 입력이 그냥 멈추면 고장인 줄 안다. 남은 자릿수를 보여 준다. */}
            <label htmlFor="tm-title">
              {t('memo.title')} <span className="tm-count">{`${form.title.length}/${TITLE_MAX}`}</span>
            </label>
            <input
              id="tm-title"
              className="hmi-umodal-input"
              value={form.title}
              onChange={setField('title')}
              maxLength={TITLE_MAX}
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="hmi-umodal-row tm-content-row">
            <label htmlFor="tm-content">
              {t('memo.content')} <span className="tm-count">{`${form.content.length}/${CONTENT_MAX}`}</span>
            </label>
            <textarea
              id="tm-content"
              className="hmi-umodal-input tm-textarea"
              value={form.content}
              onChange={setField('content')}
              maxLength={CONTENT_MAX}
              rows={5}
            />
          </div>

          {/* 수정 모드에서만 — 누가 남겼는지 보여준다. 고칠 수 없는 값이라 글씨로만 둔다. */}
          {editing && memo.tcUserName && (
            <div className="hmi-umodal-hint">{t('memo.author', { name: memo.tcUserName })}</div>
          )}

          {error && <div className="hmi-umodal-error">{error}</div>}
        </div>

        <div className="hmi-umodal-foot">
          {/* 지우기는 한 번 더 묻는다. 메모는 되돌릴 수 없고, 수정하러 들어왔다가
              잘못 누르기 쉬운 자리다. */}
          {editing && !confirmDelete && (
            <button
              type="button"
              className="hmi-btn tm-del"
              onClick={() => setConfirmDelete(true)}
              disabled={submitting}
            >
              {t('memo.delete')}
            </button>
          )}
          {editing && confirmDelete && (
            <>
              <span className="tm-confirm">{t('memo.confirmDelete')}</span>
              <button
                type="button"
                className="hmi-btn tm-del"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? t('memo.deleting') : t('memo.yes')}
              </button>
              <button
                type="button"
                className="hmi-btn"
                onClick={() => setConfirmDelete(false)}
                disabled={submitting}
              >
                {t('memo.no')}
              </button>
            </>
          )}

          {!confirmDelete && (
            <>
              <button type="submit" className="hmi-btn is-primary" disabled={submitting}>
                {submitting ? t('memo.saving') : t('memo.save')}
              </button>
              <button type="button" className="hmi-btn" onClick={onClose} disabled={submitting}>
                {t('memo.cancel')}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
