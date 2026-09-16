package com.locvia.dto;

import com.locvia.entity.Inventory;

/**
 * Public response DTO exposing minimal stock availability.
 * Omits internal IDs, thresholds, and store ownership metadata.
 */
public record PublicInventoryResponse(
        Long productId,
        Integer quantity,
        Boolean inStock
) {

    /**
     * Maps an Inventory entity to a customer-safe PublicInventoryResponse DTO.
     *
     * @param inventory the Inventory entity
     * @return PublicInventoryResponse DTO, or null if inventory is null
     */
    public static PublicInventoryResponse fromEntity(Inventory inventory) {
        if (inventory == null) {
            return null;
        }
        Long prodId = inventory.getProduct() != null ? inventory.getProduct().getId() : null;
        int qty = inventory.getQuantity() != null ? inventory.getQuantity() : 0;
        return new PublicInventoryResponse(prodId, qty, qty > 0);
    }
}
