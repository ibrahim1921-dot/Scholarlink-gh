package com.scholarlinkgh.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Request DTO for submitting an essay for AI review.
 * FR-20: endpoint POST /api/v1/ai/review-essay.
 */
@Getter
@Setter
public class EssayReviewRequest {

    /** The essay text to be reviewed. */
    @NotBlank(message = "Essay text is required")
    @Size(min = 100, max = 10000, message = "Essay must be between 100 and 10,000 characters")
    private String essayText;

    /** The scholarship the essay is written for (provides context for the AI reviewer). */
    private Long scholarshipId;
}
