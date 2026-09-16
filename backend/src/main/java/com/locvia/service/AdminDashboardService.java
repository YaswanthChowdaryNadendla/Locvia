package com.locvia.service;

import com.locvia.dto.AdminDashboardResponse;
import com.locvia.entity.DeliveryStatus;
import com.locvia.entity.OrderStatus;
import com.locvia.entity.PaymentStatus;
import com.locvia.entity.UserRole;
import com.locvia.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service aggregating platform-wide performance metrics, user breakdowns,
 * inventory/catalog totals, and financial figures for the administrative dashboard.
 */
@Service
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final PaymentRepository paymentRepository;

    public AdminDashboardService(UserRepository userRepository,
                                 ShopRepository shopRepository,
                                 ProductRepository productRepository,
                                 OrderRepository orderRepository,
                                 DeliveryRepository deliveryRepository,
                                 PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.deliveryRepository = deliveryRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * Computes the complete administrative platform dashboard summary.
     */
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardSummary() {
        // 1. User metrics
        long totalUsers = userRepository.count();
        long totalCustomers = userRepository.countByRole(UserRole.CUSTOMER);
        long totalShopOwners = userRepository.countByRole(UserRole.SHOP_OWNER);
        long totalDeliveryPartners = userRepository.countByRole(UserRole.DELIVERY_PARTNER);
        long totalAdmins = userRepository.countByRole(UserRole.ADMIN);
        long activeUsers = userRepository.countByActiveTrue();

        // 2. Shop metrics
        long totalShops = shopRepository.count();
        long activeShops = shopRepository.countByActiveTrue();

        // 3. Product metrics
        long totalProducts = productRepository.count();
        long activeProducts = productRepository.countByActiveTrue();

        // 4. Order metrics
        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long confirmedOrders = orderRepository.countByStatus(OrderStatus.CONFIRMED);
        long preparingOrders = orderRepository.countByStatus(OrderStatus.PREPARING);
        long readyForPickupOrders = orderRepository.countByStatus(OrderStatus.READY_FOR_PICKUP);
        long outForDeliveryOrders = orderRepository.countByStatus(OrderStatus.OUT_FOR_DELIVERY);
        long deliveredOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);

        // 5. Delivery metrics
        long totalDeliveries = deliveryRepository.count();
        long activeDeliveries = deliveryRepository.countByStatusIn(List.of(
                DeliveryStatus.ASSIGNED,
                DeliveryStatus.PICKED_UP,
                DeliveryStatus.OUT_FOR_DELIVERY
        ));

        // 6. Payment metrics & Authoritative Revenue
        long totalPayments = paymentRepository.count();
        long successfulPayments = paymentRepository.countByStatus(PaymentStatus.PAID);
        long pendingPayments = paymentRepository.countByStatus(PaymentStatus.PENDING);
        long failedPayments = paymentRepository.countByStatus(PaymentStatus.FAILED);
        BigDecimal totalRevenue = paymentRepository.sumTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        return new AdminDashboardResponse(
                totalUsers, totalCustomers, totalShopOwners, totalDeliveryPartners, totalAdmins, activeUsers,
                totalShops, activeShops,
                totalProducts, activeProducts,
                totalOrders, pendingOrders, confirmedOrders, preparingOrders, readyForPickupOrders,
                outForDeliveryOrders, deliveredOrders, cancelledOrders,
                totalDeliveries, activeDeliveries,
                totalPayments, successfulPayments, pendingPayments, failedPayments,
                totalRevenue
        );
    }

    /**
     * Alias for getDashboardSummary() providing platform metrics.
     */
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardMetrics() {
        return getDashboardSummary();
    }
}
