package com.locvia.controller;

import com.locvia.dto.CategoryResponse;
import com.locvia.dto.CreateCategoryRequest;
import com.locvia.dto.UpdateCategoryRequest;
import com.locvia.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing administrative category management REST API endpoints.
 * Strictly restricted to users with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final CategoryService categoryService;

    public AdminCategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * Creates a new category.
     * POST /api/admin/categories
     *
     * @param request category creation payload
     * @return created CategoryResponse with HTTP 201 Created
     */
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists all categories across the platform (active and inactive).
     * GET /api/admin/categories
     *
     * @return list of CategoryResponse
     */
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategoriesForAdmin();
        return ResponseEntity.ok(categories);
    }

    /**
     * Retrieves any category by ID for administrative inspection.
     * GET /api/admin/categories/{id}
     *
     * @param id category ID
     * @return CategoryResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id) {
        CategoryResponse category = categoryService.getCategoryByIdForAdmin(id);
        return ResponseEntity.ok(category);
    }

    /**
     * Updates category name, imageUrl, description, or active status.
     * PUT /api/admin/categories/{id}
     *
     * @param id      category ID
     * @param request category update payload
     * @return updated CategoryResponse
     */
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        CategoryResponse response = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Safely deactivates a category without deleting relational database records.
     * DELETE /api/admin/categories/{id}
     *
     * @param id category ID
     * @return success confirmation
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deactivateCategory(@PathVariable Long id) {
        categoryService.deactivateCategory(id);
        return ResponseEntity.ok(Map.of("message", "Category deactivated successfully"));
    }
}
