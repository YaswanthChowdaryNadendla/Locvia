package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateAddressRequest;
import com.locvia.dto.UpdateAddressRequest;
import com.locvia.entity.Address;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.repository.AddressRepository;
import com.locvia.repository.CategoryRepository;
import com.locvia.repository.InventoryRepository;
import com.locvia.repository.OrderRepository;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AddressApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AddressRepository addressRepository;

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

    private User customer1;
    private User customer2;
    private User shopOwner;
    private User deliveryPartner;
    private User admin;

    private String customer1Token;
    private String customer2Token;
    private String shopOwnerToken;
    private String deliveryToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        addressRepository.deleteAll();
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        // Seed users
        customer1 = userRepository.save(new User("Customer One", "addr.cust1@locvia.com", "9876543001", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));
        customer2 = userRepository.save(new User("Customer Two", "addr.cust2@locvia.com", "9876543002", passwordEncoder.encode("Pass123!"), UserRole.CUSTOMER));
        shopOwner = userRepository.save(new User("Shop Owner", "addr.owner@locvia.com", "9876543003", passwordEncoder.encode("Pass123!"), UserRole.SHOP_OWNER));
        deliveryPartner = userRepository.save(new User("Delivery Driver", "addr.driver@locvia.com", "9876543004", passwordEncoder.encode("Pass123!"), UserRole.DELIVERY_PARTNER));
        admin = userRepository.save(new User("Admin User", "addr.admin@locvia.com", "9876543005", passwordEncoder.encode("Pass123!"), UserRole.ADMIN));

        customer1Token = jwtService.generateToken(customer1.getEmail(), customer1.getId(), "ROLE_CUSTOMER");
        customer2Token = jwtService.generateToken(customer2.getEmail(), customer2.getId(), "ROLE_CUSTOMER");
        shopOwnerToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");
        deliveryToken = jwtService.generateToken(deliveryPartner.getEmail(), deliveryPartner.getId(), "ROLE_DELIVERY_PARTNER");
        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");
    }

    @AfterEach
    void tearDown() {
        orderRepository.deleteAll();
        addressRepository.deleteAll();
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==========================================
    // 1. Address Creation & Default Handling Tests
    // ==========================================

    @Test
    @DisplayName("First created address automatically becomes default")
    void testCreateFirstAddress_BecomesDefaultAutomatically() throws Exception {
        CreateAddressRequest request = new CreateAddressRequest(
                "Home",
                "Yaswanth",
                "9876543210",
                "12-34 Main Road",
                "Near Market",
                "Ongole",
                "Andhra Pradesh",
                "523001",
                "Near Clock Tower",
                15.5057,
                80.0499,
                false // requested false, but should become true because it's first!
        );

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.recipientName").value("Yaswanth"))
                .andExpect(jsonPath("$.phoneNumber").value("9876543210"))
                .andExpect(jsonPath("$.city").value("Ongole"))
                .andExpect(jsonPath("$.postalCode").value("523001"))
                .andExpect(jsonPath("$.defaultAddress").value(true))
                .andExpect(jsonPath("$.isDefault").value(true));

        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(customer1.getId());
        assertThat(addresses).hasSize(1);
        assertThat(addresses.get(0).getIsDefault()).isTrue();
    }

    @Test
    @DisplayName("Creating second address with defaultAddress false preserves first as default")
    void testCreateSecondAddress_DefaultFalse_PreservesExistingDefault() throws Exception {
        // Create first address
        Address addr1 = new Address(customer1, "Home", "Yaswanth", "9876543210", "12-34 Main Road", null, "Ongole", "Andhra Pradesh", "523001");
        addr1.setIsDefault(true);
        addr1 = addressRepository.save(addr1);

        CreateAddressRequest request2 = new CreateAddressRequest(
                "Office",
                "Yaswanth Work",
                "9876543211",
                "Tech Park 5",
                null,
                "Ongole",
                "Andhra Pradesh",
                "523002",
                null,
                null,
                null,
                false
        );

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.label").value("Office"))
                .andExpect(jsonPath("$.defaultAddress").value(false));

        Address reloadedAddr1 = addressRepository.findById(addr1.getId()).orElseThrow();
        assertThat(reloadedAddr1.getIsDefault()).isTrue();
    }

    @Test
    @DisplayName("Creating address with defaultAddress true unsets previous default")
    void testCreateAddress_DefaultTrue_UnsetsPreviousDefault() throws Exception {
        // Create first address as default
        Address addr1 = new Address(customer1, "Home", "Yaswanth", "9876543210", "12-34 Main Road", null, "Ongole", "Andhra Pradesh", "523001");
        addr1.setIsDefault(true);
        addr1 = addressRepository.save(addr1);

        CreateAddressRequest request2 = new CreateAddressRequest(
                "Office",
                "Yaswanth Work",
                "9876543211",
                "Tech Park 5",
                null,
                "Ongole",
                "Andhra Pradesh",
                "523002",
                null,
                null,
                null,
                true // requested as new default!
        );

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.defaultAddress").value(true));

        Address reloadedAddr1 = addressRepository.findById(addr1.getId()).orElseThrow();
        assertThat(reloadedAddr1.getIsDefault()).isFalse();

        long defaultCount = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(customer1.getId())
                .stream().filter(Address::getIsDefault).count();
        assertThat(defaultCount).isEqualTo(1);
    }

    // ==========================================
    // 2. Retrieval & Ordering Tests
    // ==========================================

    @Test
    @DisplayName("Customer can get all own addresses in deterministic order (default first)")
    void testGetMyAddresses_ReturnsOrderedList() throws Exception {
        Address addr1 = new Address(customer1, "Home", "Yaswanth", "9876543210", "12-34 Main Road", null, "Ongole", "Andhra Pradesh", "523001");
        addr1.setIsDefault(false);
        addr1 = addressRepository.save(addr1);

        Address addr2 = new Address(customer1, "Office", "Yaswanth Work", "9876543211", "Tech Park 5", null, "Ongole", "Andhra Pradesh", "523002");
        addr2.setIsDefault(true);
        addr2 = addressRepository.save(addr2);

        mockMvc.perform(get("/api/addresses")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(addr2.getId())) // default first!
                .andExpect(jsonPath("$[0].defaultAddress").value(true))
                .andExpect(jsonPath("$[1].id").value(addr1.getId()))
                .andExpect(jsonPath("$[1].defaultAddress").value(false));
    }

    @Test
    @DisplayName("Empty address list returns empty JSON array []")
    void testGetMyAddresses_Empty_ReturnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/addresses")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Customer can get single address by ID")
    void testGetAddressById_Success() throws Exception {
        Address addr = new Address(customer1, "Home", "Yaswanth", "9876543210", "12-34 Main Road", null, "Ongole", "Andhra Pradesh", "523001");
        addr.setIsDefault(true);
        addr = addressRepository.save(addr);

        mockMvc.perform(get("/api/addresses/{id}", addr.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(addr.getId()))
                .andExpect(jsonPath("$.recipientName").value("Yaswanth"))
                .andExpect(jsonPath("$.postalCode").value("523001"));
    }

    @Test
    @DisplayName("Customer accessing non-existent address ID returns 404")
    void testGetAddressById_NotFound() throws Exception {
        mockMvc.perform(get("/api/addresses/99999")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNotFound());
    }

    // ==========================================
    // 3. Cross-User Privacy & Security Tests (404 Masking)
    // ==========================================

    @Test
    @DisplayName("Customer cannot get another customer's address (returns 404)")
    void testGetAddressById_CrossCustomer_Returns404() throws Exception {
        Address cust2Addr = new Address(customer2, "Secret Home", "Two", "9876543222", "Secret Lane", null, "Vijayawada", "Andhra Pradesh", "520001");
        cust2Addr.setIsDefault(true);
        cust2Addr = addressRepository.save(cust2Addr);

        mockMvc.perform(get("/api/addresses/{id}", cust2Addr.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Customer cannot update another customer's address (returns 404)")
    void testUpdateAddress_CrossCustomer_Returns404() throws Exception {
        Address cust2Addr = new Address(customer2, "Secret Home", "Two", "9876543222", "Secret Lane", null, "Vijayawada", "Andhra Pradesh", "520001");
        cust2Addr = addressRepository.save(cust2Addr);

        UpdateAddressRequest request = new UpdateAddressRequest(
                "Hacked", "Hacker", "9876543000", "Hacked St", null, "Ongole", "AP", "523001", null, null, null, false
        );

        mockMvc.perform(put("/api/addresses/{id}", cust2Addr.getId())
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Customer cannot delete another customer's address (returns 404)")
    void testDeleteAddress_CrossCustomer_Returns404() throws Exception {
        Address cust2Addr = new Address(customer2, "Secret Home", "Two", "9876543222", "Secret Lane", null, "Vijayawada", "Andhra Pradesh", "520001");
        cust2Addr = addressRepository.save(cust2Addr);

        mockMvc.perform(delete("/api/addresses/{id}", cust2Addr.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNotFound());

        assertThat(addressRepository.existsById(cust2Addr.getId())).isTrue();
    }

    @Test
    @DisplayName("Customer cannot set default on another customer's address (returns 404)")
    void testSetDefault_CrossCustomer_Returns404() throws Exception {
        Address cust2Addr = new Address(customer2, "Secret Home", "Two", "9876543222", "Secret Lane", null, "Vijayawada", "Andhra Pradesh", "520001");
        cust2Addr = addressRepository.save(cust2Addr);

        mockMvc.perform(patch("/api/addresses/{id}/default", cust2Addr.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNotFound());
    }

    // ==========================================
    // 4. Update & Default Switch Operations
    // ==========================================

    @Test
    @DisplayName("Customer can update own address fields")
    void testUpdateAddress_Success() throws Exception {
        Address addr = new Address(customer1, "Old Label", "Yaswanth", "9876543210", "Old Road", null, "Ongole", "Andhra Pradesh", "523001");
        addr.setIsDefault(true);
        addr = addressRepository.save(addr);

        UpdateAddressRequest request = new UpdateAddressRequest(
                "New Home",
                "Yaswanth Kumar",
                "9876543999",
                "New Avenue 10",
                "Suite 200",
                "Ongole",
                "Andhra Pradesh",
                "523002",
                "Beside Mall",
                15.51,
                80.05,
                true
        );

        mockMvc.perform(put("/api/addresses/{id}", addr.getId())
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("New Home"))
                .andExpect(jsonPath("$.recipientName").value("Yaswanth Kumar"))
                .andExpect(jsonPath("$.phoneNumber").value("9876543999"))
                .andExpect(jsonPath("$.addressLine1").value("New Avenue 10"))
                .andExpect(jsonPath("$.addressLine2").value("Suite 200"))
                .andExpect(jsonPath("$.postalCode").value("523002"))
                .andExpect(jsonPath("$.landmark").value("Beside Mall"));
    }

    @Test
    @DisplayName("Customer can switch default address via PATCH and PUT /api/addresses/{id}/default")
    void testSetDefaultAddress_Success() throws Exception {
        Address addr1 = new Address(customer1, "Home", "Yaswanth", "9876543210", "12 Main Road", null, "Ongole", "Andhra Pradesh", "523001");
        addr1.setIsDefault(true);
        addr1 = addressRepository.save(addr1);

        Address addr2 = new Address(customer1, "Office", "Yaswanth Work", "9876543211", "5 Tech Park", null, "Ongole", "Andhra Pradesh", "523002");
        addr2.setIsDefault(false);
        addr2 = addressRepository.save(addr2);

        // Switch to addr2 via PATCH
        mockMvc.perform(patch("/api/addresses/{id}/default", addr2.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(addr2.getId()))
                .andExpect(jsonPath("$.defaultAddress").value(true));

        assertThat(addressRepository.findById(addr1.getId()).orElseThrow().getIsDefault()).isFalse();
        assertThat(addressRepository.findById(addr2.getId()).orElseThrow().getIsDefault()).isTrue();

        // Switch back to addr1 via PUT (frontend compatibility alias)
        mockMvc.perform(put("/api/addresses/{id}/default", addr1.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(addr1.getId()))
                .andExpect(jsonPath("$.defaultAddress").value(true));

        assertThat(addressRepository.findById(addr1.getId()).orElseThrow().getIsDefault()).isTrue();
        assertThat(addressRepository.findById(addr2.getId()).orElseThrow().getIsDefault()).isFalse();
    }

    // ==========================================
    // 5. Deletion & Re-election Tests
    // ==========================================

    @Test
    @DisplayName("Deleting non-default address deletes cleanly")
    void testDeleteNonDefaultAddress_Success() throws Exception {
        Address addr1 = new Address(customer1, "Home", "Yaswanth", "9876543210", "12 Main Road", null, "Ongole", "Andhra Pradesh", "523001");
        addr1.setIsDefault(true);
        addr1 = addressRepository.save(addr1);

        Address addr2 = new Address(customer1, "Office", "Yaswanth Work", "9876543211", "5 Tech Park", null, "Ongole", "Andhra Pradesh", "523002");
        addr2.setIsDefault(false);
        addr2 = addressRepository.save(addr2);

        mockMvc.perform(delete("/api/addresses/{id}", addr2.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNoContent());

        assertThat(addressRepository.existsById(addr2.getId())).isFalse();
        assertThat(addressRepository.findById(addr1.getId()).orElseThrow().getIsDefault()).isTrue();
    }

    @Test
    @DisplayName("Deleting default address re-elects oldest remaining address as default")
    void testDeleteDefaultAddress_ReElectsOldestRemaining() throws Exception {
        Address addr1 = new Address(customer1, "Oldest", "Yaswanth", "9876543210", "12 Main Road", null, "Ongole", "Andhra Pradesh", "523001");
        addr1.setIsDefault(false);
        addr1 = addressRepository.save(addr1);

        Address addr2 = new Address(customer1, "Newer Default", "Yaswanth", "9876543211", "5 Tech Park", null, "Ongole", "Andhra Pradesh", "523002");
        addr2.setIsDefault(true);
        addr2 = addressRepository.save(addr2);

        // Delete addr2 (the default)
        mockMvc.perform(delete("/api/addresses/{id}", addr2.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNoContent());

        assertThat(addressRepository.existsById(addr2.getId())).isFalse();

        // addr1 should now be elected as default!
        Address reloadedAddr1 = addressRepository.findById(addr1.getId()).orElseThrow();
        assertThat(reloadedAddr1.getIsDefault()).isTrue();
    }

    @Test
    @DisplayName("Deleting only address leaves 0 addresses and no default")
    void testDeleteOnlyAddress_LeavesZero() throws Exception {
        Address addr1 = new Address(customer1, "Only One", "Yaswanth", "9876543210", "12 Main Road", null, "Ongole", "Andhra Pradesh", "523001");
        addr1.setIsDefault(true);
        addr1 = addressRepository.save(addr1);

        mockMvc.perform(delete("/api/addresses/{id}", addr1.getId())
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNoContent());

        assertThat(addressRepository.countByUserId(customer1.getId())).isEqualTo(0);
    }

    // ==========================================
    // 6. Validation Error Rejections
    // ==========================================

    @Test
    @DisplayName("Invalid Indian phone number rejected with 400 Bad Request")
    void testValidation_InvalidPhone_Returns400() throws Exception {
        CreateAddressRequest request = new CreateAddressRequest(
                "Home", "Yaswanth", "12345", "12 Main Road", null, "Ongole", "AP", "523001", null, null, null, true
        );

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.phoneNumber").value("Please enter a valid 10-digit Indian mobile number."));
    }

    @Test
    @DisplayName("Invalid Indian PIN code rejected with 400 Bad Request")
    void testValidation_InvalidPostalCode_Returns400() throws Exception {
        CreateAddressRequest request = new CreateAddressRequest(
                "Home", "Yaswanth", "9876543210", "12 Main Road", null, "Ongole", "AP", "012345", null, null, null, true
        );

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.postalCode").value("Postal code must be a valid 6-digit PIN code."));
    }

    @Test
    @DisplayName("Missing recipient name rejected with 400 Bad Request")
    void testValidation_BlankName_Returns400() throws Exception {
        CreateAddressRequest request = new CreateAddressRequest(
                "Home", "   ", "9876543210", "12 Main Road", null, "Ongole", "AP", "523001", null, null, null, true
        );

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.recipientName").value("Recipient name is required"));
    }

    @Test
    @DisplayName("Invalid coordinate latitude rejected with 400 Bad Request")
    void testValidation_InvalidLatitude_Returns400() throws Exception {
        CreateAddressRequest request = new CreateAddressRequest(
                "Home", "Yaswanth", "9876543210", "12 Main Road", null, "Ongole", "AP", "523001", null, 95.0, 80.0, true
        );

        mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.latitude").value("Latitude must be between -90 and 90"));
    }

    // ==========================================
    // 7. Security & Role Isolation Tests
    // ==========================================

    @Test
    @DisplayName("Unauthenticated request to address API returns 401")
    void testAddressSecurity_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/addresses"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Shop owner accessing customer address API returns 403")
    void testAddressSecurity_ShopOwner_Returns403() throws Exception {
        mockMvc.perform(get("/api/addresses")
                        .header("Authorization", "Bearer " + shopOwnerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Delivery partner accessing customer address API returns 403")
    void testAddressSecurity_DeliveryPartner_Returns403() throws Exception {
        mockMvc.perform(get("/api/addresses")
                        .header("Authorization", "Bearer " + deliveryToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin accessing customer address API returns 403")
    void testAddressSecurity_Admin_Returns403() throws Exception {
        mockMvc.perform(get("/api/addresses")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
    }
}
