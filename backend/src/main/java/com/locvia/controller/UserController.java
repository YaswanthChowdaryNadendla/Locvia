package com.locvia.controller;

import com.locvia.dto.ChangePasswordRequest;
import com.locvia.dto.MessageResponse;
import com.locvia.dto.UpdateUserRequest;
import com.locvia.dto.UserResponse;
import com.locvia.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller exposing REST API endpoints for user profile management.
 * Provides current user profile inspection and self-updating.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Retrieves the profile of the currently authenticated user.
     * GET /api/users/me (and /api/users/profile)
     *
     * @param principal authenticated user principal
     * @return UserResponse
     */
    @GetMapping({"/me", "/profile"})
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        UserResponse response = userService.getCurrentUser(principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Updates profile fields for the currently authenticated user.
     * PUT /api/users/me (and /api/users/profile)
     *
     * @param principal authenticated user principal
     * @param request   update details
     * @return updated UserResponse
     */
    @PutMapping({"/me", "/profile"})
    public ResponseEntity<UserResponse> updateCurrentUser(
            Principal principal,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse response = userService.updateCurrentUser(principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * Changes password for the currently authenticated user.
     * PUT /api/users/change-password (also supports POST)
     *
     * @param principal authenticated user principal from security context
     * @param request   password change payload
     * @return MessageResponse with success message
     */
    @RequestMapping(value = "/change-password", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<MessageResponse> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
    }

    /**
     * Retrieves a specific user by ID.
     * Non-admin users are restricted to retrieving only their own profile.
     * GET /api/users/{id}
     *
     * @param id        target user ID
     * @param principal authenticated user principal
     * @return UserResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id,
            Principal principal) {
        UserResponse response = userService.getUserById(id, principal.getName());
        return ResponseEntity.ok(response);
    }
}
