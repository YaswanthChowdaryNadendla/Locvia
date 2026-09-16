package com.locvia;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.locvia.dto.CreateDeliveryRequest;
import com.locvia.dto.UpdateDeliveryStatusRequest;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class DeliveryApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private AddressRepository addressRepository;

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
    private User partnerA;
    private User partnerB;
    private User admin;

    private String customer1Token;
    private String customer2Token;
    private String shopOwnerToken;
    private String partnerAToken;
    private String partnerBToken;
    private String adminToken;

    private Order order1;
    private Order order2;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        customer1 = userRepository.save(new User("Customer One", "cust1@locvia.com", "9876543210", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER));
        customer2 = userRepository.save(new User("Customer Two", "cust2@locvia.com", "9876543211", passwordEncoder.encode("Pass@123"), UserRole.CUSTOMER));
        shopOwner = userRepository.save(new User("Shop Owner", "owner@locvia.com", "9876543212", passwordEncoder.encode("Pass@123"), UserRole.SHOP_OWNER));
        partnerA = userRepository.save(new User("Delivery Partner A", "partnerA@locvia.com", "9876543213", passwordEncoder.encode("Pass@123"), UserRole.DELIVERY_PARTNER));
        partnerB = userRepository.save(new User("Delivery Partner B", "partnerB@locvia.com", "9876543214", passwordEncoder.encode("Pass@123"), UserRole.DELIVERY_PARTNER));
        admin = userRepository.save(new User("Platform Admin", "admin@locvia.com", "9876543215", passwordEncoder.encode("Pass@123"), UserRole.ADMIN));

        customer1Token = jwtService.generateToken(customer1.getEmail(), customer1.getId(), "ROLE_CUSTOMER");
        customer2Token = jwtService.generateToken(customer2.getEmail(), customer2.getId(), "ROLE_CUSTOMER");
        shopOwnerToken = jwtService.generateToken(shopOwner.getEmail(), shopOwner.getId(), "ROLE_SHOP_OWNER");
        partnerAToken = jwtService.generateToken(partnerA.getEmail(), partnerA.getId(), "ROLE_DELIVERY_PARTNER");
        partnerBToken = jwtService.generateToken(partnerB.getEmail(), partnerB.getId(), "ROLE_DELIVERY_PARTNER");
        adminToken = jwtService.generateToken(admin.getEmail(), admin.getId(), "ROLE_ADMIN");

        Address addr1 = addressRepository.save(new Address(customer1, "Home", "Customer One", "9876543210", "12-34 Main St", "", "Ongole", "Andhra Pradesh", "523001"));
        Address addr2 = addressRepository.save(new Address(customer2, "Work", "Customer Two", "9876543211", "78 Tech Park", "", "Ongole", "Andhra Pradesh", "523001"));

        order1 = new Order(customer1, addr1, new BigDecimal("150.00"), OrderStatus.PENDING, PaymentStatus.PENDING, "COD");
        order1.setRecipientName("Customer One");
        order1.setPhoneNumber("9876543210");
        order1.setAddressLine1("12-34 Main St");
        order1.setCity("Ongole");
        order1.setState("Andhra Pradesh");
        order1.setPostalCode("523001");
        order1 = orderRepository.save(order1);

        order2 = new Order(customer2, addr2, new BigDecimal("250.00"), OrderStatus.PENDING, PaymentStatus.PENDING, "COD");
        order2.setRecipientName("Customer Two");
        order2.setPhoneNumber("9876543211");
        order2.setAddressLine1("78 Tech Park");
        order2.setCity("Ongole");
        order2.setState("Andhra Pradesh");
        order2.setPostalCode("523001");
        order2 = orderRepository.save(order2);
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        paymentRepository.deleteAll();
        deliveryRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        addressRepository.deleteAll();
        inventoryRepository.deleteAll();
        productRepository.deleteAll();
        shopRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Admin can assign delivery to a valid DELIVERY_PARTNER")
    void testAdminAssignDeliverySuccess() throws Exception {
        CreateDeliveryRequest request = new CreateDeliveryRequest(order1.getId(), partnerA.getId());

        mockMvc.perform(post("/api/admin/deliveries")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.orderId").value(order1.getId()))
                .andExpect(jsonPath("$.deliveryPartnerId").value(partnerA.getId()))
                .andExpect(jsonPath("$.deliveryPartnerName").value("Delivery Partner A"))
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.assignedAt").isNotEmpty())
                .andExpect(jsonPath("$.deliveryAddress.recipientName").value("Customer One"));

        // Order status synchronizes to READY_FOR_PICKUP
        Order updated = orderRepository.findById(order1.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.READY_FOR_PICKUP);
    }

    @Test
    @DisplayName("2. Non-delivery-partner user cannot be assigned as delivery partner (400 Bad Request)")
    void testCannotAssignNonDeliveryPartner() throws Exception {
        CreateDeliveryRequest request = new CreateDeliveryRequest(order1.getId(), customer1.getId());

        mockMvc.perform(post("/api/admin/deliveries")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("not a delivery partner")));
    }

    @Test
    @DisplayName("3. Cannot create duplicate active delivery for an order (409 Conflict)")
    void testCannotCreateDuplicateActiveDelivery() throws Exception {
        CreateDeliveryRequest request = new CreateDeliveryRequest(order1.getId(), partnerA.getId());

        // First assignment
        mockMvc.perform(post("/api/admin/deliveries").header("Authorization", "Bearer " + adminToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request))).andExpect(status().isCreated());

        // Duplicate assignment attempt
        mockMvc.perform(post("/api/admin/deliveries")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already been assigned")));
    }

    @Test
    @DisplayName("4. Cannot assign delivery to cancelled order (409 Conflict)")
    void testCannotAssignDeliveryToCancelledOrder() throws Exception {
        order1.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order1);

        CreateDeliveryRequest request = new CreateDeliveryRequest(order1.getId(), partnerA.getId());

        mockMvc.perform(post("/api/admin/deliveries")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("cancelled order")));
    }

    @Test
    @DisplayName("5. Cannot assign delivery to delivered order (409 Conflict)")
    void testCannotAssignDeliveryToDeliveredOrder() throws Exception {
        order1.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order1);

        CreateDeliveryRequest request = new CreateDeliveryRequest(order1.getId(), partnerA.getId());

        mockMvc.perform(post("/api/admin/deliveries")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("delivered order")));
    }

    @Test
    @DisplayName("6. Partner isolation: Partner A can view Delivery A, but cannot access or update Delivery B")
    void testPartnerIsolation() throws Exception {
        Delivery delivA = new Delivery(order1, partnerA, DeliveryStatus.ASSIGNED);
        delivA.setAssignedAt(LocalDateTime.now());
        delivA = deliveryRepository.save(delivA);

        Delivery delivB = new Delivery(order2, partnerB, DeliveryStatus.ASSIGNED);
        delivB.setAssignedAt(LocalDateTime.now());
        delivB = deliveryRepository.save(delivB);

        // Partner A can view Delivery A
        mockMvc.perform(get("/api/delivery/" + delivA.getId()).header("Authorization", "Bearer " + partnerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryPartnerId").value(partnerA.getId()));

        // Partner A CANNOT view Delivery B (returns 404 Not Found)
        mockMvc.perform(get("/api/delivery/" + delivB.getId()).header("Authorization", "Bearer " + partnerAToken))
                .andExpect(status().isNotFound());

        // Partner A CANNOT update Delivery B (returns 404 Not Found)
        mockMvc.perform(patch("/api/delivery/" + delivB.getId() + "/status")
                        .header("Authorization", "Bearer " + partnerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDeliveryStatusRequest(DeliveryStatus.PICKED_UP))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("7. Delivery status progression updates timestamps and synchronizes Order status")
    void testDeliveryStatusProgressionAndOrderSync() throws Exception {
        Delivery delivery = new Delivery(order1, partnerA, DeliveryStatus.ASSIGNED);
        delivery.setAssignedAt(LocalDateTime.now());
        delivery = deliveryRepository.save(delivery);

        // 1. ASSIGNED -> PICKED_UP
        mockMvc.perform(patch("/api/delivery/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + partnerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDeliveryStatusRequest(DeliveryStatus.PICKED_UP))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PICKED_UP"))
                .andExpect(jsonPath("$.pickedUpAt").isNotEmpty());

        // 2. PICKED_UP -> OUT_FOR_DELIVERY (Order syncs to OUT_FOR_DELIVERY)
        mockMvc.perform(patch("/api/delivery/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + partnerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDeliveryStatusRequest(DeliveryStatus.OUT_FOR_DELIVERY))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OUT_FOR_DELIVERY"))
                .andExpect(jsonPath("$.orderStatus").value("OUT_FOR_DELIVERY"));

        assertThat(orderRepository.findById(order1.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.OUT_FOR_DELIVERY);

        // 3. OUT_FOR_DELIVERY -> DELIVERED (Order syncs to DELIVERED)
        mockMvc.perform(patch("/api/delivery/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + partnerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDeliveryStatusRequest(DeliveryStatus.DELIVERED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"))
                .andExpect(jsonPath("$.deliveredAt").isNotEmpty())
                .andExpect(jsonPath("$.orderStatus").value("DELIVERED"));

        assertThat(orderRepository.findById(order1.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("8. Invalid status transitions rejected (409 Conflict)")
    void testInvalidStatusTransitions() throws Exception {
        Delivery delivery = new Delivery(order1, partnerA, DeliveryStatus.ASSIGNED);
        delivery.setAssignedAt(LocalDateTime.now());
        delivery = deliveryRepository.save(delivery);

        // ASSIGNED -> DELIVERED (invalid jump)
        mockMvc.perform(patch("/api/delivery/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + partnerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDeliveryStatusRequest(DeliveryStatus.DELIVERED))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("Invalid delivery status transition")));

        // Mark DELIVERED
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredAt(LocalDateTime.now());
        deliveryRepository.save(delivery);

        // DELIVERED -> CANCELLED (invalid)
        mockMvc.perform(patch("/api/delivery/" + delivery.getId() + "/status")
                        .header("Authorization", "Bearer " + partnerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateDeliveryStatusRequest(DeliveryStatus.CANCELLED))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("9. Customer delivery tracking isolation: Customer A sees Delivery A, but cannot see Delivery B")
    void testCustomerDeliveryTrackingIsolation() throws Exception {
        Delivery delivA = new Delivery(order1, partnerA, DeliveryStatus.ASSIGNED);
        delivA.setAssignedAt(LocalDateTime.now());
        deliveryRepository.save(delivA);

        Delivery delivB = new Delivery(order2, partnerB, DeliveryStatus.ASSIGNED);
        delivB.setAssignedAt(LocalDateTime.now());
        deliveryRepository.save(delivB);

        // Customer 1 views own order delivery
        mockMvc.perform(get("/api/orders/" + order1.getId() + "/delivery")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(order1.getId()))
                .andExpect(jsonPath("$.deliveryPartnerName").value("Delivery Partner A"));

        // Customer 1 attempts to view Customer 2's order delivery -> 404 Not Found
        mockMvc.perform(get("/api/orders/" + order2.getId() + "/delivery")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("10. Customer, Shop Owner, and unauthenticated users cannot update delivery status")
    void testDeliveryStatusUpdateRoleAccess() throws Exception {
        Delivery delivery = new Delivery(order1, partnerA, DeliveryStatus.ASSIGNED);
        delivery.setAssignedAt(LocalDateTime.now());
        delivery = deliveryRepository.save(delivery);

        UpdateDeliveryStatusRequest request = new UpdateDeliveryStatusRequest(DeliveryStatus.PICKED_UP);

        mockMvc.perform(patch("/api/delivery/" + delivery.getId() + "/status").header("Authorization", "Bearer " + customer1Token).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/delivery/" + delivery.getId() + "/status").header("Authorization", "Bearer " + shopOwnerToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/delivery/" + delivery.getId() + "/status").contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
