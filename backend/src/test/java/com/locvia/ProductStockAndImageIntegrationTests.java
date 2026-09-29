package com.locvia;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateProductRequest;
import com.locvia.dto.UpdateProductRequest;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(ProductStockAndImageIntegrationTests.MockCloudinaryConfig.class)
public class ProductStockAndImageIntegrationTests {

    @TestConfiguration
    static class MockCloudinaryConfig {
        @Bean
        @Primary
        public CloudinaryService testCloudinaryService() {
            return new CloudinaryService(null) {
                @Override
                public CloudinaryUploadResult uploadProductImage(MultipartFile file) {
                    validateImageFile(file);
                    return new CloudinaryUploadResult(
                            "https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/test_rice.jpg",
                            "locvia/products/test_rice"
                    );
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
    private InventoryRepository inventoryRepository;

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

    private User owner;
    private User admin;
    private User customer;
    private String ownerToken;
    private String adminToken;
    private String customerToken;

    private Shop shop;
    private Category groceryCategory;

    @BeforeEach
    void setUp() {
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(new User("Admin User", "admin.stock@locvia.com", "9999900001", passwordEncoder.encode("Pass123!"), UserRole.ADMIN));
        owner = userRepository.save(new User("Shop Owner", "owner.stock@locvia.com", "9999900002", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        customer = userRepository.save(new User("Customer", "customer.stock@locvia.com", "9999900003", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));

        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
        ownerToken = jwtService.generateToken(owner.getEmail(), owner.getId(), "ROLE_SHOP_OWNER");
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");

        groceryCategory = categoryRepository.save(new Category("Atta, Rice & Dal", "Staples and grains", "https://locvia.com/cat.png"));

        shop = new Shop("Annapurna Stores", "42 Market Street", "Bengaluru", "560001", "Karnataka", "9999900002", owner);
        shop.setStatus(ShopStatus.APPROVED);
        shop.setActive(true);
        shop = shopRepository.save(shop);
    }

    @AfterEach
    void tearDown() {
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Product creation with stock 20 and Cloudinary image persists to DB and returns correct DTO")
    void createProduct_withStock20AndImage_persistsBothAndReturnsCorrectStock() throws Exception {
        String testImageUrl = "https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/test_rice.jpg";
        CreateProductRequest request = new CreateProductRequest(
                groceryCategory.getId(),
                "Test Rice",
                "High quality basmati rice",
                new BigDecimal("120.00"),
                new BigDecimal("110.00"),
                "1 kg",
                testImageUrl,
                20,
                20
        );

        MvcResult result = mockMvc.perform(post("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Test Rice"))
                .andExpect(jsonPath("$.stockQuantity").value(20))
                .andExpect(jsonPath("$.stock").value(20))
                .andExpect(jsonPath("$.imageUrl").value(testImageUrl))
                .andExpect(jsonPath("$.image").value(testImageUrl))
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        Long productId = responseNode.get("id").asLong();

        // 2. Verify Product entity in database has stock = 20
        Product persistedProduct = productRepository.findById(productId).orElseThrow();
        assertThat(persistedProduct.getStock()).isEqualTo(20);
        assertThat(persistedProduct.getStockQuantity()).isEqualTo(20);
        assertThat(persistedProduct.getImageUrl()).isEqualTo(testImageUrl);

        // 3. Verify Inventory entity in database has quantity = 20
        Inventory persistedInventory = inventoryRepository.findByProductId(productId).orElseThrow();
        assertThat(persistedInventory.getQuantity()).isEqualTo(20);
        assertThat(persistedInventory.getAvailable()).isTrue();

        // 4. Verify Shop Owner GET API returns stock = 20 and image
        mockMvc.perform(get("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(productId))
                .andExpect(jsonPath("$[0].stockQuantity").value(20))
                .andExpect(jsonPath("$[0].stock").value(20))
                .andExpect(jsonPath("$[0].imageUrl").value(testImageUrl));

        // 5. Verify Admin GET API returns stock = 20 and image
        mockMvc.perform(get("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(productId))
                .andExpect(jsonPath("$[0].stockQuantity").value(20))
                .andExpect(jsonPath("$[0].stock").value(20))
                .andExpect(jsonPath("$[0].imageUrl").value(testImageUrl));

        // 6. Verify Customer Public GET API returns stock = 20 and image
        mockMvc.perform(get("/api/products/{id}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(productId))
                .andExpect(jsonPath("$.stockQuantity").value(20))
                .andExpect(jsonPath("$.stock").value(20))
                .andExpect(jsonPath("$.imageUrl").value(testImageUrl));
    }

    @Test
    @DisplayName("2. Product update updates stock from 20 to 35 and replaces image")
    void updateProduct_updatesStockAndImage_propagatesToDatabaseAndInventory() throws Exception {
        String originalImageUrl = "https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/test_rice.jpg";
        CreateProductRequest request = new CreateProductRequest(
                groceryCategory.getId(),
                "Test Rice",
                "High quality basmati rice",
                new BigDecimal("120.00"),
                new BigDecimal("110.00"),
                "1 kg",
                originalImageUrl,
                20,
                20
        );

        MvcResult createResult = mockMvc.perform(post("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        Long productId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // Now edit product: 20 -> 35, and new image URL
        String updatedImageUrl = "https://res.cloudinary.com/locvia-cloud/image/upload/v1720000001/products/premium_rice.jpg";
        UpdateProductRequest updateRequest = new UpdateProductRequest(
                "Test Rice Premium",
                "Aged basmati rice",
                new BigDecimal("130.00"),
                new BigDecimal("125.00"),
                "1 kg",
                groceryCategory.getId(),
                updatedImageUrl,
                true,
                35,
                35
        );

        mockMvc.perform(put("/api/products/{id}", productId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Rice Premium"))
                .andExpect(jsonPath("$.stockQuantity").value(35))
                .andExpect(jsonPath("$.stock").value(35))
                .andExpect(jsonPath("$.imageUrl").value(updatedImageUrl));

        // Verify Database product entity
        Product updatedProduct = productRepository.findById(productId).orElseThrow();
        assertThat(updatedProduct.getStock()).isEqualTo(35);
        assertThat(updatedProduct.getImageUrl()).isEqualTo(updatedImageUrl);

        // Verify Database inventory entity
        Inventory updatedInventory = inventoryRepository.findByProductId(productId).orElseThrow();
        assertThat(updatedInventory.getQuantity()).isEqualTo(35);

        // Verify Admin sees 35
        mockMvc.perform(get("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stockQuantity").value(35))
                .andExpect(jsonPath("$[0].imageUrl").value(updatedImageUrl));

        // Verify Customer sees 35
        mockMvc.perform(get("/api/products/{id}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockQuantity").value(35))
                .andExpect(jsonPath("$.imageUrl").value(updatedImageUrl));
    }

    @Test
    @DisplayName("3. Standalone product image upload endpoint uploads to Cloudinary and returns secure URL")
    void uploadImage_returnsSecureUrl() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "rice.jpg",
                "image/jpeg",
                "valid-jpeg-image-bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/products/upload-image")
                        .file(file)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secure_url").value("https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/test_rice.jpg"))
                .andExpect(jsonPath("$.url").value("https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/test_rice.jpg"))
                .andExpect(jsonPath("$.imageUrl").value("https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/test_rice.jpg"))
                .andExpect(jsonPath("$.public_id").value("locvia/products/test_rice"));
    }

    @Test
    @DisplayName("4. Stock transition lifecycle: 20 -> 35 -> 10 (Low Stock) -> 0 (Out of Stock)")
    void productStock_completeLifecycleTransitions_verifiedAcrossDatabaseAndApis() throws Exception {
        // Step 1: Create Product "Test Rice" with stock = 20
        String testImageUrl = "https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/test_rice.jpg";
        CreateProductRequest createRequest = new CreateProductRequest(
                groceryCategory.getId(),
                "Test Rice",
                "Basmati Rice",
                new BigDecimal("120.00"),
                new BigDecimal("110.00"),
                "1 kg",
                testImageUrl,
                20,
                20
        );

        MvcResult createResult = mockMvc.perform(post("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.stockQuantity").value(20))
                .andExpect(jsonPath("$.stock").value(20))
                .andReturn();

        Long productId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // Verify Shop Owner Products: 20
        mockMvc.perform(get("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(productId))
                .andExpect(jsonPath("$[0].stockQuantity").value(20))
                .andExpect(jsonPath("$[0].stock").value(20));

        // Verify Database: 20
        Product p20 = productRepository.findById(productId).orElseThrow();
        assertThat(p20.getStock()).isEqualTo(20);
        Inventory inv20 = inventoryRepository.findByProductId(productId).orElseThrow();
        assertThat(inv20.getQuantity()).isEqualTo(20);

        // Step 2: Update 20 -> 35
        UpdateProductRequest updateTo35 = new UpdateProductRequest(
                "Test Rice",
                "Basmati Rice",
                new BigDecimal("120.00"),
                new BigDecimal("110.00"),
                "1 kg",
                groceryCategory.getId(),
                testImageUrl,
                true,
                35,
                35
        );

        mockMvc.perform(put("/api/products/{id}", productId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateTo35)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockQuantity").value(35))
                .andExpect(jsonPath("$.stock").value(35));

        // Verify Shop Owner Products: 35
        mockMvc.perform(get("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stockQuantity").value(35));

        // Verify Database: 35
        Product p35 = productRepository.findById(productId).orElseThrow();
        assertThat(p35.getStock()).isEqualTo(35);
        Inventory inv35 = inventoryRepository.findByProductId(productId).orElseThrow();
        assertThat(inv35.getQuantity()).isEqualTo(35);

        // Step 3: Update 35 -> 10 (Low Stock threshold <= 10)
        UpdateProductRequest updateTo10 = new UpdateProductRequest(
                "Test Rice",
                "Basmati Rice",
                new BigDecimal("120.00"),
                new BigDecimal("110.00"),
                "1 kg",
                groceryCategory.getId(),
                testImageUrl,
                true,
                10,
                10
        );

        mockMvc.perform(put("/api/products/{id}", productId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateTo10)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockQuantity").value(10))
                .andExpect(jsonPath("$.stock").value(10));

        // Verify Shop Owner Products: 10
        mockMvc.perform(get("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stockQuantity").value(10));

        // Verify Database: 10
        Product p10 = productRepository.findById(productId).orElseThrow();
        assertThat(p10.getStock()).isEqualTo(10);
        Inventory inv10 = inventoryRepository.findByProductId(productId).orElseThrow();
        assertThat(inv10.getQuantity()).isEqualTo(10);

        // Step 4: Update 10 -> 0 (Out of Stock)
        UpdateProductRequest updateTo0 = new UpdateProductRequest(
                "Test Rice",
                "Basmati Rice",
                new BigDecimal("120.00"),
                new BigDecimal("110.00"),
                "1 kg",
                groceryCategory.getId(),
                testImageUrl,
                true,
                0,
                0
        );

        mockMvc.perform(put("/api/products/{id}", productId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateTo0)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockQuantity").value(0))
                .andExpect(jsonPath("$.stock").value(0));

        // Verify Shop Owner Products: 0
        mockMvc.perform(get("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stockQuantity").value(0));

        // Verify Database: 0 and Inventory is not available
        Product p0 = productRepository.findById(productId).orElseThrow();
        assertThat(p0.getStock()).isEqualTo(0);
        Inventory inv0 = inventoryRepository.findByProductId(productId).orElseThrow();
        assertThat(inv0.getQuantity()).isEqualTo(0);
        assertThat(inv0.getAvailable()).isFalse();
    }

    @Test
    @DisplayName("5. Shop isolation on stock update: Another shop owner cannot modify this product")
    void otherShopOwner_cannotUpdateProductStock() throws Exception {
        User otherOwner = userRepository.save(new User("Other Owner", "other.owner@locvia.com", "9999900099", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        String otherOwnerToken = jwtService.generateToken(otherOwner.getEmail(), otherOwner.getId(), "ROLE_SHOP_OWNER");

        CreateProductRequest createRequest = new CreateProductRequest(
                groceryCategory.getId(),
                "Shop 1 Rice",
                "Basmati Rice",
                new BigDecimal("120.00"),
                new BigDecimal("110.00"),
                "1 kg",
                "https://locvia.com/rice.png",
                20,
                20
        );

        MvcResult createResult = mockMvc.perform(post("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        Long productId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        UpdateProductRequest unauthorizedUpdate = new UpdateProductRequest(
                "Tampered Rice",
                "Description",
                new BigDecimal("120.00"),
                null,
                "1 kg",
                groceryCategory.getId(),
                "https://locvia.com/rice.png",
                true,
                999,
                999
        );

        // Attempting to update another owner's product must return 403 Forbidden
        mockMvc.perform(put("/api/products/{id}", productId)
                        .header("Authorization", "Bearer " + otherOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unauthorizedUpdate)))
                .andExpect(status().isForbidden());
    }
}
