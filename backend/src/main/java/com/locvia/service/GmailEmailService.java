package com.locvia.service;

import com.locvia.exception.ExternalServiceException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

/**
 * Transactional email service using Gmail SMTP via Spring Boot's JavaMailSender.
 *
 * Security rules:
 *  - Raw OTPs must NEVER be logged at any level.
 *  - SMTP passwords and App Passwords must NEVER be logged, exposed in exceptions, or committed.
 *  - Only the outcome (dispatched / failed) is logged.
 */
@Service
public class GmailEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(GmailEmailService.class);

    private final JavaMailSender mailSender;
    private final String mailUsername;
    private final String fromName;

    public GmailEmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${locvia.mail.from-name:Locvia}") String fromName) {
        this.mailSender = mailSender;
        this.mailUsername = mailUsername;
        this.fromName = fromName;
    }

    /**
     * Sends an OTP verification email to the given recipient.
     *
     * @param recipientEmail recipient email address
     * @param otp            raw 6-digit OTP (never logged)
     */
    @Override
    public void sendOtpEmail(String recipientEmail, String otp) {
        sendOtpEmailInternal(recipientEmail, otp, "Locvia - Your OTP", "verification");
    }

    /**
     * Sends a 6-digit OTP for password recovery.
     *
     * @param toEmail recipient email address
     * @param otp     raw 6-digit OTP (never logged)
     */
    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        sendOtpEmailInternal(toEmail, otp, "Locvia - Your Password Reset Code", "password_reset");
    }

    /**
     * Sends a 6-digit OTP for account registration email verification.
     *
     * @param toEmail recipient email address
     * @param otp     raw 6-digit OTP (never logged)
     */
    @Override
    public void sendEmailVerificationOtp(String toEmail, String otp) {
        sendOtpEmailInternal(toEmail, otp, "Locvia - Verify your email address", "signup_verification");
    }

    private void sendOtpEmailInternal(String recipientEmail, String otp, String subject, String type) {
        if (mailUsername == null || mailUsername.isBlank()) {
            log.warn("Gmail SMTP username is not configured — skipping email dispatch to: {}", recipientEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            try {
                helper.setFrom(mailUsername, fromName);
            } catch (UnsupportedEncodingException e) {
                helper.setFrom(mailUsername);
            }

            helper.setTo(recipientEmail);
            helper.setSubject(subject);

            String textBody = buildPlainTextBody(otp, type);
            String htmlBody = buildHtmlBody(otp, type);
            helper.setText(textBody, htmlBody);

            mailSender.send(message);
            log.info("OTP email successfully dispatched to: {}", recipientEmail);
        } catch (MailException | MessagingException e) {
            log.error("Failed to send OTP email to {}: {}", recipientEmail, e.getClass().getSimpleName());
            throw new ExternalServiceException("Failed to send OTP email. Please try again later.");
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", recipientEmail, e.getClass().getSimpleName());
            throw new ExternalServiceException("Failed to send OTP email. Please try again later.");
        }
    }

    private String buildPlainTextBody(String otp, String type) {
        String purpose = switch (type) {
            case "password_reset" -> "password reset";
            case "signup_verification" -> "email verification";
            default -> "verification";
        };

        return """
                Hello,

                Your Locvia %s code is:

                %s

                This OTP is valid for 10 minutes.

                If you did not request this code, please ignore this email.

                Regards,
                Locvia Team
                """.formatted(purpose, otp);
    }

    private String buildHtmlBody(String otp, String type) {
        String heading = switch (type) {
            case "password_reset" -> "Reset Your Password";
            case "signup_verification" -> "Verify Your Email Address";
            default -> "Your Verification Code";
        };

        String intro = switch (type) {
            case "password_reset" -> "We received a request to reset your Locvia account password. Use the code below &mdash; it expires in <strong>10 minutes</strong>.";
            case "signup_verification" -> "Welcome to Locvia! Please verify your email address to activate your account. Your code expires in <strong>10 minutes</strong>.";
            default -> "Use the verification code below to proceed with your Locvia request. This code expires in <strong>10 minutes</strong>.";
        };

        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                  <title>Locvia - Verification Code</title>
                </head>
                <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
                    <tr>
                      <td align="center">
                        <table width="480" cellpadding="0" cellspacing="0"
                               style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                          <!-- Header -->
                          <tr>
                            <td style="background:#16a34a;padding:24px 32px;text-align:center;">
                              <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                                Loc<span style="color:#bbf7d0;">via</span>
                              </span>
                            </td>
                          </tr>
                          <!-- Body -->
                          <tr>
                            <td style="padding:36px 32px 24px;">
                              <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">%s</h2>
                              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                                %s
                              </p>
                              <!-- OTP Box -->
                              <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:8px;
                                          padding:20px;text-align:center;margin-bottom:24px;">
                                <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#15803d;">
                                  %s
                                </span>
                              </div>
                              <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.5;">
                                This OTP is valid for 10 minutes. If you did not request this code, please ignore this email.
                              </p>
                              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">
                                Regards,<br/>
                                <strong>Locvia Team</strong>
                              </p>
                            </td>
                          </tr>
                          <!-- Footer -->
                          <tr>
                            <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;">
                                &copy; 2026 Locvia &mdash; Local Delivery Platform
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(heading, intro, otp);
    }
}
