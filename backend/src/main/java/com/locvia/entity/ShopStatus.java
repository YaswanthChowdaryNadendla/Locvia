package com.locvia.entity;

/**
 * Lifecycle and approval status for merchant shops registered on Locvia.
 * <p>
 * Newly registered shops start as PENDING and require explicit Administrator
 * review and approval before becoming APPROVED / active for customer discovery.
 */
public enum ShopStatus {

    /**
     * Shop is awaiting Administrator review. Inactive on public storefront.
     */
    PENDING,

    /**
     * Shop has been reviewed and approved by an Administrator.
     * Accessible on public storefront when active is true.
     */
    APPROVED,

    /**
     * Shop was rejected by an Administrator.
     */
    REJECTED
}
