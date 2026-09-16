package com.locvia.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for updating an existing inventory record's quantity and threshold.
 */
public record UpdateInventoryRequest(
        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity cannot be negative")
        Integer quantity,

        @NotNull(message = "Low stock threshold is required")
        @Min(value = 0, message = "Low stock threshold cannot be negative")
        Integer lowStockThreshold
) {
}
