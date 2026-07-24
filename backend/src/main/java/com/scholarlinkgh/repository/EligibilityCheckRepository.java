package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.EligibilityCheck;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for AI-generated eligibility check results.
 */
@Repository
public interface EligibilityCheckRepository extends JpaRepository<EligibilityCheck, Long> {

    /**
     * Returns a cached eligibility check created after a given timestamp.
     */
    @Query("SELECT e FROM EligibilityCheck e JOIN FETCH e.scholarship WHERE e.student = :student AND e.scholarship = :scholarship AND e.createdAt > :after")
    Optional<EligibilityCheck> findFreshEligibilityCheck(
        @Param("student") User student,
        @Param("scholarship") Scholarship scholarship,
        @Param("after") LocalDateTime after
    );

    /**
     * Deletes existing eligibility checks for a student and scholarship — called to clear stale cache before upsert.
     */
    @Modifying
    @Query("DELETE FROM EligibilityCheck e WHERE e.student = :student AND e.scholarship = :scholarship")
    void deleteByStudentAndScholarship(
        @Param("student") User student,
        @Param("scholarship") Scholarship scholarship
    );

    /**
     * Deletes all existing eligibility checks for a student — called to invalidate cache on profile update.
     */
    @Modifying
    @Query("DELETE FROM EligibilityCheck e WHERE e.student = :student")
    void deleteAllByStudent(@Param("student") User student);
}
