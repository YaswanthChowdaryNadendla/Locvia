package com.locvia.dto;

import java.util.Map;

/**
 * DTO representing review summary metrics and rating distribution for a product.
 */
public class ReviewSummaryResponse {

    private Double averageRating;
    private Integer totalReviews;
    private Map<Integer, Integer> ratingDistribution;

    public ReviewSummaryResponse() {
    }

    public ReviewSummaryResponse(Double averageRating, Integer totalReviews, Map<Integer, Integer> ratingDistribution) {
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
        this.ratingDistribution = ratingDistribution;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public Map<Integer, Integer> getRatingDistribution() {
        return ratingDistribution;
    }

    public void setRatingDistribution(Map<Integer, Integer> ratingDistribution) {
        this.ratingDistribution = ratingDistribution;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("average")
    public Double getAverage() {
        return averageRating;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("total")
    public Integer getTotal() {
        return totalReviews;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("distribution")
    public Map<Integer, Integer> getDistribution() {
        return ratingDistribution;
    }
}
