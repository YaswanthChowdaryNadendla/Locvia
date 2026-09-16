package com.locvia.controller;

import com.locvia.dto.ProductResponse;
import com.locvia.dto.UpdateProductRequest;
import com.locvia.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * REST controller for public storefront product discovery,
 * individual product management, and Cloudinary image upload.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Public endpoint to get active products with optional filters.
     * GET /api/products
     *
     * @param shopId     optional shop ID filter
     * @param categoryId optional category ID filter
     * @param search     optional name keyword search
     * @return list of active ProductResponse
     */
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getPublicProducts(
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        List<ProductResponse> products = productService.getPublicProducts(shopId, categoryId, search);
        return ResponseEntity.ok(products);
    }

    /**
     * Public endpoint to get details of an active product.
     * Inactive products return 404 Not Found.
     * GET /api/products/{id}
     *
     * @param id product ID
     * @return ProductResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getPublicProductById(@PathVariable Long id) {
        ProductResponse product = productService.getPublicProductById(id);
        return ResponseEntity.ok(product);
    }

    /**
     * Retrieves product details for store management.
     * GET /api/products/{id}/manage
     *
     * @param id        product ID
     * @param principal authenticated user principal
     * @return ProductResponse
     */
    @GetMapping("/{id}/manage")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<ProductResponse> getProductForManagement(
            @PathVariable Long id,
            Principal principal) {
        ProductResponse product = productService.getProductForManagement(id, principal.getName());
        return ResponseEntity.ok(product);
    }

    /**
     * Updates an existing product.
     * PUT /api/products/{id}
     *
     * @param id        product ID
     * @param request   update details
     * @param principal authenticated user principal
     * @return updated ProductResponse
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request,
            Principal principal) {
        ProductResponse product = productService.updateProduct(id, request, principal.getName());
        return ResponseEntity.ok(product);
    }

    /**
     * Soft-deactivates an existing product (active = false).
     * DELETE /api/products/{id}
     *
     * @param id        product ID
     * @param principal authenticated user principal
     * @return success confirmation
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> deactivateProduct(
            @PathVariable Long id,
            Principal principal) {
        productService.deactivateProduct(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Product deactivated successfully"));
    }

    /**
     * Uploads a product image to Cloudinary and updates the product's image URL.
     * POST /api/products/{id}/image
     *
     * @param id        product ID
     * @param file      multipart image file
     * @param principal authenticated user principal
     * @return updated ProductResponse with new secure imageUrl
     */
    @PostMapping("/{id}/image")
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<ProductResponse> uploadProductImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        ProductResponse response = productService.uploadProductImage(id, file, principal.getName());
        return ResponseEntity.ok(response);
    }
}
