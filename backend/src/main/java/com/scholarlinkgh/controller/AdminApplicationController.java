package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.AdminStatusUpdateRequest;
import com.scholarlinkgh.dto.ApplicationTrackerResponse;
import com.scholarlinkgh.service.ApplicationTrackerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AdminApplicationController — admin-restricted endpoints for application management.
 *
 * All endpoints require ROLE_ADMIN.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/applications")
@RequiredArgsConstructor
public class AdminApplicationController {

    private final ApplicationTrackerService applicationTrackerService;

    /**
     * PATCH /api/v1/admin/applications/{id}/status
     * Admin endpoint to update the status of any application tracker.
     * Unrecognized ENUM strings are automatically rejected with 400 Bad Request
     * by Spring Boot's HTTP message converter.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApplicationTrackerResponse> updateApplicationStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminStatusUpdateRequest request) {
        
        ApplicationTrackerResponse response = applicationTrackerService.updateStatusByAdmin(id, request.getStatus());
        return ResponseEntity.ok(response);
    }
}
