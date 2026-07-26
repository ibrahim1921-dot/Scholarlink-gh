package com.scholarlinkgh.controller;

import com.scholarlinkgh.entity.AuditLog;
import com.scholarlinkgh.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        LocalDateTime start = null;
        LocalDateTime end = null;
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        
        if (startDate != null && !startDate.isBlank()) {
            start = LocalDateTime.parse(startDate, formatter);
        }
        if (endDate != null && !endDate.isBlank()) {
            end = LocalDateTime.parse(endDate, formatter);
        }
        
        Page<AuditLog> result = auditLogRepository.searchAuditLogs(
                (search != null && !search.isBlank()) ? search : null,
                (entityType != null && !entityType.isBlank()) ? entityType : null,
                start, end, pageable);
                
        return ResponseEntity.ok(result);
    }
}
