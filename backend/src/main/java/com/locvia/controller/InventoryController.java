package com.locvia.controller;

import com.locvia.dto.*;
import com.locvia.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller exposing product-scoped inventory endpoints:
 * public stock availability, full owner management, stock creation, and adjustments.
 */
@RestController
@RequestMapping("/api/products/{productId}/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Public endpoint to get stock availability for an active product.
     * GET /api/products/{productId}/inventory
     *
     * @param productId target product ID
     * @return PublicInventoryResponse (productId, quantity, inStock)
     */
    @GetMapping
    public ResponseEntity<PublicInventoryResponse> getPublicInventory(@PathVariable Long productId) {
        PublicInventoryResponse response = inventoryService.getPublicInventory(productId);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves complete inventory management details for a product.
     * GET /api/products/{productId}/inventory/manage
     *
     * @param productId target product ID
     * @param principal authenticated user principal
     * @return detailed InventoryResponse
     */
    @GetMapping("/manage")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<InventoryResponse> getInventoryForManagement(
            @PathVariable Long productId,
            Principal principal) {
        InventoryResponse response = inventoryService.getInventoryForManagement(productId, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Creates an inventory record for a product.
     * POST /api/products/{productId}/inventory
     *
     * @param productId target product ID
     * @param request   creation payload
     * @param principal authenticated user principal
     * @return created InventoryResponse with HTTP 201 Created
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<InventoryResponse> createInventory(
            @PathVariable Long productId,
            @Valid @RequestBody CreateInventoryRequest request,
            Principal principal) {
        InventoryResponse response = inventoryService.createInventory(productId, request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Updates inventory quantity and low-stock threshold for a product.
     * PUT /api/products/{productId}/inventory
     *
     * @param productId target product ID
     * @param request   update payload
     * @param principal authenticated user principal
     * @return updated InventoryResponse
     */
    @PutMapping
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<InventoryResponse> updateInventory(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateInventoryRequest request,
            Principal principal) {
        InventoryResponse response = inventoryService.updateInventory(productId, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Quick stock quantity adjustment for a product.
     * PATCH /api/products/{productId}/inventory/quantity
     *
     * @param productId target product ID
     * @param request   quantity adjustment payload
     * @param principal authenticated user principal
     * @return updated InventoryResponse
     */
    @PatchMapping("/quantity")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<InventoryResponse> updateQuantity(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateInventoryQuantityRequest request,
            Principal principal) {
        InventoryResponse response = inventoryService.updateQuantity(productId, request, principal.getName());
        return ResponseEntity.ok(response);
    }
}
