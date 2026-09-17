package com.locvia.controller;

import com.locvia.dto.AdminUpdateUserRequest;
import com.locvia.dto.UserResponse;
import com.locvia.entity.UserRole;
import com.locvia.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Controller exposing administrative user management APIs.
 * Strictly restricted to administrators with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Lists all platform users for administration with optional filtering.
     * GET /api/admin/users?role=&active=&search=
     *
     * @param role   optional role filter
     * @param active optional active status filter
     * @param search optional name/email/phone substring search
     * @return list of UserResponse
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        List<UserResponse> users = userService.getAllUsersForAdmin(role, active, search);
        return ResponseEntity.ok(users);
    }

    /**
     * Retrieves any user by ID for administration.
     * GET /api/admin/users/{id}
     *
     * @param id target user ID
     * @return UserResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserByIdForAdmin(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Updates user details, platform role, and active status.
     * PUT /api/admin/users/{id}
     *
     * @param id        target user ID
     * @param request   admin update details
     * @param principal authenticated administrator principal
     * @return updated UserResponse
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request,
            Principal principal) {
        UserResponse response = userService.updateUserForAdmin(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Safely deactivates a user account without hard deleting historical business data.
     * DELETE /api/admin/users/{id}
     *
     * @param id        target user ID
     * @param principal authenticated administrator principal
     * @return confirmation message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deactivateUser(
            @PathVariable Long id,
            Principal principal) {
        userService.deactivateUserForAdmin(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "User account deactivated successfully"));
    }

    /**
     * Approves a SHOP_OWNER or DELIVERY_PARTNER account.
     * Only Admins may call this endpoint. Approved users can perform operational actions.
     * PUT /api/admin/users/{id}/approve
     *
     * @param id        target user ID
     * @param principal authenticated administrator principal
     * @return updated UserResponse with accountStatus = APPROVED
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<UserResponse> approveUser(
            @PathVariable Long id,
            Principal principal) {
        UserResponse response = userService.approveUser(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Rejects a SHOP_OWNER or DELIVERY_PARTNER account.
     * Only Admins may call this endpoint. Rejected users remain blocked from operational APIs.
     * PUT /api/admin/users/{id}/reject
     *
     * @param id        target user ID
     * @param principal authenticated administrator principal
     * @return updated UserResponse with accountStatus = REJECTED
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<UserResponse> rejectUser(
            @PathVariable Long id,
            Principal principal) {
        UserResponse response = userService.rejectUser(id, principal.getName());
        return ResponseEntity.ok(response);
    }
}
