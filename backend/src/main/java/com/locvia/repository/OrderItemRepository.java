package com.locvia.repository;

import com.locvia.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for order items snapshot persistence.
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Retrieves all items belonging to a specific order, preserving item order.
     */
    List<OrderItem> findByOrderId(Long orderId);

    /**
     * Retrieves all items belonging to a specific order ordered by ID ascending.
     */
    List<OrderItem> findByOrderIdOrderByIdAsc(Long orderId);
}
