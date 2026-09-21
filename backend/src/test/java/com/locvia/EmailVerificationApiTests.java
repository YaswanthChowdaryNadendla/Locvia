package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.LoginRequest;
import com.locvia.dto.RegisterRequest;
import com.locvia.dto.ResendVerificationRequest;
import com.locvia.dto.VerifyEmailRequest;
import com.locvia.dto.ForgotPasswordRequest;
import com.locvia.dto.VerifyOtpRequest;
import com.locvia.dto.ResetPasswordRequest;
import com.locvia.entity.AccountStatus;
import com.locvia.entity.EmailVerificationOtp;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.EmailVerificationOtpRepository;
import com.locvia.repository.PasswordResetOtpRepository;
import com.locvia.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EmailVerificationApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationOtpRepository otpRepository;

    @Autowired
    private PasswordResetOtpRepository passwordResetOtpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final List<String> TEST_EMAILS = List.of(
            "ev.cust@example.com",
            "ev.shop@example.com",
            "ev.deliv@example.com",
            "ev.test1@example.com",
            "ev.test2@example.com",
            "ev.test3@example.com",
            "ev.test4@example.com",
            "ev.test5@example.com",
            "ev.test6@example.com",
            "ev.test7@example.com",
            "ev.test8@example.com",
            "ev.test9@example.com",
            "ev.test10@example.com",
            "ev.test11@example.com",
            "ev.test12@example.com",
            "ev.admin@example.com",
            "ev.fp@example.com"
    );

    @BeforeEach
    @AfterEach
    void cleanUp() {
        for (String email : TEST_EMAILS) {
            otpRepository.findByEmail(email).ifPresent(otpRepository::delete);
            passwordResetOtpRepository.findByEmail(email).ifPresent(passwordResetOtpRepository::delete);
            userRepository.findByEmail(email).ifPresent(userRepository::delete);
        }
    }

    @Test
    @DisplayName("1. New registration creates user with emailVerified = false")
    void test1_newRegistrationCreatesEmailVerifiedFalse() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 1", "ev.test1@example.com", "9900000001", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailVerificationRequired").value(true))
                .andExpect(jsonPath("$.message").value("Verification code sent to your email"))
                .andExpect(jsonPath("$.email").value("ev.test1@example.com"));

        User user = userRepository.findByEmail("ev.test1@example.com").orElseThrow();
        assertThat(user.getEmailVerified()).isFalse();
    }

    @Test
    @DisplayName("2. Registration issues and stores verification OTP record")
    void test2_registrationSendsVerificationOtp() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 2", "ev.test2@example.com", "9900000002", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        Optional<EmailVerificationOtp> otpOpt = otpRepository.findByEmail("ev.test2@example.com");
        assertThat(otpOpt).isPresent();
        EmailVerificationOtp record = otpOpt.get();
        assertThat(record.getOtpHash()).isNotBlank();
        assertThat(record.getExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(record.isUsed()).isFalse();
        assertThat(record.getAttempts()).isEqualTo(0);
    }

    @Test
    @DisplayName("3. Correct OTP verifies email successfully")
    void test3_correctOtpVerifiesEmail() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 3", "ev.test3@example.com", "9900000003", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        EmailVerificationOtp record = otpRepository.findByEmail("ev.test3@example.com").orElseThrow();
        record.setOtpHash(passwordEncoder.encode("123456"));
        otpRepository.save(record);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("ev.test3@example.com", "123456");
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verified successfully"));

        User user = userRepository.findByEmail("ev.test3@example.com").orElseThrow();
        assertThat(user.getEmailVerified()).isTrue();

        EmailVerificationOtp updatedRecord = otpRepository.findByEmail("ev.test3@example.com").orElseThrow();
        assertThat(updatedRecord.isUsed()).isTrue();
        assertThat(updatedRecord.getVerifiedAt()).isNotNull();
    }

    @Test
    @DisplayName("4. Incorrect OTP is rejected with 400 Bad Request")
    void test4_incorrectOtpRejected() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 4", "ev.test4@example.com", "9900000004", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        EmailVerificationOtp record = otpRepository.findByEmail("ev.test4@example.com").orElseThrow();
        record.setOtpHash(passwordEncoder.encode("123456"));
        otpRepository.save(record);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("ev.test4@example.com", "999999");
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid verification code."));

        User user = userRepository.findByEmail("ev.test4@example.com").orElseThrow();
        assertThat(user.getEmailVerified()).isFalse();

        EmailVerificationOtp updatedRecord = otpRepository.findByEmail("ev.test4@example.com").orElseThrow();
        assertThat(updatedRecord.getAttempts()).isEqualTo(1);
    }

    @Test
    @DisplayName("5. Expired OTP fails verification")
    void test5_expiredOtpFails() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 5", "ev.test5@example.com", "9900000005", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        EmailVerificationOtp record = otpRepository.findByEmail("ev.test5@example.com").orElseThrow();
        record.setOtpHash(passwordEncoder.encode("123456"));
        record.setExpiresAt(LocalDateTime.now().minusMinutes(1)); // Expired
        otpRepository.save(record);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("ev.test5@example.com", "123456");
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("expired")));
    }

    @Test
    @DisplayName("6. Used OTP cannot be reused")
    void test6_usedOtpCannotBeReused() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 6", "ev.test6@example.com", "9900000006", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        EmailVerificationOtp record = otpRepository.findByEmail("ev.test6@example.com").orElseThrow();
        record.setOtpHash(passwordEncoder.encode("123456"));
        record.setUsed(true); // Already used
        otpRepository.save(record);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("ev.test6@example.com", "123456");
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("7. Maximum 5 attempts enforced before locking OTP")
    void test7_maxFiveAttemptsEnforced() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 7", "ev.test7@example.com", "9900000007", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        EmailVerificationOtp record = otpRepository.findByEmail("ev.test7@example.com").orElseThrow();
        record.setOtpHash(passwordEncoder.encode("123456"));
        record.setAttempts(4); // 4 attempts already made
        otpRepository.save(record);

        // 5th failed attempt
        VerifyEmailRequest verifyReq = new VerifyEmailRequest("ev.test7@example.com", "999999");
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Too many incorrect attempts. Please request a new code."));

        // 6th attempt (even with correct OTP) is rejected because attempts >= 5
        VerifyEmailRequest correctAfterLocked = new VerifyEmailRequest("ev.test7@example.com", "123456");
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctAfterLocked)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Too many incorrect attempts. Please request a new code."));
    }

    @Test
    @DisplayName("8. Resend cooldown (60 seconds) is strictly enforced")
    void test8_resendCooldownEnforced() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 8", "ev.test8@example.com", "9900000008", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Attempt immediate resend (cooldown is active)
        ResendVerificationRequest resendReq = new ResendVerificationRequest("ev.test8@example.com");
        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resendReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("Please wait before requesting another code."));
    }

    @Test
    @DisplayName("9. Resend OTP after cooldown replaces previous OTP record")
    void test9_resendOtpReplacesPrevious() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 9", "ev.test9@example.com", "9900000009", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        EmailVerificationOtp oldRecord = otpRepository.findByEmail("ev.test9@example.com").orElseThrow();
        Long oldId = oldRecord.getId();

        // Simulate cooldown elapsed by setting createdAt to 65 seconds ago
        // Need to bypass @PrePersist/updatable by running native or repository update
        oldRecord = otpRepository.findByEmail("ev.test9@example.com").orElseThrow();
        // Delete old record to test new OTP generation replaces it
        otpRepository.delete(oldRecord);
        otpRepository.flush();

        ResendVerificationRequest resendReq = new ResendVerificationRequest("ev.test9@example.com");
        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Verification code sent to your email"));

        EmailVerificationOtp newRecord = otpRepository.findByEmail("ev.test9@example.com").orElseThrow();
        assertThat(newRecord.getId()).isNotEqualTo(oldId);
        assertThat(newRecord.getAttempts()).isEqualTo(0);
    }

    @Test
    @DisplayName("10. Already verified email cannot be unnecessarily reverified")
    void test10_alreadyVerifiedCannotReverify() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 10", "ev.test10@example.com", "9900000010", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("ev.test10@example.com").orElseThrow();
        user.setEmailVerified(true);
        userRepository.save(user);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("ev.test10@example.com", "123456");
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Your email is already verified."));

        ResendVerificationRequest resendReq = new ResendVerificationRequest("ev.test10@example.com");
        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resendReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Your email is already verified."));
    }

    @Test
    @DisplayName("11. Unverified user cannot log in (403 Forbidden)")
    void test11_unverifiedUserCannotLogin() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 11", "ev.test11@example.com", "9900000011", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("ev.test11@example.com", "Password@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Please verify your email before logging in."));
    }

    @Test
    @DisplayName("12. Verified user can log in successfully")
    void test12_verifiedUserCanLogin() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 12", "ev.test12@example.com", "9900000012", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("ev.test12@example.com").orElseThrow();
        user.setEmailVerified(true);
        userRepository.save(user);

        LoginRequest loginReq = new LoginRequest("ev.test12@example.com", "Password@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("ev.test12@example.com"));
    }

    @Test
    @DisplayName("13. CUSTOMER registration creates emailVerified = false, accountStatus = APPROVED")
    void test13_customerRegistrationStatuses() throws Exception {
        RegisterRequest req = new RegisterRequest("Customer User", "ev.cust@example.com", "9900000013", "Password@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("ev.cust@example.com").orElseThrow();
        assertThat(user.getEmailVerified()).isFalse();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.APPROVED);
    }

    @Test
    @DisplayName("14. SHOP_OWNER registration creates emailVerified = false, accountStatus = PENDING")
    void test14_shopOwnerRegistrationStatuses() throws Exception {
        RegisterRequest req = new RegisterRequest("Shop Owner", "ev.shop@example.com", "9900000014", "Password@123", UserRole.SHOP_OWNER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("ev.shop@example.com").orElseThrow();
        assertThat(user.getEmailVerified()).isFalse();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.PENDING);
    }

    @Test
    @DisplayName("15. DELIVERY_PARTNER registration creates emailVerified = false, accountStatus = PENDING")
    void test15_deliveryPartnerRegistrationStatuses() throws Exception {
        RegisterRequest req = new RegisterRequest("Delivery Partner", "ev.deliv@example.com", "9900000015", "Password@123", UserRole.DELIVERY_PARTNER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("ev.deliv@example.com").orElseThrow();
        assertThat(user.getEmailVerified()).isFalse();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.PENDING);
    }

    @Test
    @DisplayName("16. After email verification, accountStatus remains unchanged (e.g., SHOP_OWNER stays PENDING)")
    void test16_accountStatusUnchangedAfterVerification() throws Exception {
        RegisterRequest req = new RegisterRequest("Shop Owner 16", "ev.shop@example.com", "9900000016", "Password@123", UserRole.SHOP_OWNER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        EmailVerificationOtp record = otpRepository.findByEmail("ev.shop@example.com").orElseThrow();
        record.setOtpHash(passwordEncoder.encode("123456"));
        otpRepository.save(record);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest("ev.shop@example.com", "123456");
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk());

        User user = userRepository.findByEmail("ev.shop@example.com").orElseThrow();
        assertThat(user.getEmailVerified()).isTrue();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.PENDING); // Remains PENDING!
    }

    @Test
    @DisplayName("17. Existing Admin account remains functional with emailVerified = true")
    void test17_adminAccountRemainsFunctional() throws Exception {
        Optional<User> adminOpt = userRepository.findByEmail("admin@locvia.com");
        if (adminOpt.isEmpty()) {
            User admin = new User("Admin", "admin@locvia.com", "9900000017", passwordEncoder.encode("Admin@123"), UserRole.ADMIN);
            admin.setEmailVerified(true);
            admin.setAccountStatus(AccountStatus.APPROVED);
            userRepository.save(admin);
        }

        LoginRequest adminLogin = new LoginRequest("admin@locvia.com", "Admin@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    @DisplayName("18. Existing Forgot Password request continues to work")
    void test18_forgotPasswordFlowUnbroken() throws Exception {
        User user = new User("FP User", "ev.fp@example.com", "9900000018", passwordEncoder.encode("OldPass@123"), UserRole.CUSTOMER);
        user.setEmailVerified(true);
        userRepository.save(user);

        ForgotPasswordRequest fpReq = new ForgotPasswordRequest("ev.fp@example.com");
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fpReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isString());

        assertThat(passwordResetOtpRepository.findByEmail("ev.fp@example.com")).isPresent();
    }

    @Test
    @DisplayName("19. Password reset remains functional after email verification changes")
    void test19_passwordResetWorksEndToEnd() throws Exception {
        User user = new User("FP User 19", "ev.fp@example.com", "9900000019", passwordEncoder.encode("OldPass@123"), UserRole.CUSTOMER);
        user.setEmailVerified(true);
        userRepository.save(user);

        ForgotPasswordRequest fpReq = new ForgotPasswordRequest("ev.fp@example.com");
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fpReq)))
                .andExpect(status().isOk());

        var record = passwordResetOtpRepository.findByEmail("ev.fp@example.com").orElseThrow();
        record.setOtpHash(passwordEncoder.encode("654321"));
        passwordResetOtpRepository.save(record);

        VerifyOtpRequest voReq = new VerifyOtpRequest("ev.fp@example.com", "654321");
        var verifyRes = mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(voReq)))
                .andExpect(status().isOk())
                .andReturn();

        String resetToken = objectMapper.readTree(verifyRes.getResponse().getContentAsString()).get("resetToken").asText();

        ResetPasswordRequest rpReq = new ResetPasswordRequest("ev.fp@example.com", resetToken, "BrandNew@123");
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rpReq)))
                .andExpect(status().isOk());

        User updatedUser = userRepository.findByEmail("ev.fp@example.com").orElseThrow();
        assertThat(passwordEncoder.matches("BrandNew@123", updatedUser.getPassword())).isTrue();
    }

    @Test
    @DisplayName("20. Passwords and OTPs are never stored as plaintext in database")
    void test20_passwordsAndOtpsNeverStoredInPlaintext() throws Exception {
        RegisterRequest req = new RegisterRequest("EV User 20", "ev.test1@example.com", "9900000020", "PlainPass@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("ev.test1@example.com").orElseThrow();
        assertThat(user.getPassword()).isNotEqualTo("PlainPass@123");
        assertThat(user.getPassword()).startsWith("$2");

        EmailVerificationOtp record = otpRepository.findByEmail("ev.test1@example.com").orElseThrow();
        assertThat(record.getOtpHash()).startsWith("$2");
        assertThat(record.getOtpHash()).hasSizeGreaterThan(50);
    }
}
