package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateCategoryRequest;
import com.locvia.dto.CreatePaymentRequest;
import com.locvia.dto.RazorpayVerifyRequest;
import com.locvia.dto.RegisterRequest;
import com.locvia.entity.*;
import com.locvia.exception.ExternalServiceException;
import com.locvia.repository.*;
import com.locvia.security.JwtService;
import com.locvia.service.CloudinaryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.web.multipart.MultipartFile;

/**
 * Focused test suite verifying Module 62 Global Exception Handling across Locvia.
 * Verifies standard ApiErrorResponse structures, proper HTTP status mappings,
 * and zero leakage of stack traces, SQL, and external service secrets.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(GlobalExceptionHandlingTests.MockCloudinaryConfig.class)
class GlobalExceptionHandlingTests {

    @TestConfiguration
    static class MockCloudinaryConfig {
        @Bean
        @Primary
        public CloudinaryService testCloudinaryService() {
            return new CloudinaryService(null) {
                @Override
                public CloudinaryUploadResult uploadProductImage(MultipartFile file) {
                    if ("fail.png".equals(file.getOriginalFilename())) {
                        throw new ExternalServiceException("Image upload service is temporarily unavailable");
                    }
                    validateImageFile(file);
                    return new CloudinaryUploadResult("https://res.cloudinary.com/demo/image/upload/sample.png", "locvia/products/sample");
                }

                @Override
                public void deleteImage(String publicId) {
                }
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User admin;
    private User customer;
    private User shopOwner;

    private String adminToken;
    private String customerToken;
    private String shopOwnerToken;

    private Shop shop;
    private Category category;
    private Product product;
    private Order order;

    @BeforeEach
    void setUp() {
        tearDown();

        // 1. Seed Users
        admin = userRepository.save(new User(
                "Admin Exception", "admin.ex@example.com", "9876543201",
                passwordEncoder.encode("AdminPass@123"), UserRole.ADMIN
        ));
        customer = userRepository.save(new User(
                "Customer Exception", "cust.ex@example.com", "9876543202",
                passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER
        ));
        shopOwner = userRepository.save(new User(
                "ShopOwner Exception", "owner.ex@example.com", "9876543203",
                passwordEncoder.encode("Pass@123"), UserRole.SHOP_OWNER
        ));

        // 2. Generate JWT tokens
        adminToken = "Bearer " + jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
        customerToken = "Bearer " + jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");
        shopOwnerToken = "Bearer " + jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");

        // 3. Seed domain records
        shop = shopRepository.save(new Shop(
                "Exception Mart", "Fresh Store", "123 Main Road", "9876543203",
                "shop.ex@example.com", "https://locvia.com/shop.png", shopOwner
        ));

        category = categoryRepository.save(new Category(
                "Fresh Fruits", "https://locvia.com/fruits.png", "Crisp fruits"
        ));

        product = productRepository.save(new Product(
                "Kashmir Apples", "Crisp and juicy apples",
                new BigDecimal("120.00"), null, "https://locvia.com/apple.png", "kg",
                shop, category
        ));

        inventoryRepository.save(new Inventory(product, 50, 10));

        Address address = addressRepository.save(new Address(
                customer, "Home", "Customer User", "9876543202",
                "Flat 101, Park Heights", "Beside City Park", "Ongole", "Andhra Pradesh",
                "523001"
        ));

        order = new Order(
                customer, address, new BigDecimal("240.00"), OrderStatus.CONFIRMED,
                PaymentStatus.PENDING, "COD"
        );
        order = orderRepository.save(order);

        OrderItem orderItem = new OrderItem(order, product, product.getName(), product.getPrice(), 2, new BigDecimal("240.00"), product.getImageUrl());
        orderItemRepository.save(orderItem);
    }

    @AfterEach
    void tearDown() {
        deliveryRepository.deleteAll();
        paymentRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        addressRepository.deleteAll();
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        shopRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ── 1. ResourceNotFoundException → 404 ────────────────────────────────────

    @Test
    @DisplayName("01. ResourceNotFoundException returns HTTP 404 Not Found")
    void testResourceNotFound() throws Exception {
        mockMvc.perform(get("/api/products/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message", containsString("not found")))
                .andExpect(jsonPath("$.path").value("/api/products/999999"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    // ── 2. BusinessException → 409 ───────────────────────────────────────────

    @Test
    @DisplayName("02. BusinessException returns HTTP 409 Conflict")
    void testBusinessException() throws Exception {
        // First payment succeeds
        CreatePaymentRequest payReq = new CreatePaymentRequest(order.getId(), "CASH_ON_DELIVERY");
        mockMvc.perform(post("/api/payments")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isCreated());

        // Second payment attempt triggers BusinessException / IllegalStateException (Already paid)
        mockMvc.perform(post("/api/payments")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message", containsString("already been paid")))
                .andExpect(jsonPath("$.path").value("/api/payments"));
    }

    // ── 3. DuplicateResourceException → 409 ──────────────────────────────────

    @Test
    @DisplayName("03. DuplicateResourceException returns HTTP 409 Conflict")
    void testDuplicateResourceException() throws Exception {
        RegisterRequest duplicateReq = new RegisterRequest(
                "Duplicate Person", "cust.ex@example.com", "9876543202",
                "Pass@123", UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message", containsString("already registered")))
                .andExpect(jsonPath("$.path").value("/api/auth/register"));
    }

    // ── 4. Validation Failure → 400 ──────────────────────────────────────────

    @Test
    @DisplayName("04. Validation failure returns HTTP 400 Bad Request with field error")
    void testValidationFailure() throws Exception {
        RegisterRequest invalidReq = new RegisterRequest(
                "", "valid.email@example.com", "9876543210",
                "Pass@123", UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name").exists());
    }

    // ── 5. Multiple Validation Errors Returned ────────────────────────────────

    @Test
    @DisplayName("05. Multiple validation errors returned in errors map")
    void testMultipleValidationErrors() throws Exception {
        RegisterRequest multiInvalidReq = new RegisterRequest(
                "", "not-an-email", "9876543210",
                "short", UserRole.CUSTOMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(multiInvalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    // ── 6. Malformed JSON → 400 ──────────────────────────────────────────────

    @Test
    @DisplayName("06. Malformed JSON returns HTTP 400 without stack trace")
    void testMalformedJson() throws Exception {
        String brokenJson = "{\"name\": \"Milk\", \"price\": }";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(brokenJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message", containsString("Malformed JSON request")))
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    // ── 7. Invalid Enum Value → 400 ──────────────────────────────────────────

    @Test
    @DisplayName("07. Invalid Enum returns HTTP 400 with clean message")
    void testInvalidEnum() throws Exception {
        String invalidEnumJson = "{\"status\": \"INVALID_STATUS_VALUE\"}";

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidEnumJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message", containsString("Invalid order status")))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    // ── 8. Path Variable Type Mismatch → 400 ─────────────────────────────────

    @Test
    @DisplayName("08. Path variable type mismatch returns HTTP 400")
    void testTypeMismatch() throws Exception {
        mockMvc.perform(get("/api/products/abc")
                        .header("Authorization", customerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message", containsString("Invalid ID format")))
                .andExpect(jsonPath("$.path").value("/api/products/abc"));
    }

    // ── 9. Missing Request Parameter → 400 ───────────────────────────────────

    @Test
    @DisplayName("09. Missing required multipart parameter returns HTTP 400")
    void testMissingRequestParameter() throws Exception {
        mockMvc.perform(multipart("/api/products/" + product.getId() + "/image")
                        .header("Authorization", shopOwnerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message", containsString("Required request parameter is missing")));
    }

    // ── 10. Unsupported HTTP Method → 405 ────────────────────────────────────

    @Test
    @DisplayName("10. Unsupported HTTP method returns HTTP 405 Method Not Allowed")
    void testUnsupportedHttpMethod() throws Exception {
        mockMvc.perform(post("/api/health"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.error").value("Method Not Allowed"))
                .andExpect(jsonPath("$.message", containsString("not supported")));
    }

    // ── 11. Missing Endpoint → 404 ───────────────────────────────────────────

    @Test
    @DisplayName("11. Nonexistent endpoint returns HTTP 404 Not Found")
    void testMissingEndpoint() throws Exception {
        mockMvc.perform(get("/api/non-existent-endpoint-xyz")
                        .header("Authorization", customerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message", containsString("Endpoint not found")));
    }

    // ── 12. Role Restriction → 403 Forbidden ─────────────────────────────────

    @Test
    @DisplayName("12. Customer accessing admin endpoint returns HTTP 403 Forbidden")
    void testCustomerAccessingAdminApiForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message", containsString("Access denied")))
                .andExpect(jsonPath("$.path").value("/api/admin/users"));
    }

    // ── 13. Missing JWT → 401 Unauthorized ───────────────────────────────────

    @Test
    @DisplayName("13. Missing JWT token on protected endpoint returns HTTP 401 Unauthorized")
    void testMissingJwtUnauthorized() throws Exception {
        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message", containsString("Authentication is required")))
                .andExpect(jsonPath("$.path").value("/api/orders"));
    }

    // ── 14. Invalid/Expired JWT → 401 Unauthorized ───────────────────────────

    @Test
    @DisplayName("14. Invalid JWT token returns HTTP 401 Unauthorized")
    void testInvalidJwtUnauthorized() throws Exception {
        mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer invalid.malformed.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message", containsString("Authentication is required")))
                .andExpect(jsonPath("$.path").value("/api/orders"));
    }

    // ── 15. Database Duplicate Constraint → 409 ──────────────────────────────

    @Test
    @DisplayName("15. Duplicate category name triggers HTTP 409 Conflict without SQL details")
    void testDuplicateCategoryNameConflict() throws Exception {
        CreateCategoryRequest dupCategory = new CreateCategoryRequest(
                "Fresh Fruits", "https://locvia.com/fruits2.png", "Duplicate fruit"
        );

        MvcResult result = mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupCategory)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).doesNotContain("SQL", "INSERT INTO", "Hibernate", "foreign key");
    }

    // ── 16. External Gateway Failure → 502 Bad Gateway ───────────────────────

    @Test
    @DisplayName("16. Cloudinary external service failure returns HTTP 502 Bad Gateway")
    void testExternalServiceFailure() throws Exception {
        MockMultipartFile imageFile = new MockMultipartFile(
                "file", "fail.png", "image/png", new byte[]{1, 2, 3, 4}
        );

        mockMvc.perform(multipart("/api/products/" + product.getId() + "/image")
                        .file(imageFile)
                        .header("Authorization", shopOwnerToken))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502))
                .andExpect(jsonPath("$.error").value("Bad Gateway"))
                .andExpect(jsonPath("$.message").value("Image upload service is temporarily unavailable"))
                .andExpect(jsonPath("$.path").value("/api/products/" + product.getId() + "/image"));
    }

    // ── 17. Razorpay Signature Verification Failure → 400 ────────────────────

    @Test
    @DisplayName("17. Razorpay signature verification failure returns HTTP 400")
    void testRazorpaySignatureFailure() throws Exception {
        RazorpayVerifyRequest verifyReq = new RazorpayVerifyRequest(
                order.getId(), "order_rzp_123", "pay_rzp_123", "INVALID_SIG"
        );

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Payment verification failed"));
    }

    // ── 18. Webhook Signature Verification Failure → 400 ─────────────────────

    @Test
    @DisplayName("18. Webhook invalid signature returns HTTP 400 without leaking secret")
    void testWebhookSignatureFailure() throws Exception {
        String rawWebhookPayload = "{\"event\": \"payment.captured\"}";

        mockMvc.perform(post("/api/payments/razorpay/webhook")
                        .header("X-Razorpay-Signature", "INVALID_SIG")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rawWebhookPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid webhook signature"))
                .andExpect(jsonPath("$.path").value("/api/payments/razorpay/webhook"));
    }

    // ── 19. No Stack Traces or SQL Leaks ─────────────────────────────────────

    @Test
    @DisplayName("19. Error responses never leak stack traces or internal SQL")
    void testNoStackTraceOrSqlLeak() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/products/abc")
                        .header("Authorization", customerToken))
                .andExpect(status().isBadRequest())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("at com.locvia", "Exception:", "NullPointerException", "stackTrace", "trace");
        assertThat(body).doesNotContain("SELECT", "INSERT", "UPDATE", "DELETE", "SQLIntegrityConstraintViolationException");
    }

    // ── 20. No Sensitive Secrets Leaked ──────────────────────────────────────

    @Test
    @DisplayName("20. Error responses never leak Razorpay or Cloudinary secrets")
    void testNoSecretsLeaked() throws Exception {
        RazorpayVerifyRequest verifyReq = new RazorpayVerifyRequest(
                order.getId(), "order_rzp_123", "pay_rzp_123", "INVALID_SIG"
        );

        MvcResult result = mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "CLOUDINARY_API_SECRET", "mock_secret", "mock_webhook_secret");
    }
}
