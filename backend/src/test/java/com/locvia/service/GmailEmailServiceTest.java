package com.locvia.service;

import com.locvia.exception.ExternalServiceException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GmailEmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private GmailEmailService gmailEmailService;

    private static final String SENDER_EMAIL = "locvia.project@gmail.com";
    private static final String SENDER_NAME = "Locvia";

    @BeforeEach
    void setUp() {
        gmailEmailService = new GmailEmailService(mailSender, SENDER_EMAIL, SENDER_NAME);
    }

    private MimeMessage createDummyMimeMessage() {
        return new MimeMessage(Session.getInstance(new Properties()));
    }

    @Test
    @DisplayName("1. sendOtpEmail constructs MimeMessage with correct recipient, subject, and OTP in body")
    void sendOtpEmail_ConstructsEmailWithCorrectDetails() throws Exception {
        MimeMessage mimeMessage = createDummyMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        String recipient = "customer@example.com";
        String otp = "123456";

        gmailEmailService.sendOtpEmail(recipient, otp);

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        assertThat(sentMessage.getAllRecipients()).hasSize(1);
        assertThat(sentMessage.getAllRecipients()[0].toString()).isEqualTo(recipient);
        assertThat(sentMessage.getSubject()).isEqualTo("Locvia - Your OTP");

        // Verify body contains Locvia branding and the OTP
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        sentMessage.writeTo(outputStream);
        String rawEmail = outputStream.toString(StandardCharsets.UTF_8);

        assertThat(rawEmail).contains(otp);
        assertThat(rawEmail).contains("Locvia");
        assertThat(rawEmail).contains("10 minutes");
    }

    @Test
    @DisplayName("2. sendPasswordResetOtp sets specific subject and includes OTP")
    void sendPasswordResetOtp_ConstructsCorrectMessage() throws Exception {
        MimeMessage mimeMessage = createDummyMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        String recipient = "reset@example.com";
        String otp = "987654";

        gmailEmailService.sendPasswordResetOtp(recipient, otp);

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        assertThat(sentMessage.getAllRecipients()[0].toString()).isEqualTo(recipient);
        assertThat(sentMessage.getSubject()).isEqualTo("Locvia - Your Password Reset Code");

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        sentMessage.writeTo(outputStream);
        String rawEmail = outputStream.toString(StandardCharsets.UTF_8);

        assertThat(rawEmail).contains(otp);
        assertThat(rawEmail).contains("Reset Your Password");
    }

    @Test
    @DisplayName("3. sendEmailVerificationOtp sets specific subject and includes OTP")
    void sendEmailVerificationOtp_ConstructsCorrectMessage() throws Exception {
        MimeMessage mimeMessage = createDummyMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        String recipient = "verify@example.com";
        String otp = "456789";

        gmailEmailService.sendEmailVerificationOtp(recipient, otp);

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(1)).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        assertThat(sentMessage.getAllRecipients()[0].toString()).isEqualTo(recipient);
        assertThat(sentMessage.getSubject()).isEqualTo("Locvia - Verify your email address");

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        sentMessage.writeTo(outputStream);
        String rawEmail = outputStream.toString(StandardCharsets.UTF_8);

        assertThat(rawEmail).contains(otp);
        assertThat(rawEmail).contains("Verify Your Email Address");
    }

    @Test
    @DisplayName("4. Blank sender email logs warning and skips dispatch without throwing")
    void whenSenderBlank_SkipsDispatch() {
        GmailEmailService serviceWithoutCredentials = new GmailEmailService(mailSender, "", "Locvia");

        serviceWithoutCredentials.sendOtpEmail("test@example.com", "123456");

        verify(mailSender, never()).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("5. MailSendException is wrapped in ExternalServiceException with safe message")
    void whenMailSenderThrows_WrapsInExternalServiceException() {
        MimeMessage mimeMessage = createDummyMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("SMTP connection refused")).when(mailSender).send(any(MimeMessage.class));

        assertThatThrownBy(() -> gmailEmailService.sendOtpEmail("customer@example.com", "123456"))
                .isInstanceOf(ExternalServiceException.class)
                .hasMessage("Failed to send OTP email. Please try again later.");
    }
}
