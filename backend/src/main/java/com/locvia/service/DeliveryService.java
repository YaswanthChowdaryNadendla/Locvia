package com.locvia.service;

import com.locvia.dto.*;
import com.locvia.entity.*;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.DeliveryRepository;
import com.locvia.repository.OrderRepository;
import com.locvia.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service managing delivery assignments, partner dashboard feeds, controlled status transitions,
 * and atomic order status synchronization.
 */
@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public DeliveryService(DeliveryRepository deliveryRepository,
                           OrderRepository orderRepository,
                           UserRepository userRepository) {
        this.deliveryRepository = deliveryRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates and assigns a delivery record to an eligible order by an administrator.
     */
    @Transactional
    public DeliveryResponse createDelivery(CreateDeliveryRequest request) {
        if (request.getOrderId() == null || request.getDeliveryPartnerId() == null) {
            throw new IllegalArgumentException("Order ID and Delivery Partner ID are required");
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot assign delivery to a cancelled order.");
        }

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot assign delivery to a delivered order.");
        }

        if (deliveryRepository.existsByOrderIdAndStatusNot(order.getId(), DeliveryStatus.CANCELLED)) {
            throw new IllegalStateException("A delivery has already been assigned to this order.");
        }

        User partner = userRepository.findById(request.getDeliveryPartnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Delivery partner not found with id: " + request.getDeliveryPartnerId()));

        if (partner.getRole() != UserRole.DELIVERY_PARTNER) {
            throw new IllegalArgumentException("Selected user is not a delivery partner.");
        }

        if (!Boolean.TRUE.equals(partner.getActive())) {
            throw new IllegalArgumentException("Delivery partner account is deactivated.");
        }

        Delivery delivery = new Delivery();
        delivery.setOrder(order);
        delivery.setDeliveryPartner(partner);
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setAssignedAt(LocalDateTime.now());

        Delivery saved = deliveryRepository.save(delivery);

        // Update order fulfillment status to ready for pickup if pending or confirmed
        if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.CONFIRMED || order.getStatus() == OrderStatus.PREPARING) {
            order.setStatus(OrderStatus.READY_FOR_PICKUP);
            orderRepository.save(order);
        }

        return buildDeliveryResponse(saved);
    }

    /**
     * Retrieves deliveries currently available and assigned to the authenticated delivery partner.
     */
    @Transactional(readOnly = true)
    public List<DeliveryResponse> getPartnerRequests(String partnerEmail) {
        User partner = getUserByEmail(partnerEmail);
        List<Delivery> deliveries = deliveryRepository.findByDeliveryPartnerIdAndStatusOrderByAssignedAtDesc(partner.getId(), DeliveryStatus.ASSIGNED);
        return mapToDeliveryResponseList(deliveries);
    }

    /**
     * Retrieves active (non-completed and non-cancelled) deliveries for the authenticated delivery partner.
     */
    @Transactional(readOnly = true)
    public List<DeliveryResponse> getPartnerActiveDeliveries(String partnerEmail) {
        User partner = getUserByEmail(partnerEmail);
        List<DeliveryStatus> activeStatuses = List.of(DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.OUT_FOR_DELIVERY);
        List<Delivery> deliveries = deliveryRepository.findByDeliveryPartnerIdAndStatusInOrderByUpdatedAtDesc(partner.getId(), activeStatuses);
        return mapToDeliveryResponseList(deliveries);
    }

    /**
     * Retrieves completed deliveries for the authenticated delivery partner.
     */
    @Transactional(readOnly = true)
    public List<DeliveryResponse> getPartnerCompletedDeliveries(String partnerEmail) {
        User partner = getUserByEmail(partnerEmail);
        List<Delivery> deliveries = deliveryRepository.findByDeliveryPartnerIdAndStatusOrderByDeliveredAtDesc(partner.getId(), DeliveryStatus.DELIVERED);
        return mapToDeliveryResponseList(deliveries);
    }

    /**
     * Retrieves a delivery by ID, enforcing delivery partner ownership isolation unless called by an administrator.
     */
    @Transactional(readOnly = true)
    public DeliveryResponse getDeliveryById(String userEmail, Long deliveryId, boolean isAdmin) {
        User caller = getUserByEmail(userEmail);
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        if (!isAdmin) {
            if (delivery.getDeliveryPartner() == null || !delivery.getDeliveryPartner().getId().equals(caller.getId())) {
                throw new ResourceNotFoundException("Delivery not found with id: " + deliveryId);
            }
        }

        return buildDeliveryResponse(delivery);
    }

    /**
     * Updates delivery milestone status with strict state transition validation and Order status synchronization.
     */
    @Transactional
    public DeliveryResponse updateDeliveryStatus(String userEmail, Long deliveryId, DeliveryStatus newStatus, boolean isAdmin) {
        if (newStatus == null) {
            throw new IllegalArgumentException("Target delivery status is required");
        }

        User caller = getUserByEmail(userEmail);
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        if (!isAdmin) {
            if (delivery.getDeliveryPartner() == null || !delivery.getDeliveryPartner().getId().equals(caller.getId())) {
                throw new ResourceNotFoundException("Delivery not found with id: " + deliveryId);
            }
        }

        DeliveryStatus current = delivery.getStatus();
        if (current == newStatus) {
            return buildDeliveryResponse(delivery);
        }

        // Validate state transitions
        validateTransition(current, newStatus);

        delivery.setStatus(newStatus);

        // Update timestamps
        LocalDateTime now = LocalDateTime.now();
        if (newStatus == DeliveryStatus.ASSIGNED && delivery.getAssignedAt() == null) {
            delivery.setAssignedAt(now);
        } else if (newStatus == DeliveryStatus.PICKED_UP) {
            delivery.setPickedUpAt(now);
        } else if (newStatus == DeliveryStatus.DELIVERED) {
            delivery.setDeliveredAt(now);
        }

        // Synchronize Order status atomically
        Order order = delivery.getOrder();
        if (order != null) {
            if (newStatus == DeliveryStatus.OUT_FOR_DELIVERY) {
                order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
                orderRepository.save(order);
            } else if (newStatus == DeliveryStatus.DELIVERED) {
                order.setStatus(OrderStatus.DELIVERED);
                orderRepository.save(order);
            }
        }

        Delivery saved = deliveryRepository.save(delivery);
        return buildDeliveryResponse(saved);
    }

    /**
     * Retrieves delivery tracking details for an order owned by the authenticated customer.
     */
    @Transactional(readOnly = true)
    public CustomerDeliveryResponse getCustomerOrderDelivery(String customerEmail, Long orderId) {
        User customer = getUserByEmail(customerEmail);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(customer.getId())) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }

        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found for order id: " + orderId));

        String partnerName = (delivery.getDeliveryPartner() != null) ? delivery.getDeliveryPartner().getName() : "Assigned Partner";

        return new CustomerDeliveryResponse(
                delivery.getId(),
                order.getId(),
                delivery.getStatus(),
                delivery.getAssignedAt(),
                delivery.getPickedUpAt(),
                delivery.getDeliveredAt(),
                partnerName
        );
    }

    /**
     * Lists all platform deliveries for administrator oversight with optional filters.
     */
    @Transactional(readOnly = true)
    public List<DeliveryResponse> getAllDeliveriesAdmin(DeliveryStatus status, Long deliveryPartnerId, Long orderId) {
        List<Delivery> deliveries = deliveryRepository.findAdminDeliveriesWithFilters(status, deliveryPartnerId, orderId);
        return mapToDeliveryResponseList(deliveries);
    }

    /**
     * Lists all platform deliveries for administrator oversight.
     */
    @Transactional(readOnly = true)
    public List<DeliveryResponse> getAllDeliveriesAdmin() {
        return getAllDeliveriesAdmin(null, null, null);
    }

    private void validateTransition(DeliveryStatus current, DeliveryStatus target) {
        boolean valid = switch (current) {
            case PENDING -> target == DeliveryStatus.ASSIGNED || target == DeliveryStatus.CANCELLED;
            case ASSIGNED -> target == DeliveryStatus.PICKED_UP || target == DeliveryStatus.CANCELLED;
            case PICKED_UP -> target == DeliveryStatus.OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> target == DeliveryStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };

        if (!valid) {
            throw new IllegalStateException("Invalid delivery status transition from " + current + " to " + target + ".");
        }
    }

    private List<DeliveryResponse> mapToDeliveryResponseList(List<Delivery> deliveries) {
        List<DeliveryResponse> list = new ArrayList<>();
        for (Delivery d : deliveries) {
            list.add(buildDeliveryResponse(d));
        }
        return list;
    }

    private DeliveryResponse buildDeliveryResponse(Delivery delivery) {
        Order order = delivery.getOrder();
        Long orderId = order != null ? order.getId() : null;
        OrderStatus orderStatus = order != null ? order.getStatus() : null;
        java.math.BigDecimal totalAmount = order != null ? order.getTotalAmount() : null;

        OrderAddressResponse addressResponse = null;
        if (order != null) {
            addressResponse = new OrderAddressResponse(
                    order.getRecipientName(),
                    order.getPhoneNumber(),
                    order.getAddressLine1(),
                    order.getAddressLine2(),
                    order.getCity(),
                    order.getState(),
                    order.getPostalCode(),
                    order.getLandmark(),
                    order.getLatitude(),
                    order.getLongitude()
            );
        }

        User partner = delivery.getDeliveryPartner();
        Long partnerId = partner != null ? partner.getId() : null;
        String partnerName = partner != null ? partner.getName() : null;
        String partnerPhone = partner != null ? partner.getPhone() : null;

        return new DeliveryResponse(
                delivery.getId(),
                orderId,
                partnerId,
                partnerName,
                partnerPhone,
                delivery.getStatus(),
                delivery.getAssignedAt(),
                delivery.getPickedUpAt(),
                delivery.getDeliveredAt(),
                delivery.getNotes(),
                orderStatus,
                totalAmount,
                addressResponse,
                delivery.getCreatedAt(),
                delivery.getUpdatedAt()
        );
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
