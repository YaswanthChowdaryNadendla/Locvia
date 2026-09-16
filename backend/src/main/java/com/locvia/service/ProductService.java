package com.locvia.service;

import com.locvia.dto.AdminCreateProductRequest;
import com.locvia.dto.CreateProductRequest;
import com.locvia.dto.ProductResponse;
import com.locvia.dto.UpdateProductRequest;
import com.locvia.entity.Category;
import com.locvia.entity.Product;
import com.locvia.entity.Shop;
import com.locvia.entity.User;
import com.locvia.entity.UserRole;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.CategoryRepository;
import com.locvia.repository.ProductRepository;
import com.locvia.repository.ShopRepository;
import com.locvia.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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
    private final CloudinaryService cloudinaryService;

    public ProductService(
            ProductRepository productRepository,
            ShopRepository shopRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            CloudinaryService cloudinaryService) {
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
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
        return productRepository.findActiveProductsWithFilters(shopId, categoryId, trimmedSearch)
                .stream()
                .map(ProductResponse::fromEntity)
                .toList();
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
        return productRepository.findByIdAndActiveTrue(id)
                .map(ProductResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
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
        product.setShop(shop);
        product.setCategory(category);
        product.setActive(true);

        Product saved = productRepository.save(product);
        return ProductResponse.fromEntity(saved);
    }

    /**
     * Lists all products (active and inactive) for a specific shop.
     * Enforces that the caller owns the shop or is an admin.
     *
     * @param shopId      target shop ID
     * @param callerEmail authenticated user email
     * @return list of ProductResponse
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsForShop(Long shopId, String callerEmail) {
        User caller = findUserByEmail(callerEmail);
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        if (caller.getRole() != UserRole.ADMIN && !shop.getOwner().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to view products for another owner's shop");
        }

        return productRepository.findByShopId(shopId)
                .stream()
                .map(ProductResponse::fromEntity)
                .toList();
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

        return ProductResponse.fromEntity(product);
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
        if (request.active() != null) {
            product.setActive(request.active());
        }

        Product updated = productRepository.save(product);
        return ProductResponse.fromEntity(updated);
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

        return ProductResponse.fromEntity(saved);
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
        return productRepository.findAllProductsWithFilters(shopId, categoryId, trimmedSearch)
                .stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves any product by ID for administrators.
     *
     * @param id product ID
     * @return ProductResponse
     */
    @Transactional(readOnly = true)
    public ProductResponse getProductByIdForAdmin(Long id) {
        return productRepository.findById(id)
                .map(ProductResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
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
        product.setShop(shop);
        product.setCategory(category);
        product.setActive(true);

        Product saved = productRepository.save(product);
        return ProductResponse.fromEntity(saved);
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
        if (request.active() != null) {
            product.setActive(request.active());
        }

        Product updated = productRepository.save(product);
        return ProductResponse.fromEntity(updated);
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
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
