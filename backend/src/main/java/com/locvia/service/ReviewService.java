package com.locvia.service;

import com.locvia.dto.*;
import com.locvia.entity.*;
import com.locvia.exception.BadRequestException;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service managing customer product reviews, purchase eligibility, rating aggregations,
 * and review moderation.
 */
@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         OrderItemRepository orderItemRepository,
                         ProductRepository productRepository,
                         UserRepository userRepository,
                         ShopRepository shopRepository) {
        this.reviewRepository = reviewRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
    }

    /**
     * Submits a new review for a product purchased and received by the authenticated customer.
     */
    @Transactional
    public ReviewResponse createReview(String customerEmail, CreateReviewRequest request) {
        User user = getUserByEmail(customerEmail);

        if (request.getProductId() == null) {
            throw new BadRequestException("Product ID is required.");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        // Prevent duplicate review: one review per customer per product
        if (reviewRepository.existsByUserIdAndProductId(user.getId(), product.getId())) {
            throw new BadRequestException("You have already reviewed this product. You can update your existing review.");
        }

        // Validate Rating Range
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new BadRequestException("Rating must be between 1 and 5 stars.");
        }

        // Validate Comment
        if (request.getComment() == null || request.getComment().trim().isEmpty()) {
            throw new BadRequestException("Review comment is required.");
        }

        // Verify that the customer has actually purchased this product in a DELIVERED order
        List<OrderItem> deliveredItems = orderItemRepository.findDeliveredOrderItems(
                user.getId(), product.getId(), OrderStatus.DELIVERED
        );

        if (deliveredItems.isEmpty()) {
            // Check if any order was placed for this product to provide helpful feedback
            List<OrderItem> allPurchased = orderItemRepository.findAllOrderItemsForCustomerAndProduct(user.getId(), product.getId());
            if (allPurchased.isEmpty()) {
                throw new BadRequestException("You can only review products you have purchased and received.");
            }

            boolean allCancelled = allPurchased.stream().allMatch(oi -> oi.getOrder().getStatus() == OrderStatus.CANCELLED);
            if (allCancelled) {
                throw new BadRequestException("Cannot review a product from a cancelled order.");
            } else {
                throw new BadRequestException("You can only review products after your order has been delivered.");
            }
        }

        Order deliveredOrder = deliveredItems.get(0).getOrder();

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setShop(product.getShop());
        review.setOrder(deliveredOrder);
        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());

        Review saved = reviewRepository.save(review);

        // Update shop rating dynamically
        updateShopRating(product.getShop());

        return mapToResponse(saved);
    }

    /**
     * Updates an existing review written by the authenticated customer.
     */
    @Transactional
    public ReviewResponse updateReview(String customerEmail, Long reviewId, UpdateReviewRequest request) {
        User user = getUserByEmail(customerEmail);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only modify your own reviews.");
        }

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new BadRequestException("Rating must be between 1 and 5 stars.");
        }

        if (request.getComment() == null || request.getComment().trim().isEmpty()) {
            throw new BadRequestException("Review comment is required.");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());

        Review updated = reviewRepository.save(review);
        updateShopRating(review.getShop());

        return mapToResponse(updated);
    }

    /**
     * Deletes a review enforcing ownership (or admin privileges).
     */
    @Transactional
    public void deleteReview(String userEmail, Long reviewId, boolean isAdmin) {
        User caller = getUserByEmail(userEmail);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!isAdmin && !review.getUser().getId().equals(caller.getId())) {
            throw new AccessDeniedException("You can only delete your own reviews.");
        }

        Shop shop = review.getShop();
        reviewRepository.delete(review);
        updateShopRating(shop);
    }

    /**
     * Retrieves all reviews and rating aggregates for a product.
     */
    @Transactional(readOnly = true)
    public ProductReviewsResponse getProductReviews(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }

        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);

        int total = reviews.size();
        Map<Integer, Integer> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0);
        }

        double sum = 0.0;
        for (Review r : reviews) {
            int star = r.getRating() != null ? r.getRating() : 0;
            if (star >= 1 && star <= 5) {
                distribution.put(star, distribution.get(star) + 1);
                sum += star;
            }
        }

        double average = total > 0 ? Math.round((sum / total) * 10.0) / 10.0 : 0.0;
        ReviewSummaryResponse summary = new ReviewSummaryResponse(average, total, distribution);

        List<ReviewResponse> list = reviews.stream().map(this::mapToResponse).toList();
        return new ProductReviewsResponse(list, summary);
    }

    /**
     * Retrieves reviews for products belonging to a shop (for shop owner inspection).
     */
    @Transactional(readOnly = true)
    public List<ReviewResponse> getShopReviews(Long shopId, String requesterEmail, boolean isAdmin) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + shopId));

        if (!isAdmin && requesterEmail != null) {
            User requester = userRepository.findByEmail(requesterEmail).orElse(null);
            if (requester != null && requester.getRole() == UserRole.SHOP_OWNER) {
                if (!shop.getOwner().getId().equals(requester.getId())) {
                    throw new AccessDeniedException("You can only view reviews for your own shop.");
                }
            }
        }

        return reviewRepository.findByShopIdOrderByCreatedAtDesc(shopId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Checks if the authenticated customer can review a given product.
     */
    @Transactional(readOnly = true)
    public ReviewEligibilityResponse checkEligibility(String customerEmail, Long productId) {
        if (customerEmail == null) {
            return new ReviewEligibilityResponse(false, false, null, null, "Please log in to review this product.");
        }

        User user = getUserByEmail(customerEmail);

        // Check if customer already submitted a review
        Optional<Review> existing = reviewRepository.findByUserIdAndProductId(user.getId(), productId);
        if (existing.isPresent()) {
            Review r = existing.get();
            return new ReviewEligibilityResponse(
                    false,
                    true,
                    mapToResponse(r),
                    r.getOrder() != null ? r.getOrder().getId() : null,
                    "You have already reviewed this product."
            );
        }

        // Check if customer has a delivered order for this product
        List<OrderItem> delivered = orderItemRepository.findDeliveredOrderItems(
                user.getId(), productId, OrderStatus.DELIVERED
        );

        if (!delivered.isEmpty()) {
            return new ReviewEligibilityResponse(
                    true,
                    false,
                    null,
                    delivered.get(0).getOrder().getId(),
                    "You are eligible to review this product."
            );
        }

        // Check if purchased in non-delivered order
        List<OrderItem> allPurchased = orderItemRepository.findAllOrderItemsForCustomerAndProduct(user.getId(), productId);
        if (allPurchased.isEmpty()) {
            return new ReviewEligibilityResponse(false, false, null, null, "Purchase this product to write a review.");
        }

        boolean allCancelled = allPurchased.stream().allMatch(oi -> oi.getOrder().getStatus() == OrderStatus.CANCELLED);
        if (allCancelled) {
            return new ReviewEligibilityResponse(false, false, null, null, "Cannot review a product from a cancelled order.");
        }

        return new ReviewEligibilityResponse(false, false, null, null, "You can review this product after your order is delivered.");
    }

    /**
     * Resets / clears all reviews in the database (admin maintenance).
     */
    @Transactional
    public void deleteAllReviewsForAdmin() {
        reviewRepository.deleteAll();
        // Reset all shop ratings
        List<Shop> shops = shopRepository.findAll();
        for (Shop s : shops) {
            s.setRating(0.0);
            shopRepository.save(s);
        }
    }

    private void updateShopRating(Shop shop) {
        if (shop != null && shop.getId() != null) {
            Double avg = reviewRepository.getAverageRatingForShop(shop.getId());
            shop.setRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            shopRepository.save(shop);
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private ReviewResponse mapToResponse(Review review) {
        String displayName = "Customer";
        if (review.getUser() != null && review.getUser().getName() != null) {
            String name = review.getUser().getName().trim();
            String[] parts = name.split("\\s+");
            if (parts.length > 1) {
                displayName = parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
            } else {
                displayName = parts[0];
            }
        }

        return new ReviewResponse(
                review.getId(),
                review.getUser() != null ? review.getUser().getId() : null,
                displayName,
                review.getProduct() != null ? review.getProduct().getId() : null,
                review.getProduct() != null ? review.getProduct().getName() : null,
                review.getShop() != null ? review.getShop().getId() : null,
                review.getShop() != null ? review.getShop().getName() : null,
                review.getOrder() != null ? review.getOrder().getId() : null,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
