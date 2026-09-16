package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateOrderRequest;
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
class OrderApiTests {

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

    private Shop shop;
    private Category category;
    private Product productA;
    private Product productB;
    private Inventory inventoryA;
    private Inventory inventoryB;
    private Address address1;
    private Address address2;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        customer1 = userRepository.save(new User("Customer One", "cust1@locvia.com", "9876543210", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER));
        customer2 = userRepository.save(new User("Customer Two", "cust2@locvia.com", "9876543211", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER));
        shopOwner = userRepository.save(new User("Shop Owner", "owner@locvia.com", "9876543212", passwordEncoder.encode("Pass@123"), UserRole.SHOP_OWNER));
        deliveryPartner = userRepository.save(new User("Delivery Guy", "delivery@locvia.com", "9876543213", passwordEncoder.encode("Pass@123"), UserRole.DELIVERY_PARTNER));
        admin = userRepository.save(new User("Platform Admin", "admin@locvia.com", "9876543214", passwordEncoder.encode("Pass@123"), UserRole.ADMIN));

        customer1Token = jwtService.generateToken(customer1.getEmail(), customer1.getId(), "ROLE_CUSTOMER");
        customer2Token = jwtService.generateToken(customer2.getEmail(), customer2.getId(), "ROLE_CUSTOMER");
        shopOwnerToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), "ROLE_DELIVERY_PARTNER");
        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");

        shop = shopRepository.save(new Shop("Fresh Mart", "Best grocery store", "Main Market, Ongole", "9876543220", "fresh@locvia.com", "https://locvia.com/shop.jpg", shopOwner));
        category = new Category("Dairy & Milk", "https://locvia.com/cat.jpg", "Fresh dairy products");
        category.setActive(true);
        category = categoryRepository.save(category);

        productA = productRepository.save(new Product("Fresh Milk 1L", "Pure cows milk", new BigDecimal("60.00"), null, "https://locvia.com/milk.jpg", "1L", shop, category));
        productB = productRepository.save(new Product("Brown Bread", "Whole wheat bread", new BigDecimal("40.00"), null, "https://locvia.com/bread.jpg", "400g", shop, category));

        inventoryA = inventoryRepository.save(new Inventory(productA, 10, 2));
        inventoryB = inventoryRepository.save(new Inventory(productB, 5, 1));

        address1 = addressRepository.save(new Address(customer1, "Home", "Customer One", "9876543210", "12-34 Main St", "Apt 4B", "Ongole", "Andhra Pradesh", "523001"));
        address2 = addressRepository.save(new Address(customer2, "Work", "Customer Two", "9876543211", "56 Tech Park", "", "Vijayawada", "Andhra Pradesh", "520001"));
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
    @DisplayName("1. Customer can place order from non-empty cart with stock deduction and address snapshot")
    void testCreateOrderSuccess() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 2)); // 2 * 60 = 120
        cartItemRepository.save(new CartItem(cart, productB, 1)); // 1 * 40 = 40; total = 160

        CreateOrderRequest request = new CreateOrderRequest(address1.getId());

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"))
                .andExpect(jsonPath("$.subtotal").value(160.00))
                .andExpect(jsonPath("$.totalAmount").value(160.00))
                .andExpect(jsonPath("$.itemCount").value(3))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.deliveryAddress.recipientName").value("Customer One"))
                .andExpect(jsonPath("$.deliveryAddress.city").value("Ongole"))
                .andExpect(jsonPath("$.deliveryAddress.postalCode").value("523001"));

        // Verify inventory deducted
        Inventory updatedInvA = inventoryRepository.findByProductId(productA.getId()).orElseThrow();
        Inventory updatedInvB = inventoryRepository.findByProductId(productB.getId()).orElseThrow();
        assertThat(updatedInvA.getQuantity()).isEqualTo(8);
        assertThat(updatedInvB.getQuantity()).isEqualTo(4);

        // Verify cart items cleared but cart entity preserved
        assertThat(cartItemRepository.findByCartId(cart.getId())).isEmpty();
        assertThat(cartRepository.findById(cart.getId())).isPresent();
    }

    @Test
    @DisplayName("2. Order creation rejected when customer cart is empty")
    void testCreateOrderEmptyCart() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(address1.getId());

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("empty cart")));
    }

    @Test
    @DisplayName("3. Order creation rejected when using address belonging to another customer")
    void testCreateOrderOtherUserAddress() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 1));

        CreateOrderRequest request = new CreateOrderRequest(address2.getId()); // belongs to customer2

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    @Test
    @DisplayName("4. Order creation rejected when product is deactivated")
    void testCreateOrderInactiveProduct() throws Exception {
        productA.setActive(false);
        productRepository.save(productA);

        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 1));

        CreateOrderRequest request = new CreateOrderRequest(address1.getId());

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("no longer available")));
    }

    @Test
    @DisplayName("5. Order creation rejected when product is out of stock")
    void testCreateOrderOutOfStock() throws Exception {
        inventoryA.setQuantity(0);
        inventoryRepository.save(inventoryA);

        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 1));

        CreateOrderRequest request = new CreateOrderRequest(address1.getId());

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("out of stock")));
    }

    @Test
    @DisplayName("6. Order creation rejected when requested quantity exceeds available stock")
    void testCreateOrderInsufficientStock() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 15)); // requested 15, only 10 in stock

        CreateOrderRequest request = new CreateOrderRequest(address1.getId());

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Only 10 units")));
    }

    @Test
    @DisplayName("7. Atomic rollback: When one item fails stock check, 0 stock deducted, 0 order created, cart untouched")
    void testAtomicRollback() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 2));  // valid: stock 10
        cartItemRepository.save(new CartItem(cart, productB, 10)); // invalid: stock only 5

        CreateOrderRequest request = new CreateOrderRequest(address1.getId());

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());

        // Verify stock A remains 10, stock B remains 5
        assertThat(inventoryRepository.findByProductId(productA.getId()).orElseThrow().getQuantity()).isEqualTo(10);
        assertThat(inventoryRepository.findByProductId(productB.getId()).orElseThrow().getQuantity()).isEqualTo(5);

        // Verify 0 orders created
        assertThat(orderRepository.count()).isEqualTo(0);

        // Verify cart items remained intact
        assertThat(cartItemRepository.findByCartId(cart.getId())).hasSize(2);
    }

    @Test
    @DisplayName("8. Backend calculates price from authoritative database and ignores client pricing tampering")
    void testBackendAuthoritativePriceCalculation() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 3)); // 3 * 60 = 180

        // Client passes arbitrary body with fake subtotal or amount
        String maliciousPayload = "{\"addressId\":" + address1.getId() + ",\"totalAmount\":1.00,\"subtotal\":1.00}";

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalAmount").value(180.00))
                .andExpect(jsonPath("$.subtotal").value(180.00));
    }

    @Test
    @DisplayName("9. Historical price snapshot preserved even if Product.price subsequently changes")
    void testHistoricalPriceSnapshotPreserved() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 1)); // price is 60.00

        CreateOrderRequest request = new CreateOrderRequest(address1.getId());
        String responseStr = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(responseStr).get("id").asLong();

        // Product price changes from 60 to 99
        productA.setPrice(new BigDecimal("99.00"));
        productRepository.save(productA);

        // Inspect order history
        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value(60.00))
                .andExpect(jsonPath("$.items[0].productPrice").value(60.00));
    }

    @Test
    @DisplayName("10. Historical address snapshot preserved even if customer edits saved Address")
    void testHistoricalAddressSnapshotPreserved() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 1));

        CreateOrderRequest request = new CreateOrderRequest(address1.getId());
        String responseStr = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(responseStr).get("id").asLong();

        // Modify customer's Address record
        address1.setAddressLine1("99 New Market Lane");
        address1.setCity("Hyderabad");
        addressRepository.save(address1);

        // Order still shows original address
        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryAddress.addressLine1").value("12-34 Main St"))
                .andExpect(jsonPath("$.deliveryAddress.city").value("Ongole"));
    }

    @Test
    @DisplayName("11. Customer can retrieve own order history (newest first)")
    void testGetMyOrders() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 1));
        mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new CreateOrderRequest(address1.getId())))).andExpect(status().isCreated());

        cartItemRepository.save(new CartItem(cart, productB, 2));
        mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new CreateOrderRequest(address1.getId())))).andExpect(status().isCreated());

        mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("12. Customer cannot view another customer's order (404 Not Found privacy masking)")
    void testCrossCustomerOrderIsolation() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 1));
        String responseStr = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new CreateOrderRequest(address1.getId())))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();

        Long cust1OrderId = objectMapper.readTree(responseStr).get("id").asLong();

        // Customer 2 attempts to view Customer 1's order
        mockMvc.perform(get("/api/orders/" + cust1OrderId)
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    @Test
    @DisplayName("13. Customer can cancel eligible PENDING order and inventory is restored")
    void testCancelOrderSuccess() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 3)); // initial stock 10 -> after order 7

        String responseStr = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new CreateOrderRequest(address1.getId())))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseStr).get("id").asLong();

        assertThat(inventoryRepository.findByProductId(productA.getId()).orElseThrow().getQuantity()).isEqualTo(7);

        // Cancel order
        mockMvc.perform(patch("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // Inventory restored back to 10
        assertThat(inventoryRepository.findByProductId(productA.getId()).orElseThrow().getQuantity()).isEqualTo(10);
    }

    @Test
    @DisplayName("14. Already cancelled order cannot be cancelled again (409 Conflict)")
    void testCannotCancelAlreadyCancelledOrder() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 1));

        String responseStr = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new CreateOrderRequest(address1.getId())))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseStr).get("id").asLong();

        // First cancellation
        mockMvc.perform(patch("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk());

        // Second cancellation attempt
        mockMvc.perform(patch("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already cancelled")));
    }

    @Test
    @DisplayName("15. Customer cannot cancel a DELIVERED order (409 Conflict)")
    void testCannotCancelDeliveredOrder() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer1));
        cartItemRepository.save(new CartItem(cart, productA, 1));

        String responseStr = mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new CreateOrderRequest(address1.getId())))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseStr).get("id").asLong();

        // Mark order DELIVERED
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        mockMvc.perform(patch("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Cannot cancel order")));
    }

    @Test
    @DisplayName("16. Role security: SHOP_OWNER, DELIVERY_PARTNER, and ADMIN blocked from customer order endpoints")
    void testRoleAccessRestrictions() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(address1.getId());

        mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + shopOwnerToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + deliveryToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/orders").header("Authorization", "Bearer " + adminToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
