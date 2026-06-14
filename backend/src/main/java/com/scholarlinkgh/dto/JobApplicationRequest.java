package com.scholarlinkgh.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Request DTO for submitting a job application with an optional cover letter.
 * FR-44: endpoint POST /api/v1/jobs/{id}/apply.
 */
@Getter
@Setter
public class JobApplicationRequest {

    /** Cover letter text (optional but strongly encouraged). */
    private String coverLetter;
}
