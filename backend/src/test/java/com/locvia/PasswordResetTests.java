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
import com.locvia.service.ResendEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
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

    @MockBean
    private ResendEmailService resendEmailService;

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

        reset(resendEmailService);
    }

    @Test
    @DisplayName("Step 1: Request OTP sends 6-digit code via Resend and hashes OTP in DB")
    void requestOtp_Success() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest(testEmail);

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("If an account with that email exists")));

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(resendEmailService, times(1)).sendPasswordResetOtp(eq(testEmail), otpCaptor.capture());

        String capturedOtp = otpCaptor.getValue();
        assertThat(capturedOtp).matches("^\\d{6}$");

        PasswordResetOtp savedOtp = otpRepository.findByEmail(testEmail).orElseThrow();
        assertThat(savedOtp.getOtpHash()).isNotEqualTo(capturedOtp);
        assertThat(passwordEncoder.matches(capturedOtp, savedOtp.getOtpHash())).isTrue();
        assertThat(savedOtp.isUsed()).isFalse();
        assertThat(savedOtp.getAttempts()).isEqualTo(0);
    }

    @Test
    @DisplayName("Step 1: Non-existent email returns same generic message (no user enumeration)")
    void requestOtp_NonExistentEmail_ReturnsGenericMessage() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("doesnotexist@locvia.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("If an account with that email exists")));

        verify(resendEmailService, never()).sendPasswordResetOtp(anyString(), anyString());
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
        verify(resendEmailService).sendPasswordResetOtp(eq(testEmail), otpCaptor.capture());
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
}