package com.locvia.repository;

import com.locvia.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link PasswordResetOtp}.
 * Supports OTP lookup by email and reset-token lookup after OTP verification.
 */
@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    /**
     * Finds the active password-reset OTP record for the given email.
     * At most one record per email exists (enforced by requestOtp delete-and-replace).
     */
    Optional<PasswordResetOtp> findByEmail(String email);

    /**
     * Finds an OTP record by its reset token UUID (issued after OTP verification).
     */
    Optional<PasswordResetOtp> findByResetToken(String resetToken);

    /**
     * Deletes any existing OTP record for this email before issuing a new one.
     */
    void deleteByEmail(String email);
}
