package com.locvia.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for initiating a password reset — email only.
 * POST /api/auth/forgot-password
 */
public record ForgotPasswordRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "A valid email address is required")
        String email
) {}
