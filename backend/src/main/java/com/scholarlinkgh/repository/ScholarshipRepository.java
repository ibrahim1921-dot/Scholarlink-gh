package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.User;

import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipCategory;
import com.scholarlinkgh.entity.ScholarshipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

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
     *       wildcards on both sides (e.g. {@code "%engineering%"}), or null.</li>
     *   <li>{@code search} must be pre-lowercased with {@code %} wildcards
     *       on both sides (e.g. {@code "%chevening%"}), or null.</li>
     * </ul>
     *
     * LOWER() is applied only to entity columns, never to bind parameters.
     * CONCAT() is avoided entirely for the same reason: when a bind parameter
     * is null, PostgreSQL infers its type as {@code bytea}, and neither
     * {@code lower(bytea)} nor the {@code text ~~ bytea} LIKE operator exist.
     *
     * Field search uses a double-wildcard LIKE to ensure matching across
     * comma-separated eligibleFields values.
     */
    @Query("""
        SELECT s FROM Scholarship s
        WHERE s.verified = true
        AND s.active = true
        AND (:#{#category} IS NULL OR s.category = :category)
        AND (:country IS NULL OR LOWER(s.destinationCountry) = :country)
        AND (:field IS NULL OR LOWER(s.eligibleFields) LIKE :field)
        AND (:beforeDate IS NULL OR s.deadline <= :beforeDate)
        AND (:search IS NULL OR (
            LOWER(s.name) LIKE :search
            OR LOWER(s.provider) LIKE :search
            OR LOWER(s.eligibleFields) LIKE :search
        ))
        AND (:#{#status} IS NULL OR s.status = :status)
        ORDER BY s.deadline ASC
    """)
    Page<Scholarship> findAllFiltered(
        @Param("category") ScholarshipCategory category,
        @Param("country") String country,
        @Param("field") String field,
        @Param("beforeDate") LocalDate beforeDate,
        @Param("search") String search,
        @Param("status") ScholarshipStatus status,
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

    /**
     * Returns distinct destination countries across all verified, active scholarships.
     * Used by the Country filter dropdown on the scholarships list screen.
     */
    @Query("""
        SELECT DISTINCT s.destinationCountry FROM Scholarship s
        WHERE s.verified = true AND s.active = true
        AND s.destinationCountry IS NOT NULL
        ORDER BY s.destinationCountry
    """)
    List<String> findDistinctCountries();

    /**
     * Returns distinct raw eligibleFields strings across all verified, active scholarships.
     * These are comma-separated and need normalization in the service layer.
     * Used by the Field filter dropdown on the scholarships list screen.
     */
    @Query("""
        SELECT DISTINCT s.eligibleFields FROM Scholarship s
        WHERE s.verified = true AND s.active = true
        AND s.eligibleFields IS NOT NULL
    """)
    List<String> findDistinctEligibleFields();

    /**
     * Returns all scholarships without verified/active filters for admin dashboard.
     */
    @Query("""
        SELECT s FROM Scholarship s
        WHERE (:#{#category} IS NULL OR s.category = :category)
        AND (:search IS NULL OR (
            LOWER(s.name) LIKE :search
            OR LOWER(s.provider) LIKE :search
            OR LOWER(s.eligibleFields) LIKE :search
        ))
        ORDER BY s.deadline ASC
    """)
    Page<Scholarship> findAllAdminFiltered(
        @Param("category") ScholarshipCategory category,
        @Param("search") String search,
        Pageable pageable
    );
    long countByCreatedBy(User user);
    List<Scholarship> findByCreatedBy(User user);
}
