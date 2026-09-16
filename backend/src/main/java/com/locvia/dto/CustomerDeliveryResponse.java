package com.locvia.dto;

import com.locvia.entity.DeliveryStatus;

import java.time.LocalDateTime;

/**
 * Customer-facing delivery tracking DTO with sensitive partner information strictly masked.
 */
public class CustomerDeliveryResponse {

    private Long deliveryId;
    private Long orderId;
    private DeliveryStatus status;
    private LocalDateTime assignedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    private String deliveryPartnerName;

    public CustomerDeliveryResponse() {
    }

    public CustomerDeliveryResponse(Long deliveryId, Long orderId, DeliveryStatus status,
                                    LocalDateTime assignedAt, LocalDateTime pickedUpAt, LocalDateTime deliveredAt,
                                    String deliveryPartnerName) {
        this.deliveryId = deliveryId;
        this.orderId = orderId;
        this.status = status;
        this.assignedAt = assignedAt;
        this.pickedUpAt = pickedUpAt;
        this.deliveredAt = deliveredAt;
        this.deliveryPartnerName = deliveryPartnerName;
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

    public LocalDateTime getPickedUpAt() {
        return pickedUpAt;
    }

    public void setPickedUpAt(LocalDateTime pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public String getDeliveryPartnerName() {
        return deliveryPartnerName;
    }

    public void setDeliveryPartnerName(String deliveryPartnerName) {
        this.deliveryPartnerName = deliveryPartnerName;
    }
}
