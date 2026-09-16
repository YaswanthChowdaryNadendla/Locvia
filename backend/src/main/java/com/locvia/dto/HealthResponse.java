package com.locvia.dto;

/**
 * Data Transfer Object representing the backend health check response.
 */
public record HealthResponse(String status, String service) {
}
