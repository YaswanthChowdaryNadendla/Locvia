package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateCategoryRequest;
import com.locvia.dto.UpdateCategoryRequest;
import com.locvia.entity.Category;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.CategoryRepository;
import com.locvia.repository.ShopRepository;
import com.locvia.repository.UserRepository;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CategoryApiTests {

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User admin;
    private User customer;
    private User shopOwner;

    private String adminToken;
    private String customerToken;
    private String shopOwnerToken;

    private Category activeCat1;
    private Category activeCat2;
    private Category inactiveCat;

    @BeforeEach
    void setUp() {
        categoryRepository.deleteAll();
        shopRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(new User("Admin User", "cat.admin@example.com", "9876543210", passwordEncoder.encode("AdminPass123!"), UserRole.ADMIN));
        customer = userRepository.save(new User("Customer User", "cat.customer@example.com", "9876543211", passwordEncoder.encode("CustPass123!"), UserRole.CUSTOMER));
        shopOwner = userRepository.save(new User("Shop Owner", "cat.owner@example.com", "9876543212", passwordEncoder.encode("OwnerPass123!"), UserRole.SHOP_OWNER));

        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");
        shopOwnerToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");

        activeCat1 = new Category("Dairy & Eggs", "https://img.example.com/dairy.jpg", "Milk, butter, and fresh eggs");
        activeCat1.setActive(true);
        activeCat1 = categoryRepository.save(activeCat1);

        activeCat2 = new Category("Fruits & Vegetables", "https://img.example.com/fruits.jpg", "Fresh produce");
        activeCat2.setActive(true);
        activeCat2 = categoryRepository.save(activeCat2);

        inactiveCat = new Category("Seasonal Holiday Specials", "https://img.example.com/holiday.jpg", "Winter seasonal items");
        inactiveCat.setActive(false);
        inactiveCat = categoryRepository.save(inactiveCat);
    }

    @AfterEach
    void tearDown() {
        categoryRepository.deleteAll();
        shopRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==========================================
    // Public Category API Tests
    // ==========================================

    @Test
    @DisplayName("GET /api/categories - Publicly returns only active categories")
    void getAllActiveCategories_returnsOnlyActive() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Dairy & Eggs", "Fruits & Vegetables")))
                .andExpect(jsonPath("$[*].active", everyItem(is(true))));
    }

    @Test
    @DisplayName("GET /api/categories/{id} - Returns active category details by ID")
    void getActiveCategoryById_success() throws Exception {
        mockMvc.perform(get("/api/categories/" + activeCat1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(activeCat1.getId()))
                .andExpect(jsonPath("$.name").value("Dairy & Eggs"))
                .andExpect(jsonPath("$.imageUrl").value("https://img.example.com/dairy.jpg"))
                .andExpect(jsonPath("$.description").value("Milk, butter, and fresh eggs"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("GET /api/categories/{id} - Returns 404 Not Found for inactive category in public endpoint")
    void getActiveCategoryById_inactive_returnsNotFound() throws Exception {
        mockMvc.perform(get("/api/categories/" + inactiveCat.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("GET /api/categories/{id} - Returns 404 Not Found for non-existent category")
    void getActiveCategoryById_nonExistent_returnsNotFound() throws Exception {
        mockMvc.perform(get("/api/categories/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    // ==========================================
    // Admin Category API - Creation Tests
    // ==========================================

    @Test
    @DisplayName("POST /api/admin/categories - Admin creates category successfully (201 Created)")
    void createCategory_admin_success() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest(
                "Bakery & Bread",
                "https://img.example.com/bakery.jpg",
                "Fresh artisan bread and pastries"
        );

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Bakery & Bread"))
                .andExpect(jsonPath("$.imageUrl").value("https://img.example.com/bakery.jpg"))
                .andExpect(jsonPath("$.description").value("Fresh artisan bread and pastries"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());

        assertThat(categoryRepository.existsByNameIgnoreCase("Bakery & Bread")).isTrue();
    }

    @Test
    @DisplayName("POST /api/admin/categories - Rejects duplicate category name with 409 Conflict")
    void createCategory_duplicateName_returnsConflict() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest(
                "Dairy & Eggs",
                "https://img.example.com/another_dairy.jpg",
                "Another dairy description"
        );

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message", containsString("Category already exists with name: Dairy & Eggs")));
    }

    @Test
    @DisplayName("POST /api/admin/categories - Rejects case-insensitive duplicate name with 409 Conflict")
    void createCategory_caseInsensitiveDuplicate_returnsConflict() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest(
                "  dairy & eggs  ",
                null,
                null
        );

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    @DisplayName("POST /api/admin/categories - Rejects blank name with 400 Bad Request")
    void createCategory_blankName_returnsBadRequest() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest(
                "   ",
                "https://img.example.com/test.jpg",
                "Description"
        );

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name").value("Category name is required"));
    }

    @Test
    @DisplayName("POST /api/admin/categories - Customer receives 403 Forbidden")
    void createCategory_customer_returnsForbidden() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("Snacks", null, null);

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/admin/categories - Shop owner receives 403 Forbidden")
    void createCategory_shopOwner_returnsForbidden() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("Snacks", null, null);

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + shopOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/admin/categories - Unauthenticated returns 401 Unauthorized")
    void createCategory_unauthenticated_returnsUnauthorized() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest("Snacks", null, null);

        mockMvc.perform(post("/api/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // Admin Category API - Retrieval Tests
    // ==========================================

    @Test
    @DisplayName("GET /api/admin/categories - Admin lists all categories (active and inactive)")
    void getAllCategories_admin_returnsAll() throws Exception {
        mockMvc.perform(get("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Dairy & Eggs", "Fruits & Vegetables", "Seasonal Holiday Specials")));
    }

    @Test
    @DisplayName("GET /api/admin/categories - Non-admin receives 403 Forbidden")
    void getAllCategories_customer_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/categories")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/categories/{id} - Admin retrieves category even if inactive")
    void getCategoryById_admin_returnsInactive() throws Exception {
        mockMvc.perform(get("/api/admin/categories/" + inactiveCat.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(inactiveCat.getId()))
                .andExpect(jsonPath("$.name").value("Seasonal Holiday Specials"))
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    @DisplayName("GET /api/admin/categories/{id} - Admin receives 404 for non-existent category")
    void getCategoryById_admin_nonExistent_returnsNotFound() throws Exception {
        mockMvc.perform(get("/api/admin/categories/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    // ==========================================
    // Admin Category API - Update Tests
    // ==========================================

    @Test
    @DisplayName("PUT /api/admin/categories/{id} - Admin updates category details and reactivates it")
    void updateCategory_admin_success() throws Exception {
        UpdateCategoryRequest request = new UpdateCategoryRequest(
                "Holiday Specials 2026",
                "https://img.example.com/holiday_new.jpg",
                "Updated holiday specials description",
                true
        );

        mockMvc.perform(put("/api/admin/categories/" + inactiveCat.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(inactiveCat.getId()))
                .andExpect(jsonPath("$.name").value("Holiday Specials 2026"))
                .andExpect(jsonPath("$.imageUrl").value("https://img.example.com/holiday_new.jpg"))
                .andExpect(jsonPath("$.description").value("Updated holiday specials description"))
                .andExpect(jsonPath("$.active").value(true));

        Category updated = categoryRepository.findById(inactiveCat.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Holiday Specials 2026");
        assertThat(updated.getActive()).isTrue();
    }

    @Test
    @DisplayName("PUT /api/admin/categories/{id} - In-place update preserving same name succeeds")
    void updateCategory_sameName_success() throws Exception {
        UpdateCategoryRequest request = new UpdateCategoryRequest(
                "Dairy & Eggs",
                "https://img.example.com/dairy_updated.jpg",
                "Updated description",
                null
        );

        mockMvc.perform(put("/api/admin/categories/" + activeCat1.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Dairy & Eggs"))
                .andExpect(jsonPath("$.imageUrl").value("https://img.example.com/dairy_updated.jpg"));
    }

    @Test
    @DisplayName("PUT /api/admin/categories/{id} - Rejects renaming to existing name of another category (409)")
    void updateCategory_conflictingName_returnsConflict() throws Exception {
        UpdateCategoryRequest request = new UpdateCategoryRequest(
                "Fruits & Vegetables", // Conflicts with activeCat2
                null,
                null,
                null
        );

        mockMvc.perform(put("/api/admin/categories/" + activeCat1.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    // ==========================================
    // Admin Category API - Deactivation Tests
    // ==========================================

    @Test
    @DisplayName("DELETE /api/admin/categories/{id} - Safely soft-deactivates category")
    void deactivateCategory_admin_success() throws Exception {
        mockMvc.perform(delete("/api/admin/categories/" + activeCat1.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Category deactivated successfully"));

        Category deactivated = categoryRepository.findById(activeCat1.getId()).orElseThrow();
        assertThat(deactivated.getActive()).isFalse();

        // Verify it is no longer returned in public endpoint
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Fruits & Vegetables"));
    }

    @Test
    @DisplayName("DELETE /api/admin/categories/{id} - Customer receives 403 Forbidden")
    void deactivateCategory_customer_returnsForbidden() throws Exception {
        mockMvc.perform(delete("/api/admin/categories/" + activeCat1.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/admin/categories/{id} - Non-existent category returns 404 Not Found")
    void deactivateCategory_nonExistent_returnsNotFound() throws Exception {
        mockMvc.perform(delete("/api/admin/categories/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }
}
