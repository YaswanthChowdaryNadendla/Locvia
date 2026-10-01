package com.locvia.service;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.UserCredentials;
import com.locvia.dto.ForgotPasswordRequest;
import com.locvia.entity.PasswordResetOtp;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.PasswordResetOtpRepository;
import com.locvia.repository.UserRepository;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Disabled("Live integration test sending real emails via Gmail API - enable explicitly when testing credentials")
class RealGmailApiSendLiveTest {

    private static final String SUBJECT = "Locvia Gmail API Diagnostic Test";
    private static final String BODY = "This is a diagnostic email sent by the Locvia Gmail API integration.\n" +
            "No password reset code or credential is included.";

    @Test
    @DisplayName("Live test: Verify OAuth refresh token and send dummy diagnostic emails to recipients")
    void testGmailApiDiagnostic() {
        Map<String, String> env = loadDotEnv();
        String clientId = env.get("GOOGLE_GMAIL_CLIENT_ID");
        String clientSecret = env.get("GOOGLE_GMAIL_CLIENT_SECRET");
        String refreshToken = env.get("GOOGLE_GMAIL_REFRESH_TOKEN");
        String sender = env.get("GOOGLE_GMAIL_SENDER");

        if (clientId == null || clientSecret == null || refreshToken == null || sender == null) {
            System.err.println("Credentials missing in .env, skipping live send test");
            return;
        }

        // 1. Verify OAuth token refresh
        try {
            UserCredentials credentials = UserCredentials.newBuilder()
                    .setClientId(clientId)
                    .setClientSecret(clientSecret)
                    .setRefreshToken(refreshToken)
                    .build();

            AccessToken token = credentials.refreshAccessToken();
            if (token != null && token.getTokenValue() != null && !token.getTokenValue().isBlank()) {
                System.out.println("OAuth token refresh: SUCCESS");
            } else {
                System.out.println("OAuth token refresh: FAILED — No access token returned");
            }
        } catch (Exception e) {
            System.out.println("OAuth token refresh: FAILED — " + e.getMessage());
        }

        // 2. Initialize GmailApiEmailService
        GmailApiEmailService emailService = new GmailApiEmailService(
                clientId,
                clientSecret,
                refreshToken,
                sender
        );

        // 3. Send dummy email to recipient #1: nyeswanthchowdary5@gmail.com
        sendDiagnostic(emailService, "nyeswanthchowdary5@gmail.com");

        // 4. Send dummy email to recipient #2: nyaswanth5115@gmail.com
        sendDiagnostic(emailService, "nyaswanth5115@gmail.com");
    }

    @Test
    @DisplayName("Live test: Verify actual production PasswordResetService -> GmailApiEmailService -> Gmail API")
    void testProductionPasswordResetAndResend() {
        Map<String, String> env = loadDotEnv();
        String clientId = env.get("GOOGLE_GMAIL_CLIENT_ID");
        String clientSecret = env.get("GOOGLE_GMAIL_CLIENT_SECRET");
        String refreshToken = env.get("GOOGLE_GMAIL_REFRESH_TOKEN");
        String sender = env.get("GOOGLE_GMAIL_SENDER");

        if (clientId == null || clientSecret == null || refreshToken == null || sender == null) {
            System.err.println("Credentials missing in .env, skipping live send test");
            return;
        }

        GmailApiEmailService realEmailService = new GmailApiEmailService(
                clientId,
                clientSecret,
                refreshToken,
                sender
        );

        UserRepository mockUserRepo = mock(UserRepository.class);
        PasswordResetOtpRepository mockOtpRepo = mock(PasswordResetOtpRepository.class);
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        User user = new User("Yeswanth", sender, "9999999999", encoder.encode("DummyPass123!"), UserRole.CUSTOMER);
        when(mockUserRepo.findByEmail(eq(sender))).thenReturn(Optional.of(user));

        PasswordResetService resetService = new PasswordResetService(
                mockUserRepo,
                mockOtpRepo,
                encoder,
                realEmailService
        );

        // 1. Production Password Reset Request (Initial OTP)
        try {
            when(mockOtpRepo.findByEmail(eq(sender))).thenReturn(Optional.empty());
            resetService.requestOtp(new ForgotPasswordRequest(sender));
            System.out.println("Password reset email: ACCEPTED BY GMAIL API");
        } catch (Exception e) {
            System.out.println("Password reset email: FAILED — " + extractSafeError(e));
        }

        // 2. Production Resend Request (after 65s cooldown)
        try {
            PasswordResetOtp existingOtp = new PasswordResetOtp();
            existingOtp.setEmail(sender);
            existingOtp.setCreatedAt(LocalDateTime.now().minusSeconds(65));
            when(mockOtpRepo.findByEmail(eq(sender))).thenReturn(Optional.of(existingOtp));

            resetService.requestOtp(new ForgotPasswordRequest(sender));
            System.out.println("Production resend email: ACCEPTED BY GMAIL API");
        } catch (Exception e) {
            System.out.println("Production resend email: FAILED — " + extractSafeError(e));
        }
    }

    private void sendDiagnostic(GmailApiEmailService emailService, String recipient) {
        try {
            emailService.sendDiagnosticEmail(recipient, SUBJECT, BODY);
            System.out.println(recipient + " | ACCEPTED");
        } catch (Exception e) {
            System.out.println(recipient + " | FAILED — " + extractSafeError(e));
        }
    }

    private String extractSafeError(Throwable t) {
        Throwable curr = t;
        while (curr != null) {
            if (curr instanceof com.google.api.client.googleapis.json.GoogleJsonResponseException gjre) {
                return gjre.getStatusCode() + " " + (gjre.getDetails() != null ? gjre.getDetails().getMessage() : gjre.getMessage());
            }
            curr = curr.getCause();
        }
        return t.getMessage();
    }

    private Map<String, String> loadDotEnv() {
        Map<String, String> map = new HashMap<>();
        File envFile = new File(".env");
        if (!envFile.exists()) {
            envFile = new File("backend/.env");
        }
        if (envFile.exists() && envFile.isFile()) {
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                        continue;
                    }
                    int idx = line.indexOf('=');
                    map.put(line.substring(0, idx).trim(), line.substring(idx + 1).trim());
                }
            } catch (Exception ignored) {
            }
        }
        return map;
    }
}
