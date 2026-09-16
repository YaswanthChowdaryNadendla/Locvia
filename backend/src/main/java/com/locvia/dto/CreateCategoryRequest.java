package com.locvia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating a new Category (Admin only).
 */
public record CreateCategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(max = 100, message = "Category name must not exceed 100 characters")
        String name,

        @Size(max = 500, message = "Image URL must not exceed 500 characters")
        String imageUrl,

        @Size(max = 255, message = "Description must not exceed 255 characters")
        String description
) {
}
