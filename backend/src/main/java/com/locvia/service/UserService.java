package com.locvia.service;

import com.locvia.dto.AdminUpdateUserRequest;
import com.locvia.dto.UpdateUserRequest;
import com.locvia.dto.UserResponse;
import com.locvia.entity.AccountStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.exception.EmailAlreadyExistsException;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing user profile retrieval, self-updates, ownership verification,
 * and administrator user management.
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Retrieves the current authenticated user's profile.
     *
     * @param email authenticated user's email
     * @return UserResponse
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = findUserByNormalizedEmail(email);
        return UserResponse.fromEntity(user);
    }

    /**
     * Updates the current authenticated user's profile (name, phone, optional email).
     * Strictly ignores any attempts to modify roles, password, or identifiers.
     *
     * @param email   authenticated user's email
     * @param request update payload
     * @return updated UserResponse
     */
    @Transactional
    public UserResponse updateCurrentUser(String email, UpdateUserRequest request) {
        User user = findUserByNormalizedEmail(email);

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmailAndIdNot(newEmail, user.getId())) {
                    throw new EmailAlreadyExistsException("Email is already registered: " + newEmail);
                }
                user.setEmail(newEmail);
            }
        }

        User updatedUser = userRepository.save(user);
        return UserResponse.fromEntity(updatedUser);
    }

    /**
     * Retrieves a user by ID with strict ownership protection.
     * Non-admin users can ONLY view their own profile.
     *
     * @param id             target user ID
     * @param requesterEmail authenticated requester's email
     * @return UserResponse
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id, String requesterEmail) {
        User requester = findUserByNormalizedEmail(requesterEmail);

        // Security check: non-admin users cannot access other users' profiles
        if (requester.getRole() != UserRole.ADMIN && !requester.getId().equals(id)) {
            throw new AccessDeniedException("Access denied: You are not authorized to view another user's profile");
        }

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        return UserResponse.fromEntity(targetUser);
    }

    /**
     * Lists all platform users for administrators with optional filtering.
     *
     * @param role   optional role filter
     * @param active optional active status filter
     * @param search optional keyword filter matching name, email, or phone
     * @return list of UserResponse
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsersForAdmin(UserRole role, Boolean active, String search) {
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> active == null || Boolean.valueOf(u.getActive()).equals(active))
                .filter(u -> trimmedSearch == null ||
                        (u.getName() != null && u.getName().toLowerCase().contains(trimmedSearch)) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(trimmedSearch)) ||
                        (u.getPhone() != null && u.getPhone().toLowerCase().contains(trimmedSearch)))
                .map(UserResponse::fromEntity)
                .toList();
    }

    /**
     * Lists all platform users for administrators.
     *
     * @return list of UserResponse
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsersForAdmin() {
        return getAllUsersForAdmin(null, null, null);
    }

    /**
     * Retrieves any user by ID for administrators.
     *
     * @param id target user ID
     * @return UserResponse
     */
    @Transactional(readOnly = true)
    public UserResponse getUserByIdForAdmin(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserResponse.fromEntity(user);
    }

    /**
     * Updates user details, platform role, and active status for administrators.
     * Enforces self-protection so an admin cannot demote or deactivate themselves.
     *
     * @param id         target user ID
     * @param request    admin update payload
     * @param adminEmail authenticated administrator's email
     * @return updated UserResponse
     */
    @Transactional
    public UserResponse updateUserForAdmin(Long id, AdminUpdateUserRequest request, String adminEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User admin = findUserByNormalizedEmail(adminEmail);

        // Admin self-protection: cannot demote or deactivate own account
        if (targetUser.getId().equals(admin.getId())) {
            if (request.getRole() != null && request.getRole() != UserRole.ADMIN) {
                throw new SecurityException("Administrators cannot demote their own administrative role");
            }
            if (request.getActive() != null && !request.getActive()) {
                throw new SecurityException("Administrators cannot deactivate their own administrative account");
            }
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            targetUser.setName(request.getName().trim());
        }

        if (request.getPhone() != null) {
            targetUser.setPhone(request.getPhone().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(targetUser.getEmail())) {
                if (userRepository.existsByEmailAndIdNot(newEmail, targetUser.getId())) {
                    throw new EmailAlreadyExistsException("Email is already registered: " + newEmail);
                }
                targetUser.setEmail(newEmail);
            }
        }

        if (request.getRole() != null) {
            targetUser.setRole(request.getRole());
        }

        if (request.getActive() != null) {
            targetUser.setActive(request.getActive());
        }

        User updated = userRepository.save(targetUser);
        return UserResponse.fromEntity(updated);
    }

    /**
     * Safely deactivates a user account without hard deleting relational records.
     * Enforces admin self-protection.
     *
     * @param id         target user ID
     * @param adminEmail authenticated administrator's email
     */
    @Transactional
    public void deactivateUserForAdmin(Long id, String adminEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User admin = findUserByNormalizedEmail(adminEmail);

        if (targetUser.getId().equals(admin.getId())) {
            throw new SecurityException("Administrators cannot deactivate their own administrative account");
        }

        targetUser.setActive(false);
        userRepository.save(targetUser);
    }

    /**
     * Approves a SHOP_OWNER or DELIVERY_PARTNER account, allowing it to perform
     * operational actions on the platform.
     * Prevents administrators from approving their own account unnecessarily.
     *
     * @param id         target user ID
     * @param adminEmail authenticated administrator's email
     * @return updated UserResponse with accountStatus = APPROVED
     */
    @Transactional
    public UserResponse approveUser(Long id, String adminEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User admin = findUserByNormalizedEmail(adminEmail);

        // Prevent admin from approving themselves (not meaningful but blocks the action)
        if (targetUser.getId().equals(admin.getId())) {
            throw new SecurityException("Administrators cannot approve their own account");
        }

        if (targetUser.getRole() == UserRole.CUSTOMER || targetUser.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Approval is only applicable to SHOP_OWNER and DELIVERY_PARTNER accounts");
        }

        targetUser.setAccountStatus(AccountStatus.APPROVED);
        User updated = userRepository.save(targetUser);
        return UserResponse.fromEntity(updated);
    }

    /**
     * Rejects a SHOP_OWNER or DELIVERY_PARTNER account.
     * The account remains blocked from operational APIs.
     *
     * @param id         target user ID
     * @param adminEmail authenticated administrator's email
     * @return updated UserResponse with accountStatus = REJECTED
     */
    @Transactional
    public UserResponse rejectUser(Long id, String adminEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User admin = findUserByNormalizedEmail(adminEmail);

        if (targetUser.getId().equals(admin.getId())) {
            throw new SecurityException("Administrators cannot reject their own account");
        }

        if (targetUser.getRole() == UserRole.CUSTOMER || targetUser.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Rejection is only applicable to SHOP_OWNER and DELIVERY_PARTNER accounts");
        }

        targetUser.setAccountStatus(AccountStatus.REJECTED);
        User updated = userRepository.save(targetUser);
        return UserResponse.fromEntity(updated);
    }

    private User findUserByNormalizedEmail(String email) {
        String normalized = email != null ? email.trim().toLowerCase() : "";
        return userRepository.findByEmail(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalized));
    }
}
