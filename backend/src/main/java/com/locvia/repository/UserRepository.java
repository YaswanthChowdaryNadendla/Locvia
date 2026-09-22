package com.locvia.repository;

import com.locvia.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link User} entity.
 * Supports authentication lookup by unique email identifier.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by email address.
     *
     * @param email normalized email address
     * @return Optional containing the User if found, otherwise empty
     */
    Optional<User> findByEmail(String email);

    /**
     * Finds a user by their unique Google Subject ID.
     *
     * @param googleSubject stable Google subject ID
     * @return Optional containing the User if found, otherwise empty
     */
    Optional<User> findByGoogleSubject(String googleSubject);

    /**
     * Checks if a user already exists with the given email address.
     *
     * @param email normalized email address
     * @return true if a user exists with the email, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Checks if any other user already possesses the given email address.
     *
     * @param email normalized email address
     * @param id current user's ID
     * @return true if another user already has the email
     */
    boolean existsByEmailAndIdNot(String email, Long id);

    /**
     * Counts users with a specific platform role.
     */
    long countByRole(com.locvia.entity.UserRole role);

    /**
     * Counts active users on the platform.
     */
    long countByActiveTrue();

    /**
     * Retrieves all users ordered newest first.
     */
    java.util.List<User> findAllByOrderByCreatedAtDesc();
}
