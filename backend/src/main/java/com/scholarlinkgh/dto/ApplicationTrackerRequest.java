package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Request DTO for creating or updating an ApplicationTracker.
 */
@Getter
@Setter
public class ApplicationTrackerRequest {

    /** The scholarship to track. Required on creation. */
    @NotNull(message = "Scholarship ID is required")
    private Long scholarshipId;

    /** New status to set on update (optional on creation — defaults to RESEARCHING). */
    private ApplicationStatus status;

    /** Student's personal notes about this application. */
    private String notes;
}
