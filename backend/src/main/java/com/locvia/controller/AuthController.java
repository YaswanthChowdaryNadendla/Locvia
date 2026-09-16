package com.locvia.controller;

import com.locvia.dto.AuthResponse;
import com.locvia.dto.LoginRequest;
import com.locvia.dto.RegisterRequest;
import com.locvia.dto.UserSummaryDto;
import com.locvia.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller providing REST API endpoints for user authentication:
 * public registration, public login, and protected current-user profile check.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Public user registration endpoint.
     * POST /api/auth/register
     *
     * @param request registration details
     * @return AuthResponse with JWT and safe user details
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Public user login endpoint.
     * POST /api/auth/login
     *
     * @param request credentials
     * @return AuthResponse with JWT and safe user details
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Protected current-user profile verification endpoint.
     * GET /api/auth/me
     *
     * @param principal authenticated user principal
     * @return UserSummaryDto containing safe user fields
     */
    @GetMapping("/me")
    public ResponseEntity<UserSummaryDto> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserSummaryDto userSummary = authService.getCurrentUserSummary(principal.getName());
        return ResponseEntity.ok(userSummary);
    }
}
