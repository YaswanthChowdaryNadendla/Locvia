package com.locvia.repository;

import com.locvia.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Inventory} entities.
 * Supports product inventory lookup, shop-level catalog stock inspection,
 * low-stock detection, and out-of-stock querying.
 */
@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    /**
     * Finds the inventory record for a specific product ID.
     *
     * @param productId product ID
     * @return Optional containing Inventory if found
     */
    Optional<Inventory> findByProductId(Long productId);

    /**
     * Checks if an inventory record already exists for a product ID.
     *
     * @param productId product ID
     * @return true if exists, false otherwise
     */
    boolean existsByProductId(Long productId);

    /**
     * Finds all inventory records belonging to products in a specific shop.
     *
     * @param shopId shop ID
     * @return list of Inventory records
     */
    List<Inventory> findByProductShopId(Long shopId);

    /**
     * Finds all inventory records for a shop with an exact quantity (e.g., 0 for out-of-stock).
     *
     * @param shopId   shop ID
     * @param quantity target quantity
     * @return list of matching Inventory records
     */
    List<Inventory> findByProductShopIdAndQuantity(Long shopId, Integer quantity);

    /**
     * Finds low-stock inventory records for a specific shop where quantity is less than
     * or equal to the product's configured lowStockThreshold.
     *
     * @param shopId shop ID
     * @return list of low-stock Inventory records
     */
    @Query("SELECT i FROM Inventory i WHERE i.product.shop.id = :shopId AND i.quantity <= i.lowStockThreshold")
    List<Inventory> findLowStockByShopId(@Param("shopId") Long shopId);

    /**
     * Finds all low-stock inventory records across the platform where quantity is less than
     * or equal to the lowStockThreshold (for administrators).
     *
     * @return list of all low-stock Inventory records
     */
    @Query("SELECT i FROM Inventory i WHERE i.quantity <= i.lowStockThreshold")
    List<Inventory> findAllLowStock();

    /**
     * Finds all out-of-stock inventory records across the platform (for administrators).
     *
     * @param quantity exact quantity (0)
     * @return list of out-of-stock Inventory records
     */
    List<Inventory> findByQuantity(Integer quantity);

    /**
     * Retrieves all inventory across the platform with an optional shopId filter (for administrators).
     *
     * @param shopId optional shop filter
     * @return list of Inventory records
     */
    @Query("SELECT i FROM Inventory i WHERE (:shopId IS NULL OR i.product.shop.id = :shopId)")
    List<Inventory> findAllWithFilters(@Param("shopId") Long shopId);
}
