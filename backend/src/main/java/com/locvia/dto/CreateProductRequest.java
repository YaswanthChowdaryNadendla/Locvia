package com.locvia.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request payload for creating a product within an authenticated shop owner's store.
 * The shopId is provided via path variable and verified against JWT caller ownership.
 */
public record CreateProductRequest(
        @NotNull(message = "Category ID is required")
        Long categoryId,

        @NotBlank(message = "Product name is required")
        @Size(max = 200, message = "Product name must not exceed 200 characters")
        String name,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        BigDecimal price,

        @DecimalMin(value = "0.00", message = "Discount price cannot be negative")
        BigDecimal discountPrice,

        @NotBlank(message = "Unit is required")
        @Size(max = 50, message = "Unit must not exceed 50 characters")
        String unit,

        @Size(max = 500, message = "Image URL must not exceed 500 characters")
        String imageUrl
) {
}
