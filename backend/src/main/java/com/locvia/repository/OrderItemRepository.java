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

    /**
     * Retrieves all order items referencing a specific product.
     */
    List<OrderItem> findByProductId(Long productId);

    /**
     * Deletes all items belonging to a specific order.
     */
    void deleteByOrderId(Long orderId);

    /**
     * Finds delivered order items for a specific customer and product.
     */
    @org.springframework.data.jpa.repository.Query("SELECT oi FROM OrderItem oi WHERE oi.order.user.id = :userId AND oi.product.id = :productId AND oi.order.status = :status ORDER BY oi.order.createdAt DESC")
    List<OrderItem> findDeliveredOrderItems(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("productId") Long productId,
            @org.springframework.data.repository.query.Param("status") com.locvia.entity.OrderStatus status
    );

    /**
     * Finds any order items for a specific customer and product regardless of order status.
     */
    @org.springframework.data.jpa.repository.Query("SELECT oi FROM OrderItem oi WHERE oi.order.user.id = :userId AND oi.product.id = :productId ORDER BY oi.order.createdAt DESC")
    List<OrderItem> findAllOrderItemsForCustomerAndProduct(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("productId") Long productId
    );
}
