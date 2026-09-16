package com.locvia.controller;

import com.locvia.dto.CreateDeliveryRequest;
import com.locvia.dto.DeliveryResponse;
import com.locvia.dto.UpdateDeliveryStatusRequest;
import com.locvia.entity.DeliveryStatus;
import com.locvia.security.CustomUserDetails;
import com.locvia.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for administrator delivery management and partner assignment.
 * Strictly restricted to administrators with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/deliveries")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDeliveryController {

    private final DeliveryService deliveryService;

    public AdminDeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    /**
     * Assigns an order to a delivery partner.
     */
    @PostMapping
    public ResponseEntity<DeliveryResponse> createDelivery(@Valid @RequestBody CreateDeliveryRequest request) {
        DeliveryResponse response = deliveryService.createDelivery(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists platform deliveries with optional filtering.
     * GET /api/admin/deliveries?status=&deliveryPartnerId=&orderId=
     */
    @GetMapping
    public ResponseEntity<List<DeliveryResponse>> getAllDeliveries(
            @RequestParam(required = false) DeliveryStatus status,
            @RequestParam(required = false) Long deliveryPartnerId,
            @RequestParam(required = false) Long orderId) {
        List<DeliveryResponse> response = deliveryService.getAllDeliveriesAdmin(status, deliveryPartnerId, orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves any delivery by ID.
     */
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<DeliveryResponse> getDeliveryById(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                            @PathVariable Long id) {
        DeliveryResponse response = deliveryService.getDeliveryById(userDetails.getUsername(), id, true);
        return ResponseEntity.ok(response);
    }

    /**
     * Operationally updates delivery status by an administrator.
     */
    @RequestMapping(value = "/{id:[0-9]+}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<DeliveryResponse> updateStatus(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                         @PathVariable Long id,
                                                         @Valid @RequestBody UpdateDeliveryStatusRequest request) {
        DeliveryResponse response = deliveryService.updateDeliveryStatus(userDetails.getUsername(), id, request.getStatus(), true);
        return ResponseEntity.ok(response);
    }
}
