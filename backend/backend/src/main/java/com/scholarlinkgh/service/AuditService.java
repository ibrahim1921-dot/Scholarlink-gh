package com.scholarlinkgh.service;

import com.scholarlinkgh.entity.AuditLog;
import com.scholarlinkgh.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for recording audit log entries.
 * All admin actions (verify, deactivate, delete, create) are logged here.
 * Async so logging never blocks the main request.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(Long adminId, String adminEmail, String action,
                    String entityType, Long entityId, String detail) {
        try {
            AuditLog entry = AuditLog.builder()
                .adminId(adminId)
                .adminEmail(adminEmail)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .detail(detail)
                .build();

            auditLogRepository.save(entry);
            log.info("Audit: {} performed {} on {} ID {}", adminEmail, action, entityType, entityId);
        } catch (Exception ex) {
            log.error("Failed to write audit log: {}", ex.getMessage(), ex);
        }
    }
}
