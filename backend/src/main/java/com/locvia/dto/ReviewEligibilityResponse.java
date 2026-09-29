package com.locvia.dto;

/**
 * DTO indicating whether an authenticated customer is eligible to write/edit a review for a product.
 */
public class ReviewEligibilityResponse {

    private boolean eligible;
    private boolean alreadyReviewed;
    private ReviewResponse existingReview;
    private Long deliveredOrderId;
    private String message;

    public ReviewEligibilityResponse() {
    }

    public ReviewEligibilityResponse(boolean eligible, boolean alreadyReviewed, ReviewResponse existingReview, Long deliveredOrderId, String message) {
        this.eligible = eligible;
        this.alreadyReviewed = alreadyReviewed;
        this.existingReview = existingReview;
        this.deliveredOrderId = deliveredOrderId;
        this.message = message;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public boolean isAlreadyReviewed() {
        return alreadyReviewed;
    }

    public void setAlreadyReviewed(boolean alreadyReviewed) {
        this.alreadyReviewed = alreadyReviewed;
    }

    public ReviewResponse getExistingReview() {
        return existingReview;
    }

    public void setExistingReview(ReviewResponse existingReview) {
        this.existingReview = existingReview;
    }

    public Long getDeliveredOrderId() {
        return deliveredOrderId;
    }

    public void setDeliveredOrderId(Long deliveredOrderId) {
        this.deliveredOrderId = deliveredOrderId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
