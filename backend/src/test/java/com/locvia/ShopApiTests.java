package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.AdminUpdateShopRequest;
import com.locvia.dto.CreateShopRequest;
import com.locvia.dto.UpdateShopRequest;
import com.locvia.entity.Shop;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
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
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ShopApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private static final String OWNER1_EMAIL = "shop.owner1@example.com";
    private static final String OWNER2_EMAIL = "shop.owner2@example.com";
    private static final String CUST_EMAIL = "shop.cust@example.com";
    private static final String DELIVERY_EMAIL = "shop.deliv@example.com";
    private static final String ADMIN_EMAIL = "shop.admin@example.com";

    private User owner1;
    private User owner2;
    private User customer;
    private User deliveryPartner;
    private User admin;

    private String owner1Token;
    private String owner2Token;
    private String customerToken;
    private String deliveryToken;
    private String adminToken;

    private Shop activeShop1;
    private Shop activeShop2;
    private Shop activeShop3;
    private Shop inactiveShop;

    @BeforeEach
    void setUp() {
        // Clear old test data
        shopRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        owner1 = userRepository.save(new User("Owner One", OWNER1_EMAIL, "9876500001", passwordEncoder.encode("Pass@123"), UserRole.SHOP_OWNER));
        owner2 = userRepository.save(new User("Owner Two", OWNER2_EMAIL, "9876500002", passwordEncoder.encode("Pass@123"), UserRole.SHOP_OWNER));
        customer = userRepository.save(new User("Customer", CUST_EMAIL, "9876500003", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER));
        deliveryPartner = userRepository.save(new User("Delivery Partner", DELIVERY_EMAIL, "9876500004", passwordEncoder.encode("Pass@123"), UserRole.DELIVERY_PARTNER));
        admin = userRepository.save(new User("Admin User", ADMIN_EMAIL, "9876500005", passwordEncoder.encode("Pass@123"), UserRole.ADMIN));

        // Generate JWT tokens
        owner1Token = jwtService.generateToken(owner1.getEmail(), owner1.getId(), "ROLE_SHOP_OWNER");
        owner2Token = jwtService.generateToken(owner2.getEmail(), owner2.getId(), "ROLE_SHOP_OWNER");
        customerToken = jwtService.generateToken(customer.getEmail(), customer.getId(), "ROLE_CUSTOMER");
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), "ROLE_DELIVERY_PARTNER");
        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");

        // Seed initial shops
        activeShop1 = new Shop("Green Grocery", "Fresh organic vegetables", "10 Market Street", "9876500001", "green@example.com", "https://img.example.com/green.jpg", owner1);
        activeShop1.setLatitude(15.5057);
        activeShop1.setLongitude(80.0499);
        activeShop1.setActive(true);
        activeShop1.setRating(4.5);
        activeShop1 = shopRepository.save(activeShop1);

        activeShop2 = new Shop("City Supermarket", "Supermarket with daily deals", "20 High Street", "9876500001", "city@example.com", "https://img.example.com/city.jpg", owner1);
        activeShop2.setLatitude(15.5100);
        activeShop2.setLongitude(80.0550);
        activeShop2.setActive(true);
        activeShop2.setRating(4.2);
        activeShop2 = shopRepository.save(activeShop2);

        activeShop3 = new Shop("Sunrise Bakers", "Fresh bread and confectionery", "30 Baker Lane", "9876500002", "sunrise@example.com", "https://img.example.com/sunrise.jpg", owner2);
        activeShop3.setLatitude(15.5200);
        activeShop3.setLongitude(80.0600);
        activeShop3.setActive(true);
        activeShop3.setRating(4.8);
        activeShop3 = shopRepository.save(activeShop3);

        inactiveShop = new Shop("Old Corner Store", "Closed permanently", "40 Closed Road", "9876500002", "old@example.com", null, owner2);
        inactiveShop.setActive(false);
        inactiveShop.setRating(3.0);
        inactiveShop = shopRepository.save(inactiveShop);
    }

    @AfterEach
    void tearDown() {
        shopRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. GET /api/shops is public and returns active shops only")
    void publicGetShopsReturnsActiveShopsOnly() throws Exception {
        mockMvc.perform(get("/api/shops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[?(@.name == 'Green Grocery')]").exists())
                .andExpect(jsonPath("$[?(@.name == 'City Supermarket')]").exists())
                .andExpect(jsonPath("$[?(@.name == 'Sunrise Bakers')]").exists())
                .andExpect(jsonPath("$[?(@.name == 'Old Corner Store')]").doesNotExist());
    }

    @Test
    @DisplayName("2. GET /api/shops/{id} is public and returns active shop details")
    void publicGetShopByIdReturnsActiveShop() throws Exception {
        mockMvc.perform(get("/api/shops/" + activeShop1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(activeShop1.getId()))
                .andExpect(jsonPath("$.name").value("Green Grocery"))
                .andExpect(jsonPath("$.address").value("10 Market Street"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.owner.password").doesNotExist());
    }

    @Test
    @DisplayName("3. GET /api/shops/{id} returns 404 for inactive shop on public route")
    void publicGetShopByIdReturns404ForInactiveShop() throws Exception {
        mockMvc.perform(get("/api/shops/" + inactiveShop.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("4. Unauthenticated user cannot create shop (401)")
    void unauthenticatedUserCannotCreateShop() throws Exception {
        CreateShopRequest request = new CreateShopRequest("New Shop", "Desc", "Address", "9876543210", "new@shop.com", null, 15.0, 80.0);

        mockMvc.perform(post("/api/shops")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("5. CUSTOMER cannot create shop (403 Forbidden)")
    void customerCannotCreateShop() throws Exception {
        CreateShopRequest request = new CreateShopRequest("Customer Shop", "Desc", "Address", "9876543210", "cust@shop.com", null, 15.0, 80.0);

        mockMvc.perform(post("/api/shops")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("6. DELIVERY_PARTNER cannot create shop (403 Forbidden)")
    void deliveryPartnerCannotCreateShop() throws Exception {
        CreateShopRequest request = new CreateShopRequest("Delivery Shop", "Desc", "Address", "9876543210", "deliv@shop.com", null, 15.0, 80.0);

        mockMvc.perform(post("/api/shops")
                        .header("Authorization", "Bearer " + deliveryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("7. SHOP_OWNER can create shop (201 Created)")
    void shopOwnerCanCreateShop() throws Exception {
        CreateShopRequest request = new CreateShopRequest(
                "Fresh Fruit Corner",
                "Direct farm fresh fruits",
                "50 Orchard Lane",
                "9876500099",
                "fruit@example.com",
                "https://img.example.com/fruit.jpg",
                15.5300,
                80.0700
        );

        mockMvc.perform(post("/api/shops")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Fresh Fruit Corner"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.rating").value(0.0))
                .andExpect(jsonPath("$.ownerId").value(owner1.getId()))
                .andExpect(jsonPath("$.owner.email").value(OWNER1_EMAIL));
    }

    @Test
    @DisplayName("8. Body ownerId is ignored; owner is assigned strictly from authenticated token")
    void bodyOwnerIdIsIgnoredDuringCreation() throws Exception {
        // Supply owner2's ID in request payload
        String rawJson = """
                {
                    "name": "Owner Tampering Test",
                    "address": "Secure Way",
                    "ownerId": %d
                }
                """.formatted(owner2.getId());

        mockMvc.perform(post("/api/shops")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rawJson))
                .andExpect(status().isCreated())
                // Verify ownerId in response is owner1, NOT owner2
                .andExpect(jsonPath("$.ownerId").value(owner1.getId()))
                .andExpect(jsonPath("$.owner.email").value(OWNER1_EMAIL));
    }

    @Test
    @DisplayName("9. SHOP_OWNER can retrieve their own shops via GET /api/shops/my (multi-shop support)")
    void shopOwnerCanRetrieveAllOwnedShops() throws Exception {
        mockMvc.perform(get("/api/shops/my")
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.name == 'Green Grocery')]").exists())
                .andExpect(jsonPath("$[?(@.name == 'City Supermarket')]").exists())
                .andExpect(jsonPath("$[?(@.name == 'Sunrise Bakers')]").doesNotExist());
    }

    @Test
    @DisplayName("10. SHOP_OWNER can retrieve own shop via GET /api/shops/my/{id}")
    void shopOwnerCanGetOwnShopById() throws Exception {
        mockMvc.perform(get("/api/shops/my/" + activeShop1.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(activeShop1.getId()))
                .andExpect(jsonPath("$.name").value("Green Grocery"))
                .andExpect(jsonPath("$.ownerId").value(owner1.getId()));
    }

    @Test
    @DisplayName("11. SHOP_OWNER cannot retrieve another owner's shop via GET /api/shops/my/{id} (403 Forbidden)")
    void shopOwnerCannotGetAnotherOwnerShop() throws Exception {
        // owner1 attempts to access shop3 owned by owner2
        mockMvc.perform(get("/api/shops/my/" + activeShop3.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("12. SHOP_OWNER can update their own shop via PUT /api/shops/{id}")
    void shopOwnerCanUpdateOwnShop() throws Exception {
        UpdateShopRequest updateReq = new UpdateShopRequest(
                "Green Grocery Deluxe",
                "Updated fresh groceries and organic dairy",
                "12 Market Street",
                "9876599999",
                "green.deluxe@example.com",
                "https://img.example.com/deluxe.jpg",
                15.5080,
                80.0510
        );

        mockMvc.perform(put("/api/shops/" + activeShop1.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(activeShop1.getId()))
                .andExpect(jsonPath("$.name").value("Green Grocery Deluxe"))
                .andExpect(jsonPath("$.address").value("12 Market Street"))
                .andExpect(jsonPath("$.phone").value("9876599999"))
                .andExpect(jsonPath("$.email").value("green.deluxe@example.com"));

        // Verify in database
        Shop inDb = shopRepository.findById(activeShop1.getId()).orElseThrow();
        assertThat(inDb.getName()).isEqualTo("Green Grocery Deluxe");
        assertThat(inDb.getAddress()).isEqualTo("12 Market Street");
    }

    @Test
    @DisplayName("13. SHOP_OWNER cannot update another owner's shop via PUT /api/shops/{id} (403 Forbidden)")
    void shopOwnerCannotUpdateAnotherOwnerShop() throws Exception {
        UpdateShopRequest updateReq = new UpdateShopRequest("Hijacked Name", null, null, null, null, null, null, null);

        // owner1 tries to update shop3 owned by owner2
        mockMvc.perform(put("/api/shops/" + activeShop3.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // Verify shop3 was NOT changed
        Shop inDb = shopRepository.findById(activeShop3.getId()).orElseThrow();
        assertThat(inDb.getName()).isEqualTo("Sunrise Bakers");
    }

    @Test
    @DisplayName("14. SHOP_OWNER cannot tamper with rating, active status, or ownerId via PUT /api/shops/{id}")
    void shopOwnerCannotModifyRatingOrActiveOrOwner() throws Exception {
        String tamperingJson = """
                {
                    "name": "Legit Name",
                    "rating": 5.0,
                    "active": false,
                    "ownerId": %d
                }
                """.formatted(owner2.getId());

        mockMvc.perform(put("/api/shops/" + activeShop1.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tamperingJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Legit Name"))
                // rating remained 4.5
                .andExpect(jsonPath("$.rating").value(4.5))
                // active remained true
                .andExpect(jsonPath("$.active").value(true))
                // owner remained owner1
                .andExpect(jsonPath("$.ownerId").value(owner1.getId()));

        Shop inDb = shopRepository.findById(activeShop1.getId()).orElseThrow();
        assertThat(inDb.getRating()).isEqualTo(4.5);
        assertThat(inDb.getActive()).isTrue();
        assertThat(inDb.getOwner().getId()).isEqualTo(owner1.getId());
    }

    @Test
    @DisplayName("15. ADMIN can list all shops via GET /api/admin/shops (active & inactive)")
    void adminCanListAllShops() throws Exception {
        mockMvc.perform(get("/api/admin/shops")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[?(@.name == 'Old Corner Store')]").exists());
    }

    @Test
    @DisplayName("16. ADMIN can view any shop via GET /api/admin/shops/{id}")
    void adminCanGetAnyShopById() throws Exception {
        mockMvc.perform(get("/api/admin/shops/" + inactiveShop.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(inactiveShop.getId()))
                .andExpect(jsonPath("$.name").value("Old Corner Store"))
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    @DisplayName("17. ADMIN can update shop details and active status via PUT /api/admin/shops/{id}")
    void adminCanUpdateShopDetailsAndStatus() throws Exception {
        AdminUpdateShopRequest adminReq = new AdminUpdateShopRequest(
                "Old Corner Store Reopened",
                "Reopened under new management",
                "40 Main Road",
                "9876543211",
                "reopened@example.com",
                null,
                15.5400,
                80.0800,
                4.9,
                true // Re-activating shop
        );

        mockMvc.perform(put("/api/admin/shops/" + inactiveShop.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Old Corner Store Reopened"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.rating").value(4.9));

        Shop inDb = shopRepository.findById(inactiveShop.getId()).orElseThrow();
        assertThat(inDb.getActive()).isTrue();
        assertThat(inDb.getRating()).isEqualTo(4.9);
    }

    @Test
    @DisplayName("18. ADMIN can deactivate a shop via DELETE /api/admin/shops/{id} (soft-deactivation)")
    void adminCanDeactivateShopSoftly() throws Exception {
        mockMvc.perform(delete("/api/admin/shops/" + activeShop1.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Shop deactivated successfully"));

        // Verify shop is still in DB but active = false
        Shop inDb = shopRepository.findById(activeShop1.getId()).orElseThrow();
        assertThat(inDb.getActive()).isFalse();

        // Verify it disappears from public discovery
        mockMvc.perform(get("/api/shops"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.name == 'Green Grocery')]").doesNotExist());
    }

    @Test
    @DisplayName("19. Non-admin (CUSTOMER) cannot access GET /api/admin/shops (403 Forbidden)")
    void customerCannotAccessAdminShops() throws Exception {
        mockMvc.perform(get("/api/admin/shops")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("20. Non-admin (SHOP_OWNER) cannot access GET /api/admin/shops (403 Forbidden)")
    void shopOwnerCannotAccessAdminShops() throws Exception {
        mockMvc.perform(get("/api/admin/shops")
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("21. Passwords and credentials are never exposed in ShopResponse")
    void passwordsAreNeverExposedInShopResponse() throws Exception {
        mockMvc.perform(get("/api/shops/" + activeShop1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.owner.password").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("22. Health endpoint remains working (200 OK)")
    void healthEndpointRemainsWorking() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
