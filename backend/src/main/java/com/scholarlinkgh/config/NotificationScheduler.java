package com.scholarlinkgh.config;

import com.scholarlinkgh.entity.ApplicationTracker;
import com.scholarlinkgh.entity.Role;
import com.scholarlinkgh.entity.ScholarshipMatch;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.ApplicationTrackerRepository;
import com.scholarlinkgh.repository.ScholarshipMatchRepository;
import com.scholarlinkgh.repository.UserRepository;
import com.scholarlinkgh.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

/**
 * NotificationScheduler — runs scheduled notification tasks.
 *
 * FR-27: deadline alerts at 30, 14, 7, and 1 days before scholarship deadline.
 *        Runs daily at 8am GMT (Ghana time is GMT+0).
 *
 * FR-29: weekly digest every Monday at 8am GMT.
 *
 * The scheduler reads deadline_reminders_sent on each ApplicationTracker
 * to avoid sending duplicate alerts for the same milestone.
 *
 * OWASP: scheduled jobs run with no HTTP context — exceptions must be caught
 *        internally to prevent the scheduler from crashing.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private static final int[] DEADLINE_MILESTONES_DAYS = {30, 14, 7, 1};

    private final ApplicationTrackerRepository trackerRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ScholarshipMatchRepository matchRepository;

    // ── FR-27: Daily Deadline Alerts ──────────────────────────────────────────

    /**
     * Runs daily at 8am GMT.
     *
     * For each active application tracker, checks if the scholarship deadline
     * is exactly 30, 14, 7, or 1 days away. If so, and if the alert for that
     * milestone has not been sent yet, dispatches an FCM push notification.
     *
     * FR-27: deadline alerts at 30, 14, 7, and 1 days.
     */
    @Scheduled(cron = "0 0 8 * * ?", zone = "GMT")
    @Transactional
    public void sendDeadlineAlerts() {
        log.info("Running daily deadline alert scheduler");

        for (int days : DEADLINE_MILESTONES_DAYS) {
            try {
                List<ApplicationTracker> trackers =
                    trackerRepository.findTrackersWithDeadlineBetween(
                        LocalDate.now(), LocalDate.now().plusDays(days));

                for (ApplicationTracker tracker : trackers) {
                    processDeadlineAlert(tracker, days);
                }

                log.info("Processed {} trackers for {}-day deadline milestone", trackers.size(), days);

            } catch (Exception e) {
                log.error("Error processing {}-day deadline alerts: {}", days, e.getMessage());
            }
        }
    }

    /**
     * Sends a deadline alert for a tracker if it hasn't been sent for this milestone.
     * Updates deadline_reminders_sent to prevent duplicates.
     */
    private void processDeadlineAlert(ApplicationTracker tracker, int days) {
        // Check if this milestone has already been dispatched
        String sentFlags = tracker.getDeadlineRemindersSent();
        String dayStr = String.valueOf(days);

        if (sentFlags != null && Arrays.asList(sentFlags.split(",")).contains(dayStr)) {
            return; // Already sent for this milestone
        }

        // Check actual days remaining (milestone must be ≤ days away)
        Long daysRemaining = tracker.getDeadlineCountdown();
        if (daysRemaining == null || daysRemaining > days || daysRemaining < 0) {
            return;
        }

        try {
            notificationService.sendDeadlineAlert(
                tracker.getStudent(),
                tracker.getScholarship().getId(),
                daysRemaining.intValue()
            );

            // Record that this milestone has been sent
            String newFlags = (sentFlags == null || sentFlags.isBlank())
                ? dayStr : sentFlags + "," + dayStr;
            tracker.setDeadlineRemindersSent(newFlags);
            trackerRepository.save(tracker);

        } catch (Exception e) {
            log.warn("Failed to send {}-day deadline alert for tracker {}: {}",
                     days, tracker.getId(), e.getMessage());
        }
    }

    // ── FR-29: Weekly Digest ──────────────────────────────────────────────────

    /**
     * Runs every Monday at 8am GMT.
     *
     * Sends a weekly digest to every student who has at least one active
     * scholarship tracker or match. The digest summarises top matches
     * and upcoming deadlines.
     *
     * FR-29: weekly digest every Monday at 8am Ghana time (GMT).
     */
    @Scheduled(cron = "0 0 8 * * MON", zone = "GMT")
    @Transactional(readOnly = true)
    public void sendWeeklyDigests() {
        log.info("Running weekly digest scheduler");

        try {
            // Send to all enabled students
            List<User> students = userRepository.findAll().stream()
                .filter(u -> u.isEnabled() && u.getRole() == Role.STUDENT)
                .toList();

            for (User student : students) {
                try {
                    notificationService.sendWeeklyDigest(student);
                } catch (Exception e) {
                    log.warn("Failed to send weekly digest to {}: {}", student.getEmail(), e.getMessage());
                }
            }

            log.info("Weekly digest sent to {} students", students.size());

        } catch (Exception e) {
            log.error("Weekly digest scheduler failed: {}", e.getMessage());
        }
    }

    // ── Cleanup: stale match records ─────────────────────────────────────────

    /**
     * Runs daily at 2am GMT.
     *
     * Deletes scholarship match records older than 48 hours to prevent
     * unbounded table growth. Fresh matches are regenerated on next request.
     */
    @Scheduled(cron = "0 0 2 * * ?", zone = "GMT")
    @Transactional
    public void cleanupStaleMatches() {
        try {
            matchRepository.deleteOlderThan(java.time.LocalDateTime.now().minusHours(48));
            log.info("Stale scholarship match records cleaned up");
        } catch (Exception e) {
            log.error("Stale match cleanup failed: {}", e.getMessage());
        }
    }
}
