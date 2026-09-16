package com.locvia.repository;

import com.locvia.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Product} entities.
 * Supports public storefront discovery, shop owner store management,
 * multi-criteria filtering, and case-insensitive search.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Finds all active products for public storefront browsing.
     *
     * @return list of active products
     */
    List<Product> findByActiveTrue();

    /**
     * Finds an active product by ID for public storefront details.
     *
     * @param id product ID
     * @return Optional containing the active product if found
     */
    Optional<Product> findByIdAndActiveTrue(Long id);

    /**
     * Finds all products (active and inactive) belonging to a specific shop.
     * Used for shop-owner inventory and catalog management.
     *
     * @param shopId shop ID
     * @return list of products
     */
    List<Product> findByShopId(Long shopId);

    /**
     * Finds all active products belonging to a specific shop.
     *
     * @param shopId shop ID
     * @return list of active products
     */
    List<Product> findByShopIdAndActiveTrue(Long shopId);

    /**
     * Finds all active products belonging to a specific category.
     *
     * @param categoryId category ID
     * @return list of active products
     */
    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);

    /**
     * Searches active products with optional filters for shopId, categoryId, and name keyword.
     * Uses case-insensitive matching for keyword search.
     *
     * @param shopId     optional shop ID filter
     * @param categoryId optional category ID filter
     * @param search     optional name search keyword
     * @return list of matching active products
     */
    @Query("SELECT p FROM Product p WHERE p.active = true " +
           "AND (:shopId IS NULL OR p.shop.id = :shopId) " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> findActiveProductsWithFilters(
            @Param("shopId") Long shopId,
            @Param("categoryId") Long categoryId,
            @Param("search") String search
    );

    /**
     * Searches all products (both active and inactive) for administrative management.
     *
     * @param shopId     optional shop ID filter
     * @param categoryId optional category ID filter
     * @param search     optional name search keyword
     * @return list of matching products
     */
    @Query("SELECT p FROM Product p WHERE " +
           "(:shopId IS NULL OR p.shop.id = :shopId) " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> findAllProductsWithFilters(
            @Param("shopId") Long shopId,
            @Param("categoryId") Long categoryId,
            @Param("search") String search
    );

    /**
     * Counts active products on the platform.
     */
    long countByActiveTrue();
}
