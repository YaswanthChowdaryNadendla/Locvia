package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateInventoryRequest;
import com.locvia.dto.UpdateInventoryQuantityRequest;
import com.locvia.dto.UpdateInventoryRequest;
import com.locvia.entity.Category;
import com.locvia.entity.Inventory;
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

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class InventoryApiTests {

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

    private Category groceryCategory;

    private Product product1;
    private Product product2;
    private Product inactiveProduct;

    private Inventory inventory1;
    private Inventory inventory2;

    @BeforeEach
    void setUp() {
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Seed users
        admin = userRepository.save(new User("Admin User", "inv.admin@locvia.com", "9876542111", passwordEncoder.encode("Pass123!"), UserRole.ADMIN));
        owner1 = userRepository.save(new User("Owner One", "inv.owner1@locvia.com", "9876542112", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        owner2 = userRepository.save(new User("Owner Two", "inv.owner2@locvia.com", "9876542113", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        customer = userRepository.save(new User("Customer User", "inv.cust@locvia.com", "9876542114", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));
        deliveryPartner = userRepository.save(new User("Delivery Guy", "inv.deliv@locvia.com", "9876542115", passwordEncoder.encode("Pass123!"), UserRole.DELIVERY_PARTNER));

        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
        owner1Token = jwtService.generateToken(owner1.getEmail(), owner1.getId(), "ROLE_SHOP_OWNER");
        owner2Token = jwtService.generateToken(owner2.getEmail(), owner2.getId(), "ROLE_SHOP_OWNER");
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), "ROLE_DELIVERY_PARTNER");

        // 2. Seed shops
        shop1 = shopRepository.save(new Shop("Owner1 Mart", "Daily groceries", "10 Market St", "9876542112", "mart1@example.com", "https://img.example.com/s1.jpg", owner1));
        shop2 = shopRepository.save(new Shop("Owner2 Mart", "Daily essentials", "20 Market St", "9876542113", "mart2@example.com", "https://img.example.com/s2.jpg", owner2));

        // 3. Seed category
        groceryCategory = new Category("Fresh Groceries", "https://img.example.com/cat.jpg", "Groceries");
        groceryCategory.setActive(true);
        groceryCategory = categoryRepository.save(groceryCategory);

        // 4. Seed products
        product1 = new Product("Farm Fresh Eggs", "12 pack farm eggs", new BigDecimal("80.00"), null, "https://img.example.com/eggs.jpg", "12 pcs", shop1, groceryCategory);
        product1.setActive(true);
        product1 = productRepository.save(product1);

        product2 = new Product("Organic Honey", "Pure wild honey", new BigDecimal("250.00"), null, "https://img.example.com/honey.jpg", "500 g", shop1, groceryCategory);
        product2.setActive(true);
        product2 = productRepository.save(product2);

        inactiveProduct = new Product("Discontinued Cereal", "Old stock", new BigDecimal("120.00"), null, "https://img.example.com/cereal.jpg", "500 g", shop1, groceryCategory);
        inactiveProduct.setActive(false);
        inactiveProduct = productRepository.save(inactiveProduct);

        // 5. Seed inventory for product1 (in stock, quantity 20, threshold 5)
        inventory1 = new Inventory(product1, 20, 5);
        inventory1 = inventoryRepository.save(inventory1);

        // 6. Seed inventory for product2 (low stock, quantity 3, threshold 5)
        inventory2 = new Inventory(product2, 3, 5);
        inventory2 = inventoryRepository.save(inventory2);
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
    // 1. Public Endpoint Tests
    // ==========================================

    @Test
    @DisplayName("Public user can view stock availability for active product")
    void testPublicGetStockAvailability_Success() throws Exception {
        mockMvc.perform(get("/api/products/{productId}/inventory", product1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(product1.getId()))
                .andExpect(jsonPath("$.quantity").value(20))
                .andExpect(jsonPath("$.inStock").value(true));
    }

    @Test
    @DisplayName("Public get inventory returns 404 when product is inactive")
    void testPublicGetStockAvailability_InactiveProduct_Returns404() throws Exception {
        Inventory inactiveInv = new Inventory(inactiveProduct, 10, 5);
        inventoryRepository.save(inactiveInv);

        mockMvc.perform(get("/api/products/{productId}/inventory", inactiveProduct.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(containsString("Product not found with id")));
    }

    @Test
    @DisplayName("Public get inventory returns 404 when product does not exist")
    void testPublicGetStockAvailability_NotFound() throws Exception {
        mockMvc.perform(get("/api/products/99999/inventory"))
                .andExpect(status().isNotFound());
    }

    // ==========================================
    // 2. Role-Based Access Control Tests
    // ==========================================

    @Test
    @DisplayName("Unauthenticated user accessing inventory management gets 401")
    void testManageInventory_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/products/{productId}/inventory/manage", product1.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Customer accessing inventory management gets 403")
    void testManageInventory_Customer_Returns403() throws Exception {
        mockMvc.perform(get("/api/products/{productId}/inventory/manage", product1.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Delivery partner accessing shop inventory gets 403")
    void testShopInventory_DeliveryPartner_Returns403() throws Exception {
        mockMvc.perform(get("/api/shops/{shopId}/inventory", shop1.getId())
                        .header("Authorization", "Bearer " + deliveryToken))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 3. Shop Owner Inventory Operations
    // ==========================================

    @Test
    @DisplayName("Shop owner can view detailed management info for own product")
    void testOwnerGetInventoryManage_Success() throws Exception {
        mockMvc.perform(get("/api/products/{productId}/inventory/manage", product1.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(product1.getId()))
                .andExpect(jsonPath("$.productName").value("Farm Fresh Eggs"))
                .andExpect(jsonPath("$.shopId").value(shop1.getId()))
                .andExpect(jsonPath("$.quantity").value(20))
                .andExpect(jsonPath("$.lowStockThreshold").value(5))
                .andExpect(jsonPath("$.inStock").value(true))
                .andExpect(jsonPath("$.lowStock").value(false));
    }

    @Test
    @DisplayName("Shop owner can view detailed management info even if product is inactive")
    void testOwnerGetInventoryManage_InactiveProduct_Success() throws Exception {
        Inventory inactiveInv = new Inventory(inactiveProduct, 15, 5);
        inventoryRepository.save(inactiveInv);

        mockMvc.perform(get("/api/products/{productId}/inventory/manage", inactiveProduct.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(inactiveProduct.getId()))
                .andExpect(jsonPath("$.quantity").value(15));
    }

    @Test
    @DisplayName("Cross-owner cannot view another shop's product inventory manage")
    void testOwnerGetInventoryManage_CrossOwner_Returns403() throws Exception {
        mockMvc.perform(get("/api/products/{productId}/inventory/manage", product1.getId())
                        .header("Authorization", "Bearer " + owner2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Shop owner can create inventory for a product without inventory")
    void testOwnerCreateInventory_Success() throws Exception {
        // Create a new product without inventory
        Product newProduct = new Product("Basmati Rice", "Premium aged basmati", new BigDecimal("110.00"), null, null, "1 kg", shop1, groceryCategory);
        newProduct.setActive(true);
        newProduct = productRepository.save(newProduct);

        CreateInventoryRequest request = new CreateInventoryRequest(50, 10);

        mockMvc.perform(post("/api/products/{productId}/inventory", newProduct.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.productId").value(newProduct.getId()))
                .andExpect(jsonPath("$.quantity").value(50))
                .andExpect(jsonPath("$.lowStockThreshold").value(10))
                .andExpect(jsonPath("$.inStock").value(true))
                .andExpect(jsonPath("$.lowStock").value(false));

        assertThat(inventoryRepository.existsByProductId(newProduct.getId())).isTrue();
    }

    @Test
    @DisplayName("Create inventory returns 409 Conflict if inventory already exists")
    void testOwnerCreateInventory_Duplicate_Returns409() throws Exception {
        CreateInventoryRequest request = new CreateInventoryRequest(10, 5);

        mockMvc.perform(post("/api/products/{productId}/inventory", product1.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("Cross-owner cannot create inventory for another owner's product")
    void testOwnerCreateInventory_CrossOwner_Returns403() throws Exception {
        Product p = new Product("Oats", "Quick oats", new BigDecimal("50.00"), null, null, "500 g", shop1, groceryCategory);
        p = productRepository.save(p);

        CreateInventoryRequest request = new CreateInventoryRequest(20, 5);

        mockMvc.perform(post("/api/products/{productId}/inventory", p.getId())
                        .header("Authorization", "Bearer " + owner2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Shop owner can update inventory quantity and threshold")
    void testOwnerUpdateInventory_Success() throws Exception {
        UpdateInventoryRequest request = new UpdateInventoryRequest(0, 8);

        mockMvc.perform(put("/api/products/{productId}/inventory", product1.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(0))
                .andExpect(jsonPath("$.lowStockThreshold").value(8))
                .andExpect(jsonPath("$.inStock").value(false))
                .andExpect(jsonPath("$.lowStock").value(true));

        Inventory updated = inventoryRepository.findByProductId(product1.getId()).orElseThrow();
        assertThat(updated.getQuantity()).isEqualTo(0);
        assertThat(updated.getLowStockThreshold()).isEqualTo(8);
        assertThat(updated.getAvailable()).isFalse();
    }

    @Test
    @DisplayName("Shop owner can quickly patch inventory quantity")
    void testOwnerPatchQuantity_Success() throws Exception {
        UpdateInventoryQuantityRequest request = new UpdateInventoryQuantityRequest(4);

        mockMvc.perform(patch("/api/products/{productId}/inventory/quantity", product1.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(4))
                .andExpect(jsonPath("$.inStock").value(true))
                .andExpect(jsonPath("$.lowStock").value(true)); // 4 <= threshold(5)
    }

    @Test
    @DisplayName("Inventory validation rejects negative quantity")
    void testInventoryValidation_NegativeQuantity_Returns400() throws Exception {
        UpdateInventoryQuantityRequest request = new UpdateInventoryQuantityRequest(-5);

        mockMvc.perform(patch("/api/products/{productId}/inventory/quantity", product1.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.quantity").value("Quantity cannot be negative"));
    }

    @Test
    @DisplayName("Inventory validation rejects negative threshold")
    void testInventoryValidation_NegativeThreshold_Returns400() throws Exception {
        UpdateInventoryRequest request = new UpdateInventoryRequest(10, -1);

        mockMvc.perform(put("/api/products/{productId}/inventory", product1.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.lowStockThreshold").value("Low stock threshold cannot be negative"));
    }

    // ==========================================
    // 4. Shop Inventory Views & Filters
    // ==========================================

    @Test
    @DisplayName("Shop owner can retrieve all inventory for their shop")
    void testGetShopInventory_Success() throws Exception {
        mockMvc.perform(get("/api/shops/{shopId}/inventory", shop1.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].productId", containsInAnyOrder(product1.getId().intValue(), product2.getId().intValue())));
    }

    @Test
    @DisplayName("Cross-owner cannot view another shop's full inventory")
    void testGetShopInventory_CrossOwner_Returns403() throws Exception {
        mockMvc.perform(get("/api/shops/{shopId}/inventory", shop1.getId())
                        .header("Authorization", "Bearer " + owner2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Shop owner can filter low-stock inventory")
    void testGetShopInventory_LowStock_Success() throws Exception {
        // product2 has quantity 3 <= threshold 5; product1 has 20 > 5
        mockMvc.perform(get("/api/shops/{shopId}/inventory/low-stock", shop1.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].productId").value(product2.getId()))
                .andExpect(jsonPath("$[0].quantity").value(3))
                .andExpect(jsonPath("$[0].lowStock").value(true));
    }

    @Test
    @DisplayName("Shop owner can filter out-of-stock inventory")
    void testGetShopInventory_OutOfStock_Success() throws Exception {
        // Set product2 quantity to 0
        inventory2.setQuantity(0);
        inventoryRepository.save(inventory2);

        mockMvc.perform(get("/api/shops/{shopId}/inventory/out-of-stock", shop1.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].productId").value(product2.getId()))
                .andExpect(jsonPath("$[0].quantity").value(0))
                .andExpect(jsonPath("$[0].inStock").value(false));
    }

    // ==========================================
    // 5. Admin Inventory Operations
    // ==========================================

    @Test
    @DisplayName("Admin can view inventory across all shops")
    void testAdminGetAllInventory_Success() throws Exception {
        // Add a product + inventory for shop2
        Product shop2Prod = new Product("Whole Wheat Flour", "Atta", new BigDecimal("60.00"), null, null, "1 kg", shop2, groceryCategory);
        shop2Prod.setActive(true);
        shop2Prod = productRepository.save(shop2Prod);

        Inventory inv3 = new Inventory(shop2Prod, 100, 10);
        inventoryRepository.save(inv3);

        mockMvc.perform(get("/api/admin/inventory")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    @DisplayName("Admin can filter inventory by shopId")
    void testAdminGetInventoryByShop_Success() throws Exception {
        mockMvc.perform(get("/api/admin/inventory")
                        .param("shopId", shop1.getId().toString())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("Admin can view global low-stock inventory")
    void testAdminGetLowStock_Success() throws Exception {
        mockMvc.perform(get("/api/admin/inventory/low-stock")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].productId").value(product2.getId()));
    }

    @Test
    @DisplayName("Admin can view global out-of-stock inventory")
    void testAdminGetOutOfStock_Success() throws Exception {
        inventory1.setQuantity(0);
        inventoryRepository.save(inventory1);

        mockMvc.perform(get("/api/admin/inventory/out-of-stock")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].productId").value(product1.getId()));
    }

    @Test
    @DisplayName("Admin can update any product's inventory directly")
    void testAdminUpdateInventory_Success() throws Exception {
        UpdateInventoryRequest request = new UpdateInventoryRequest(75, 12);

        mockMvc.perform(put("/api/admin/products/{productId}/inventory", product1.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(75))
                .andExpect(jsonPath("$.lowStockThreshold").value(12));
    }

    @Test
    @DisplayName("Admin can patch any product's inventory quantity")
    void testAdminPatchQuantity_Success() throws Exception {
        UpdateInventoryQuantityRequest request = new UpdateInventoryQuantityRequest(88);

        mockMvc.perform(patch("/api/admin/products/{productId}/inventory/quantity", product1.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(88));
    }
}
