package com.locvia.repository;

import com.locvia.entity.Cart;
import com.locvia.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for customer shopping carts.
 */
@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    /**
     * Retrieves the shopping cart assigned to a specific customer.
     */
    Optional<Cart> findByUserId(Long userId);

    /**
     * Retrieves the shopping cart assigned to a specific user entity.
     */
    Optional<Cart> findByUser(User user);

    /**
     * Checks if a cart already exists for the given user ID.
     */
    boolean existsByUserId(Long userId);
}
