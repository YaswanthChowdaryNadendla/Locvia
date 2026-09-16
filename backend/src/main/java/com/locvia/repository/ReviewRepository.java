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
}
