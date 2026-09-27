package com.locvia.controller;

import com.locvia.dto.AdminOrderResponse;
import com.locvia.dto.UpdateOrderStatusRequest;
import com.locvia.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller exposing store-level order management and lifecycle updates.
 * Restricted to the owning shop owner or platform administrators.
 */
@RestController
@RequestMapping("/api/shops/{shopId}/orders")
@PreAuthorize("hasAnyRole('SHOP_OWNER', 'ADMIN')")
public class ShopOrderController {

    private final OrderService orderService;

    public ShopOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Lists all orders containing items from the specified shop.
     * GET /api/shops/{shopId}/orders
     */
    @GetMapping
    public ResponseEntity<List<AdminOrderResponse>> getOrdersForShop(
            @PathVariable Long shopId,
            Principal principal) {
        List<AdminOrderResponse> orders = orderService.getOrdersForShop(shopId, principal.getName());
        return ResponseEntity.ok(orders);
    }

    /**
     * Retrieves full order details for the specified shop.
     * GET /api/shops/{shopId}/orders/{orderId}
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<AdminOrderResponse> getOrderByIdForShop(
            @PathVariable Long shopId,
            @PathVariable Long orderId,
            Principal principal) {
        AdminOrderResponse order = orderService.getOrderByIdForShop(shopId, orderId, principal.getName());
        return ResponseEntity.ok(order);
    }

    /**
     * Updates fulfillment status for an order belonging to the shop.
     * PATCH /api/shops/{shopId}/orders/{orderId}/status
     */
    @RequestMapping(value = "/{orderId}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<AdminOrderResponse> updateOrderStatusForShop(
            @PathVariable Long shopId,
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            Principal principal) {
        AdminOrderResponse updated = orderService.updateOrderStatusForShop(shopId, orderId, request.getStatus(), principal.getName());
        return ResponseEntity.ok(updated);
    }
}
