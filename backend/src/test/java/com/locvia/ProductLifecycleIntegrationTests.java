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
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(ProductLifecycleIntegrationTests.MockCloudinaryConfig.class)
public class ProductLifecycleIntegrationTests {

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
                            "https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/locvia_verification_product.jpg",
                            "locvia/products/locvia_verification_product"
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
    private Category category;

    @BeforeEach
    void setUp() {
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(new User("Admin User", "admin.lifecycle@locvia.com", "9999911111", passwordEncoder.encode("Pass123!"), UserRole.ADMIN));
        owner = userRepository.save(new User("Shop Owner", "owner.lifecycle@locvia.com", "9999922222", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        customer = userRepository.save(new User("Customer User", "customer.lifecycle@locvia.com", "9999933333", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));

        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
        ownerToken = jwtService.generateToken(owner.getEmail(), owner.getId(), "ROLE_SHOP_OWNER");
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");

        category = categoryRepository.save(new Category("Grocery & Staples", "https://locvia.com/cat.png", "Everyday staples"));

        shop = new Shop("Locvia Superstore", "12 Main Boulevard", "Bengaluru", "560001", "Karnataka", "9999922222", owner);
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
    @DisplayName("Complete Product Lifecycle: Create -> Cloudinary Upload -> DB -> Customer/Admin Visibility -> Edit -> Delete -> Persistence")
    void completeProductLifecycle_endToEnd() throws Exception {
        // Step 1: Upload Image to Cloudinary endpoint
        MockMultipartFile imageFile = new MockMultipartFile(
                "file",
                "verification.jpg",
                "image/jpeg",
                "fake-verification-bytes".getBytes()
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/products/upload-image")
                        .file(imageFile)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secure_url").value("https://res.cloudinary.com/locvia-cloud/image/upload/v1720000000/products/locvia_verification_product.jpg"))
                .andExpect(jsonPath("$.public_id").value("locvia/products/locvia_verification_product"))
                .andReturn();

        JsonNode uploadJson = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String uploadedUrl = uploadJson.get("secure_url").asText();
        String uploadedPublicId = uploadJson.get("public_id").asText();

        // Step 2: Create Product with Cloudinary details, price ₹99, stock 20
        CreateProductRequest createRequest = new CreateProductRequest(
                category.getId(),
                "Locvia Verification Product",
                "Verification product for complete lifecycle test",
                new BigDecimal("99.00"),
                null,
                "1 piece",
                uploadedUrl,
                uploadedPublicId,
                20,
                20
        );

        MvcResult createResult = mockMvc.perform(post("/api/shops/" + shop.getId() + "/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + ownerToken)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Locvia Verification Product"))
                .andExpect(jsonPath("$.price").value(99.00))
                .andExpect(jsonPath("$.stockQuantity").value(20))
                .andExpect(jsonPath("$.stock").value(20))
                .andExpect(jsonPath("$.imageUrl").value(uploadedUrl))
                .andExpect(jsonPath("$.image").value(uploadedUrl))
                .andExpect(jsonPath("$.imagePublicId").value(uploadedPublicId))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn();

        Long productId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // Step 3: Database Verification
        Product dbProduct = productRepository.findById(productId).orElseThrow();
        assertThat(dbProduct.getName()).isEqualTo("Locvia Verification Product");
        assertThat(dbProduct.getPrice()).isEqualByComparingTo(new BigDecimal("99.00"));
        assertThat(dbProduct.getStock()).isEqualTo(20);
        assertThat(dbProduct.getImageUrl()).isEqualTo(uploadedUrl);
        assertThat(dbProduct.getImagePublicId()).isEqualTo(uploadedPublicId);
        assertThat(dbProduct.getActive()).isTrue();

        Inventory dbInventory = inventoryRepository.findByProductId(productId).orElseThrow();
        assertThat(dbInventory.getQuantity()).isEqualTo(20);
        assertThat(dbInventory.getAvailable()).isTrue();

        // Step 4: Shop Owner Views Products (GET /api/shops/{shopId}/products)
        mockMvc.perform(get("/api/shops/" + shop.getId() + "/products")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(productId))
                .andExpect(jsonPath("$[0].name").value("Locvia Verification Product"))
                .andExpect(jsonPath("$[0].stockQuantity").value(20))
                .andExpect(jsonPath("$[0].imageUrl").value(uploadedUrl));

        // Step 5: Customer Views Shop Products (GET /api/shops/{shopId}/products)
        mockMvc.perform(get("/api/shops/" + shop.getId() + "/products")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(productId))
                .andExpect(jsonPath("$[0].stockQuantity").value(20))
                .andExpect(jsonPath("$[0].imageUrl").value(uploadedUrl));

        // Step 6: Customer Views Product Details Directly (GET /api/products/{id})
        mockMvc.perform(get("/api/products/" + productId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(productId))
                .andExpect(jsonPath("$.name").value("Locvia Verification Product"))
                .andExpect(jsonPath("$.price").value(99.00))
                .andExpect(jsonPath("$.stockQuantity").value(20))
                .andExpect(jsonPath("$.imageUrl").value(uploadedUrl));

        // Step 7: Admin Views Product (GET /api/admin/products)
        mockMvc.perform(get("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(productId))
                .andExpect(jsonPath("$[0].active").value(true))
                .andExpect(jsonPath("$[0].stockQuantity").value(20))
                .andExpect(jsonPath("$[0].imageUrl").value(uploadedUrl));

        // Step 8: Shop Owner Edits Product (Price 99 -> 120, Stock 20 -> 30)
        UpdateProductRequest updateRequest = new UpdateProductRequest(
                "Locvia Verification Product Updated",
                "Updated description",
                new BigDecimal("120.00"),
                null,
                "1 piece",
                category.getId(),
                uploadedUrl,
                uploadedPublicId,
                true,
                30,
                30
        );

        mockMvc.perform(put("/api/products/" + productId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + ownerToken)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Locvia Verification Product Updated"))
                .andExpect(jsonPath("$.price").value(120.00))
                .andExpect(jsonPath("$.stockQuantity").value(30));

        // Verify edit in DB
        Product updatedDbProduct = productRepository.findById(productId).orElseThrow();
        assertThat(updatedDbProduct.getPrice()).isEqualByComparingTo(new BigDecimal("120.00"));
        assertThat(updatedDbProduct.getStock()).isEqualTo(30);

        // Step 9: Shop Owner Deletes Product (DELETE /api/products/{id})
        mockMvc.perform(delete("/api/products/" + productId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Product deactivated successfully"));

        // Step 10: Persistent Database Check for Deletion
        Product deletedDbProduct = productRepository.findById(productId).orElseThrow();
        assertThat(deletedDbProduct.getActive()).isFalse();

        Inventory deletedDbInventory = inventoryRepository.findByProductId(productId).orElseThrow();
        assertThat(deletedDbInventory.getAvailable()).isFalse();

        // Step 11: Shop Owner Views Shop Products (Must NOT return deleted product)
        mockMvc.perform(get("/api/shops/" + shop.getId() + "/products")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Step 12: Customer Views Shop Products (Must NOT return deleted product)
        mockMvc.perform(get("/api/shops/" + shop.getId() + "/products")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Step 13: Customer Views Product Directly (Must return 404 Not Found)
        mockMvc.perform(get("/api/products/" + productId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isNotFound());

        // Step 14: Admin Views Products (Marked as Inactive)
        mockMvc.perform(get("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(productId))
                .andExpect(jsonPath("$[0].active").value(false));
    }
}
