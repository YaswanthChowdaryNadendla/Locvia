package com.locvia.dto;

import com.locvia.entity.Category;

import java.time.LocalDateTime;

/**
 * Safe, immutable data transfer object representing a category.
 * Excludes products and internal JPA proxies.
 */
public record CategoryResponse(
        Long id,
        String name,
        String imageUrl,
        String description,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    /**
     * Converts a Category entity into a clean, safe CategoryResponse DTO.
     *
     * @param category the entity to map
     * @return safe CategoryResponse DTO, or null if category is null
     */
    public static CategoryResponse fromEntity(Category category) {
        if (category == null) {
            return null;
        }

        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getImageUrl(),
                category.getDescription(),
                category.getActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
