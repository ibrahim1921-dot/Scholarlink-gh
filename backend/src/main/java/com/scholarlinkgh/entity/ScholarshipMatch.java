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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ScholarshipMatch entity — stores AI-generated match results.
 *
 * FR-09: Each record captures the AI's assessment of a student's fit for
 * a specific scholarship, including a numeric score (0-100) and a
 * human-readable explanation.
 *
 * Cached for 24 hours (see CacheConfig / GeminiAIService) to avoid
 * repeated expensive API calls for the same student profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "scholarship_matches",
    indexes = {
        @Index(name = "idx_match_student", columnList = "student_id"),
        @Index(name = "idx_match_scholarship", columnList = "scholarship_id"),
        @Index(name = "idx_match_score", columnList = "match_score")
    }
)
public class ScholarshipMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The student whose profile was analysed.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /**
     * The scholarship being evaluated.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scholarship_id", nullable = false)
    private Scholarship scholarship;

    /**
     * AI-generated match score between 0 and 100.
     * Higher = better fit.
     */
    @Column(nullable = false)
    private Integer matchScore;

    /**
     * AI-generated explanation of why this score was given.
     * Includes criteria met, gaps, and suggestions.
     */
    @Column(columnDefinition = "TEXT")
    private String matchExplanation;

    /**
     * When this match record was created.
     * Used to expire cached results after 24 hours.
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
