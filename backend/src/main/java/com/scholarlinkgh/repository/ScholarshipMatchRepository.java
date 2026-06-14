package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.ScholarshipMatch;
import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for AI-generated scholarship match results.
 * FR-09: used by GeminiAIService to cache / retrieve match data.
 */
@Repository
public interface ScholarshipMatchRepository extends JpaRepository<ScholarshipMatch, Long> {

    /**
     * Returns all matches for a student ordered by score descending.
     */
    @Query("SELECT m FROM ScholarshipMatch m JOIN FETCH m.scholarship WHERE m.student = :student ORDER BY m.matchScore DESC")
    List<ScholarshipMatch> findByStudentOrderByMatchScoreDesc(@Param("student") User student);

    /**
     * Returns matches created after a given timestamp — used to check cache freshness.
     */
    @Query("SELECT m FROM ScholarshipMatch m JOIN FETCH m.scholarship WHERE m.student = :student AND m.createdAt > :after ORDER BY m.matchScore DESC")
    List<ScholarshipMatch> findFreshMatchesForStudent(
        @Param("student") User student,
        @Param("after") LocalDateTime after
    );

    /**
     * Deletes all matches for a student — called when profile changes invalidate cache.
     */
    @Modifying
    @Query("DELETE FROM ScholarshipMatch m WHERE m.student = :student")
    void deleteAllByStudent(@Param("student") User student);

    /**
     * Deletes match records older than a cutoff to keep the table clean.
     */
    @Modifying
    @Query("DELETE FROM ScholarshipMatch m WHERE m.createdAt < :cutoff")
    void deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
