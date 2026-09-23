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
}
