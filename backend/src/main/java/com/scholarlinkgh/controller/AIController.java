package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.EssayReviewRequest;
import com.scholarlinkgh.dto.PersonalStatementRequest;
import com.scholarlinkgh.dto.ScholarshipMatchResponse;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipMatch;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.ScholarshipRepository;
import com.scholarlinkgh.service.GeminiAIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * AIController — REST endpoints for all AI-powered features (powered by Gemini AI).
 *
 * FR-09: GET  /api/v1/ai/scholarships/matches  — AI scholarship matching
 * FR-11: GET  /api/v1/scholarships/{id}/eligibility — eligibility check
 * FR-19: POST /api/v1/ai/personal-statement    — personal statement generator
 * FR-20: POST /api/v1/ai/review-essay          — essay review and scoring
 * FR-40: POST /api/v1/ai/check-originality     — plagiarism/originality check
 * FR-45: POST /api/v1/ai/generate-cv           — AI CV generator
 * FR-46: POST /api/v1/ai/cover-letter          — AI cover letter generator
 *
 * All endpoints require a valid JWT (any role).
 * AI endpoints are rate-limited by the existing RateLimitFilter.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class AIController {

    private final GeminiAIService geminiAIService;
    private final ScholarshipRepository scholarshipRepository;

    // ── FR-09: AI Scholarship Matching ───────────────────────────────────────

    /**
     * GET /api/v1/ai/scholarships/matches
     *
     * Returns a ranked list of scholarships matched to the student's profile.
     * Results are cached for 24 hours; first call may take up to 30 seconds.
     *
     * Requires: valid JWT (STUDENT role)
     */
    @GetMapping("/api/v1/ai/scholarships/matches")
    public ResponseEntity<List<ScholarshipMatchResponse>> getScholarshipMatches() {
        User user = getCurrentUser();
        List<ScholarshipMatch> matches = geminiAIService.matchStudentToScholarships(user);
        List<ScholarshipMatchResponse> response = matches.stream()
            .map(ScholarshipMatchResponse::from)
            .toList();
        return ResponseEntity.ok(response);
    }

    // ── FR-11: Eligibility Checker ───────────────────────────────────────────

    /**
     * GET /api/v1/scholarships/{id}/eligibility
     *
     * Checks whether the authenticated student meets the requirements
     * for a specific scholarship.
     *
     * Returns: {meets: boolean, criteria_met: [], criteria_missing: [], actions_required: []}
     *
     * Requires: valid JWT
     */
    @GetMapping("/api/v1/scholarships/{id}/eligibility")
    public ResponseEntity<Object> checkEligibility(@PathVariable Long id) {
        User user = getCurrentUser();

        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElse(null);

        if (scholarship == null || !scholarship.isVerified() || !scholarship.isActive()) {
            return ResponseEntity.notFound().build();
        }

        String result = geminiAIService.checkEligibility(user, scholarship);
        // Return raw JSON string as a dynamic object
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return ResponseEntity.ok(mapper.readTree(result));
        } catch (Exception e) {
            return ResponseEntity.ok(result);
        }
    }

    // ── FR-19: Personal Statement Generator ─────────────────────────────────

    /**
     * POST /api/v1/ai/personal-statement
     *
     * Generates a personalised personal statement for a scholarship.
     * Input: { scholarship_id, key_points: [] }
     * Returns: generated personal statement text
     *
     * Requires: valid JWT
     */
    @PostMapping("/api/v1/ai/personal-statement")
    public ResponseEntity<ApiResponse> generatePersonalStatement(
            @RequestBody PersonalStatementRequest request) {
        User user = getCurrentUser();

        Scholarship scholarship = null;
        if (request.getScholarshipId() != null) {
            scholarship = scholarshipRepository.findById(request.getScholarshipId()).orElse(null);
        }

        // Allow generation even without a scholarship (generic statement)
        final Scholarship finalScholarship = scholarship;

        String statement;
        if (finalScholarship != null) {
            statement = geminiAIService.generatePersonalStatement(
                user, finalScholarship, request.getKeyPoints());
        } else {
            statement = geminiAIService.generatePersonalStatement(user, null, request.getKeyPoints());
        }

        return ResponseEntity.ok(ApiResponse.builder()
            .success(true)
            .message(statement)
            .build());
    }

    // ── FR-20: Essay Review & Scoring ────────────────────────────────────────

    /**
     * POST /api/v1/ai/review-essay
     *
     * Reviews and scores a student's essay.
     * Input: { essay_text, scholarship_id }
     * Returns: { quality_score, specific_suggestions[], grammar_issues[] }
     *
     * Requires: valid JWT
     */
    @PostMapping("/api/v1/ai/review-essay")
    public ResponseEntity<Object> reviewEssay(@Valid @RequestBody EssayReviewRequest request) {
        Scholarship scholarship = null;
        if (request.getScholarshipId() != null) {
            scholarship = scholarshipRepository.findById(request.getScholarshipId()).orElse(null);
        }

        // Use a placeholder scholarship if not provided
        final Scholarship finalScholarship = scholarship != null
            ? scholarship : new Scholarship();

        String result = geminiAIService.reviewEssay(request.getEssayText(), finalScholarship);

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return ResponseEntity.ok(mapper.readTree(result));
        } catch (Exception e) {
            return ResponseEntity.ok(result);
        }
    }

    // ── FR-40: Originality / Plagiarism Check ────────────────────────────────

    /**
     * POST /api/v1/ai/check-originality
     *
     * Checks whether a personal statement is too generic or template-like.
     * If flagged, submission should be blocked.
     * Input: { text: "..." }
     * Returns: { is_too_generic: boolean, similarity_score: number, reason: "..." }
     *
     * Requires: valid JWT
     */
    @PostMapping("/api/v1/ai/check-originality")
    public ResponseEntity<Object> checkOriginality(@RequestBody java.util.Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        if (text.isBlank()) {
            return ResponseEntity.badRequest().body(
                ApiResponse.builder().success(false).message("Text is required").build());
        }

        boolean tooGeneric = geminiAIService.isStatementTooGeneric(text);
        return ResponseEntity.ok(java.util.Map.of(
            "is_too_generic", tooGeneric,
            "message", tooGeneric
                ? "Your statement appears too generic. Please personalise it before submitting."
                : "Your statement looks original. Good work!"
        ));
    }

    // ── FR-45: AI CV Generator ───────────────────────────────────────────────

    /**
     * POST /api/v1/ai/generate-cv
     *
     * Generates a professional Markdown CV from the student's profile.
     * Returns: Markdown-formatted CV text.
     *
     * Requires: valid JWT
     */
    @PostMapping("/api/v1/ai/generate-cv")
    public ResponseEntity<ApiResponse> generateCv() {
        User user = getCurrentUser();
        String cv = geminiAIService.generateCv(user);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(cv).build());
    }

    // ── FR-46: AI Cover Letter ───────────────────────────────────────────────

    /**
     * POST /api/v1/ai/cover-letter
     *
     * Generates a tailored cover letter for a job application.
     * Input: { job_title, company, job_description }
     * Returns: cover letter text.
     *
     * Requires: valid JWT
     */
    @PostMapping("/api/v1/ai/cover-letter")
    public ResponseEntity<ApiResponse> generateCoverLetter(
            @RequestBody java.util.Map<String, String> body) {
        User user = getCurrentUser();

        String jobTitle = body.getOrDefault("job_title", "the position");
        String company = body.getOrDefault("company", "the company");
        String jobDescription = body.getOrDefault("job_description", "");

        String letter = geminiAIService.generateCoverLetter(user, jobTitle, jobDescription, company);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(letter).build());
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }
}
