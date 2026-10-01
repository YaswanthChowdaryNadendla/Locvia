package com.locvia.service;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;

@Disabled("Live integration test sending real emails via Gmail API - enable explicitly when testing credentials")
class RealGmailApiSendLiveTest {

    @Test
    @DisplayName("Live test: send two consecutive emails through Gmail API to test resend")
    void testRealEmailSendTwoConsecutive() {
        Map<String, String> env = loadDotEnv();
        String clientId = env.get("GOOGLE_GMAIL_CLIENT_ID");
        String clientSecret = env.get("GOOGLE_GMAIL_CLIENT_SECRET");
        String refreshToken = env.get("GOOGLE_GMAIL_REFRESH_TOKEN");
        String sender = env.get("GOOGLE_GMAIL_SENDER");

        if (clientId == null || clientSecret == null || refreshToken == null || sender == null) {
            System.err.println("Credentials missing in .env, skipping live send test");
            return;
        }

        GmailApiEmailService emailService = new GmailApiEmailService(
                clientId,
                clientSecret,
                refreshToken,
                sender
        );

        System.out.println("Initiating real Gmail API send #1 (Initial OTP)...");
        assertThatCode(() -> emailService.sendPasswordResetOtp(sender, "111111"))
                .doesNotThrowAnyException();
        System.out.println("SUCCESS! Gmail API accepted email #1.");

        System.out.println("Initiating real Gmail API send #2 (Resend OTP)...");
        assertThatCode(() -> emailService.sendPasswordResetOtp(sender, "222222"))
                .doesNotThrowAnyException();
        System.out.println("SUCCESS! Gmail API accepted email #2.");
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
