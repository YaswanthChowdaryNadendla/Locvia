package com.locvia.exception;

/**
 * Exception thrown when an external third-party service (e.g. Cloudinary, Razorpay)
 * fails or is temporarily unreachable.
 * Mapped to HTTP 502 Bad Gateway.
 */
public class ExternalServiceException extends RuntimeException {

    public ExternalServiceException(String message) {
        super(message);
    }

    public ExternalServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
