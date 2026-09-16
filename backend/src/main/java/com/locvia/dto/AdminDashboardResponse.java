package com.locvia.dto;

import java.math.BigDecimal;

/**
 * Summary metrics DTO returned by GET /api/admin/dashboard and GET /api/admin/metrics.
 */
public class AdminDashboardResponse {

    // User metrics
    private long totalUsers;
    private long totalCustomers;
    private long totalShopOwners;
    private long totalDeliveryPartners;
    private long totalAdmins;
    private long activeUsers;

    // Shop metrics
    private long totalShops;
    private long activeShops;

    // Product metrics
    private long totalProducts;
    private long activeProducts;

    // Order metrics
    private long totalOrders;
    private long pendingOrders;
    private long confirmedOrders;
    private long preparingOrders;
    private long readyForPickupOrders;
    private long outForDeliveryOrders;
    private long deliveredOrders;
    private long cancelledOrders;

    // Delivery metrics
    private long totalDeliveries;
    private long activeDeliveries;

    // Payment metrics
    private long totalPayments;
    private long successfulPayments;
    private long pendingPayments;
    private long failedPayments;

    // Financial metric
    private BigDecimal totalRevenue;

    public AdminDashboardResponse() {
    }

    public AdminDashboardResponse(long totalUsers, long totalCustomers, long totalShopOwners,
                                  long totalDeliveryPartners, long totalAdmins, long activeUsers,
                                  long totalShops, long activeShops,
                                  long totalProducts, long activeProducts,
                                  long totalOrders, long pendingOrders, long confirmedOrders,
                                  long preparingOrders, long readyForPickupOrders, long outForDeliveryOrders,
                                  long deliveredOrders, long cancelledOrders,
                                  long totalDeliveries, long activeDeliveries,
                                  long totalPayments, long successfulPayments, long pendingPayments,
                                  long failedPayments, BigDecimal totalRevenue) {
        this.totalUsers = totalUsers;
        this.totalCustomers = totalCustomers;
        this.totalShopOwners = totalShopOwners;
        this.totalDeliveryPartners = totalDeliveryPartners;
        this.totalAdmins = totalAdmins;
        this.activeUsers = activeUsers;
        this.totalShops = totalShops;
        this.activeShops = activeShops;
        this.totalProducts = totalProducts;
        this.activeProducts = activeProducts;
        this.totalOrders = totalOrders;
        this.pendingOrders = pendingOrders;
        this.confirmedOrders = confirmedOrders;
        this.preparingOrders = preparingOrders;
        this.readyForPickupOrders = readyForPickupOrders;
        this.outForDeliveryOrders = outForDeliveryOrders;
        this.deliveredOrders = deliveredOrders;
        this.cancelledOrders = cancelledOrders;
        this.totalDeliveries = totalDeliveries;
        this.activeDeliveries = activeDeliveries;
        this.totalPayments = totalPayments;
        this.successfulPayments = successfulPayments;
        this.pendingPayments = pendingPayments;
        this.failedPayments = failedPayments;
        this.totalRevenue = totalRevenue;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalShopOwners() {
        return totalShopOwners;
    }

    public void setTotalShopOwners(long totalShopOwners) {
        this.totalShopOwners = totalShopOwners;
    }

    public long getTotalDeliveryPartners() {
        return totalDeliveryPartners;
    }

    public void setTotalDeliveryPartners(long totalDeliveryPartners) {
        this.totalDeliveryPartners = totalDeliveryPartners;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }

    public void setTotalAdmins(long totalAdmins) {
        this.totalAdmins = totalAdmins;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getTotalShops() {
        return totalShops;
    }

    public void setTotalShops(long totalShops) {
        this.totalShops = totalShops;
    }

    public long getActiveShops() {
        return activeShops;
    }

    public void setActiveShops(long activeShops) {
        this.activeShops = activeShops;
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public long getActiveProducts() {
        return activeProducts;
    }

    public void setActiveProducts(long activeProducts) {
        this.activeProducts = activeProducts;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getConfirmedOrders() {
        return confirmedOrders;
    }

    public void setConfirmedOrders(long confirmedOrders) {
        this.confirmedOrders = confirmedOrders;
    }

    public long getPreparingOrders() {
        return preparingOrders;
    }

    public void setPreparingOrders(long preparingOrders) {
        this.preparingOrders = preparingOrders;
    }

    public long getReadyForPickupOrders() {
        return readyForPickupOrders;
    }

    public void setReadyForPickupOrders(long readyForPickupOrders) {
        this.readyForPickupOrders = readyForPickupOrders;
    }

    public long getOutForDeliveryOrders() {
        return outForDeliveryOrders;
    }

    public void setOutForDeliveryOrders(long outForDeliveryOrders) {
        this.outForDeliveryOrders = outForDeliveryOrders;
    }

    public long getDeliveredOrders() {
        return deliveredOrders;
    }

    public void setDeliveredOrders(long deliveredOrders) {
        this.deliveredOrders = deliveredOrders;
    }

    public long getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(long cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public long getTotalDeliveries() {
        return totalDeliveries;
    }

    public void setTotalDeliveries(long totalDeliveries) {
        this.totalDeliveries = totalDeliveries;
    }

    public long getActiveDeliveries() {
        return activeDeliveries;
    }

    public void setActiveDeliveries(long activeDeliveries) {
        this.activeDeliveries = activeDeliveries;
    }

    public long getTotalPayments() {
        return totalPayments;
    }

    public void setTotalPayments(long totalPayments) {
        this.totalPayments = totalPayments;
    }

    public long getSuccessfulPayments() {
        return successfulPayments;
    }

    public long getPaidPayments() {
        return successfulPayments;
    }

    public void setSuccessfulPayments(long successfulPayments) {
        this.successfulPayments = successfulPayments;
    }

    public long getPendingPayments() {
        return pendingPayments;
    }

    public void setPendingPayments(long pendingPayments) {
        this.pendingPayments = pendingPayments;
    }

    public long getFailedPayments() {
        return failedPayments;
    }

    public void setFailedPayments(long failedPayments) {
        this.failedPayments = failedPayments;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
