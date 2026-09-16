package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.AdminUpdateUserRequest;
import com.locvia.dto.LoginRequest;
import com.locvia.dto.RegisterRequest;
import com.locvia.dto.UpdateUserRequest;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserApiTests {

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

    private static final String CUST_EMAIL_1 = "uapi.cust1@example.com";
    private static final String CUST_EMAIL_2 = "uapi.cust2@example.com";
    private static final String ADMIN_EMAIL = "uapi.admin@example.com";
    private static final String TAKEN_EMAIL = "uapi.taken@example.com";

    private User customer1;
    private User customer2;
    private User adminUser;

    private String customer1Token;
    private String customer2Token;
    private String adminToken;

    @BeforeEach
    void setUp() {
        cleanUp();

        // Create Customer 1
        customer1 = new User("Customer One", CUST_EMAIL_1, "9876543230", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER);
        customer1 = userRepository.save(customer1);
        customer1Token = jwtService.generateToken(customer1.getEmail(), customer1.getId(), customer1.getRole().name());

        // Create Customer 2
        customer2 = new User("Customer Two", CUST_EMAIL_2, "9876543231", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER);
        customer2 = userRepository.save(customer2);
        customer2Token = jwtService.generateToken(customer2.getEmail(), customer2.getId(), customer2.getRole().name());

        // Create Admin (safe repository creation)
        adminUser = new User("Admin User", ADMIN_EMAIL, "9876543232", passwordEncoder.encode("AdminPass@123"), UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser.getEmail(), adminUser.getId(), adminUser.getRole().name());
    }

    @AfterEach
    void tearDown() {
        cleanUp();
    }

    private void cleanUp() {
        List<String> emails = List.of(CUST_EMAIL_1, CUST_EMAIL_2, ADMIN_EMAIL, TAKEN_EMAIL, "uapi.updated@example.com");
        for (String email : emails) {
            userRepository.findByEmail(email).ifPresent(userRepository::delete);
        }
    }

    @Test
    @DisplayName("1. GET /api/users/me requires authentication (401 without token)")
    void getCurrentUserWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("2. GET /api/users/me with valid JWT returns caller profile and never exposes password")
    void getCurrentUserWithTokenReturnsProfile() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customer1.getId()))
                .andExpect(jsonPath("$.name").value("Customer One"))
                .andExpect(jsonPath("$.email").value(CUST_EMAIL_1))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("3. GET /api/users/profile alias works identically to /api/users/me")
    void getProfileAliasWorks() throws Exception {
        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(CUST_EMAIL_1));
    }

    @Test
    @DisplayName("4. PUT /api/users/me updates allowed fields (name, phone)")
    void updateCurrentUserSucceeds() throws Exception {
        UpdateUserRequest updateReq = new UpdateUserRequest("Updated Name", "9998887776", null);

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.phone").value("9998887776"))
                .andExpect(jsonPath("$.email").value(CUST_EMAIL_1))
                .andExpect(jsonPath("$.password").doesNotExist());

        // Verify in database
        User updated = userRepository.findById(customer1.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Updated Name");
        assertThat(updated.getPhone()).isEqualTo("9998887776");
    }

    @Test
    @DisplayName("5. Normal user cannot change role via PUT /api/users/me")
    void normalUserCannotChangeRole() throws Exception {
        // Attempt to pass role in payload
        String rawJson = "{\"name\":\"Hacker Customer\",\"role\":\"ADMIN\"}";

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rawJson))
                .andExpect(status().isOk());

        // Verify role remained CUSTOMER
        User user = userRepository.findById(customer1.getId()).orElseThrow();
        assertThat(user.getRole()).isEqualTo(UserRole.CUSTOMER);
    }

    @Test
    @DisplayName("6. GET /api/users/{id} allows user to view their own profile")
    void getUserByIdOwnProfileSucceeds() throws Exception {
        mockMvc.perform(get("/api/users/" + customer1.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customer1.getId()))
                .andExpect(jsonPath("$.email").value(CUST_EMAIL_1));
    }

    @Test
    @DisplayName("7. GET /api/users/{id} returns 403 Forbidden when normal user tries to access another user")
    void getUserByIdOtherUserReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/users/" + customer2.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("8. ADMIN can access GET /api/users/{id} for any user")
    void adminCanAccessAnyUserById() throws Exception {
        mockMvc.perform(get("/api/users/" + customer1.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customer1.getId()))
                .andExpect(jsonPath("$.email").value(CUST_EMAIL_1));
    }

    @Test
    @DisplayName("9. ADMIN can list all users via GET /api/admin/users")
    void adminCanListAllUsers() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$[?(@.email == '" + CUST_EMAIL_1 + "')]").exists())
                .andExpect(jsonPath("$[?(@.email == '" + ADMIN_EMAIL + "')]").exists());
    }

    @Test
    @DisplayName("10. Non-admin (CUSTOMER) cannot access GET /api/admin/users (403 Forbidden)")
    void nonAdminCannotAccessAdminUsersList() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("11. ADMIN can retrieve a specific user via GET /api/admin/users/{id}")
    void adminCanGetUserById() throws Exception {
        mockMvc.perform(get("/api/admin/users/" + customer1.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customer1.getId()))
                .andExpect(jsonPath("$.email").value(CUST_EMAIL_1));
    }

    @Test
    @DisplayName("12. Nonexistent user returns 404 Not Found")
    void nonexistentUserReturns404() throws Exception {
        mockMvc.perform(get("/api/admin/users/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("13. ADMIN can update user role and details via PUT /api/admin/users/{id}")
    void adminCanUpdateUserRoleAndDetails() throws Exception {
        AdminUpdateUserRequest updateReq = new AdminUpdateUserRequest(
                "Promoted Customer",
                null,
                "9876543299",
                UserRole.SHOP_OWNER,
                true
        );

        mockMvc.perform(put("/api/admin/users/" + customer1.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Promoted Customer"))
                .andExpect(jsonPath("$.role").value("SHOP_OWNER"));

        User updated = userRepository.findById(customer1.getId()).orElseThrow();
        assertThat(updated.getRole()).isEqualTo(UserRole.SHOP_OWNER);
    }

    @Test
    @DisplayName("14. ADMIN cannot demote their own account away from ADMIN (self-protection)")
    void adminCannotDemoteThemselves() throws Exception {
        AdminUpdateUserRequest demoteReq = new AdminUpdateUserRequest(
                "Self Demote",
                null,
                null,
                UserRole.CUSTOMER,
                true
        );

        mockMvc.perform(put("/api/admin/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(demoteReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value(containsString("cannot demote")));

        User admin = userRepository.findById(adminUser.getId()).orElseThrow();
        assertThat(admin.getRole()).isEqualTo(UserRole.ADMIN);
    }

    @Test
    @DisplayName("15. DELETE /api/admin/users/{id} safely deactivates user (active = false)")
    void deleteUserSafelyDeactivates() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + customer2.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("deactivated")));

        // Verify user was NOT hard deleted, but marked active = false
        Optional<User> userOpt = userRepository.findById(customer2.getId());
        assertThat(userOpt).isPresent();
        assertThat(userOpt.get().isActive()).isFalse();
    }

    @Test
    @DisplayName("16. ADMIN cannot deactivate or delete their own account (self-protection)")
    void adminCannotDeactivateThemselves() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value(containsString("cannot deactivate")));

        User admin = userRepository.findById(adminUser.getId()).orElseThrow();
        assertThat(admin.isActive()).isTrue();
    }

    @Test
    @DisplayName("17. Updating profile with an email already taken by another user returns 409 Conflict")
    void duplicateEmailOnUpdateRejected() throws Exception {
        // Customer 1 tries to update email to Customer 2's email
        UpdateUserRequest updateReq = new UpdateUserRequest("Customer One", "9876543230", CUST_EMAIL_2);

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value(containsString("already registered")));
    }
}
