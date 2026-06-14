package com.scholarlinkgh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Request DTO for generating a personal statement.
 * FR-19: endpoint POST /api/v1/ai/personal-statement.
 */
@Getter
@Setter
public class PersonalStatementRequest {

    /** The scholarship to write the statement for. */
    private Long scholarshipId;

    /**
     * Optional key themes or achievements the student wants highlighted.
     * E.g. ["First-generation student", "Community leadership", "Research experience"]
     */
    private List<String> keyPoints;
}
