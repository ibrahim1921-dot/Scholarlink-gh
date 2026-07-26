package com.scholarlinkgh.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * IP-based rate limiting filter using Bucket4j + Caffeine.
 *
 * OWASP A04: prevents brute-force, OTP enumeration, and endpoint flooding.
 *
 * X-Forwarded-For spoofing fix: the header is only trusted when the TCP
 * connection originates from a known proxy IP (configured via
 * security.trusted-proxy-ips). If the request comes directly from a client,
 * getRemoteAddr() is used — which cannot be spoofed.
 *
 * All limits are configurable via application.properties so they can be
 * tuned without redeployment.
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── Configurable limits (all read from application.properties) ────────────

    @Value("${rate-limit.register.capacity:5}")
    private int registerCapacity;
    @Value("${rate-limit.register.refill-minutes:60}")
    private int registerRefillMinutes;

    @Value("${rate-limit.login.capacity:10}")
    private int loginCapacity;
    @Value("${rate-limit.login.refill-minutes:15}")
    private int loginRefillMinutes;

    @Value("${rate-limit.otp.capacity:5}")
    private int otpCapacity;
    @Value("${rate-limit.otp.refill-minutes:30}")
    private int otpRefillMinutes;

    @Value("${rate-limit.forgot.capacity:5}")
    private int forgotCapacity;
    @Value("${rate-limit.forgot.refill-minutes:60}")
    private int forgotRefillMinutes;

    @Value("${rate-limit.refresh.capacity:30}")
    private int refreshCapacity;
    @Value("${rate-limit.refresh.refill-minutes:1}")
    private int refreshRefillMinutes;

    @Value("${rate-limit.general.capacity:60}")
    private int generalCapacity;
    @Value("${rate-limit.general.refill-minutes:1}")
    private int generalRefillMinutes;

    /**
     * Comma-separated list of trusted reverse proxy IPs.
     * Only from these IPs will X-Forwarded-For be trusted.
     * Leave empty to disable proxy IP trust entirely (all requests use getRemoteAddr).
     */
    @Value("${security.trusted-proxy-ips:}")
    private String trustedProxyIpsConfig;

    private Set<String> trustedProxyIps;

    /**
     * Caffeine cache: one Bucket per (client-ip + endpoint-category).
     * Max 100k entries; expire 2h after last access.
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

        initTrustedProxies();

        String path = request.getRequestURI();
        String clientIp = extractClientIp(request);
        String category = resolveEndpointCategory(path);
        String bucketKey = clientIp + ":" + category;

        Bucket bucket = bucketCache.get(bucketKey, key -> createBucket(category));

        if (bucket.tryConsume(1)) {
            response.setHeader("X-RateLimit-Remaining",
                String.valueOf(bucket.getAvailableTokens()));
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded: ip={} path={}", clientIp, path);
            sendRateLimitResponse(response);
        }
    }

    private void initTrustedProxies() {
        if (trustedProxyIps == null) {
            trustedProxyIps = Arrays.stream(trustedProxyIpsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
        }
    }

    /**
     * Returns the real client IP.
     *
     * X-Forwarded-For is ONLY trusted when the direct TCP connection is from
     * a configured trusted proxy. Otherwise getRemoteAddr() is used — this
     * cannot be spoofed because it comes from the OS network stack.
     *
     * If no trusted proxies are configured, X-Forwarded-For is never trusted.
     */
    private String extractClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        if (!trustedProxyIps.isEmpty() && trustedProxyIps.contains(remoteAddr)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                // First IP in the chain is the original client
                return forwarded.split(",")[0].trim();
            }
        }

        return remoteAddr;
    }

    private Bucket createBucket(String category) {
        return switch (category) {
            case "register" -> buildBucket(registerCapacity,
                                           Duration.ofMinutes(registerRefillMinutes));
            case "login"    -> buildBucket(loginCapacity,
                                           Duration.ofMinutes(loginRefillMinutes));
            case "otp"      -> buildBucket(otpCapacity,
                                           Duration.ofMinutes(otpRefillMinutes));
            case "forgot"   -> buildBucket(forgotCapacity,
                                           Duration.ofMinutes(forgotRefillMinutes));
            case "refresh"  -> buildBucket(refreshCapacity,
                                           Duration.ofMinutes(refreshRefillMinutes));
            default         -> buildBucket(generalCapacity,
                                           Duration.ofMinutes(generalRefillMinutes));
        };
    }

    private Bucket buildBucket(int capacity, Duration refillDuration) {
        Bandwidth limit = Bandwidth.builder()
            .capacity(capacity)
            .refillGreedy(capacity, refillDuration)
            .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String resolveEndpointCategory(String path) {
        if (path.contains("/register"))        return "register";
        if (path.contains("/login"))           return "login";
        if (path.contains("/verify-otp") ||
            path.contains("/resend-otp"))      return "otp";
        if (path.contains("/forgot-password")) return "forgot";
        if (path.contains("/refresh"))         return "refresh";
        return "general";
    }

    private void sendRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = Map.of(
            "status", 429,
            "error", "Too Many Requests",
            "message", "You have exceeded the request limit. Please wait before trying again."
        );

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
