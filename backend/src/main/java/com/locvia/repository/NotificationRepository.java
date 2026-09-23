package com.locvia.repository;

import com.locvia.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for platform notifications.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Retrieves all notifications across the platform, newest first.
     */
    List<Notification> findAllByOrderByCreatedAtDesc();

    /**
     * Retrieves all notifications for a specific recipient user, newest first.
     */
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId);

    /**
     * Retrieves all notifications for a specific recipient user.
     */
    List<Notification> findByRecipientUserId(Long recipientUserId);

    /**
     * Deletes all notifications for a specific recipient user.
     */
    void deleteByRecipientUserId(Long recipientUserId);

    /**
     * Retrieves all notifications linked to a specific order.
     */
    List<Notification> findByOrderId(Long orderId);

    /**
     * Retrieves all notifications linked to a specific shop.
     */
    List<Notification> findByShopId(Long shopId);

    /**
     * Retrieves all notifications linked to a specific delivery.
     */
    List<Notification> findByDeliveryId(Long deliveryId);
}
