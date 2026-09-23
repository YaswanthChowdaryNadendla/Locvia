package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.config.AdminAccountInitializer;
import com.locvia.entity.*;
import com.locvia.repository.*;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminUserDeleteApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private EmailVerificationOtpRepository emailVerificationOtpRepository;

    @Autowired
    private PasswordResetOtpRepository passwordResetOtpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private User defaultAdminUser;
    private User customerUser;
    private User shopOwnerUser;
    private User deliveryPartnerUser;

    private String adminToken;
    private String customerToken;
    private String shopOwnerToken;
    private String deliveryPartnerToken;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        // 1. Authenticated Platform Admin
        adminUser = new User("Platform Admin", "super.admin@locvia.com", "9876543200",
                passwordEncoder.encode("AdminPass123!"), UserRole.ADMIN);
        adminUser.setActive(true);
        adminUser.setAccountStatus(AccountStatus.APPROVED);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser.getEmail(), adminUser.getId(), adminUser.getRole().name());

        // 2. Default Protected System Admin (admin@locvia.com)
        defaultAdminUser = new User(AdminAccountInitializer.DEFAULT_ADMIN_NAME, AdminAccountInitializer.DEFAULT_ADMIN_EMAIL,
                "9876543201", passwordEncoder.encode("DefaultAdmin123!"), UserRole.ADMIN);
        defaultAdminUser.setActive(true);
        defaultAdminUser.setAccountStatus(AccountStatus.APPROVED);
        defaultAdminUser = userRepository.save(defaultAdminUser);

        // 3. Regular Customer
        customerUser = new User("Alice Customer", "alice.customer@example.com", "9876543202",
                passwordEncoder.encode("CustPass123!"), UserRole.CUSTOMER);
        customerUser.setActive(true);
        customerUser.setAccountStatus(AccountStatus.APPROVED);
        customerUser = userRepository.save(customerUser);
        customerToken = jwtService.generateToken(customerUser.getEmail(), customerUser.getId(), customerUser.getRole().name());

        // 4. Shop Owner
        shopOwnerUser = new User("Bob Owner", "bob.owner@example.com", "9876543203",
                passwordEncoder.encode("OwnerPass123!"), UserRole.SHOP_OWNER);
        shopOwnerUser.setActive(true);
        shopOwnerUser.setAccountStatus(AccountStatus.PENDING);
        shopOwnerUser = userRepository.save(shopOwnerUser);
        shopOwnerToken = jwtService.generateToken(shopOwnerUser.getEmail(), shopOwnerUser.getId(), shopOwnerUser.getRole().name());

        // 5. Delivery Partner
        deliveryPartnerUser = new User("Charlie Partner", "charlie.partner@example.com", "9876543204",
                passwordEncoder.encode("PartnerPass123!"), UserRole.DELIVERY_PARTNER);
        deliveryPartnerUser.setActive(true);
        deliveryPartnerUser.setAccountStatus(AccountStatus.PENDING);
        deliveryPartnerUser = userRepository.save(deliveryPartnerUser);
        deliveryPartnerToken = jwtService.generateToken(deliveryPartnerUser.getEmail(), deliveryPartnerUser.getId(), deliveryPartnerUser.getRole().name());
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        notificationRepository.deleteAll();
        reviewRepository.deleteAll();
        deliveryRepository.deleteAll();
        paymentRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        addressRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        emailVerificationOtpRepository.deleteAll();
        passwordResetOtpRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. ADMIN can delete a CUSTOMER")
    void adminCanDeleteCustomer() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + customerUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("Account deleted successfully")));

        assertThat(userRepository.findById(customerUser.getId())).isEmpty();
    }

    @Test
    @DisplayName("2. ADMIN can delete a SHOP_OWNER")
    void adminCanDeleteShopOwner() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + shopOwnerUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("Account deleted successfully")));

        assertThat(userRepository.findById(shopOwnerUser.getId())).isEmpty();
    }

    @Test
    @DisplayName("3. ADMIN can delete a DELIVERY_PARTNER")
    void adminCanDeleteDeliveryPartner() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + deliveryPartnerUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("Account deleted successfully")));

        assertThat(userRepository.findById(deliveryPartnerUser.getId())).isEmpty();
    }

    @Test
    @DisplayName("4. CUSTOMER cannot delete another user (403 Forbidden)")
    void customerCannotDeleteUser() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + shopOwnerUser.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(shopOwnerUser.getId())).isPresent();
    }

    @Test
    @DisplayName("5. SHOP_OWNER cannot delete another user (403 Forbidden)")
    void shopOwnerCannotDeleteUser() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + customerUser.getId())
                        .header("Authorization", "Bearer " + shopOwnerToken))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(customerUser.getId())).isPresent();
    }

    @Test
    @DisplayName("6. DELIVERY_PARTNER cannot delete another user (403 Forbidden)")
    void deliveryPartnerCannotDeleteUser() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + customerUser.getId())
                        .header("Authorization", "Bearer " + deliveryPartnerToken))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(customerUser.getId())).isPresent();
    }

    @Test
    @DisplayName("7. Unauthenticated request returns 401 Unauthorized")
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + customerUser.getId()))
                .andExpect(status().isUnauthorized());

        assertThat(userRepository.findById(customerUser.getId())).isPresent();
    }

    @Test
    @DisplayName("8. Non-existent user returns 404 Not Found")
    void nonExistentUserReturns404() throws Exception {
        mockMvc.perform(delete("/api/admin/users/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("User not found with id: 999999")));
    }

    @Test
    @DisplayName("9. Admin cannot delete their own account (403 Forbidden)")
    void adminCannotDeleteOwnAccount() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Administrators cannot delete their own account."));

        assertThat(userRepository.findById(adminUser.getId())).isPresent();
    }

    @Test
    @DisplayName("10. admin@locvia.com cannot be deleted (403 Forbidden)")
    void defaultAdminCannotBeDeleted() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + defaultAdminUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Default administrator account cannot be deleted."));

        assertThat(userRepository.findById(defaultAdminUser.getId())).isPresent();
    }

    @Test
    @DisplayName("11. Related records (Cart, Address, Delivery, Reviews, Notifications, OTPs) are handled correctly")
    void relatedRecordsHandledCorrectly() throws Exception {
        // Create Cart & CartItem for customer
        Cart cart = new Cart(customerUser);
        cart = cartRepository.save(cart);

        // Create Address for customer
        Address address = new Address(customerUser, "Home", "Alice Customer", "9876543202",
                "123 Market St", "Suite 4", "Hyderabad", "Telangana", "500081");
        address = addressRepository.save(address);

        // Create Notification for customer
        Notification notification = new Notification(customerUser, UserRole.CUSTOMER,
                NotificationType.GENERAL, "Welcome", "Welcome to Locvia", null, null, null);
        notificationRepository.save(notification);

        // Create Review for customer
        Review review = new Review(customerUser, null, null, null, 5, "Great app!");
        reviewRepository.save(review);

        // Create OTPs for customer
        EmailVerificationOtp evOtp = new EmailVerificationOtp();
        evOtp.setEmail(customerUser.getEmail().toLowerCase());
        evOtp.setOtpHash(passwordEncoder.encode("123456"));
        evOtp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        emailVerificationOtpRepository.save(evOtp);

        PasswordResetOtp prOtp = new PasswordResetOtp();
        prOtp.setEmail(customerUser.getEmail().toLowerCase());
        prOtp.setOtpHash(passwordEncoder.encode("654321"));
        prOtp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        passwordResetOtpRepository.save(prOtp);

        // Perform delete via ADMIN API
        mockMvc.perform(delete("/api/admin/users/" + customerUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("Account deleted successfully")));

        // Assert customer is deleted
        assertThat(userRepository.findById(customerUser.getId())).isEmpty();

        // Assert related records are removed cleanly
        assertThat(cartRepository.findByUserId(customerUser.getId())).isEmpty();
        assertThat(addressRepository.findByUserId(customerUser.getId())).isEmpty();
        assertThat(notificationRepository.findByRecipientUserId(customerUser.getId())).isEmpty();
        assertThat(reviewRepository.findByUserId(customerUser.getId())).isEmpty();
        assertThat(emailVerificationOtpRepository.findByEmail(customerUser.getEmail().toLowerCase())).isEmpty();
        assertThat(passwordResetOtpRepository.findByEmail(customerUser.getEmail().toLowerCase())).isEmpty();
    }

    @Test
    @DisplayName("12. User is actually absent from the database after successful deletion")
    void userActuallyAbsentAfterDeletion() throws Exception {
        User tempUser = new User("Temp User", "temp.user@example.com", "9876543299",
                passwordEncoder.encode("Temp123!"), UserRole.CUSTOMER);
        tempUser.setActive(true);
        tempUser.setAccountStatus(AccountStatus.APPROVED);
        tempUser = userRepository.save(tempUser);
        Long tempId = tempUser.getId();

        assertThat(userRepository.findById(tempId)).isPresent();

        mockMvc.perform(delete("/api/admin/users/" + tempId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        assertThat(userRepository.findById(tempId)).isEmpty();
    }

    @Test
    @DisplayName("13. Existing admin approval functionality still works")
    void existingAdminApprovalStillWorks() throws Exception {
        mockMvc.perform(put("/api/admin/users/" + shopOwnerUser.getId() + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountStatus").value("APPROVED"));

        User refreshed = userRepository.findById(shopOwnerUser.getId()).orElseThrow();
        assertThat(refreshed.getAccountStatus()).isEqualTo(AccountStatus.APPROVED);
    }

    @Test
    @DisplayName("14. Existing GET /api/admin/users still works")
    void existingGetAdminUsersStillWorks() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
