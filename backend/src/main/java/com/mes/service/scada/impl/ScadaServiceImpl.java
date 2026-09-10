package com.mes.service.scada.impl;

import java.util.List;
import java.util.Map;

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

        /* {f}/{n}/{v} 자리에 인수가 순서대로 들어가고 URL 인코딩도 RestTemplate이 처리한다 —
           태그 이름을 직접 문자열로 붙이면 특수문자가 들어갔을 때 깨진다. */
        String url = plcApiBaseUrl + "/api/foldertag/write/by-name"
                + "?folderId={f}&name={n}&value={v}";

        Map<String, Object> res;
        try {
            res = restTemplate.getForObject(url, Map.class,
                    scadaUser.getFolderId(), scadaUser.getTagName(), scadaUser.getSendValue());
        } catch (RestClientException e) {
            // C#이 꺼져 있거나 타임아웃(2초) — 여기서 잡아 화면에 이유를 보여준다
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "PLC 서버에 연결할 수 없습니다. " + e.getMessage());
        }

        /* C#은 실패도 HTTP 200 + success:false 로 준다(태그를 못 찾음, PLC 연결 실패 등).
           그래서 RestTemplate은 예외를 던지지 않는다 — 여기서 직접 확인해야 한다.
           확인하지 않으면 쓰기가 실패했는데 아래에서 로그를 남겨, 기록을 믿을 수 없게 된다. */
        if (res == null || !Boolean.TRUE.equals(res.get("success"))) {
            String reason = res == null ? "응답이 비어 있습니다." : String.valueOf(res.get("error"));
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, reason);
        }

        /* writeLog가 false인 경우는 momentary 버튼을 뗄 때 나가는 0이다 — 사람이 한 조작이
           아니라 누름의 자동 해제라서, 기록하면 버튼 한 번에 로그가 두 줄씩 쌓인다. */
        if (Boolean.TRUE.equals(scadaUser.getWriteLog())) {
            // 주소는 C# 응답에 들어 있다(R100 등) — folders_tags를 다시 조회할 필요가 없다
            scadaUser.setAddress(String.valueOf(res.get("address")));
            scadaDao.insertLog(scadaUser);
        }

        return true;
    }
}
