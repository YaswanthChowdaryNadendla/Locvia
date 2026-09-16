package com.locvia.dto;

import com.locvia.entity.DeliveryStatus;

import java.time.LocalDateTime;

/**
 * Summary DTO for delivery partner request lists and active dashboard feeds.
 */
public class DeliverySummaryResponse {

    private Long deliveryId;
    private Long orderId;
    private DeliveryStatus status;
    private LocalDateTime assignedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DeliverySummaryResponse() {
    }

    public DeliverySummaryResponse(Long deliveryId, Long orderId, DeliveryStatus status,
                                   LocalDateTime assignedAt, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.deliveryId = deliveryId;
        this.orderId = orderId;
        this.status = status;
        this.assignedAt = assignedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(Long deliveryId) {
        this.deliveryId = deliveryId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(DeliveryStatus status) {
        this.status = status;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
