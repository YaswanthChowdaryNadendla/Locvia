package com.locvia.service;

import com.locvia.dto.AdminUpdateShopRequest;
import com.locvia.dto.CreateShopRequest;
import com.locvia.dto.ShopResponse;
import com.locvia.dto.UpdateShopRequest;
import com.locvia.entity.*;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing shop operations: public discovery, shop-owner store creation
 * and updates, ownership verification, and administrative management.
 */
@Service
public class ShopService {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final NotificationRepository notificationRepository;
    private final ReviewRepository reviewRepository;

    public ShopService(ShopRepository shopRepository,
                       UserRepository userRepository,
                       ProductRepository productRepository,
                       InventoryRepository inventoryRepository,
                       OrderItemRepository orderItemRepository,
                       NotificationRepository notificationRepository,
                       ReviewRepository reviewRepository) {
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.notificationRepository = notificationRepository;
        this.reviewRepository = reviewRepository;
    }

    /**
     * Lists all active shops for public/customer discovery.
     *
     * @return list of active shops
     */
    @Transactional(readOnly = true)
    public List<ShopResponse> getAllActiveShops() {
        return shopRepository.findByActiveTrue().stream()
                .map(ShopResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves an active shop by ID for public/customer view.
     * Inactive shops return 404 Not Found to prevent leaking unlisted stores.
     *
     * @param id target shop ID
     * @return ShopResponse
     */
    @Transactional(readOnly = true)
    public ShopResponse getActiveShopById(Long id) {
        return shopRepository.findByIdAndActiveTrue(id)
                .map(ShopResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));
    }

    /**
     * Registers a new shop for the authenticated shop owner.
     * The owner is determined exclusively from the JWT principal, ignoring any caller-supplied owner IDs.
     *
     * @param request    shop creation details
     * @param ownerEmail authenticated owner's email
     * @return created ShopResponse
     */
    @Transactional
    public ShopResponse createShop(CreateShopRequest request, String ownerEmail) {
        User owner = findUserByEmail(ownerEmail);

        if (owner.getRole() != UserRole.SHOP_OWNER) {
            throw new AccessDeniedException("Only registered shop owners can create shops");
        }

        // Approval enforcement: SHOP_OWNER must be APPROVED by Admin before operating
        if (owner.getRole() == UserRole.SHOP_OWNER
                && owner.getAccountStatus() != AccountStatus.APPROVED) {
            throw new AccessDeniedException(
                    "Your account is pending admin approval. You cannot create a shop until approved.");
        }

        Shop shop = new Shop();
        shop.setName(request.getName());
        shop.setDescription(request.getDescription());
        shop.setAddress(request.getAddress());
        shop.setPhone(request.getPhone());
        shop.setEmail(request.getEmail());
        shop.setImageUrl(request.getImageUrl());
        shop.setLatitude(request.getLatitude());
        shop.setLongitude(request.getLongitude());
        shop.setActive(false);
        shop.setStatus(ShopStatus.PENDING);
        shop.setRating(0.0);
        shop.setOwner(owner);

        Shop saved = shopRepository.save(shop);
        return ShopResponse.fromEntity(saved);
    }

    /**
     * Lists all shops owned by the authenticated shop owner.
     * Supports multi-shop ownership.
     *
     * @param ownerEmail authenticated owner's email
     * @return list of caller's shops
     */
    @Transactional(readOnly = true)
    public List<ShopResponse> getShopsByOwner(String ownerEmail) {
        User owner = findUserByEmail(ownerEmail);
        return shopRepository.findByOwnerId(owner.getId()).stream()
                .map(ShopResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves a specific shop owned by the authenticated owner.
     * Enforces strict ownership check to prevent IDOR vulnerabilities.
     *
     * @param shopId     target shop ID
     * @param ownerEmail authenticated owner's email
     * @return ShopResponse
     */
    @Transactional(readOnly = true)
    public ShopResponse getOwnerShopById(Long shopId, String ownerEmail) {
        User owner = findUserByEmail(ownerEmail);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        if (!shop.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to view another owner's shop");
        }

        return ShopResponse.fromEntity(shop);
    }

    /**
     * Updates an existing shop belonging to the authenticated owner.
     * Strictly verifies ownership and prevents modifying identifiers, owner, rating, or active status.
     *
     * @param shopId     target shop ID
     * @param request    shop update details
     * @param ownerEmail authenticated owner's email
     * @return updated ShopResponse
     */
    @Transactional
    public ShopResponse updateOwnerShop(Long shopId, UpdateShopRequest request, String ownerEmail) {
        User owner = findUserByEmail(ownerEmail);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        if (!shop.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to modify another owner's shop");
        }

        // Approval enforcement: SHOP_OWNER must be APPROVED by Admin before operating
        if (owner.getRole() == UserRole.SHOP_OWNER
                && owner.getAccountStatus() != AccountStatus.APPROVED) {
            throw new AccessDeniedException(
                    "Your account is pending admin approval. You cannot update shop details until approved.");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            shop.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            shop.setDescription(request.getDescription().trim());
        }
        if (request.getAddress() != null && !request.getAddress().isBlank()) {
            shop.setAddress(request.getAddress().trim());
        }
        if (request.getPhone() != null) {
            shop.setPhone(request.getPhone().trim());
        }
        if (request.getEmail() != null) {
            shop.setEmail(request.getEmail().trim().toLowerCase());
        }
        if (request.getImageUrl() != null) {
            shop.setImageUrl(request.getImageUrl().trim());
        }
        if (request.getLatitude() != null) {
            shop.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            shop.setLongitude(request.getLongitude());
        }

        Shop updated = shopRepository.save(shop);
        return ShopResponse.fromEntity(updated);
    }

    /**
     * Lists all shops across the platform for administrators (both active and inactive).
     *
     * @return list of all shops
     */
    @Transactional(readOnly = true)
    public List<ShopResponse> getAllShopsForAdmin() {
        return getAllShopsForAdmin(null, null, null);
    }

    /**
     * Lists all shops across the platform for administrators with optional filtering.
     *
     * @param active  optional active status filter
     * @param ownerId optional owner ID filter
     * @param search  optional search query matching shop name, address, or description
     * @return filtered list of shops
     */
    @Transactional(readOnly = true)
    public List<ShopResponse> getAllShopsForAdmin(Boolean active, Long ownerId, String search) {
        return shopRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(shop -> active == null || shop.getActive().equals(active))
                .filter(shop -> ownerId == null || (shop.getOwner() != null && shop.getOwner().getId().equals(ownerId)))
                .filter(shop -> {
                    if (search == null || search.isBlank()) {
                        return true;
                    }
                    String term = search.trim().toLowerCase();
                    boolean nameMatch = shop.getName() != null && shop.getName().toLowerCase().contains(term);
                    boolean addressMatch = shop.getAddress() != null && shop.getAddress().toLowerCase().contains(term);
                    boolean descMatch = shop.getDescription() != null && shop.getDescription().toLowerCase().contains(term);
                    return nameMatch || addressMatch || descMatch;
                })
                .map(ShopResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves any shop by ID for administrators.
     *
     * @param id target shop ID
     * @return ShopResponse
     */
    @Transactional(readOnly = true)
    public ShopResponse getShopByIdForAdmin(Long id) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));
        return ShopResponse.fromEntity(shop);
    }

    /**
     * Updates shop information, active status, and rating for administrators.
     *
     * @param id      target shop ID
     * @param request administrative update details
     * @return updated ShopResponse
     */
    @Transactional
    public ShopResponse updateShopForAdmin(Long id, AdminUpdateShopRequest request) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            shop.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            shop.setDescription(request.getDescription().trim());
        }
        if (request.getAddress() != null && !request.getAddress().isBlank()) {
            shop.setAddress(request.getAddress().trim());
        }
        if (request.getPhone() != null) {
            shop.setPhone(request.getPhone().trim());
        }
        if (request.getEmail() != null) {
            shop.setEmail(request.getEmail().trim().toLowerCase());
        }
        if (request.getImageUrl() != null) {
            shop.setImageUrl(request.getImageUrl().trim());
        }
        if (request.getLatitude() != null) {
            shop.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            shop.setLongitude(request.getLongitude());
        }
        if (request.getRating() != null) {
            shop.setRating(request.getRating());
        }
        if (request.getActive() != null) {
            shop.setActive(request.getActive());
        }

        Shop updated = shopRepository.save(shop);
        return ShopResponse.fromEntity(updated);
    }

    /**
     * Approves a registered shop for administrators.
     * Sets status to APPROVED and active to true.
     *
     * @param id target shop ID
     * @return updated ShopResponse
     */
    @Transactional
    public ShopResponse approveShopForAdmin(Long id) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));
        shop.setStatus(ShopStatus.APPROVED);
        shop.setActive(true);
        Shop updated = shopRepository.save(shop);
        return ShopResponse.fromEntity(updated);
    }

    /**
     * Permanently removes a registered shop and cleans up relational records
     * so that the shop is completely removed and the owner can register again.
     *
     * @param id target shop ID
     */
    @Transactional
    public void deleteShopForAdmin(Long id) {
        Shop shop = shopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));

        // 1. Delete notifications for this shop
        List<Notification> notifications = notificationRepository.findByShopId(shop.getId());
        if (!notifications.isEmpty()) {
            notificationRepository.deleteAll(notifications);
        }

        // 2. Delete reviews for this shop
        List<Review> reviews = reviewRepository.findByShopId(shop.getId());
        if (!reviews.isEmpty()) {
            reviewRepository.deleteAll(reviews);
        }

        // 3. Clean up products belonging to this shop
        List<Product> products = productRepository.findByShopId(shop.getId());
        for (Product product : products) {
            // Nullify product references in historical order items
            List<OrderItem> orderItems = orderItemRepository.findByProductId(product.getId());
            for (OrderItem item : orderItems) {
                item.setProduct(null);
                orderItemRepository.save(item);
            }
            // Delete reviews for this product
            List<Review> prodReviews = reviewRepository.findByProductId(product.getId());
            if (!prodReviews.isEmpty()) {
                reviewRepository.deleteAll(prodReviews);
            }
            // Delete inventory for this product
            inventoryRepository.findByProductId(product.getId())
                    .ifPresent(inventoryRepository::delete);
            // Delete product
            productRepository.delete(product);
        }

        // 4. Finally, remove the shop
        shopRepository.delete(shop);
    }

    /**
     * Backward-compatible alias for deleteShopForAdmin.
     *
     * @param id target shop ID
     */
    @Transactional
    public void deactivateShopForAdmin(Long id) {
        deleteShopForAdmin(id);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
