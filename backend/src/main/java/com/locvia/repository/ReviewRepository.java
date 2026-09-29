package com.locvia.repository;

import com.locvia.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for customer reviews and ratings.
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * Retrieves all reviews ordered newest first.
     */
    List<Review> findAllByOrderByCreatedAtDesc();

    /**
     * Finds reviews for a specific product.
     */
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    /**
     * Finds reviews for a specific shop.
     */
    List<Review> findByShopIdOrderByCreatedAtDesc(Long shopId);

    /**
     * Finds all reviews authored by a specific user.
     */
    List<Review> findByUserId(Long userId);

    /**
     * Deletes all reviews authored by a specific user.
     */
    void deleteByUserId(Long userId);

    /**
     * Finds all reviews associated with a specific order.
     */
    List<Review> findByOrderId(Long orderId);

    /**
     * Finds all reviews associated with a specific shop.
     */
    List<Review> findByShopId(Long shopId);

    /**
     * Finds all reviews associated with a specific product.
     */
    List<Review> findByProductId(Long productId);

    /**
     * Finds a review authored by a specific user for a specific product.
     */
    java.util.Optional<Review> findByUserIdAndProductId(Long userId, Long productId);

    /**
     * Checks if a user has already reviewed a product.
     */
    boolean existsByUserIdAndProductId(Long userId, Long productId);

    /**
     * Computes the average star rating for a product.
     */
    @org.springframework.data.jpa.repository.Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingForProduct(@org.springframework.data.repository.query.Param("productId") Long productId);

    /**
     * Computes the total number of reviews for a product.
     */
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Long countReviewsForProduct(@org.springframework.data.repository.query.Param("productId") Long productId);

    /**
     * Computes the average star rating across all products belonging to a shop.
     */
    @org.springframework.data.jpa.repository.Query("SELECT AVG(r.rating) FROM Review r WHERE r.shop.id = :shopId")
    Double getAverageRatingForShop(@org.springframework.data.repository.query.Param("shopId") Long shopId);
}
