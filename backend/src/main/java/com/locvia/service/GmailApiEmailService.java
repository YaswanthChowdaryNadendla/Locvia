package com.locvia.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.UserCredentials;
import com.locvia.exception.ExternalServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.UUID;

/**
 * Production implementation of EmailService using Google's Gmail API (users.messages.send).
 * Authenticates via OAuth 2.0 refresh token with scope https://www.googleapis.com/auth/gmail.send.
 *
 * Security rules:
 * - Refresh tokens, client secrets, and access tokens are never logged or exposed.
 * - Raw OTP values are never logged at any level.
 * - All external failures are safely mapped to ExternalServiceException.
 */
@Service
@Primary
public class GmailApiEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(GmailApiEmailService.class);

    private static final String APPLICATION_NAME = "Locvia";
    private static final String SENDER_NAME = "Locvia";

    private final String clientId;
    private final String clientSecret;
    private final String refreshToken;
    private final String senderEmail;

    private volatile Gmail gmailClient;

    @Autowired
    public GmailApiEmailService(
            @Value("${locvia.gmail.client-id:}") String clientId,
            @Value("${locvia.gmail.client-secret:}") String clientSecret,
            @Value("${locvia.gmail.refresh-token:}") String refreshToken,
            @Value("${locvia.gmail.sender:}") String senderEmail) {
        this(clientId, clientSecret, refreshToken, senderEmail, null);
    }

    public GmailApiEmailService(
            String clientId,
            String clientSecret,
            String refreshToken,
            String senderEmail,
            Gmail gmailClient) {
        this.clientId = clientId != null ? clientId.trim() : "";
        this.clientSecret = clientSecret != null ? clientSecret.trim() : "";
        this.refreshToken = refreshToken != null ? refreshToken.trim() : "";
        this.senderEmail = senderEmail != null ? senderEmail.trim() : "";
        this.gmailClient = gmailClient;
    }

    @Override
    public void sendOtpEmail(String recipientEmail, String otp) {
        sendEmail(recipientEmail, otp, "otp", "Locvia - Your OTP");
    }

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        sendEmail(toEmail, otp, "password_reset", "Locvia - Your Password Reset Code");
    }

    @Override
    public void sendEmailVerificationOtp(String toEmail, String otp) {
        sendEmail(toEmail, otp, "signup_verification", "Locvia - Verify your email address");
    }

    private void sendEmail(String recipientEmail, String otp, String type, String subject) {
        if (senderEmail.isBlank()) {
            log.warn("Gmail sender email is not configured. Skipping email dispatch.");
            return;
        }

        if (this.gmailClient == null && (clientId.isBlank() || clientSecret.isBlank() || refreshToken.isBlank())) {
            log.warn("Gmail API OAuth credentials are not fully configured. Skipping email dispatch.");
            return;
        }

        try {
            String plainText = buildPlainTextBody(otp, type);
            String html = buildHtmlBody(otp, type);
            String rawMime = buildMimeMessage(senderEmail, recipientEmail, subject, plainText, html);

            Message message = createGmailMessage(rawMime);

            Gmail service = getGmailService();
            service.users().messages().send("me", message).execute();

            log.info("Email [{}] successfully sent via Gmail API to recipient: {}", subject, recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send email via Gmail API to recipient {}: [{}]: {}",
                    recipientEmail,
                    e.getClass().getName(),
                    sanitize(e.getMessage(), otp));
            throw new ExternalServiceException("Failed to send OTP email. Please try again later.", e);
        }
    }

    protected synchronized Gmail getGmailService() throws GeneralSecurityException, IOException {
        if (this.gmailClient != null) {
            return this.gmailClient;
        }

        UserCredentials credentials = UserCredentials.newBuilder()
                .setClientId(clientId)
                .setClientSecret(clientSecret)
                .setRefreshToken(refreshToken)
                .build();

        HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(credentials);

        this.gmailClient = new Gmail.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                requestInitializer)
                .setApplicationName(APPLICATION_NAME)
                .build();

        return this.gmailClient;
    }

    private Message createGmailMessage(String rawMime) {
        byte[] bytes = rawMime.getBytes(StandardCharsets.UTF_8);
        String encodedEmail = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Message message = new Message();
        message.setRaw(encodedEmail);
        return message;
    }

    private String buildMimeMessage(String sender, String recipient, String subject, String plainText, String html) {
        String boundary = "=_locvia_" + UUID.randomUUID().toString().replace("-", "");
        String fromHeader = formatFromHeader(sender);
        String dateHeader = DateTimeFormatter.RFC_1123_DATE_TIME.format(ZonedDateTime.now());

        StringBuilder sb = new StringBuilder();
        sb.append("From: ").append(fromHeader).append("\r\n");
        sb.append("To: ").append(recipient).append("\r\n");
        sb.append("Date: ").append(dateHeader).append("\r\n");
        sb.append("Subject: ").append(subject).append("\r\n");
        sb.append("MIME-Version: 1.0\r\n");
        sb.append("Content-Type: multipart/alternative; boundary=\"").append(boundary).append("\"\r\n\r\n");

        // Plain text part
        sb.append("--").append(boundary).append("\r\n");
        sb.append("Content-Type: text/plain; charset=UTF-8\r\n");
        sb.append("Content-Transfer-Encoding: 7bit\r\n\r\n");
        sb.append(plainText).append("\r\n\r\n");

        // HTML part
        sb.append("--").append(boundary).append("\r\n");
        sb.append("Content-Type: text/html; charset=UTF-8\r\n");
        sb.append("Content-Transfer-Encoding: 7bit\r\n\r\n");
        sb.append(html).append("\r\n\r\n");

        // Closing boundary
        sb.append("--").append(boundary).append("--\r\n");

        return sb.toString();
    }

    private String formatFromHeader(String sender) {
        if (sender.contains("<") && sender.contains(">")) {
            return sender;
        }
        return SENDER_NAME + " <" + sender + ">";
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

    private String sanitize(String message, String otp) {
        if (message == null) {
            return "No message";
        }
        String sanitized = message;
        if (clientSecret != null && !clientSecret.isBlank()) {
            sanitized = sanitized.replace(clientSecret, "[PROTECTED_SECRET]");
        }
        if (refreshToken != null && !refreshToken.isBlank()) {
            sanitized = sanitized.replace(refreshToken, "[PROTECTED_REFRESH_TOKEN]");
        }
        if (otp != null && !otp.isBlank()) {
            sanitized = sanitized.replace(otp, "[PROTECTED_OTP]");
        }
        return sanitized;
    }

    public String getClientId() {
        return clientId;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public boolean isConfigured() {
        return !clientId.isBlank() && !clientSecret.isBlank() && !refreshToken.isBlank() && !senderEmail.isBlank();
    }
}
