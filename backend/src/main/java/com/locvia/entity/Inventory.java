package com.locvia.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Inventory entity tracking product stock levels and low-stock thresholds.
 * Strictly maintains a one-to-one relationship with Product.
 */
@Entity
@Table(name = "inventories")
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold = 5;

    @Column(nullable = false)
    private Boolean available = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Inventory() {
    }

    public Inventory(Product product, Integer quantity, Integer lowStockThreshold) {
        this.product = product;
        this.quantity = quantity != null ? quantity : 0;
        this.lowStockThreshold = lowStockThreshold != null ? lowStockThreshold : 5;
        this.available = (this.quantity > 0);
    }

    public Inventory(Product product, Integer quantity, Boolean available) {
        this.product = product;
        this.quantity = quantity != null ? quantity : 0;
        this.available = available != null ? available : (this.quantity > 0);
        this.lowStockThreshold = 5;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.quantity == null) this.quantity = 0;
        if (this.lowStockThreshold == null) this.lowStockThreshold = 5;
        if (this.available == null) this.available = (this.quantity > 0);
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.quantity == null) this.quantity = 0;
        if (this.lowStockThreshold == null) this.lowStockThreshold = 5;
        this.available = (this.quantity > 0);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        this.available = (quantity != null && quantity > 0);
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
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
