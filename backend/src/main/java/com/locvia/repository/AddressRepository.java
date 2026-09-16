package com.locvia.repository;

import com.locvia.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for customer delivery addresses.
 */
@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    /**
     * Retrieves all addresses for a user ordered with default address first,
     * followed by newest created addresses.
     */
    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);

    /**
     * Finds a specific address by its ID and owning user's ID to strictly prevent IDOR.
     */
    Optional<Address> findByIdAndUserId(Long id, Long userId);

    /**
     * Finds the current default address for a user.
     */
    Optional<Address> findByUserIdAndIsDefaultTrue(Long userId);

    /**
     * Retrieves all addresses for a user in chronological order (oldest first).
     * Used for deterministic default fallback when the current default address is deleted.
     */
    List<Address> findByUserIdOrderByCreatedAtAsc(Long userId);

    /**
     * Counts how many addresses the user has saved.
     */
    long countByUserId(Long userId);

    /**
     * Checks if the user already has a default address configured.
     */
    boolean existsByUserIdAndIsDefaultTrue(Long userId);
}
