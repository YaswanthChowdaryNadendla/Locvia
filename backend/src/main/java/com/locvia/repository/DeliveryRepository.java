package com.locvia.repository;

import com.locvia.entity.Delivery;
import com.locvia.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for delivery records and partner dispatches.
 */
@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    /**
     * Finds the delivery record associated with an order.
     */
    Optional<Delivery> findByOrderId(Long orderId);

    /**
     * Checks if a delivery record exists for an order.
     */
    boolean existsByOrderId(Long orderId);

    /**
     * Checks if an active (non-cancelled) delivery already exists for an order.
     */
    boolean existsByOrderIdAndStatusNot(Long orderId, DeliveryStatus status);

    /**
     * Finds all deliveries assigned to a specific delivery partner.
     */
    List<Delivery> findByDeliveryPartnerId(Long deliveryPartnerId);

    /**
     * Finds deliveries assigned to a partner with a specific status, newest assignments first.
     */
    List<Delivery> findByDeliveryPartnerIdAndStatusOrderByAssignedAtDesc(Long deliveryPartnerId, DeliveryStatus status);

    /**
     * Finds active deliveries for a partner across multiple statuses, newest updates first.
     */
    List<Delivery> findByDeliveryPartnerIdAndStatusInOrderByUpdatedAtDesc(Long deliveryPartnerId, Collection<DeliveryStatus> statuses);

    /**
     * Finds completed deliveries for a partner, newest delivered first.
     */
    List<Delivery> findByDeliveryPartnerIdAndStatusOrderByDeliveredAtDesc(Long deliveryPartnerId, DeliveryStatus status);

    /**
     * Finds all deliveries across the platform for administrative oversight, newest first.
     */
    List<Delivery> findAllByOrderByCreatedAtDesc();

    /**
     * Counts deliveries having any of the specified statuses.
     */
    long countByStatusIn(Collection<DeliveryStatus> statuses);

    /**
     * Finds deliveries matching optional administrative filters (status, deliveryPartnerId, orderId).
     */
    @org.springframework.data.jpa.repository.Query("SELECT d FROM Delivery d WHERE " +
           "(:status IS NULL OR d.status = :status) " +
           "AND (:partnerId IS NULL OR d.deliveryPartner.id = :partnerId) " +
           "AND (:orderId IS NULL OR d.order.id = :orderId) " +
           "ORDER BY d.createdAt DESC")
    List<Delivery> findAdminDeliveriesWithFilters(
            @org.springframework.data.repository.query.Param("status") DeliveryStatus status,
            @org.springframework.data.repository.query.Param("partnerId") Long partnerId,
            @org.springframework.data.repository.query.Param("orderId") Long orderId
    );
}
