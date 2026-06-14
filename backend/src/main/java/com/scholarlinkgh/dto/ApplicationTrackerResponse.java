package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.ApplicationStatus;
import com.scholarlinkgh.entity.ApplicationTracker;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for ApplicationTracker — includes computed deadline_countdown.
 * FR-26: deadline countdown is returned as a transient computed field.
 */
@Getter
@Builder
public class ApplicationTrackerResponse {

    private Long id;
    private Long scholarshipId;
    private String scholarshipName;
    private String scholarshipProvider;
    private LocalDate scholarshipDeadline;
    /** FR-26: days remaining until the scholarship deadline (computed, not stored). */
    private Long deadlineCountdown;
    private ApplicationStatus status;
    private String notes;
    private String deadlineRemindersSent;
    private LocalDateTime submittedAt;
    private LocalDateTime awardedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Maps a tracker entity to the response DTO.
     * getDeadlineCountdown() is computed by the entity's @Transient method.
     */
    public static ApplicationTrackerResponse from(ApplicationTracker tracker) {
        return ApplicationTrackerResponse.builder()
            .id(tracker.getId())
            .scholarshipId(tracker.getScholarship().getId())
            .scholarshipName(tracker.getScholarship().getName())
            .scholarshipProvider(tracker.getScholarship().getProvider())
            .scholarshipDeadline(tracker.getScholarship().getDeadline())
            .deadlineCountdown(tracker.getDeadlineCountdown())
            .status(tracker.getStatus())
            .notes(tracker.getNotes())
            .deadlineRemindersSent(tracker.getDeadlineRemindersSent())
            .submittedAt(tracker.getSubmittedAt())
            .awardedAt(tracker.getAwardedAt())
            .createdAt(tracker.getCreatedAt())
            .updatedAt(tracker.getUpdatedAt())
            .build();
    }
}
