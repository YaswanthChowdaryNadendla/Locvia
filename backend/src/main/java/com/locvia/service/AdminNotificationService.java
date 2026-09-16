package com.locvia.service;

import com.locvia.dto.AdminNotificationResponse;
import com.locvia.entity.Notification;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling platform notification inspection and administrative oversight.
 */
@Service
public class AdminNotificationService {

    private final NotificationRepository notificationRepository;

    public AdminNotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Lists all platform notifications ordered newest first.
     */
    @Transactional(readOnly = true)
    public List<AdminNotificationResponse> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Retrieves a specific notification by ID.
     */
    @Transactional(readOnly = true)
    public AdminNotificationResponse getNotificationById(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        return mapToResponse(notification);
    }

    private AdminNotificationResponse mapToResponse(Notification n) {
        return new AdminNotificationResponse(
                n.getId(),
                n.getRecipientUser() != null ? n.getRecipientUser().getId() : null,
                n.getRecipientUser() != null ? n.getRecipientUser().getName() : null,
                n.getRecipientRole(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getOrder() != null ? n.getOrder().getId() : null,
                n.getShop() != null ? n.getShop().getId() : null,
                n.getDelivery() != null ? n.getDelivery().getId() : null,
                n.getRead(),
                n.getCreatedAt()
        );
    }
}
