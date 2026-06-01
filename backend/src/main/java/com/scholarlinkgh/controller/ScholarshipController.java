package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.ScholarshipRequest;
import com.scholarlinkgh.dto.ScholarshipResponse;
import com.scholarlinkgh.service.ScholarshipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Scholarship Controller — REST endpoints for scholarship listings.
 *
 * OWASP A01: Broken Access Control
 *   - Student endpoints require authentication (enforced by JwtAuthFilter)
 *   - Admin endpoints require ROLE_ADMIN (enforced by @PreAuthorize)
 *   - No endpoint returns unverified data to students
 *
 * OWASP A04: @Valid triggers input validation on all request bodies.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/scholarships")
@RequiredArgsConstructor
public class ScholarshipController {

    private final ScholarshipService scholarshipService;

    // ── Student Endpoints ─────────────────────────────────────────────────────

    /**
     * GET /api/v1/scholarships
     * Returns paginated list of verified scholarships.
     * Supports filtering by category, country, field, deadline.
     *
     * Requires: valid JWT token (any role)
     */
    @GetMapping
    public ResponseEntity<Page<ScholarshipResponse>> getScholarships(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String field,
            @RequestParam(required = false) String deadline
    ) {
        Page<ScholarshipResponse> scholarships = scholarshipService.getScholarships(
            page, size, category, country, field, deadline
        );
        return ResponseEntity.ok(scholarships);
    }

    /**
     * GET /api/v1/scholarships/{id}
     * Returns full details of a single scholarship.
     *
     * Requires: valid JWT token (any role)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ScholarshipResponse> getScholarshipById(
            @PathVariable Long id) {
        try {
            ScholarshipResponse scholarship = scholarshipService.getScholarshipById(id);
            return ResponseEntity.ok(scholarship);
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/v1/scholarships/{id}/report
     * Reports a suspicious scholarship listing.
     *
     * Requires: valid JWT token (any role)
     */
    @PostMapping("/{id}/report")
    public ResponseEntity<ApiResponse> reportScholarship(
            @PathVariable Long id) {
        try {
            ApiResponse response = scholarshipService.reportScholarship(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Admin Endpoints ───────────────────────────────────────────────────────

    /**
     * POST /api/v1/scholarships
     * Creates a new scholarship listing.
     *
     * Requires: ROLE_ADMIN
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScholarshipResponse> createScholarship(
            @Valid @RequestBody ScholarshipRequest request) {
        ScholarshipResponse response = scholarshipService.createScholarship(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/v1/scholarships/{id}
     * Updates an existing scholarship listing.
     *
     * Requires: ROLE_ADMIN
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ScholarshipResponse> updateScholarship(
            @PathVariable Long id,
            @Valid @RequestBody ScholarshipRequest request) {
        try {
            ScholarshipResponse response = scholarshipService.updateScholarship(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/v1/scholarships/{id}/verify
     * Verifies and activates a scholarship listing.
     *
     * Requires: ROLE_ADMIN
     */
    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> verifyScholarship(
            @PathVariable Long id) {
        try {
            ApiResponse response = scholarshipService.verifyScholarship(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/v1/scholarships/{id}/deactivate
     * Deactivates a scholarship listing.
     *
     * Requires: ROLE_ADMIN
     */
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> deactivateScholarship(
            @PathVariable Long id) {
        try {
            ApiResponse response = scholarshipService.deactivateScholarship(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/v1/scholarships/admin/pending
     * Returns all unverified scholarship listings.
     *
     * Requires: ROLE_ADMIN
     */
    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ScholarshipResponse>> getPendingScholarships(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ScholarshipResponse> pending =
            scholarshipService.getPendingScholarships(page, size);
        return ResponseEntity.ok(pending);
    }
}