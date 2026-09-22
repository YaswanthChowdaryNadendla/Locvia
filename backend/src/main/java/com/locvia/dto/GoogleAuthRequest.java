package com.locvia.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for Google Identity Services authentication.
 * The client sends the signed Google credential (ID Token JWT).
 */
public record GoogleAuthRequest(
        @NotBlank(message = "Google credential token is required")
        String credential
) {
}
