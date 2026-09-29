package com.locvia.service;

import com.locvia.dto.*;
import com.locvia.entity.*;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Service managing customer order placement, inventory deduction, historical snapshot preservation,
 * customer order tracking, and order cancellation with inventory restoration.
 */
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final DeliveryRepository deliveryRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        CartRepository cartRepository,
                        CartItemRepository cartItemRepository,
                        AddressRepository addressRepository,
                        InventoryRepository inventoryRepository,
                        UserRepository userRepository,
                        ShopRepository shopRepository,
                        ProductRepository productRepository,
                        DeliveryRepository deliveryRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.addressRepository = addressRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.productRepository = productRepository;
        this.deliveryRepository = deliveryRepository;
    }

    /**
     * Places a customer order from their shopping cart with atomic stock deduction and address snapshotting.
     */
    @Transactional
    public OrderResponse createOrder(String userEmail, CreateOrderRequest request) {
        User user = getUserByEmail(userEmail);

        // 1. Retrieve customer cart
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Cannot create an order with an empty cart."));

        List<CartItem> cartItems = cartItemRepository.findByCartIdOrderByCreatedAtAsc(cart.getId());
        if (cartItems == null || cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cannot create an order with an empty cart.");
        }

        // 2. Validate delivery address ownership
        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Delivery address not found with id: " + request.getAddressId()));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Delivery address not found with id: " + request.getAddressId());
        }

        // 3. Validate product availability and inventory for all items before any modification
        List<Inventory> inventoriesToUpdate = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            if (product == null || !Boolean.TRUE.equals(product.getActive())) {
                throw new IllegalStateException("Product '" + (product != null ? product.getName() : "Unknown") + "' is no longer available.");
            }

            Shop shop = product.getShop();
            if (shop != null && Boolean.FALSE.equals(shop.getIsOpen())) {
                throw new IllegalStateException("Shop '" + shop.getName() + "' is currently closed and not accepting orders.");
            }

            Inventory inventory = inventoryRepository.findByProductId(product.getId())
                    .orElseThrow(() -> new IllegalStateException("Inventory not found for product '" + product.getName() + "'."));

            if (cartItem.getQuantity() == null || cartItem.getQuantity() <= 0) {
                throw new IllegalArgumentException("Invalid quantity for product '" + product.getName() + "'.");
            }

            int availableStock = inventory.getQuantity() != null ? inventory.getQuantity() : 0;
            if (availableStock == 0) {
                throw new IllegalStateException("Product '" + product.getName() + "' is currently out of stock.");
            }

            if (availableStock < cartItem.getQuantity()) {
                throw new IllegalStateException("Only " + availableStock + " units of " + product.getName() + " are currently available.");
            }

            BigDecimal price = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            inventoriesToUpdate.add(inventory);
        }

        // 4. Create Order with snapshot delivery address
        Order order = new Order();
        order.setUser(user);
        order.setAddress(address);
        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setPaymentMethod("COD");

        // Populate Address Snapshot
        String recipient = (address.getFullName() != null && !address.getFullName().isBlank()) ? address.getFullName() : user.getName();
        String phone = (address.getPhone() != null && !address.getPhone().isBlank()) ? address.getPhone() : user.getPhone();
        order.setRecipientName(recipient);
        order.setPhoneNumber(phone);
        order.setAddressLine1(address.getAddressLine1());
        order.setAddressLine2(address.getAddressLine2());
        order.setCity(address.getCity());
        order.setState(address.getState());
        order.setPostalCode(address.getPostalCode());
        order.setLandmark(address.getLandmark());
        order.setLatitude(address.getLatitude());
        order.setLongitude(address.getLongitude());

        Order savedOrder = orderRepository.save(order);

        // 5. Create OrderItems with snapshot details and deduct inventory
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        int totalItemCount = 0;

        for (int i = 0; i < cartItems.size(); i++) {
            CartItem cartItem = cartItems.get(i);
            Product product = cartItem.getProduct();
            Inventory inventory = inventoriesToUpdate.get(i);

            BigDecimal price = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = new OrderItem(
                    savedOrder,
                    product,
                    product.getName(),
                    price,
                    cartItem.getQuantity(),
                    lineTotal,
                    product.getImageUrl()
            );
            OrderItem savedItem = orderItemRepository.save(orderItem);

            // Deduct inventory and synchronize Product stock
            int newQuantity = inventory.getQuantity() - cartItem.getQuantity();
            inventory.setQuantity(newQuantity);
            inventory.setAvailable(newQuantity > 0);
            inventoryRepository.save(inventory);

            product.setStock(newQuantity);
            productRepository.save(product);

            totalItemCount += cartItem.getQuantity();
            itemResponses.add(mapToOrderItemResponse(savedItem));
        }

        // 6. Clear cart items (Cart entity remains for reuse)
        cartItemRepository.deleteByCartId(cart.getId());

        // 7. Automatically assign to an ONLINE Delivery Partner
        autoAssignOrderToOnlineDeliveryPartner(savedOrder);

        OrderAddressResponse addressResponse = mapToOrderAddressResponse(savedOrder);
        return new OrderResponse(
                savedOrder.getId(),
                savedOrder.getStatus(),
                savedOrder.getPaymentStatus(),
                savedOrder.getPaymentMethod(),
                savedOrder.getSubtotal(),
                savedOrder.getTotalAmount(),
                totalItemCount,
                itemResponses,
                addressResponse,
                savedOrder.getCreatedAt(),
                savedOrder.getUpdatedAt()
        );
    }

    /**
     * Retrieves all orders placed by the authenticated customer, newest first.
     */
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getMyOrders(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<OrderSummaryResponse> responses = new ArrayList<>();

        for (Order order : orders) {
            int itemCount = orderItemRepository.findByOrderId(order.getId())
                    .stream()
                    .mapToInt(OrderItem::getQuantity)
                    .sum();

            responses.add(new OrderSummaryResponse(
                    order.getId(),
                    order.getStatus(),
                    order.getPaymentStatus(),
                    order.getPaymentMethod(),
                    order.getSubtotal(),
                    order.getTotalAmount(),
                    itemCount,
                    order.getCreatedAt(),
                    order.getUpdatedAt()
            ));
        }

        return responses;
    }

    /**
     * Retrieves detailed order information ensuring customer ownership.
     */
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(String userEmail, Long orderId) {
        User user = getUserByEmail(userEmail);
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        return buildOrderResponse(order);
    }

    /**
     * Cancels an eligible PENDING order and restores the exact deducted inventory.
     */
    @Transactional
    public OrderResponse cancelOrder(String userEmail, Long orderId) {
        User user = getUserByEmail(userEmail);
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Order is already cancelled.");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Cannot cancel order in status: " + order.getStatus());
        }

        // Restore deducted inventory and synchronize Product stock
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            if (item.getProduct() != null) {
                inventoryRepository.findByProductId(item.getProduct().getId()).ifPresent(inventory -> {
                    int restoredQuantity = inventory.getQuantity() + item.getQuantity();
                    inventory.setQuantity(restoredQuantity);
                    inventory.setAvailable(restoredQuantity > 0);
                    inventoryRepository.save(inventory);

                    Product prod = item.getProduct();
                    prod.setStock(restoredQuantity);
                    productRepository.save(prod);
                });
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        // Cancel associated non-delivered delivery assignment
        deliveryRepository.findByOrderId(order.getId()).ifPresent(delivery -> {
            if (delivery.getStatus() != DeliveryStatus.DELIVERED) {
                delivery.setStatus(DeliveryStatus.CANCELLED);
                deliveryRepository.save(delivery);
            }
        });

        return buildOrderResponse(savedOrder);
    }

    private OrderResponse buildOrderResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        int totalItemCount = 0;

        for (OrderItem item : items) {
            totalItemCount += item.getQuantity();
            itemResponses.add(mapToOrderItemResponse(item));
        }

        OrderAddressResponse addressResponse = mapToOrderAddressResponse(order);

        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentMethod(),
                order.getSubtotal(),
                order.getTotalAmount(),
                totalItemCount,
                itemResponses,
                addressResponse,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    private OrderItemResponse mapToOrderItemResponse(OrderItem item) {
        Long prodId = item.getProduct() != null ? item.getProduct().getId() : null;
        return new OrderItemResponse(
                item.getId(),
                prodId,
                item.getProductName(),
                item.getProductPrice(),
                item.getQuantity(),
                item.getSubtotal(),
                item.getImageUrl()
        );
    }

    private OrderAddressResponse mapToOrderAddressResponse(Order order) {
        return new OrderAddressResponse(
                order.getRecipientName(),
                order.getPhoneNumber(),
                order.getAddressLine1(),
                order.getAddressLine2(),
                order.getCity(),
                order.getState(),
                order.getPostalCode(),
                order.getLandmark(),
                order.getLatitude(),
                order.getLongitude()
        );
    }

    /**
     * Retrieves all orders across the platform for administration, with optional filters.
     */
    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getAllOrdersForAdmin(OrderStatus status, PaymentStatus paymentStatus, Long shopId, Long customerId) {
        List<Order> orders = orderRepository.findAdminOrdersWithFilters(status, paymentStatus, customerId);
        List<AdminOrderResponse> responses = new ArrayList<>();

        for (Order order : orders) {
            // If shopId filter is supplied, check if any order item belongs to the shop
            if (shopId != null) {
                boolean matchesShop = orderItemRepository.findByOrderId(order.getId())
                        .stream()
                        .anyMatch(item -> item.getProduct() != null && item.getProduct().getShop() != null
                                && shopId.equals(item.getProduct().getShop().getId()));
                if (!matchesShop) {
                    continue;
                }
            }
            responses.add(mapToAdminOrderResponse(order));
        }

        return responses;
    }

    /**
     * Retrieves all orders across the platform for administration with status, paymentStatus, and customer filters.
     */
    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getAllOrdersForAdmin(OrderStatus status, PaymentStatus paymentStatus, Long customerId) {
        return getAllOrdersForAdmin(status, paymentStatus, null, customerId);
    }

    /**
     * Retrieves full order details for administrative inspection by order ID.
     */
    @Transactional(readOnly = true)
    public AdminOrderResponse getOrderByIdForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return mapToAdminOrderResponse(order);
    }

    /**
     * Operationally updates order fulfillment status by an administrator.
     * Enforces valid lifecycle transitions and triggers atomic inventory restitution upon cancellation.
     */
    @Transactional
    public AdminOrderResponse updateOrderStatusForAdmin(Long orderId, OrderStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("Target order status is required");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == newStatus) {
            return mapToAdminOrderResponse(order);
        }

        if (currentStatus == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot alter status of an already DELIVERED order.");
        }

        if (currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot alter status of an already CANCELLED order.");
        }

        // If transitioning to CANCELLED, restore inventory and synchronize Product stock
        if (newStatus == OrderStatus.CANCELLED) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                if (item.getProduct() != null) {
                    inventoryRepository.findByProductId(item.getProduct().getId()).ifPresent(inventory -> {
                        int restoredQuantity = inventory.getQuantity() + item.getQuantity();
                        inventory.setQuantity(restoredQuantity);
                        inventory.setAvailable(restoredQuantity > 0);
                        inventoryRepository.save(inventory);

                        Product prod = item.getProduct();
                        prod.setStock(restoredQuantity);
                        productRepository.save(prod);
                    });
                }
            }

            // Cancel any non-delivered delivery assignment
            deliveryRepository.findByOrderId(order.getId()).ifPresent(delivery -> {
                if (delivery.getStatus() != DeliveryStatus.DELIVERED) {
                    delivery.setStatus(DeliveryStatus.CANCELLED);
                    deliveryRepository.save(delivery);
                }
            });
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);
        return mapToAdminOrderResponse(savedOrder);
    }

    private AdminOrderResponse mapToAdminOrderResponse(Order order) {
        AdminOrderResponse.CustomerSummary customerSummary = null;
        if (order.getUser() != null) {
            customerSummary = new AdminOrderResponse.CustomerSummary(
                    order.getUser().getId(),
                    order.getUser().getName(),
                    order.getUser().getEmail(),
                    order.getUser().getPhone()
            );
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        for (OrderItem item : items) {
            itemResponses.add(mapToOrderItemResponse(item));
        }

        OrderAddressResponse addressResponse = mapToOrderAddressResponse(order);

        return new AdminOrderResponse(
                order.getId(),
                customerSummary,
                itemResponses,
                order.getSubtotal(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentMethod(),
                addressResponse,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    /**
     * Retrieves all orders containing items belonging to the specified shop.
     * Strictly verifies that the authenticated caller owns the shop or is an administrator.
     */
    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getOrdersForShop(Long shopId, String callerEmail) {
        User caller = getUserByEmail(callerEmail);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        if (caller.getRole() != UserRole.ADMIN && !shop.getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to view orders for another owner's shop");
        }

        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<AdminOrderResponse> responses = new ArrayList<>();

        for (Order order : orders) {
            boolean matchesShop = orderItemRepository.findByOrderId(order.getId())
                    .stream()
                    .anyMatch(item -> item.getProduct() != null && item.getProduct().getShop() != null
                            && shopId.equals(item.getProduct().getShop().getId()));

            if (matchesShop) {
                responses.add(mapToShopOrderResponse(order, shopId));
            }
        }

        return responses;
    }

    /**
     * Retrieves full order details for a specific shop.
     * Enforces shop ownership and verifies order relevance.
     */
    @Transactional(readOnly = true)
    public AdminOrderResponse getOrderByIdForShop(Long shopId, Long orderId, String callerEmail) {
        User caller = getUserByEmail(callerEmail);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        if (caller.getRole() != UserRole.ADMIN && !shop.getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to view orders for another owner's shop");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean matchesShop = orderItemRepository.findByOrderId(order.getId())
                .stream()
                .anyMatch(item -> item.getProduct() != null && item.getProduct().getShop() != null
                        && shopId.equals(item.getProduct().getShop().getId()));

        if (!matchesShop) {
            throw new AccessDeniedException("Access denied: Order does not contain products from this shop");
        }

        return mapToShopOrderResponse(order, shopId);
    }

    /**
     * Operationally updates fulfillment status for an order belonging to the shop.
     * Enforces shop ownership.
     */
    @Transactional
    public AdminOrderResponse updateOrderStatusForShop(Long shopId, Long orderId, OrderStatus newStatus, String callerEmail) {
        User caller = getUserByEmail(callerEmail);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        if (caller.getRole() != UserRole.ADMIN && !shop.getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to update orders for another owner's shop");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean matchesShop = orderItemRepository.findByOrderId(order.getId())
                .stream()
                .anyMatch(item -> item.getProduct() != null && item.getProduct().getShop() != null
                        && shopId.equals(item.getProduct().getShop().getId()));

        if (!matchesShop) {
            throw new AccessDeniedException("Access denied: Order does not contain products from this shop");
        }

        AdminOrderResponse updated = updateOrderStatusForAdmin(orderId, newStatus);
        Order updatedOrder = orderRepository.findById(orderId).orElse(order);
        return mapToShopOrderResponse(updatedOrder, shopId);
    }

    private AdminOrderResponse mapToShopOrderResponse(Order order, Long shopId) {
        AdminOrderResponse.CustomerSummary customerSummary = null;
        if (order.getUser() != null) {
            customerSummary = new AdminOrderResponse.CustomerSummary(
                    order.getUser().getId(),
                    order.getUser().getName(),
                    order.getUser().getEmail(),
                    order.getUser().getPhone()
            );
        }

        List<OrderItem> allItems = orderItemRepository.findByOrderId(order.getId());
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        BigDecimal shopSubtotal = BigDecimal.ZERO;

        for (OrderItem item : allItems) {
            if (item.getProduct() != null && item.getProduct().getShop() != null
                    && shopId.equals(item.getProduct().getShop().getId())) {
                itemResponses.add(mapToOrderItemResponse(item));
                if (item.getSubtotal() != null) {
                    shopSubtotal = shopSubtotal.add(item.getSubtotal());
                }
            }
        }

        OrderAddressResponse addressResponse = mapToOrderAddressResponse(order);

        return new AdminOrderResponse(
                order.getId(),
                customerSummary,
                itemResponses,
                shopSubtotal,
                order.getTotalAmount(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentMethod(),
                addressResponse,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    /**
     * Automatically assigns a newly created order to an approved, online delivery partner.
     * Selects the partner with the fewest active delivery assignments (load balancing).
     */
    private void autoAssignOrderToOnlineDeliveryPartner(Order order) {
        if (order == null || order.getId() == null) {
            return;
        }

        try {
            // Find all active, approved delivery partners
            List<User> approvedPartners = userRepository.findByRoleAndActiveTrueAndAccountStatus(
                    UserRole.DELIVERY_PARTNER, AccountStatus.APPROVED);

            if (approvedPartners == null || approvedPartners.isEmpty()) {
                return;
            }

            // Filter for partners who are online
            List<User> onlinePartners = approvedPartners.stream()
                    .filter(User::isOnline)
                    .toList();

            if (onlinePartners.isEmpty()) {
                return;
            }

            // Statuses considered active for delivery load
            List<DeliveryStatus> activeStatuses = List.of(
                    DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.OUT_FOR_DELIVERY);

            // Select partner with minimum active deliveries
            User chosenPartner = onlinePartners.stream()
                    .min(Comparator.comparingLong(p ->
                            deliveryRepository.countByDeliveryPartnerIdAndStatusIn(p.getId(), activeStatuses)))
                    .orElse(onlinePartners.get(0));

            // Verify no active delivery already exists for this order
            if (!deliveryRepository.existsByOrderIdAndStatusNot(order.getId(), DeliveryStatus.CANCELLED)) {
                Delivery delivery = new Delivery();
                delivery.setOrder(order);
                delivery.setDeliveryPartner(chosenPartner);
                delivery.setStatus(DeliveryStatus.ASSIGNED);
                delivery.setAssignedAt(LocalDateTime.now());
                deliveryRepository.save(delivery);
            }
        } catch (Exception e) {
            // Non-blocking fallback so order creation is never aborted
            org.slf4j.LoggerFactory.getLogger(OrderService.class)
                    .warn("Automatic delivery assignment skipped: {}", e.getMessage());
        }
    }
}
