package com.locvia.service;

import com.locvia.dto.CartItemResponse;
import com.locvia.dto.CartResponse;
import com.locvia.entity.Cart;
import com.locvia.entity.CartItem;
import com.locvia.entity.Product;
import com.locvia.entity.User;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.CartItemRepository;
import com.locvia.repository.CartRepository;
import com.locvia.repository.ProductRepository;
import com.locvia.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Service managing customer shopping cart sessions and cart item modifications.
 */
@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       UserRepository userRepository,
                       ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    /**
     * Retrieves or lazily creates a shopping cart for the specified user.
     */
    @Transactional
    public Cart getOrCreateCartEntity(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> cartRepository.save(new Cart(user)));
    }

    /**
     * Retrieves the active shopping cart with calculated totals for the authenticated customer.
     */
    @Transactional
    public CartResponse getCart(String userEmail) {
        User user = getUserByEmail(userEmail);
        Cart cart = getOrCreateCartEntity(user);
        return buildCartResponse(cart);
    }

    /**
     * Adds an item to the shopping cart, or increments quantity if already present.
     */
    @Transactional
    public CartResponse addToCart(String userEmail, Long productId, Integer quantity) {
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        int qty = (quantity != null && quantity > 0) ? quantity : 1;

        User user = getUserByEmail(userEmail);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (!Boolean.TRUE.equals(product.getActive())) {
            throw new IllegalArgumentException("Product is no longer available");
        }

        Cart cart = getOrCreateCartEntity(user);

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .map(existing -> {
                    existing.setQuantity(existing.getQuantity() + qty);
                    return existing;
                })
                .orElseGet(() -> new CartItem(cart, product, qty));

        cartItemRepository.save(item);
        return buildCartResponse(cart);
    }

    /**
     * Updates an existing cart item's quantity.
     */
    @Transactional
    public CartResponse updateCartItem(String userEmail, Long itemId, Integer quantity) {
        User user = getUserByEmail(userEmail);
        Cart cart = getOrCreateCartEntity(user);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ResourceNotFoundException("Cart item not found with id: " + itemId);
        }

        if (quantity == null || quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return buildCartResponse(cart);
    }

    /**
     * Removes an item from the customer's cart.
     */
    @Transactional
    public CartResponse removeFromCart(String userEmail, Long itemId) {
        User user = getUserByEmail(userEmail);
        Cart cart = getOrCreateCartEntity(user);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ResourceNotFoundException("Cart item not found with id: " + itemId);
        }

        cartItemRepository.delete(item);
        return buildCartResponse(cart);
    }

    /**
     * Clears all items from the customer's cart while retaining the Cart entity.
     */
    @Transactional
    public CartResponse clearCart(String userEmail) {
        User user = getUserByEmail(userEmail);
        Cart cart = getOrCreateCartEntity(user);
        cartItemRepository.deleteByCartId(cart.getId());
        return buildCartResponse(cart);
    }

    private CartResponse buildCartResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartIdOrderByCreatedAtAsc(cart.getId());
        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItemCount = 0;

        for (CartItem item : items) {
            Product product = item.getProduct();
            BigDecimal price = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            totalItemCount += item.getQuantity();

            itemResponses.add(new CartItemResponse(
                    item.getId(),
                    product.getId(),
                    product.getName(),
                    price,
                    item.getQuantity(),
                    lineTotal,
                    product.getImageUrl()
            ));
        }

        return new CartResponse(cart.getId(), itemResponses, subtotal, subtotal, totalItemCount);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
