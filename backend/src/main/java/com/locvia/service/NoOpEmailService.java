package com.locvia.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Temporary no-op placeholder implementation of EmailService.
 * Used as a minimal placeholder prior to Gmail API integration.
 */
@Service
public class NoOpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(NoOpEmailService.class);

    @Override
    public void sendOtpEmail(String recipientEmail, String otp) {
        log.info("EmailService placeholder: sendOtpEmail invoked for recipient: {}", recipientEmail);
    }

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        log.info("EmailService placeholder: sendPasswordResetOtp invoked for recipient: {}", toEmail);
    }

    @Override
    public void sendEmailVerificationOtp(String toEmail, String otp) {
        log.info("EmailService placeholder: sendEmailVerificationOtp invoked for recipient: {}", toEmail);
    }
}
