package com.locvia.service;

import com.locvia.dto.*;
import com.locvia.entity.*;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
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

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        CartRepository cartRepository,
                        CartItemRepository cartItemRepository,
                        AddressRepository addressRepository,
                        InventoryRepository inventoryRepository,
                        UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.addressRepository = addressRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
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

            // Deduct inventory
            inventory.setQuantity(inventory.getQuantity() - cartItem.getQuantity());
            inventoryRepository.save(inventory);

            totalItemCount += cartItem.getQuantity();
            itemResponses.add(mapToOrderItemResponse(savedItem));
        }

        // 6. Clear cart items (Cart entity remains for reuse)
        cartItemRepository.deleteByCartId(cart.getId());

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

        // Restore deducted inventory
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            if (item.getProduct() != null) {
                inventoryRepository.findByProductId(item.getProduct().getId()).ifPresent(inventory -> {
                    inventory.setQuantity(inventory.getQuantity() + item.getQuantity());
                    inventoryRepository.save(inventory);
                });
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

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

        // If transitioning to CANCELLED, restore inventory
        if (newStatus == OrderStatus.CANCELLED) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                if (item.getProduct() != null) {
                    inventoryRepository.findByProductId(item.getProduct().getId()).ifPresent(inventory -> {
                        inventory.setQuantity(inventory.getQuantity() + item.getQuantity());
                        inventoryRepository.save(inventory);
                    });
                }
            }
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

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
