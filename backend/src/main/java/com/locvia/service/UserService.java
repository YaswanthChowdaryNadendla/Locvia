package com.locvia.service;

import com.locvia.dto.AdminUpdateUserRequest;
import com.locvia.dto.ChangePasswordRequest;
import com.locvia.dto.UpdateUserRequest;
import com.locvia.dto.UserResponse;
import com.locvia.entity.AccountStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.config.AdminAccountInitializer;
import com.locvia.entity.*;
import com.locvia.exception.EmailAlreadyExistsException;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing user profile retrieval, self-updates, ownership verification,
 * and administrator user management.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final NotificationRepository notificationRepository;
    private final ReviewRepository reviewRepository;
    private final DeliveryRepository deliveryRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final EmailVerificationOtpRepository emailVerificationOtpRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AddressRepository addressRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            NotificationRepository notificationRepository,
            ReviewRepository reviewRepository,
            DeliveryRepository deliveryRepository,
            ShopRepository shopRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            PaymentRepository paymentRepository,
            EmailVerificationOtpRepository emailVerificationOtpRepository,
            PasswordResetOtpRepository passwordResetOtpRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.addressRepository = addressRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.notificationRepository = notificationRepository;
        this.reviewRepository = reviewRepository;
        this.deliveryRepository = deliveryRepository;
        this.shopRepository = shopRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.emailVerificationOtpRepository = emailVerificationOtpRepository;
        this.passwordResetOtpRepository = passwordResetOtpRepository;
    }

    /**
     * Retrieves the current authenticated user's profile.
     *
     * @param email authenticated user's email
     * @return UserResponse
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = findUserByNormalizedEmail(email);
        return UserResponse.fromEntity(user);
    }

    /**
     * Updates the current authenticated user's profile (name, phone, optional email).
     * Strictly ignores any attempts to modify roles, password, or identifiers.
     *
     * @param email   authenticated user's email
     * @param request update payload
     * @return updated UserResponse
     */
    @Transactional
    public UserResponse updateCurrentUser(String email, UpdateUserRequest request) {
        User user = findUserByNormalizedEmail(email);

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmailAndIdNot(newEmail, user.getId())) {
                    throw new EmailAlreadyExistsException("Email is already registered: " + newEmail);
                }
                user.setEmail(newEmail);
            }
        }

        User updatedUser = userRepository.save(user);
        return UserResponse.fromEntity(updatedUser);
    }

    /**
     * Retrieves a user by ID with strict ownership protection.
     * Non-admin users can ONLY view their own profile.
     *
     * @param id             target user ID
     * @param requesterEmail authenticated requester's email
     * @return UserResponse
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id, String requesterEmail) {
        User requester = findUserByNormalizedEmail(requesterEmail);

        // Security check: non-admin users cannot access other users' profiles
        if (requester.getRole() != UserRole.ADMIN && !requester.getId().equals(id)) {
            throw new AccessDeniedException("Access denied: You are not authorized to view another user's profile");
        }

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        return UserResponse.fromEntity(targetUser);
    }

    /**
     * Lists all platform users for administrators with optional filtering.
     *
     * @param role   optional role filter
     * @param active optional active status filter
     * @param search optional keyword filter matching name, email, or phone
     * @return list of UserResponse
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsersForAdmin(UserRole role, Boolean active, String search) {
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> active == null || Boolean.valueOf(u.getActive()).equals(active))
                .filter(u -> trimmedSearch == null ||
                        (u.getName() != null && u.getName().toLowerCase().contains(trimmedSearch)) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(trimmedSearch)) ||
                        (u.getPhone() != null && u.getPhone().toLowerCase().contains(trimmedSearch)))
                .map(UserResponse::fromEntity)
                .toList();
    }

    /**
     * Lists all platform users for administrators.
     *
     * @return list of UserResponse
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsersForAdmin() {
        return getAllUsersForAdmin(null, null, null);
    }

    /**
     * Retrieves any user by ID for administrators.
     *
     * @param id target user ID
     * @return UserResponse
     */
    @Transactional(readOnly = true)
    public UserResponse getUserByIdForAdmin(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserResponse.fromEntity(user);
    }

    /**
     * Updates user details, platform role, and active status for administrators.
     * Enforces self-protection so an admin cannot demote or deactivate themselves.
     *
     * @param id         target user ID
     * @param request    admin update payload
     * @param adminEmail authenticated administrator's email
     * @return updated UserResponse
     */
    @Transactional
    public UserResponse updateUserForAdmin(Long id, AdminUpdateUserRequest request, String adminEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User admin = findUserByNormalizedEmail(adminEmail);

        // Admin self-protection: cannot demote or deactivate own account
        if (targetUser.getId().equals(admin.getId())) {
            if (request.getRole() != null && request.getRole() != UserRole.ADMIN) {
                throw new SecurityException("Administrators cannot demote their own administrative role");
            }
            if (request.getActive() != null && !request.getActive()) {
                throw new SecurityException("Administrators cannot deactivate their own administrative account");
            }
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            targetUser.setName(request.getName().trim());
        }

        if (request.getPhone() != null) {
            targetUser.setPhone(request.getPhone().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(targetUser.getEmail())) {
                if (userRepository.existsByEmailAndIdNot(newEmail, targetUser.getId())) {
                    throw new EmailAlreadyExistsException("Email is already registered: " + newEmail);
                }
                targetUser.setEmail(newEmail);
            }
        }

        if (request.getRole() != null) {
            targetUser.setRole(request.getRole());
        }

        if (request.getActive() != null) {
            targetUser.setActive(request.getActive());
        }

        User updated = userRepository.save(targetUser);
        return UserResponse.fromEntity(updated);
    }

    /**
     * Safely deactivates a user account without hard deleting relational records.
     * Enforces admin self-protection.
     *
     * @param id         target user ID
     * @param adminEmail authenticated administrator's email
     */
    @Transactional
    public void deactivateUserForAdmin(Long id, String adminEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User admin = findUserByNormalizedEmail(adminEmail);

        if (targetUser.getId().equals(admin.getId())) {
            throw new SecurityException("Administrators cannot deactivate their own administrative account");
        }

        targetUser.setActive(false);
        userRepository.save(targetUser);
    }

    /**
     * Physically deletes a user account from the database for an administrator.
     * Enforces default admin protection (admin@locvia.com cannot be deleted)
     * and admin self-protection (cannot delete own account).
     * Cleans up all related records in strict JPA dependency order.
     *
     * @param id         target user ID to delete
     * @param adminEmail authenticated administrator's email
     */
    @Transactional
    public void deleteUserForAdmin(Long id, String adminEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // 1. Protect all administrator accounts (including admin@locvia.com, self, and any other ADMIN)
        if (targetUser.getRole() == UserRole.ADMIN || AdminAccountInitializer.DEFAULT_ADMIN_EMAIL.equalsIgnoreCase(targetUser.getEmail())) {
            throw new SecurityException("Admin accounts cannot be deleted.");
        }

        // 2. Prevent admin self-deletion
        User admin = findUserByNormalizedEmail(adminEmail);
        if (targetUser.getId().equals(admin.getId())) {
            throw new SecurityException("Admin accounts cannot be deleted.");
        }

        // 3. Clean up ephemeral verification & password reset OTP records
        String email = targetUser.getEmail().toLowerCase();
        emailVerificationOtpRepository.deleteByEmail(email);
        passwordResetOtpRepository.deleteByEmail(email);

        // 4. Clean up notifications sent to this user
        notificationRepository.deleteByRecipientUserId(targetUser.getId());

        // 5. Clean up reviews authored by this user
        reviewRepository.deleteByUserId(targetUser.getId());

        // 6. Clean up customer Cart and CartItems
        cartRepository.findByUserId(targetUser.getId()).ifPresent(cart -> {
            cartItemRepository.deleteByCartId(cart.getId());
            cartRepository.delete(cart);
        });

        // 7. If target user was a Delivery Partner, unassign from deliveries to preserve order delivery logs
        List<Delivery> partnerDeliveries = deliveryRepository.findByDeliveryPartnerId(targetUser.getId());
        for (Delivery delivery : partnerDeliveries) {
            delivery.setDeliveryPartner(null);
            deliveryRepository.save(delivery);
        }

        // 8. If target user owned shops, clean up shop catalog safely
        List<Shop> ownedShops = shopRepository.findByOwnerId(targetUser.getId());
        for (Shop shop : ownedShops) {
            // Nullify shop reference in notifications
            List<Notification> shopNotifs = notificationRepository.findByShopId(shop.getId());
            for (Notification n : shopNotifs) {
                n.setShop(null);
                notificationRepository.save(n);
            }

            // Nullify shop reference in reviews
            List<Review> shopReviews = reviewRepository.findByShopId(shop.getId());
            for (Review r : shopReviews) {
                r.setShop(null);
                reviewRepository.save(r);
            }

            // Clean up products in this shop
            List<Product> products = productRepository.findByShopId(shop.getId());
            for (Product product : products) {
                // Nullify product reference in OrderItems to preserve historical purchase snapshots
                List<OrderItem> orderItems = orderItemRepository.findByProductId(product.getId());
                for (OrderItem item : orderItems) {
                    item.setProduct(null);
                    orderItemRepository.save(item);
                }

                // Delete any cart items referencing this product
                cartItemRepository.deleteByProductId(product.getId());

                // Nullify review references for this product
                List<Review> prodReviews = reviewRepository.findByProductId(product.getId());
                for (Review r : prodReviews) {
                    r.setProduct(null);
                    reviewRepository.save(r);
                }

                // Delete product inventory
                inventoryRepository.deleteByProductId(product.getId());

                // Delete product
                productRepository.delete(product);
            }

            // Delete the shop
            shopRepository.delete(shop);
        }

        // 9. If target user placed orders, delete them along with child items, payments, and deliveries
        List<Order> customerOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(targetUser.getId());
        for (Order order : customerOrders) {
            // Delete notifications linked to this order
            List<Notification> orderNotifs = notificationRepository.findByOrderId(order.getId());
            notificationRepository.deleteAll(orderNotifs);

            // Delete reviews linked to this order
            List<Review> orderReviews = reviewRepository.findByOrderId(order.getId());
            reviewRepository.deleteAll(orderReviews);

            // Delete delivery linked to this order
            deliveryRepository.findByOrderId(order.getId()).ifPresent(del -> {
                List<Notification> delNotifs = notificationRepository.findByDeliveryId(del.getId());
                notificationRepository.deleteAll(delNotifs);
                deliveryRepository.delete(del);
            });

            // Delete payment record linked to this order
            paymentRepository.findByOrderId(order.getId()).ifPresent(paymentRepository::delete);

            // Delete order items
            orderItemRepository.deleteByOrderId(order.getId());

            // Nullify address reference on order to avoid constraint issues
            order.setAddress(null);

            // Delete order
            orderRepository.delete(order);
        }

        // 10. Clean up customer's saved addresses
        addressRepository.deleteByUserId(targetUser.getId());

        // 11. Finally, physically delete the user account from the database
        userRepository.delete(targetUser);
    }

    /**
     * Approves a SHOP_OWNER or DELIVERY_PARTNER account, allowing it to perform
     * operational actions on the platform.
     * Prevents administrators from approving their own account unnecessarily.
     *
     * @param id         target user ID
     * @param adminEmail authenticated administrator's email
     * @return updated UserResponse with accountStatus = APPROVED
     */
    @Transactional
    public UserResponse approveUser(Long id, String adminEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User admin = findUserByNormalizedEmail(adminEmail);

        // Prevent admin from approving themselves (not meaningful but blocks the action)
        if (targetUser.getId().equals(admin.getId())) {
            throw new SecurityException("Administrators cannot approve their own account");
        }

        if (targetUser.getRole() == UserRole.CUSTOMER || targetUser.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Approval is only applicable to SHOP_OWNER and DELIVERY_PARTNER accounts");
        }

        targetUser.setAccountStatus(AccountStatus.APPROVED);
        User updated = userRepository.save(targetUser);
        return UserResponse.fromEntity(updated);
    }

    /**
     * Rejects a SHOP_OWNER or DELIVERY_PARTNER account.
     * The account remains blocked from operational APIs.
     *
     * @param id         target user ID
     * @param adminEmail authenticated administrator's email
     * @return updated UserResponse with accountStatus = REJECTED
     */
    @Transactional
    public UserResponse rejectUser(Long id, String adminEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User admin = findUserByNormalizedEmail(adminEmail);

        if (targetUser.getId().equals(admin.getId())) {
            throw new SecurityException("Administrators cannot reject their own account");
        }

        if (targetUser.getRole() == UserRole.CUSTOMER || targetUser.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Rejection is only applicable to SHOP_OWNER and DELIVERY_PARTNER accounts");
        }

        targetUser.setAccountStatus(AccountStatus.REJECTED);
        User updated = userRepository.save(targetUser);
        return UserResponse.fromEntity(updated);
    }

    /**
     * Changes password for the currently authenticated user.
     * Enforces current password verification via BCrypt, matches confirmation,
     * validates password policy (minimum 6 characters), BCrypt-encodes the new password,
     * and persists the update to the database.
     *
     * @param email   authenticated user's email from JWT principal
     * @param request change password payload
     */
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findUserByNormalizedEmail(email);

        if (request.currentPassword() == null || request.currentPassword().isBlank()) {
            throw new IllegalArgumentException("Current password is required");
        }

        if (request.newPassword() == null || request.newPassword().isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }

        if (request.confirmNewPassword() == null || request.confirmNewPassword().isBlank()) {
            throw new IllegalArgumentException("Confirm new password is required");
        }

        if (request.newPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        // Verify current password against stored BCrypt hash
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        // Verify new password and confirmation match
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new IllegalArgumentException("New passwords do not match.");
        }

        // BCrypt-encode new password before saving — plaintext never stored
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User findUserByNormalizedEmail(String email) {
        String normalized = email != null ? email.trim().toLowerCase() : "";
        return userRepository.findByEmail(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalized));
    }
}
