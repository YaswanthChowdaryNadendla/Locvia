package com.locvia;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateProductRequest;
import com.locvia.entity.*;
import com.locvia.repository.*;
import com.locvia.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME:uhhp1dyz}",
        "cloudinary.api-key=${CLOUDINARY_API_KEY:628359652965493}",
        "cloudinary.api-secret=${CLOUDINARY_API_SECRET:IkOsYgVywcQejKyjntQknLqPOok}"
})
public class RealCloudinaryVerificationTests {

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("Execute End-to-End Real Cloudinary Shop and Product Image Flow with Freedom Sunflower Oil (1L)")
    void testRealCloudinaryEndToEndFlow() throws Exception {
        // 1. Create or fetch Shop Owner
        User owner = userRepository.findByEmail("lakshmi.owner@locvia.com").orElseGet(() -> {
            User u = new User(
                    "Lakshmi Stores Owner",
                    "lakshmi.owner@locvia.com",
                    "9876543210",
                    passwordEncoder.encode("Password@123"),
                    UserRole.SHOP_OWNER
            );
            u.setAccountStatus(AccountStatus.APPROVED);
            u.setEmailVerified(true);
            return userRepository.save(u);
        });

        String ownerToken = jwtService.generateToken(owner.getEmail(), owner.getId(), "ROLE_SHOP_OWNER");

        // 2. Create or fetch Approved Active Shop
        Shop shop = shopRepository.findByOwnerId(owner.getId()).stream().findFirst().orElseGet(() -> {
            Shop s = new Shop(
                    "Sri Lakshmi General Store",
                    "Fresh groceries, edible cooking oils and household daily essentials",
                    "12-4-56, Main Market Road, Bengaluru",
                    "9876543210",
                    "lakshmi.owner@locvia.com",
                    null,
                    owner
            );
            s.setStatus(ShopStatus.APPROVED);
            s.setActive(true);
            s.setIsOpen(true);
            s.setRating(4.8);
            return shopRepository.save(s);
        });

        // 3. Upload real Shop Image to Cloudinary via POST /api/shops/{id}/image
        byte[] shopImageBytes = Files.readAllBytes(Path.of("D:/LocalVia/shop_storefront.jpg"));
        MockMultipartFile shopMultipartFile = new MockMultipartFile(
                "file",
                "shop_storefront.jpg",
                "image/jpeg",
                shopImageBytes
        );

        MvcResult shopUploadResult = mockMvc.perform(multipart("/api/shops/{id}/image", shop.getId())
                        .file(shopMultipartFile)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode shopJson = objectMapper.readTree(shopUploadResult.getResponse().getContentAsString());
        String shopCloudinaryUrl = shopJson.get("imageUrl").asText();
        System.out.println("=== REAL CLOUDINARY SHOP IMAGE URL ===");
        System.out.println(shopCloudinaryUrl);
        assertThat(shopCloudinaryUrl).startsWith("https://res.cloudinary.com/");
        assertThat(shopJson.get("image").asText()).isEqualTo(shopCloudinaryUrl);

        // Verify Shop is updated in database
        Shop verifiedShop = shopRepository.findById(shop.getId()).orElseThrow();
        assertThat(verifiedShop.getImageUrl()).isEqualTo(shopCloudinaryUrl);

        // 4. Verify category from DB (Masala, Oil & More)
        Category category = categoryRepository.findAll().stream()
                .filter(c -> c.getName().toLowerCase().contains("oil") || c.getName().toLowerCase().contains("grocery"))
                .findFirst()
                .orElseGet(() -> categoryRepository.save(new Category("Masala, Oil & More", "Cooking oils, spices and seasonings", "https://locvia.com/cat.png")));

        System.out.println("=== SELECTED DATABASE CATEGORY ===");
        System.out.println("ID: " + category.getId() + ", Name: " + category.getName());

        // 5. Upload real Product Image for Freedom Sunflower Oil (1L) via POST /api/products/upload-image
        byte[] productBytes = Files.readAllBytes(Path.of("D:/LocalVia/freedom_oil.jpg"));
        MockMultipartFile productMultipartFile = new MockMultipartFile(
                "file",
                "freedom_oil.jpg",
                "image/jpeg",
                productBytes
        );

        MvcResult productUploadResult = mockMvc.perform(multipart("/api/products/upload-image")
                        .file(productMultipartFile)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadJson = objectMapper.readTree(productUploadResult.getResponse().getContentAsString());
        String productCloudinaryUrl = uploadJson.get("secure_url").asText();
        String productPublicId = uploadJson.get("public_id").asText();
        System.out.println("=== REAL CLOUDINARY PRODUCT IMAGE URL ===");
        System.out.println(productCloudinaryUrl);
        System.out.println("Public ID: " + productPublicId);
        assertThat(productCloudinaryUrl).startsWith("https://res.cloudinary.com/");

        // 6. Create the Product: Freedom Sunflower Oil (1L), Price: 154, Stock: 20
        CreateProductRequest createRequest = new CreateProductRequest(
                category.getId(),
                "Freedom Sunflower Oil (1L)",
                "Freedom Refined Sunflower Oil with Vitamins A, D & E. Clean pouch packaging.",
                new BigDecimal("154.00"),
                null,
                "1 L",
                productCloudinaryUrl,
                productPublicId,
                20,
                20
        );

        MvcResult createResult = mockMvc.perform(post("/api/shops/{shopId}/products", shop.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode createdProductJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        Long productId = createdProductJson.get("id").asLong();
        System.out.println("=== CREATED PRODUCT ID: " + productId + " ===");

        // 7. Verify Product in Database
        Product dbProduct = productRepository.findById(productId).orElseThrow();
        assertThat(dbProduct.getName()).isEqualTo("Freedom Sunflower Oil (1L)");
        assertThat(dbProduct.getPrice()).isEqualByComparingTo(new BigDecimal("154.00"));
        assertThat(dbProduct.getImageUrl()).isEqualTo(productCloudinaryUrl);
        assertThat(dbProduct.getImagePublicId()).isEqualTo(productPublicId);

        Inventory dbInventory = inventoryRepository.findByProductId(productId).orElseThrow();
        assertThat(dbInventory.getQuantity()).isEqualTo(20);

        // 8. Verify Shop Owner and Customer / Admin GET Endpoints
        // Customer / Admin Product Discovery
        mockMvc.perform(get("/api/products/{id}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Freedom Sunflower Oil (1L)")))
                .andExpect(jsonPath("$.price", is(154.00)))
                .andExpect(jsonPath("$.imageUrl", is(productCloudinaryUrl)))
                .andExpect(jsonPath("$.image", is(productCloudinaryUrl)))
                .andExpect(jsonPath("$.stock", is(20)));

        // Shop Products list
        mockMvc.perform(get("/api/shops/{shopId}/products", shop.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name", is("Freedom Sunflower Oil (1L)")))
                .andExpect(jsonPath("$[0].imageUrl", is(productCloudinaryUrl)));

        // Shop Details Discovery
        mockMvc.perform(get("/api/shops/{id}", shop.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Sri Lakshmi General Store")))
                .andExpect(jsonPath("$.imageUrl", is(shopCloudinaryUrl)))
                .andExpect(jsonPath("$.image", is(shopCloudinaryUrl)));

        System.out.println("=================================================");
        System.out.println("VERIFICATION SUMMARY FOR DUMMY PRODUCT & SHOP:");
        System.out.println("Shop ID: " + shop.getId());
        System.out.println("Shop Name: " + shop.getName());
        System.out.println("Shop Image Cloudinary URL: " + shopCloudinaryUrl);
        System.out.println("Product ID: " + productId);
        System.out.println("Product Name: " + dbProduct.getName());
        System.out.println("Category: " + category.getName());
        System.out.println("Price: INR " + dbProduct.getPrice());
        System.out.println("Stock: " + dbInventory.getQuantity());
        System.out.println("Product Image Cloudinary URL: " + productCloudinaryUrl);
        System.out.println("Product Public ID: " + productPublicId);
        System.out.println("=================================================");
    }
}
