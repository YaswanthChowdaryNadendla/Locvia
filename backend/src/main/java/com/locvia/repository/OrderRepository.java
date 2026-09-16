package com.locvia.repository;

import com.locvia.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for customer orders.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Checks if any orders reference the given address ID, preserving historical order integrity.
     */
    boolean existsByAddressId(Long addressId);

    /**
     * Retrieves all orders placed by a specific customer, newest first.
     */
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Retrieves a single order ensuring customer ownership isolation.
     */
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    /**
     * Retrieves all orders for administrative platform oversight, newest first.
     */
    List<Order> findAllByOrderByCreatedAtDesc();

    /**
     * Counts orders with a specific order status.
     */
    long countByStatus(com.locvia.entity.OrderStatus status);

    /**
     * Finds orders matching optional administrative filters (status, paymentStatus, customerId).
     */
    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) " +
           "AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus) " +
           "AND (:userId IS NULL OR o.user.id = :userId) " +
           "ORDER BY o.createdAt DESC")
    List<Order> findAdminOrdersWithFilters(
            @org.springframework.data.repository.query.Param("status") com.locvia.entity.OrderStatus status,
            @org.springframework.data.repository.query.Param("paymentStatus") com.locvia.entity.PaymentStatus paymentStatus,
            @org.springframework.data.repository.query.Param("userId") Long userId
    );
}
