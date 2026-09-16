package com.locvia.dto;

import com.locvia.entity.OrderStatus;
import com.locvia.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed order DTO for platform administration, displaying customer info,
 * line items snapshot, address snapshot, and current fulfillment status.
 */
public class AdminOrderResponse {

    private Long id;
    private CustomerSummary customer;
    private List<OrderItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal totalAmount;
    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private OrderAddressResponse address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AdminOrderResponse() {
    }

    public AdminOrderResponse(Long id, CustomerSummary customer, List<OrderItemResponse> items,
                              BigDecimal subtotal, BigDecimal totalAmount,
                              OrderStatus orderStatus, PaymentStatus paymentStatus,
                              String paymentMethod, OrderAddressResponse address,
                              LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.customer = customer;
        this.items = items;
        this.subtotal = subtotal;
        this.totalAmount = totalAmount;
        this.orderStatus = orderStatus;
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod;
        this.address = address;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CustomerSummary getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerSummary customer) {
        this.customer = customer;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public OrderStatus getStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public OrderAddressResponse getAddress() {
        return address;
    }

    public void setAddress(OrderAddressResponse address) {
        this.address = address;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    /**
     * Inner customer summary DTO.
     */
    public static class CustomerSummary {
        private Long id;
        private String name;
        private String email;
        private String phone;

        public CustomerSummary() {
        }

        public CustomerSummary(Long id, String name, String email, String phone) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.phone = phone;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }
}
