package com.locvia.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for verifying the 6-digit OTP sent to the user's email.
 * POST /api/auth/verify-reset-otp
 */
public record VerifyOtpRequest(
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "OTP is required")
        String otp
) {}
