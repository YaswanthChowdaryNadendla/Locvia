package com.locvia.controller;

import com.locvia.dto.AdminPaymentResponse;
import com.locvia.entity.PaymentStatus;
import com.locvia.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for administrator payment auditing and transaction inspection.
 * Strictly read-only: does not expose gateway secret keys or sensitive customer credentials.
 * Strictly restricted to administrators with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final PaymentService paymentService;

    public AdminPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Lists platform payment transactions with optional filters.
     * GET /api/admin/payments?status=&provider=&orderId=&customerId=
     *
     * @param status     optional payment status filter
     * @param provider   optional provider filter (e.g. RAZORPAY, MOCK, CASH_ON_DELIVERY)
     * @param orderId    optional order ID filter
     * @param customerId optional customer ID filter
     * @param userId     optional user ID filter (alias for customerId)
     * @return list of AdminPaymentResponse
     */
    @GetMapping
    public ResponseEntity<List<AdminPaymentResponse>> getAllPayments(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long userId) {
        Long effectiveUserId = customerId != null ? customerId : userId;
        List<AdminPaymentResponse> payments = paymentService.getAllPaymentsForAdmin(status, provider, orderId, effectiveUserId);
        return ResponseEntity.ok(payments);
    }

    /**
     * Retrieves audit details of a specific payment transaction by ID.
     * GET /api/admin/payments/{id}
     *
     * @param id target payment record ID
     * @return AdminPaymentResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdminPaymentResponse> getPaymentById(@PathVariable Long id) {
        AdminPaymentResponse payment = paymentService.getPaymentByIdForAdmin(id);
        return ResponseEntity.ok(payment);
    }
}
