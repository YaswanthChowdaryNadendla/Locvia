package com.locvia.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;

/**
 * Request payload for updating an existing delivery address.
 */
public record UpdateAddressRequest(
        @Size(max = 50, message = "Label cannot exceed 50 characters")
        String label,

        @JsonAlias({"fullName", "recipientName"})
        @NotBlank(message = "Recipient name is required")
        @Size(max = 120, message = "Recipient name cannot exceed 120 characters")
        String recipientName,

        @JsonAlias({"phone", "phoneNumber"})
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Please enter a valid 10-digit Indian mobile number.")
        String phoneNumber,

        @NotBlank(message = "Address line 1 is required")
        @Size(max = 255, message = "Address line 1 cannot exceed 255 characters")
        String addressLine1,

        @Size(max = 255, message = "Address line 2 cannot exceed 255 characters")
        String addressLine2,

        @NotBlank(message = "City is required")
        @Size(max = 100, message = "City cannot exceed 100 characters")
        String city,

        @NotBlank(message = "State is required")
        @Size(max = 100, message = "State cannot exceed 100 characters")
        String state,

        @JsonAlias({"pincode", "postalCode"})
        @NotBlank(message = "Postal code is required")
        @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Postal code must be a valid 6-digit PIN code.")
        String postalCode,

        @Size(max = 255, message = "Landmark cannot exceed 255 characters")
        String landmark,

        @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
        Double latitude,

        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
        Double longitude,

        @JsonAlias({"isDefault", "defaultAddress"})
        Boolean defaultAddress
) {
}
