package com.locvia;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateReviewRequest;
import com.locvia.dto.UpdateReviewRequest;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(ReviewIntegrationTests.MockCloudinaryConfig.class)
public class ReviewIntegrationTests {

    @TestConfiguration
    static class MockCloudinaryConfig {
        @Bean
        @Primary
        public CloudinaryService testCloudinaryService() {
            return new CloudinaryService(null) {
                @Override
                public CloudinaryUploadResult uploadProductImage(MultipartFile file) {
                    return new CloudinaryUploadResult(
                            "https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/test.jpg",
                            "locvia/products/test"
                    );
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
    private ReviewRepository reviewRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;

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

    private User admin;
    private User shopOwner1;
    private User shopOwner2;
    private User customer1;
    private User customer2;

    private String adminToken;
    private String ownerToken1;
    private String ownerToken2;
    private String customerToken1;
    private String customerToken2;

    private Shop shop1;
    private Shop shop2;
    private Category category;
    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        tearDown();

        admin = userRepository.save(new User("Admin Reviewer", "admin.reviews@locvia.com", "9998811111", passwordEncoder.encode("Pass123!"), UserRole.ADMIN));
        shopOwner1 = userRepository.save(new User("Shop Owner 1", "owner1.reviews@locvia.com", "9998822221", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        shopOwner2 = userRepository.save(new User("Shop Owner 2", "owner2.reviews@locvia.com", "9998822222", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        customer1 = userRepository.save(new User("Alice Customer", "alice.customer@locvia.com", "9998833331", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));
        customer2 = userRepository.save(new User("Bob Customer", "bob.customer@locvia.com", "9998833332", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));

        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
        ownerToken1 = jwtService.generateToken(shopOwner1.getEmail(), shopOwner1.getId(), "ROLE_SHOP_OWNER");
        ownerToken2 = jwtService.generateToken(shopOwner2.getEmail(), shopOwner2.getId(), "ROLE_SHOP_OWNER");
        customerToken1 = jwtService.generateToken(customer1.getEmail(), customer1.getId(), "ROLE_CUSTOMER");
        customerToken2 = jwtService.generateToken(customer2.getEmail(), customer2.getId(), "ROLE_CUSTOMER");

        category = categoryRepository.save(new Category("Dairy & Eggs", "https://locvia.com/dairy.png", "Fresh dairy"));

        shop1 = new Shop("Green Grocery", "Organic Groceries", "12 Main Street", "9998822221", "owner1.reviews@locvia.com", "https://locvia.com/shop1.png", shopOwner1);
        shop1.setStatus(ShopStatus.APPROVED);
        shop1.setActive(true);
        shop1 = shopRepository.save(shop1);

        shop2 = new Shop("Corner Bakery", "Fresh Bakes", "14 Side Street", "9998822222", "owner2.reviews@locvia.com", "https://locvia.com/shop2.png", shopOwner2);
        shop2.setStatus(ShopStatus.APPROVED);
        shop2.setActive(true);
        shop2 = shopRepository.save(shop2);

        product1 = productRepository.save(new Product("Farm Fresh Milk", "Organic 1L", new BigDecimal("65.00"), null, "https://locvia.com/milk.png", "1L", shop1, category, 50));
        product2 = productRepository.save(new Product("Artisan Sourdough", "Fresh Baked", new BigDecimal("120.00"), null, "https://locvia.com/bread.png", "500g", shop2, category, 20));
    }

    @AfterEach
    void tearDown() {
        reviewRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    private Order createTestOrder(User customer, Product product, OrderStatus status) {
        Order order = new Order();
        order.setUser(customer);
        order.setStatus(status);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setTotalAmount(product.getPrice());
        order.setPaymentMethod("UPI");
        order.setRecipientName(customer.getName());
        order.setPhoneNumber(customer.getPhone());
        order.setAddressLine1("123 Test Apt");
        order.setCity("Bengaluru");
        order.setState("Karnataka");
        order.setPostalCode("560001");
        Order savedOrder = orderRepository.save(order);

        OrderItem item = new OrderItem(savedOrder, product, product.getName(), product.getPrice(), 1, product.getPrice());
        orderItemRepository.save(item);

        return savedOrder;
    }

    @Test
    @DisplayName("Test 1: Customer can review purchased product after delivery")
    void testCustomerCanReviewPurchasedProductAfterDelivery() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.DELIVERED);

        CreateReviewRequest request = new CreateReviewRequest(product1.getId(), 5, "Outstanding farm fresh quality!");

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.productId").value(product1.getId()))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Outstanding farm fresh quality!"))
                .andExpect(jsonPath("$.userName").value("Alice C."));

        assertThat(reviewRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Test 2: Customer CANNOT review product before delivery")
    void testCustomerCannotReviewProductBeforeDelivery() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.PREPARING);

        CreateReviewRequest request = new CreateReviewRequest(product1.getId(), 5, "Too eager to review!");

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("after your order has been delivered")));

        assertThat(reviewRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("Test 3: Customer CANNOT review product they never purchased")
    void testCustomerCannotReviewProductTheyNeverPurchased() throws Exception {
        // Customer 1 never purchased product2
        CreateReviewRequest request = new CreateReviewRequest(product2.getId(), 4, "I never bought this sourdough");

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("only review products you have purchased")));

        assertThat(reviewRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("Test 4: Customer CANNOT review cancelled order")
    void testCustomerCannotReviewCancelledOrder() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.CANCELLED);

        CreateReviewRequest request = new CreateReviewRequest(product1.getId(), 1, "Order was cancelled");

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cancelled order")));

        assertThat(reviewRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("Test 5: Customer CANNOT review another customer's delivered order")
    void testCustomerCannotReviewAnotherCustomersPurchase() throws Exception {
        // Bob purchased product 2
        createTestOrder(customer2, product2, OrderStatus.DELIVERED);

        // Alice tries to review product 2
        CreateReviewRequest request = new CreateReviewRequest(product2.getId(), 5, "I want to review Bob's bread");

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("only review products you have purchased")));

        assertThat(reviewRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("Test 6: Rating must be strictly 1 to 5 stars")
    void testRatingMustBeBetween1And5() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.DELIVERED);

        // Rating 0
        CreateReviewRequest zeroRating = new CreateReviewRequest(product1.getId(), 0, "Zero stars");
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(zeroRating)))
                .andExpect(status().isBadRequest());

        // Rating 6
        CreateReviewRequest sixRating = new CreateReviewRequest(product1.getId(), 6, "Six stars");
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sixRating)))
                .andExpect(status().isBadRequest());

        assertThat(reviewRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("Test 7: Duplicate review for same product is prevented")
    void testDuplicateReviewIsPrevented() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.DELIVERED);

        CreateReviewRequest first = new CreateReviewRequest(product1.getId(), 5, "First review");
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        CreateReviewRequest second = new CreateReviewRequest(product1.getId(), 4, "Duplicate review attempt");
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already reviewed this product")));

        assertThat(reviewRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Test 8: Customer can update own review")
    void testCustomerCanUpdateOwnReview() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.DELIVERED);

        CreateReviewRequest initial = new CreateReviewRequest(product1.getId(), 4, "Good milk");
        MvcResult res = mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initial)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        long reviewId = json.get("id").asLong();

        UpdateReviewRequest update = new UpdateReviewRequest(5, "Updated: Actually the best milk!");
        mockMvc.perform(put("/api/reviews/" + reviewId)
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Updated: Actually the best milk!"));

        Review updated = reviewRepository.findById(reviewId).orElseThrow();
        assertThat(updated.getRating()).isEqualTo(5);
        assertThat(updated.getComment()).isEqualTo("Updated: Actually the best milk!");
    }

    @Test
    @DisplayName("Test 9: Customer CANNOT modify another user's review")
    void testCustomerCannotModifyAnotherUsersReview() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.DELIVERED);

        CreateReviewRequest initial = new CreateReviewRequest(product1.getId(), 5, "Alice's review");
        MvcResult res = mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initial)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        long reviewId = json.get("id").asLong();

        UpdateReviewRequest maliciousUpdate = new UpdateReviewRequest(1, "Bob tampering Alice's review");
        mockMvc.perform(put("/api/reviews/" + reviewId)
                        .header("Authorization", "Bearer " + customerToken2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousUpdate)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Test 10: Shop Owner sees only reviews for their shop's products")
    void testShopOwnerSeesOnlyOwnShopReviews() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.DELIVERED);
        createTestOrder(customer2, product2, OrderStatus.DELIVERED);

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateReviewRequest(product1.getId(), 5, "Shop 1 Product"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateReviewRequest(product2.getId(), 4, "Shop 2 Product"))))
                .andExpect(status().isCreated());

        // Shop Owner 1 views their shop reviews
        mockMvc.perform(get("/api/reviews/shop/" + shop1.getId())
                        .header("Authorization", "Bearer " + ownerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].productId").value(product1.getId()));

        // Shop Owner 1 cannot access Shop Owner 2's shop reviews
        mockMvc.perform(get("/api/reviews/shop/" + shop2.getId())
                        .header("Authorization", "Bearer " + ownerToken1))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Test 11: Admin sees all reviews and can moderate/delete any review")
    void testAdminSeesAllReviewsAndCanDelete() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.DELIVERED);
        createTestOrder(customer2, product2, OrderStatus.DELIVERED);

        MvcResult r1 = mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateReviewRequest(product1.getId(), 5, "Product 1 Review"))))
                .andExpect(status().isCreated())
                .andReturn();

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateReviewRequest(product2.getId(), 4, "Product 2 Review"))))
                .andExpect(status().isCreated());

        long rev1Id = objectMapper.readTree(r1.getResponse().getContentAsString()).get("id").asLong();

        // Admin lists all reviews across platform
        mockMvc.perform(get("/api/admin/reviews")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // Admin moderates and deletes rev1
        mockMvc.perform(delete("/api/admin/reviews/" + rev1Id)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        assertThat(reviewRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Test 12: Product rating and summary are calculated accurately")
    void testProductRatingAndSummaryCalculation() throws Exception {
        createTestOrder(customer1, product1, OrderStatus.DELIVERED);
        createTestOrder(customer2, product1, OrderStatus.DELIVERED);

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateReviewRequest(product1.getId(), 5, "5 stars!"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateReviewRequest(product1.getId(), 4, "4 stars!"))))
                .andExpect(status().isCreated());

        // Public product reviews endpoint
        mockMvc.perform(get("/api/reviews/product/" + product1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviews", hasSize(2)))
                .andExpect(jsonPath("$.summary.total").value(2))
                .andExpect(jsonPath("$.summary.average").value(4.5))
                .andExpect(jsonPath("$.summary.distribution.5").value(1))
                .andExpect(jsonPath("$.summary.distribution.4").value(1));

        // Check shop rating recalculation
        Shop updatedShop = shopRepository.findById(shop1.getId()).orElseThrow();
        assertThat(updatedShop.getRating()).isEqualTo(4.5);
    }

    @Test
    @DisplayName("Test 13: Customer eligibility endpoint returns correct status")
    void testEligibilityEndpoint() throws Exception {
        // Not purchased -> eligible false
        mockMvc.perform(get("/api/reviews/eligibility/" + product1.getId())
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligible").value(false))
                .andExpect(jsonPath("$.alreadyReviewed").value(false));

        // Purchased & Delivered -> eligible true
        createTestOrder(customer1, product1, OrderStatus.DELIVERED);

        mockMvc.perform(get("/api/reviews/eligibility/" + product1.getId())
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligible").value(true))
                .andExpect(jsonPath("$.alreadyReviewed").value(false));

        // Once reviewed -> eligible false, alreadyReviewed true
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + customerToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateReviewRequest(product1.getId(), 5, "Great!"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/reviews/eligibility/" + product1.getId())
                        .header("Authorization", "Bearer " + customerToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligible").value(false))
                .andExpect(jsonPath("$.alreadyReviewed").value(true))
                .andExpect(jsonPath("$.existingReview.rating").value(5));
    }
}
