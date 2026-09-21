package com.locvia.service;

import com.locvia.dto.MessageResponse;
import com.locvia.dto.ResendVerificationRequest;
import com.locvia.dto.VerifyEmailRequest;
import com.locvia.entity.EmailVerificationOtp;
import com.locvia.entity.User;
import com.locvia.exception.BusinessException;
import com.locvia.repository.EmailVerificationOtpRepository;
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

/**
 * Service for email OTP verification during registration.
 *
 * Security rules enforced:
 *  - OTPs are NEVER logged or stored in plaintext (BCrypt hashed).
 *  - OTP is 6 numeric digits generated using SecureRandom.
 *  - Max 5 failed verification attempts; locked after that.
 *  - 10-minute expiry time; single-use only.
 *  - 60-second resend cooldown enforced on backend.
 *  - Normalizes email to lowercase.
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private static final int OTP_EXPIRY_MINUTES      = 10;
    private static final int MAX_ATTEMPTS            = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final UserRepository                 userRepository;
    private final EmailVerificationOtpRepository otpRepository;
    private final PasswordEncoder                passwordEncoder;
    private final ResendEmailService             resendEmailService;
    private final SecureRandom                   secureRandom;

    public EmailVerificationService(
            UserRepository userRepository,
            EmailVerificationOtpRepository otpRepository,
            PasswordEncoder passwordEncoder,
            ResendEmailService resendEmailService) {
        this.userRepository     = userRepository;
        this.otpRepository      = otpRepository;
        this.passwordEncoder    = passwordEncoder;
        this.resendEmailService = resendEmailService;
        this.secureRandom       = new SecureRandom();
    }

    /**
     * Generates a 6-digit OTP, hashes it with BCrypt, saves/replaces in repository,
     * and sends the raw OTP via Resend. The raw OTP is NEVER logged.
     *
     * @param rawEmail recipient email address
     */
    @Transactional
    public void generateAndSendOtp(String rawEmail) {
        String email = normalize(rawEmail);

        // Delete any existing OTP for this email so previous OTP is invalidated
        otpRepository.deleteByEmail(email);
        otpRepository.flush();

        // 6-digit numeric OTP via SecureRandom
        String rawOtp = String.format("%06d", secureRandom.nextInt(1_000_000));
        String otpHash = passwordEncoder.encode(rawOtp);

        EmailVerificationOtp record = new EmailVerificationOtp();
        record.setEmail(email);
        record.setOtpHash(otpHash);
        record.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        record.setAttempts(0);
        record.setUsed(false);

        otpRepository.save(record);

        // Send email via Resend — rawOtp passed directly, never logged
        resendEmailService.sendEmailVerificationOtp(email, rawOtp);

        log.info("Email verification OTP generated and dispatched for email: {}", email);
    }

    /**
     * Verifies the submitted OTP against the BCrypt hash.
     * Single-use, expires in 10 minutes, max 5 attempts.
     *
     * @param request email and 6-digit OTP
     * @return MessageResponse confirming successful verification
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public MessageResponse verifyEmail(VerifyEmailRequest request) {
        String email  = normalize(request.email());
        String rawOtp = request.otp() != null ? request.otp().trim() : "";

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Account not found.", HttpStatus.BAD_REQUEST));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BusinessException("Your email is already verified.", HttpStatus.BAD_REQUEST);
        }

        EmailVerificationOtp record = otpRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Invalid verification code.", HttpStatus.BAD_REQUEST));

        if (record.isUsed()) {
            throw new BusinessException("Invalid verification code.", HttpStatus.BAD_REQUEST);
        }

        if (record.getAttempts() >= MAX_ATTEMPTS) {
            throw new BusinessException("Too many incorrect attempts. Please request a new code.", HttpStatus.BAD_REQUEST);
        }

        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Verification code has expired. Please request a new code.", HttpStatus.BAD_REQUEST);
        }

        // Increment attempts on every verification try
        record.setAttempts(record.getAttempts() + 1);

        if (!passwordEncoder.matches(rawOtp, record.getOtpHash())) {
            otpRepository.saveAndFlush(record);
            if (record.getAttempts() >= MAX_ATTEMPTS) {
                throw new BusinessException("Too many incorrect attempts. Please request a new code.", HttpStatus.BAD_REQUEST);
            }
            throw new BusinessException("Invalid verification code.", HttpStatus.BAD_REQUEST);
        }

        // OTP is valid — mark record used and mark user emailVerified = true
        record.setUsed(true);
        record.setVerifiedAt(LocalDateTime.now());
        otpRepository.save(record);

        user.setEmailVerified(true);
        userRepository.save(user);

        log.info("Email verified successfully for user: {}", email);
        return new MessageResponse("Email verified successfully");
    }

    /**
     * Resends a verification OTP after enforcing a 60-second cooldown.
     *
     * @param request email address
     * @return MessageResponse confirming code sent
     */
    @Transactional
    public MessageResponse resendVerification(ResendVerificationRequest request) {
        String email = normalize(request.email());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Account not found.", HttpStatus.BAD_REQUEST));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BusinessException("Your email is already verified.", HttpStatus.BAD_REQUEST);
        }

        Optional<EmailVerificationOtp> existing = otpRepository.findByEmail(email);
        if (existing.isPresent()) {
            LocalDateTime cooldownEnd = existing.get().getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS);
            if (LocalDateTime.now().isBefore(cooldownEnd)) {
                throw new BusinessException("Please wait before requesting another code.", HttpStatus.TOO_MANY_REQUESTS);
            }
        }

        generateAndSendOtp(email);
        return new MessageResponse("Verification code sent to your email");
    }

    private String normalize(String email) {
        if (email == null) return "";
        return email.trim().toLowerCase();
    }
}
