import axiosInstance from '../axiosInstance';

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
