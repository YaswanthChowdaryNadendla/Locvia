package com.locvia.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception representing business rule violations and conflict states.
 * Typically mapped to HTTP 409 Conflict (e.g. invalid status transitions,
 * insufficient stock, duplicate operations) or HTTP 400 Bad Request.
 */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(String message) {
        super(message);
        this.status = HttpStatus.CONFLICT;
    }

    public BusinessException(String message, HttpStatus status) {
        super(message);
        this.status = status != null ? status : HttpStatus.CONFLICT;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
