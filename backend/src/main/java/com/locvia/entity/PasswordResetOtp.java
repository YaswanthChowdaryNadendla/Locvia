package com.locvia.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores a single in-flight password-reset request for a given email.
 * One row per email — a new OTP request deletes any previous row first.
 *
 * Security notes:
 *  - otpHash stores the BCrypt hash of the 6-digit OTP, never the raw digit string.
 *  - resetToken is a UUID issued only after the OTP is successfully verified.
 *  - The frontend never receives the OTP; the backend never logs or returns it.
 */
@Entity
@Table(name = "password_reset_otps", indexes = {
        @Index(name = "idx_prot_email", columnList = "email"),
        @Index(name = "idx_prot_reset_token", columnList = "reset_token")
})
public class PasswordResetOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Normalized (lowercase-trimmed) email identifying the reset request. */
    @Column(nullable = false, length = 150)
    private String email;

    /** BCrypt hash of the 6-digit OTP. Never store raw digits. */
    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    /** Timestamp after which the OTP is no longer valid (now + 10 minutes). */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Number of failed OTP verification attempts.
     * Locked when this reaches 5 — user must request a new code.
     */
    @Column(nullable = false)
    private int attempts = 0;

    /** True once the OTP has been successfully verified (consumed). */
    @Column(nullable = false)
    private boolean used = false;

    /** Row creation timestamp — used to enforce the 60-second resend cooldown. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Timestamp at which OTP was successfully verified; null until then. */
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /**
     * Short-lived UUID issued after OTP verification.
     * The frontend exchanges this token (not the OTP) for the actual password reset.
     */
    @Column(name = "reset_token", unique = true, length = 64)
    private String resetToken;

    /** Reset token expiry (now + 15 minutes from OTP verification). */
    @Column(name = "reset_token_expires_at")
    private LocalDateTime resetTokenExpiresAt;

    /** True after the reset token has been used to change the password. */
    @Column(name = "reset_token_used", nullable = false)
    private boolean resetTokenUsed = false;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOtpHash() { return otpHash; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public LocalDateTime getResetTokenExpiresAt() { return resetTokenExpiresAt; }
    public void setResetTokenExpiresAt(LocalDateTime resetTokenExpiresAt) { this.resetTokenExpiresAt = resetTokenExpiresAt; }

    public boolean isResetTokenUsed() { return resetTokenUsed; }
    public void setResetTokenUsed(boolean resetTokenUsed) { this.resetTokenUsed = resetTokenUsed; }
}
