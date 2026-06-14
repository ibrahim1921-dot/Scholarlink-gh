package com.scholarlinkgh.service;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.ScholarshipRequest;
import com.scholarlinkgh.dto.ScholarshipResponse;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipCategory;
import com.scholarlinkgh.entity.ScholarshipReport;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.ScholarshipRepository;
import com.scholarlinkgh.repository.ScholarshipReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
 * OWASP A01: Students see only verified + active listings.
 *            Admin identity always comes from the JWT security context.
 *
 * IDOR fix: per-user report tracking prevents a single user from gaming
 * the auto-suspension threshold. Reports are recorded in scholarship_reports
 * with a (scholarship_id, user_id) unique constraint.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScholarshipService {

    private static final int AUTO_SUSPEND_THRESHOLD = 3;

    private final ScholarshipRepository scholarshipRepository;
    private final ScholarshipReportRepository scholarshipReportRepository;
    private final AuditService auditService;

    // ── Student Operations ────────────────────────────────────────────────────

    /**
     * Returns paginated verified active scholarships with optional filters.
     * FR-08: filter by category, country, field, deadline.
     * FR-04: ordered by deadline ascending (soonest first).
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "scholarshipList", key = "#page + ':' + #size + ':' + #category + ':' + #country + ':' + #field + ':' + #deadline")
    public Page<ScholarshipResponse> getScholarships(
            int page,
            int size,
            String category,
            String country,
            String field,
            String deadline
    ) {
        size = Math.min(size, 50);
        Pageable pageable = PageRequest.of(page, size, Sort.by("deadline").ascending());

        ScholarshipCategory categoryEnum = null;
        if (category != null && !category.isBlank()) {
            try {
                categoryEnum = ScholarshipCategory.valueOf(category.toUpperCase());
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid scholarship category filter ignored: {}", category);
            }
        }

        LocalDate deadlineCutoff = null;
        if (deadline != null) {
            deadlineCutoff = switch (deadline.toUpperCase()) {
                case "URGENT" -> LocalDate.now().plusDays(7);
                case "SOON"   -> LocalDate.now().plusDays(30);
                default       -> null;
            };
        }

        // Pre-lowercase here so the JPQL query can apply LOWER() only to the
        // column side. The '%' wildcard is also appended here so the query
        // needs no CONCAT() — passing CONCAT(:field, '%') with a null :field
        // makes PostgreSQL infer bytea, causing a "text ~~ bytea" error.
        Page<Scholarship> scholarships = scholarshipRepository.findAllFiltered(
            categoryEnum,
            (country != null && !country.isBlank()) ? country.toLowerCase() : null,
            (field   != null && !field.isBlank())   ? field.toLowerCase() + "%" : null,
            deadlineCutoff,
            pageable
        );

        return scholarships.map(ScholarshipResponse::from);
    }

    /**
     * Returns full details of a single verified active scholarship.
     */
    @Transactional(readOnly = true)
    public ScholarshipResponse getScholarshipById(Long id) {
        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        if (!scholarship.isVerified() || !scholarship.isActive()) {
            throw new RuntimeException("Scholarship not found");
        }

        return ScholarshipResponse.from(scholarship);
    }

    /**
     * Records a student report for a suspicious listing.
     *
     * IDOR fix: each user can report a given scholarship exactly once.
     * The unique constraint on scholarship_reports(scholarship_id, user_id)
     * enforces this at the database level as well.
     *
     * FR-17: three student reports trigger automatic suspension.
     * Community-based fraud detection.
     */
    @Transactional
    @CacheEvict(value = {"scholarshipList", "scholarshipDetail"}, allEntries = true)
    public ApiResponse reportScholarship(Long id) {
        User reporter = getCurrentUser();

        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        // Prevent duplicate reports from the same user
        if (scholarshipReportRepository.existsByScholarshipAndReporter(scholarship, reporter)) {
            return ApiResponse.builder()
                .success(false)
                .message("You have already reported this scholarship.")
                .build();
        }

        // Record the report
        ScholarshipReport report = ScholarshipReport.builder()
            .scholarship(scholarship)
            .reporter(reporter)
            .build();
        scholarshipReportRepository.save(report);

        // Check total report count and auto-suspend if threshold reached
        long totalReports = scholarshipReportRepository.countByScholarship(scholarship);
        if (totalReports >= AUTO_SUSPEND_THRESHOLD) {
            scholarship.setActive(false);
            scholarship.setReportCount((int) totalReports);
            scholarshipRepository.save(scholarship);
            log.warn("Scholarship ID {} auto-suspended after {} unique reports", id, totalReports);
        } else {
            scholarship.setReportCount((int) totalReports);
            scholarshipRepository.save(scholarship);
        }

        log.info("Scholarship ID {} reported by user: {}", id, reporter.getEmail());

        return ApiResponse.builder()
            .success(true)
            .message("Thank you for your report. Our team will review this listing.")
            .build();
    }

    // ── Admin Operations ──────────────────────────────────────────────────────

    /**
     * Creates a new scholarship listing (admin only).
     * New listings start as unverified and inactive — admin must verify separately.
     */
    @Transactional
    @CacheEvict(value = {"scholarshipList", "scholarshipDetail"}, allEntries = true)
    public ScholarshipResponse createScholarship(ScholarshipRequest request) {
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
            .verified(false)
            .active(false)
            .reportCount(0)
            .createdBy(admin)
            .build();

        Scholarship saved = scholarshipRepository.save(scholarship);

        auditService.log(admin.getId(), admin.getEmail(),
            "CREATE_SCHOLARSHIP", "Scholarship", saved.getId(), saved.getName());

        log.info("Admin {} created scholarship: {}", admin.getEmail(), saved.getName());

        return ScholarshipResponse.from(saved);
    }

    /**
     * Updates an existing scholarship listing (admin only).
     */
    @Transactional
    @CacheEvict(value = {"scholarshipList", "scholarshipDetail"}, allEntries = true)
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

        User admin = getCurrentUser();
        auditService.log(admin.getId(), admin.getEmail(),
            "UPDATE_SCHOLARSHIP", "Scholarship", id, updated.getName());

        log.info("Scholarship ID {} updated by admin {}", id, admin.getEmail());

        return ScholarshipResponse.from(updated);
    }

    /**
     * Verifies and activates a scholarship listing (admin only).
     */
    @Transactional
    @CacheEvict(value = {"scholarshipList", "scholarshipDetail"}, allEntries = true)
    public ApiResponse verifyScholarship(Long id) {
        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        scholarship.setVerified(true);
        scholarship.setActive(true);
        scholarshipRepository.save(scholarship);

        User admin = getCurrentUser();
        auditService.log(admin.getId(), admin.getEmail(),
            "VERIFY_SCHOLARSHIP", "Scholarship", id, scholarship.getName());

        log.info("Scholarship ID {} verified by admin {}", id, admin.getEmail());

        return ApiResponse.builder()
            .success(true)
            .message("Scholarship verified and is now visible to students.")
            .build();
    }

    /**
     * Deactivates a scholarship without deleting it (admin only).
     */
    @Transactional
    @CacheEvict(value = {"scholarshipList", "scholarshipDetail"}, allEntries = true)
    public ApiResponse deactivateScholarship(Long id) {
        Scholarship scholarship = scholarshipRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        scholarship.setActive(false);
        scholarshipRepository.save(scholarship);

        User admin = getCurrentUser();
        auditService.log(admin.getId(), admin.getEmail(),
            "DEACTIVATE_SCHOLARSHIP", "Scholarship", id, scholarship.getName());

        log.info("Scholarship ID {} deactivated by admin {}", id, admin.getEmail());

        return ApiResponse.builder()
            .success(true)
            .message("Scholarship has been deactivated.")
            .build();
    }

    /**
     * Returns all pending (unverified) listings for admin review.
     */
    @Transactional(readOnly = true)
    public Page<ScholarshipResponse> getPendingScholarships(int page, int size) {
        size = Math.min(size, 50);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return scholarshipRepository.findAllByVerifiedFalse(pageable)
            .map(ScholarshipResponse::from);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Gets the authenticated user from the JWT security context.
     * Identity always comes from the verified token — never from request data.
     */
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }
}
