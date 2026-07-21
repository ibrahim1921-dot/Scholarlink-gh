package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipCategory;
import com.scholarlinkgh.entity.ScholarshipStatus;
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
    private String imageUrl;
    private String status;
    private boolean allowsAssistedApplication;
    private Double assistedApplicationFee;
    private boolean verified;
    private Integer reportCount;
    private LocalDateTime createdAt;

    /**
     * Converts a Scholarship entity to a ScholarshipResponse DTO.
     * Calculates daysUntilDeadline automatically.
     */
    public static ScholarshipResponse from(Scholarship scholarship) {
        long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), scholarship.getDeadline());

        // Resolve status: use the explicit field when set, otherwise derive from deadline
        String resolvedStatus;
        if (scholarship.getStatus() != null) {
            resolvedStatus = scholarship.getStatus().name();
        } else if (daysUntil < 0) {
            resolvedStatus = ScholarshipStatus.CLOSED.name();
        } else if (daysUntil == 0) {
            resolvedStatus = ScholarshipStatus.CLOSING_SOON.name();
        } else {
            resolvedStatus = ScholarshipStatus.OPEN.name();
        }

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
            .daysUntilDeadline(daysUntil)
            .officialLink(scholarship.getOfficialLink())
            .requirements(scholarship.getRequirements())
            .selectionCriteria(scholarship.getSelectionCriteria())
            .additionalNotes(scholarship.getAdditionalNotes())
            .imageUrl(scholarship.getImageUrl())
            .status(resolvedStatus)
            .allowsAssistedApplication(scholarship.isAllowsAssistedApplication())
            .assistedApplicationFee(scholarship.getAssistedApplicationFee())
            .verified(scholarship.isVerified())
            .reportCount(scholarship.getReportCount())
            .createdAt(scholarship.getCreatedAt())
            .build();
    }
}