package com.locvia.controller;

import com.locvia.dto.AdminDashboardResponse;
import com.locvia.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller providing platform-wide metrics and dashboard counters for administrators.
 * Strictly restricted to administrators with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    /**
     * Aggregates platform operational analytics and counters.
     * Accessible via GET /api/admin/dashboard and GET /api/admin/metrics.
     *
     * @return AdminDashboardResponse
     */
    @GetMapping({"/dashboard", "/metrics"})
    public ResponseEntity<AdminDashboardResponse> getDashboardMetrics() {
        AdminDashboardResponse metrics = adminDashboardService.getDashboardMetrics();
        return ResponseEntity.ok(metrics);
    }
}
