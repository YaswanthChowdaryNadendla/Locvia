package com.locvia.service;

import com.locvia.dto.AdminCreateProductRequest;
import com.locvia.dto.CreateProductRequest;
import com.locvia.dto.ProductResponse;
import com.locvia.dto.UpdateProductRequest;
import com.locvia.entity.Category;
import com.locvia.entity.Inventory;
import com.locvia.entity.Product;
import com.locvia.entity.Shop;
import com.locvia.entity.ShopStatus;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.CategoryRepository;
import com.locvia.repository.InventoryRepository;
import com.locvia.repository.ProductRepository;
import com.locvia.repository.ShopRepository;
import com.locvia.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Core business service managing product operations:
 * public storefront filtering/search, shop-owner product CRUD,
 * strict shop-owner isolation, administrative catalog management,
 * and Cloudinary image upload/replacement.
 */
@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;
    private final CloudinaryService cloudinaryService;

    public ProductService(
            ProductRepository productRepository,
            ShopRepository shopRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            InventoryRepository inventoryRepository,
            CloudinaryService cloudinaryService) {
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.inventoryRepository = inventoryRepository;
        this.cloudinaryService = cloudinaryService;
    }

    // ==========================================
    // Public / Customer Catalog Methods
    // ==========================================

    /**
     * Lists active products for public storefront browsing with optional filters.
     *
     * @param shopId     optional shop filter
     * @param categoryId optional category filter
     * @param search     optional name search keyword
     * @return list of active ProductResponse
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getPublicProducts(Long shopId, Long categoryId, String search) {
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        List<Product> products = productRepository.findActiveProductsWithFilters(shopId, categoryId, trimmedSearch);
        return mapProductsWithStock(products);
    }

    /**
     * Retrieves an active product by ID for public view.
     * Inactive products return 404 to avoid exposing unlisted inventory.
     *
     * @param id product ID
     * @return ProductResponse
     */
    @Transactional(readOnly = true)
    public ProductResponse getPublicProductById(Long id) {
        Product product = productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (product.getShop() != null && (!Boolean.TRUE.equals(product.getShop().getActive())
                || product.getShop().getStatus() != ShopStatus.APPROVED)) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }

        return toProductResponseWithStock(product);
    }

    // ==========================================
    // Shop Owner Product Management Methods
    // ==========================================

    /**
     * Creates a new product for a specific shop.
     * Strictly verifies that the caller owns the target shop.
     *
     * @param shopId      target shop ID
     * @param request     product details
     * @param callerEmail authenticated user email
     * @return created ProductResponse
     */
    @Transactional
    public ProductResponse createProductForShop(Long shopId, CreateProductRequest request, String callerEmail) {
        User caller = findUserByEmail(callerEmail);

        if (caller.getRole() != UserRole.SHOP_OWNER && caller.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only registered shop owners or administrators can create products");
        }

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        if (!Boolean.TRUE.equals(shop.getActive())) {
            throw new IllegalArgumentException("Cannot add products to an inactive shop");
        }

        // Enforce ownership check for shop owners
        if (caller.getRole() != UserRole.ADMIN && !shop.getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to add products to another owner's shop");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));

        if (!Boolean.TRUE.equals(category.getActive())) {
            throw new IllegalArgumentException("Cannot associate product with an inactive category");
        }

        int initialStock = request.resolvedStock();

        Product product = new Product();
        product.setName(request.name().trim());
        if (request.description() != null) {
            product.setDescription(request.description().trim());
        }
        product.setPrice(request.price());
        product.setDiscountPrice(request.discountPrice());
        product.setUnit(request.unit().trim());
        if (request.imageUrl() != null) {
            product.setImageUrl(request.imageUrl().trim());
        }
        if (request.imagePublicId() != null) {
            product.setImagePublicId(request.imagePublicId().trim());
        }
        product.setShop(shop);
        product.setCategory(category);
        product.setActive(true);
        product.setStock(initialStock);

        Product saved = productRepository.save(product);

        Inventory inventory = inventoryRepository.findByProductId(saved.getId())
                .orElseGet(() -> new Inventory(saved, initialStock, 5));
        inventory.setQuantity(initialStock);
        inventory.setAvailable(initialStock > 0);
        inventoryRepository.save(inventory);

        return ProductResponse.fromEntity(saved, initialStock);
    }

    /**
     * Lists products belonging to a specific shop.
     * <p>
     * - Returns active products by default for both customer storefront and standard shop-owner catalog view.
     * - Owning shop owner and administrator can view inactive products if includeInactive is explicitly true.
     * - Requests for inactive or non-approved shops by non-owners return 404 Not Found.
     *
     * @param shopId          target shop ID
     * @param callerEmail     authenticated user email (optional)
     * @param includeInactive whether to include inactive/deactivated products (restricted to owner/admin)
     * @return list of ProductResponse
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsForShop(Long shopId, String callerEmail, boolean includeInactive) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        User caller = (callerEmail != null) ? userRepository.findByEmail(callerEmail).orElse(null) : null;
        boolean isOwnerOrAdmin = caller != null && (
                caller.getRole() == UserRole.ADMIN ||
                (caller.getRole() == UserRole.SHOP_OWNER && shop.getOwner() != null && shop.getOwner().getId().equals(caller.getId()))
        );

        if (!isOwnerOrAdmin) {
            // Customer or unauthenticated visitor view:
            // Shop must be approved and active
            if (!Boolean.TRUE.equals(shop.getActive()) || shop.getStatus() != ShopStatus.APPROVED) {
                throw new ResourceNotFoundException("Shop not found with id: " + shopId);
            }
        }

        List<Product> products = (isOwnerOrAdmin && includeInactive)
                ? productRepository.findByShopId(shopId)
                : productRepository.findByShopIdAndActiveTrue(shopId);

        return mapProductsWithStock(products);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsForShop(Long shopId, String callerEmail) {
        return getProductsForShop(shopId, callerEmail, false);
    }

    /**
     * Retrieves product details for management.
     * Enforces that the caller owns the product's shop or is an admin.
     *
     * @param id          product ID
     * @param callerEmail authenticated user email
     * @return ProductResponse
     */
    @Transactional(readOnly = true)
    public ProductResponse getProductForManagement(Long id, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (caller.getRole() != UserRole.ADMIN && !product.getShop().getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to manage this product");
        }

        return toProductResponseWithStock(product);
    }

    /**
     * Updates an existing product.
     * Enforces shop ownership. Cannot change the associated shop or owner.
     *
     * @param id          product ID
     * @param request     update payload
     * @param callerEmail authenticated user email
     * @return updated ProductResponse
     */
    @Transactional
    public ProductResponse updateProduct(Long id, UpdateProductRequest request, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (caller.getRole() != UserRole.ADMIN && !product.getShop().getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to modify this product");
        }

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));
            if (!Boolean.TRUE.equals(category.getActive())) {
                throw new IllegalArgumentException("Cannot associate product with an inactive category");
            }
            product.setCategory(category);
        }

        if (request.name() != null && !request.name().isBlank()) {
            product.setName(request.name().trim());
        }
        if (request.description() != null) {
            product.setDescription(request.description().trim());
        }
        if (request.price() != null) {
            product.setPrice(request.price());
        }
        if (request.discountPrice() != null) {
            product.setDiscountPrice(request.discountPrice());
        }
        if (request.unit() != null && !request.unit().isBlank()) {
            product.setUnit(request.unit().trim());
        }
        if (request.imageUrl() != null) {
            product.setImageUrl(request.imageUrl().trim());
        }
        if (request.imagePublicId() != null) {
            product.setImagePublicId(request.imagePublicId().trim());
        }
        if (request.active() != null) {
            product.setActive(request.active());
        }

        if (request.resolvedStock() != null) {
            int updatedStock = request.resolvedStock();
            product.setStock(updatedStock);
            Inventory inventory = inventoryRepository.findByProductId(product.getId())
                    .orElseGet(() -> new Inventory(product, updatedStock, 5));
            inventory.setQuantity(updatedStock);
            inventory.setAvailable(updatedStock > 0);
            inventoryRepository.save(inventory);
        }

        Product updated = productRepository.save(product);
        return toProductResponseWithStock(updated);
    }

    /**
     * Soft-deactivates a product (active = false).
     *
     * @param id          product ID
     * @param callerEmail authenticated user email
     */
    @Transactional
    public void deactivateProduct(Long id, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (caller.getRole() != UserRole.ADMIN && !product.getShop().getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to deactivate this product");
        }

        product.setActive(false);
        productRepository.save(product);

        inventoryRepository.findByProductId(product.getId()).ifPresent(inv -> {
            inv.setAvailable(false);
            inventoryRepository.save(inv);
        });
    }

    /**
     * Uploads an image for a product to Cloudinary, updates the product URL,
     * and safely removes the previous Cloudinary asset if present.
     *
     * @param id          product ID
     * @param file        multipart image file
     * @param callerEmail authenticated user email
     * @return updated ProductResponse
     */
    @Transactional
    public ProductResponse uploadProductImage(Long id, MultipartFile file, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (caller.getRole() != UserRole.ADMIN && !product.getShop().getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to upload images for this product");
        }

        // Upload new image to Cloudinary first
        CloudinaryService.CloudinaryUploadResult result = cloudinaryService.uploadProductImage(file);

        // Keep previous publicId for safe deferred cleanup
        String oldPublicId = product.getImagePublicId();

        // Update product entity with secure URL and publicId
        product.setImageUrl(result.secureUrl());
        product.setImagePublicId(result.publicId());

        Product saved = productRepository.save(product);

        // Safely clean up old asset if it existed
        if (oldPublicId != null && !oldPublicId.isBlank()) {
            cloudinaryService.deleteImage(oldPublicId);
        }

        return toProductResponseWithStock(saved);
    }

    /**
     * Standalone image upload to Cloudinary for new products or general media management.
     *
     * @param file multipart image file
     * @return CloudinaryUploadResult with secureUrl and publicId
     */
    public CloudinaryService.CloudinaryUploadResult uploadImage(MultipartFile file) {
        return cloudinaryService.uploadProductImage(file);
    }

    // ==========================================
    // Administrative Product Management Methods
    // ==========================================

    /**
     * Lists all products across all shops (active and inactive) for administrators.
     *
     * @param shopId     optional shop filter
     * @param categoryId optional category filter
     * @param search     optional name search keyword
     * @return list of ProductResponse
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProductsForAdmin(Long shopId, Long categoryId, String search) {
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        List<Product> products = productRepository.findAllProductsWithFilters(shopId, categoryId, trimmedSearch);
        return mapProductsWithStock(products);
    }

    /**
     * Retrieves any product by ID for administrators.
     *
     * @param id product ID
     * @return ProductResponse
     */
    @Transactional(readOnly = true)
    public ProductResponse getProductByIdForAdmin(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return toProductResponseWithStock(product);
    }

    /**
     * Creates a product across any shop for administrators.
     *
     * @param request admin product creation payload
     * @return created ProductResponse
     */
    @Transactional
    public ProductResponse createProductForAdmin(AdminCreateProductRequest request) {
        Shop shop = shopRepository.findById(request.shopId())
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + request.shopId()));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));

        int initialStock = request.resolvedStock();

        Product product = new Product();
        product.setName(request.name().trim());
        if (request.description() != null) {
            product.setDescription(request.description().trim());
        }
        product.setPrice(request.price());
        product.setDiscountPrice(request.discountPrice());
        product.setUnit(request.unit().trim());
        if (request.imageUrl() != null) {
            product.setImageUrl(request.imageUrl().trim());
        }
        if (request.imagePublicId() != null) {
            product.setImagePublicId(request.imagePublicId().trim());
        }
        product.setShop(shop);
        product.setCategory(category);
        product.setActive(true);
        product.setStock(initialStock);

        Product saved = productRepository.save(product);

        Inventory inventory = inventoryRepository.findByProductId(saved.getId())
                .orElseGet(() -> new Inventory(saved, initialStock, 5));
        inventory.setQuantity(initialStock);
        inventory.setAvailable(initialStock > 0);
        inventoryRepository.save(inventory);

        return ProductResponse.fromEntity(saved, initialStock);
    }

    /**
     * Updates any product across any shop for administrators.
     *
     * @param id      product ID
     * @param request update payload
     * @return updated ProductResponse
     */
    @Transactional
    public ProductResponse updateProductForAdmin(Long id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));
            product.setCategory(category);
        }

        if (request.name() != null && !request.name().isBlank()) {
            product.setName(request.name().trim());
        }
        if (request.description() != null) {
            product.setDescription(request.description().trim());
        }
        if (request.price() != null) {
            product.setPrice(request.price());
        }
        if (request.discountPrice() != null) {
            product.setDiscountPrice(request.discountPrice());
        }
        if (request.unit() != null && !request.unit().isBlank()) {
            product.setUnit(request.unit().trim());
        }
        if (request.imageUrl() != null) {
            product.setImageUrl(request.imageUrl().trim());
        }
        if (request.imagePublicId() != null) {
            product.setImagePublicId(request.imagePublicId().trim());
        }
        if (request.active() != null) {
            product.setActive(request.active());
        }

        if (request.resolvedStock() != null) {
            int updatedStock = request.resolvedStock();
            product.setStock(updatedStock);
            Inventory inventory = inventoryRepository.findByProductId(product.getId())
                    .orElseGet(() -> new Inventory(product, updatedStock, 5));
            inventory.setQuantity(updatedStock);
            inventory.setAvailable(updatedStock > 0);
            inventoryRepository.save(inventory);
        }

        Product updated = productRepository.save(product);
        return toProductResponseWithStock(updated);
    }

    /**
     * Soft-deactivates any product for administrators.
     *
     * @param id product ID
     */
    @Transactional
    public void deactivateProductForAdmin(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        product.setActive(false);
        productRepository.save(product);

        inventoryRepository.findByProductId(product.getId()).ifPresent(inv -> {
            inv.setAvailable(false);
            inventoryRepository.save(inv);
        });
    }

    // ==========================================
    // Internal Helper Methods
    // ==========================================

    private List<ProductResponse> mapProductsWithStock(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return List.of();
        }

        List<Long> productIds = products.stream().map(Product::getId).toList();
        Map<Long, Integer> stockMap = new HashMap<>();

        try {
            List<Object[]> rows = inventoryRepository.findStockByProductIds(productIds);
            if (rows != null) {
                for (Object[] row : rows) {
                    if (row != null && row.length >= 2 && row[0] instanceof Long pId && row[1] instanceof Integer qty) {
                        stockMap.put(pId, qty);
                    }
                }
            }
        } catch (Exception ignored) {
            // fallback to product entity stock
        }

        return products.stream()
                .map(p -> {
                    Integer invStock = stockMap.get(p.getId());
                    Integer effectiveStock = invStock != null ? invStock : (p.getStock() != null ? p.getStock() : 0);
                    return ProductResponse.fromEntity(p, effectiveStock);
                })
                .toList();
    }

    private ProductResponse toProductResponseWithStock(Product product) {
        if (product == null) {
            return null;
        }
        Integer invStock = inventoryRepository.findByProductId(product.getId())
                .map(Inventory::getQuantity)
                .orElse(product.getStock() != null ? product.getStock() : 0);
        return ProductResponse.fromEntity(product, invStock);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
