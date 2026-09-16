package com.locvia.repository;

import com.locvia.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for individual cart items within customer shopping carts.
 */
@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /**
     * Finds all items associated with the specified cart ID.
     */
    List<CartItem> findByCartId(Long cartId);

    /**
     * Finds all items in a cart in chronological order of addition.
     */
    List<CartItem> findByCartIdOrderByCreatedAtAsc(Long cartId);

    /**
     * Finds a specific product entry inside a given cart.
     */
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    /**
     * Clears all items from the specified cart.
     */
    void deleteByCartId(Long cartId);

    /**
     * Counts the total distinct item entries in a cart.
     */
    long countByCartId(Long cartId);
}
