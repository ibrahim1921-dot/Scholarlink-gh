package com.scholarlinkgh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * StudentProfile entity — extended academic and personal profile used by
 * the AI matching engine.
 *
 * FR-09: AI matching reads education_level, gpa, field_of_study,
 *        country_preference, financial_need and graduation_year.
 * FR-10: profile_strength_score is computed by Gemini and stored here.
 * FR-41: document_disclaimer_accepted_at gates all document uploads;
 *        must be refreshed every 90 days (annually per FR-41).
 *
 * Separate from User so that profile completeness and AI fields don't
 * clutter the core auth entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * One-to-one relationship with the User account.
     * A profile is created the first time the student fills it in.
     */
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // ── Academic background ────────────────────────────────────────────────────

    /**
     * Highest education level achieved.
     * FR-08: used to filter scholarships by category.
     * Values: SHS_GRADUATE | UNIVERSITY_GRADUATE
     */
    @Column(length = 30)
    private String educationLevel;

    /** Grade Point Average (0.0 – 4.0 scale). */
    private Double gpa;

    /** Primary field of study (e.g. "Computer Science"). */
    private String fieldOfStudy;

    /** Institution / university attended. */
    private String institution;

    /** Expected or actual graduation year. */
    private Integer graduationYear;

    // ── Preferences ───────────────────────────────────────────────────────────

    /**
     * Preferred destination country for studies.
     * FR-09: matched against scholarship.destinationCountry.
     */
    private String countryPreference;

    /**
     * Language proficiencies stored as "Language:Level" pairs,
     * comma-separated (e.g. "English:Fluent,French:Intermediate").
     * Kept simple to avoid a separate join table for MVP.
     */
    @Column(length = 500)
    private String languageProficiency;

    /** Whether the student has demonstrated financial need. */
    private boolean financialNeed;

    // ── FCM push notifications ─────────────────────────────────────────────────

    /**
     * Firebase Cloud Messaging device token.
     * FR-27-29: required to send push notifications to this student's device.
     * Null means the student has not granted notification permissions.
     */
    @Column(length = 500)
    private String fcmToken;

    // ── AI-computed fields ─────────────────────────────────────────────────────

    /**
     * AI-computed profile completeness and competitiveness score (0-100).
     * FR-10: computed by GeminiAIService and refreshed on each match call.
     */
    private Integer profileStrengthScore;

    /**
     * AI-generated suggestions for improving the profile / applications.
     * FR-10: shown alongside the profile strength score.
     */
    @Column(columnDefinition = "TEXT")
    private String profileImprovementSuggestions;

    // ── Compliance ────────────────────────────────────────────────────────────

    /**
     * When the student last accepted the document integrity disclaimer.
     * FR-41: uploads are blocked if this is null or older than 90 days.
     */
    private LocalDateTime documentDisclaimerAcceptedAt;

    // ── Bio / free text ───────────────────────────────────────────────────────

    /** Short biography used in personal statement generation. */
    @Column(columnDefinition = "TEXT")
    private String bio;

    /** Extra-curricular activities and achievements. */
    @Column(columnDefinition = "TEXT")
    private String achievements;

    // ── Audit ─────────────────────────────────────────────────────────────────

    /** When the profile was last updated. */
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}