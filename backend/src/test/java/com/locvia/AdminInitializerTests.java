package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.config.AdminAccountInitializer;
import com.locvia.dto.LoginRequest;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminInitializerTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminAccountInitializer adminAccountInitializer;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Admin initializer creates default admin account when not present")
    void testAdminCreatedWhenNotPresent() {
        Optional<User> adminOpt = userRepository.findByEmail(AdminAccountInitializer.DEFAULT_ADMIN_EMAIL);
        assertThat(adminOpt).isPresent();

        User admin = adminOpt.get();
        assertThat(admin.getName()).isEqualTo(AdminAccountInitializer.DEFAULT_ADMIN_NAME);
        assertThat(admin.getEmail()).isEqualTo(AdminAccountInitializer.DEFAULT_ADMIN_EMAIL);
        assertThat(admin.getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(admin.getActive()).isTrue();
        assertThat(admin.getPassword()).isNotEqualTo("Admin@123");
        assertThat(passwordEncoder.matches("Admin@123", admin.getPassword())).isTrue();
    }

    @Test
    @DisplayName("Admin initializer is idempotent on subsequent runs")
    void testAdminInitializationIsIdempotent() {
        // Run initializer again
        adminAccountInitializer.run();

        Optional<User> adminOpt = userRepository.findByEmail(AdminAccountInitializer.DEFAULT_ADMIN_EMAIL);
        assertThat(adminOpt).isPresent();
    }

    @Test
    @DisplayName("Default admin can authenticate successfully via login API")
    void testAdminCanLoginWithCredentials() throws Exception {
        LoginRequest request = new LoginRequest(AdminAccountInitializer.DEFAULT_ADMIN_EMAIL, "Admin@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.email").value(AdminAccountInitializer.DEFAULT_ADMIN_EMAIL));
    }
}
