package com.locvia.controller;

import com.locvia.dto.AdminReviewResponse;
import com.locvia.service.AdminReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for customer review moderation and administrative oversight.
 * Strictly restricted to administrators with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    public AdminReviewController(AdminReviewService adminReviewService) {
        this.adminReviewService = adminReviewService;
    }

    /**
     * Lists all customer reviews across the platform.
     * GET /api/admin/reviews
     *
     * @return list of AdminReviewResponse
     */
    @GetMapping
    public ResponseEntity<List<AdminReviewResponse>> getAllReviews() {
        List<AdminReviewResponse> reviews = adminReviewService.getAllReviews();
        return ResponseEntity.ok(reviews);
    }

    /**
     * Retrieves review details by ID.
     * GET /api/admin/reviews/{id}
     *
     * @param id target review ID
     * @return AdminReviewResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdminReviewResponse> getReviewById(@PathVariable Long id) {
        AdminReviewResponse review = adminReviewService.getReviewById(id);
        return ResponseEntity.ok(review);
    }

    /**
     * Moderates and deletes an inappropriate review by ID.
     * DELETE /api/admin/reviews/{id}
     *
     * @param id target review ID
     * @return success confirmation
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteReview(@PathVariable Long id) {
        adminReviewService.deleteReview(id);
        return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
    }
}
