package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.LoginRequest;
import com.locvia.dto.RegisterRequest;
import com.locvia.entity.AccountStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.EmailVerificationOtpRepository;
import com.locvia.repository.UserRepository;
import com.locvia.service.ResendEmailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests verifying backend behavior when email verification is disabled:
 * locvia.email-verification.enabled = false (the default configuration).
 */
@SpringBootTest(properties = "locvia.email-verification.enabled=false")
@AutoConfigureMockMvc
class EmailVerificationConfigTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationOtpRepository otpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private ResendEmailService resendEmailService;

    private static final List<String> TEST_EMAILS = List.of(
            "cfg.cust@example.com",
            "cfg.shop@example.com",
            "cfg.deliv@example.com",
            "cfg.admin@example.com",
            "cfg.unverified@example.com"
    );

    @BeforeEach
    @AfterEach
    void cleanUp() {
        for (String email : TEST_EMAILS) {
            otpRepository.findByEmail(email).ifPresent(otpRepository::delete);
            userRepository.findByEmail(email).ifPresent(userRepository::delete);
        }
    }

    @Test
    @DisplayName("1. EMAIL_VERIFICATION_ENABLED=false + CUSTOMER registration succeeds without Resend")
    void customerRegistration_WhenDisabled_SucceedsWithoutResend() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "Config Cust",
                "cfg.cust@example.com",
                "9800000001",
                "Password@123",
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailVerificationRequired").value(false))
                .andExpect(jsonPath("$.message").value("Account created successfully. You can now log in to Locvia."))
                .andExpect(jsonPath("$.email").value("cfg.cust@example.com"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.user.accountStatus").value("APPROVED"));

        // Verify Resend was NEVER invoked
        verify(resendEmailService, never()).sendEmailVerificationOtp(anyString(), anyString());

        // Verify no OTP was persisted in the database
        assertThat(otpRepository.findByEmail("cfg.cust@example.com")).isEmpty();

        // Verify user was saved with emailVerified = true and accountStatus = APPROVED
        Optional<User> userOpt = userRepository.findByEmail("cfg.cust@example.com");
        assertThat(userOpt).isPresent();
        User user = userOpt.get();
        assertThat(user.getEmailVerified()).isTrue();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.APPROVED);
    }

    @Test
    @DisplayName("2. EMAIL_VERIFICATION_ENABLED=false + SHOP_OWNER registration succeeds with PENDING status")
    void shopOwnerRegistration_WhenDisabled_SucceedsWithPendingStatus() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "Config Shop",
                "cfg.shop@example.com",
                "9800000002",
                "Password@123",
                UserRole.SHOP_OWNER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailVerificationRequired").value(false))
                .andExpect(jsonPath("$.message").value("Account created successfully. Your shop owner application is pending administrator approval."))
                .andExpect(jsonPath("$.email").value("cfg.shop@example.com"))
                .andExpect(jsonPath("$.user.role").value("SHOP_OWNER"))
                .andExpect(jsonPath("$.user.accountStatus").value("PENDING"));

        verify(resendEmailService, never()).sendEmailVerificationOtp(anyString(), anyString());
        assertThat(otpRepository.findByEmail("cfg.shop@example.com")).isEmpty();

        Optional<User> userOpt = userRepository.findByEmail("cfg.shop@example.com");
        assertThat(userOpt).isPresent();
        User user = userOpt.get();
        assertThat(user.getEmailVerified()).isTrue();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.PENDING);
    }

    @Test
    @DisplayName("3. EMAIL_VERIFICATION_ENABLED=false + DELIVERY_PARTNER registration succeeds with PENDING status")
    void deliveryPartnerRegistration_WhenDisabled_SucceedsWithPendingStatus() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "Config Delivery",
                "cfg.deliv@example.com",
                "9800000003",
                "Password@123",
                UserRole.DELIVERY_PARTNER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailVerificationRequired").value(false))
                .andExpect(jsonPath("$.message").value("Account created successfully. Your delivery partner application is pending administrator approval."))
                .andExpect(jsonPath("$.email").value("cfg.deliv@example.com"))
                .andExpect(jsonPath("$.user.role").value("DELIVERY_PARTNER"))
                .andExpect(jsonPath("$.user.accountStatus").value("PENDING"));

        verify(resendEmailService, never()).sendEmailVerificationOtp(anyString(), anyString());
        assertThat(otpRepository.findByEmail("cfg.deliv@example.com")).isEmpty();

        Optional<User> userOpt = userRepository.findByEmail("cfg.deliv@example.com");
        assertThat(userOpt).isPresent();
        User user = userOpt.get();
        assertThat(user.getEmailVerified()).isTrue();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.PENDING);
    }

    @Test
    @DisplayName("4. EMAIL_VERIFICATION_ENABLED=false + ADMIN registration returns 403")
    void adminRegistration_WhenDisabled_ReturnsForbidden() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "Config Admin",
                "cfg.admin@example.com",
                "9800000004",
                "Password@123",
                UserRole.ADMIN
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Administrator accounts cannot be created via public registration"));

        assertThat(userRepository.findByEmail("cfg.admin@example.com")).isEmpty();
        verify(resendEmailService, never()).sendEmailVerificationOtp(anyString(), anyString());
    }

    @Test
    @DisplayName("5. EMAIL_VERIFICATION_ENABLED=false: Customer can log in immediately after registration")
    void customerLogin_WhenDisabled_SucceedsImmediately() throws Exception {
        RegisterRequest regReq = new RegisterRequest(
                "Config Cust",
                "cfg.cust@example.com",
                "9800000001",
                "Password@123",
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("cfg.cust@example.com", "Password@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("cfg.cust@example.com"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"));
    }

    @Test
    @DisplayName("6. EMAIL_VERIFICATION_ENABLED=false: User with emailVerified=false is NOT rejected for login")
    void login_WhenDisabled_DoesNotRejectUnverifiedEmail() throws Exception {
        // Manually create a user with emailVerified = false (e.g. from an earlier time)
        User unverifiedUser = new User(
                "Unverified User",
                "cfg.unverified@example.com",
                "9800000005",
                passwordEncoder.encode("Password@123"),
                UserRole.CUSTOMER
        );
        unverifiedUser.setAccountStatus(AccountStatus.APPROVED);
        unverifiedUser.setEmailVerified(false);
        userRepository.save(unverifiedUser);

        LoginRequest loginReq = new LoginRequest("cfg.unverified@example.com", "Password@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("cfg.unverified@example.com"));
    }
}
