package com.locvia.repository;

import com.locvia.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Shop} entities.
 * Provides query methods for public discovery, multi-shop owner retrieval,
 * and owner verification.
 */
@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {

    /**
     * Finds all active shops for public/customer discovery.
     *
     * @return list of active shops
     */
    List<Shop> findByActiveTrue();

    /**
     * Finds an active shop by ID for public/customer lookup.
     *
     * @param id shop ID
     * @return Optional containing the active shop if found
     */
    Optional<Shop> findByIdAndActiveTrue(Long id);

    /**
     * Finds all shops owned by the specified user ID.
     * Supports multi-shop ownership.
     *
     * @param ownerId owner's user ID
     * @return list of shops owned by the user
     */
    List<Shop> findByOwnerId(Long ownerId);

    /**
     * Finds a shop by shop ID and owner ID to verify ownership.
     *
     * @param shopId  shop ID
     * @param ownerId owner's user ID
     * @return Optional containing the shop if owned by the user
     */
    Optional<Shop> findByIdAndOwnerId(Long shopId, Long ownerId);

    /**
     * Counts active shops on the platform.
     */
    long countByActiveTrue();

    /**
     * Retrieves all shops ordered newest first.
     */
    List<Shop> findAllByOrderByCreatedAtDesc();
}
