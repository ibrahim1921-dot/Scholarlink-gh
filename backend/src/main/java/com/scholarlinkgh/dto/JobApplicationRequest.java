package com.scholarlinkgh.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Request DTO for submitting a job application with an optional cover letter.
 * FR-44: endpoint POST /api/v1/jobs/{id}/apply.
 */
@Getter
@Setter
public class JobApplicationRequest {

    /** Cover letter text (optional but strongly encouraged). */
    private String coverLetter;

    /** IDs of the documents to attach from the student's Document Vault. */
    private List<Long> documentIds;
}
