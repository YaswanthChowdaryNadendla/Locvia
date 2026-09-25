package com.locvia.dto;

import com.locvia.entity.Shop;
import com.locvia.entity.ShopStatus;

import java.time.LocalDateTime;

/**
 * Safe, immutable data transfer object representing a shop.
 * Excludes sensitive credentials and internal JPA proxies.
 */
public record ShopResponse(
        Long id,
        String name,
        String description,
        String address,
        String phone,
        String email,
        String imageUrl,
        Double latitude,
        Double longitude,
        Double rating,
        Boolean active,
        String status,
        Long ownerId,
        UserSummaryDto owner,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    /**
     * Converts a Shop JPA entity into a clean, safe ShopResponse DTO.
     *
     * @param shop the entity to map
     * @return safe ShopResponse DTO, or null if shop is null
     */
    public static ShopResponse fromEntity(Shop shop) {
        if (shop == null) {
            return null;
        }

        Long ownerId = null;
        UserSummaryDto ownerSummary = null;

        if (shop.getOwner() != null) {
            ownerId = shop.getOwner().getId();
            ownerSummary = UserSummaryDto.fromEntity(shop.getOwner());
        }

        String statusStr = shop.getStatus() != null ? shop.getStatus().name()
                : (Boolean.TRUE.equals(shop.getActive()) ? "APPROVED" : "PENDING");

        return new ShopResponse(
                shop.getId(),
                shop.getName(),
                shop.getDescription(),
                shop.getAddress(),
                shop.getPhone(),
                shop.getEmail(),
                shop.getImageUrl(),
                shop.getLatitude(),
                shop.getLongitude(),
                shop.getRating(),
                shop.getActive(),
                statusStr,
                ownerId,
                ownerSummary,
                shop.getCreatedAt(),
                shop.getUpdatedAt()
        );
    }
}
