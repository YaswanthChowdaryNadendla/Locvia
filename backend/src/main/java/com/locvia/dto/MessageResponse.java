package com.locvia.dto;

/**
 * Generic single-message response used across the password-reset flow
 * to avoid revealing sensitive information in response bodies.
 */
public record MessageResponse(String message) {}
