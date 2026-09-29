package com.locvia.controller;

import com.locvia.dto.CreateReviewRequest;
import com.locvia.dto.ProductReviewsResponse;
import com.locvia.dto.ReviewEligibilityResponse;
import com.locvia.dto.ReviewResponse;
import com.locvia.dto.UpdateReviewRequest;
import com.locvia.security.CustomUserDetails;
import com.locvia.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for customer product reviews, ratings, and purchase eligibility.
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * Public endpoint: retrieve all reviews and rating aggregates for a product.
     * GET /api/reviews/product/{productId} or GET /api/reviews/products/{productId}
     */
    @GetMapping({"/product/{productId:[0-9]+}", "/products/{productId:[0-9]+}"})
    public ResponseEntity<ProductReviewsResponse> getProductReviews(@PathVariable Long productId) {
        ProductReviewsResponse response = reviewService.getProductReviews(productId);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve all reviews for products of a specific shop.
     * GET /api/reviews/shop/{shopId} or GET /api/reviews/shops/{shopId}
     */
    @GetMapping({"/shop/{shopId:[0-9]+}", "/shops/{shopId:[0-9]+}"})
    public ResponseEntity<List<ReviewResponse>> getShopReviews(
            @PathVariable Long shopId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        boolean isAdmin = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        List<ReviewResponse> response = reviewService.getShopReviews(shopId, email, isAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Check if the authenticated customer is eligible to write or update a review for a product.
     * GET /api/reviews/eligibility/{productId}
     */
    @GetMapping("/eligibility/{productId:[0-9]+}")
    public ResponseEntity<ReviewEligibilityResponse> checkEligibility(
            @PathVariable Long productId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(new ReviewEligibilityResponse(
                    false, false, null, null, "Please log in to review this product."
            ));
        }
        ReviewEligibilityResponse response = reviewService.checkEligibility(userDetails.getUsername(), productId);
        return ResponseEntity.ok(response);
    }

    /**
     * Submits a customer review for an eligible purchased and delivered product.
     * POST /api/reviews
     */
    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateReviewRequest request) {
        ReviewResponse response = reviewService.createReview(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Updates an existing review authored by the authenticated customer.
     * PUT /api/reviews/{id}
     */
    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<ReviewResponse> updateReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateReviewRequest request) {
        ReviewResponse response = reviewService.updateReview(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a review (customer owner or platform administrator).
     * DELETE /api/reviews/{id}
     */
    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Map<String, String>> deleteReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        reviewService.deleteReview(userDetails.getUsername(), id, isAdmin);
        return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
    }
}
