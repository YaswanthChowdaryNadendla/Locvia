package com.locvia.dto;

import com.locvia.entity.Address;

import java.time.LocalDateTime;

/**
 * Response DTO representing customer delivery address.
 * Includes both standard and alias field names for comprehensive compatibility.
 */
public record AddressResponse(
        Long id,
        String label,
        String recipientName,
        String fullName,
        String phoneNumber,
        String phone,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String postalCode,
        String pincode,
        String landmark,
        String country,
        Double latitude,
        Double longitude,
        Boolean defaultAddress,
        Boolean isDefault,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static AddressResponse fromEntity(Address address) {
        Boolean def = Boolean.TRUE.equals(address.getIsDefault());
        return new AddressResponse(
                address.getId(),
                address.getLabel(),
                address.getFullName(),
                address.getFullName(),
                address.getPhone(),
                address.getPhone(),
                address.getAddressLine1(),
                address.getAddressLine2(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getPostalCode(),
                address.getLandmark(),
                address.getCountry(),
                address.getLatitude(),
                address.getLongitude(),
                def,
                def,
                address.getCreatedAt(),
                address.getUpdatedAt()
        );
    }
}
