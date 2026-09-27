package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.config.CategoryInitializer;
import com.locvia.dto.CategoryResponse;
import com.locvia.dto.CreateProductRequest;
import com.locvia.dto.UpdateProductRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ShopOwnerProductCategoryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private CategoryInitializer categoryInitializer;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User shopOwner;
    private Shop shop;
    private String ownerToken;

    @BeforeEach
    void setUp() {
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        userRepository.deleteAll();

        // Ensure default categories are provisioned
        categoryInitializer.run();

        shopOwner = new User("Test Owner", "owner.product@example.com", "9876543210", passwordEncoder.encode("OwnerPass123!"), UserRole.SHOP_OWNER);
        shopOwner.setAccountStatus(AccountStatus.APPROVED);
        shopOwner.setActive(true);
        shopOwner = userRepository.save(shopOwner);

        ownerToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");

        shop = new Shop("Owner Grocery Store", "Neighborhood grocery", "123 Main St", "9876543210", "shop@example.com", null, shopOwner);
        shop.setActive(true);
        shop.setStatus(ShopStatus.APPROVED);
        shop = shopRepository.save(shop);
    }

    @AfterEach
    void tearDown() {
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    @DisplayName("Shop owner retrieves real categories and creates product successfully without 'Category not found'")
    void shopOwnerAddsAndEditsProductWithRealCategory() throws Exception {
        // 1. Fetch categories via public API GET /api/categories
        MvcResult catResult = mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andReturn();

        List<CategoryResponse> categories = objectMapper.readValue(
                catResult.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, CategoryResponse.class)
        );

        assertThat(categories).isNotEmpty();
        CategoryResponse masalaCategory = categories.stream()
                .filter(c -> "Masala, Oil & More".equalsIgnoreCase(c.name()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Masala, Oil & More category not found"));

        assertThat(masalaCategory.id()).isNotNull();

        // 2. Add product with real category ID
        CreateProductRequest addRequest = new CreateProductRequest(
                masalaCategory.id(),
                "Fortune Sunflower Oil",
                "Pure refined sunflower oil 1L pouch",
                BigDecimal.valueOf(140.00),
                BigDecimal.valueOf(125.00),
                "1 Litre",
                "https://example.com/oil.jpg"
        );

        MvcResult createResult = mockMvc.perform(post("/api/shops/" + shop.getId() + "/products")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Fortune Sunflower Oil"))
                .andExpect(jsonPath("$.categoryId").value(masalaCategory.id()))
                .andExpect(jsonPath("$.categoryName").value("Masala, Oil & More"))
                .andReturn();

        Long createdProductId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // 3. Edit product to switch to another real category (Dairy, Bread & Eggs)
        CategoryResponse dairyCategory = categories.stream()
                .filter(c -> "Dairy, Bread & Eggs".equalsIgnoreCase(c.name()))
                .findFirst()
                .orElseThrow();

        UpdateProductRequest updateRequest = new UpdateProductRequest(
                "Fortune Sunflower Oil - Updated",
                "Updated description",
                BigDecimal.valueOf(145.00),
                BigDecimal.valueOf(130.00),
                "1 Litre",
                dairyCategory.id(),
                "https://example.com/oil_updated.jpg",
                true
        );

        mockMvc.perform(put("/api/products/" + createdProductId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdProductId))
                .andExpect(jsonPath("$.name").value("Fortune Sunflower Oil - Updated"))
                .andExpect(jsonPath("$.categoryId").value(dairyCategory.id()))
                .andExpect(jsonPath("$.categoryName").value("Dairy, Bread & Eggs"));

        // 4. Verifying genuine non-existent category ID returns 404
        CreateProductRequest invalidCategoryRequest = new CreateProductRequest(
                999999L,
                "Invalid Product",
                "Description",
                BigDecimal.valueOf(50.00),
                null,
                "1 Piece",
                "https://example.com/item.jpg"
        );

        mockMvc.perform(post("/api/shops/" + shop.getId() + "/products")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidCategoryRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Category not found with id: 999999"));
    }
}
