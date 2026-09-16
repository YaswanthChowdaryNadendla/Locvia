package com.locvia.controller;

import com.locvia.dto.CreateInventoryRequest;
import com.locvia.dto.InventoryResponse;
import com.locvia.dto.UpdateInventoryQuantityRequest;
import com.locvia.dto.UpdateInventoryRequest;
import com.locvia.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing administrative inventory management across all shops.
 * Strictly restricted to users with ROLE_ADMIN.
 */
@RestController
@PreAuthorize("hasRole('ADMIN')")
public class AdminInventoryController {

    private final InventoryService inventoryService;

    public AdminInventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Lists inventory across all shops with an optional shopId filter.
     * GET /api/admin/inventory
     *
     * @param shopId optional shop ID filter
     * @return list of InventoryResponse
     */
    @GetMapping("/api/admin/inventory")
    public ResponseEntity<List<InventoryResponse>> getAllInventory(
            @RequestParam(required = false) Long shopId) {
        List<InventoryResponse> response = inventoryService.getAllInventoryForAdmin(shopId);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists all low-stock inventory records across all shops.
     * GET /api/admin/inventory/low-stock
     *
     * @return list of low-stock InventoryResponse
     */
    @GetMapping("/api/admin/inventory/low-stock")
    public ResponseEntity<List<InventoryResponse>> getAdminLowStock() {
        List<InventoryResponse> response = inventoryService.getAdminLowStock();
        return ResponseEntity.ok(response);
    }

    /**
     * Lists all out-of-stock inventory records across all shops.
     * GET /api/admin/inventory/out-of-stock
     *
     * @return list of out-of-stock InventoryResponse
     */
    @GetMapping("/api/admin/inventory/out-of-stock")
    public ResponseEntity<List<InventoryResponse>> getAdminOutOfStock() {
        List<InventoryResponse> response = inventoryService.getAdminOutOfStock();
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves inventory for any product by productId.
     * GET /api/admin/products/{productId}/inventory
     *
     * @param productId target product ID
     * @return InventoryResponse
     */
    @GetMapping("/api/admin/products/{productId}/inventory")
    public ResponseEntity<InventoryResponse> getInventoryByProductId(@PathVariable Long productId) {
        InventoryResponse response = inventoryService.getInventoryByProductIdForAdmin(productId);
        return ResponseEntity.ok(response);
    }

    /**
     * Creates inventory for any product.
     * POST /api/admin/products/{productId}/inventory
     *
     * @param productId target product ID
     * @param request   creation details
     * @return created InventoryResponse with HTTP 201 Created
     */
    @PostMapping("/api/admin/products/{productId}/inventory")
    public ResponseEntity<InventoryResponse> createInventory(
            @PathVariable Long productId,
            @Valid @RequestBody CreateInventoryRequest request) {
        InventoryResponse response = inventoryService.createInventoryForAdmin(productId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Updates inventory for any product.
     * PUT /api/admin/products/{productId}/inventory
     *
     * @param productId target product ID
     * @param request   update details
     * @return updated InventoryResponse
     */
    @PutMapping("/api/admin/products/{productId}/inventory")
    public ResponseEntity<InventoryResponse> updateInventory(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateInventoryRequest request) {
        InventoryResponse response = inventoryService.updateInventoryForAdmin(productId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Quick stock quantity adjustment for any product.
     * PATCH /api/admin/products/{productId}/inventory/quantity
     *
     * @param productId target product ID
     * @param request   quantity adjustment payload
     * @return updated InventoryResponse
     */
    @PatchMapping("/api/admin/products/{productId}/inventory/quantity")
    public ResponseEntity<InventoryResponse> updateQuantity(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateInventoryQuantityRequest request) {
        InventoryResponse response = inventoryService.updateQuantityForAdmin(productId, request);
        return ResponseEntity.ok(response);
    }
}
