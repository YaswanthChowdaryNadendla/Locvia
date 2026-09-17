package com.locvia.dto;

/**
 * Response returned after successful OTP verification.
 * Contains a short-lived resetToken that the frontend must include
 * when calling /api/auth/reset-password.
 *
 * Security: resetToken is a UUID — it is NOT the OTP itself.
 */
public record VerifyOtpResponse(String resetToken, String message) {}
