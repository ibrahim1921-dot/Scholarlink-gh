package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.JobApplicationRequest;
import com.scholarlinkgh.dto.JobListingRequest;
import com.scholarlinkgh.dto.JobListingResponse;
import com.scholarlinkgh.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * JobController — REST endpoints for the jobs and career module.
 *
 * FR-42: POST /api/v1/jobs          — admin creates job listing
 * FR-42: GET  /api/v1/jobs          — browse all active jobs (paginated)
 * FR-43: GET  /api/v1/jobs/matches  — AI-matched jobs for the student
 * FR-44: POST /api/v1/jobs/{id}/apply — submit job application
 * FR-44: GET  /api/v1/jobs/my-applications — view own applications
 * FR-45: POST /api/v1/jobs/generate-cv    — AI CV generator
 * FR-46: POST /api/v1/jobs/{id}/cover-letter — AI cover letter for a job
 *
 * OWASP A01: admin-only endpoints are protected with @PreAuthorize("hasRole('ADMIN')").
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // ── Admin Endpoints ───────────────────────────────────────────────────────

    /**
     * POST /api/v1/jobs
     * Creates a new active job listing.
     *
     * Requires: ROLE_ADMIN
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<JobListingResponse> createJob(@Valid @RequestBody JobListingRequest request) {
        JobListingResponse response = jobService.createJob(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── Student Endpoints ─────────────────────────────────────────────────────

    /**
     * GET /api/v1/jobs
     * Returns paginated active job listings.
     *
     * Requires: valid JWT (any role)
     */
    @GetMapping
    public ResponseEntity<Page<JobListingResponse>> getJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(jobService.getJobs(page, size));
    }

    /**
     * GET /api/v1/jobs/matches
     * Returns AI-matched jobs ranked by fit to the student's profile.
     *
     * FR-43: response is a JSON object with ranked job matches.
     * Requires: valid JWT
     */
    @GetMapping("/matches")
    public ResponseEntity<Object> getAiMatchedJobs() {
        String result = jobService.getAiMatchedJobs();
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper();
            return ResponseEntity.ok(mapper.readTree(result));
        } catch (Exception e) {
            return ResponseEntity.ok(result);
        }
    }

    /**
     * POST /api/v1/jobs/{id}/apply
     * Submits a job application with an optional cover letter.
     *
     * FR-44: duplicate applications are rejected (unique constraint).
     * Requires: valid JWT
     */
    @PostMapping("/{id}/apply")
    public ResponseEntity<ApiResponse> applyToJob(
            @PathVariable Long id,
            @RequestBody(required = false) JobApplicationRequest request) {
        String coverLetter = (request != null) ? request.getCoverLetter() : null;
        ApiResponse response = jobService.applyToJob(id, coverLetter);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/jobs/my-applications
     * Returns all job applications for the authenticated student.
     *
     * Requires: valid JWT
     */
    @GetMapping("/my-applications")
    public ResponseEntity<Object> getMyApplications() {
        return ResponseEntity.ok(jobService.getMyApplications());
    }

    /**
     * POST /api/v1/jobs/generate-cv
     * Generates a professional Markdown CV from the student's profile.
     *
     * FR-45: returns Markdown text that can be rendered or converted to PDF.
     * Requires: valid JWT
     */
    @PostMapping("/generate-cv")
    public ResponseEntity<ApiResponse> generateCv() {
        String cv = jobService.generateCv();
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(cv).build());
    }

    /**
     * POST /api/v1/jobs/{id}/cover-letter
     * Generates a tailored cover letter for the specified job listing.
     *
     * FR-46: uses the job's description to contextualise the cover letter.
     * Requires: valid JWT
     */
    @PostMapping("/{id}/cover-letter")
    public ResponseEntity<ApiResponse> generateCoverLetter(@PathVariable Long id) {
        String letter = jobService.generateCoverLetter(id);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(letter).build());
    }
}
