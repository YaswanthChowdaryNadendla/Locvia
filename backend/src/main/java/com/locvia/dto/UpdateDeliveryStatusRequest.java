package com.locvia.dto;

import com.locvia.entity.DeliveryStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for updating the status of an active delivery.
 */
public class UpdateDeliveryStatusRequest {

    @NotNull(message = "Status is required")
    private DeliveryStatus status;

    public UpdateDeliveryStatusRequest() {
    }

    public UpdateDeliveryStatusRequest(DeliveryStatus status) {
        this.status = status;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(DeliveryStatus status) {
        this.status = status;
    }
}
