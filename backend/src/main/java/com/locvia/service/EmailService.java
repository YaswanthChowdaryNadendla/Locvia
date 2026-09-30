package com.locvia.service;

/**
 * Service interface for transactional email delivery.
 */
public interface EmailService {

    /**
     * Sends an OTP verification email to the given recipient.
     * The raw OTP is embedded in the email body and must NEVER be logged.
     *
     * @param recipientEmail recipient email address
     * @param otp            raw 6-digit OTP
     */
    void sendOtpEmail(String recipientEmail, String otp);

    /**
     * Sends a 6-digit OTP for password recovery.
     *
     * @param toEmail recipient email address
     * @param otp     raw 6-digit OTP
     */
    void sendPasswordResetOtp(String toEmail, String otp);

    /**
     * Sends a 6-digit OTP for account registration email verification.
     *
     * @param toEmail recipient email address
     * @param otp     raw 6-digit OTP
     */
    void sendEmailVerificationOtp(String toEmail, String otp);
}
