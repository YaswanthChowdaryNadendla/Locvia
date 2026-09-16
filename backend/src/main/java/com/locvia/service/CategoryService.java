package com.locvia.service;

import com.locvia.dto.CategoryResponse;
import com.locvia.dto.CreateCategoryRequest;
import com.locvia.dto.UpdateCategoryRequest;
import com.locvia.entity.Category;
import com.locvia.exception.CategoryAlreadyExistsException;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling category management: public browsing,
 * administrative CRUD operations, and duplicate name validation.
 */
@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * Lists all active categories for public storefront and customer browsing.
     *
     * @return list of active categories
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllActiveCategories() {
        return categoryRepository.findByActiveTrue().stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves an active category by ID for public/customer view.
     * Inactive categories return 404 to hide disabled sections from storefronts.
     *
     * @param id category ID
     * @return CategoryResponse
     */
    @Transactional(readOnly = true)
    public CategoryResponse getActiveCategoryById(Long id) {
        return categoryRepository.findByIdAndActiveTrue(id)
                .map(CategoryResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    /**
     * Lists all categories across the platform for administrators (both active and inactive).
     *
     * @return list of all categories
     */
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategoriesForAdmin() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves any category by ID for administrators.
     *
     * @param id category ID
     * @return CategoryResponse
     */
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryByIdForAdmin(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return CategoryResponse.fromEntity(category);
    }

    /**
     * Creates a new category (Admin only).
     * Validates that the category name is unique (case-insensitively).
     *
     * @param request category creation request
     * @return created CategoryResponse
     */
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String trimmedName = request.name().trim();

        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new CategoryAlreadyExistsException("Category already exists with name: " + trimmedName);
        }

        Category category = new Category();
        category.setName(trimmedName);
        if (request.imageUrl() != null) {
            category.setImageUrl(request.imageUrl().trim());
        }
        if (request.description() != null) {
            category.setDescription(request.description().trim());
        }
        category.setActive(true);

        Category saved = categoryRepository.save(category);
        return CategoryResponse.fromEntity(saved);
    }

    /**
     * Updates an existing category (Admin only).
     * Allows updating name, imageUrl, description, and active status.
     * Validates name uniqueness if the name is being modified.
     *
     * @param id      category ID
     * @param request category update request
     * @return updated CategoryResponse
     */
    @Transactional
    public CategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            String trimmedName = request.name().trim();
            if (categoryRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
                throw new CategoryAlreadyExistsException("Category already exists with name: " + trimmedName);
            }
            category.setName(trimmedName);
        }

        if (request.imageUrl() != null) {
            category.setImageUrl(request.imageUrl().trim());
        }

        if (request.description() != null) {
            category.setDescription(request.description().trim());
        }

        if (request.active() != null) {
            category.setActive(request.active());
        }

        Category updated = categoryRepository.save(category);
        return CategoryResponse.fromEntity(updated);
    }

    /**
     * Soft-deactivates a category by setting active = false (Admin only).
     * Preserves referential integrity for existing products and orders.
     *
     * @param id category ID
     */
    @Transactional
    public void deactivateCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        category.setActive(false);
        categoryRepository.save(category);
    }
}
