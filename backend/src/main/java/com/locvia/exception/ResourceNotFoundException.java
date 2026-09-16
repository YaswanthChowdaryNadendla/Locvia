package com.locvia.exception;

/**
 * Exception thrown when a requested resource is not found.
 * Mapped to HTTP 404 Not Found.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
