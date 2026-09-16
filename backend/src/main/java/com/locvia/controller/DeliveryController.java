package com.locvia.controller;

import com.locvia.dto.DeliveryResponse;
import com.locvia.dto.UpdateDeliveryStatusRequest;
import com.locvia.security.CustomUserDetails;
import com.locvia.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for delivery partner operations and milestone status updates.
 */
@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    /**
     * Retrieves deliveries currently available and assigned to the authenticated delivery partner.
     */
    @GetMapping("/requests")
    public ResponseEntity<List<DeliveryResponse>> getRequests(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<DeliveryResponse> response = deliveryService.getPartnerRequests(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves active (non-completed and non-cancelled) deliveries for the authenticated delivery partner.
     */
    @GetMapping("/active")
    public ResponseEntity<List<DeliveryResponse>> getActiveDeliveries(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<DeliveryResponse> response = deliveryService.getPartnerActiveDeliveries(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves completed deliveries for the authenticated delivery partner.
     */
    @GetMapping("/completed")
    public ResponseEntity<List<DeliveryResponse>> getCompletedDeliveries(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<DeliveryResponse> response = deliveryService.getPartnerCompletedDeliveries(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves delivery details, enforcing delivery partner ownership isolation unless called by an administrator.
     */
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<DeliveryResponse> getDeliveryById(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                            @PathVariable Long id) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        DeliveryResponse response = deliveryService.getDeliveryById(userDetails.getUsername(), id, isAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Updates delivery milestone status with strict state transition validation and Order status synchronization.
     */
    @RequestMapping(value = "/{id:[0-9]+}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<DeliveryResponse> updateStatus(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                         @PathVariable Long id,
                                                         @Valid @RequestBody UpdateDeliveryStatusRequest request) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        DeliveryResponse response = deliveryService.updateDeliveryStatus(userDetails.getUsername(), id, request.getStatus(), isAdmin);
        return ResponseEntity.ok(response);
    }
}
