package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.JobListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for JobListing entities.
 * FR-42-46: job browsing and AI matching.
 */
@Repository
public interface JobListingRepository extends JpaRepository<JobListing, Long> {

    /** Returns all active listings paginated. */
    Page<JobListing> findByActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Returns active listings filtered by field of study — used for AI matching seed.
     */
    @Query("SELECT j FROM JobListing j WHERE j.active = true AND " +
           "(:field IS NULL OR LOWER(j.fieldOfStudy) LIKE LOWER(CONCAT('%', :field, '%')))")
    List<JobListing> findActiveByField(@Param("field") String field);

    /** Returns all active listings for AI matching — limited to avoid huge prompts. */
    @Query("SELECT j FROM JobListing j WHERE j.active = true ORDER BY j.createdAt DESC")
    List<JobListing> findAllActive(Pageable pageable);
}
