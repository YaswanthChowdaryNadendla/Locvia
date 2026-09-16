package com.locvia.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

/**
 * Service responsible for JWT generation, parsing, signature validation,
 * and claims extraction using JJWT.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final String secretKey;
    private final long expirationMs;

    public JwtService(
            @Value("${locvia.jwt.secret}") String secretKey,
            @Value("${locvia.jwt.expiration:86400000}") long expirationMs) {
        this.secretKey = secretKey;
        this.expirationMs = expirationMs;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT token containing email, userId, and role claims.
     *
     * @param email  user email (subject)
     * @param userId user database ID
     * @param role   user platform role
     * @return compact URL-safe JWT string
     */
    public String generateToken(String email, Long userId, String role) {
        return generateToken(Map.of("userId", userId, "role", role), email, expirationMs);
    }

    /**
     * Generates a signed JWT token with custom extra claims and specific expiration time.
     *
     * @param extraClaims  additional claims map
     * @param subject      token subject (email)
     * @param customExpiry expiration duration in milliseconds
     * @return compact URL-safe JWT string
     */
    public String generateToken(Map<String, Object> extraClaims, String subject, long customExpiry) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(now))
                .expiration(new Date(now + customExpiry))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts the subject (user email) from the token.
     *
     * @param token JWT token string
     * @return email address
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the user ID claim from the token.
     *
     * @param token JWT token string
     * @return Long user ID or null if absent
     */
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        if (claims == null) return null;
        Object userIdObj = claims.get("userId");
        if (userIdObj instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    /**
     * Extracts the user role claim from the token.
     *
     * @param token JWT token string
     * @return role name string or null if absent
     */
    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        return claims != null ? claims.get("role", String.class) : null;
    }

    /**
     * Extracts a specific claim using a claims resolver function.
     *
     * @param token          JWT token string
     * @param claimsResolver functional interface resolving a claim
     * @param <T>            claim type
     * @return resolved claim value
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claims != null ? claimsResolver.apply(claims) : null;
    }

    /**
     * Parses and returns all claims from a signed JWT token.
     * Returns null if token is malformed, signature is invalid, or expired.
     *
     * @param token JWT token string
     * @return parsed {@link Claims} payload or null
     */
    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.debug("JWT token expired: {}", e.getMessage());
            return null;
        } catch (JwtException e) {
            log.debug("Invalid JWT signature or token format: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.debug("Unable to parse JWT token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Validates whether the token belongs to the given user and has not expired.
     *
     * @param token       JWT token string
     * @param userDetails user details representing authenticated principal
     * @return true if token is valid for user, false otherwise
     */
    public boolean validateToken(String token, UserDetails userDetails) {
        if (token == null || userDetails == null) {
            return false;
        }
        String username = extractUsername(token);
        return username != null && username.equalsIgnoreCase(userDetails.getUsername()) && !isTokenExpired(token);
    }

    /**
     * Checks whether the token has expired.
     *
     * @param token JWT token string
     * @return true if expired or invalid, false if still active
     */
    public boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration == null || expiration.before(new Date());
    }

    public long getExpirationMs() {
        return expirationMs;
    }
}
