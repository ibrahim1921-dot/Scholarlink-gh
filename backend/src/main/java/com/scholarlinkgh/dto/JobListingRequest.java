package com.scholarlinkgh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.scholarlinkgh.entity.EmploymentType;
import com.scholarlinkgh.entity.ExperienceLevel;
import com.scholarlinkgh.entity.WorkMode;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Request DTO for creating a job listing.
 * FR-42: used by admin/employer endpoints.
 */
@Getter
@Setter
public class JobListingRequest {

    @NotBlank(message = "Job title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Company name is required")
    @Size(max = 255, message = "Company must not exceed 255 characters")
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
    @NotNull(message = "Employment type is required")
    private EmploymentType employmentType;

    @NotNull(message = "Experience level is required")
    private ExperienceLevel experienceLevel;

    @NotNull(message = "Work mode is required")
    private WorkMode workMode;

    private boolean allowsAssistedApplication = true;
    private Double assistedApplicationFee;
    private boolean sponsored;
    private String sponsorName;
}
