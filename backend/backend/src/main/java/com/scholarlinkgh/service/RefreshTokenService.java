package com.scholarlinkgh.service;

import com.scholarlinkgh.entity.RefreshToken;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

/**
 * Manages the server-side lifecycle of refresh tokens.
 *
 * Tokens are stored as SHA-256 hashes — not BCrypt. Refresh tokens are
 * already long cryptographically random strings, so a fast hash is safe
 * and avoids the ~200ms BCrypt cost on every token refresh.
 *
 * This service enables true token revocation: on logout, all active tokens
 * for a user are revoked. A stolen refresh token can be invalidated
 * server-side immediately.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Issues a new refresh token for the user, revoking all prior active tokens.
     * One active refresh token per user at a time.
     */
    @Transactional
    public RefreshToken issue(User user, String rawToken, LocalDateTime expiresAt) {
        revokeAll(user);

        RefreshToken token = RefreshToken.builder()
            .user(user)
            .tokenHash(hashToken(rawToken))
            .expiresAt(expiresAt)
            .build();

        return refreshTokenRepository.save(token);
    }

    /**
     * Revokes all active refresh tokens for the user (logout).
     */
    @Transactional
    public void revokeAll(User user) {
        List<RefreshToken> active =
            refreshTokenRepository.findAllByUserAndRevokedAtIsNull(user);
        if (active.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();
        active.forEach(t -> t.setRevokedAt(now));
        refreshTokenRepository.saveAll(active);

        log.info("Revoked {} refresh token(s) for: {}", active.size(), user.getEmail());
    }

    /**
     * Returns true if the raw token matches the most recent active,
     * non-expired token stored for this user.
     */
    public boolean matchesActiveToken(User user, String rawToken) {
        return refreshTokenRepository
            .findFirstByUserAndRevokedAtIsNullOrderByCreatedAtDesc(user)
            .filter(RefreshToken::isActive)
            .filter(t -> hashToken(rawToken).equals(t.getTokenHash()))
            .isPresent();
    }

    /**
     * SHA-256 hex hash of the raw token string.
     * Tokens are random, so SHA-256 is sufficient (no need for BCrypt).
     */
    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(
                rawToken.getBytes(StandardCharsets.UTF_8)
            );
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
