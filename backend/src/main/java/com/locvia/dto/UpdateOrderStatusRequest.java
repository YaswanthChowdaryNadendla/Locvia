package com.locvia.dto;

import com.locvia.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for administrators updating the operational status of an order.
 */
public class UpdateOrderStatusRequest {

    @NotNull(message = "Order status is required")
    private OrderStatus status;

    public UpdateOrderStatusRequest() {
    }

    public UpdateOrderStatusRequest(OrderStatus status) {
        this.status = status;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}
