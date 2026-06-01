package com.scholarlinkgh.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Scholarship entity — represents a scholarship listing on the platform.
 *
 * OWASP A04: is_verified and is_active flags ensure only admin-approved
 * listings are visible to students. New listings default to unverified
 * and inactive until an admin reviews them.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "scholarships",
    indexes = {
        @Index(name = "idx_scholarships_deadline", columnList = "deadline"),
        @Index(name = "idx_scholarships_category", columnList = "category"),
        @Index(name = "idx_scholarships_verified", columnList = "verified")
    }
)
public class Scholarship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Scholarship name e.g. "Chevening Scholarship"
     */
    @Column(nullable = false, length = 255)
    private String name;

    /**
     * Organisation offering the scholarship e.g. "UK Government"
     */
    @Column(nullable = false, length = 255)
    private String provider;

    /**
     * Category determines which students see this scholarship.
     * FR-08: filter by education level.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ScholarshipCategory category;

    /**
     * Country where studies take place e.g. "UK", "USA", "Ghana"
     */
    @Column(length = 100)
    private String destinationCountry;

    /**
     * Fields of study eligible for this scholarship.
     * Stored as comma-separated string e.g. "Computer Science, Engineering"
     * "All fields" means no restriction.
     */
    @Column(columnDefinition = "TEXT")
    private String eligibleFields;

    /**
     * Minimum GPA required e.g. 3.0
     * Null means no GPA requirement stated.
     */
    private Double gpaRequirement;

    /**
     * What the scholarship covers e.g. "Full funding", "Tuition only"
     */
    @Column(length = 255)
    private String fundingCoverage;

    /**
     * Application deadline — used for countdown timers and alerts.
     * FR-06: deadline alerts sent at 30, 14, 7, 1 days before.
     */
    @Column(nullable = false)
    private LocalDate deadline;

    /**
     * Direct link to the official application page.
     * OWASP A03: stored as-is, validated at input time.
     */
    @Column(nullable = false, length = 500)
    private String officialLink;

    /**
     * Full eligibility requirements in detail.
     */
    @Column(columnDefinition = "TEXT")
    private String requirements;

    /**
     * How students are selected.
     */
    @Column(columnDefinition = "TEXT")
    private String selectionCriteria;

    /**
     * Additional notes about the scholarship.
     */
    @Column(columnDefinition = "TEXT")
    private String additionalNotes;

    /**
     * Whether admin has verified this listing is legitimate.
     * OWASP A04: only verified listings are shown to students.
     * Defaults to false — admin must approve before it goes live.
     */
    @Column(nullable = false)
    private boolean verified = false;

    /**
     * Whether this listing is currently shown to students.
     * Admin can deactivate a listing without deleting it.
     */
    @Column(nullable = false)
    private boolean active = false;

    /**
     * Number of student reports on this listing.
     * 3+ reports triggers automatic suspension.
     * OWASP A04: community-based fraud detection.
     */
    @Column(nullable = false)
    private Integer reportCount = 0;

    /**
     * When this listing was added to the platform.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * When this listing was last updated.
     */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Admin who added this listing.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}