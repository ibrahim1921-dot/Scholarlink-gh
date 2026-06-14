package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.JobListing;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Response DTO for JobListing — excludes internal fields.
 * FR-42: surfaced to students via GET /api/v1/jobs.
 */
@Getter
@Builder
public class JobListingResponse {

    private Long id;
    private String title;
    private String company;
    private String description;
    private String location;
    private String fieldOfStudy;
    private String requiredEducationLevel;
    private Double minimumGpa;
    private String requirements;
    private String salaryRange;
    private String applicationUrl;
    private LocalDateTime applicationDeadline;
    private LocalDateTime createdAt;

    /** Maps a JobListing entity to the response DTO. */
    public static JobListingResponse from(JobListing job) {
        return JobListingResponse.builder()
            .id(job.getId())
            .title(job.getTitle())
            .company(job.getCompany())
            .description(job.getDescription())
            .location(job.getLocation())
            .fieldOfStudy(job.getFieldOfStudy())
            .requiredEducationLevel(job.getRequiredEducationLevel())
            .minimumGpa(job.getMinimumGpa())
            .requirements(job.getRequirements())
            .salaryRange(job.getSalaryRange())
            .applicationUrl(job.getApplicationUrl())
            .applicationDeadline(job.getApplicationDeadline())
            .createdAt(job.getCreatedAt())
            .build();
    }
}
