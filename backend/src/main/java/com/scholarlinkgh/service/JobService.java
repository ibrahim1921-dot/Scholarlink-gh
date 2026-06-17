package com.scholarlinkgh.service;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.JobListingRequest;
import com.scholarlinkgh.dto.JobListingResponse;
import com.scholarlinkgh.entity.JobApplication;
import com.scholarlinkgh.entity.JobListing;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.JobApplicationRepository;
import com.scholarlinkgh.repository.JobListingRepository;
import com.scholarlinkgh.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.scholarlinkgh.exception.ResourceNotFoundException;

import java.util.List;

/**
 * JobService — manages job listings, job applications, and AI-matched job results.
 *
 * FR-42: admin/employer creates job listings.
 * FR-43: AI-matched jobs for students (via GeminiAIService).
 * FR-44: students apply to jobs and track applications.
 * FR-45: AI CV generation.
 * FR-46: AI cover letter tailored to job description.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobListingRepository jobListingRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final GeminiAIService geminiAIService;
    private final AuditService auditService;

    // ── Admin Operations ──────────────────────────────────────────────────────

    /**
     * Creates a new job listing (admin/employer only).
     */
    @Transactional
    public JobListingResponse createJob(JobListingRequest request) {
        User admin = getCurrentUser();

        JobListing job = JobListing.builder()
            .title(request.getTitle())
            .company(request.getCompany())
            .description(request.getDescription())
            .location(request.getLocation())
            .fieldOfStudy(request.getFieldOfStudy())
            .requiredEducationLevel(request.getRequiredEducationLevel())
            .minimumGpa(request.getMinimumGpa())
            .requirements(request.getRequirements())
            .salaryRange(request.getSalaryRange())
            .applicationUrl(request.getApplicationUrl())
            .applicationDeadline(request.getApplicationDeadline())
            .active(true)
            .createdBy(admin)
            .build();

        JobListing saved = jobListingRepository.save(job);

        auditService.log(admin.getId(), admin.getEmail(),
            "CREATE_JOB", "JobListing", saved.getId(), saved.getTitle());

        log.info("Admin {} created job listing: {}", admin.getEmail(), saved.getTitle());
        return JobListingResponse.from(saved);
    }

    // ── Student Operations ────────────────────────────────────────────────────

    /**
     * Returns paginated active job listings.
     */
    @Transactional(readOnly = true)
    public Page<JobListingResponse> getJobs(int page, int size) {
        size = Math.min(size, 50);
        Pageable pageable = PageRequest.of(page, size);
        return jobListingRepository.findByActiveTrueOrderByCreatedAtDesc(pageable)
            .map(JobListingResponse::from);
    }

    /**
     * Returns AI-matched jobs for the authenticated student.
     * FR-43: uses Gemini to rank jobs by fit to the student's profile.
     *
     * @return JSON string with ranked job match results
     */
    @Transactional(readOnly = true)
    public String getAiMatchedJobs() {
        User user = getCurrentUser();

        // Load a seed of recent active jobs for the AI to evaluate
        Pageable limit = PageRequest.of(0, 30);
        List<JobListing> activeJobs = jobListingRepository.findAllActive(limit);

        if (activeJobs.isEmpty()) {
            return "{\"matches\": [], \"message\": \"No active job listings available.\"}";
        }

        return geminiAIService.matchStudentToJobs(user, activeJobs);
    }

    /**
     * Records a student's application to a job listing.
     * FR-44: prevents duplicate applications via unique constraint.
     *
     * @param jobId       the job to apply for
     * @param coverLetter optional cover letter text
     */
    @Transactional
    public ApiResponse applyToJob(Long jobId, String coverLetter) {
        User user = getCurrentUser();

        JobListing job = jobListingRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job listing not found"));

        if (!job.isActive()) {
            return ApiResponse.builder().success(false)
                .message("This job listing is no longer active.").build();
        }

        if (jobApplicationRepository.existsByStudentAndJob(user, job)) {
            return ApiResponse.builder().success(false)
                .message("You have already applied for this job.").build();
        }

        JobApplication application = JobApplication.builder()
            .student(user)
            .job(job)
            .coverLetter(coverLetter)
            .build();

        jobApplicationRepository.save(application);
        log.info("User {} applied for job {}", user.getEmail(), jobId);

        return ApiResponse.builder().success(true)
            .message("Application submitted successfully.").build();
    }

    /**
     * Returns all job applications for the authenticated student.
     */
    @Transactional(readOnly = true)
    public List<JobApplication> getMyApplications() {
        User user = getCurrentUser();
        return jobApplicationRepository.findByStudentOrderByAppliedAtDesc(user);
    }

    /**
     * Generates a structured CV for the authenticated student.
     * FR-45: Markdown-formatted output ready for PDF conversion.
     */
    public String generateCv() {
        User user = getCurrentUser();
        return geminiAIService.generateCv(user);
    }

    /**
     * Generates a tailored cover letter for a specific job.
     * FR-46: uses the job description to contextualise the cover letter.
     *
     * @param jobId the job to generate the cover letter for
     */
    public String generateCoverLetter(Long jobId) {
        User user = getCurrentUser();

        JobListing job = jobListingRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job listing not found"));

        return geminiAIService.generateCoverLetter(
            user,
            job.getTitle(),
            job.getDescription() != null ? job.getDescription() : "",
            job.getCompany()
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }
}
