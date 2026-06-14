package com.scholarlinkgh.config;

import com.scholarlinkgh.entity.RefreshToken;
import com.scholarlinkgh.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled background tasks for maintenance and cleanup.
 *
 * - Daily cleanup of expired refresh tokens to prevent unbounded table growth.
 * - Future: deadline alert notifications, weekly digest, new match alerts.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledTasks {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Runs daily at 3am to delete expired refresh tokens.
     * Prevents unbounded growth of the refresh_tokens table.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupExpiredRefreshTokens() {
        LocalDateTime cutoff = LocalDateTime.now();
        List<RefreshToken> expired = refreshTokenRepository.findAllByExpiresAtBefore(cutoff);

        if (expired.isEmpty()) {
            return;
        }

        refreshTokenRepository.deleteAll(expired);
        log.info("Cleaned up {} expired refresh tokens", expired.size());
    }
}
