package com.locvia.entity;

/**
 * Approval status for platform user accounts.
 * <p>
 * CUSTOMER accounts are automatically APPROVED upon registration.
 * SHOP_OWNER and DELIVERY_PARTNER accounts start as PENDING and require
 * explicit Admin approval before they can perform operational actions.
 */
public enum AccountStatus {

    /**
     * Account is awaiting Admin review. Operational APIs are blocked.
     * Applies to: SHOP_OWNER, DELIVERY_PARTNER after registration.
     */
    PENDING,

    /**
     * Account has been reviewed and approved by an Administrator.
     * All role-permitted operations are accessible.
     */
    APPROVED,

    /**
     * Account was reviewed and rejected by an Administrator.
     * Operational APIs remain blocked.
     */
    REJECTED
}
