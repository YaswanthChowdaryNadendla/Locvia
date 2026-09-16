package com.locvia.controller;

import com.locvia.dto.AdminOrderResponse;
import com.locvia.dto.UpdateOrderStatusRequest;
import com.locvia.entity.OrderStatus;
import com.locvia.entity.PaymentStatus;
import com.locvia.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing administrative order management and lifecycle intervention APIs.
 * Strictly restricted to administrators with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Lists all orders across the platform with optional filters.
     * GET /api/admin/orders?status=&paymentStatus=&shopId=&customerId=&userId=
     *
     * @param status        optional order status filter
     * @param paymentStatus optional payment status filter
     * @param shopId        optional shop ID filter
     * @param customerId    optional customer user ID filter
     * @param userId        optional customer user ID filter (alias for customerId)
     * @return list of AdminOrderResponse
     */
    @GetMapping
    public ResponseEntity<List<AdminOrderResponse>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long userId) {
        Long effectiveUserId = customerId != null ? customerId : userId;
        List<AdminOrderResponse> orders = orderService.getAllOrdersForAdmin(status, paymentStatus, shopId, effectiveUserId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Retrieves detailed order information by ID for administrative inspection.
     * GET /api/admin/orders/{id}
     *
     * @param id target order ID
     * @return AdminOrderResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdminOrderResponse> getOrderById(@PathVariable Long id) {
        AdminOrderResponse order = orderService.getOrderByIdForAdmin(id);
        return ResponseEntity.ok(order);
    }

    /**
     * Operationally modifies order status with full lifecycle validation and inventory reconciliation.
     * PATCH /api/admin/orders/{id}/status (or PUT)
     *
     * @param id      target order ID
     * @param request target status payload
     * @return updated AdminOrderResponse
     */
    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<AdminOrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        AdminOrderResponse updated = orderService.updateOrderStatusForAdmin(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }
}
