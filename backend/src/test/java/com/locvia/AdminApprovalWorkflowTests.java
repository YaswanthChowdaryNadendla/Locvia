package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateShopRequest;
import com.locvia.dto.RegisterRequest;
import com.locvia.entity.AccountStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.ShopRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminApprovalWorkflowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User admin;
    private String adminToken;

    @BeforeEach
    void setUp() {
        shopRepository.deleteAll();
        userRepository.deleteAll();

        admin = new User("Platform Admin", "admin.approval@locvia.com", "9876543200",
                passwordEncoder.encode("AdminPass123!"), UserRole.ADMIN);
        admin.setActive(true);
        admin.setAccountStatus(AccountStatus.APPROVED);
        admin = userRepository.save(admin);

        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), admin.getRole().name());
    }

    @AfterEach
    void tearDown() {
        shopRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Shop Owner registration creates PENDING account, Customer creates APPROVED account")
    void testRegistrationApprovalStatuses() throws Exception {
        // Register Customer -> APPROVED
        RegisterRequest customerReq = new RegisterRequest("Customer One", "customer.appr@test.com",
                "9876543201", "password123", UserRole.CUSTOMER);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.user.accountStatus").value("APPROVED"));

        // Register Shop Owner -> PENDING
        RegisterRequest shopOwnerReq = new RegisterRequest("Shop Owner One", "shop.owner.appr@test.com",
                "9876543202", "password123", UserRole.SHOP_OWNER);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shopOwnerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("SHOP_OWNER"))
                .andExpect(jsonPath("$.user.accountStatus").value("PENDING"));

        // Register Delivery Partner -> PENDING
        RegisterRequest deliveryPartnerReq = new RegisterRequest("Delivery Partner One", "delivery.appr@test.com",
                "9876543203", "password123", UserRole.DELIVERY_PARTNER);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deliveryPartnerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("DELIVERY_PARTNER"))
                .andExpect(jsonPath("$.user.accountStatus").value("PENDING"));
    }

    @Test
    @DisplayName("Pending Shop Owner is blocked from creating a shop until Admin approves")
    void testPendingShopOwnerBlockedUntilApproved() throws Exception {
        // Create pending shop owner
        User pendingOwner = new User("Pending Owner", "pending.owner@test.com", "9876543210",
                passwordEncoder.encode("password123"), UserRole.SHOP_OWNER);
        pendingOwner.setActive(true);
        pendingOwner.setAccountStatus(AccountStatus.PENDING);
        pendingOwner = userRepository.save(pendingOwner);

        String ownerToken = jwtService.generateToken(pendingOwner.getEmail(), pendingOwner.getId(), "SHOP_OWNER");

        CreateShopRequest createShopReq = new CreateShopRequest("Test Mart", "Description", "Main Street, Ongole",
                "9876543210", "mart@test.com", "https://example.com/logo.png", 15.5057, 80.0499);

        // Attempt to create shop while PENDING -> should be FORBIDDEN
        mockMvc.perform(post("/api/shops")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createShopReq)))
                .andExpect(status().isForbidden());

        // Admin approves the shop owner
        mockMvc.perform(put("/api/admin/users/" + pendingOwner.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(pendingOwner.getId()))
                .andExpect(jsonPath("$.accountStatus").value("APPROVED"));

        // Verify DB was updated
        User approvedOwner = userRepository.findById(pendingOwner.getId()).orElseThrow();
        assertThat(approvedOwner.getAccountStatus()).isEqualTo(AccountStatus.APPROVED);

        // Now creating shop should succeed
        mockMvc.perform(post("/api/shops")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createShopReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Test Mart"));
    }

    @Test
    @DisplayName("Admin can reject a user account and operational APIs remain blocked")
    void testAdminRejectUserFlow() throws Exception {
        User pendingPartner = new User("Pending Partner", "pending.partner@test.com", "9876543220",
                passwordEncoder.encode("password123"), UserRole.DELIVERY_PARTNER);
        pendingPartner.setActive(true);
        pendingPartner.setAccountStatus(AccountStatus.PENDING);
        pendingPartner = userRepository.save(pendingPartner);

        String partnerToken = jwtService.generateToken(pendingPartner.getEmail(), pendingPartner.getId(), "DELIVERY_PARTNER");

        // While pending, accessing delivery requests should be FORBIDDEN
        mockMvc.perform(get("/api/delivery/requests")
                        .header("Authorization", "Bearer " + partnerToken))
                .andExpect(status().isForbidden());

        // Admin rejects the partner
        mockMvc.perform(put("/api/admin/users/" + pendingPartner.getId() + "/reject")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(pendingPartner.getId()))
                .andExpect(jsonPath("$.accountStatus").value("REJECTED"));

        // After rejection, accessing delivery requests is still FORBIDDEN
        mockMvc.perform(get("/api/delivery/requests")
                        .header("Authorization", "Bearer " + partnerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin cannot approve or reject self or non-eligible roles")
    void testApprovalValidationGuards() throws Exception {
        // Admin approving self -> 403 SecurityException
        mockMvc.perform(put("/api/admin/users/" + admin.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        // Create Customer
        User customer = new User("Regular Customer", "customer.guard@test.com", "9876543230",
                passwordEncoder.encode("password123"), UserRole.CUSTOMER);
        customer.setActive(true);
        customer.setAccountStatus(AccountStatus.APPROVED);
        customer = userRepository.save(customer);

        // Attempting to approve a customer -> 400 Bad Request
        mockMvc.perform(put("/api/admin/users/" + customer.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Non-admin users cannot access approval endpoints")
    void testNonAdminAccessDenied() throws Exception {
        User customer = new User("Regular Customer", "nonadmin@test.com", "9876543240",
                passwordEncoder.encode("password123"), UserRole.CUSTOMER);
        customer = userRepository.save(customer);
        String customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "CUSTOMER");

        mockMvc.perform(put("/api/admin/users/" + customer.getId() + "/approve")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/users returns accountStatus in user response")
    void testAdminUsersEndpointReturnsAccountStatus() throws Exception {
        User shopOwner = new User("Owner Status", "owner.status@test.com", "9876543250",
                passwordEncoder.encode("password123"), UserRole.SHOP_OWNER);
        shopOwner.setAccountStatus(AccountStatus.PENDING);
        userRepository.save(shopOwner);

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[?(@.email == 'owner.status@test.com')].accountStatus").value(contains("PENDING")))
                .andExpect(jsonPath("$[?(@.email == 'admin.approval@locvia.com')].accountStatus").value(contains("APPROVED")));
    }
}
