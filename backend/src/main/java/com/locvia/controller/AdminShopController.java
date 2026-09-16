package com.locvia.controller;

import com.locvia.dto.AdminUpdateShopRequest;
import com.locvia.dto.ShopResponse;
import com.locvia.service.ShopService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing administrative shop management REST API endpoints.
 * Strictly restricted to users with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/shops")
@PreAuthorize("hasRole('ADMIN')")
public class AdminShopController {

    private final ShopService shopService;

    public AdminShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    /**
     * Lists registered shops across the platform with optional filtering.
     * GET /api/admin/shops?active=&ownerId=&search=
     *
     * @param active  optional active status filter
     * @param ownerId optional owner user ID filter
     * @param search  optional name/address/description substring filter
     * @return list of ShopResponse
     */
    @GetMapping
    public ResponseEntity<List<ShopResponse>> getAllShops(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String search) {
        List<ShopResponse> shops = shopService.getAllShopsForAdmin(active, ownerId, search);
        return ResponseEntity.ok(shops);
    }

    /**
     * Retrieves any shop by ID for administrative inspection.
     * GET /api/admin/shops/{id}
     *
     * @param id target shop ID
     * @return ShopResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<ShopResponse> getShopById(@PathVariable Long id) {
        ShopResponse shop = shopService.getShopByIdForAdmin(id);
        return ResponseEntity.ok(shop);
    }

    /**
     * Updates shop details, active status, or rating for administrators.
     * PUT /api/admin/shops/{id}
     *
     * @param id      target shop ID
     * @param request administrative update details
     * @return updated ShopResponse
     */
    @PutMapping("/{id}")
    public ResponseEntity<ShopResponse> updateShop(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateShopRequest request) {
        ShopResponse response = shopService.updateShopForAdmin(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Safely deactivates a shop account without deleting relational business records.
     * DELETE /api/admin/shops/{id}
     *
     * @param id target shop ID
     * @return success confirmation
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deactivateShop(@PathVariable Long id) {
        shopService.deactivateShopForAdmin(id);
        return ResponseEntity.ok(Map.of("message", "Shop deactivated successfully"));
    }
}
