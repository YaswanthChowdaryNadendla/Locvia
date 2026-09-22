package com.locvia.security.google;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.locvia.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;

/**
 * Production implementation of {@link GoogleTokenVerifierService} utilizing Google's
 * official {@link GoogleIdTokenVerifier} with public key cryptographic validation.
 */
@Service
public class GoogleIdTokenVerifierServiceImpl implements GoogleTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(GoogleIdTokenVerifierServiceImpl.class);

    private final String googleClientId;
    private final GoogleIdTokenVerifier verifier;

    public GoogleIdTokenVerifierServiceImpl(@Value("${locvia.google.client-id:}") String googleClientId) {
        this.googleClientId = googleClientId != null ? googleClientId.trim() : "";
        if (!this.googleClientId.isEmpty()) {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
            .setAudience(Collections.singletonList(this.googleClientId))
            .setIssuers(Arrays.asList("https://accounts.google.com", "accounts.google.com"))
            .build();
            log.info("Initialized GoogleIdTokenVerifier with Client ID: {}...",
                    this.googleClientId.length() > 8 ? this.googleClientId.substring(0, 8) : this.googleClientId);
        } else {
            this.verifier = null;
            log.warn("locvia.google.client-id is not configured. Google Sign-In verification will be unavailable until configured.");
        }
    }

    @Override
    public GoogleTokenPayload verifyToken(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new BusinessException("Google credential token is required", HttpStatus.BAD_REQUEST);
        }

        if (this.verifier == null || this.googleClientId.isEmpty()) {
            log.warn("Google Sign-In attempted but locvia.google.client-id is not configured");
            throw new BusinessException("Google Sign-In is not configured on the server", HttpStatus.SERVICE_UNAVAILABLE);
        }

        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                log.warn("Google ID token verification failed (null token returned)");
                throw new BusinessException("Google authentication failed. Please try again.", HttpStatus.UNAUTHORIZED);
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String subject = payload.getSubject();
            String email = payload.getEmail();
            Boolean emailVerified = payload.getEmailVerified();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            if (subject == null || subject.isBlank()) {
                throw new BusinessException("Google authentication token missing subject identifier", HttpStatus.UNAUTHORIZED);
            }
            if (email == null || email.isBlank()) {
                throw new BusinessException("Google authentication token missing email claim", HttpStatus.UNAUTHORIZED);
            }

            return new GoogleTokenPayload(
                    subject,
                    email.trim().toLowerCase(),
                    name,
                    picture,
                    Boolean.TRUE.equals(emailVerified)
            );
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Failed to verify Google ID token: {}", e.getMessage());
            throw new BusinessException("Google authentication failed. Please try again.", HttpStatus.UNAUTHORIZED);
        }
    }
}
