package com.mes.common.exception;

public enum ErrorCode {

    INVALID_PARAMETER("COMMON_400", "잘못된 요청 파라미터입니다."),
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
