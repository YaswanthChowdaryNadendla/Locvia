package com.locvia.service;

import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.locvia.exception.ExternalServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GmailApiEmailServiceTest {

    @Mock
    private Gmail gmail;

    @Mock
    private Gmail.Users users;

    @Mock
    private Gmail.Users.Messages messages;

    @Mock
    private Gmail.Users.Messages.Send send;

    private GmailApiEmailService gmailApiEmailService;

    private static final String CLIENT_ID = "test-client-id.apps.googleusercontent.com";
    private static final String CLIENT_SECRET = "test-client-secret";
    private static final String REFRESH_TOKEN = "1//test-refresh-token";
    private static final String SENDER_EMAIL = "noreply@locvia.com";

    @BeforeEach
    void setUp() {
        gmailApiEmailService = new GmailApiEmailService(
                CLIENT_ID,
                CLIENT_SECRET,
                REFRESH_TOKEN,
                SENDER_EMAIL,
                gmail
        );
    }

    private void setupMockSendSuccess() throws IOException {
        when(gmail.users()).thenReturn(users);
        when(users.messages()).thenReturn(messages);
        when(messages.send(eq("me"), any(Message.class))).thenReturn(send);
        when(send.execute()).thenReturn(new Message().setId("msg_12345"));
    }

    @Test
    @DisplayName("1. GmailApiEmailService is created and configuration is read correctly")
    void serviceInitialization_ConfigurationReadCorrectly() {
        assertThat(gmailApiEmailService.getClientId()).isEqualTo(CLIENT_ID);
        assertThat(gmailApiEmailService.getSenderEmail()).isEqualTo(SENDER_EMAIL);
        assertThat(gmailApiEmailService.isConfigured()).isTrue();
    }

    @Test
    @DisplayName("2. sendOtpEmail creates MIME message with correct recipient, sender, subject, and OTP")
    void sendOtpEmail_ConstructsEmailWithCorrectDetails() throws Exception {
        setupMockSendSuccess();

        String recipient = "customer@example.com";
        String otp = "123456";

        gmailApiEmailService.sendOtpEmail(recipient, otp);

        ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
        verify(messages, times(1)).send(eq("me"), captor.capture());
        verify(send, times(1)).execute();

        Message sentMessage = captor.getValue();
        assertThat(sentMessage.getRaw()).isNotNull();

        byte[] decodedBytes = Base64.getUrlDecoder().decode(sentMessage.getRaw());
        String rawEmail = new String(decodedBytes, StandardCharsets.UTF_8);

        assertThat(rawEmail).contains("To: " + recipient);
        assertThat(rawEmail).contains("From: Locvia <" + SENDER_EMAIL + ">");
        assertThat(rawEmail).contains("Subject: Locvia - Your OTP");
        assertThat(rawEmail).contains(otp);
        assertThat(rawEmail).contains("MIME-Version: 1.0");
        assertThat(rawEmail).contains("Content-Type: multipart/alternative");
    }

    @Test
    @DisplayName("3. sendPasswordResetOtp sets password reset subject and includes OTP")
    void sendPasswordResetOtp_ConstructsCorrectMessage() throws Exception {
        setupMockSendSuccess();

        String recipient = "reset@example.com";
        String otp = "987654";

        gmailApiEmailService.sendPasswordResetOtp(recipient, otp);

        ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
        verify(messages, times(1)).send(eq("me"), captor.capture());
        verify(send, times(1)).execute();

        Message sentMessage = captor.getValue();
        byte[] decodedBytes = Base64.getUrlDecoder().decode(sentMessage.getRaw());
        String rawEmail = new String(decodedBytes, StandardCharsets.UTF_8);

        assertThat(rawEmail).contains("To: " + recipient);
        assertThat(rawEmail).contains("Subject: Locvia - Your Password Reset Code");
        assertThat(rawEmail).contains(otp);
        assertThat(rawEmail).contains("Reset Your Password");
    }

    @Test
    @DisplayName("4. sendEmailVerificationOtp sets email verification subject and includes OTP")
    void sendEmailVerificationOtp_ConstructsCorrectMessage() throws Exception {
        setupMockSendSuccess();

        String recipient = "verify@example.com";
        String otp = "456789";

        gmailApiEmailService.sendEmailVerificationOtp(recipient, otp);

        ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
        verify(messages, times(1)).send(eq("me"), captor.capture());
        verify(send, times(1)).execute();

        Message sentMessage = captor.getValue();
        byte[] decodedBytes = Base64.getUrlDecoder().decode(sentMessage.getRaw());
        String rawEmail = new String(decodedBytes, StandardCharsets.UTF_8);

        assertThat(rawEmail).contains("To: " + recipient);
        assertThat(rawEmail).contains("Subject: Locvia - Verify your email address");
        assertThat(rawEmail).contains(otp);
        assertThat(rawEmail).contains("Verify Your Email Address");
    }

    @Test
    @DisplayName("5. Blank sender email logs warning and skips dispatch without calling Gmail API")
    void whenSenderBlank_SkipsDispatch() {
        GmailApiEmailService serviceWithoutSender = new GmailApiEmailService(
                CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, "", gmail);

        serviceWithoutSender.sendOtpEmail("test@example.com", "123456");

        verifyNoInteractions(gmail);
    }

    @Test
    @DisplayName("6. Gmail API failure is wrapped in ExternalServiceException with safe message")
    void whenGmailApiThrows_WrapsInExternalServiceException() throws Exception {
        when(gmail.users()).thenReturn(users);
        when(users.messages()).thenReturn(messages);
        when(messages.send(eq("me"), any(Message.class))).thenReturn(send);
        when(send.execute()).thenThrow(new IOException("Gmail API service unavailable"));

        assertThatThrownBy(() -> gmailApiEmailService.sendOtpEmail("customer@example.com", "123456"))
                .isInstanceOf(ExternalServiceException.class)
                .hasMessage("Failed to send OTP email. Please try again later.");
    }
}
