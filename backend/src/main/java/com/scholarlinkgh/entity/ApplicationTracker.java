package com.scholarlinkgh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ApplicationTracker entity — tracks a student's application lifecycle.
 *
 * FR-26: deadline_countdown is computed at query time from the scholarship
 *        deadline, not stored, to avoid stale data.
 *
 * FR-27-29: deadline_reminders_sent stores a CSV of milestone flags
 *           (e.g. "30,14,7") so the notification scheduler knows which
 *           alerts have already been dispatched.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "application_trackers",
    indexes = {
        @Index(name = "idx_tracker_student", columnList = "student_id"),
        @Index(name = "idx_tracker_scholarship", columnList = "scholarship_id"),
        @Index(name = "idx_tracker_status", columnList = "status")
    }
)
public class ApplicationTracker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The student tracking this application.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /**
     * The scholarship being applied for.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scholarship_id", nullable = false)
    private Scholarship scholarship;

    /**
     * Current application status.
     * FR-22: statuses include RESEARCHING → IN_PROGRESS → SUBMITTED
     *        → INTERVIEW → AWARDED / REJECTED.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status;

    /**
     * Personal notes the student has written about this application.
     */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /**
     * Comma-separated list of deadline reminder milestones already sent
     * e.g. "30,14" means 30-day and 14-day alerts have been dispatched.
     * FR-27: used by NotificationScheduler to avoid duplicate alerts.
     */
    @Column(length = 20)
    private String deadlineRemindersSent;

    /**
     * When the student actually submitted the application.
     */
    private LocalDateTime submittedAt;

    /**
     * When the student received an award decision.
     */
    private LocalDateTime awardedAt;

    /**
     * When this tracker record was created.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * When this tracker was last updated.
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Transient computed field — days remaining until the scholarship deadline.
     * FR-26: returned in API responses; NOT stored in the database.
     */
    @Transient
    public Long getDeadlineCountdown() {
        if (scholarship == null || scholarship.getDeadline() == null) {
            return null;
        }
        LocalDate today = LocalDate.now();
        LocalDate deadline = scholarship.getDeadline();
        if (deadline.isBefore(today)) {
            return 0L;
        }
        return (long) (deadline.toEpochDay() - today.toEpochDay());
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ApplicationStatus.RESEARCHING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
