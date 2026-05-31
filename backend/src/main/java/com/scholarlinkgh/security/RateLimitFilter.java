package com.scholarlinkgh.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * IP-based Rate Limiting Filter using Bucket4j + Caffeine cache.
 *
 * OWASP A04: Insecure Design — rate limiting prevents:
 *   - Brute-force login attacks
 *   - OTP enumeration attacks
 *   - Registration spam / account farming
 *   - Denial of service via endpoint flooding
 *
 * How it works:
 *   Each IP address gets its own "token bucket". The bucket starts full.
 *   Each request consumes one token. When empty, requests are rejected (429).
 *   Tokens refill gradually over time — so legitimate users recover quickly.
 *
 * Limits per endpoint:
 *   /register       → 5 requests per 60 minutes per IP
 *   /login          → 10 requests per 15 minutes per IP
 *   /verify-otp     → 5 requests per 30 minutes per IP
 *   /forgot-password→ 5 requests per 60 minutes per IP
 *   /refresh        → 30 requests per 1 minute per IP
 *   everything else → 60 requests per 1 minute per IP
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Caffeine cache: stores one Bucket per IP per endpoint-type.
     * Buckets expire 2 hours after last access to free memory.
     * Max 100,000 entries — enough for ~100k unique IPs before eviction.
     */
    private final Cache<String, Bucket> bucketCache = Caffeine.newBuilder()
        .maximumSize(100_000)
        .expireAfterAccess(2, TimeUnit.HOURS)
        .build();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = extractClientIp(request);

        // Build a unique cache key: IP + endpoint category
        // e.g. "192.168.1.1:login" or "10.0.0.5:register"
        String bucketKey = clientIp + ":" + resolveEndpointCategory(path);

        // Get or create the bucket for this IP + endpoint combination
        Bucket bucket = bucketCache.get(bucketKey, key -> createBucket(path));

        // Try to consume one token from the bucket
        if (bucket.tryConsume(1)) {
            // Token available — allow the request through
            // Add remaining tokens in header so clients can self-throttle
            long remainingTokens = bucket.getAvailableTokens();
            response.setHeader("X-RateLimit-Remaining", String.valueOf(remainingTokens));
            filterChain.doFilter(request, response);
        } else {
            // No tokens left — reject with 429
            log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, path);
            sendRateLimitResponse(response);
        }
    }

    /**
     * Creates the right bucket configuration based on which endpoint is called.
     * Different endpoints get different limits based on their abuse risk.
     */
    private Bucket createBucket(String path) {
        String category = resolveEndpointCategory(path);

        return switch (category) {
            // Registration: 5 attempts per hour — prevents account farming
            case "register" -> buildBucket(5, Duration.ofHours(1));

            // Login: 10 attempts per 15 minutes — brute-force protection
            case "login"    -> buildBucket(10, Duration.ofMinutes(15));

            // OTP: 5 attempts per 30 minutes — prevents OTP enumeration
            case "otp"      -> buildBucket(5, Duration.ofMinutes(30));

            // Password reset: 5 per hour — prevents email spam
            case "forgot"   -> buildBucket(5, Duration.ofHours(1));

            // Token refresh: 30 per minute — app may refresh frequently
            case "refresh"  -> buildBucket(30, Duration.ofMinutes(1));

            // All other authenticated endpoints: 60 per minute
            default         -> buildBucket(60, Duration.ofMinutes(1));
        };
    }

    /**
     * Builds a token bucket with the given capacity that fully refills
     * after the given duration (greedy refill = refill all at once).
     */
    private Bucket buildBucket(int capacity, Duration refillDuration) {
    // Updated to Bucket4j 8.x non-deprecated API
    // Bandwidth.builder() replaces the deprecated Bandwidth.classic()
    Bandwidth limit = Bandwidth.builder()
        .capacity(capacity)
        .refillGreedy(capacity, refillDuration)
        .build();
    return Bucket.builder().addLimit(limit).build();
}

    /**
     * Maps request paths to rate limit categories.
     * We categorise by risk level, not exact path.
     */
    private String resolveEndpointCategory(String path) {
        if (path.contains("/register"))        return "register";
        if (path.contains("/login"))           return "login";
        if (path.contains("/verify-otp"))      return "otp";
        if (path.contains("/forgot-password")) return "forgot";
        if (path.contains("/refresh"))         return "refresh";
        return "general";
    }

    /**
     * Extracts the real client IP address.
     *
     * When behind a reverse proxy (Nginx, Cloudflare), the real IP
     * is in X-Forwarded-For, not the TCP connection IP.
     * We check that header first, then fall back to getRemoteAddr().
     *
     * OWASP note: X-Forwarded-For can be spoofed by clients if your
     * proxy isn't configured to overwrite it. In production, ensure
     * your Nginx/Cloudflare config sets this header authoritatively.
     */
    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For can be a comma-separated list; the first is the real client
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Sends a clean, informative 429 response.
     * Does NOT reveal internal details — just tells the client to slow down.
     */
    private void sendRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = Map.of(
            "status", 429,
            "error", "Too Many Requests",
            "message", "You have exceeded the request limit. Please wait before trying again.",
            "retryAfter", "Please wait a few minutes before retrying."
        );

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}