package com.locvia.controller;

import com.locvia.dto.InventoryResponse;
import com.locvia.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller exposing shop-level inventory queries:
 * full store inventory, low-stock alerts, and out-of-stock items.
 * Restricted to the owning shop owner or platform administrators.
 */
@RestController
@RequestMapping("/api/shops/{shopId}/inventory")
@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
public class ShopInventoryController {

    private final InventoryService inventoryService;

    public ShopInventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Retrieves all inventory records for products belonging to the shop.
     * GET /api/shops/{shopId}/inventory
     *
     * @param shopId    target shop ID
     * @param principal authenticated user principal
     * @return list of InventoryResponse
     */
    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getShopInventory(
            @PathVariable Long shopId,
            Principal principal) {
        List<InventoryResponse> response = inventoryService.getShopInventory(shopId, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves low-stock products (quantity <= lowStockThreshold) for the shop.
     * GET /api/shops/{shopId}/inventory/low-stock
     *
     * @param shopId    target shop ID
     * @param principal authenticated user principal
     * @return list of low-stock InventoryResponse
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryResponse>> getShopLowStock(
            @PathVariable Long shopId,
            Principal principal) {
        List<InventoryResponse> response = inventoryService.getShopLowStock(shopId, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves out-of-stock products (quantity == 0) for the shop.
     * GET /api/shops/{shopId}/inventory/out-of-stock
     *
     * @param shopId    target shop ID
     * @param principal authenticated user principal
     * @return list of out-of-stock InventoryResponse
     */
    @GetMapping("/out-of-stock")
    public ResponseEntity<List<InventoryResponse>> getShopOutOfStock(
            @PathVariable Long shopId,
            Principal principal) {
        List<InventoryResponse> response = inventoryService.getShopOutOfStock(shopId, principal.getName());
        return ResponseEntity.ok(response);
    }
}
