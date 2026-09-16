package com.locvia.dto;

import com.locvia.entity.Inventory;

import java.time.LocalDateTime;

/**
 * Detailed inventory response DTO for store owners and administrators.
 * Decouples JPA entity proxies while projecting calculated stock states.
 */
public record InventoryResponse(
        Long inventoryId,
        Long productId,
        String productName,
        Long shopId,
        String shopName,
        Integer quantity,
        Integer lowStockThreshold,
        Boolean inStock,
        Boolean lowStock,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    /**
     * Converts an Inventory entity into an InventoryResponse DTO.
     *
     * @param inventory the Inventory entity to map
     * @return InventoryResponse DTO, or null if inventory is null
     */
    public static InventoryResponse fromEntity(Inventory inventory) {
        if (inventory == null) {
            return null;
        }

        Long prodId = inventory.getProduct() != null ? inventory.getProduct().getId() : null;
        String prodName = inventory.getProduct() != null ? inventory.getProduct().getName() : null;
        Long shopId = (inventory.getProduct() != null && inventory.getProduct().getShop() != null)
                ? inventory.getProduct().getShop().getId() : null;
        String shopName = (inventory.getProduct() != null && inventory.getProduct().getShop() != null)
                ? inventory.getProduct().getShop().getName() : null;

        int qty = inventory.getQuantity() != null ? inventory.getQuantity() : 0;
        int threshold = inventory.getLowStockThreshold() != null ? inventory.getLowStockThreshold() : 0;

        boolean inStock = qty > 0;
        boolean lowStock = qty <= threshold;

        return new InventoryResponse(
                inventory.getId(),
                prodId,
                prodName,
                shopId,
                shopName,
                qty,
                threshold,
                inStock,
                lowStock,
                inventory.getCreatedAt(),
                inventory.getUpdatedAt()
        );
    }
}
