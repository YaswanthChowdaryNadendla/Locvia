package com.locvia;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.*;
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
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CustomerShopAndOrderFlowIntegrationTests {

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
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User shopOwner;
    private User otherShopOwner;
    private User customer;
    private User otherCustomer;
    private User deliveryPartner;
    private User admin;

    private String ownerToken;
    private String otherOwnerToken;
    private String customerToken;
    private String otherCustomerToken;
    private String deliveryToken;
    private String adminToken;

    private Shop approvedShop;
    private Shop pendingShop;
    private Category groceryCategory;
    private Product testRice;
    private Address customerAddress;

    @BeforeEach
    void setUp() {
        cleanupDatabase();

        // 1. Create Users
        shopOwner = userRepository.save(new User("Shop Owner", "owner.orderflow@locvia.com", "9811100001", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        shopOwner.setAccountStatus(AccountStatus.APPROVED);
        shopOwner = userRepository.save(shopOwner);

        otherShopOwner = userRepository.save(new User("Other Owner", "other.owner@locvia.com", "9811100002", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        otherShopOwner.setAccountStatus(AccountStatus.APPROVED);
        otherShopOwner = userRepository.save(otherShopOwner);

        customer = userRepository.save(new User("Customer User", "customer.orderflow@locvia.com", "9811100003", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));
        customer.setAccountStatus(AccountStatus.APPROVED);
        customer = userRepository.save(customer);

        otherCustomer = userRepository.save(new User("Other Customer", "other.cust@locvia.com", "9811100004", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));
        otherCustomer.setAccountStatus(AccountStatus.APPROVED);
        otherCustomer = userRepository.save(otherCustomer);

        deliveryPartner = userRepository.save(new User("Delivery Driver", "driver.orderflow@locvia.com", "9811100005", passwordEncoder.encode("Pass123!"), UserRole.DELIVERY_PARTNER));
        deliveryPartner.setAccountStatus(AccountStatus.APPROVED);
        deliveryPartner = userRepository.save(deliveryPartner);

        admin = userRepository.save(new User("Admin User", "admin.orderflow@locvia.com", "9811100006", passwordEncoder.encode("Pass123!"), UserRole.ADMIN));
        admin.setAccountStatus(AccountStatus.APPROVED);
        admin = userRepository.save(admin);

        // 2. Generate Tokens
        ownerToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");
        otherOwnerToken = jwtService.generateToken(otherShopOwner.getEmail(), otherShopOwner.getId(), "ROLE_SHOP_OWNER");
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");
        otherCustomerToken = jwtService.generateToken(otherCustomer.getEmail(), otherCustomer.getId(), "ROLE_CUSTOMER");
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), "ROLE_DELIVERY_PARTNER");
        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");

        // 3. Create Category
        groceryCategory = categoryRepository.save(new Category("Grains & Rice", "https://img.example.com/cat.jpg", "Grocery items"));

        // 4. Create Approved & Pending Shops
        approvedShop = new Shop("Annapurna Supermarket", "Fresh daily essentials", "12 Market Road", "9811100001", "annapurna@example.com", "https://img.example.com/shop.jpg", shopOwner);
        approvedShop.setActive(true);
        approvedShop.setStatus(ShopStatus.APPROVED);
        approvedShop = shopRepository.save(approvedShop);

        pendingShop = new Shop("Unapproved Corner", "Pending store", "14 Market Road", "9811100002", "pending@example.com", "https://img.example.com/pending.jpg", otherShopOwner);
        pendingShop.setActive(false);
        pendingShop.setStatus(ShopStatus.PENDING);
        pendingShop = shopRepository.save(pendingShop);

        // 5. Create Test Product with initial stock = 20
        testRice = new Product("Test Rice", "Premium Basmati Rice", new BigDecimal("100.00"), new BigDecimal("95.00"), "https://res.cloudinary.com/locvia-cloud/image/upload/sample_rice.jpg", "1 kg", approvedShop, groceryCategory, 20);
        testRice.setActive(true);
        testRice = productRepository.save(testRice);

        Inventory inv = new Inventory(testRice, 20, 5);
        inv.setAvailable(true);
        inventoryRepository.save(inv);

        // 6. Create Customer Address
        customerAddress = new Address(customer, "Home", "Customer User", "9811100003", "Apt 4B, Lotus Enclave", "Near Gandhi Park", "Ongole", "Andhra Pradesh", "523001");
        customerAddress = addressRepository.save(customerAddress);
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
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
    @DisplayName("1. Customer can read approved shop details and products without 403 Forbidden")
    void customerCanReadApprovedShopAndProducts() throws Exception {
        // Customer GET approved shop details -> 200 OK
        mockMvc.perform(get("/api/shops/{id}", approvedShop.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(approvedShop.getId()))
                .andExpect(jsonPath("$.name").value("Annapurna Supermarket"))
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Customer GET products for approved shop -> 200 OK
        mockMvc.perform(get("/api/shops/{shopId}/products", approvedShop.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Test Rice"))
                .andExpect(jsonPath("$[0].price").value(100.00))
                .andExpect(jsonPath("$[0].stockQuantity").value(20))
                .andExpect(jsonPath("$[0].imageUrl").value("https://res.cloudinary.com/locvia-cloud/image/upload/sample_rice.jpg"));

        // Unauthenticated guest can also read approved shop products
        mockMvc.perform(get("/api/shops/{shopId}/products", approvedShop.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Test Rice"));

        // Customer cannot access pending/unapproved shop -> 404 Not Found
        mockMvc.perform(get("/api/shops/{id}", pendingShop.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/shops/{shopId}/products", pendingShop.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("2. Customer cannot modify, create, or delete shops (write operations protected)")
    void customerCannotPerformWriteOperationsOnShops() throws Exception {
        // Customer cannot create shop -> 403
        CreateShopRequest createReq = new CreateShopRequest("Hacked Shop", "Address", "City", "9811100003", "hacked@example.com", null, null, null);
        mockMvc.perform(post("/api/shops")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());

        // Customer cannot update shop -> 403
        UpdateShopRequest updateReq = new UpdateShopRequest("Changed Name", null, null, null, null, null, null, null);
        mockMvc.perform(put("/api/shops/{id}", approvedShop.getId())
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. Customer cannot create products for a shop")
    void customerCannotCreateProducts() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                groceryCategory.getId(),
                "Customer Rice",
                "Description",
                new BigDecimal("50.00"),
                null,
                "1 kg",
                null,
                10,
                10
        );

        mockMvc.perform(post("/api/shops/{shopId}/products", approvedShop.getId())
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("4. Complete Order Flow: Add to cart -> Checkout -> Place order -> Deduct stock (20->18) -> Shop Owner & Admin visibility")
    void completeOrderLifecycleFlow() throws Exception {
        // Step 1: Customer adds 2 units of Test Rice to Cart
        CartItemRequest cartItemRequest = new CartItemRequest(testRice.getId(), 2);
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cartItemRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(2))
                .andExpect(jsonPath("$.items[0].productName").value("Test Rice"))
                .andExpect(jsonPath("$.items[0].quantity").value(2));

        // Step 2: Customer places the order with their delivery address
        CreateOrderRequest orderRequest = new CreateOrderRequest(customerAddress.getId());
        MvcResult orderResult = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.itemCount").value(2))
                .andExpect(jsonPath("$.items[0].productName").value("Test Rice"))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.totalAmount").value(200.00))
                .andReturn();

        JsonNode orderNode = objectMapper.readTree(orderResult.getResponse().getContentAsString());
        Long orderId = orderNode.get("id").asLong();

        // Step 3: Verify EXACTLY ONE Order created in database with correct relations
        assertThat(orderRepository.count()).isEqualTo(1);
        Order persistedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(persistedOrder.getUser().getId()).isEqualTo(customer.getId());
        assertThat(persistedOrder.getStatus()).isEqualTo(OrderStatus.PENDING);

        // Step 4: Verify Stock Deduction: Initial 20 - 2 = 18 in BOTH Inventory and Product tables
        Inventory updatedInv = inventoryRepository.findByProductId(testRice.getId()).orElseThrow();
        assertThat(updatedInv.getQuantity()).isEqualTo(18);

        Product updatedProd = productRepository.findById(testRice.getId()).orElseThrow();
        assertThat(updatedProd.getStock()).isEqualTo(18);

        // Verify Customer sees stock = 18 when browsing the shop
        mockMvc.perform(get("/api/shops/{shopId}/products", approvedShop.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stockQuantity").value(18))
                .andExpect(jsonPath("$[0].stock").value(18));

        // Step 5: Customer Orders page (GET /api/orders) displays the SAME order
        mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(orderId))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        // Step 6: Other customer CANNOT access this order -> 404 Not Found
        mockMvc.perform(get("/api/orders/{id}", orderId)
                        .header("Authorization", "Bearer " + otherCustomerToken))
                .andExpect(status().isNotFound());

        // Step 7: Shop Owner views their store orders (GET /api/shops/{shopId}/orders) -> shows the SAME order
        mockMvc.perform(get("/api/shops/{shopId}/orders", approvedShop.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(orderId))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].customer.name").value("Customer User"))
                .andExpect(jsonPath("$[0].items[0].productName").value("Test Rice"))
                .andExpect(jsonPath("$[0].items[0].quantity").value(2));

        // Other shop owner CANNOT view orders for approvedShop -> 403 Forbidden
        mockMvc.perform(get("/api/shops/{shopId}/orders", approvedShop.getId())
                        .header("Authorization", "Bearer " + otherOwnerToken))
                .andExpect(status().isForbidden());

        // Step 8: Admin views all orders (GET /api/admin/orders) -> shows the SAME order
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(orderId));

        // Step 9: Shop Owner moves order to PREPARING
        UpdateOrderStatusRequest preparingReq = new UpdateOrderStatusRequest(OrderStatus.PREPARING);
        mockMvc.perform(patch("/api/shops/{shopId}/orders/{orderId}/status", approvedShop.getId(), orderId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(preparingReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREPARING"));

        // Step 10: Admin assigns Delivery Partner to the order
        CreateDeliveryRequest deliveryReq = new CreateDeliveryRequest(orderId, deliveryPartner.getId());
        mockMvc.perform(post("/api/admin/deliveries")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deliveryReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(orderId))
                .andExpect(jsonPath("$.deliveryPartnerId").value(deliveryPartner.getId()))
                .andExpect(jsonPath("$.status").value("ASSIGNED"));

        // Step 11: Delivery Partner sees assigned request (GET /api/delivery/requests)
        mockMvc.perform(get("/api/delivery/requests")
                        .header("Authorization", "Bearer " + deliveryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].orderId").value(orderId));

        // Step 12: Customer verifies delivery tracking (GET /api/orders/{orderId}/delivery)
        mockMvc.perform(get("/api/orders/{orderId}/delivery", orderId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(orderId))
                .andExpect(jsonPath("$.deliveryPartnerName").value("Delivery Driver"));
    }

    @Test
    @DisplayName("5. Shop Open/Closed Lifecycle: Owner toggles isOpen -> Customer sees isOpen -> Order allowed when open, blocked when closed")
    void shopOpenClosedLifecycleFlow() throws Exception {
        // Step 1: Verify Customer reading approved shop sees isOpen = true
        mockMvc.perform(get("/api/shops/{id}", approvedShop.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(approvedShop.getId()))
                .andExpect(jsonPath("$.isOpen").value(true));

        // Step 2: Customer adds item to cart
        CartItemRequest cartItemRequest = new CartItemRequest(testRice.getId(), 1);
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cartItemRequest)))
                .andExpect(status().isOk());

        // Step 3: Shop Owner closes shop (isOpen = false)
        UpdateShopRequest closeShopReq = new UpdateShopRequest();
        closeShopReq.setIsOpen(false);

        mockMvc.perform(put("/api/shops/{id}", approvedShop.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeShopReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isOpen").value(false));

        // Step 4: Customer reading shop now sees isOpen = false
        mockMvc.perform(get("/api/shops/{id}", approvedShop.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isOpen").value(false));

        // Step 5: Customer attempting to place order while shop is closed fails (409 Conflict)
        CreateOrderRequest orderRequest = new CreateOrderRequest(customerAddress.getId());
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("is currently closed and not accepting orders")));

        // Step 6: Shop Owner re-opens shop (isOpen = true)
        UpdateShopRequest openShopReq = new UpdateShopRequest();
        openShopReq.setIsOpen(true);

        mockMvc.perform(put("/api/shops/{id}", approvedShop.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(openShopReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isOpen").value(true));

        // Step 7: Customer reading shop now sees isOpen = true
        mockMvc.perform(get("/api/shops/{id}", approvedShop.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isOpen").value(true));

        // Step 8: Customer places order now successfully
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }
}
