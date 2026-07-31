package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.JobApplication;
import com.scholarlinkgh.entity.JobListing;
import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for JobApplication entities.
 * FR-44: tracks student job application status.
 */
@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    /** Returns all job applications for a student. */
    @EntityGraph(attributePaths = {"job", "job.requirements", "student", "documents"})
    List<JobApplication> findByStudentOrderByAppliedAtDesc(User student);

    /** Finds a specific application for uniqueness check. */
    Optional<JobApplication> findByStudentAndJob(User student, JobListing job);

    /** Checks whether a student has already applied for a job. */
    boolean existsByStudentAndJob(User student, JobListing job);

    /** Checks whether ANY applications exist for a specific job (used before deletion). */
    boolean existsByJob(JobListing job);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM JobApplication a WHERE " +
           "(:status IS NULL OR a.status = :status) " +
           "ORDER BY a.appliedAt DESC")
    @EntityGraph(attributePaths = {"job", "job.requirements", "student"})
    org.springframework.data.domain.Page<JobApplication> findWithFilters(
        @org.springframework.data.repository.query.Param("status") com.scholarlinkgh.entity.ApplicationStatus status,
        org.springframework.data.domain.Pageable pageable
    );
    long countByStudent(User student);

    /** Returns all applications for a given job listing (used by CSV export). */
    List<JobApplication> findByJob(JobListing job);
}
