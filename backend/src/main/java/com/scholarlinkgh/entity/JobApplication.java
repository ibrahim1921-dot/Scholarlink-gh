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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * JobApplication entity — tracks a student's application to a job listing.
 *
 * FR-44: students apply to jobs and can track their application status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "job_applications",
    indexes = {
        @Index(name = "idx_job_app_student", columnList = "student_id"),
        @Index(name = "idx_job_app_job", columnList = "job_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_job_application",
            columnNames = {"student_id", "job_id"}
        )
    }
)
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The student who applied. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** The job listing being applied for. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private JobListing job;

    /** Current status of the application. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.IN_PROGRESS;

    /** Cover letter submitted with the application. */
    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    /** Student's notes about this application. */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /** When the application was submitted. */
    @Column(nullable = false)
    private LocalDateTime appliedAt;

    /** When the application was last updated. */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
