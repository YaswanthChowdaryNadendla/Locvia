package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.AdminCreateProductRequest;
import com.locvia.dto.CreateProductRequest;
import com.locvia.dto.UpdateProductRequest;
import com.locvia.entity.Category;
import com.locvia.entity.Product;
import com.locvia.entity.Shop;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.CategoryRepository;
import com.locvia.repository.InventoryRepository;
import com.locvia.repository.ProductRepository;
import com.locvia.repository.ShopRepository;
import com.locvia.repository.UserRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(ProductApiTests.MockCloudinaryConfig.class)
class ProductApiTests {

    @TestConfiguration
    static class MockCloudinaryConfig {
        @Bean
        @Primary
        public CloudinaryService testCloudinaryService() {
            return new CloudinaryService(null) {
                @Override
                public CloudinaryUploadResult uploadProductImage(MultipartFile file) {
                    validateImageFile(file);
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
    private User owner1;
    private User owner2;
    private User customer;
    private User deliveryPartner;

    private String adminToken;
    private String owner1Token;
    private String owner2Token;
    private String customerToken;
    private String deliveryToken;

    private Shop shop1;
    private Shop shop2;

    private Category dairyCategory;
    private Category produceCategory;
    private Category inactiveCategory;

    private Product activeMilk;
    private Product activeBread;
    private Product activeApple;
    private Product inactiveButter;

    @BeforeEach
    void setUp() {
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create test users
        admin = userRepository.save(new User("Admin User", "p.admin@locvia.com", "9876541111", passwordEncoder.encode("Pass123!"), UserRole.ADMIN));
        owner1 = userRepository.save(new User("Owner One", "p.owner1@locvia.com", "9876541112", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        owner2 = userRepository.save(new User("Owner Two", "p.owner2@locvia.com", "9876541113", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        customer = userRepository.save(new User("Customer User", "p.cust@locvia.com", "9876541114", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));
        deliveryPartner = userRepository.save(new User("Delivery Driver", "p.deliv@locvia.com", "9876541115", passwordEncoder.encode("Pass123!"), UserRole.DELIVERY_PARTNER));

        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
        owner1Token = jwtService.generateToken(owner1.getEmail(), owner1.getId(), "ROLE_SHOP_OWNER");
        owner2Token = jwtService.generateToken(owner2.getEmail(), owner2.getId(), "ROLE_SHOP_OWNER");
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), "ROLE_DELIVERY_PARTNER");

        // 2. Create shops
        shop1 = new Shop("Green Grocery", "Fresh organic goods", "10 Market Street", "9876541112", "green@example.com", "https://img.example.com/green.jpg", owner1);
        shop1 = shopRepository.save(shop1);

        shop2 = new Shop("City Supermarket", "Supermarket goods", "20 Main Road", "9876541113", "city@example.com", "https://img.example.com/city.jpg", owner2);
        shop2 = shopRepository.save(shop2);

        // 3. Create categories
        dairyCategory = new Category("Dairy & Eggs", "https://img.example.com/dairy.jpg", "Dairy items");
        dairyCategory.setActive(true);
        dairyCategory = categoryRepository.save(dairyCategory);

        produceCategory = new Category("Fruits & Vegetables", "https://img.example.com/produce.jpg", "Produce items");
        produceCategory.setActive(true);
        produceCategory = categoryRepository.save(produceCategory);

        inactiveCategory = new Category("Discontinued Category", null, "Old");
        inactiveCategory.setActive(false);
        inactiveCategory = categoryRepository.save(inactiveCategory);

        // 4. Seed products
        activeMilk = new Product("Fresh Cow Milk", "Whole fresh milk", new BigDecimal("65.00"), new BigDecimal("60.00"), "https://img.example.com/milk.jpg", "1 L", shop1, dairyCategory);
        activeMilk.setActive(true);
        activeMilk = productRepository.save(activeMilk);

        activeBread = new Product("Whole Wheat Bread", "Brown sliced bread", new BigDecimal("45.00"), null, "https://img.example.com/bread.jpg", "400 g", shop1, dairyCategory);
        activeBread.setActive(true);
        activeBread = productRepository.save(activeBread);

        activeApple = new Product("Shimla Apples", "Crisp red apples", new BigDecimal("120.00"), null, "https://img.example.com/apple.jpg", "1 kg", shop2, produceCategory);
        activeApple.setActive(true);
        activeApple = productRepository.save(activeApple);

        inactiveButter = new Product("Expired Salted Butter", "Salted table butter", new BigDecimal("55.00"), null, "https://img.example.com/butter.jpg", "100 g", shop1, dairyCategory);
        inactiveButter.setActive(false);
        inactiveButter = productRepository.save(inactiveButter);
    }

    @AfterEach
    void tearDown() {
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==========================================
    // 1. Public / Customer Catalog Tests
    // ==========================================

    @Test
    @DisplayName("1. Public can get active products without authentication")
    void getPublicProducts_returnsOnlyActive() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Fresh Cow Milk", "Whole Wheat Bread", "Shimla Apples")))
                .andExpect(jsonPath("$[*].active", everyItem(is(true))));
    }

    @Test
    @DisplayName("2. Public cannot get inactive product (returns 404)")
    void getPublicProductById_inactive_returnsNotFound() throws Exception {
        mockMvc.perform(get("/api/products/" + inactiveButter.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("3. Customer cannot create product (returns 403)")
    void createProduct_customer_returnsForbidden() throws Exception {
        CreateProductRequest request = new CreateProductRequest(dairyCategory.getId(), "Curd", "Fresh curd", new BigDecimal("30.00"), null, "500 g", null);

        mockMvc.perform(post("/api/shops/" + shop1.getId() + "/products")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("4. Shop owner can create product in own shop (returns 201)")
    void createProduct_shopOwner_success() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                dairyCategory.getId(),
                "Organic Paneer",
                "Fresh cottage cheese",
                new BigDecimal("90.00"),
                new BigDecimal("85.00"),
                "200 g",
                "https://img.example.com/paneer.jpg"
        );

        mockMvc.perform(post("/api/shops/" + shop1.getId() + "/products")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Organic Paneer"))
                .andExpect(jsonPath("$.shopId").value(shop1.getId()))
                .andExpect(jsonPath("$.shopName").value("Green Grocery"))
                .andExpect(jsonPath("$.categoryId").value(dairyCategory.getId()))
                .andExpect(jsonPath("$.categoryName").value("Dairy & Eggs"))
                .andExpect(jsonPath("$.price").value(90.00))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("5. Shop owner cannot create product in another owner's shop (returns 403)")
    void createProduct_crossOwner_returnsForbidden() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                dairyCategory.getId(),
                "Intruder Product",
                "Desc",
                new BigDecimal("10.00"),
                null,
                "1 pc",
                null
        );

        // owner2 tries to add product into owner1's shop1
        mockMvc.perform(post("/api/shops/" + shop1.getId() + "/products")
                        .header("Authorization", "Bearer " + owner2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("6. Shop owner can update own product (returns 200)")
    void updateProduct_owner_success() throws Exception {
        UpdateProductRequest request = new UpdateProductRequest(
                "Fresh Cow Milk (Updated)",
                "Full fat fresh cow milk",
                new BigDecimal("70.00"),
                new BigDecimal("68.00"),
                "1 L",
                dairyCategory.getId(),
                "https://img.example.com/milk_updated.jpg",
                true
        );

        mockMvc.perform(put("/api/products/" + activeMilk.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(activeMilk.getId()))
                .andExpect(jsonPath("$.name").value("Fresh Cow Milk (Updated)"))
                .andExpect(jsonPath("$.price").value(70.00));
    }

    @Test
    @DisplayName("7. Shop owner cannot update another owner's product (returns 403)")
    void updateProduct_crossOwner_returnsForbidden() throws Exception {
        UpdateProductRequest request = new UpdateProductRequest(
                "Hacked Apples",
                null,
                new BigDecimal("1.00"),
                null,
                null,
                null,
                null,
                null
        );

        // owner1 tries to update activeApple (owned by owner2 in shop2)
        mockMvc.perform(put("/api/products/" + activeApple.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("8. Shop owner cannot change product shop")
    void updateProduct_cannotChangeShop() throws Exception {
        UpdateProductRequest request = new UpdateProductRequest(
                "Same Milk",
                null,
                new BigDecimal("65.00"),
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(put("/api/products/" + activeMilk.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shopId").value(shop1.getId()));

        Product check = productRepository.findById(activeMilk.getId()).orElseThrow();
        assertThat(check.getShop().getId()).isEqualTo(shop1.getId());
    }

    @Test
    @DisplayName("9. Admin can manage any product across all shops")
    void admin_canManageAnyProduct() throws Exception {
        // Admin updates product belonging to shop1
        UpdateProductRequest updateRequest = new UpdateProductRequest(
                "Admin Modified Milk",
                "Supervised by admin",
                new BigDecimal("62.00"),
                null,
                "1 L",
                dairyCategory.getId(),
                null,
                true
        );

        mockMvc.perform(put("/api/products/" + activeMilk.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Admin Modified Milk"));

        // Admin creates product in shop2 via admin endpoint
        AdminCreateProductRequest createRequest = new AdminCreateProductRequest(
                shop2.getId(),
                produceCategory.getId(),
                "Alphonso Mangoes",
                "Fresh sweet mangoes",
                new BigDecimal("250.00"),
                null,
                "1 dozen",
                null
        );

        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Alphonso Mangoes"))
                .andExpect(jsonPath("$.shopId").value(shop2.getId()));
    }

    @Test
    @DisplayName("10. Product deletion is soft deletion (active = false)")
    void deleteProduct_softDeletion() throws Exception {
        mockMvc.perform(delete("/api/products/" + activeMilk.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Product deactivated successfully"));

        Product check = productRepository.findById(activeMilk.getId()).orElseThrow();
        assertThat(check.getActive()).isFalse();

        // Verify hidden from public discovery
        mockMvc.perform(get("/api/products/" + activeMilk.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("11. Category must exist when creating product (returns 404)")
    void createProduct_nonExistentCategory_returnsNotFound() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                999999L,
                "Ghost Category Item",
                "Desc",
                new BigDecimal("50.00"),
                null,
                "1 pc",
                null
        );

        mockMvc.perform(post("/api/shops/" + shop1.getId() + "/products")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("12. Inactive category cannot be used for product creation (returns 400)")
    void createProduct_inactiveCategory_returnsBadRequest() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                inactiveCategory.getId(),
                "Inactive Cat Item",
                "Desc",
                new BigDecimal("50.00"),
                null,
                "1 pc",
                null
        );

        mockMvc.perform(post("/api/shops/" + shop1.getId() + "/products")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("inactive category")));
    }

    @Test
    @DisplayName("13. Price validation works (price <= 0 returns 400)")
    void createProduct_invalidPrice_returnsBadRequest() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                dairyCategory.getId(),
                "Zero Price Item",
                "Desc",
                new BigDecimal("0.00"),
                null,
                "1 pc",
                null
        );

        mockMvc.perform(post("/api/shops/" + shop1.getId() + "/products")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.price").isNotEmpty());
    }

    @Test
    @DisplayName("14. Invalid image type is rejected (returns 400)")
    void uploadProductImage_invalidMimeType_returnsBadRequest() throws Exception {
        MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "malicious.txt",
                "text/plain",
                "plain text content".getBytes()
        );

        mockMvc.perform(multipart("/api/products/" + activeMilk.getId() + "/image")
                        .file(textFile)
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Only JPEG, PNG, and WebP images are allowed")));
    }

    @Test
    @DisplayName("15. Oversized image is rejected (> 5 MB returns 400)")
    void uploadProductImage_oversizedFile_returnsBadRequest() throws Exception {
        byte[] oversizedBytes = new byte[6 * 1024 * 1024]; // 6 MB
        MockMultipartFile oversizedFile = new MockMultipartFile(
                "file",
                "large.png",
                "image/png",
                oversizedBytes
        );

        mockMvc.perform(multipart("/api/products/" + activeMilk.getId() + "/image")
                        .file(oversizedFile)
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("5 MB")));
    }

    @Test
    @DisplayName("16. Product image upload requires authorization")
    void uploadProductImage_authorizationChecks() throws Exception {
        MockMultipartFile validImage = new MockMultipartFile(
                "file",
                "milk.png",
                "image/png",
                new byte[]{1, 2, 3, 4}
        );

        // Customer blocked -> 403
        mockMvc.perform(multipart("/api/products/" + activeMilk.getId() + "/image")
                        .file(validImage)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401
        mockMvc.perform(multipart("/api/products/" + activeMilk.getId() + "/image")
                        .file(validImage))
                .andExpect(status().isUnauthorized());

        // Cross-owner -> 403
        mockMvc.perform(multipart("/api/products/" + activeMilk.getId() + "/image")
                        .file(validImage)
                        .header("Authorization", "Bearer " + owner2Token))
                .andExpect(status().isForbidden());

        // Legitimate owner -> 200 OK
        mockMvc.perform(multipart("/api/products/" + activeMilk.getId() + "/image")
                        .file(validImage)
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value("https://res.cloudinary.com/demo/image/upload/sample.png"));
    }

    @Test
    @DisplayName("17. Delivery partner cannot manage products (returns 403)")
    void deliveryPartner_cannotManageProducts() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                dairyCategory.getId(),
                "Unauthorized",
                null,
                new BigDecimal("10.00"),
                null,
                "1 pc",
                null
        );

        mockMvc.perform(post("/api/shops/" + shop1.getId() + "/products")
                        .header("Authorization", "Bearer " + deliveryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/products/" + activeMilk.getId())
                        .header("Authorization", "Bearer " + deliveryToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("18. Public product search works (?search=milk)")
    void getPublicProducts_searchFilter() throws Exception {
        mockMvc.perform(get("/api/products").param("search", "milk"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Fresh Cow Milk"));
    }

    @Test
    @DisplayName("19. Shop filter works (?shopId=...)")
    void getPublicProducts_shopFilter() throws Exception {
        mockMvc.perform(get("/api/products").param("shopId", shop2.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Shimla Apples"))
                .andExpect(jsonPath("$[0].shopId").value(shop2.getId()));
    }

    @Test
    @DisplayName("20. Category filter works (?categoryId=...)")
    void getPublicProducts_categoryFilter() throws Exception {
        mockMvc.perform(get("/api/products").param("categoryId", dairyCategory.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Fresh Cow Milk", "Whole Wheat Bread")));
    }

    @Test
    @DisplayName("21. Combined filtering works (?shopId=...&categoryId=...&search=...)")
    void getPublicProducts_combinedFilters() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("shopId", shop1.getId().toString())
                        .param("categoryId", dairyCategory.getId().toString())
                        .param("search", "bread"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Whole Wheat Bread"));
    }
}
