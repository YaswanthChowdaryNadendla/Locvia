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
}
