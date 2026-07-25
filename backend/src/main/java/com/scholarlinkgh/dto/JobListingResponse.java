package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.JobListing;
import com.scholarlinkgh.entity.EmploymentType;
import com.scholarlinkgh.entity.ExperienceLevel;
import com.scholarlinkgh.entity.WorkMode;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

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
    private List<String> requirements;
    private String salaryRange;
    private String applicationUrl;
    private String imageUrl;
    private LocalDateTime applicationDeadline;
    private EmploymentType employmentType;
    private ExperienceLevel experienceLevel;
    private WorkMode workMode;
    private boolean active;
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
            .imageUrl(job.getImageUrl())
            .applicationDeadline(job.getApplicationDeadline())
            .employmentType(job.getEmploymentType())
            .experienceLevel(job.getExperienceLevel())
            .workMode(job.getWorkMode())
            .active(job.isActive())
            .createdAt(job.getCreatedAt())
            .build();
    }
}
