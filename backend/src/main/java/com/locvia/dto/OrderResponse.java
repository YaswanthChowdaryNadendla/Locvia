package com.locvia.dto;

import com.locvia.entity.OrderStatus;
import com.locvia.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Detailed DTO for customer orders including immutable item and address snapshots.
 */
public class OrderResponse {

    private Long id;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private BigDecimal subtotal;
    private BigDecimal totalAmount;
    private Integer itemCount;
    private List<OrderItemResponse> items = new ArrayList<>();
    private OrderAddressResponse deliveryAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public OrderResponse() {
    }

    public OrderResponse(Long id, OrderStatus status, PaymentStatus paymentStatus, String paymentMethod,
                         BigDecimal subtotal, BigDecimal totalAmount, Integer itemCount,
                         List<OrderItemResponse> items, OrderAddressResponse deliveryAddress,
                         LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod;
        this.subtotal = subtotal;
        this.totalAmount = totalAmount;
        this.itemCount = itemCount;
        this.items = items != null ? items : new ArrayList<>();
        this.deliveryAddress = deliveryAddress;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
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

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }

    public OrderAddressResponse getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(OrderAddressResponse deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
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
}
