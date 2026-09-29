package com.locvia.controller;

import com.locvia.dto.CreateProductRequest;
import com.locvia.dto.ProductResponse;
import com.locvia.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller for store-specific product catalog operations.
 * Restricted to the owning shop owner or platform administrators.
 */
@RestController
@RequestMapping("/api/shops/{shopId}/products")
public class ShopProductController {

    private final ProductService productService;

    public ShopProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Creates a new product for the specified shop.
     * POST /api/shops/{shopId}/products
     *
     * @param shopId    target shop ID
     * @param request   product creation details
     * @param principal authenticated user principal
     * @return created ProductResponse with HTTP 201 Created
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(
            @PathVariable Long shopId,
            @Valid @RequestBody CreateProductRequest request,
            Principal principal) {
        ProductResponse response = productService.createProductForShop(shopId, request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists products belonging to the specified shop.
     * Accessible by customers and the public for approved/active shops,
     * and by the owning shop owner/administrator for store management.
     * GET /api/shops/{shopId}/products
     *
     * @param shopId    target shop ID
     * @param principal authenticated user principal (optional)
     * @return list of ProductResponse
     */
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProductsForShop(
            @PathVariable Long shopId,
            Principal principal) {
        String callerEmail = principal != null ? principal.getName() : null;
        List<ProductResponse> products = productService.getProductsForShop(shopId, callerEmail);
        return ResponseEntity.ok(products);
    }
}
