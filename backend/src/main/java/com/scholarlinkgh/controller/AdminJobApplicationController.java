package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.AdminStatusUpdateRequest;
import com.scholarlinkgh.entity.JobApplication;
import com.scholarlinkgh.service.JobService;
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
 * AdminJobApplicationController — admin-restricted endpoints for job application management.
 *
 * All endpoints require ROLE_ADMIN.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/job-applications")
@RequiredArgsConstructor
public class AdminJobApplicationController {

    private final JobService jobService;

    /**
     * PATCH /api/v1/admin/job-applications/{id}/status
     * Admin endpoint to update the status of any job application.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<JobApplication> updateJobApplicationStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminStatusUpdateRequest request) {
        
        JobApplication response = jobService.updateStatusByAdmin(id, request.getStatus());
        return ResponseEntity.ok(response);
    }
}
