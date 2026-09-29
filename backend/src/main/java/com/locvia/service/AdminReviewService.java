package com.locvia.service;

import com.locvia.dto.AdminReviewResponse;
import com.locvia.entity.Review;
import com.locvia.entity.Shop;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.ReviewRepository;
import com.locvia.repository.ShopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling customer review moderation and inspection for administrators.
 */
@Service
public class AdminReviewService {

    private final ReviewRepository reviewRepository;
    private final ShopRepository shopRepository;

    public AdminReviewService(ReviewRepository reviewRepository, ShopRepository shopRepository) {
        this.reviewRepository = reviewRepository;
        this.shopRepository = shopRepository;
    }

    /**
     * Lists all platform reviews, newest first.
     */
    @Transactional(readOnly = true)
    public List<AdminReviewResponse> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Retrieves a single review by its ID.
     */
    @Transactional(readOnly = true)
    public AdminReviewResponse getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
        return mapToResponse(review);
    }

    /**
     * Moderates and deletes an inappropriate review by ID.
     */
    @Transactional
    public void deleteReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
        Shop shop = review.getShop();
        reviewRepository.delete(review);
        if (shop != null) {
            Double avg = reviewRepository.getAverageRatingForShop(shop.getId());
            shop.setRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            shopRepository.save(shop);
        }
    }

    /**
     * Resets and deletes all reviews across the platform and resets shop ratings.
     */
    @Transactional
    public void deleteAllReviews() {
        reviewRepository.deleteAll();
        shopRepository.findAll().forEach(s -> {
            s.setRating(0.0);
            shopRepository.save(s);
        });
    }

    private AdminReviewResponse mapToResponse(Review review) {
        return new AdminReviewResponse(
                review.getId(),
                review.getUser() != null ? review.getUser().getId() : null,
                review.getUser() != null ? review.getUser().getName() : null,
                review.getProduct() != null ? review.getProduct().getId() : null,
                review.getProduct() != null ? review.getProduct().getName() : null,
                review.getShop() != null ? review.getShop().getId() : null,
                review.getShop() != null ? review.getShop().getName() : null,
                review.getOrder() != null ? review.getOrder().getId() : null,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
