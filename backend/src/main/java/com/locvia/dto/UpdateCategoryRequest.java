package com.locvia.dto;

import jakarta.validation.constraints.Size;

/**
 * Request payload for updating an existing Category (Admin only).
 */
public record UpdateCategoryRequest(
        @Size(max = 100, message = "Category name must not exceed 100 characters")
        String name,

        @Size(max = 500, message = "Image URL must not exceed 500 characters")
        String imageUrl,

        @Size(max = 255, message = "Description must not exceed 255 characters")
        String description,

        Boolean active
) {
}
