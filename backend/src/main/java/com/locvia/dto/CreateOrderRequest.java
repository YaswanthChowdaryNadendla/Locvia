package com.locvia.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request payload for creating a customer order from the active shopping cart.
 */
public class CreateOrderRequest {

    @NotNull(message = "Address ID is required")
    @Positive(message = "Address ID must be a positive number")
    private Long addressId;

    public CreateOrderRequest() {
    }

    public CreateOrderRequest(Long addressId) {
        this.addressId = addressId;
    }

    public Long getAddressId() {
        return addressId;
    }

    public void setAddressId(Long addressId) {
        this.addressId = addressId;
    }
}
