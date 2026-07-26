package com.scholarlinkgh.service;

import com.scholarlinkgh.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT Service — token generation, validation, and claims extraction.
 *
 * OWASP A02 — Cryptographic Failures:
 *   - Secret key is NEVER hardcoded. Loaded from JwtConfig which reads
 *     JWT_SECRET from environment variables only.
 *   - Uses HMAC-SHA256 — a keyed MAC, not a bare hash.
 *   - Keys.hmacShaKeyFor() enforces minimum 256-bit key length.
 *     Anything shorter throws WeakKeyException at startup — the app
 *     will refuse to start rather than run insecurely.
 *
 * OWASP A03 — Injection:
 *   - All claims set programmatically via JJWT builder.
 *   - No user input is ever interpolated into the token structure.
 *   - Email stored as subject is treated as an opaque string only.
 *
 * OWASP A07 — Identification and Authentication Failures:
 *   - Access tokens are short-lived (default 30 min).
 *   - Refresh tokens are separate and longer-lived (default 7 days).
 *   - Expiry checked on every validation — never skipped or cached.
 *   - Token subject must exactly match the loaded UserDetails username.
 *   - All JWT exceptions caught and logged — never exposed to client.
 *
 * OWASP A09 — Security Logging and Monitoring:
 *   - All token failures logged with reason for audit trails.
 *   - Raw token values are NEVER logged — only email and failure reason.
 *
 * Fits your project:
 *   - User.getUsername() returns email (set up in your User entity).
 *   - JwtConfig reads jwt.secret, jwt.access-token-expiry-ms,
 *     jwt.refresh-token-expiry-ms from environment / application.yml.
 *   - Called by JwtAuthFilter via extractEmail() and isTokenValid().
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtConfig jwtConfig;

    // ── Expiry Accessors ──────────────────────────────────────────────────────

    /** Returns refresh token lifetime in seconds (used to set DB expiry). */
    public long getRefreshTokenExpirySeconds() {
        return jwtConfig.getRefreshTokenExpiryMs() / 1000;
    }

    // ── Token Generation ──────────────────────────────────────────────────────

    /**
     * Generates a short-lived access token for the authenticated user.
     *
     * Use this token in the Authorization header for every API request:
     *   Authorization: Bearer <token>
     *
     * Default expiry: 30 minutes (JWT_ACCESS_EXPIRY env var).
     * Short-lived by design — limits damage window if a token is stolen.
     */
    public String generateAccessToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails, jwtConfig.getAccessTokenExpiryMs(), "access");
    }

    /**
     * Generates a longer-lived refresh token.
     *
     * Used ONLY to obtain a new access token via /api/v1/auth/refresh.
     * Must NEVER be used to access protected resources directly.
     *
     * Default expiry: 7 days (JWT_REFRESH_EXPIRY env var).
     */
    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails, jwtConfig.getRefreshTokenExpiryMs(), "refresh");
    }

    /**
     * Core token builder — called by both generate methods above.
     *
     * Claims written into every token:
     *   sub : user's email (your User.getUsername() returns email)
     *   iat : issued-at timestamp
     *   exp : expiration timestamp
     *
     * OWASP A02: signed with HMAC-SHA256 using the secret from JwtConfig.
     * Without the correct key the signature cannot be verified or forged.
     */
    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiryMs,
            String tokenType
    ) {
        // Guard: never build a token for a null or blank principal
        if (userDetails == null || !StringUtils.hasText(userDetails.getUsername())) {
            throw new IllegalArgumentException(
                "Cannot generate token: username (email) is null or blank"
            );
        }

        long now = System.currentTimeMillis();

        extraClaims.put("typ", tokenType);

        return Jwts.builder()
                .claims(extraClaims)
                // sub = email — User.getUsername() returns email in your entity
                .subject(userDetails.getUsername())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiryMs))
                // OWASP A02: key from environment — never hardcoded
                .signWith(getSigningKey())
                .compact();
    }

    // ── Token Validation ──────────────────────────────────────────────────────

    /**
     * Full token validation — both conditions must pass:
     *
     *   1. Email in token == userDetails.getUsername() (which is email
     *      in your User entity). Prevents token from user A being used
     *      as user B.
     *
     *   2. Token has not passed its expiration timestamp.
     *
     * Called by JwtAuthFilter on every authenticated request.
     * Returns false on ANY failure — never throws to the caller.
     * JwtAuthFilter handles false by sending a 401 response.
     *
     * OWASP A09: all failures logged internally with reason.
     * Raw token is NEVER logged — only email and reason.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, null);
    }

    public boolean isTokenValid(String token, UserDetails userDetails, String requiredType) {
        try {
            if (!StringUtils.hasText(token)) {
                log.warn("Token validation failed: token is null or blank");
                return false;
            }

            final String email = extractEmail(token);
            final String tokenType = extractTokenType(token);

            boolean valid = email != null
                    && email.equals(userDetails.getUsername())
                    && !isTokenExpired(token)
                    && (requiredType == null || requiredType.equals(tokenType));

            if (!valid) {
                log.warn("Token validation failed for [{}]", userDetails.getUsername());
            }

            return valid;

        } catch (ExpiredJwtException ex) {
            log.warn("Token expired for user [{}]", userDetails.getUsername());
            return false;

        } catch (SignatureException ex) {
            // OWASP A07: tampered token — this is a serious security event
            log.error("Invalid JWT signature — possible token tampering detected");
            return false;

        } catch (MalformedJwtException ex) {
            log.warn("Malformed JWT token rejected");
            return false;

        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT type rejected");
            return false;

        } catch (Exception ex) {
            // OWASP A09: never swallow security events silently
            log.error("Unexpected token validation error: {}", ex.getMessage());
            return false;
        }
    }

    public String extractTokenType(String token) {
        try {
            return extractClaim(token, claims -> claims.get("typ", String.class));
        } catch (Exception ex) {
            log.warn("Could not extract token type: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Checks whether the token's expiration timestamp is in the past.
     * Called inside isTokenValid() — never skipped.
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ── Claims Extraction ─────────────────────────────────────────────────────

    /**
     * Extracts the email address from the token's subject claim.
     *
     * This is what JwtAuthFilter calls first on every request to identify
     * which user the token belongs to before loading from the database.
     *
     * Returns null on any parse failure so the caller can handle gracefully
     * rather than propagating an exception up the filter chain.
     *
     * OWASP A03: email returned as plain string — never executed or used
     * in dynamic queries without parameterisation at the repository layer.
     */
    public String extractEmail(String token) {
        try {
            return extractClaim(token, Claims::getSubject);
        } catch (Exception ex) {
            // Return null — JwtAuthFilter checks for null before proceeding
            log.warn("Could not extract email from token: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Extracts the expiration date from the token.
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Generic claim extractor.
     *
     * Parses and signature-verifies the token, then applies the provided
     * function to pull out the desired claim field.
     *
     * OWASP A02: signature is verified on EVERY parse — never cached or skipped.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parses the full token and returns all claims.
     *
     * JJWT automatically:
     *   - Verifies the HMAC-SHA256 signature against our secret key
     *   - Rejects tokens with a missing or invalid signature
     *   - Rejects tokens past their expiration date
     *
     * Any failure throws a specific JwtException subclass.
     * All are caught upstream in isTokenValid() and extractEmail().
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ── Signing Key ───────────────────────────────────────────────────────────

    /**
     * Derives the HMAC-SHA256 signing key from the configured secret.
     *
     * OWASP A02 — Cryptographic Failures:
     *   - Secret loaded from JwtConfig → environment variable JWT_SECRET.
     *     NEVER hardcoded in source code or committed to Git.
     *   - Keys.hmacShaKeyFor() enforces minimum 256-bit (32-byte) length.
     *     Too-short secrets throw WeakKeyException at startup — the app
     *     will not start with an insecure key. Generate with:
     *       openssl rand -hex 32
     *   - Key rotation: update JWT_SECRET in your environment and redeploy.
     *     All existing tokens immediately become invalid. For zero-downtime
     *     rotation, temporarily support two keys.
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}