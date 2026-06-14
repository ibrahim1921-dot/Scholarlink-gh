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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DocumentUpload entity — tracks uploaded student documents.
 *
 * FR-38: AI-based first-level document verification.
 *        Suspicious documents are flagged for admin review.
 *
 * FR-41: document_disclaimer_accepted_at on the User entity gates all uploads.
 *        This entity records the actual document metadata and verification result.
 *
 * OWASP A01: file path (local_path / s3_url) is never returned to students directly;
 *            only the filename and verification status are surfaced via the API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "document_uploads",
    indexes = {
        @Index(name = "idx_doc_student", columnList = "student_id"),
        @Index(name = "idx_doc_status", columnList = "verification_status"),
        @Index(name = "idx_doc_type", columnList = "document_type")
    }
)
public class DocumentUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The student who uploaded this document.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /**
     * Original filename as uploaded by the student.
     */
    @Column(nullable = false, length = 255)
    private String filename;

    /**
     * Server-side storage path (local filesystem or S3 key).
     * OWASP A01: never exposed to the student directly.
     */
    @Column(nullable = false, length = 1000)
    private String storagePath;

    /**
     * Type of document.
     * FR-38: different validation rules apply based on type.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 30)
    private DocumentType documentType;

    /**
     * AI verification result.
     * VERIFIED = passed all checks.
     * SUSPICIOUS = flagged for human review.
     * REJECTED = failed critical checks (e.g. name mismatch).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    /**
     * AI-generated notes explaining the verification decision.
     * Stored for admin review of SUSPICIOUS / REJECTED documents.
     */
    @Column(columnDefinition = "TEXT")
    private String verificationNotes;

    /**
     * File size in bytes — used to enforce upload limits.
     */
    private Long fileSizeBytes;

    /**
     * MIME type detected by Apache Tika at upload time.
     */
    @Column(length = 100)
    private String mimeType;

    /**
     * When this document was uploaded.
     */
    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    /**
     * When AI verification completed (null if still pending).
     */
    private LocalDateTime verifiedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
