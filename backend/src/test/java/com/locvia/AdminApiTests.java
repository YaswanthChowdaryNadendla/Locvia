package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.UpdateOrderStatusRequest;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminApiTests {

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
    private CartItemRepository cartItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User admin;
    private User customer;
    private User shopOwner;
    private User deliveryPartner;

    private String adminToken;
    private String customerToken;
    private String shopOwnerToken;
    private String deliveryToken;

    private Shop shop;
    private Category category;
    private Product product;
    private Inventory inventory;
    private Address address;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        admin = userRepository.save(new User("Super Admin", "admin.m60@locvia.com", "9876543200", passwordEncoder.encode("Pass@123"), UserRole.ADMIN));
        customer = userRepository.save(new User("Regular Customer", "customer.m60@locvia.com", "9876543201", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER));
        shopOwner = userRepository.save(new User("Shop Owner", "owner.m60@locvia.com", "9876543202", passwordEncoder.encode("Pass@123"), UserRole.SHOP_OWNER));
        deliveryPartner = userRepository.save(new User("Delivery Agent", "delivery.m60@locvia.com", "9876543203", passwordEncoder.encode("Pass@123"), UserRole.DELIVERY_PARTNER));

        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");
        shopOwnerToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), "ROLE_DELIVERY_PARTNER");

        shop = shopRepository.save(new Shop("Metro Fresh Supermarket", "All daily essentials", "Court Road, Ongole", "9876543204", "metro@locvia.com", "https://locvia.com/shop.jpg", shopOwner));

        category = new Category("Fruits & Vegetables", "https://locvia.com/cat.jpg", "Organic fresh produce");
        category.setActive(true);
        category = categoryRepository.save(category);

        product = productRepository.save(new Product(
                "Fresh Farm Apples", "Crisp red apples 1kg", new BigDecimal("120.00"), null,
                "https://locvia.com/apple.jpg", "1 kg", shop, category
        ));

        inventory = inventoryRepository.save(new Inventory(product, 50, 10));

        address = addressRepository.save(new Address(
                customer, "Home", "Regular Customer", "9876543201",
                "House 101, Main St", "Near Clock Tower", "Ongole", "Andhra Pradesh", "523001"
        ));
    }

    private void cleanDatabase() {
        notificationRepository.deleteAll();
        reviewRepository.deleteAll();
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

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    @Test
    @DisplayName("1. Admin dashboard returns accurate aggregate metrics and real revenue computation")
    void testAdminDashboardMetricsAndRevenue() throws Exception {
        Order paidOrder = new Order(
                customer, address, new BigDecimal("240.00"), OrderStatus.CONFIRMED,
                PaymentStatus.PAID, "ONLINE"
        );
        paidOrder = orderRepository.save(paidOrder);

        Payment payment1 = new Payment(paidOrder, new BigDecimal("240.00"), PaymentStatus.PAID, "ONLINE", "pay_rzp_111", "RAZORPAY", "INR");
        paymentRepository.save(payment1);

        Order pendingOrder = new Order(
                customer, address, new BigDecimal("100.00"), OrderStatus.PENDING,
                PaymentStatus.PENDING, "ONLINE"
        );
        pendingOrder = orderRepository.save(pendingOrder);

        Payment payment2 = new Payment(pendingOrder, new BigDecimal("100.00"), PaymentStatus.PENDING, "ONLINE", "txn_pending_111", "RAZORPAY", "INR");
        paymentRepository.save(payment2);

        // Verify GET /api/admin/dashboard
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(4))
                .andExpect(jsonPath("$.totalCustomers").value(1))
                .andExpect(jsonPath("$.totalShopOwners").value(1))
                .andExpect(jsonPath("$.totalDeliveryPartners").value(1))
                .andExpect(jsonPath("$.totalAdmins").value(1))
                .andExpect(jsonPath("$.totalShops").value(1))
                .andExpect(jsonPath("$.activeShops").value(1))
                .andExpect(jsonPath("$.totalProducts").value(1))
                .andExpect(jsonPath("$.activeProducts").value(1))
                .andExpect(jsonPath("$.totalOrders").value(2))
                .andExpect(jsonPath("$.pendingOrders").value(1))
                .andExpect(jsonPath("$.confirmedOrders").value(1))
                .andExpect(jsonPath("$.successfulPayments").value(1))
                .andExpect(jsonPath("$.totalRevenue").value(240.00));

        // Verify alias GET /api/admin/metrics
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue").value(240.00));
    }

    @Test
    @DisplayName("2. Admin user management with query filtering")
    void testAdminUsersFiltering() throws Exception {
        mockMvc.perform(get("/api/admin/users?role=CUSTOMER")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email").value("customer.m60@locvia.com"));

        mockMvc.perform(get("/api/admin/users?search=Super")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Super Admin"));
    }

    @Test
    @DisplayName("3. Admin shop management with query filtering")
    void testAdminShopsFiltering() throws Exception {
        mockMvc.perform(get("/api/admin/shops?active=true&search=Metro")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Metro Fresh Supermarket"));

        mockMvc.perform(get("/api/admin/shops?search=NonExistent")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("4. Admin order inspection and status lifecycle updates with inventory restock on cancel")
    void testAdminOrderLifecycleAndStockRestoration() throws Exception {
        Order order = new Order(
                customer, address, new BigDecimal("240.00"), OrderStatus.PENDING,
                PaymentStatus.PENDING, "ONLINE"
        );
        order = orderRepository.save(order);

        OrderItem item = new OrderItem(order, product, product.getName(), product.getPrice(), 5, new BigDecimal("600.00"));
        orderItemRepository.save(item);

        inventory.setQuantity(45); // simulated stock after order creation
        inventoryRepository.save(inventory);

        // Admin gets order list
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(order.getId()))
                .andExpect(jsonPath("$[0].items", hasSize(1)));

        // Admin updates status to CONFIRMED
        UpdateOrderStatusRequest updateReq = new UpdateOrderStatusRequest(OrderStatus.CONFIRMED);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // Admin cancels order -> inventory must be restored from 45 to 50
        UpdateOrderStatusRequest cancelReq = new UpdateOrderStatusRequest(OrderStatus.CANCELLED);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        Inventory updatedInv = inventoryRepository.findByProductId(product.getId()).orElseThrow();
        assertThat(updatedInv.getQuantity()).isEqualTo(50);
    }

    @Test
    @DisplayName("5. Admin order status transition rejected when illegal")
    void testAdminOrderInvalidStatusTransition() throws Exception {
        Order order = new Order(
                customer, address, new BigDecimal("120.00"), OrderStatus.CANCELLED,
                PaymentStatus.FAILED, "ONLINE"
        );
        order = orderRepository.save(order);

        // Attempting to move CANCELLED -> DELIVERED must fail
        UpdateOrderStatusRequest invalidReq = new UpdateOrderStatusRequest(OrderStatus.DELIVERED);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot alter status of an already CANCELLED order")));
    }

    @Test
    @DisplayName("6. Admin payment auditing returns sanitized payment records without secrets")
    void testAdminPaymentAuditingWithoutSecretLeakage() throws Exception {
        Order order = orderRepository.save(new Order(
                customer, address, new BigDecimal("120.00"), OrderStatus.CONFIRMED,
                PaymentStatus.PAID, "ONLINE"
        ));

        Payment payment = new Payment(order, new BigDecimal("120.00"), PaymentStatus.PAID, "ONLINE", "pay_rzp_secret_test", "RAZORPAY", "INR");
        payment = paymentRepository.save(payment);

        mockMvc.perform(get("/api/admin/payments")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(payment.getId()))
                .andExpect(jsonPath("$[0].provider").value("RAZORPAY"))
                .andExpect(jsonPath("$[0].transactionId").value("pay_rzp_secret_test"))
                // Assert no password or secret key fields in payload
                .andExpect(jsonPath("$[0].password").doesNotExist())
                .andExpect(jsonPath("$[0].secretKey").doesNotExist());

        mockMvc.perform(get("/api/admin/payments/" + payment.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(120.00));
    }

    @Test
    @DisplayName("7. Admin review moderation (list, inspect, delete)")
    void testAdminReviewModeration() throws Exception {
        Order order = orderRepository.save(new Order(
                customer, address, new BigDecimal("120.00"), OrderStatus.DELIVERED,
                PaymentStatus.PAID, "ONLINE"
        ));

        Review review = new Review(customer, product, shop, order, 5, "Excellent crisp apples!");
        review = reviewRepository.save(review);

        // List reviews
        mockMvc.perform(get("/api/admin/reviews")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(review.getId()))
                .andExpect(jsonPath("$[0].rating").value(5))
                .andExpect(jsonPath("$[0].comment").value("Excellent crisp apples!"));

        // Inspect single review
        mockMvc.perform(get("/api/admin/reviews/" + review.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productName").value("Fresh Farm Apples"));

        // Delete inappropriate review
        mockMvc.perform(delete("/api/admin/reviews/" + review.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Review deleted successfully"));

        assertThat(reviewRepository.findById(review.getId())).isEmpty();
    }

    @Test
    @DisplayName("8. Admin notification inspection")
    void testAdminNotificationInspection() throws Exception {
        Notification notification = new Notification(
                customer, UserRole.CUSTOMER, NotificationType.ORDER_STATUS_UPDATE,
                "Order Confirmed", "Your order has been confirmed", null, shop, null
        );
        notification = notificationRepository.save(notification);

        mockMvc.perform(get("/api/admin/notifications")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Order Confirmed"));

        mockMvc.perform(get("/api/admin/notifications/" + notification.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Your order has been confirmed"));
    }

    @Test
    @DisplayName("9. Role security: non-admin roles get 403 Forbidden, unauthenticated gets 401 Unauthorized")
    void testAdminRoleSecurityStrictness() throws Exception {
        List<String> nonAdminTokens = List.of(customerToken, shopOwnerToken, deliveryToken);
        List<String> adminEndpoints = List.of(
                "/api/admin/dashboard",
                "/api/admin/orders",
                "/api/admin/payments",
                "/api/admin/reviews",
                "/api/admin/notifications"
        );

        // Unauthenticated access -> 401 Unauthorized
        for (String endpoint : adminEndpoints) {
            mockMvc.perform(get(endpoint))
                    .andExpect(status().isUnauthorized());
        }

        // Authenticated non-admin access -> 403 Forbidden
        for (String token : nonAdminTokens) {
            for (String endpoint : adminEndpoints) {
                mockMvc.perform(get(endpoint).header("Authorization", "Bearer " + token))
                        .andExpect(status().isForbidden());
            }
        }
    }
}
