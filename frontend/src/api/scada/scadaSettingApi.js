import axiosInstance from '../axiosInstance';

/* ===========================================================================
   웹 설정값 — global_dreamsteel.scada_setting (setting_key / setting_value 한 줄씩)

   PLC 값이 아니라 화면이 쓰는 값이다(예: hold_ms = 버튼을 눌러야 하는 시간).
   그래서 C#이 아니라 자바를 부르고, scada_log에도 남기지 않는다.
   =========================================================================== */

/**
 * 설정 전체 — [{ settingKey, settingValue, updateUser, updateDate }]
 *
 * @param autoPoll true면 타이머가 되부르는 조회라고 알린다 — 접근 로그 파일에 남지 않는다
 *                 (ControllerLogAspect의 AUTO_POLL_PARAM)
 */
export function getSettingList({ autoPoll = false } = {}) {
  return axiosInstance
    .get('/api/scada/getSettingList', { params: autoPoll ? { autoPoll: 1 } : undefined })
    .then((res) => res.data);
}

/**
 * 설정 한 줄 수정. 고친 사람은 서버가 세션에서 채운다.
 *
 * 없는 키면 서버가 오류 대신 success(false)를 준다(바뀐 행이 0) — 그것도 실패로 던진다.
 * 성공으로 넘기면 화면은 바뀐 줄 아는데 DB는 그대로인 상태가 된다.
 */
export function updateSetting(settingKey, settingValue) {
  return axiosInstance
    .post('/api/scada/updateSetting', { settingKey, settingValue: String(settingValue) })
    .then((res) => {
      const body = res.data ?? {};
      if (!body.success || body.data !== true) {
        throw new Error(body.message || `설정(${settingKey})을 저장하지 못했습니다.`);
      }
      return body;
    });
}
