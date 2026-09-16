package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreatePaymentRequest;
import com.locvia.dto.RazorpayOrderRequest;
import com.locvia.dto.RazorpayVerifyRequest;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PaymentApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User customer1;
    private User customer2;
    private User shopOwner;
    private User deliveryPartner;
    private User admin;

    private String customer1Token;
    private String customer2Token;
    private String shopOwnerToken;
    private String deliveryToken;
    private String adminToken;

    private Order order1;
    private Order order2;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        customer1 = userRepository.save(new User("Customer One", "cust1@locvia.com", "9876543210", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER));
        customer2 = userRepository.save(new User("Customer Two", "cust2@locvia.com", "9876543211", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER));
        shopOwner = userRepository.save(new User("Shop Owner", "owner@locvia.com", "9876543212", passwordEncoder.encode("Pass@123"), UserRole.SHOP_OWNER));
        deliveryPartner = userRepository.save(new User("Delivery Partner", "delivery@locvia.com", "9876543213", passwordEncoder.encode("Pass@123"), UserRole.DELIVERY_PARTNER));
        admin = userRepository.save(new User("Platform Admin", "admin@locvia.com", "9876543214", passwordEncoder.encode("Pass@123"), UserRole.ADMIN));

        customer1Token = jwtService.generateToken(customer1.getEmail(), customer1.getId(), "ROLE_CUSTOMER");
        customer2Token = jwtService.generateToken(customer2.getEmail(), customer2.getId(), "ROLE_CUSTOMER");
        shopOwnerToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), "ROLE_DELIVERY_PARTNER");
        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");

        Address addr1 = addressRepository.save(new Address(customer1, "Home", "Customer One", "9876543210", "12-34 Main St", "", "Ongole", "Andhra Pradesh", "523001"));
        Address addr2 = addressRepository.save(new Address(customer2, "Work", "Customer Two", "9876543211", "56 Tech Park", "", "Ongole", "Andhra Pradesh", "523001"));

        order1 = new Order(customer1, addr1, new BigDecimal("250.00"), OrderStatus.PENDING, PaymentStatus.PENDING, "COD");
        order1 = orderRepository.save(order1);

        order2 = new Order(customer2, addr2, new BigDecimal("450.00"), OrderStatus.PENDING, PaymentStatus.PENDING, "COD");
        order2 = orderRepository.save(order2);
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        paymentRepository.deleteAll();
        deliveryRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        addressRepository.deleteAll();
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Customer can execute mock payment for own order")
    void testCreateMockPaymentSuccess() throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest(order1.getId(), "RAZORPAY");

        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.orderId").value(order1.getId()))
                .andExpect(jsonPath("$.amount").value(250.00))
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.paymentMethod").value("RAZORPAY"))
                .andExpect(jsonPath("$.provider").value("MOCK"))
                .andExpect(jsonPath("$.transactionId", startsWith("MOCK_TXN_")));

        // Order paymentStatus synchronizes to PAID while OrderStatus remains PENDING
        Order updated = orderRepository.findById(order1.getId()).orElseThrow();
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    @DisplayName("2. Client cannot supply or tamper payment amount (backend uses Order.totalAmount)")
    void testPaymentAmountTamperingIgnored() throws Exception {
        String maliciousPayload = "{\"orderId\":" + order1.getId() + ",\"paymentMethod\":\"RAZORPAY\",\"amount\":1.00}";

        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amount").value(250.00)); // Authoritative order total
    }

    @Test
    @DisplayName("3. Already-paid order cannot be paid again (409 Conflict)")
    void testCannotPayAlreadyPaidOrder() throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest(order1.getId(), "RAZORPAY");

        // First payment
        mockMvc.perform(post("/api/payments").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request))).andExpect(status().isCreated());

        // Duplicate payment attempt
        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already been paid")));
    }

    @Test
    @DisplayName("4. Cancelled order cannot be paid (409 Conflict)")
    void testCannotPayCancelledOrder() throws Exception {
        order1.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order1);

        CreatePaymentRequest request = new CreatePaymentRequest(order1.getId(), "RAZORPAY");

        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("cancelled order")));
    }

    @Test
    @DisplayName("5. Delivered order cannot be paid (409 Conflict)")
    void testCannotPayDeliveredOrder() throws Exception {
        order1.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order1);

        CreatePaymentRequest request = new CreatePaymentRequest(order1.getId(), "RAZORPAY");

        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("delivered order")));
    }

    @Test
    @DisplayName("6. Customer payment isolation: Customer A can view Payment A, but cannot access Payment B")
    void testCustomerPaymentIsolation() throws Exception {
        Payment payA = paymentRepository.save(new Payment(order1, new BigDecimal("250.00"), PaymentStatus.PAID, "RAZORPAY", "MOCK_TXN_A", "MOCK", "INR"));
        Payment payB = paymentRepository.save(new Payment(order2, new BigDecimal("450.00"), PaymentStatus.PAID, "RAZORPAY", "MOCK_TXN_B", "MOCK", "INR"));

        // Customer A can view Payment A
        mockMvc.perform(get("/api/payments/" + payA.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(order1.getId()));

        // Customer A CANNOT view Payment B (404 Not Found)
        mockMvc.perform(get("/api/payments/" + payB.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNotFound());

        // Customer A CANNOT pay for Customer B's order
        CreatePaymentRequest payOrder2 = new CreatePaymentRequest(order2.getId(), "RAZORPAY");
        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payOrder2)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("7. Customer can retrieve payment by order ID and payment history (newest first)")
    void testGetPaymentByOrderIdAndHistory() throws Exception {
        paymentRepository.save(new Payment(order1, new BigDecimal("250.00"), PaymentStatus.PAID, "RAZORPAY", "MOCK_TXN_1", "MOCK", "INR"));

        // By order ID
        mockMvc.perform(get("/api/orders/" + order1.getId() + "/payment")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(250.00))
                .andExpect(jsonPath("$.status").value("PAID"));

        // History
        mockMvc.perform(get("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].orderId").value(order1.getId()));
    }

    @Test
    @DisplayName("8. Role security: SHOP_OWNER, DELIVERY_PARTNER, ADMIN, and unauthenticated blocked from payment APIs")
    void testPaymentRoleAccess() throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest(order1.getId(), "RAZORPAY");

        mockMvc.perform(post("/api/payments").header("Authorization", "Bearer " + shopOwnerToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/payments").header("Authorization", "Bearer " + deliveryToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/payments").header("Authorization", "Bearer " + adminToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/payments").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("9. Validation: Blank payment method and invalid order ID are rejected with 400 Bad Request")
    void testPaymentValidation() throws Exception {
        CreatePaymentRequest blankMethod = new CreatePaymentRequest(order1.getId(), "   ");
        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankMethod)))
                .andExpect(status().isBadRequest());

        CreatePaymentRequest invalidOrder = new CreatePaymentRequest(-5L, "RAZORPAY");
        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidOrder)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("10. Customer B cannot access Customer A's order payment via /api/orders/{id}/payment (404)")
    void testGetOrderPaymentCrossCustomer() throws Exception {
        paymentRepository.save(new Payment(order1, new BigDecimal("250.00"), PaymentStatus.PAID, "RAZORPAY", "MOCK_TXN_CROSS", "MOCK", "INR"));

        mockMvc.perform(get("/api/orders/" + order1.getId() + "/payment")
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("11. Payment history returns payments ordered newest first")
    void testPaymentHistoryOrdering() throws Exception {
        Payment pay1 = new Payment(order1, new BigDecimal("250.00"), PaymentStatus.PAID, "RAZORPAY", "MOCK_TXN_EARLIER", "MOCK", "INR");
        pay1.setCreatedAt(java.time.LocalDateTime.now().minusHours(2));
        paymentRepository.save(pay1);

        // Create second order for customer 1
        Address addr1 = order1.getAddress();
        Order order3 = orderRepository.save(new Order(customer1, addr1, new BigDecimal("120.00"), OrderStatus.PENDING, PaymentStatus.PAID, "RAZORPAY"));
        Payment pay2 = new Payment(order3, new BigDecimal("120.00"), PaymentStatus.PAID, "RAZORPAY", "MOCK_TXN_LATER", "MOCK", "INR");
        pay2.setCreatedAt(java.time.LocalDateTime.now());
        paymentRepository.save(pay2);

        mockMvc.perform(get("/api/payments")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].orderId").value(order3.getId()))
                .andExpect(jsonPath("$[1].orderId").value(order1.getId()));
    }

    @Test
    @DisplayName("12. Customer can create Razorpay order for own order with server-calculated paise")
    void testCreateRazorpayOrderSuccess() throws Exception {
        RazorpayOrderRequest request = new RazorpayOrderRequest(order1.getId());

        mockMvc.perform(post("/api/payments/razorpay/order")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", startsWith("order_")))
                .andExpect(jsonPath("$.orderId").value(order1.getId()))
                .andExpect(jsonPath("$.amount").value(25000)) // 250.00 * 100 paise
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.status").value("created"));
    }

    @Test
    @DisplayName("13. Client cannot manipulate Razorpay order amount (server-authoritative)")
    void testCreateRazorpayOrderTamperingIgnored() throws Exception {
        String tamperingJson = "{\"orderId\":" + order1.getId() + ",\"amount\":100}";

        mockMvc.perform(post("/api/payments/razorpay/order")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tamperingJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(25000)); // Still authoritative 250.00 * 100
    }

    @Test
    @DisplayName("14. Customer cannot create Razorpay order for another customer's order (404)")
    void testCreateRazorpayOrderCrossCustomerBlocked() throws Exception {
        RazorpayOrderRequest request = new RazorpayOrderRequest(order2.getId());

        mockMvc.perform(post("/api/payments/razorpay/order")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("15. Razorpay order creation rejected for CANCELLED, DELIVERED, or already PAID orders")
    void testCreateRazorpayOrderInvalidStatesRejected() throws Exception {
        // Cancelled order
        order1.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order1);
        mockMvc.perform(post("/api/payments/razorpay/order")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RazorpayOrderRequest(order1.getId()))))
                .andExpect(status().isConflict());

        // Delivered order
        order1.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order1);
        mockMvc.perform(post("/api/payments/razorpay/order")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RazorpayOrderRequest(order1.getId()))))
                .andExpect(status().isConflict());

        // Already paid order
        order1.setStatus(OrderStatus.PENDING);
        order1.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(order1);
        mockMvc.perform(post("/api/payments/razorpay/order")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RazorpayOrderRequest(order1.getId()))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("16. Successful Razorpay payment verification updates Payment and Order paymentStatus to PAID")
    void testVerifyRazorpayPaymentSuccess() throws Exception {
        RazorpayVerifyRequest request = new RazorpayVerifyRequest(
                order1.getId(),
                "order_mock1234567890",
                "pay_mock9876543210",
                "valid_signature_hash"
        );

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(order1.getId()))
                .andExpect(jsonPath("$.amount").value(250.00))
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.paymentMethod").value("RAZORPAY"))
                .andExpect(jsonPath("$.provider").value("RAZORPAY"))
                .andExpect(jsonPath("$.transactionId").value("pay_mock9876543210"));

        Order updatedOrder = orderRepository.findById(order1.getId()).orElseThrow();
        assertThat(updatedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(updatedOrder.getPaymentMethod()).isEqualTo("RAZORPAY");
    }

    @Test
    @DisplayName("17. Invalid Razorpay signature is rejected with 400 Bad Request")
    void testVerifyRazorpayPaymentInvalidSignatureRejected() throws Exception {
        RazorpayVerifyRequest request = new RazorpayVerifyRequest(
                order1.getId(),
                "order_mock1234567890",
                "pay_mock9876543210",
                "INVALID_SIG"
        );

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("verification failed")));
    }

    @Test
    @DisplayName("18. Customer cannot verify Razorpay payment for another customer's order (404)")
    void testVerifyRazorpayPaymentCrossCustomerBlocked() throws Exception {
        RazorpayVerifyRequest request = new RazorpayVerifyRequest(
                order2.getId(),
                "order_mock1234567890",
                "pay_mock9876543210",
                "valid_sig"
        );

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("19. Duplicate Razorpay payment verification is idempotent and does not create duplicate payments")
    void testVerifyRazorpayPaymentIdempotent() throws Exception {
        RazorpayVerifyRequest request = new RazorpayVerifyRequest(
                order1.getId(),
                "order_mock1234567890",
                "pay_mock9876543210",
                "valid_signature"
        );

        // First verification
        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Duplicate verification
        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        assertThat(paymentRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("20. Razorpay webhook endpoint processes valid signature and payload successfully")
    void testHandleRazorpayWebhookSuccess() throws Exception {
        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_test123\"}}}}";

        mockMvc.perform(post("/api/payments/razorpay/webhook")
                        .header("X-Razorpay-Signature", "valid_webhook_sig_mock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.message").value(containsString("Webhook processed successfully")));
    }

    @Test
    @DisplayName("21. Razorpay webhook rejects invalid signature with 400 Bad Request")
    void testHandleRazorpayWebhookInvalidSignatureRejected() throws Exception {
        String payload = "{\"event\":\"payment.captured\"}";

        mockMvc.perform(post("/api/payments/razorpay/webhook")
                        .header("X-Razorpay-Signature", "INVALID_SIG")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Invalid webhook signature")));
    }

    @Test
    @DisplayName("22. Razorpay webhook rejects empty payload with 400 Bad Request")
    void testHandleRazorpayWebhookEmptyPayloadRejected() throws Exception {
        mockMvc.perform(post("/api/payments/razorpay/webhook")
                        .header("X-Razorpay-Signature", "valid_sig")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""))
                .andExpect(status().isBadRequest());
    }
}
