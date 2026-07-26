package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.DocumentUpload;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for DocumentUpload entities.
 * FR-38: supports AI document verification workflows.
 */
@Repository
public interface DocumentUploadRepository extends JpaRepository<DocumentUpload, Long> {

    /** Returns all documents for a student ordered by upload date descending. */
    List<DocumentUpload> findByStudentOrderByUploadedAtDesc(User student);

    /**
     * Returns all documents with SUSPICIOUS status for admin review queue.
     */
    @Query("SELECT d FROM DocumentUpload d LEFT JOIN FETCH d.student WHERE d.verificationStatus = :status ORDER BY d.uploadedAt ASC")
    List<DocumentUpload> findByVerificationStatusOrderByUploadedAtAsc(@Param("status") VerificationStatus status);

    /**
     * Returns the count of documents pending verification for a student.
     */
    @Query("SELECT COUNT(d) FROM DocumentUpload d WHERE d.student = :student AND d.verificationStatus = 'PENDING'")
    long countPendingByStudent(@Param("student") User student);

    @Query("SELECT d FROM DocumentUpload d LEFT JOIN FETCH d.student WHERE " +
           "(:status IS NULL OR d.verificationStatus = :status) AND " +
           "(:type IS NULL OR d.documentType = :type) AND " +
           "(:search IS NULL OR LOWER(d.filename) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(d.student.email) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))")
    org.springframework.data.domain.Page<DocumentUpload> searchDocuments(
            @Param("search") String search,
            @Param("status") VerificationStatus status,
            @Param("type") com.scholarlinkgh.entity.DocumentType type,
            org.springframework.data.domain.Pageable pageable);
    long countByStudent(User student);
    long countByReviewedBy(User reviewer);
}
