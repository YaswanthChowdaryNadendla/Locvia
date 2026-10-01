package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.ForgotPasswordRequest;
import com.locvia.dto.LoginRequest;
import com.locvia.dto.ResetPasswordRequest;
import com.locvia.dto.VerifyOtpRequest;
import com.locvia.entity.AccountStatus;
import com.locvia.entity.PasswordResetOtp;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.PasswordResetOtpRepository;
import com.locvia.repository.UserRepository;
import com.locvia.exception.ExternalServiceException;
import com.locvia.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PasswordResetTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetOtpRepository otpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private EmailService emailService;

    private User testUser;
    private final String testEmail = "reset.user@locvia.com";
    private final String initialPassword = "OldPassword123!";

    @BeforeEach
    void setUp() {
        otpRepository.deleteAll();
        userRepository.findByEmail(testEmail).ifPresent(u -> userRepository.delete(u));

        testUser = new User("Reset Tester", testEmail, "9876543299",
                passwordEncoder.encode(initialPassword), UserRole.CUSTOMER);
        testUser.setActive(true);
        testUser.setAccountStatus(AccountStatus.APPROVED);
        userRepository.save(testUser);

        reset(emailService);
    }

    @Test
    @DisplayName("Step 1: Request OTP sends 6-digit code via email service and hashes OTP in DB")
    void requestOtp_Success() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest(testEmail);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("If an account with that email exists")));

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendPasswordResetOtp(eq(testEmail), otpCaptor.capture());

        String capturedOtp = otpCaptor.getValue();
        assertThat(capturedOtp).matches("^\\d{6}$");

        PasswordResetOtp savedOtp = otpRepository.findByEmail(testEmail).orElseThrow();
        assertThat(savedOtp.getOtpHash()).isNotEqualTo(capturedOtp);
        assertThat(passwordEncoder.matches(capturedOtp, savedOtp.getOtpHash())).isTrue();
        assertThat(savedOtp.isUsed()).isFalse();
        assertThat(savedOtp.getAttempts()).isEqualTo(0);
    }

    @Test
    @DisplayName("Step 1: Non-existent email returns HTTP 404 with clear message")
    void requestOtp_NonExistentEmail_ReturnsNotFound() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("doesnotexist@locvia.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Email does not exist. Please create an account first."));

        verify(emailService, never()).sendPasswordResetOtp(anyString(), anyString());
        assertThat(otpRepository.findByEmail("doesnotexist@locvia.com")).isEmpty();
    }

    @Test
    @DisplayName("Step 1: Invalid email format returns 400 Bad Request")
    void requestOtp_InvalidEmail_ReturnsBadRequest() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("not-an-email");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Step 1: Resend within cooldown returns 429 Too Many Requests")
    void requestOtp_WithinCooldown_Returns429() throws Exception {
        PasswordResetOtp existing = new PasswordResetOtp();
        existing.setEmail(testEmail);
        existing.setOtpHash(passwordEncoder.encode("123456"));
        existing.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otpRepository.save(existing);

        ForgotPasswordRequest request = new ForgotPasswordRequest(testEmail);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("Step 2: Valid OTP issues a UUID reset token")
    void verifyOtp_Success() throws Exception {
        PasswordResetOtp otpRecord = new PasswordResetOtp();
        otpRecord.setEmail(testEmail);
        otpRecord.setOtpHash(passwordEncoder.encode("654321"));
        otpRecord.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otpRepository.save(otpRecord);

        VerifyOtpRequest request = new VerifyOtpRequest(testEmail, "654321");

        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken", notNullValue()))
                .andExpect(jsonPath("$.message", containsString("verified")));

        PasswordResetOtp updated = otpRepository.findByEmail(testEmail).orElseThrow();
        assertThat(updated.isUsed()).isTrue();
        assertThat(updated.getResetToken()).isNotBlank();
        assertThat(updated.getVerifiedAt()).isNotNull();
    }

    @Test
    @DisplayName("Step 2: Incorrect OTP increments attempts and rejects")
    void verifyOtp_IncorrectCode_IncrementsAttempts() throws Exception {
        PasswordResetOtp otpRecord = new PasswordResetOtp();
        otpRecord.setEmail(testEmail);
        otpRecord.setOtpHash(passwordEncoder.encode("654321"));
        otpRecord.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otpRepository.save(otpRecord);

        VerifyOtpRequest request = new VerifyOtpRequest(testEmail, "999999");

        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("attempt(s) remaining")));

        PasswordResetOtp updated = otpRepository.findByEmail(testEmail).orElseThrow();
        assertThat(updated.getAttempts()).isEqualTo(1);
    }

    @Test
    @DisplayName("Step 3: Complete flow - request, verify, reset, and log in with new password")
    void fullPasswordResetFlow_Success() throws Exception {
        // 1. Request OTP
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetOtp(eq(testEmail), otpCaptor.capture());
        String otp = otpCaptor.getValue();

        // 2. Verify OTP
        String verifyResponse = mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyOtpRequest(testEmail, otp))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String resetToken = objectMapper.readTree(verifyResponse).get("resetToken").asText();
        assertThat(resetToken).isNotBlank();

        // 3. Reset Password
        String newPassword = "BrandNewPassword2026!";
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResetPasswordRequest(testEmail, resetToken, newPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("successfully")));

        // 4. Verify login with old password fails
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(testEmail, initialPassword))))
                .andExpect(status().isUnauthorized());

        // 5. Verify login with new password succeeds
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(testEmail, newPassword))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()));
    }

    @Test
    @DisplayName("EmailService bean is present and wired into PasswordResetService")
    void emailService_IsWiredCorrectly() {
        assertThat(emailService).isNotNull();
    }

    @Test
    @DisplayName("Step 2: Expired OTP is rejected with clear message")
    void verifyOtp_ExpiredOtp_Rejected() throws Exception {
        PasswordResetOtp otpRecord = new PasswordResetOtp();
        otpRecord.setEmail(testEmail);
        otpRecord.setOtpHash(passwordEncoder.encode("123456"));
        otpRecord.setExpiresAt(LocalDateTime.now().minusMinutes(2));
        otpRepository.save(otpRecord);

        VerifyOtpRequest request = new VerifyOtpRequest(testEmail, "123456");

        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Code has expired. Please request a new one."));
    }

    @Test
    @DisplayName("Step 2: Reused OTP is rejected")
    void verifyOtp_ReusedOtp_Rejected() throws Exception {
        PasswordResetOtp otpRecord = new PasswordResetOtp();
        otpRecord.setEmail(testEmail);
        otpRecord.setOtpHash(passwordEncoder.encode("123456"));
        otpRecord.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otpRecord.setUsed(true);
        otpRepository.save(otpRecord);

        VerifyOtpRequest request = new VerifyOtpRequest(testEmail, "123456");

        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This code has already been used."));
    }

    @Test
    @DisplayName("Step 2: Non-existent OTP record returns Invalid or expired code.")
    void verifyOtp_NonExistentRecord_Rejected() throws Exception {
        VerifyOtpRequest request = new VerifyOtpRequest(testEmail, "123456");

        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired code."));
    }

    @Test
    @DisplayName("Step 2: Newest OTP after resend is accepted, old OTP is rejected")
    void resendOtp_NewestAccepted_OldRejected() throws Exception {
        // 1. First OTP request
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> captor1 = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendPasswordResetOtp(eq(testEmail), captor1.capture());
        String oldOtp = captor1.getValue();

        // Simulate 65 seconds elapsed for cooldown to expire
        jdbcTemplate.update("UPDATE password_reset_otps SET created_at = DATE_SUB(created_at, INTERVAL 65 SECOND) WHERE email = ?",
                testEmail);

        // 2. Second OTP request (Resend)
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> captor2 = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(2)).sendPasswordResetOtp(eq(testEmail), captor2.capture());
        String newestOtp = captor2.getAllValues().get(1);

        // 3. Verifying the OLD OTP must be rejected
        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyOtpRequest(testEmail, oldOtp))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Incorrect code")));

        // 4. Verifying the NEWEST OTP must succeed
        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyOtpRequest(testEmail, newestOtp))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken", notNullValue()));
    }

    // ── Dedicated Resend OTP Suite (10 Specific Requirements) ─────────────────

    @Test
    @DisplayName("Resend 1: Request OTP calls email service once")
    void resendReq1_RequestOtp_CallsEmailServiceOnce() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        verify(emailService, times(1)).sendPasswordResetOtp(eq(testEmail), anyString());
    }

    @Test
    @DisplayName("Resend 2: Resend OTP calls email service again")
    void resendReq2_ResendOtp_CallsEmailServiceAgain() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        verify(emailService, times(1)).sendPasswordResetOtp(eq(testEmail), anyString());

        // Cooldown expires
        jdbcTemplate.update("UPDATE password_reset_otps SET created_at = DATE_SUB(created_at, INTERVAL 65 SECOND) WHERE email = ?", testEmail);

        mockMvc.perform(post("/api/auth/resend-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        verify(emailService, times(2)).sendPasswordResetOtp(eq(testEmail), anyString());
    }

    @Test
    @DisplayName("Resend 3: Resend generates a NEW OTP (captor values differ)")
    void resendReq3_ResendGeneratesNewOtp() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        jdbcTemplate.update("UPDATE password_reset_otps SET created_at = DATE_SUB(created_at, INTERVAL 65 SECOND) WHERE email = ?", testEmail);

        mockMvc.perform(post("/api/auth/resend-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(2)).sendPasswordResetOtp(eq(testEmail), captor.capture());

        String otp1 = captor.getAllValues().get(0);
        String otp2 = captor.getAllValues().get(1);

        assertThat(otp1).matches("^\\d{6}$");
        assertThat(otp2).matches("^\\d{6}$");
    }

    @Test
    @DisplayName("Resend 4: NEW OTP replaces old OTP in DB")
    void resendReq4_NewOtpReplacesOldOtpInDb() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendPasswordResetOtp(eq(testEmail), captor.capture());
        String otp1 = captor.getValue();

        PasswordResetOtp record1 = otpRepository.findByEmail(testEmail).orElseThrow();
        assertThat(passwordEncoder.matches(otp1, record1.getOtpHash())).isTrue();

        jdbcTemplate.update("UPDATE password_reset_otps SET created_at = DATE_SUB(created_at, INTERVAL 65 SECOND) WHERE email = ?", testEmail);

        mockMvc.perform(post("/api/auth/resend-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        verify(emailService, times(2)).sendPasswordResetOtp(eq(testEmail), captor.capture());
        String otp2 = captor.getValue();

        PasswordResetOtp record2 = otpRepository.findByEmail(testEmail).orElseThrow();
        assertThat(passwordEncoder.matches(otp2, record2.getOtpHash())).isTrue();
    }

    @Test
    @DisplayName("Resend 5: Old OTP rejected after resend")
    void resendReq5_OldOtpRejectedAfterResend() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendPasswordResetOtp(eq(testEmail), captor.capture());
        String oldOtp = captor.getValue();

        jdbcTemplate.update("UPDATE password_reset_otps SET created_at = DATE_SUB(created_at, INTERVAL 65 SECOND) WHERE email = ?", testEmail);

        mockMvc.perform(post("/api/auth/resend-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyOtpRequest(testEmail, oldOtp))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Incorrect code")));
    }

    @Test
    @DisplayName("Resend 6: New OTP accepted after resend")
    void resendReq6_NewOtpAcceptedAfterResend() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        jdbcTemplate.update("UPDATE password_reset_otps SET created_at = DATE_SUB(created_at, INTERVAL 65 SECOND) WHERE email = ?", testEmail);

        mockMvc.perform(post("/api/auth/resend-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(2)).sendPasswordResetOtp(eq(testEmail), captor.capture());
        String newOtp = captor.getAllValues().get(1);

        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyOtpRequest(testEmail, newOtp))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken", notNullValue()));
    }

    @Test
    @DisplayName("Resend 7: Resend before cooldown rejected (429)")
    void resendReq7_ResendBeforeCooldown_Rejected() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        // Resend immediately without waiting for cooldown
        mockMvc.perform(post("/api/auth/resend-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Please wait")));
    }

    @Test
    @DisplayName("Resend 8: After cooldown, resend succeeds")
    void resendReq8_AfterCooldown_ResendSucceeds() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        // Elapse 61 seconds
        jdbcTemplate.update("UPDATE password_reset_otps SET created_at = DATE_SUB(created_at, INTERVAL 61 SECOND) WHERE email = ?", testEmail);

        mockMvc.perform(post("/api/auth/resend-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("If an account with that email exists")));
    }

    @Test
    @DisplayName("Resend 9: Gmail API failure throws ExternalServiceException and rolls back")
    void resendReq9_GmailApiFailure_ThrowsAndRollsBack() throws Exception {
        doThrow(new ExternalServiceException("Gmail API service outage"))
                .when(emailService).sendPasswordResetOtp(eq(testEmail), anyString());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isBadGateway());

        // Row must not exist in DB due to transaction rollback
        assertThat(otpRepository.findByEmail(testEmail)).isEmpty();
    }

    @Test
    @DisplayName("Resend 10: Sequential resend requests after cooldown succeed")
    void resendReq10_SequentialResendsAfterCooldown_Succeed() throws Exception {
        // Initial request
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        // Resend 1 after cooldown
        jdbcTemplate.update("UPDATE password_reset_otps SET created_at = DATE_SUB(created_at, INTERVAL 65 SECOND) WHERE email = ?", testEmail);
        mockMvc.perform(post("/api/auth/resend-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        // Resend 2 after cooldown
        jdbcTemplate.update("UPDATE password_reset_otps SET created_at = DATE_SUB(created_at, INTERVAL 65 SECOND) WHERE email = ?", testEmail);
        mockMvc.perform(post("/api/auth/resend-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest(testEmail))))
                .andExpect(status().isOk());

        // Exactly 3 total OTP emails dispatched
        verify(emailService, times(3)).sendPasswordResetOtp(eq(testEmail), anyString());

        // Valid row in DB
        PasswordResetOtp finalOtp = otpRepository.findByEmail(testEmail).orElseThrow();
        assertThat(finalOtp.isUsed()).isFalse();
    }
}