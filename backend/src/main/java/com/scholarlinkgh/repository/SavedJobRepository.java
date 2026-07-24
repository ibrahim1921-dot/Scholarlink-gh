package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.JobListing;
import com.scholarlinkgh.entity.SavedJob;
import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {
    List<SavedJob> findByStudentOrderBySavedAtDesc(User student);
    Optional<SavedJob> findByStudentAndJob(User student, JobListing job);
    boolean existsByStudentAndJob(User student, JobListing job);
}
