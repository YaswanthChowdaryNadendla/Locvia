package com.locvia.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
        Integer stockQuantity,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public ProductResponse(
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
        this(id, shopId, shopName, categoryId, categoryName, name, description, price, discountPrice, imageUrl, unit, active, 0, createdAt, updatedAt);
    }

    @JsonProperty("stock")
    public Integer getStock() {
        return stockQuantity != null ? stockQuantity : 0;
    }

    @JsonProperty("image")
    public String getImage() {
        return imageUrl;
    }

    /**
     * Converts a Product entity into a clean, safe ProductResponse DTO.
     *
     * @param product the Product entity to map
     * @return ProductResponse DTO, or null if product is null
     */
    public static ProductResponse fromEntity(Product product) {
        return fromEntity(product, null);
    }

    /**
     * Converts a Product entity into a clean, safe ProductResponse DTO with explicit inventory stock.
     *
     * @param product the Product entity to map
     * @param inventoryQuantity optional explicit inventory quantity
     * @return ProductResponse DTO, or null if product is null
     */
    public static ProductResponse fromEntity(Product product, Integer inventoryQuantity) {
        if (product == null) {
            return null;
        }

        Long shopId = product.getShop() != null ? product.getShop().getId() : null;
        String shopName = product.getShop() != null ? product.getShop().getName() : null;
        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;

        Integer effectiveStock = inventoryQuantity != null
                ? inventoryQuantity
                : (product.getStock() != null ? product.getStock() : 0);

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
                effectiveStock,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
