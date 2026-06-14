package com.scholarlinkgh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Audit log entity — records all admin actions for compliance and security.
 * Every publishing decision, deletion, and pipeline override is logged.
 * This table is append-only — records are never deleted.
 *
 * OWASP A09: Security Logging and Monitoring.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_admin", columnList = "adminId"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The admin user who performed the action.
     */
    @Column(nullable = false)
    private Long adminId;

    @Column(nullable = false, length = 100)
    private String adminEmail;

    /**
     * The action performed (e.g. VERIFY_SCHOLARSHIP, DEACTIVATE_SCHOLARSHIP).
     */
    @Column(nullable = false, length = 100)
    private String action;

    /**
     * The type of entity affected (e.g. "Scholarship", "User").
     */
    @Column(nullable = false, length = 100)
    private String entityType;

    /**
     * The ID of the entity affected.
     */
    @Column(nullable = false)
    private Long entityId;

    /**
     * Optional detail about the action (e.g. scholarship name).
     */
    @Column(length = 500)
    private String detail;

    /**
     * When the action was performed.
     */
    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
