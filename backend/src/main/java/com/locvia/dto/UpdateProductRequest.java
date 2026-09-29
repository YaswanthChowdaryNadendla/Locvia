package com.locvia.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request payload for updating an existing product.
 * Shop and owner cannot be altered.
 */
public record UpdateProductRequest(
        @Size(max = 200, message = "Product name must not exceed 200 characters")
        String name,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        BigDecimal price,

        @DecimalMin(value = "0.00", message = "Discount price cannot be negative")
        BigDecimal discountPrice,

        @Size(max = 50, message = "Unit must not exceed 50 characters")
        String unit,

        Long categoryId,

        @Size(max = 500, message = "Image URL must not exceed 500 characters")
        String imageUrl,

        @Size(max = 255, message = "Image public ID must not exceed 255 characters")
        String imagePublicId,

        Boolean active,

        @Min(value = 0, message = "Stock quantity cannot be negative")
        Integer stockQuantity,

        Integer stock
) {
    @JsonCreator
    public UpdateProductRequest(
            @JsonProperty("name") String name,
            @JsonProperty("description") String description,
            @JsonProperty("price") BigDecimal price,
            @JsonProperty("discountPrice") BigDecimal discountPrice,
            @JsonProperty("unit") String unit,
            @JsonProperty("categoryId") Long categoryId,
            @JsonProperty("imageUrl") String imageUrl,
            @JsonProperty("imagePublicId") String imagePublicId,
            @JsonProperty("active") Boolean active,
            @JsonProperty("stockQuantity") Integer stockQuantity,
            @JsonProperty("stock") Integer stock) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.discountPrice = discountPrice;
        this.unit = unit;
        this.categoryId = categoryId;
        this.imageUrl = imageUrl;
        this.imagePublicId = imagePublicId;
        this.active = active;
        this.stockQuantity = stockQuantity != null ? stockQuantity : stock;
        this.stock = this.stockQuantity;
    }

    public UpdateProductRequest(String name, String description, BigDecimal price, BigDecimal discountPrice, String unit, Long categoryId, String imageUrl, Boolean active) {
        this(name, description, price, discountPrice, unit, categoryId, imageUrl, null, active, null, null);
    }

    public UpdateProductRequest(String name, String description, BigDecimal price, BigDecimal discountPrice, String unit, Long categoryId, String imageUrl, Boolean active, Integer stockQuantity, Integer stock) {
        this(name, description, price, discountPrice, unit, categoryId, imageUrl, null, active, stockQuantity, stock);
    }

    public Integer resolvedStock() {
        return stockQuantity != null ? stockQuantity : stock;
    }
}
