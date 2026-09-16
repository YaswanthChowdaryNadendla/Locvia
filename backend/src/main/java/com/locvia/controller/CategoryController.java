package com.locvia.controller;

import com.locvia.dto.CategoryResponse;
import com.locvia.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller exposing public category browsing REST API endpoints.
 * Permitted for unauthenticated public storefront and customer access.
 */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * Public endpoint to list all active categories.
     * GET /api/categories
     *
     * @return list of active CategoryResponse
     */
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllActiveCategories() {
        List<CategoryResponse> categories = categoryService.getAllActiveCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * Public endpoint to retrieve an active category by ID.
     * Inactive categories return 404 Not Found.
     * GET /api/categories/{id}
     *
     * @param id category ID
     * @return CategoryResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getActiveCategoryById(@PathVariable Long id) {
        CategoryResponse category = categoryService.getActiveCategoryById(id);
        return ResponseEntity.ok(category);
    }
}
