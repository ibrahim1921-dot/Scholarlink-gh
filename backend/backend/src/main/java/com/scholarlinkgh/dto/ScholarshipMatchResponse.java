package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.ScholarshipMatch;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for a single AI scholarship match result.
 * FR-09: returned in the ranked list from the AI matching endpoint.
 */
@Getter
@Builder
public class ScholarshipMatchResponse {

    private Long matchId;
    private Long scholarshipId;
    private String scholarshipName;
    private String provider;
    private String destinationCountry;
    private LocalDate deadline;
    private String fundingCoverage;
    private String officialLink;
    /** AI-generated match score 0-100. Higher = better fit. */
    private Integer matchScore;
    /** AI-generated explanation of the score. */
    private String matchExplanation;
    private LocalDateTime matchedAt;

    /** Maps a ScholarshipMatch entity to the response DTO. */
    public static ScholarshipMatchResponse from(ScholarshipMatch match) {
        return ScholarshipMatchResponse.builder()
            .matchId(match.getId())
            .scholarshipId(match.getScholarship().getId())
            .scholarshipName(match.getScholarship().getName())
            .provider(match.getScholarship().getProvider())
            .destinationCountry(match.getScholarship().getDestinationCountry())
            .deadline(match.getScholarship().getDeadline())
            .fundingCoverage(match.getScholarship().getFundingCoverage())
            .officialLink(match.getScholarship().getOfficialLink())
            .matchScore(match.getMatchScore())
            .matchExplanation(match.getMatchExplanation())
            .matchedAt(match.getCreatedAt())
            .build();
    }
}
