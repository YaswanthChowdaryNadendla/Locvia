package com.locvia.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
        String imageUrl,

        @Size(max = 255, message = "Image public ID must not exceed 255 characters")
        String imagePublicId,

        @Min(value = 0, message = "Stock quantity cannot be negative")
        Integer stockQuantity,

        Integer stock
) {
    @JsonCreator
    public CreateProductRequest(
            @JsonProperty("categoryId") Long categoryId,
            @JsonProperty("name") String name,
            @JsonProperty("description") String description,
            @JsonProperty("price") BigDecimal price,
            @JsonProperty("discountPrice") BigDecimal discountPrice,
            @JsonProperty("unit") String unit,
            @JsonProperty("imageUrl") String imageUrl,
            @JsonProperty("imagePublicId") String imagePublicId,
            @JsonProperty("stockQuantity") Integer stockQuantity,
            @JsonProperty("stock") Integer stock) {
        this.categoryId = categoryId;
        this.name = name;
        this.description = description;
        this.price = price;
        this.discountPrice = discountPrice;
        this.unit = unit;
        this.imageUrl = imageUrl;
        this.imagePublicId = imagePublicId;
        this.stockQuantity = stockQuantity != null ? stockQuantity : (stock != null ? stock : 0);
        this.stock = this.stockQuantity;
    }

    public CreateProductRequest(Long categoryId, String name, String description, BigDecimal price, BigDecimal discountPrice, String unit, String imageUrl) {
        this(categoryId, name, description, price, discountPrice, unit, imageUrl, null, 0, 0);
    }

    public CreateProductRequest(Long categoryId, String name, String description, BigDecimal price, BigDecimal discountPrice, String unit, String imageUrl, Integer stockQuantity) {
        this(categoryId, name, description, price, discountPrice, unit, imageUrl, null, stockQuantity, stockQuantity);
    }

    public CreateProductRequest(Long categoryId, String name, String description, BigDecimal price, BigDecimal discountPrice, String unit, String imageUrl, Integer stockQuantity, Integer stock) {
        this(categoryId, name, description, price, discountPrice, unit, imageUrl, null, stockQuantity, stock);
    }

    public Integer resolvedStock() {
        return stockQuantity != null ? stockQuantity : (stock != null ? stock : 0);
    }
}
