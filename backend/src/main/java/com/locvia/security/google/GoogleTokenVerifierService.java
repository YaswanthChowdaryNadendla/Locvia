package com.locvia.security.google;

/**
 * Service interface for verifying Google Identity Services ID tokens.
 */
public interface GoogleTokenVerifierService {

    /**
     * Verifies the authenticity, issuer, audience, and expiration of a Google ID token.
     *
     * @param idTokenString raw JWT credential string received from the client
     * @return verified GoogleTokenPayload containing user subject, email, and profile details
     * @throws com.locvia.exception.BusinessException if the token is invalid, expired, or unconfigured
     */
    GoogleTokenPayload verifyToken(String idTokenString);
}
