package com.locvia.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request payload for creating a Razorpay order for an existing customer order.
 * Strictly ignores any client-supplied amount or status.
 */
public class RazorpayOrderRequest {

    @NotNull(message = "Order ID is required")
    @Positive(message = "Order ID must be a positive number")
    private Long orderId;

    public RazorpayOrderRequest() {
    }

    public RazorpayOrderRequest(Long orderId) {
        this.orderId = orderId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
}
