package com.locvia.exception;

/**
 * Exception thrown when attempting to create or rename a category with a name
 * that already exists in the system (case-insensitively).
 */
public class CategoryAlreadyExistsException extends DuplicateResourceException {

    public CategoryAlreadyExistsException(String message) {
        super(message);
    }
}
