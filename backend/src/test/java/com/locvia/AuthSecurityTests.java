package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.LoginRequest;
import com.locvia.dto.RegisterRequest;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.UserRepository;
import com.locvia.security.CustomUserDetails;
import com.locvia.security.CustomUserDetailsService;
import com.locvia.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthSecurityTests {

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

    @Autowired
    private CustomUserDetailsService userDetailsService;

    private static final List<String> TEST_EMAILS = List.of(
            "test.reg@example.com",
            "test.bcrypt@example.com",
            "test.duplicate@example.com",
            "test.login@example.com",
            "test.me@example.com",
            "test.customer@example.com",
            "test.shopowner@example.com",
            "test.delivery@example.com",
            "test.admin@example.com",
            "test.adminattempt@example.com",
            "test.normalization@example.com"
    );

    @AfterEach
    void cleanUpTestUsers() {
        for (String email : TEST_EMAILS) {
            userRepository.findByEmail(email).ifPresent(userRepository::delete);
        }
    }

    @Test
    @DisplayName("1. Health endpoint remains public and accessible without authentication")
    void healthEndpointRemainsPublic() throws Exception {
        mockMvc.perform(get("/api/health")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("Locvia Backend"));
    }

    @Test
    @DisplayName("2. Registration creates user and returns JWT with safe user data")
    void registrationWorks() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Test Registration",
                "test.reg@example.com",
                "9876543210",
                "Password@123",
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.name").value("Test Registration"))
                .andExpect(jsonPath("$.user.email").value("test.reg@example.com"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("3. Password is stored as a BCrypt hash, never plaintext")
    void passwordIsStoredAsBCryptHash() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "BCrypt User",
                "test.bcrypt@example.com",
                "9876543211",
                "PlainSecret@123",
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        Optional<User> userOpt = userRepository.findByEmail("test.bcrypt@example.com");
        assertThat(userOpt).isPresent();

        User user = userOpt.get();
        // Verify password is NOT plaintext
        assertThat(user.getPassword()).isNotEqualTo("PlainSecret@123");
        // Verify BCrypt hash prefix ($2a$ or $2b$)
        assertThat(user.getPassword()).startsWith("$2");
        // Verify BCrypt password matches
        assertThat(passwordEncoder.matches("PlainSecret@123", user.getPassword())).isTrue();
    }

    @Test
    @DisplayName("4. Duplicate email registration is rejected with 409 Conflict")
    void duplicateEmailRejected() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "First User",
                "test.duplicate@example.com",
                "9876543212",
                "Password@123",
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        RegisterRequest duplicateRequest = new RegisterRequest(
                "Second User",
                "test.duplicate@example.com",
                "9876543213",
                "Password@456",
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value(containsString("already registered")));
    }

    @Test
    @DisplayName("5. Login with correct credentials succeeds and returns JWT")
    void loginWithCorrectCredentialsSucceeds() throws Exception {
        RegisterRequest regRequest = new RegisterRequest(
                "Login User",
                "test.login@example.com",
                "9876543214",
                "ValidPassword@123",
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest("test.login@example.com", "ValidPassword@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("test.login@example.com"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    @DisplayName("6. Login with incorrect password returns 401 Unauthorized")
    void loginWithIncorrectPasswordFails() throws Exception {
        RegisterRequest regRequest = new RegisterRequest(
                "Login User",
                "test.login@example.com",
                "9876543214",
                "ValidPassword@123",
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated());

        LoginRequest badLogin = new LoginRequest("test.login@example.com", "WrongPassword@999");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("7. Protected endpoint GET /api/auth/me without token returns 401")
    void protectedEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("8. Protected endpoint GET /api/auth/me with valid JWT returns 200 and user profile")
    void protectedEndpointWithValidJwtSucceeds() throws Exception {
        RegisterRequest regRequest = new RegisterRequest(
                "Profile User",
                "test.me@example.com",
                "9876543215",
                "ProfilePass@123",
                UserRole.CUSTOMER
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Profile User"))
                .andExpect(jsonPath("$.email").value("test.me@example.com"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("9. Invalid or malformed JWT token is rejected with 401")
    void invalidJwtIsRejected() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.token.payload"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("10. Expired JWT token is rejected with 401")
    void expiredJwtIsRejected() throws Exception {
        // Generate an expired token (expired 5 seconds ago)
        String expiredToken = jwtService.generateToken(
                Map.of("userId", 100L, "role", "CUSTOMER"),
                "expired@example.com",
                -5000L
        );

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("11. Roles are mapped correctly to ROLE_ authority format")
    void rolesMappedCorrectly() throws Exception {
        // Customer
        RegisterRequest custReq = new RegisterRequest("Customer User", "test.customer@example.com", "9876543220", "Pass@123", UserRole.CUSTOMER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(custReq)))
                .andExpect(status().isCreated());

        CustomUserDetails custDetails = (CustomUserDetails) userDetailsService.loadUserByUsername("test.customer@example.com");
        Collection<? extends GrantedAuthority> custAuths = custDetails.getAuthorities();
        assertThat(custAuths).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_CUSTOMER");

        // Shop Owner
        RegisterRequest shopReq = new RegisterRequest("Shop User", "test.shopowner@example.com", "9876543221", "Pass@123", UserRole.SHOP_OWNER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(shopReq)))
                .andExpect(status().isCreated());

        CustomUserDetails shopDetails = (CustomUserDetails) userDetailsService.loadUserByUsername("test.shopowner@example.com");
        assertThat(shopDetails.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_SHOP_OWNER");

        // Delivery Partner
        RegisterRequest delReq = new RegisterRequest("Delivery User", "test.delivery@example.com", "9876543222", "Pass@123", UserRole.DELIVERY_PARTNER);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(delReq)))
                .andExpect(status().isCreated());

        CustomUserDetails delDetails = (CustomUserDetails) userDetailsService.loadUserByUsername("test.delivery@example.com");
        assertThat(delDetails.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_DELIVERY_PARTNER");

        // Admin (created safely via repository, never public registration)
        User admin = new User("Admin User", "test.admin@example.com", "9876543223", passwordEncoder.encode("AdminPass@123"), UserRole.ADMIN);
        userRepository.save(admin);

        CustomUserDetails adminDetails = (CustomUserDetails) userDetailsService.loadUserByUsername("test.admin@example.com");
        assertThat(adminDetails.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_ADMIN");
    }

    @Test
    @DisplayName("12. ADMIN role cannot be created through public registration")
    void adminCannotBeCreatedViaPublicRegistration() throws Exception {
        RegisterRequest adminReq = new RegisterRequest(
                "Hacker Admin",
                "test.adminattempt@example.com",
                "9876543224",
                "AdminAttempt@123",
                UserRole.ADMIN
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value(containsString("Administrator accounts cannot be created via public registration")));

        Optional<User> userOpt = userRepository.findByEmail("test.adminattempt@example.com");
        assertThat(userOpt).isEmpty();
    }

    @Test
    @DisplayName("13. Email normalization ensures case-insensitive registration and login")
    void emailNormalizationWorks() throws Exception {
        RegisterRequest regRequest = new RegisterRequest(
                "Mixed Case User",
                "  Test.Normalization@EXAMPLE.COM  ",
                "9876543225",
                "NormalPass@123",
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value("test.normalization@example.com"));

        // Login with lowercase trimmed email
        LoginRequest loginLower = new LoginRequest("test.normalization@example.com", "NormalPass@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginLower)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());

        // Login with uppercase untrimmed email
        LoginRequest loginUpper = new LoginRequest("  TEST.NORMALIZATION@EXAMPLE.COM  ", "NormalPass@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginUpper)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    @DisplayName("14. Invalid registration input is rejected with 400 Bad Request")
    void invalidRegistrationInputRejected() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest(
                "", // Blank name
                "not-an-email", // Invalid email
                "123",
                "short", // Password < 6 chars
                UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }
}
