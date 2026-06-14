package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.ApplicationTracker;
import com.scholarlinkgh.entity.ApplicationStatus;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for ApplicationTracker entities.
 * FR-22 / FR-26 / FR-27: tracks student scholarship application lifecycle.
 */
@Repository
public interface ApplicationTrackerRepository extends JpaRepository<ApplicationTracker, Long> {

    /** Returns all trackers for a student ordered by creation date descending. */
    List<ApplicationTracker> findByStudentOrderByCreatedAtDesc(User student);

    /** Finds a specific tracker for a student/scholarship combination. */
    Optional<ApplicationTracker> findByStudentAndScholarship(User student, Scholarship scholarship);

    /** Checks whether a student is already tracking a scholarship. */
    boolean existsByStudentAndScholarship(User student, Scholarship scholarship);

    /**
     * Returns all active trackers for scholarships whose deadline falls
     * between today and {@code deadlineCutoff} (inclusive).
     *
     * <p>JPQL has no date arithmetic, so the caller is responsible for
     * computing the cutoff: {@code LocalDate.now().plusDays(days)}.
     *
     * <p>Used by NotificationScheduler to dispatch deadline-reminder alerts.
     */
    @Query("""
        SELECT t FROM ApplicationTracker t
        JOIN FETCH t.scholarship s
        JOIN FETCH t.student u
        WHERE s.deadline BETWEEN :today AND :deadlineCutoff
        AND t.status NOT IN
            (com.scholarlinkgh.entity.ApplicationStatus.AWARDED,
             com.scholarlinkgh.entity.ApplicationStatus.REJECTED)
        """)
    List<ApplicationTracker> findTrackersWithDeadlineBetween(
        @Param("today") LocalDate today,
        @Param("deadlineCutoff") LocalDate deadlineCutoff
    );

    /** Returns trackers grouped by status for a student (for dashboard). */
    @Query("SELECT t FROM ApplicationTracker t WHERE t.student = :student AND t.status = :status")
    List<ApplicationTracker> findByStudentAndStatus(
        @Param("student") User student,
        @Param("status") ApplicationStatus status
    );
}
