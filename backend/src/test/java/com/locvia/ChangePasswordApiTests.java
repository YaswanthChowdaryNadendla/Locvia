package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.ChangePasswordRequest;
import com.locvia.dto.LoginRequest;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.UserRepository;
import com.locvia.security.JwtService;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ChangePasswordApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private static final String CUST_EMAIL = "pwd.cust@example.com";
    private static final String OTHER_EMAIL = "pwd.other@example.com";
    private static final String SHOP_EMAIL = "pwd.shop@example.com";
    private static final String DELIVERY_EMAIL = "pwd.delivery@example.com";
    private static final String ADMIN_EMAIL = "pwd.admin@example.com";

    private static final String INITIAL_PASSWORD = "OldPassword@123";

    private User customer;
    private User otherUser;
    private User shopOwner;
    private User deliveryPartner;
    private User admin;

    private String customerToken;
    private String shopToken;
    private String deliveryToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        cleanUp();

        customer = new User("Test Customer", CUST_EMAIL, "9876543201", passwordEncoder.encode(INITIAL_PASSWORD), UserRole.CUSTOMER);
        customer = userRepository.save(customer);
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), customer.getRole().name());

        otherUser = new User("Other User", OTHER_EMAIL, "9876543202", passwordEncoder.encode(INITIAL_PASSWORD), UserRole.CUSTOMER);
        otherUser = userRepository.save(otherUser);

        shopOwner = new User("Test Shop", SHOP_EMAIL, "9876543203", passwordEncoder.encode(INITIAL_PASSWORD), UserRole.SHOP_OWNER);
        shopOwner = userRepository.save(shopOwner);
        shopToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), shopOwner.getRole().name());

        deliveryPartner = new User("Test Delivery", DELIVERY_EMAIL, "9876543204", passwordEncoder.encode(INITIAL_PASSWORD), UserRole.DELIVERY_PARTNER);
        deliveryPartner = userRepository.save(deliveryPartner);
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), deliveryPartner.getRole().name());

        admin = new User("Test Admin", ADMIN_EMAIL, "9876543205", passwordEncoder.encode(INITIAL_PASSWORD), UserRole.ADMIN);
        admin = userRepository.save(admin);
        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), admin.getRole().name());
    }

    @AfterEach
    void tearDown() {
        cleanUp();
    }

    private void cleanUp() {
        List<String> emails = List.of(CUST_EMAIL, OTHER_EMAIL, SHOP_EMAIL, DELIVERY_EMAIL, ADMIN_EMAIL);
        for (String email : emails) {
            userRepository.findByEmail(email).ifPresent(userRepository::delete);
        }
    }

    @Test
    @DisplayName("1. Authenticated user changes password with correct current password -> success, database updated")
    void changePasswordSuccess() throws Exception {
        String newPassword = "NewSecurePassword@456";
        ChangePasswordRequest request = new ChangePasswordRequest(INITIAL_PASSWORD, newPassword, newPassword);

        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        // Verify in database
        User updated = userRepository.findById(customer.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(newPassword, updated.getPassword())).isTrue();
        assertThat(passwordEncoder.matches(INITIAL_PASSWORD, updated.getPassword())).isFalse();
    }

    @Test
    @DisplayName("2. Incorrect current password -> rejected (400), database password remains unchanged")
    void incorrectCurrentPasswordRejected() throws Exception {
        String newPassword = "NewSecurePassword@456";
        ChangePasswordRequest request = new ChangePasswordRequest("WrongPassword@999", newPassword, newPassword);

        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect."));

        // Verify database remains unchanged
        User current = userRepository.findById(customer.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(INITIAL_PASSWORD, current.getPassword())).isTrue();
        assertThat(passwordEncoder.matches(newPassword, current.getPassword())).isFalse();
    }

    @Test
    @DisplayName("3. New password and confirmation don't match -> rejected (400)")
    void passwordMismatchRejected() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(INITIAL_PASSWORD, "NewPassword@123", "DifferentPassword@456");

        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("New passwords do not match."));

        // Verify database remains unchanged
        User current = userRepository.findById(customer.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(INITIAL_PASSWORD, current.getPassword())).isTrue();
    }

    @Test
    @DisplayName("4. Empty or missing passwords -> rejected (400 validation error)")
    void emptyOrMissingPasswordsRejected() throws Exception {
        // Missing current password
        ChangePasswordRequest missingCurrent = new ChangePasswordRequest("", "NewPassword@123", "NewPassword@123");
        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(missingCurrent)))
                .andExpect(status().isBadRequest());

        // Short new password (< 6 characters)
        ChangePasswordRequest shortPassword = new ChangePasswordRequest(INITIAL_PASSWORD, "12345", "12345");
        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortPassword)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("5. New password is BCrypt encoded -> plaintext new password must NOT be stored")
    void newPasswordIsBcryptEncoded() throws Exception {
        String newPassword = "BcryptEncodedPassword@789";
        ChangePasswordRequest request = new ChangePasswordRequest(INITIAL_PASSWORD, newPassword, newPassword);

        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        User updated = userRepository.findById(customer.getId()).orElseThrow();
        // Plaintext must not match raw string in database
        assertThat(updated.getPassword()).isNotEqualTo(newPassword);
        // Must start with BCrypt prefix $2a$ or $2b$
        assertThat(updated.getPassword()).startsWith("$2");
        // Must match through passwordEncoder
        assertThat(passwordEncoder.matches(newPassword, updated.getPassword())).isTrue();
    }

    @Test
    @DisplayName("6. Unauthenticated request -> rejected with 401 Unauthorized")
    void unauthenticatedRequestRejected() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(INITIAL_PASSWORD, "NewPassword@123", "NewPassword@123");

        mockMvc.perform(put("/api/users/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("7. Attempt to change another user's password -> impossible (user derived from JWT)")
    void cannotChangeAnotherUserPassword() throws Exception {
        String newPassword = "HackedPassword@999";
        // Customer 1 tries to change password — only customer 1 account can ever be modified
        ChangePasswordRequest request = new ChangePasswordRequest(INITIAL_PASSWORD, newPassword, newPassword);

        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + customer1Token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // otherUser password must remain untouched
        User other = userRepository.findById(otherUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(INITIAL_PASSWORD, other.getPassword())).isTrue();
        assertThat(passwordEncoder.matches(newPassword, other.getPassword())).isFalse();
    }

    @Test
    @DisplayName("8. Verify the NEW password can be used for login after the change")
    void newPasswordCanBeUsedForLogin() throws Exception {
        String newPassword = "BrandNewLoginPassword@2026";
        ChangePasswordRequest changeReq = new ChangePasswordRequest(INITIAL_PASSWORD, newPassword, newPassword);

        // Change password
        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isOk());

        // Attempt login with OLD password -> must fail (401)
        LoginRequest oldLogin = new LoginRequest(CUST_EMAIL, INITIAL_PASSWORD);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());

        // Attempt login with NEW password -> must succeed (200)
        LoginRequest newLogin = new LoginRequest(CUST_EMAIL, newPassword);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(CUST_EMAIL));
    }

    @Test
    @DisplayName("9. Works across all roles: SHOP_OWNER, DELIVERY_PARTNER, and ADMIN")
    void changePasswordWorksForAllRoles() throws Exception {
        String newShopPwd = "ShopOwnerNewPass@1";
        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + shopToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangePasswordRequest(INITIAL_PASSWORD, newShopPwd, newShopPwd))))
                .andExpect(status().isOk());
        assertThat(passwordEncoder.matches(newShopPwd, userRepository.findById(shopOwner.getId()).orElseThrow().getPassword())).isTrue();

        String newDeliveryPwd = "DeliveryNewPass@1";
        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + deliveryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangePasswordRequest(INITIAL_PASSWORD, newDeliveryPwd, newDeliveryPwd))))
                .andExpect(status().isOk());
        assertThat(passwordEncoder.matches(newDeliveryPwd, userRepository.findById(deliveryPartner.getId()).orElseThrow().getPassword())).isTrue();

        String newAdminPwd = "AdminNewPass@1";
        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangePasswordRequest(INITIAL_PASSWORD, newAdminPwd, newAdminPwd))))
                .andExpect(status().isOk());
        assertThat(passwordEncoder.matches(newAdminPwd, userRepository.findById(admin.getId()).orElseThrow().getPassword())).isTrue();
    }

    private String customer1Token() {
        return customerToken;
    }
}
