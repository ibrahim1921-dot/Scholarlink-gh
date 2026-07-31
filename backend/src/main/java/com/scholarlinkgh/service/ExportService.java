package com.scholarlinkgh.service;

import com.scholarlinkgh.entity.*;
import com.scholarlinkgh.repository.ApplicationTrackerRepository;
import com.scholarlinkgh.repository.JobApplicationRepository;
import com.scholarlinkgh.repository.JobListingRepository;
import com.scholarlinkgh.repository.ScholarshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * ExportService — generates aggregate CSV reports for scholarship and job applications.
 *
 * All output is aggregate-only: status breakdown, application method breakdown,
 * and date range. No individually identifying data (names, emails, documents)
 * is included.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final ScholarshipRepository scholarshipRepository;
    private final JobListingRepository jobListingRepository;
    private final ApplicationTrackerRepository trackerRepository;
    private final JobApplicationRepository jobApplicationRepository;

    private static final DateTimeFormatter DT_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    // ── Scholarship Export ────────────────────────────────────────────────────

    /**
     * Generates a CSV aggregate report for a scholarship's applications.
     *
     * @param scholarshipId the scholarship to report on
     * @return a String[] where [0] = CSV content, [1] = suggested filename
     * @throws RuntimeException if the scholarship is not found
     */
    @Transactional(readOnly = true)
    public String[] generateScholarshipExport(Long scholarshipId) {
        Scholarship scholarship = scholarshipRepository.findById(scholarshipId)
                .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        List<ApplicationTracker> trackers = trackerRepository.findByScholarship(scholarship);

        // Aggregate counts
        Map<ApplicationStatus, Integer> statusCounts = new EnumMap<>(ApplicationStatus.class);
        for (ApplicationStatus s : ApplicationStatus.values()) {
            statusCounts.put(s, 0);
        }
        int directCount = 0;
        int assistedCount = 0;
        LocalDateTime earliest = null;
        LocalDateTime latest = null;

        for (ApplicationTracker t : trackers) {
            ApplicationStatus status = t.getStatus();
            if (status != null) {
                statusCounts.merge(status, 1, Integer::sum);
            }

            ApplicationMode mode = t.getApplicationMode();
            if (mode == ApplicationMode.DIRECT) {
                directCount++;
            } else if (mode == ApplicationMode.ASSISTED) {
                assistedCount++;
            }

            LocalDateTime created = t.getCreatedAt();
            if (created != null) {
                if (earliest == null || created.isBefore(earliest)) {
                    earliest = created;
                }
                if (latest == null || created.isAfter(latest)) {
                    latest = created;
                }
            }
        }

        // Build CSV
        StringBuilder csv = new StringBuilder();
        csv.append("Report Type,Scholarship Applicant Summary\n");
        csv.append("Name,").append(escapeCsv(scholarship.getName())).append("\n");
        csv.append("Provider,").append(escapeCsv(scholarship.getProvider())).append("\n");
        csv.append("Generated At,").append(LocalDateTime.now().format(DT_FORMAT)).append("\n");
        csv.append("Total Applicants,").append(trackers.size()).append("\n");
        csv.append("\n");

        csv.append("Status Breakdown\n");
        csv.append("Status,Count\n");
        csv.append("Researching,").append(statusCounts.get(ApplicationStatus.RESEARCHING)).append("\n");
        csv.append("In Progress,").append(statusCounts.get(ApplicationStatus.IN_PROGRESS)).append("\n");
        csv.append("Submitted,").append(statusCounts.get(ApplicationStatus.SUBMITTED)).append("\n");
        csv.append("Interview,").append(statusCounts.get(ApplicationStatus.INTERVIEW)).append("\n");
        csv.append("Awarded,").append(statusCounts.get(ApplicationStatus.AWARDED)).append("\n");
        csv.append("Rejected,").append(statusCounts.get(ApplicationStatus.REJECTED)).append("\n");
        csv.append("\n");

        csv.append("Application Method Breakdown\n");
        csv.append("Method,Count\n");
        csv.append("Direct,").append(directCount).append("\n");
        csv.append("Assisted,").append(assistedCount).append("\n");
        csv.append("\n");

        csv.append("Date Range\n");
        csv.append("First Application,").append(earliest != null ? earliest.format(DT_FORMAT) : "N/A").append("\n");
        csv.append("Most Recent Application,").append(latest != null ? latest.format(DT_FORMAT) : "N/A").append("\n");

        String safeName = sanitizeFilename(scholarship.getName());
        String filename = "scholarship_" + safeName + "_applicants.csv";

        log.info("Generated scholarship export for '{}' (ID={}): {} applicants", scholarship.getName(), scholarshipId, trackers.size());

        return new String[]{ csv.toString(), filename };
    }

    // ── Job Export ─────────────────────────────────────────────────────────────

    /**
     * Generates a CSV aggregate report for a job listing's applications.
     *
     * @param jobId the job listing to report on
     * @return a String[] where [0] = CSV content, [1] = suggested filename
     * @throws RuntimeException if the job listing is not found
     */
    @Transactional(readOnly = true)
    public String[] generateJobExport(Long jobId) {
        JobListing job = jobListingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job listing not found"));

        List<JobApplication> applications = jobApplicationRepository.findByJob(job);

        // Aggregate counts
        Map<ApplicationStatus, Integer> statusCounts = new EnumMap<>(ApplicationStatus.class);
        for (ApplicationStatus s : ApplicationStatus.values()) {
            statusCounts.put(s, 0);
        }
        int directCount = 0;
        int assistedCount = 0;
        LocalDateTime earliest = null;
        LocalDateTime latest = null;

        for (JobApplication a : applications) {
            ApplicationStatus status = a.getStatus();
            if (status != null) {
                statusCounts.merge(status, 1, Integer::sum);
            }

            ApplicationMode mode = a.getApplicationMode();
            if (mode == ApplicationMode.DIRECT) {
                directCount++;
            } else if (mode == ApplicationMode.ASSISTED) {
                assistedCount++;
            }

            LocalDateTime applied = a.getAppliedAt();
            if (applied != null) {
                if (earliest == null || applied.isBefore(earliest)) {
                    earliest = applied;
                }
                if (latest == null || applied.isAfter(latest)) {
                    latest = applied;
                }
            }
        }

        // Build CSV — job uses different labels for certain statuses
        StringBuilder csv = new StringBuilder();
        csv.append("Report Type,Job Applicant Summary\n");
        csv.append("Job Title,").append(escapeCsv(job.getTitle())).append("\n");
        csv.append("Company,").append(escapeCsv(job.getCompany())).append("\n");
        csv.append("Generated At,").append(LocalDateTime.now().format(DT_FORMAT)).append("\n");
        csv.append("Total Applicants,").append(applications.size()).append("\n");
        csv.append("\n");

        csv.append("Status Breakdown\n");
        csv.append("Status,Count\n");
        csv.append("Researching,").append(statusCounts.get(ApplicationStatus.RESEARCHING)).append("\n");
        csv.append("In Progress,").append(statusCounts.get(ApplicationStatus.IN_PROGRESS)).append("\n");
        csv.append("Submitted,").append(statusCounts.get(ApplicationStatus.SUBMITTED)).append("\n");
        csv.append("Interview,").append(statusCounts.get(ApplicationStatus.INTERVIEW)).append("\n");
        csv.append("Offer,").append(statusCounts.get(ApplicationStatus.AWARDED)).append("\n");
        csv.append("Rejected,").append(statusCounts.get(ApplicationStatus.REJECTED)).append("\n");
        csv.append("\n");

        csv.append("Application Method Breakdown\n");
        csv.append("Method,Count\n");
        csv.append("Direct,").append(directCount).append("\n");
        csv.append("Assisted,").append(assistedCount).append("\n");
        csv.append("\n");

        csv.append("Date Range\n");
        csv.append("First Application,").append(earliest != null ? earliest.format(DT_FORMAT) : "N/A").append("\n");
        csv.append("Most Recent Application,").append(latest != null ? latest.format(DT_FORMAT) : "N/A").append("\n");

        String safeName = sanitizeFilename(job.getTitle());
        String filename = "job_" + safeName + "_applicants.csv";

        log.info("Generated job export for '{}' (ID={}): {} applicants", job.getTitle(), jobId, applications.size());

        return new String[]{ csv.toString(), filename };
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Escapes a CSV value by wrapping in quotes if it contains commas, quotes, or newlines.
     */
    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    /**
     * Sanitizes a string for use in a filename (lowercase, replace non-alphanumeric with underscore, truncate).
     */
    private String sanitizeFilename(String name) {
        if (name == null) return "unknown";
        String sanitized = name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_|_$", "");
        return sanitized.substring(0, Math.min(sanitized.length(), 50));
    }
}
