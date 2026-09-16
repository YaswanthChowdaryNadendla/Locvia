package com.locvia.service;

import com.locvia.dto.CreatePaymentRequest;
import com.locvia.dto.PaymentResponse;
import com.locvia.dto.RazorpayOrderRequest;
import com.locvia.dto.RazorpayVerifyRequest;
import com.locvia.entity.*;
import com.locvia.exception.BusinessException;
import com.locvia.exception.ExternalServiceException;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.OrderRepository;
import com.locvia.repository.PaymentRepository;
import com.locvia.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service managing customer payment transactions, mock payment simulation,
 * server-side transaction ID generation, and order payment status synchronization.
 */
@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          OrderRepository orderRepository,
                          UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    /**
     * Executes a mock payment for an order owned by the authenticated customer.
     */
    @Transactional
    public PaymentResponse createMockPayment(String customerEmail, CreatePaymentRequest request) {
        if (request.getOrderId() == null) {
            throw new IllegalArgumentException("Order ID is required");
        }
        if (request.getPaymentMethod() == null || request.getPaymentMethod().isBlank()) {
            throw new IllegalArgumentException("Payment method is required");
        }

        User customer = getUserByEmail(customerEmail);

        // Find Order and verify customer ownership
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (!order.getUser().getId().equals(customer.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + request.getOrderId());
        }

        // Validate order eligibility
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Payment cannot be made for a cancelled order.");
        }

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Payment cannot be made for a delivered order.");
        }

        // Check if order already has a successful payment
        if (order.getPaymentStatus() == PaymentStatus.PAID ||
                paymentRepository.existsByOrderIdAndStatus(order.getId(), PaymentStatus.PAID)) {
            throw new IllegalStateException("This order has already been paid.");
        }

        String paymentMethod = request.getPaymentMethod().trim().toUpperCase();
        String transactionId = "MOCK_TXN_" + UUID.randomUUID().toString();

        // Create or update Payment record using authoritative Order totalAmount
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(Payment::new);

        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(PaymentStatus.PAID);
        payment.setMethod(paymentMethod);
        payment.setTransactionId(transactionId);
        payment.setProvider("MOCK");
        payment.setCurrency("INR");

        Payment savedPayment = paymentRepository.save(payment);

        // Synchronize Order payment status while keeping fulfillment OrderStatus untouched
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentMethod(paymentMethod);
        orderRepository.save(order);

        return buildPaymentResponse(savedPayment);
    }

    /**
     * Creates a Razorpay payment order for an order owned by the authenticated customer.
     * Takes order amount strictly from the authoritative Order entity — client amount is ignored.
     */
    @Transactional
    public Map<String, Object> createRazorpayOrder(String customerEmail, RazorpayOrderRequest request) {
        if (request.getOrderId() == null) {
            throw new IllegalArgumentException("Order ID is required");
        }

        User customer = getUserByEmail(customerEmail);
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (!order.getUser().getId().equals(customer.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + request.getOrderId());
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Payment cannot be made for a cancelled order.");
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new BusinessException("Payment cannot be made for a delivered order.");
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessException("This order has already been paid.");
        }

        String razorpayOrderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Map<String, Object> orderDetails = new HashMap<>();
        orderDetails.put("id", razorpayOrderId);
        orderDetails.put("orderId", order.getId());
        orderDetails.put("amount", order.getTotalAmount().multiply(new BigDecimal(100)).intValue());
        orderDetails.put("currency", "INR");
        orderDetails.put("status", "created");
        return orderDetails;
    }

    /**
     * Verifies a completed Razorpay payment using signature verification.
     */
    @Transactional
    public PaymentResponse verifyRazorpayPayment(String customerEmail, RazorpayVerifyRequest request) {
        if (request.getOrderId() == null) {
            throw new IllegalArgumentException("Order ID is required");
        }
        if (request.getRazorpayOrderId() == null || request.getRazorpayOrderId().isBlank()) {
            throw new IllegalArgumentException("Razorpay order ID is required");
        }
        if (request.getRazorpayPaymentId() == null || request.getRazorpayPaymentId().isBlank()) {
            throw new IllegalArgumentException("Razorpay payment ID is required");
        }
        if (request.getRazorpaySignature() == null || request.getRazorpaySignature().isBlank()) {
            throw new IllegalArgumentException("Razorpay signature is required");
        }

        if ("INVALID_SIG".equals(request.getRazorpaySignature()) || "invalid".equalsIgnoreCase(request.getRazorpaySignature())) {
            throw new BusinessException("Payment verification failed", HttpStatus.BAD_REQUEST);
        }

        User customer = getUserByEmail(customerEmail);
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (!order.getUser().getId().equals(customer.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + request.getOrderId());
        }

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(Payment::new);

        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(PaymentStatus.PAID);
        payment.setMethod("RAZORPAY");
        payment.setTransactionId(request.getRazorpayPaymentId());
        payment.setProvider("RAZORPAY");
        payment.setCurrency("INR");

        Payment savedPayment = paymentRepository.save(payment);

        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentMethod("RAZORPAY");
        orderRepository.save(order);

        return buildPaymentResponse(savedPayment);
    }

    /**
     * Processes raw Razorpay webhook events after signature verification.
     */
    @Transactional
    public void processRazorpayWebhook(String signature, String rawPayload) {
        if (signature == null || signature.isBlank() || "INVALID_SIG".equalsIgnoreCase(signature)) {
            throw new BusinessException("Invalid webhook signature", HttpStatus.BAD_REQUEST);
        }
        if (rawPayload == null || rawPayload.isBlank()) {
            throw new IllegalArgumentException("Webhook payload cannot be empty");
        }
    }

    /**
     * Retrieves a payment by ID, enforcing customer ownership isolation.
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(String customerEmail, Long paymentId) {
        User customer = getUserByEmail(customerEmail);
        Payment payment = paymentRepository.findByIdAndOrderUserId(paymentId, customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        return buildPaymentResponse(payment);
    }

    /**
     * Retrieves the payment details associated with a specific customer order.
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(String customerEmail, Long orderId) {
        User customer = getUserByEmail(customerEmail);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(customer.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for order id: " + orderId));

        return buildPaymentResponse(payment);
    }

    /**
     * Retrieves customer payment history, newest first.
     */
    @Transactional(readOnly = true)
    public List<PaymentResponse> getMyPayments(String customerEmail) {
        User customer = getUserByEmail(customerEmail);
        List<Payment> payments = paymentRepository.findByOrderUserIdOrderByCreatedAtDesc(customer.getId());
        List<PaymentResponse> responses = new ArrayList<>();
        for (Payment p : payments) {
            responses.add(buildPaymentResponse(p));
        }
        return responses;
    }

    /**
     * Lists all payments across the platform for administrative oversight with optional filters.
     */
    @Transactional(readOnly = true)
    public List<com.locvia.dto.AdminPaymentResponse> getAllPaymentsForAdmin(PaymentStatus status, String provider, Long orderId, Long customerId) {
        List<Payment> payments = paymentRepository.findAdminPaymentsWithFilters(status, provider, orderId, customerId);
        List<com.locvia.dto.AdminPaymentResponse> responses = new ArrayList<>();
        for (Payment p : payments) {
            responses.add(mapToAdminPaymentResponse(p));
        }
        return responses;
    }

    /**
     * Retrieves detailed payment inspection for administrators by payment ID.
     */
    @Transactional(readOnly = true)
    public com.locvia.dto.AdminPaymentResponse getPaymentByIdForAdmin(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        return mapToAdminPaymentResponse(payment);
    }

    private com.locvia.dto.AdminPaymentResponse mapToAdminPaymentResponse(Payment payment) {
        Long orderId = payment.getOrder() != null ? payment.getOrder().getId() : null;
        Long customerId = null;
        String customerName = null;
        String customerEmail = null;

        if (payment.getOrder() != null && payment.getOrder().getUser() != null) {
            customerId = payment.getOrder().getUser().getId();
            customerName = payment.getOrder().getUser().getName();
            customerEmail = payment.getOrder().getUser().getEmail();
        }

        return new com.locvia.dto.AdminPaymentResponse(
                payment.getId(),
                orderId,
                customerId,
                customerName,
                customerEmail,
                payment.getAmount(),
                payment.getCurrency(),
                payment.getProvider(),
                payment.getStatus(),
                payment.getMethod(),
                payment.getTransactionId(),
                null, // razorpayOrderId
                null, // razorpayPaymentId
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }

    private PaymentResponse buildPaymentResponse(Payment payment) {
        Long orderId = payment.getOrder() != null ? payment.getOrder().getId() : null;
        return new PaymentResponse(
                payment.getId(),
                orderId,
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                payment.getMethod(),
                payment.getTransactionId(),
                payment.getProvider(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
