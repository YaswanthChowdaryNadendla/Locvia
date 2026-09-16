package com.locvia.dto;

import com.locvia.entity.Product;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Immutable data transfer object representing product details.
 * Completely decouples JPA proxies, circular references, and internal entity state.
 */
public record ProductResponse(
        Long id,
        Long shopId,
        String shopName,
        Long categoryId,
        String categoryName,
        String name,
        String description,
        BigDecimal price,
        BigDecimal discountPrice,
        String imageUrl,
        String unit,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    /**
     * Converts a Product entity into a clean, safe ProductResponse DTO.
     *
     * @param product the Product entity to map
     * @return ProductResponse DTO, or null if product is null
     */
    public static ProductResponse fromEntity(Product product) {
        if (product == null) {
            return null;
        }

        Long shopId = product.getShop() != null ? product.getShop().getId() : null;
        String shopName = product.getShop() != null ? product.getShop().getName() : null;
        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;

        return new ProductResponse(
                product.getId(),
                shopId,
                shopName,
                categoryId,
                categoryName,
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getDiscountPrice(),
                product.getImageUrl(),
                product.getUnit(),
                product.getActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
