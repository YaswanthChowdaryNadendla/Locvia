package com.locvia.controller;

import com.locvia.dto.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check controller providing system status for load balancers,
 * monitoring services, and frontend connectivity checks.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    /**
     * Health check endpoint.
     * GET /api/health
     *
     * @return HealthResponse with status "UP" and service name
     */
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> getHealth() {
        return ResponseEntity.ok(new HealthResponse("UP", "Locvia Backend"));
    }
}
