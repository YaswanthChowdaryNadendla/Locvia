package com.locvia.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception representing bad request parameter or business logic violations.
 * Mapped to HTTP 400 Bad Request.
 */
public class BadRequestException extends BusinessException {

    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
