package com.mes.service.scada.impl;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
import com.mes.dao.scada.ScadaDao;
import com.mes.domain.scada.ScadaAlarm;
import com.mes.domain.scada.ScadaTrend;
import com.mes.domain.scada.ScadaUser;
import com.mes.service.scada.ScadaService;

@Service
public class ScadaServiceImpl implements ScadaService {

    private static final Logger log = LoggerFactory.getLogger(ScadaServiceImpl.class);

    @Autowired
    private ScadaDao scadaDao;

    /** C#(PlcApiServer) 호출용. 타임아웃 2초로 등록되어 있다 — RestTemplateConfig 참고. */
    @Autowired
    private RestTemplate restTemplate;

    /** C# 서버 주소. application.yml의 plc-api.base-url (기본 http://localhost:5050). */
    @Value("${plc-api.base-url}")
    private String plcApiBaseUrl;

    @Override
    public ScadaUser getUser(ScadaUser param) {
        if (param == null
                || param.getUserId() == null || param.getUserId().isBlank()
                || param.getUserPassword() == null || param.getUserPassword().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "아이디와 비밀번호를 입력해주세요.");
        }

        ScadaUser user = scadaDao.getUser(param);
        if (user == null) {
            // 아이디가 없는 건지 비밀번호가 틀린 건지는 구분해서 알려주지 않는다(계정 존재 여부 노출 방지).
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "아이디 또는 비밀번호가 일치하지 않습니다.");
        }
        return user;
    }

    @Override
    public List<ScadaAlarm> getAlarmList(ScadaAlarm scadaAlarm) {
        return scadaDao.getAlarmList(scadaAlarm);
    }

    @Override
    public List<ScadaTrend> getTrend(ScadaTrend scadaTrend) {
        return scadaDao.getTrend(scadaTrend);
    }

    @Override
    public List<ScadaAlarm> getLogList(ScadaAlarm scadaAlarm) {
        return scadaDao.getLogList(scadaAlarm);
    }

    @Override
    public boolean insertUser(ScadaUser scadaUser) {
        return scadaDao.insertUser(scadaUser);
    }

    @Override
    public ScadaUser getId(ScadaUser scadaUser) {
        return scadaDao.getId(scadaUser);
    }

    @Override
    public List<ScadaUser> getUserList(ScadaUser scadaUser) {
        return scadaDao.getUserList(scadaUser);
    }

    @Override
    public boolean updateUser(ScadaUser scadaUser) {
        return scadaDao.updateUser(scadaUser);
    }

    @Override
    public List<ScadaAlarm> getAlarmTagList(ScadaAlarm scadaAlarm) {
        return scadaDao.getAlarmTagList(scadaAlarm);
    }

    /**
     * 태그에 값을 쓰고, 성공했을 때만 제어 로그를 남긴다.
     *
     * <p>
     * 쓰기와 로그를 한 메서드에 둔 이유: 컨트롤러에서 두 번 나눠 부르면 다른 화면이
     * 쓰기를 호출할 때 그 순서를 또 적어야 하고, 한 곳에서 빼먹으면 로그가 조용히 안 남는다.
     * </p>
     */
    // getForObject에 Map.class를 넘기면 제네릭이 지워진 Map으로 와서 나는 경고다.
    // C# 응답 형태가 정해져 있어(success/name/address/value) 별도 DTO를 두지 않았다.
    @SuppressWarnings("unchecked")
    @Override
    public boolean writeTag(ScadaUser scadaUser) {
        if (scadaUser == null
                || scadaUser.getFolderId() == null || scadaUser.getFolderId().isBlank()
                || scadaUser.getTagName() == null || scadaUser.getTagName().isBlank()
                || scadaUser.getSendValue() == null || scadaUser.getSendValue().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "folderId, tagName, sendValue는 필수입니다.");
        }

        /*
         * {f}/{n}/{v} 자리에 인수가 순서대로 들어가고 URL 인코딩도 RestTemplate이 처리한다 —
         * 태그 이름을 직접 문자열로 붙이면 특수문자가 들어갔을 때 깨진다.
         */
        String url = plcApiBaseUrl + "/api/foldertag/write/by-name"
                + "?folderId={f}&name={n}&value={v}";

        /*
         * 실패해도 로그를 남겨야 하므로 여기서 바로 예외를 던지지 않는다. 사유를 변수에 모아
         * 두고, 로그를 남긴 뒤 맨 끝에서 던진다 — 그래야 성공·실패가 같은 자리에서 기록된다.
         */
        Map<String, Object> res = null;
        String failReason = null;

        try {
            res = restTemplate.getForObject(url, Map.class,
                    scadaUser.getFolderId(), scadaUser.getTagName(), scadaUser.getSendValue());
        } catch (RestClientException e) {
            // C#이 꺼져 있거나 타임아웃(2초)
            failReason = "PLC 서버에 연결할 수 없습니다. " + e.getMessage();
        }

        /*
         * C#은 실패도 HTTP 200 + success:false 로 준다(태그를 못 찾음, PLC 연결 실패 등).
         * 그래서 RestTemplate은 예외를 던지지 않는다 — 여기서 직접 확인해야 한다.
         */
        if (failReason == null && (res == null || !Boolean.TRUE.equals(res.get("success")))) {
            failReason = res == null ? "응답이 비어 있습니다." : String.valueOf(res.get("error"));
        }

        boolean ok = (failReason == null);

        /*
         * writeLog가 false인 경우는 momentary 버튼을 뗄 때 나가는 0이다 — 사람이 한 조작이
         * 아니라 누름의 자동 해제라서, 기록하면 버튼 한 번에 로그가 두 줄씩 쌓인다.
         * 실패해도 마찬가지로 남기지 않는다(사람이 시킨 조작이 아니다).
         */
        if (Boolean.TRUE.equals(scadaUser.getWriteLog())) {
            scadaUser.setWriteSuccess(ok);
            scadaUser.setAddress(ok
                    // 성공이면 주소가 C# 응답에 들어 있다(R100 등) — DB를 다시 조회할 필요가 없다
                    ? String.valueOf(res.get("address"))
                    // 실패면 응답이 없거나 주소가 빠져 있어 DB에서 찾는다
                    : findAddress(scadaUser));

            /*
             * 로그를 남기다 실패해도 PLC 쓰기 결과는 그대로 화면에 알려야 한다.
             * 여기서 터지면 "PLC는 거부했는데 화면에는 DB 오류가 뜨는" 상황이 된다.
             */
            try {
                scadaDao.insertLog(scadaUser);
            } catch (RuntimeException e) {
                log.error("scada_log 기록 실패 (tag={}, success={})", scadaUser.getTagName(), ok, e);
            }
        }

        if (!ok) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, failReason);
        }

        return true;
    }

    /**
     * 쓰기가 실패했을 때 로그에 넣을 주소를 DB에서 찾는다.
     *
     * <p>
     * 여기서 또 터지면 원래 실패 사유가 묻히므로 삼켜서 null로 둔다 — 주소가 없는 로그가
     * 주소 때문에 사라진 로그보다 낫다.
     * </p>
     */
    private String findAddress(ScadaUser scadaUser) {
        try {
            ScadaUser found = scadaDao.getTagAddress(scadaUser);
            return found == null ? null : found.getAddress();
        } catch (RuntimeException e) {
            log.warn("태그 주소 조회 실패 (folderId={}, tag={})",
                    scadaUser.getFolderId(), scadaUser.getTagName(), e);
            return null;
        }
    }

    @Override
    public List<ScadaTrend> getTrendMemoList(ScadaTrend scadaTrend) {
        return scadaDao.getTrendMemoList(scadaTrend);
    }

    @Override
    public boolean insertTrendMemo(ScadaTrend scadaTrend) {
        return scadaDao.insertTrendMemo(scadaTrend);
    }

    @Override
    public boolean updateTrendMemo(ScadaTrend scadaTrend) {
        return scadaDao.updateTrendMemo(scadaTrend);
    }

    @Override
    public boolean deleteTrendMemo(ScadaTrend scadaTrend) {
        return scadaDao.deleteTrendMemo(scadaTrend);
    }
}
