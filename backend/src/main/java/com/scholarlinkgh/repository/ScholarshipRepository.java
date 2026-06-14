package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

/**
 * Scholarship data access layer.
 *
 * OWASP A03: all queries use Spring Data's parameterised
 * query generation — no raw SQL string concatenation,
 * making SQL injection impossible.
 */
@Repository
public interface ScholarshipRepository extends JpaRepository<Scholarship, Long> {

    /**
     * Returns all verified and active scholarships with optional filters.
     *
     * IMPORTANT — caller contract to avoid PostgreSQL type-inference errors:
     * <ul>
     *   <li>{@code country} must be pre-lowercased or null.</li>
     *   <li>{@code field} must be pre-lowercased with the trailing {@code %}
     *       wildcard already appended (e.g. {@code "engineering%"}), or null.</li>
     * </ul>
     *
     * LOWER() is applied only to entity columns, never to bind parameters.
     * CONCAT() is avoided entirely for the same reason: when a bind parameter
     * is null, PostgreSQL infers its type as {@code bytea}, and neither
     * {@code lower(bytea)} nor the {@code text ~~ bytea} LIKE operator exist.
     *
     * Field search uses a trailing-wildcard LIKE so a B-tree index on
     * eligibleFields can still be used for prefix matches.
     */
    @Query("""
        SELECT s FROM Scholarship s
        WHERE s.verified = true
        AND s.active = true
        AND (:#{#category} IS NULL OR s.category = :category)
        AND (:country IS NULL OR LOWER(s.destinationCountry) = :country)
        AND (:field IS NULL OR LOWER(s.eligibleFields) LIKE :field)
        AND (:beforeDate IS NULL OR s.deadline <= :beforeDate)
        ORDER BY s.deadline ASC
    """)
    Page<Scholarship> findAllFiltered(
        @Param("category") ScholarshipCategory category,
        @Param("country") String country,
        @Param("field") String field,
        @Param("beforeDate") LocalDate beforeDate,
        Pageable pageable
    );

    /**
     * Returns all scholarships pending admin review.
     * Used by the admin dashboard.
     */
    Page<Scholarship> findAllByVerifiedFalse(Pageable pageable);

    /**
     * Returns all active verified scholarships with deadlines
     * within the next N days — used for deadline alert notifications.
     */
    @Query("""
        SELECT s FROM Scholarship s
        WHERE s.verified = true
        AND s.active = true
        AND s.deadline BETWEEN :today AND :cutoffDate
        ORDER BY s.deadline ASC
    """)
    Page<Scholarship> findUpcomingDeadlines(
        @Param("today") LocalDate today,
        @Param("cutoffDate") LocalDate cutoffDate,
        Pageable pageable
    );
}