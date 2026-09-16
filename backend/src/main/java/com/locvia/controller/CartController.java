package com.locvia.controller;

import com.locvia.dto.CartItemRequest;
import com.locvia.dto.CartResponse;
import com.locvia.security.CustomUserDetails;
import com.locvia.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for customer shopping cart operations.
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        CartResponse response = cartService.getCart(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                  @Valid @RequestBody CartItemRequest request) {
        CartResponse response = cartService.addToCart(userDetails.getUsername(), request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateCartItem(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                       @PathVariable Long itemId,
                                                       @RequestBody Map<String, Object> body) {
        Integer quantity = 1;
        if (body.containsKey("quantity")) {
            Object q = body.get("quantity");
            if (q instanceof Number) {
                quantity = ((Number) q).intValue();
            }
        }
        CartResponse response = cartService.updateCartItem(userDetails.getUsername(), itemId, quantity);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeFromCart(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                       @PathVariable Long itemId) {
        CartResponse response = cartService.removeFromCart(userDetails.getUsername(), itemId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<CartResponse> clearCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        CartResponse response = cartService.clearCart(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
