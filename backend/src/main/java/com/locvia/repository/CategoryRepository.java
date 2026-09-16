package com.locvia.repository;

import com.locvia.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Category} entities.
 * Provides query methods for public category browsing, admin management,
 * and case-insensitive duplicate validation.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Finds all active categories for public storefront and browsing.
     *
     * @return list of active categories
     */
    List<Category> findByActiveTrue();

    /**
     * Finds an active category by its ID.
     *
     * @param id category ID
     * @return Optional containing the active category if found
     */
    Optional<Category> findByIdAndActiveTrue(Long id);

    /**
     * Finds a category by its name, case-insensitively.
     *
     * @param name category name
     * @return Optional containing matching category if found
     */
    Optional<Category> findByNameIgnoreCase(String name);

    /**
     * Checks if a category with the given name exists (case-insensitive).
     *
     * @param name category name to check
     * @return true if exists, false otherwise
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Checks if another category with the given name exists excluding a specific category ID.
     * Useful for name conflict verification during updates.
     *
     * @param name category name to check
     * @param id   category ID to exclude
     * @return true if another category with the same name exists, false otherwise
     */
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
