package com.locvia.dto;

import java.util.List;

/**
 * Composite DTO containing product reviews and rating summary metrics.
 */
public class ProductReviewsResponse {

    private List<ReviewResponse> reviews;
    private ReviewSummaryResponse summary;

    public ProductReviewsResponse() {
    }

    public ProductReviewsResponse(List<ReviewResponse> reviews, ReviewSummaryResponse summary) {
        this.reviews = reviews;
        this.summary = summary;
    }

    public List<ReviewResponse> getReviews() {
        return reviews;
    }

    public void setReviews(List<ReviewResponse> reviews) {
        this.reviews = reviews;
    }

    public ReviewSummaryResponse getSummary() {
        return summary;
    }

    public void setSummary(ReviewSummaryResponse summary) {
        this.summary = summary;
    }
}
