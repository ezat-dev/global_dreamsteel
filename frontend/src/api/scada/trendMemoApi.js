import axiosInstance from '../axiosInstance';

/* ===========================================================================
   트랜드 메모 — ez_scada.tb_temp_memo.

   차트 위에 깃발로 꽂히는 한 줄짜리 기록이다. "이 시각에 무슨 일이 있었다"를
   남겨 두면, 나중에 그래프가 튄 이유를 값만 보고 추측하지 않아도 된다.

   예전부터 있던 표를 그대로 쓰기 때문에 필드 이름이 tc_로 시작한다:
     tc_cnt=PK, tc_regtime=차트에 찍힐 시각, tc_name=제목(10자),
     tc_desc=내용(100자), tc_yn='Y'면 살아 있는 메모, tc_user_*=남긴 사람.

   남긴 사람(tc_user_code/tc_user_name)은 서버가 세션에서 채운다. 프론트가
   보내지 않는다 — writeTag의 로그 기록과 같은 방식이다.
   =========================================================================== */

/**
 * 기간 조회. 차트를 조회할 때 같은 구간으로 함께 부른다.
 *   응답 한 행 { tcCnt, tcRegtime, tcName, tcDesc, tcUserCode, tcYn, tcUserName }
 *
 * @param params { startTime, endTime } — 'yyyy-MM-dd HH:mm:ss'
 */
export function getTrendMemoList(params) {
  return axiosInstance
    .get('/api/scada/getTrendMemoList', { params })
    .then((res) => res.data);
}

/** @param memo { tcRegtime, tcName, tcDesc } */
export function insertTrendMemo(memo) {
  return axiosInstance
    .post('/api/scada/insertTrendMemo', memo)
    .then((res) => res.data);
}

/** @param memo { tcCnt, tcRegtime, tcName, tcDesc } */
export function updateTrendMemo(memo) {
  return axiosInstance
    .post('/api/scada/updateTrendMemo', memo)
    .then((res) => res.data);
}

/* 지워도 행은 남는다 — 서버가 tc_yn만 'N'으로 바꾸고, 조회는 'Y'만 본다.
   @param tcCnt 지울 메모의 PK */
export function deleteTrendMemo(tcCnt) {
  return axiosInstance
    .post('/api/scada/deleteTrendMemo', { tcCnt })
    .then((res) => res.data);
}
