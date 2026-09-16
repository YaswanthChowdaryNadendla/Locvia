package com.locvia.repository;

import com.locvia.entity.Payment;
import com.locvia.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for order payment records.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * Finds the payment associated with a specific order ID.
     */
    Optional<Payment> findByOrderId(Long orderId);

    /**
     * Finds a payment associated with an order having a specific status (e.g. PAID).
     */
    Optional<Payment> findByOrderIdAndStatus(Long orderId, PaymentStatus status);

    /**
     * Checks if a payment with a specific status already exists for an order.
     */
    boolean existsByOrderIdAndStatus(Long orderId, PaymentStatus status);

    /**
     * Retrieves all payments for orders placed by a specific customer, newest first.
     */
    List<Payment> findByOrderUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Finds a payment by ID ensuring customer ownership via order.user.id.
     */
    Optional<Payment> findByIdAndOrderUserId(Long id, Long userId);

    /**
     * Retrieves all payments for administrative platform oversight, newest first.
     */
    List<Payment> findAllByOrderByCreatedAtDesc();

    /**
     * Counts payments having a specific status.
     */
    long countByStatus(PaymentStatus status);

    /**
     * Calculates the sum of all successful payments (status = PAID).
     */
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = com.locvia.entity.PaymentStatus.PAID")
    java.math.BigDecimal sumTotalRevenue();

    /**
     * Finds payments matching optional administrative filters (status, provider, orderId, customerId).
     */
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payment p WHERE " +
           "(:status IS NULL OR p.status = :status) " +
           "AND (:provider IS NULL OR LOWER(p.provider) = LOWER(:provider)) " +
           "AND (:orderId IS NULL OR p.order.id = :orderId) " +
           "AND (:userId IS NULL OR p.order.user.id = :userId) " +
           "ORDER BY p.createdAt DESC")
    List<Payment> findAdminPaymentsWithFilters(
            @org.springframework.data.repository.query.Param("status") PaymentStatus status,
            @org.springframework.data.repository.query.Param("provider") String provider,
            @org.springframework.data.repository.query.Param("orderId") Long orderId,
            @org.springframework.data.repository.query.Param("userId") Long userId
    );
}
