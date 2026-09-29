package com.locvia.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload for submitting a new customer product review.
 */
public class CreateReviewRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5 stars")
    @Max(value = 5, message = "Rating must be between 1 and 5 stars")
    private Integer rating;

    @NotBlank(message = "Review comment is required")
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String comment;

    private Long orderId;

    public CreateReviewRequest() {
    }

    public CreateReviewRequest(Long productId, Integer rating, String comment) {
        this.productId = productId;
        this.rating = rating;
        this.comment = comment;
    }

    public CreateReviewRequest(Long productId, Integer rating, String comment, Long orderId) {
        this.productId = productId;
        this.rating = rating;
        this.comment = comment;
        this.orderId = orderId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
}
