package com.locvia.controller;

import com.locvia.dto.AuthResponse;
import com.locvia.dto.ForgotPasswordRequest;
import com.locvia.dto.LoginRequest;
import com.locvia.dto.MessageResponse;
import com.locvia.dto.RegisterRequest;
import com.locvia.dto.ResetPasswordRequest;
import com.locvia.dto.UserSummaryDto;
import com.locvia.dto.VerifyOtpRequest;
import com.locvia.dto.VerifyOtpResponse;
import com.locvia.service.AuthService;
import com.locvia.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller providing REST API endpoints for user authentication:
 * public registration, public login, protected current-user profile check,
 * and the three-step public password-reset flow (OTP via Resend email).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService          authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService          = authService;
        this.passwordResetService = passwordResetService;
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

    // ── Password Reset Flow (3-step, public, unauthenticated) ────────────────

    /**
     * Step 1 — Request a 6-digit OTP via email.
     * POST /api/auth/forgot-password
     *
     * Always returns a generic message regardless of whether the email is registered
     * to prevent user enumeration attacks.
     *
     * @param request contains the email address
     * @return generic success message
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        MessageResponse response = passwordResetService.requestOtp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Step 2 — Verify the 6-digit OTP submitted by the user.
     * POST /api/auth/verify-reset-otp
     *
     * On success, returns a short-lived UUID reset token that must be presented
     * in Step 3 to authorize the actual password change.
     *
     * @param request contains email + OTP string
     * @return VerifyOtpResponse with resetToken UUID
     */
    @PostMapping("/verify-reset-otp")
    public ResponseEntity<VerifyOtpResponse> verifyResetOtp(@Valid @RequestBody VerifyOtpRequest request) {
        VerifyOtpResponse response = passwordResetService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Step 3 — Reset the password using the verified reset token.
     * POST /api/auth/reset-password
     *
     * @param request contains email, resetToken (UUID from Step 2), and newPassword
     * @return generic success message
     */
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        MessageResponse response = passwordResetService.resetPassword(request);
        return ResponseEntity.ok(response);
    }
}
