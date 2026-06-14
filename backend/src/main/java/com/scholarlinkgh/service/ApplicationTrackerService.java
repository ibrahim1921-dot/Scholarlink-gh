package com.scholarlinkgh.service;

import com.scholarlinkgh.dto.ApplicationTrackerRequest;
import com.scholarlinkgh.dto.ApplicationTrackerResponse;
import com.scholarlinkgh.entity.ApplicationStatus;
import com.scholarlinkgh.entity.ApplicationTracker;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.ApplicationTrackerRepository;
import com.scholarlinkgh.repository.ScholarshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ApplicationTrackerService — manages a student's scholarship application lifecycle.
 *
 * FR-22: status transitions from RESEARCHING → IN_PROGRESS → SUBMITTED
 *        → INTERVIEW → AWARDED / REJECTED.
 * FR-26: deadline_countdown is computed on the fly from the scholarship deadline.
 * FR-27: NotificationScheduler reads the deadline_reminders_sent field to
 *        know which alerts have already been dispatched.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationTrackerService {

    private final ApplicationTrackerRepository trackerRepository;
    private final ScholarshipRepository scholarshipRepository;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    /**
     * Returns all application trackers for the authenticated student.
     * Includes computed deadline_countdown for each tracker.
     */
    @Transactional(readOnly = true)
    public List<ApplicationTrackerResponse> getMyTrackers() {
        User user = getCurrentUser();
        return trackerRepository.findByStudentOrderByCreatedAtDesc(user)
            .stream()
            .map(ApplicationTrackerResponse::from)
            .toList();
    }

    /**
     * Creates a new application tracker for a scholarship.
     * Prevents duplicate trackers for the same student/scholarship combination.
     */
    @Transactional
    public ApplicationTrackerResponse createTracker(ApplicationTrackerRequest request) {
        User user = getCurrentUser();

        Scholarship scholarship = scholarshipRepository.findById(request.getScholarshipId())
            .orElseThrow(() -> new RuntimeException("Scholarship not found"));

        if (trackerRepository.existsByStudentAndScholarship(user, scholarship)) {
            throw new IllegalStateException("You are already tracking this scholarship.");
        }

        ApplicationTracker tracker = ApplicationTracker.builder()
            .student(user)
            .scholarship(scholarship)
            .status(ApplicationStatus.RESEARCHING)
            .notes(request.getNotes())
            .build();

        ApplicationTracker saved = trackerRepository.save(tracker);
        log.info("User {} started tracking scholarship {}", user.getEmail(), scholarship.getId());

        return ApplicationTrackerResponse.from(saved);
    }

    /**
     * Updates the status and notes of an existing tracker.
     * Only the owning student can update their tracker.
     */
    @Transactional
    public ApplicationTrackerResponse updateTracker(Long trackerId, ApplicationTrackerRequest request) {
        User user = getCurrentUser();

        ApplicationTracker tracker = trackerRepository.findById(trackerId)
            .orElseThrow(() -> new RuntimeException("Tracker not found"));

        if (!tracker.getStudent().getId().equals(user.getId())) {
            throw new SecurityException("Access denied");
        }

        tracker.setStatus(request.getStatus() != null ? request.getStatus() : tracker.getStatus());
        tracker.setNotes(request.getNotes());

        // Mark submitted_at when transitioning to SUBMITTED
        if (request.getStatus() == ApplicationStatus.SUBMITTED && tracker.getSubmittedAt() == null) {
            tracker.setSubmittedAt(LocalDateTime.now());
        }

        // Mark awarded_at when transitioning to AWARDED
        if (request.getStatus() == ApplicationStatus.AWARDED && tracker.getAwardedAt() == null) {
            tracker.setAwardedAt(LocalDateTime.now());
        }

        ApplicationTracker updated = trackerRepository.save(tracker);
        log.info("User {} updated tracker {} to status {}", user.getEmail(), trackerId, updated.getStatus());

        return ApplicationTrackerResponse.from(updated);
    }

    /**
     * Deletes a tracker. Only the owning student can delete their tracker.
     */
    @Transactional
    public void deleteTracker(Long trackerId) {
        User user = getCurrentUser();

        ApplicationTracker tracker = trackerRepository.findById(trackerId)
            .orElseThrow(() -> new RuntimeException("Tracker not found"));

        if (!tracker.getStudent().getId().equals(user.getId())) {
            throw new SecurityException("Access denied");
        }

        trackerRepository.delete(tracker);
        log.info("User {} deleted tracker {}", user.getEmail(), trackerId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }
}
