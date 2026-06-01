package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.ScholarshipCategory;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * Request body for admin creating or updating a scholarship listing.
 *
 * OWASP A03: all fields validated before touching the database.
 * Strict length limits prevent abuse and oversized data.
 */
@Data
public class ScholarshipRequest {

    @NotBlank(message = "Scholarship name is required")
    @Size(min = 3, max = 255, message = "Name must be between 3 and 255 characters")
    private String name;

    @NotBlank(message = "Provider is required")
    @Size(min = 2, max = 255, message = "Provider must be between 2 and 255 characters")
    private String provider;

    @NotNull(message = "Category is required")
    private ScholarshipCategory category;

    @Size(max = 100, message = "Destination country must not exceed 100 characters")
    private String destinationCountry;

    @Size(max = 1000, message = "Eligible fields must not exceed 1000 characters")
    private String eligibleFields;

    @DecimalMin(value = "0.0", message = "GPA requirement must be at least 0.0")
    @DecimalMax(value = "4.0", message = "GPA requirement must not exceed 4.0")
    private Double gpaRequirement;

    @Size(max = 255, message = "Funding coverage must not exceed 255 characters")
    private String fundingCoverage;

    @NotNull(message = "Deadline is required")
    @Future(message = "Deadline must be a future date")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate deadline;

    @NotBlank(message = "Official link is required")
    @Size(max = 500, message = "Official link must not exceed 500 characters")
    @Pattern(
        regexp = "^https?://.*",
        message = "Official link must be a valid URL starting with http:// or https://"
    )
    private String officialLink;

    @Size(max = 5000, message = "Requirements must not exceed 5000 characters")
    private String requirements;

    @Size(max = 5000, message = "Selection criteria must not exceed 5000 characters")
    private String selectionCriteria;

    @Size(max = 2000, message = "Additional notes must not exceed 2000 characters")
    private String additionalNotes;
}