package com.scholarlinkgh.controller;

import com.scholarlinkgh.service.ExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AdminExportController — admin-restricted endpoints for exporting
 * aggregate applicant reports as CSV downloads.
 *
 * All endpoints require ROLE_ADMIN.
 * Exported data is aggregate-only — no individually identifying data.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminExportController {

    private final ExportService exportService;

    /**
     * GET /api/v1/admin/scholarships/{id}/applications/export
     *
     * Downloads an aggregate CSV report of all applications for a given scholarship.
     * Returns a valid CSV even when there are zero applicants.
     */
    @GetMapping("/scholarships/{id}/applications/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportScholarshipApplications(@PathVariable Long id) {
        String[] result = exportService.generateScholarshipExport(id);
        String csvContent = result[0];
        String filename = result[1];

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    /**
     * GET /api/v1/admin/jobs/{id}/applications/export
     *
     * Downloads an aggregate CSV report of all applications for a given job listing.
     * Returns a valid CSV even when there are zero applicants.
     */
    @GetMapping("/jobs/{id}/applications/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportJobApplications(@PathVariable Long id) {
        String[] result = exportService.generateJobExport(id);
        String csvContent = result[0];
        String filename = result[1];

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
