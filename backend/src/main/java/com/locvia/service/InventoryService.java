package com.locvia.service;

import com.locvia.dto.*;
import com.locvia.entity.Inventory;
import com.locvia.entity.Product;
import com.locvia.entity.Shop;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.exception.InventoryAlreadyExistsException;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.InventoryRepository;
import com.locvia.repository.ProductRepository;
import com.locvia.repository.ShopRepository;
import com.locvia.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing inventory stock, low-stock notifications,
 * out-of-stock querying, and strict shop ownership isolation.
 */
@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            ProductRepository productRepository,
            ShopRepository shopRepository,
            UserRepository userRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // Public Inventory Methods
    // ==========================================

    /**
     * Retrieves minimal stock information for public customer browsing.
     * Inactive products do not expose inventory publicly (returns 404).
     *
     * @param productId target product ID
     * @return PublicInventoryResponse with productId, quantity, and inStock status
     */
    @Transactional(readOnly = true)
    public PublicInventoryResponse getPublicInventory(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (!Boolean.TRUE.equals(product.getActive())) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product id: " + productId));

        return PublicInventoryResponse.fromEntity(inventory);
    }

    // ==========================================
    // Shop Owner Inventory Methods
    // ==========================================

    /**
     * Creates an inventory record for a product.
     * Strictly verifies that the authenticated user owns the product's shop.
     * Throws 409 Conflict if an inventory record already exists.
     *
     * @param productId   target product ID
     * @param request     creation details (quantity, lowStockThreshold)
     * @param callerEmail authenticated user's email
     * @return created InventoryResponse
     */
    @Transactional
    public InventoryResponse createInventory(Long productId, CreateInventoryRequest request, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        verifyShopOwnership(caller, product.getShop());

        if (inventoryRepository.existsByProductId(productId)) {
            throw new InventoryAlreadyExistsException("Inventory already exists for product id: " + productId);
        }

        Inventory inventory = new Inventory(product, request.quantity(), request.lowStockThreshold());
        Inventory saved = inventoryRepository.save(inventory);
        return InventoryResponse.fromEntity(saved);
    }

    /**
     * Retrieves complete inventory management details for a product.
     * Enforces that the caller owns the product's shop (or is an admin).
     *
     * @param productId   target product ID
     * @param callerEmail authenticated user's email
     * @return InventoryResponse
     */
    @Transactional(readOnly = true)
    public InventoryResponse getInventoryForManagement(Long productId, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        verifyShopOwnership(caller, product.getShop());

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product id: " + productId));

        return InventoryResponse.fromEntity(inventory);
    }

    /**
     * Updates inventory quantity and low-stock threshold for a product.
     * Enforces shop ownership.
     *
     * @param productId   target product ID
     * @param request     update details
     * @param callerEmail authenticated user's email
     * @return updated InventoryResponse
     */
    @Transactional
    public InventoryResponse updateInventory(Long productId, UpdateInventoryRequest request, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        verifyShopOwnership(caller, product.getShop());

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product id: " + productId));

        inventory.setQuantity(request.quantity());
        inventory.setLowStockThreshold(request.lowStockThreshold());
        inventory.setAvailable(request.quantity() > 0);

        Inventory updated = inventoryRepository.save(inventory);
        return InventoryResponse.fromEntity(updated);
    }

    /**
     * Updates inventory quantity only (quick stock adjustment via PATCH).
     * Enforces shop ownership.
     *
     * @param productId   target product ID
     * @param request     quantity update request
     * @param callerEmail authenticated user's email
     * @return updated InventoryResponse
     */
    @Transactional
    public InventoryResponse updateQuantity(Long productId, UpdateInventoryQuantityRequest request, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        verifyShopOwnership(caller, product.getShop());

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product id: " + productId));

        inventory.setQuantity(request.quantity());
        inventory.setAvailable(request.quantity() > 0);

        Inventory updated = inventoryRepository.save(inventory);
        return InventoryResponse.fromEntity(updated);
    }

    /**
     * Retrieves all inventory records for products belonging to a specific shop.
     * Enforces shop ownership.
     *
     * @param shopId      target shop ID
     * @param callerEmail authenticated user's email
     * @return list of InventoryResponse
     */
    @Transactional(readOnly = true)
    public List<InventoryResponse> getShopInventory(Long shopId, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        verifyShopOwnership(caller, shop);

        return inventoryRepository.findByProductShopId(shopId).stream()
                .map(InventoryResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves low-stock inventory records (quantity <= lowStockThreshold) for a shop.
     * Enforces shop ownership.
     *
     * @param shopId      target shop ID
     * @param callerEmail authenticated user's email
     * @return list of low-stock InventoryResponse
     */
    @Transactional(readOnly = true)
    public List<InventoryResponse> getShopLowStock(Long shopId, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        verifyShopOwnership(caller, shop);

        return inventoryRepository.findLowStockByShopId(shopId).stream()
                .map(InventoryResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves out-of-stock inventory records (quantity == 0) for a shop.
     * Enforces shop ownership.
     *
     * @param shopId      target shop ID
     * @param callerEmail authenticated user's email
     * @return list of out-of-stock InventoryResponse
     */
    @Transactional(readOnly = true)
    public List<InventoryResponse> getShopOutOfStock(Long shopId, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        verifyShopOwnership(caller, shop);

        return inventoryRepository.findByProductShopIdAndQuantity(shopId, 0).stream()
                .map(InventoryResponse::fromEntity)
                .toList();
    }

    // ==========================================
    // Administrator Inventory Methods
    // ==========================================

    /**
     * Lists inventory across all shops with an optional shopId filter for administrators.
     *
     * @param shopId optional shop ID filter
     * @return list of InventoryResponse
     */
    @Transactional(readOnly = true)
    public List<InventoryResponse> getAllInventoryForAdmin(Long shopId) {
        return inventoryRepository.findAllWithFilters(shopId).stream()
                .map(InventoryResponse::fromEntity)
                .toList();
    }

    /**
     * Lists all low-stock inventory records across all shops for administrators.
     *
     * @return list of all low-stock InventoryResponse
     */
    @Transactional(readOnly = true)
    public List<InventoryResponse> getAdminLowStock() {
        return inventoryRepository.findAllLowStock().stream()
                .map(InventoryResponse::fromEntity)
                .toList();
    }

    /**
     * Lists all out-of-stock inventory records across all shops for administrators.
     *
     * @return list of all out-of-stock InventoryResponse
     */
    @Transactional(readOnly = true)
    public List<InventoryResponse> getAdminOutOfStock() {
        return inventoryRepository.findByQuantity(0).stream()
                .map(InventoryResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves inventory for any product by productId for administrators.
     *
     * @param productId target product ID
     * @return InventoryResponse
     */
    @Transactional(readOnly = true)
    public InventoryResponse getInventoryByProductIdForAdmin(Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product id: " + productId));
        return InventoryResponse.fromEntity(inventory);
    }

    /**
     * Creates inventory for any product for administrators.
     *
     * @param productId target product ID
     * @param request   creation details
     * @return created InventoryResponse
     */
    @Transactional
    public InventoryResponse createInventoryForAdmin(Long productId, CreateInventoryRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (inventoryRepository.existsByProductId(productId)) {
            throw new InventoryAlreadyExistsException("Inventory already exists for product id: " + productId);
        }

        Inventory inventory = new Inventory(product, request.quantity(), request.lowStockThreshold());
        Inventory saved = inventoryRepository.save(inventory);
        return InventoryResponse.fromEntity(saved);
    }

    /**
     * Updates inventory for any product for administrators.
     *
     * @param productId target product ID
     * @param request   update details
     * @return updated InventoryResponse
     */
    @Transactional
    public InventoryResponse updateInventoryForAdmin(Long productId, UpdateInventoryRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product id: " + productId));

        inventory.setQuantity(request.quantity());
        inventory.setLowStockThreshold(request.lowStockThreshold());
        inventory.setAvailable(request.quantity() > 0);

        Inventory updated = inventoryRepository.save(inventory);
        return InventoryResponse.fromEntity(updated);
    }

    /**
     * Updates inventory quantity for any product for administrators.
     *
     * @param productId target product ID
     * @param request   quantity update request
     * @return updated InventoryResponse
     */
    @Transactional
    public InventoryResponse updateQuantityForAdmin(Long productId, UpdateInventoryQuantityRequest request) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found for product id: " + productId));

        inventory.setQuantity(request.quantity());
        inventory.setAvailable(request.quantity() > 0);

        Inventory updated = inventoryRepository.save(inventory);
        return InventoryResponse.fromEntity(updated);
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private void verifyShopOwnership(User caller, Shop shop) {
        if (caller.getRole() != UserRole.ADMIN && !shop.getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to manage inventory for this store");
        }
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
