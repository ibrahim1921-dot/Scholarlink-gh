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
    List<DocumentUpload> findByVerificationStatusOrderByUploadedAtAsc(VerificationStatus status);

    /**
     * Returns the count of documents pending verification for a student.
     */
    @Query("SELECT COUNT(d) FROM DocumentUpload d WHERE d.student = :student AND d.verificationStatus = 'PENDING'")
    long countPendingByStudent(@Param("student") User student);
}
