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
}
