package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for audit log entries.
 * Append-only — records are never deleted or modified.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    Page<AuditLog> findByAdminIdOrderByTimestampDesc(Long adminId, Pageable pageable);

    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);

    List<AuditLog> findTop50ByOrderByTimestampDesc();

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AuditLog a WHERE " +
           "(:entityType IS NULL OR a.entityType = :entityType) AND " +
           "(cast(:startDate as timestamp) IS NULL OR a.timestamp >= :startDate) AND " +
           "(cast(:endDate as timestamp) IS NULL OR a.timestamp <= :endDate) AND " +
           "(:search IS NULL OR LOWER(a.adminEmail) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(a.action) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(a.detail) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))")
    Page<AuditLog> searchAuditLogs(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("entityType") String entityType,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate,
            Pageable pageable);
}
