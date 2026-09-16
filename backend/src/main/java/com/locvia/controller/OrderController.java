package com.locvia.controller;

import com.locvia.dto.*;
import com.locvia.security.CustomUserDetails;
import com.locvia.service.DeliveryService;
import com.locvia.service.OrderService;
import com.locvia.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for customer order placement, order history, order cancellation,
 * order delivery tracking, and order payment details.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final DeliveryService deliveryService;
    private final PaymentService paymentService;

    public OrderController(OrderService orderService,
                           DeliveryService deliveryService,
                           PaymentService paymentService) {
        this.orderService = orderService;
        this.deliveryService = deliveryService;
        this.paymentService = paymentService;
    }

    /**
     * Creates an order from the authenticated customer's shopping cart.
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                     @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.createOrder(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves all orders for the authenticated customer.
     */
    @GetMapping({"", "/my-orders"})
    public ResponseEntity<List<OrderSummaryResponse>> getMyOrders(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<OrderSummaryResponse> response = orderService.getMyOrders(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves detailed order information ensuring customer ownership.
     */
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<OrderResponse> getOrderById(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                      @PathVariable Long id) {
        OrderResponse response = orderService.getOrderById(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancels an eligible PENDING order and restores the deducted inventory.
     */
    @RequestMapping(value = "/{id:[0-9]+}/cancel", method = {RequestMethod.PATCH, RequestMethod.POST})
    public ResponseEntity<OrderResponse> cancelOrder(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                     @PathVariable Long id) {
        OrderResponse response = orderService.cancelOrder(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves delivery tracking details for an order owned by the authenticated customer.
     */
    @GetMapping("/{orderId:[0-9]+}/delivery")
    public ResponseEntity<CustomerDeliveryResponse> getOrderDelivery(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                                     @PathVariable Long orderId) {
        CustomerDeliveryResponse response = deliveryService.getCustomerOrderDelivery(userDetails.getUsername(), orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves payment details for an order owned by the authenticated customer.
     */
    @GetMapping("/{orderId:[0-9]+}/payment")
    public ResponseEntity<PaymentResponse> getOrderPayment(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                           @PathVariable Long orderId) {
        PaymentResponse response = paymentService.getPaymentByOrderId(userDetails.getUsername(), orderId);
        return ResponseEntity.ok(response);
    }
}
