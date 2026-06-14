package com.scholarlinkgh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

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
    private String requirements;
    private String salaryRange;
    private String applicationUrl;
    private LocalDateTime applicationDeadline;
}
