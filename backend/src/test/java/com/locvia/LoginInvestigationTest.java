package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.LoginRequest;
import com.locvia.entity.AccountStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
public class LoginInvestigationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @AfterEach
    void tearDown() {
        userRepository.findByEmail("deactivated@locvia.test").ifPresent(userRepository::delete);
        userRepository.findByEmail("pending@locvia.test").ifPresent(userRepository::delete);
        userRepository.findByEmail("rejected@locvia.test").ifPresent(userRepository::delete);
    }

    @Test
    void testNonExistentUser() throws Exception {
        LoginRequest req = new LoginRequest("nonexistent@locvia.test", "wrongpassword");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        System.out.println("=== testNonExistentUser Status: " + result.getResponse().getStatus());
        System.out.println("=== testNonExistentUser Body: " + result.getResponse().getContentAsString());
    }

    @Test
    void testDeactivatedUser() throws Exception {
        User user = new User("Deactivated", "deactivated@locvia.test", null, passwordEncoder.encode("Password@123"), UserRole.CUSTOMER);
        user.setActive(false);
        userRepository.save(user);

        LoginRequest req = new LoginRequest("deactivated@locvia.test", "Password@123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        System.out.println("=== testDeactivatedUser Status: " + result.getResponse().getStatus());
        System.out.println("=== testDeactivatedUser Body: " + result.getResponse().getContentAsString());
    }

    @Test
    void testPendingUser() throws Exception {
        User user = new User("Pending", "pending@locvia.test", null, passwordEncoder.encode("Password@123"), UserRole.SHOP_OWNER);
        user.setAccountStatus(AccountStatus.PENDING);
        userRepository.save(user);

        LoginRequest req = new LoginRequest("pending@locvia.test", "Password@123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        System.out.println("=== testPendingUser Status: " + result.getResponse().getStatus());
        System.out.println("=== testPendingUser Body: " + result.getResponse().getContentAsString());
    }

    @Test
    void testRejectedUser() throws Exception {
        User user = new User("Rejected", "rejected@locvia.test", null, passwordEncoder.encode("Password@123"), UserRole.SHOP_OWNER);
        user.setAccountStatus(AccountStatus.REJECTED);
        userRepository.save(user);

        LoginRequest req = new LoginRequest("rejected@locvia.test", "Password@123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        System.out.println("=== testRejectedUser Status: " + result.getResponse().getStatus());
        System.out.println("=== testRejectedUser Body: " + result.getResponse().getContentAsString());
    }
}
