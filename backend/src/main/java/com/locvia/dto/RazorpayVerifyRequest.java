package com.locvia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Request payload for verifying a completed Razorpay payment transaction.
 * Strictly ignores client-supplied payment amounts.
 */
public class RazorpayVerifyRequest {

    @NotNull(message = "Order ID is required")
    @Positive(message = "Order ID must be a positive number")
    private Long orderId;

    @NotBlank(message = "Razorpay order ID is required")
    @Size(max = 200, message = "Razorpay order ID cannot exceed 200 characters")
    private String razorpayOrderId;

    @NotBlank(message = "Razorpay payment ID is required")
    @Size(max = 200, message = "Razorpay payment ID cannot exceed 200 characters")
    private String razorpayPaymentId;

    @NotBlank(message = "Razorpay signature is required")
    @Size(max = 500, message = "Razorpay signature cannot exceed 500 characters")
    private String razorpaySignature;

    public RazorpayVerifyRequest() {
    }

    public RazorpayVerifyRequest(Long orderId, String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        this.orderId = orderId;
        this.razorpayOrderId = razorpayOrderId;
        this.razorpayPaymentId = razorpayPaymentId;
        this.razorpaySignature = razorpaySignature;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public void setRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
    }

    public String getRazorpaySignature() {
        return razorpaySignature;
    }

    public void setRazorpaySignature(String razorpaySignature) {
        this.razorpaySignature = razorpaySignature;
    }
}
