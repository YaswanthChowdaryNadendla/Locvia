package com.locvia.controller;

import com.locvia.dto.AuthResponse;
import com.locvia.dto.ForgotPasswordRequest;
import com.locvia.dto.GoogleAuthRequest;
import com.locvia.dto.LoginRequest;
import com.locvia.dto.MessageResponse;
import com.locvia.dto.RegisterRequest;
import com.locvia.dto.RegisterResponse;
import com.locvia.dto.ResendVerificationRequest;
import com.locvia.dto.ResetPasswordRequest;
import com.locvia.dto.UserSummaryDto;
import com.locvia.dto.VerifyEmailRequest;
import com.locvia.dto.VerifyOtpRequest;
import com.locvia.dto.VerifyOtpResponse;
import com.locvia.service.AuthService;
import com.locvia.service.EmailVerificationService;
import com.locvia.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller providing REST API endpoints for user authentication:
 * public registration, public login, protected current-user profile check,
 * email OTP verification, and the three-step public password-reset flow (OTP via Resend email).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService              authService;
    private final PasswordResetService     passwordResetService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(
            AuthService authService,
            PasswordResetService passwordResetService,
            EmailVerificationService emailVerificationService) {
        this.authService              = authService;
        this.passwordResetService     = passwordResetService;
        this.emailVerificationService = emailVerificationService;
    }

    /**
     * Public user registration endpoint.
     * POST /api/auth/register
     *
     * @param request registration details
     * @return RegisterResponse indicating email verification is required
     */
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Public email verification endpoint.
     * POST /api/auth/verify-email
     * POST /api/auth/verify-signup-email
     *
     * @param request email and 6-digit OTP
     * @return MessageResponse confirming email verification
     */
    @PostMapping({"/verify-email", "/verify-signup-email"})
    public ResponseEntity<MessageResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        MessageResponse response = emailVerificationService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Public endpoint to resend registration verification code.
     * Enforces 60-second cooldown on the backend.
     * POST /api/auth/resend-verification
     * POST /api/auth/resend-signup-otp
     *
     * @param request recipient email
     * @return MessageResponse confirming dispatch
     */
    @PostMapping({"/resend-verification", "/resend-signup-otp"})
    public ResponseEntity<MessageResponse> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        MessageResponse response = emailVerificationService.resendVerification(request);
        return ResponseEntity.ok(response);
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
     * Public Google authentication endpoint.
     * POST /api/auth/google
     *
     * Validates Google ID token credential, resolves or creates user,
     * and returns Locvia JWT with user summary.
     *
     * @param request Google credential
     * @return AuthResponse with JWT and UserSummaryDto
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        AuthResponse response = authService.loginWithGoogle(request);
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
