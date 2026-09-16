package com.locvia.controller;

import com.locvia.dto.AdminCreateProductRequest;
import com.locvia.dto.ProductResponse;
import com.locvia.dto.UpdateProductRequest;
import com.locvia.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing administrative product catalog management endpoints.
 * Strictly restricted to users with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Lists all products across all shops (active and inactive) with optional filters.
     * GET /api/admin/products
     *
     * @param shopId     optional shop ID filter
     * @param categoryId optional category ID filter
     * @param search     optional name search keyword
     * @return list of ProductResponse
     */
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts(
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        List<ProductResponse> products = productService.getAllProductsForAdmin(shopId, categoryId, search);
        return ResponseEntity.ok(products);
    }

    /**
     * Retrieves any product by ID for administrative inspection.
     * GET /api/admin/products/{id}
     *
     * @param id product ID
     * @return ProductResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductByIdForAdmin(id);
        return ResponseEntity.ok(product);
    }

    /**
     * Creates a new product for any shop.
     * POST /api/admin/products
     *
     * @param request admin product creation payload
     * @return created ProductResponse with HTTP 201 Created
     */
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody AdminCreateProductRequest request) {
        ProductResponse response = productService.createProductForAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Updates any product across any shop.
     * PUT /api/admin/products/{id}
     *
     * @param id      product ID
     * @param request update payload
     * @return updated ProductResponse
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request) {
        ProductResponse response = productService.updateProductForAdmin(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Soft-deactivates any product (active = false).
     * DELETE /api/admin/products/{id}
     *
     * @param id product ID
     * @return success confirmation
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deactivateProduct(@PathVariable Long id) {
        productService.deactivateProductForAdmin(id);
        return ResponseEntity.ok(Map.of("message", "Product deactivated successfully"));
    }
}
