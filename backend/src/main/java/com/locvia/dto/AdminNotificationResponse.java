package com.locvia.dto;

import com.locvia.entity.NotificationType;
import com.locvia.entity.UserRole;

import java.time.LocalDateTime;

/**
 * DTO for platform notifications for administrative inspection.
 */
public class AdminNotificationResponse {

    private Long id;
    private Long recipientUserId;
    private String recipientUserName;
    private UserRole recipientRole;
    private NotificationType type;
    private String title;
    private String message;
    private Long orderId;
    private Long shopId;
    private Long deliveryId;
    private Boolean read;
    private LocalDateTime createdAt;

    public AdminNotificationResponse() {
    }

    public AdminNotificationResponse(Long id, Long recipientUserId, String recipientUserName,
                                     UserRole recipientRole, NotificationType type,
                                     String title, String message, Long orderId,
                                     Long shopId, Long deliveryId, Boolean read,
                                     LocalDateTime createdAt) {
        this.id = id;
        this.recipientUserId = recipientUserId;
        this.recipientUserName = recipientUserName;
        this.recipientRole = recipientRole;
        this.type = type;
        this.title = title;
        this.message = message;
        this.orderId = orderId;
        this.shopId = shopId;
        this.deliveryId = deliveryId;
        this.read = read;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRecipientUserId() {
        return recipientUserId;
    }

    public void setRecipientUserId(Long recipientUserId) {
        this.recipientUserId = recipientUserId;
    }

    public String getRecipientUserName() {
        return recipientUserName;
    }

    public void setRecipientUserName(String recipientUserName) {
        this.recipientUserName = recipientUserName;
    }

    public UserRole getRecipientRole() {
        return recipientRole;
    }

    public void setRecipientRole(UserRole recipientRole) {
        this.recipientRole = recipientRole;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getShopId() {
        return shopId;
    }

    public void setShopId(Long shopId) {
        this.shopId = shopId;
    }

    public Long getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(Long deliveryId) {
        this.deliveryId = deliveryId;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
