package com.locvia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for resetting the password using a verified reset token.
 * POST /api/auth/reset-password
 */
public record ResetPasswordRequest(
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Reset token is required")
        String resetToken,

        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String newPassword
) {}
