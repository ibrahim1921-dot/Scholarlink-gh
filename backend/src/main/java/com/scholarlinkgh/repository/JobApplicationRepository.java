package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.JobApplication;
import com.scholarlinkgh.entity.JobListing;
import com.scholarlinkgh.entity.User;
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
    List<JobApplication> findByStudentOrderByAppliedAtDesc(User student);

    /** Finds a specific application for uniqueness check. */
    Optional<JobApplication> findByStudentAndJob(User student, JobListing job);

    /** Checks whether a student has already applied for a job. */
    boolean existsByStudentAndJob(User student, JobListing job);
}
