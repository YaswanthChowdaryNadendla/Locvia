package com.locvia.exception;

/**
 * Exception thrown when attempting to create duplicate inventory for a product
 * that already has an existing inventory record.
 */
public class InventoryAlreadyExistsException extends DuplicateResourceException {

    public InventoryAlreadyExistsException(String message) {
        super(message);
    }
}
