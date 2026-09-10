package com.mes.common.exception;

public enum ErrorCode {

    INVALID_PARAMETER("COMMON_400", "잘못된 요청 파라미터입니다."),
    /* 세션이 없거나 만료됨. 프론트엔드가 이 코드를 보고 저장해 둔 로그인 정보를 비우고
       로그인 화면으로 보낸다 — 메시지 문자열로 판단하면 문구를 바꿀 때 조용히 깨진다. */
    UNAUTHORIZED("COMMON_401", "로그인이 필요합니다."),
    NOT_FOUND("COMMON_404", "요청한 자원을 찾을 수 없습니다."),
    INTERNAL_SERVER_ERROR("COMMON_500", "서버 내부 오류가 발생했습니다.");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
