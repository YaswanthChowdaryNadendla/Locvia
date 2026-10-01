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

class RealGmailApiSendLiveTest {

    @Test
    @Disabled("Manual live verification test only - do not send emails in automated builds")
    @DisplayName("Live test: send real email through Gmail API using .env credentials")
    void testRealEmailSend() {
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

        System.out.println("Initiating real Gmail API send to " + sender + "...");
        assertThatCode(() -> emailService.sendPasswordResetOtp(sender, "654321"))
                .doesNotThrowAnyException();
        System.out.println("SUCCESS! Gmail API accepted the message.");
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
