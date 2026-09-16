package com.locvia.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for the customer's active shopping cart session.
 */
public class CartResponse {

    private Long id;
    private List<CartItemResponse> items = new ArrayList<>();
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal total = BigDecimal.ZERO;
    private Integer itemCount = 0;

    public CartResponse() {
    }

    public CartResponse(Long id, List<CartItemResponse> items, BigDecimal subtotal, BigDecimal total, Integer itemCount) {
        this.id = id;
        this.items = items != null ? items : new ArrayList<>();
        this.subtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
        this.total = total != null ? total : BigDecimal.ZERO;
        this.itemCount = itemCount != null ? itemCount : 0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<CartItemResponse> getItems() {
        return items;
    }

    public void setItems(List<CartItemResponse> items) {
        this.items = items;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }
}
