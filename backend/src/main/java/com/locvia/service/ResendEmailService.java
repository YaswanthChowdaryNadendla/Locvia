package com.locvia.service;

import com.locvia.exception.ExternalServiceException;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Email delivery service using the Resend Java SDK.
 * Handles transactional emails for the Locvia platform.
 *
 * Security rules:
 *  - The raw OTP must NEVER be logged at any level.
 *  - Only the result (success/failure) is logged — never the OTP or API key.
 */
@Service
public class ResendEmailService {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);

    private final Resend resend;
    private final String apiKey;
    private final String fromEmail;
    private final String fromName;

    public ResendEmailService(
            @Value("${resend.api-key}") String apiKey,
            @Value("${resend.from-email}") String fromEmail,
            @Value("${resend.from-name:Locvia}") String fromName) {
        this.resend = new Resend(apiKey);
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
    }

    /**
     * Sends a 6-digit OTP to the given email address for password recovery.
     * This method accepts the raw OTP string (digits only) for embedding in the email,
     * but does NOT log it.
     *
     * @param toEmail recipient email address
     * @param otp     raw 6-digit OTP (do not log this value)
     * @throws ExternalServiceException if the Resend API call fails
     */
    public void sendPasswordResetOtp(String toEmail, String otp) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Resend API key is not configured — skipping password reset email dispatch to: {}", toEmail);
            return;
        }

        String html = buildOtpEmailHtml(otp);

        CreateEmailOptions options = CreateEmailOptions.builder()
                .from(fromName + " <" + fromEmail + ">")
                .to(toEmail)
                .subject("Your Locvia Password Reset Code")
                .html(html)
                .build();

        try {
            resend.emails().send(options);
            log.info("Password reset OTP email dispatched to: {}", toEmail);
        } catch (ResendException e) {
            log.error("Resend API failure when sending OTP email to {}: {}", toEmail, e.getMessage());
            throw new ExternalServiceException("Failed to send password reset email. Please try again later.");
        }
    }

    /**
     * Sends a 6-digit OTP to the given email address for account registration verification.
     * This method accepts the raw OTP string (digits only) for embedding in the email,
     * but does NOT log it.
     *
     * @param toEmail recipient email address
     * @param otp     raw 6-digit OTP (do not log this value)
     * @throws ExternalServiceException if the Resend API call fails
     */
    public void sendEmailVerificationOtp(String toEmail, String otp) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Resend API key is not configured — skipping email verification dispatch to: {}", toEmail);
            return;
        }

        String html = buildVerificationEmailHtml(otp);

        CreateEmailOptions options = CreateEmailOptions.builder()
                .from(fromName + " <" + fromEmail + ">")
                .to(toEmail)
                .subject("Verify your Locvia email address")
                .html(html)
                .build();

        try {
            resend.emails().send(options);
            log.info("Email verification OTP email dispatched to: {}", toEmail);
        } catch (ResendException e) {
            log.error("Resend API failure when sending verification email to {}: {}", toEmail, e.getMessage());
            throw new ExternalServiceException("Failed to send verification email. Please try again later.");
        }
    }

    /**
     * Builds the HTML body for the OTP email.
     * The OTP is embedded inline — this method does not log the OTP.
     */
    private String buildOtpEmailHtml(String otp) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                  <title>Reset Your Locvia Password</title>
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
                              <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">Reset Your Password</h2>
                              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                                We received a request to reset your Locvia account password.
                                Use the code below — it expires in <strong>10 minutes</strong>.
                              </p>
                              <!-- OTP Box -->
                              <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:8px;
                                          padding:20px;text-align:center;margin-bottom:24px;">
                                <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#15803d;">
                                  %s
                                </span>
                              </div>
                              <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.5;">
                                If you did not request a password reset, you can safely ignore this email.
                                Your password will not change.
                              </p>
                            </td>
                          </tr>
                          <!-- Footer -->
                          <tr>
                            <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                              <p style="margin:0;font-size:12px;color:#9ca3af;">
                                &copy; 2025 Locvia &mdash; Local Delivery Platform
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(otp);
    }

    /**
     * Builds the HTML body for the account verification OTP email.
     * The OTP is embedded inline — this method does not log the OTP.
     */
    private String buildVerificationEmailHtml(String otp) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                  <title>Verify your Locvia email address</title>
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
                              <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">Verify Your Email Address</h2>
                              <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
                                Welcome to Locvia! Please verify your email address to activate your account.
                              </p>
                              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                                Your email verification code is:
                              </p>
                              <!-- OTP Box -->
                              <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:8px;
                                          padding:20px;text-align:center;margin-bottom:24px;">
                                <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#15803d;">
                                  %s
                                </span>
                              </div>
                              <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.5;">
                                This code expires in <strong>10 minutes</strong>.
                              </p>
                              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">
                                If you did not create a Locvia account, you can safely ignore this email.
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
                """.formatted(otp);
    }
}
