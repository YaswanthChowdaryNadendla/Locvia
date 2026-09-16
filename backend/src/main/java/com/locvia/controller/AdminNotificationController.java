package com.locvia.controller;

import com.locvia.dto.AdminNotificationResponse;
import com.locvia.service.AdminNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for administrative oversight of platform notification dispatch.
 * Strictly restricted to administrators with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    public AdminNotificationController(AdminNotificationService adminNotificationService) {
        this.adminNotificationService = adminNotificationService;
    }

    /**
     * Lists all platform notifications ordered newest first.
     * GET /api/admin/notifications
     *
     * @return list of AdminNotificationResponse
     */
    @GetMapping
    public ResponseEntity<List<AdminNotificationResponse>> getAllNotifications() {
        List<AdminNotificationResponse> notifications = adminNotificationService.getAllNotifications();
        return ResponseEntity.ok(notifications);
    }

    /**
     * Retrieves a specific notification by ID.
     * GET /api/admin/notifications/{id}
     *
     * @param id target notification ID
     * @return AdminNotificationResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdminNotificationResponse> getNotificationById(@PathVariable Long id) {
        AdminNotificationResponse notification = adminNotificationService.getNotificationById(id);
        return ResponseEntity.ok(notification);
    }
}
