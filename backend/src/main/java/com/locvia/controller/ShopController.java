package com.locvia.controller;

import com.locvia.dto.CreateShopRequest;
import com.locvia.dto.ShopResponse;
import com.locvia.dto.UpdateShopRequest;
import com.locvia.service.ShopService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Controller exposing public discovery and shop-owner management REST API endpoints.
 */
@RestController
@RequestMapping("/api/shops")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    /**
     * Public endpoint to list all active shops for customer discovery.
     * GET /api/shops
     *
     * @return list of active ShopResponse
     */
    @GetMapping
    public ResponseEntity<List<ShopResponse>> getAllActiveShops() {
        List<ShopResponse> shops = shopService.getAllActiveShops();
        return ResponseEntity.ok(shops);
    }

    /**
     * Public endpoint to get details for an active shop by ID.
     * Inactive shops return 404 Not Found.
     * GET /api/shops/{id}
     *
     * @param id shop ID
     * @return ShopResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<ShopResponse> getActiveShopById(@PathVariable Long id) {
        ShopResponse shop = shopService.getActiveShopById(id);
        return ResponseEntity.ok(shop);
    }

    /**
     * Creates a new shop for the authenticated shop owner.
     * POST /api/shops
     *
     * @param request   shop creation payload
     * @param principal authenticated user principal
     * @return created ShopResponse with HTTP 201 Created
     */
    @PostMapping
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public ResponseEntity<ShopResponse> createShop(
            @Valid @RequestBody CreateShopRequest request,
            Principal principal) {
        ShopResponse response = shopService.createShop(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists all shops owned by the currently authenticated shop owner.
     * Supports multi-shop ownership.
     * GET /api/shops/my
     *
     * @param principal authenticated user principal
     * @return list of ShopResponse
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public ResponseEntity<List<ShopResponse>> getMyShops(Principal principal) {
        List<ShopResponse> shops = shopService.getShopsByOwner(principal.getName());
        return ResponseEntity.ok(shops);
    }

    /**
     * Retrieves a specific shop owned by the currently authenticated shop owner.
     * GET /api/shops/my/{id}
     *
     * @param id        target shop ID
     * @param principal authenticated user principal
     * @return ShopResponse
     */
    @GetMapping("/my/{id}")
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public ResponseEntity<ShopResponse> getMyShopById(
            @PathVariable Long id,
            Principal principal) {
        ShopResponse response = shopService.getOwnerShopById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Updates an existing shop belonging to the authenticated shop owner.
     * PUT /api/shops/{id}
     *
     * @param id        target shop ID
     * @param request   update details
     * @param principal authenticated user principal
     * @return updated ShopResponse
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SHOP_OWNER')")
    public ResponseEntity<ShopResponse> updateMyShop(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShopRequest request,
            Principal principal) {
        ShopResponse response = shopService.updateOwnerShop(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Uploads a shop image to Cloudinary and updates the shop's image URL.
     * POST /api/shops/{id}/image
     *
     * @param id        target shop ID
     * @param file      multipart image file
     * @param principal authenticated user principal
     * @return updated ShopResponse
     */
    @PostMapping("/{id}/image")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<ShopResponse> uploadShopImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        ShopResponse response = shopService.uploadShopImage(id, file, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Standalone shop image upload to Cloudinary.
     * POST /api/shops/upload-image
     *
     * @param file      multipart image file
     * @param principal authenticated user principal
     * @return map with secure_url, url, imageUrl, and public_id
     */
    @PostMapping("/upload-image")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        var result = shopService.uploadImage(file);
        return ResponseEntity.ok(Map.of(
                "secure_url", result.secureUrl(),
                "url", result.secureUrl(),
                "imageUrl", result.secureUrl(),
                "public_id", result.publicId()
        ));
    }
}
