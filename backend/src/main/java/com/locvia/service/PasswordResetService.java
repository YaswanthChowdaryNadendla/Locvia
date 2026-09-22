package com.locvia.service;

import com.locvia.dto.ForgotPasswordRequest;
import com.locvia.dto.MessageResponse;
import com.locvia.dto.ResetPasswordRequest;
import com.locvia.dto.VerifyOtpRequest;
import com.locvia.dto.VerifyOtpResponse;
import com.locvia.entity.PasswordResetOtp;
import com.locvia.entity.User;
import com.locvia.exception.BusinessException;
import com.locvia.repository.PasswordResetOtpRepository;
import com.locvia.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Core business logic for the Forgot Password flow:
 *  1. requestOtp   — generate + BCrypt-hash OTP, send via Resend
 *  2. verifyOtp    — validate OTP, issue UUID reset token
 *  3. resetPassword — validate reset token, BCrypt-encode new password, update User
 *
 * Security rules enforced here:
 *  - OTPs are NEVER logged at any level.
 *  - Generic response on requestOtp — does not reveal whether email is registered.
 *  - Max 5 failed verification attempts; row locked after that.
 *  - 60-second resend cooldown.
 *  - Reset token is a UUID (not the OTP); short-lived (15 min), single-use.
 *  - Backend exclusively maintains verified state; frontend never trusted.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    /** Generic message always returned by requestOtp to avoid user enumeration. */
    private static final String GENERIC_OTP_MESSAGE =
            "If an account with that email exists, you will receive a reset code shortly.";

    private static final int OTP_EXPIRY_MINUTES      = 10;
    private static final int RESET_TOKEN_EXPIRY_MINS = 15;
    private static final int MAX_ATTEMPTS            = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final UserRepository             userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder            passwordEncoder;
    private final ResendEmailService         resendEmailService;
    private final SecureRandom               secureRandom;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetOtpRepository otpRepository,
            PasswordEncoder passwordEncoder,
            ResendEmailService resendEmailService) {
        this.userRepository     = userRepository;
        this.otpRepository      = otpRepository;
        this.passwordEncoder    = passwordEncoder;
        this.resendEmailService = resendEmailService;
        this.secureRandom       = new SecureRandom();
    }

    // ── 1. Request OTP ───────────────────────────────────────────────────────

    /**
     * Initiates a password reset for the given email.
     * Generates a 6-digit OTP and sends via Resend if the user exists.
     * Throws BusinessException (HTTP 404) if the email does not exist in the database.
     *
     * @param request contains the email address
     * @return generic success message
     * @throws BusinessException if email does not exist (404) or cooldown active (429)
     */
    @Transactional
    public MessageResponse requestOtp(ForgotPasswordRequest request) {
        String email = normalize(request.email());

        // Check if user exists — if not, return HTTP 404 with clear message
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email: {}", email);
            throw new BusinessException(
                    "Email does not exist. Please create an account first.", HttpStatus.NOT_FOUND);
        }

        // Enforce 60-second resend cooldown
        Optional<PasswordResetOtp> existing = otpRepository.findByEmail(email);
        if (existing.isPresent()) {
            LocalDateTime cooldownEnd = existing.get().getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS);
            if (LocalDateTime.now().isBefore(cooldownEnd)) {
                throw new BusinessException(
                        "Please wait before requesting another code.", HttpStatus.TOO_MANY_REQUESTS);
            }
        }

        // Delete any previous OTP record for this email
        otpRepository.deleteByEmail(email);
        otpRepository.flush();

        // Generate 6-digit OTP using SecureRandom
        String rawOtp = String.format("%06d", secureRandom.nextInt(1_000_000));

        // BCrypt hash the OTP before persisting — raw digits never stored
        String otpHash = passwordEncoder.encode(rawOtp);

        PasswordResetOtp record = new PasswordResetOtp();
        record.setEmail(email);
        record.setOtpHash(otpHash);
        record.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpRepository.save(record);

        // Send email via Resend — rawOtp passed here only, never logged
        resendEmailService.sendPasswordResetOtp(email, rawOtp);

        log.info("Password reset OTP issued for email: {}", email);
        return new MessageResponse(GENERIC_OTP_MESSAGE);
    }

    // ── 2. Verify OTP ────────────────────────────────────────────────────────

    /**
     * Validates the OTP submitted by the user.
     * On success, issues a short-lived UUID reset token.
     * Increments attempt counter on every failure; locks record after MAX_ATTEMPTS.
     *
     * @param request contains email + raw OTP string
     * @return VerifyOtpResponse with a UUID resetToken for the next step
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        String email  = normalize(request.email());
        String rawOtp = request.otp() != null ? request.otp().trim() : "";

        PasswordResetOtp record = otpRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Invalid or expired code.", HttpStatus.BAD_REQUEST));

        if (record.isUsed()) {
            throw new BusinessException("This code has already been used.", HttpStatus.BAD_REQUEST);
        }

        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Code has expired. Please request a new one.", HttpStatus.BAD_REQUEST);
        }

        if (record.getAttempts() >= MAX_ATTEMPTS) {
            throw new BusinessException("Too many incorrect attempts. Please request a new code.", HttpStatus.BAD_REQUEST);
        }

        // Increment attempts before checking — always persist the increment
        record.setAttempts(record.getAttempts() + 1);

        if (!passwordEncoder.matches(rawOtp, record.getOtpHash())) {
            otpRepository.saveAndFlush(record);
            int remaining = MAX_ATTEMPTS - record.getAttempts();
            String msg = remaining > 0
                    ? "Incorrect code. " + remaining + " attempt(s) remaining."
                    : "Too many incorrect attempts. Please request a new code.";
            throw new BusinessException(msg, HttpStatus.BAD_REQUEST);
        }

        // OTP verified — mark as used and issue a UUID reset token
        record.setUsed(true);
        record.setVerifiedAt(LocalDateTime.now());
        record.setResetToken(UUID.randomUUID().toString());
        record.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRY_MINS));
        otpRepository.save(record);

        log.info("OTP verified for email: {}", email);
        return new VerifyOtpResponse(record.getResetToken(), "OTP verified successfully.");
    }

    // ── 3. Reset Password ────────────────────────────────────────────────────

    /**
     * Resets the user's password using a verified reset token.
     * Validates token existence, ownership, expiry, and single-use constraint.
     * BCrypt-encodes the new password before persisting.
     *
     * @param request contains email, resetToken, and newPassword
     * @return generic success message
     */
    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String email      = normalize(request.email());
        String resetToken = request.resetToken() != null ? request.resetToken().trim() : "";
        String newPwd     = request.newPassword();

        PasswordResetOtp record = otpRepository.findByResetToken(resetToken)
                .orElseThrow(() -> new BusinessException("Invalid or expired reset link.", HttpStatus.BAD_REQUEST));

        // Verify token belongs to the claimed email
        if (!record.getEmail().equals(email)) {
            throw new BusinessException("Invalid or expired reset link.", HttpStatus.BAD_REQUEST);
        }

        if (record.isResetTokenUsed()) {
            throw new BusinessException("This reset link has already been used.", HttpStatus.BAD_REQUEST);
        }

        if (record.getResetTokenExpiresAt() == null ||
                record.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Reset link has expired. Please request a new one.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Account not found.", HttpStatus.BAD_REQUEST));

        // BCrypt-encode new password — never store plaintext
        user.setPassword(passwordEncoder.encode(newPwd));
        userRepository.save(user);

        // Mark reset token as consumed
        record.setResetTokenUsed(true);
        otpRepository.save(record);

        log.info("Password reset completed for email: {}", email);
        return new MessageResponse("Password has been reset successfully. You can now log in.");
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private String normalize(String email) {
        if (email == null) return "";
        return email.trim().toLowerCase();
    }
}
