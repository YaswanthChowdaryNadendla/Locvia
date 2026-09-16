package com.locvia.exception;

/**
 * Exception thrown when registration attempts to use an email that is already registered.
 */
public class EmailAlreadyExistsException extends DuplicateResourceException {

    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
