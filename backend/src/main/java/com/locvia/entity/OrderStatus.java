package com.locvia.entity;

/**
 * Enumeration of order fulfillment lifecycle statuses.
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    READY_FOR_PICKUP,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}
