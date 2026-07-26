package com.scholarlinkgh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * EligibilityCheck entity — caches AI-generated eligibility results.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "eligibility_checks",
    uniqueConstraints = {
        @UniqueConstraint(name = "uc_student_scholarship", columnNames = {"student_id", "scholarship_id"})
    },
    indexes = {
        @Index(name = "idx_eligibility_created_at", columnList = "created_at")
    }
)
public class EligibilityCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The student whose eligibility was checked.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /**
     * The scholarship being checked.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scholarship_id", nullable = false)
    private Scholarship scholarship;

    /**
     * Whether the student is eligible based on the AI check.
     */
    @Column(nullable = false)
    private Boolean isEligible;

    /**
     * Raw JSON response from Gemini containing criteria details.
     */
    @Column(columnDefinition = "TEXT")
    private String eligibilityDetails;

    /**
     * When this check was cached.
     * Used to expire cached results after 24 hours.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
