package com.locvia.controller;

import com.locvia.dto.CreatePaymentRequest;
import com.locvia.dto.PaymentResponse;
import com.locvia.dto.RazorpayOrderRequest;
import com.locvia.dto.RazorpayVerifyRequest;
import com.locvia.security.CustomUserDetails;
import com.locvia.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for customer payment transactions, mock payment processing,
 * Razorpay integration, and payment history.
 */
@Validated
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Executes a mock payment for an order owned by the authenticated customer.
     */
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                         @Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.createMockPayment(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Creates a Razorpay payment order for an existing customer order.
     */
    @PostMapping("/razorpay/order")
    public ResponseEntity<?> createRazorpayOrder(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                 @Valid @RequestBody RazorpayOrderRequest request) {
        return ResponseEntity.ok(paymentService.createRazorpayOrder(userDetails.getUsername(), request));
    }

    /**
     * Verifies a completed Razorpay payment transaction.
     */
    @PostMapping("/razorpay/verify")
    public ResponseEntity<PaymentResponse> verifyRazorpayPayment(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                                 @Valid @RequestBody RazorpayVerifyRequest request) {
        PaymentResponse response = paymentService.verifyRazorpayPayment(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * Receives and processes raw Razorpay webhook events.
     * Note: Does NOT apply @Valid Bean validation to the raw webhook payload.
     */
    @PostMapping("/razorpay/webhook")
    public ResponseEntity<?> handleRazorpayWebhook(@RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
                                                   @RequestBody(required = false) String payload) {
        paymentService.processRazorpayWebhook(signature, payload);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Webhook processed successfully"));
    }

    /**
     * Retrieves payment history for the authenticated customer.
     */
    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getMyPayments(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<PaymentResponse> response = paymentService.getMyPayments(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a specific payment by ID, enforcing customer ownership isolation.
     */
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<PaymentResponse> getPaymentById(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                          @PathVariable Long id) {
        PaymentResponse response = paymentService.getPaymentById(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }
}
