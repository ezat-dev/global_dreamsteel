import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { insertTrendMemo, updateTrendMemo, deleteTrendMemo } from '../../api/scada/trendMemoApi';

/* ===========================================================================
   트랜드 메모 모달 — 추가·수정·삭제를 한 창에서 한다.

   memo(고칠 메모)를 받으면 수정 모드, 안 받으면 추가 모드다. 창을 둘로 나누지 않은
   이유는 칸 구성이 똑같기 때문이다 — 나누면 같은 폼을 두 벌 관리해야 한다.

   시각은 <input type="datetime-local">로 받는다. 이 칸이 요구하는 형식이
   'yyyy-MM-ddTHH:mm'이고 서버는 'yyyy-MM-dd HH:mm:ss'를 쓰므로 양쪽에서 변환한다.
   숫자패드(LedInput)를 쓰지 않는 유일한 입력이다 — 날짜·시각은 자릿수가 많아
   숫자패드로 넣기 불편하다.
   =========================================================================== */

/* 칸 길이는 tb_temp_memo의 컬럼 길이 그대로다. 더 받아 봐야 DB에서 잘린다.
   제목이 10자로 짧은 건 깃발 옆에 붙는 글자라서다 — 길면 그래프를 덮는다. */
const TITLE_MAX = 10;         // tb_temp_memo.tc_name  VARCHAR(10)
const CONTENT_MAX = 100;      // tb_temp_memo.tc_desc  VARCHAR(100)

/* 서버와 주고받는 이름은 컬럼 이름 그대로다(tc_regtime → tcRegtime).
   폼 안에서는 짧은 이름을 쓰고, 보낼 때만 tc_로 바꿔 담는다. */

const INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm";
const SERVER_FORMAT = 'yyyy-MM-dd HH:mm:ss';

/** 서버가 준 'yyyy-MM-dd HH:mm:ss' → datetime-local 칸이 받는 형식 */
function toInputValue(serverTime) {
  if (!serverTime) return format(new Date(), INPUT_FORMAT);
  // 공백을 T로 바꾸고 초를 잘라낸다. Date로 한 번 굽지 않는 이유는
  // 브라우저마다 공백 형식 해석이 달라 하루씩 밀리는 경우가 있어서다.
  return String(serverTime).replace(' ', 'T').slice(0, 16);
}

/** datetime-local 칸 값 → 서버가 받는 'yyyy-MM-dd HH:mm:ss' (초는 00으로) */
function toServerValue(inputValue) {
  return `${inputValue.replace('T', ' ')}:00`;
}

/**
 * @param memo      고칠 메모. 없으면 추가 모드.
 * @param defaultTime 추가 모드에서 시각 칸의 기본값(Date). 없으면 지금.
 * @param onClose   닫기 — 취소·성공 후 모두 이걸로 닫는다
 * @param onSaved   추가·수정·삭제가 끝난 뒤 호출. 목록을 다시 부르는 쪽에서 쓴다.
 */
export default function TrendMemoModal({ memo, defaultTime, onClose, onSaved }) {
  const editing = Boolean(memo?.tcCnt);

  const [form, setForm] = useState(() => ({
    memoTime: editing
      ? toInputValue(memo.tcRegtime)
      : format(defaultTime ?? new Date(), INPUT_FORMAT),
    title: memo?.tcName ?? '',
    content: memo?.tcDesc ?? '',
  }));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* ESC로 닫기. 저장 중에는 무시한다 — 응답을 기다리는 중에 창이 사라지면 결과를 알 수 없다.
     지우기 확인이 떠 있으면 ESC가 그것만 먼저 거둔다. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || submitting) return;
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
    if (!form.memoTime) return '시각을 입력해주세요.';
    if (!form.title.trim()) return '제목을 입력해주세요.';
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
      run(updateTrendMemo({ ...payload, tcCnt: memo.tcCnt }), '메모를 수정하지 못했습니다.');
    } else {
      run(insertTrendMemo(payload), '메모를 저장하지 못했습니다.');
    }
  };

  const handleDelete = () => {
    run(deleteTrendMemo(memo.tcCnt), '메모를 삭제하지 못했습니다.');
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
        <div className="hmi-umodal-title">{editing ? '메모 수정' : '메모 추가'}</div>

        <div className="hmi-umodal-body">
          <div className="hmi-umodal-row">
            <label htmlFor="tm-time">시각</label>
            <input
              id="tm-time"
              className="hmi-umodal-input"
              type="datetime-local"
              value={form.memoTime}
              onChange={setField('memoTime')}
            />
          </div>

          <div className="hmi-umodal-row">
            {/* 10자에서 입력이 그냥 멈추면 고장인 줄 안다. 남은 자릿수를 보여 준다. */}
            <label htmlFor="tm-title">
              제목 <span className="tm-count">{`${form.title.length}/${TITLE_MAX}`}</span>
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
              내용 <span className="tm-count">{`${form.content.length}/${CONTENT_MAX}`}</span>
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
            <div className="hmi-umodal-hint">{`${memo.tcUserName} 작성`}</div>
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
              삭제
            </button>
          )}
          {editing && confirmDelete && (
            <>
              <span className="tm-confirm">지울까요?</span>
              <button
                type="button"
                className="hmi-btn tm-del"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? '삭제 중...' : '네'}
              </button>
              <button
                type="button"
                className="hmi-btn"
                onClick={() => setConfirmDelete(false)}
                disabled={submitting}
              >
                아니요
              </button>
            </>
          )}

          {!confirmDelete && (
            <>
              <button type="submit" className="hmi-btn is-primary" disabled={submitting}>
                {submitting ? '저장 중...' : '저장'}
              </button>
              <button type="button" className="hmi-btn" onClick={onClose} disabled={submitting}>
                취소
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
