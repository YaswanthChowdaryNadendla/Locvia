package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.GoogleAuthRequest;
import com.locvia.dto.LoginRequest;
import com.locvia.entity.AccountStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.exception.BusinessException;
import com.locvia.repository.UserRepository;
import com.locvia.security.google.GoogleTokenPayload;
import com.locvia.security.google.GoogleTokenVerifierService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class GoogleAuthApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private GoogleTokenVerifierService googleTokenVerifierService;

    private static final List<String> TEST_EMAILS = List.of(
            "google.new@example.com",
            "google.existing.pwd@example.com",
            "google.rejected@example.com",
            "google.pending.partner@example.com",
            "google.linked@example.com"
    );

    @BeforeEach
    @AfterEach
    void cleanup() {
        for (String email : TEST_EMAILS) {
            userRepository.findByEmail(email).ifPresent(userRepository::delete);
        }
    }

    @Test
    @DisplayName("1. New Google user is created as CUSTOMER with APPROVED status and emailVerified = true")
    void testGoogleLogin_NewUser_CreatedApprovedAndVerified() throws Exception {
        when(googleTokenVerifierService.verifyToken("valid-token-new")).thenReturn(
                new GoogleTokenPayload("google-sub-1001", "google.new@example.com", "New Google User", "https://img.com/photo.jpg", true)
        );

        GoogleAuthRequest request = new GoogleAuthRequest("valid-token-new");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("google.new@example.com"))
                .andExpect(jsonPath("$.user.name").value("New Google User"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.user.accountStatus").value("APPROVED"))
                .andExpect(jsonPath("$.user.emailVerified").value(true));

        // Verify database persistence
        Optional<User> savedOpt = userRepository.findByEmail("google.new@example.com");
        assertThat(savedOpt).isPresent();
        User saved = savedOpt.get();
        assertThat(saved.getGoogleSubject()).isEqualTo("google-sub-1001");
        assertThat(saved.getEmailVerified()).isTrue();
        assertThat(saved.getAccountStatus()).isEqualTo(AccountStatus.APPROVED);
        assertThat(saved.getRole()).isEqualTo(UserRole.CUSTOMER);
        assertThat(saved.getPassword()).startsWith("$2a$");
    }

    @Test
    @DisplayName("2. Invalid Google credential token is rejected with 401 Unauthorized")
    void testGoogleLogin_InvalidCredential_Rejected() throws Exception {
        when(googleTokenVerifierService.verifyToken("invalid-credential")).thenThrow(
                new BusinessException("Google authentication failed. Please try again.", HttpStatus.UNAUTHORIZED)
        );

        GoogleAuthRequest request = new GoogleAuthRequest("invalid-credential");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("3. Expired Google credential token is rejected with 401 Unauthorized")
    void testGoogleLogin_ExpiredCredential_Rejected() throws Exception {
        when(googleTokenVerifierService.verifyToken("expired-credential")).thenThrow(
                new BusinessException("Google authentication failed. Please try again.", HttpStatus.UNAUTHORIZED)
        );

        GoogleAuthRequest request = new GoogleAuthRequest("expired-credential");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("4. Wrong client ID / audience token is rejected with 401 Unauthorized")
    void testGoogleLogin_WrongAudience_Rejected() throws Exception {
        when(googleTokenVerifierService.verifyToken("wrong-audience-token")).thenThrow(
                new BusinessException("Google authentication failed. Please try again.", HttpStatus.UNAUTHORIZED)
        );

        GoogleAuthRequest request = new GoogleAuthRequest("wrong-audience-token");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("5. Blank credential token is rejected with 400 Bad Request")
    void testGoogleLogin_BlankCredential_BadRequest() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest("");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("6. Existing email/password user links googleSubject without overwriting password or creating duplicate")
    void testGoogleLogin_ExistingPasswordUser_LinksGoogleSubject() throws Exception {
        // Pre-create user registered with normal password
        String rawPassword = "originalSecurePassword123!";
        User existingUser = new User(
                "Existing User",
                "google.existing.pwd@example.com",
                "9876543210",
                passwordEncoder.encode(rawPassword),
                UserRole.CUSTOMER
        );
        existingUser.setActive(true);
        existingUser.setAccountStatus(AccountStatus.APPROVED);
        existingUser.setEmailVerified(false); // was unverified
        existingUser = userRepository.save(existingUser);

        when(googleTokenVerifierService.verifyToken("token-link-pwd")).thenReturn(
                new GoogleTokenPayload("google-sub-2002", "google.existing.pwd@example.com", "Existing User Google", null, true)
        );

        GoogleAuthRequest request = new GoogleAuthRequest("token-link-pwd");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.id").value(existingUser.getId()))
                .andExpect(jsonPath("$.user.email").value("google.existing.pwd@example.com"))
                .andExpect(jsonPath("$.user.emailVerified").value(true));

        // DB checks: no duplicate created, password untouched, googleSubject linked
        Optional<User> updatedOpt = userRepository.findById(existingUser.getId());
        assertThat(updatedOpt).isPresent();
        User updated = updatedOpt.get();
        assertThat(updated.getGoogleSubject()).isEqualTo("google-sub-2002");
        assertThat(updated.getEmailVerified()).isTrue();
        assertThat(passwordEncoder.matches(rawPassword, updated.getPassword())).isTrue();

        // Verify normal password login STILL works
        LoginRequest loginRequest = new LoginRequest("google.existing.pwd@example.com", rawPassword);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("7. Rejected user account cannot log in via Google and receives 403 Forbidden")
    void testGoogleLogin_RejectedAccount_Forbidden() throws Exception {
        User rejectedUser = new User(
                "Rejected User",
                "google.rejected@example.com",
                "9876543211",
                passwordEncoder.encode("password123"),
                UserRole.DELIVERY_PARTNER
        );
        rejectedUser.setActive(true);
        rejectedUser.setAccountStatus(AccountStatus.REJECTED);
        rejectedUser.setEmailVerified(true);
        userRepository.save(rejectedUser);

        when(googleTokenVerifierService.verifyToken("token-rejected")).thenReturn(
                new GoogleTokenPayload("google-sub-rej", "google.rejected@example.com", "Rejected User", null, true)
        );

        GoogleAuthRequest request = new GoogleAuthRequest("token-rejected");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("8. Pending partner account preserves PENDING status and role when logging in with Google")
    void testGoogleLogin_PendingPartner_PreservesStatusAndRole() throws Exception {
        User pendingPartner = new User(
                "Pending Partner",
                "google.pending.partner@example.com",
                "9876543212",
                passwordEncoder.encode("password123"),
                UserRole.DELIVERY_PARTNER
        );
        pendingPartner.setActive(true);
        pendingPartner.setAccountStatus(AccountStatus.PENDING);
        pendingPartner.setEmailVerified(true);
        userRepository.save(pendingPartner);

        when(googleTokenVerifierService.verifyToken("token-partner")).thenReturn(
                new GoogleTokenPayload("google-sub-partner-88", "google.pending.partner@example.com", "Partner User", null, true)
        );

        GoogleAuthRequest request = new GoogleAuthRequest("token-partner");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("DELIVERY_PARTNER"))
                .andExpect(jsonPath("$.user.accountStatus").value("PENDING"));

        Optional<User> checkOpt = userRepository.findByEmail("google.pending.partner@example.com");
        assertThat(checkOpt).isPresent();
        assertThat(checkOpt.get().getAccountStatus()).isEqualTo(AccountStatus.PENDING);
        assertThat(checkOpt.get().getRole()).isEqualTo(UserRole.DELIVERY_PARTNER);
    }

    @Test
    @DisplayName("9. Already linked Google user logs in directly by googleSubject lookup")
    void testGoogleLogin_AlreadyLinkedUser_LogsIn() throws Exception {
        User linkedUser = new User(
                "Linked User",
                "google.linked@example.com",
                null,
                passwordEncoder.encode("someRandomHash123"),
                UserRole.CUSTOMER
        );
        linkedUser.setGoogleSubject("google-sub-already-linked");
        linkedUser.setActive(true);
        linkedUser.setAccountStatus(AccountStatus.APPROVED);
        linkedUser.setEmailVerified(true);
        userRepository.save(linkedUser);

        when(googleTokenVerifierService.verifyToken("token-linked")).thenReturn(
                new GoogleTokenPayload("google-sub-already-linked", "google.linked@example.com", "Linked User", null, true)
        );

        GoogleAuthRequest request = new GoogleAuthRequest("token-linked");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("google.linked@example.com"));
    }
}
