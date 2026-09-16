package com.locvia.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request payload for administrative assignment of an order to a delivery partner.
 */
public class CreateDeliveryRequest {

    @NotNull(message = "Order ID is required")
    @Positive(message = "Order ID must be a positive number")
    private Long orderId;

    @NotNull(message = "Delivery partner ID is required")
    @Positive(message = "Delivery partner ID must be a positive number")
    private Long deliveryPartnerId;

    public CreateDeliveryRequest() {
    }

    public CreateDeliveryRequest(Long orderId, Long deliveryPartnerId) {
        this.orderId = orderId;
        this.deliveryPartnerId = deliveryPartnerId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getDeliveryPartnerId() {
        return deliveryPartnerId;
    }

    public void setDeliveryPartnerId(Long deliveryPartnerId) {
        this.deliveryPartnerId = deliveryPartnerId;
    }
}
