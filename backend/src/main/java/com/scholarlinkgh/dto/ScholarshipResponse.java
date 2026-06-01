package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Scholarship response DTO.
 * Controls exactly what data is sent to the client.
 *
 * OWASP A04: internal fields like createdBy (admin user)
 * and reportCount are excluded from student-facing responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScholarshipResponse {

    private Long id;
    private String name;
    private String provider;
    private ScholarshipCategory category;
    private String destinationCountry;
    private String eligibleFields;
    private Double gpaRequirement;
    private String fundingCoverage;
    private LocalDate deadline;
    private Long daysUntilDeadline;
    private String officialLink;
    private String requirements;
    private String selectionCriteria;
    private String additionalNotes;
    private boolean verified;
    private LocalDateTime createdAt;

    /**
     * Converts a Scholarship entity to a ScholarshipResponse DTO.
     * Calculates daysUntilDeadline automatically.
     */
    public static ScholarshipResponse from(Scholarship scholarship) {
        return ScholarshipResponse.builder()
            .id(scholarship.getId())
            .name(scholarship.getName())
            .provider(scholarship.getProvider())
            .category(scholarship.getCategory())
            .destinationCountry(scholarship.getDestinationCountry())
            .eligibleFields(scholarship.getEligibleFields())
            .gpaRequirement(scholarship.getGpaRequirement())
            .fundingCoverage(scholarship.getFundingCoverage())
            .deadline(scholarship.getDeadline())
            .daysUntilDeadline(
                ChronoUnit.DAYS.between(LocalDate.now(), scholarship.getDeadline())
            )
            .officialLink(scholarship.getOfficialLink())
            .requirements(scholarship.getRequirements())
            .selectionCriteria(scholarship.getSelectionCriteria())
            .additionalNotes(scholarship.getAdditionalNotes())
            .verified(scholarship.isVerified())
            .createdAt(scholarship.getCreatedAt())
            .build();
    }
}