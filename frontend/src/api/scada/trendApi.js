import axiosInstance from '../axiosInstance';
import i18n from '../../i18n';

/* ===========================================================================
   트랜드 — ez_scada.tb_temp_snapshot 조회.

   실시간 값(1초 폴링)과 다른 경로다. C#의 TempMonitorService가 30초마다 PLC를 읽어
   스냅샷 한 행씩 DB에 적재하고, 여기서는 그 이력을 자바를 거쳐 조회한다.
   =========================================================================== */

/**
 * 기간 조회. 응답 한 행이 스냅샷 한 시점이다.
 *   { recordTime, zone1Pv ~ zone7Pv, o2Pv }
 *
 * 응답은 ApiResponse 형태({ success, code, message, data })라 호출부에서 res.data로 꺼낸다.
 *
 * @param params { startTime, endTime } — 'yyyy-MM-dd HH:mm:ss'
 */
export function getTrend(params) {
  return axiosInstance.get('/api/scada/getTrend', { params }).then((res) => res.data);
}

/**
 * 선마다의 y축 범위 — ez_scada.tb_temp_tag의 trend_min / trend_max.
 *   [{ tempId, colName, trendMin, trendMax }]  (colName은 'zone1_pv'처럼 스냅샷 컬럼 이름)
 * 범위가 NULL이면 그 선은 단위별 기본 범위로 그린다(TrendPage의 AXIS_RANGE).
 *
 * @param autoPoll true면 타이머가 되부르는 조회라고 알린다 — 접근 로그 파일에 남지 않는다
 */
export function getTrendRangeList({ autoPoll = false } = {}) {
  return axiosInstance
    .get('/api/scada/getTrendRangeList', { params: autoPoll ? { autoPoll: 1 } : undefined })
    .then((res) => res.data);
}

/**
 * 범위 한 줄 수정. min/max를 둘 다 null로 보내면 기본 범위로 되돌린다(DB NULL).
 * 서버가 정수인지, 최소 < 최대인지 검사한다.
 *
 * 바뀐 행이 없으면(없는 tempId) 서버가 오류 대신 data:false를 준다 — 그것도 실패로 던진다.
 */
export function updateTrendRange(tempId, trendMin, trendMax) {
  return axiosInstance
    .post('/api/scada/updateTrendRange', {
      tempId: String(tempId),
      trendMin: trendMin == null ? null : String(trendMin),
      trendMax: trendMax == null ? null : String(trendMax),
    })
    .then((res) => {
      const body = res.data ?? {};
      if (!body.success || body.data !== true) {
        throw new Error(body.message || i18n.t('api.rangeSaveFailed'));
      }
      return body;
    });
}
