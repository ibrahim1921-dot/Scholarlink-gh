package com.scholarlinkgh.service;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.ScholarshipRequest;
import com.scholarlinkgh.dto.ScholarshipResponse;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipCategory;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.ScholarshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Scholarship Service — all scholarship business logic.
 *
 * OWASP A01: Broken Access Control
 *   - Students can only see verified + active listings.
 *   - Only admins can create, verify, or deactivate listings.
 *   - Admin identity is pulled from the JWT token — never from
 *     the request body (prevents privilege escalation).
 *
 * OWASP A04: Insecure Design
 *   - New listings default to verified=false, active=false.
 *     Admin must explicitly approve before students see it.
 *   - 3+ reports triggers automatic suspension.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScholarshipService {

    private final ScholarshipRepository scholarshipRepository;

    // ── Student Operations ────────────────────────────────────────────────────

    /**
     * Returns paginated list of verified active scholarships.
     * Supports optional filtering by category, country, field, and deadline.
     *
     * FR-08: students see scholarships matching their profile.
     * FR-04: scholarships ordered by deadline (soonest first).
     */
    public Page<ScholarshipResponse> getScholarships(
            int page,
            int size,
            String category,
            String country,
            String field,
            String deadline
    ) {
        // Cap page size at 50 to prevent abuse
        size = Math.min(size, 50);

        Pageable pageable = PageRequest.of(page, size, Sort.by("deadline").ascending());

        // Convert category string to enum — null if not provided
        ScholarshipCategory categoryEnum = null;
        if (category != null && !category.isBlank()) {
            try {
                categoryEnum = ScholarshipCategory.valueOf(category.toUpperCase());
            } catch (IllegalArgumentException ex) {
                // Invalid category string — treat as no filter
                log.warn("Invalid scholarship category filter: {}", category);
            }
        }

        // Convert deadline filter to a cutoff date
        LocalDate deadlineCutoff = null;
        if (deadline != null) {
            deadlineCutoff = switch (deadline.toUpperCase()) {
                case "URGENT" -> LocalDate.now().plusDays(7);
                case "SOON"   -> LocalDate.now().plusDays(30);
                default       -> null; // ALL — no deadline filter
            };
        }

        Page<Scholarship> scholarships = scholarshipRepository.findAllFiltered(
    categoryEnum,
    (country != null && !country.isBlank()) ? country : null,
    (field != null && !field.isBlank()) ? field : null,
    deadlineCutoff,
    pageable
);


        return scholarships.map(ScholarshipResponse::from);
    }

    /**
     * Returns full details of a single scholarship by ID.
     * Only returns verified and active listings to students.
     */
    public ScholarshipResponse getScholarshipById(Long id) {
        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        // Students can only see verified and active listings
        if (!scholarship.isVerified() || !scholarship.isActive()) {
            throw new RuntimeException("Scholarship not found");
        }

        return ScholarshipResponse.from(scholarship);
    }

    /**
     * Records a student report on a suspicious listing.
     * 3+ reports automatically deactivates the listing.
     *
     * OWASP A04: community-based fraud detection.
     * FR-10: students can flag suspicious scholarships.
     */
    @Transactional
    public ApiResponse reportScholarship(Long id) {
        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        scholarship.setReportCount(scholarship.getReportCount() + 1);

        // Auto-suspend if 3 or more reports received
        if (scholarship.getReportCount() >= 3) {
            scholarship.setActive(false);
            log.warn("Scholarship ID {} auto-suspended after {} reports",
                id, scholarship.getReportCount());
        }

        scholarshipRepository.save(scholarship);

        return ApiResponse.builder()
            .success(true)
            .message("Thank you for your report. Our team will review this listing.")
            .build();
    }

    // ── Admin Operations ──────────────────────────────────────────────────────

    /**
     * Creates a new scholarship listing.
     * Admin only — ROLE_ADMIN enforced at controller level.
     *
     * New listings start as unverified and inactive.
     * Admin must separately call verify() to make it visible.
     *
     * OWASP A01: admin identity pulled from JWT token —
     * never from the request body.
     */
    @Transactional
    public ScholarshipResponse createScholarship(ScholarshipRequest request) {
        // Get the admin creating this listing from the security context
        User admin = getCurrentUser();

        Scholarship scholarship = Scholarship.builder()
            .name(request.getName())
            .provider(request.getProvider())
            .category(request.getCategory())
            .destinationCountry(request.getDestinationCountry())
            .eligibleFields(request.getEligibleFields())
            .gpaRequirement(request.getGpaRequirement())
            .fundingCoverage(request.getFundingCoverage())
            .deadline(request.getDeadline())
            .officialLink(request.getOfficialLink())
            .requirements(request.getRequirements())
            .selectionCriteria(request.getSelectionCriteria())
            .additionalNotes(request.getAdditionalNotes())
            // OWASP A04: always start unverified and inactive
            .verified(false)
            .active(false)
            .reportCount(0)
            .createdBy(admin)
            .build();

        Scholarship saved = scholarshipRepository.save(scholarship);

        log.info("Admin {} created scholarship: {}", admin.getEmail(), saved.getName());

        return ScholarshipResponse.from(saved);
    }

    /**
     * Updates an existing scholarship listing.
     * Admin only.
     */
    @Transactional
    public ScholarshipResponse updateScholarship(Long id, ScholarshipRequest request) {
        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        scholarship.setName(request.getName());
        scholarship.setProvider(request.getProvider());
        scholarship.setCategory(request.getCategory());
        scholarship.setDestinationCountry(request.getDestinationCountry());
        scholarship.setEligibleFields(request.getEligibleFields());
        scholarship.setGpaRequirement(request.getGpaRequirement());
        scholarship.setFundingCoverage(request.getFundingCoverage());
        scholarship.setDeadline(request.getDeadline());
        scholarship.setOfficialLink(request.getOfficialLink());
        scholarship.setRequirements(request.getRequirements());
        scholarship.setSelectionCriteria(request.getSelectionCriteria());
        scholarship.setAdditionalNotes(request.getAdditionalNotes());

        Scholarship updated = scholarshipRepository.save(scholarship);

        log.info("Scholarship ID {} updated by admin {}", id, getCurrentUser().getEmail());

        return ScholarshipResponse.from(updated);
    }

    /**
     * Verifies and activates a scholarship listing.
     * Makes it visible to students immediately.
     * Admin only.
     */
    @Transactional
    public ApiResponse verifyScholarship(Long id) {
        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        scholarship.setVerified(true);
        scholarship.setActive(true);
        scholarshipRepository.save(scholarship);

        log.info("Scholarship ID {} verified by admin {}", id, getCurrentUser().getEmail());

        return ApiResponse.builder()
            .success(true)
            .message("Scholarship verified and is now visible to students.")
            .build();
    }

    /**
     * Deactivates a scholarship listing without deleting it.
     * Hidden from students but preserved for records.
     * Admin only.
     */
    @Transactional
    public ApiResponse deactivateScholarship(Long id) {
        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        scholarship.setActive(false);
        scholarshipRepository.save(scholarship);

        log.info("Scholarship ID {} deactivated by admin {}", id, getCurrentUser().getEmail());

        return ApiResponse.builder()
            .success(true)
            .message("Scholarship has been deactivated.")
            .build();
    }

    /**
     * Returns all pending (unverified) scholarship listings.
     * Admin dashboard use only.
     */
    public Page<ScholarshipResponse> getPendingScholarships(int page, int size) {
        size = Math.min(size, 50);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return scholarshipRepository.findAllByVerifiedFalse(pageable)
            .map(ScholarshipResponse::from);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Gets the currently authenticated user from the JWT security context.
     * OWASP A01: identity always comes from the verified JWT token —
     * never from user-supplied request data.
     */
    private User getCurrentUser() {
        Authentication authentication =
            SecurityContextHolder.getContext().getAuthentication();
        return (User) authentication.getPrincipal();
    }
}