package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.AdminStatusUpdateRequest;
import com.scholarlinkgh.dto.JobApplicationResponse;
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
    public ResponseEntity<JobApplicationResponse> updateJobApplicationStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminStatusUpdateRequest request) {
        
        JobApplicationResponse response = jobService.updateStatusByAdmin(id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    @org.springframework.web.bind.annotation.GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<com.scholarlinkgh.dto.JobApplicationResponse>> getJobApplications(
            @org.springframework.web.bind.annotation.RequestParam(required = false) com.scholarlinkgh.entity.ApplicationStatus status,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(jobService.getAdminJobApplications(status, page, size));
    }
}
