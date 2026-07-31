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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

/**
 * JobListing entity — represents a job or internship opportunity.
 *
 * FR-42-46: employers (or admins) post jobs; AI matches students to listings.
 * Students apply and track status through JobApplication.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "job_listings",
    indexes = {
        @Index(name = "idx_job_active", columnList = "active"),
        @Index(name = "idx_job_field", columnList = "field_of_study"),
        @Index(name = "idx_job_deadline", columnList = "application_deadline")
    }
)
public class JobListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Job or internship title. */
    @Column(nullable = false, length = 255)
    private String title;

    /** Company or organisation posting the job. */
    @Column(nullable = false, length = 255)
    private String company;

    /** Brief overview of the position. */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Location of the role (city/country or "Remote"). */
    @Column(length = 200)
    private String location;

    /** Relevant field of study / discipline (e.g. "Computer Science"). */
    @Column(name = "field_of_study", length = 200)
    private String fieldOfStudy;

    /** Minimum education level required (e.g. "SHS_GRADUATE"). */
    @Column(length = 50)
    private String requiredEducationLevel;

    /** Minimum GPA required (null = no requirement). */
    private Double minimumGpa;

    /** Key requirements e.g. skills, experience. */
    @Column(name = "old_requirements", columnDefinition = "TEXT")
    private String oldRequirements;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_requirements", joinColumns = @JoinColumn(name = "job_listing_id"))
    @Column(name = "requirements", columnDefinition = "TEXT")
    private List<String> requirements = new ArrayList<>();

    /** Salary range or "Competitive" if not disclosed. */
    @Column(length = 100)
    private String salaryRange;

    /** URL to the official application page. */
    @Column(length = 500)
    private String applicationUrl;

    /** Image URL for the listing. */
    @Column(length = 500)
    private String imageUrl;

    /** Last date to apply. */
    private LocalDateTime applicationDeadline;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ExperienceLevel experienceLevel;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private WorkMode workMode;

    @Column(nullable = false)
    @Builder.Default
    private boolean allowsAssistedApplication = true;

    private Double assistedApplicationFee;

    @Column(nullable = false)
    @Builder.Default
    private boolean sponsored = false;

    @Column(length = 255)
    private String sponsorName;

    /** Whether this listing is currently visible to students. */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    /** Admin or employer who created this listing. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    /** When this listing was created. */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /** When this listing was last updated. */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

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
