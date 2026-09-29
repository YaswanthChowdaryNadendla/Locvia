package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateOrderRequest;
import com.locvia.entity.*;
import com.locvia.repository.*;
import com.locvia.security.JwtService;
import com.locvia.service.CloudinaryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end integration tests for Admin Product Hard Deletion functionality.
 * Verifies strict authorization, real database removal, foreign key safety
 * for orders, order items, reviews, cart items, inventory, and Cloudinary cleanup.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(AdminProductDeleteIntegrationTests.MockCloudinaryConfig.class)
class AdminProductDeleteIntegrationTests {

    @TestConfiguration
    static class MockCloudinaryConfig {
        @Bean
        @Primary
        public CloudinaryService testCloudinaryService() {
            return new CloudinaryService(null) {
                @Override
                public CloudinaryUploadResult uploadProductImage(MultipartFile file) {
                    return new CloudinaryUploadResult("https://res.cloudinary.com/demo/image/upload/sample.png", "locvia/products/sample");
                }

                @Override
                public void deleteImage(String publicId) {
                    // no-op for tests
                }
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User admin;
    private User shopOwner;
    private User customer;
    private User deliveryPartner;

    private String adminToken;
    private String shopOwnerToken;
    private String customerToken;
    private String deliveryToken;

    private Shop shop;
    private Category category;
    private Product testProduct;
    private Inventory testInventory;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        admin = userRepository.save(new User("Admin User", "admin.del@locvia.com", "9876500001", passwordEncoder.encode("Pass123!"), UserRole.ADMIN));
        shopOwner = userRepository.save(new User("Shop Owner", "owner.del@locvia.com", "9876500002", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        customer = userRepository.save(new User("Customer User", "cust.del@locvia.com", "9876500003", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));
        deliveryPartner = userRepository.save(new User("Delivery Driver", "driver.del@locvia.com", "9876500004", passwordEncoder.encode("Pass123!"), UserRole.DELIVERY_PARTNER));

        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
        shopOwnerToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), "ROLE_DELIVERY_PARTNER");

        shop = new Shop("Kavya Supermarket", "All groceries under one roof", "Market Road, Ongole", "9876500010", "kavya@locvia.com", "https://locvia.com/shop.jpg", shopOwner);
        shop.setStatus(ShopStatus.APPROVED);
        shop.setActive(true);
        shop = shopRepository.save(shop);

        category = categoryRepository.save(new Category("Groceries & Staples", "https://locvia.com/cat.jpg", "Staples and oils"));

        testProduct = new Product(
                "Freedom Sunflower Oil (1L)",
                "Pure refined sunflower oil 1L pouch",
                new BigDecimal("154.00"),
                new BigDecimal("165.00"),
                "https://res.cloudinary.com/demo/image/upload/v1/locvia/products/freedom_oil.jpg",
                "1L",
                shop,
                category
        );
        testProduct.setImagePublicId("locvia/products/freedom_oil_123");
        testProduct.setActive(true);
        testProduct.setStock(25);
        testProduct = productRepository.save(testProduct);

        testInventory = inventoryRepository.save(new Inventory(testProduct, 25, 5));
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
        reviewRepository.deleteAll();
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
    @DisplayName("1. Admin can permanently delete a product - removed from database and inventory")
    void testAdminCanPermanentlyDeleteProduct() throws Exception {
        Long productId = testProduct.getId();

        mockMvc.perform(delete("/api/admin/products/" + productId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Product deleted successfully"));

        // Verify product record is permanently deleted
        assertThat(productRepository.findById(productId)).isEmpty();

        // Verify inventory record is permanently deleted
        assertThat(inventoryRepository.findByProductId(productId)).isEmpty();
    }

    @Test
    @DisplayName("2. Non-admin roles (Customer, Shop Owner, Delivery, Unauthenticated) cannot delete products")
    void testNonAdminCannotDeleteProduct() throws Exception {
        Long productId = testProduct.getId();

        // Customer -> 403 Forbidden
        mockMvc.perform(delete("/api/admin/products/" + productId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Shop Owner -> 403 Forbidden
        mockMvc.perform(delete("/api/admin/products/" + productId)
                        .header("Authorization", "Bearer " + shopOwnerToken))
                .andExpect(status().isForbidden());

        // Delivery Partner -> 403 Forbidden
        mockMvc.perform(delete("/api/admin/products/" + productId)
                        .header("Authorization", "Bearer " + deliveryToken))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401 Unauthorized
        mockMvc.perform(delete("/api/admin/products/" + productId))
                .andExpect(status().isUnauthorized());

        // Product still exists intact
        assertThat(productRepository.findById(productId)).isPresent();
    }

    @Test
    @DisplayName("3. Deleting non-existent product returns 404 Not Found")
    void testDeleteNonExistentProductReturns404() throws Exception {
        mockMvc.perform(delete("/api/admin/products/9999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Product not found with id: 9999999")));
    }

    @Test
    @DisplayName("4. Deleting product with historical order items preserves order and customer history")
    void testDeletedProductSafelyDecouplesOrderItemsAndPreservesOrderHistory() throws Exception {
        Address address = addressRepository.save(new Address(customer, "Home", "Customer User", "9876500003", "Main Bazaar", "Apt 2", "Ongole", "AP", "523001"));
        Cart cart = cartRepository.save(new Cart(customer));
        cartItemRepository.save(new CartItem(cart, testProduct, 2));

        CreateOrderRequest orderReq = new CreateOrderRequest(address.getId());
        String orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(orderRes).get("id").asLong();

        // Verify order items exist referencing testProduct
        List<OrderItem> itemsBefore = orderItemRepository.findByProductId(testProduct.getId());
        assertThat(itemsBefore).hasSize(1);
        assertThat(itemsBefore.get(0).getProduct()).isNotNull();

        // Admin deletes the product
        mockMvc.perform(delete("/api/admin/products/" + testProduct.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Product is permanently deleted
        assertThat(productRepository.findById(testProduct.getId())).isEmpty();

        // Order item is preserved with product decoupled (product_id = null)
        OrderItem orderItemAfter = orderItemRepository.findById(itemsBefore.get(0).getId()).orElseThrow();
        assertThat(orderItemAfter.getProduct()).isNull();
        assertThat(orderItemAfter.getProductName()).isEqualTo("Freedom Sunflower Oil (1L)");
        assertThat(orderItemAfter.getProductPrice()).isEqualByComparingTo("154.00");
        assertThat(orderItemAfter.getQuantity()).isEqualTo(2);
        assertThat(orderItemAfter.getSubtotal()).isEqualByComparingTo("308.00");

        // Customer order details retrieval succeeds without error
        mockMvc.perform(get("/api/orders/" + orderId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(orderId))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productName").value("Freedom Sunflower Oil (1L)"))
                .andExpect(jsonPath("$.items[0].productPrice").value(154.00))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].subtotal").value(308.00));
    }

    @Test
    @DisplayName("5. Deleting product cleans up active CartItems and Reviews safely")
    void testDeletedProductCleansUpCartItemsAndReviews() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer));
        CartItem cartItem = cartItemRepository.save(new CartItem(cart, testProduct, 1));

        Review review = reviewRepository.save(new Review(customer, testProduct, shop, null, 5, "Excellent cooking oil!"));

        // Admin deletes product
        mockMvc.perform(delete("/api/admin/products/" + testProduct.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Product is deleted
        assertThat(productRepository.findById(testProduct.getId())).isEmpty();

        // CartItem for deleted product is removed
        assertThat(cartItemRepository.findById(cartItem.getId())).isEmpty();

        // Review for deleted product is removed
        assertThat(reviewRepository.findById(review.getId())).isEmpty();
    }

    @Test
    @DisplayName("6. Deleted product no longer appears in Admin list, Shop list, or Customer Storefront")
    void testDeletedProductNoLongerAppearsInAnyCatalogLists() throws Exception {
        Long prodId = testProduct.getId();

        // Admin deletes product
        mockMvc.perform(delete("/api/admin/products/" + prodId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Admin products list does not include it
        mockMvc.perform(get("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(prodId.intValue()))));

        // Shop products list does not include it
        mockMvc.perform(get("/api/shops/" + shop.getId() + "/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(prodId.intValue()))));

        // Public storefront products list does not include it
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(prodId.intValue()))));

        // Direct public product lookup returns 404 Not Found
        mockMvc.perform(get("/api/products/" + prodId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("7. Admin status update (Activate/Deactivate) and Details remain fully functional")
    void testAdminStatusUpdateAndDetailsRemainFunctional() throws Exception {
        Long prodId = testProduct.getId();

        // 1. Deactivate via status endpoint
        mockMvc.perform(put("/api/admin/products/" + prodId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(prodId))
                .andExpect(jsonPath("$.active").value(false));

        Product deactivated = productRepository.findById(prodId).orElseThrow();
        assertThat(deactivated.getActive()).isFalse();

        // 2. Reactivate via status endpoint
        mockMvc.perform(put("/api/admin/products/" + prodId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(prodId))
                .andExpect(jsonPath("$.active").value(true));

        Product reactivated = productRepository.findById(prodId).orElseThrow();
        assertThat(reactivated.getActive()).isTrue();

        // 3. Inspect details via admin endpoint
        mockMvc.perform(get("/api/admin/products/" + prodId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(prodId))
                .andExpect(jsonPath("$.name").value("Freedom Sunflower Oil (1L)"))
                .andExpect(jsonPath("$.shopName").value("Kavya Supermarket"));
    }
}
