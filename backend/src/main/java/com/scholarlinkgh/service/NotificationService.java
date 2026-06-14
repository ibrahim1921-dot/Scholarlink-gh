package com.scholarlinkgh.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.StudentProfile;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.ScholarshipMatchRepository;
import com.scholarlinkgh.repository.ScholarshipRepository;
import com.scholarlinkgh.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * NotificationService — sends Firebase Cloud Messaging (FCM) push notifications.
 *
 * FR-27: deadline alerts at 30, 14, 7, and 1 days before scholarship deadline.
 * FR-28: immediate notification when a new scholarship matches the student's profile.
 * FR-29: weekly digest every Monday at 8am Ghana time.
 *
 * The student must have a valid FCM token stored in their StudentProfile.
 * If the token is missing, the notification is silently skipped and logged.
 *
 * OWASP A02: FCM tokens are stored per-profile and never logged in full.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final StudentProfileRepository studentProfileRepository;
    private final ScholarshipRepository scholarshipRepository;
    private final ScholarshipMatchRepository scholarshipMatchRepository;

    // ── FR-27: Deadline Alerts ────────────────────────────────────────────────

    /**
     * Sends a deadline reminder push notification to the student.
     *
     * Called by NotificationScheduler at 30, 14, 7, and 1 days before the deadline.
     *
     * @param user           the student to notify
     * @param scholarshipId  the scholarship approaching its deadline
     * @param daysRemaining  number of days until the deadline
     */
    @Transactional(readOnly = true)
    public void sendDeadlineAlert(User user, Long scholarshipId, int daysRemaining) {
        String fcmToken = getFcmToken(user);
        if (fcmToken == null) return;

        Scholarship scholarship = scholarshipRepository.findById(scholarshipId).orElse(null);
        if (scholarship == null) return;

        String title = "⏰ Scholarship Deadline Approaching";
        String body = String.format(
            "%s closes in %d %s. Don't miss your chance!",
            scholarship.getName(),
            daysRemaining,
            daysRemaining == 1 ? "day" : "days"
        );

        sendFcmNotification(fcmToken, title, body, scholarshipId.toString(), "DEADLINE_ALERT");
        log.info("Deadline alert sent to user {} for scholarship {} ({} days)", 
                 user.getEmail(), scholarshipId, daysRemaining);
    }

    // ── FR-28: New Match Alert ────────────────────────────────────────────────

    /**
     * Sends an immediate notification when a newly added scholarship matches
     * the student's profile.
     *
     * @param user           the student to notify
     * @param scholarshipId  the newly matched scholarship
     */
    @Transactional(readOnly = true)
    public void sendNewMatchAlert(User user, Long scholarshipId) {
        String fcmToken = getFcmToken(user);
        if (fcmToken == null) return;

        Scholarship scholarship = scholarshipRepository.findById(scholarshipId).orElse(null);
        if (scholarship == null) return;

        String title = "🎓 New Scholarship Match!";
        String body = String.format(
            "You're a great match for %s by %s. Check it out!",
            scholarship.getName(),
            scholarship.getProvider()
        );

        sendFcmNotification(fcmToken, title, body, scholarshipId.toString(), "NEW_MATCH");
        log.info("New match alert sent to user {} for scholarship {}", user.getEmail(), scholarshipId);
    }

    // ── FR-29: Weekly Digest ──────────────────────────────────────────────────

    /**
     * Sends a weekly summary notification highlighting the student's top matches
     * and any upcoming deadlines.
     *
     * Called by NotificationScheduler every Monday at 8am Ghana time (GMT/UTC).
     *
     * @param user the student to notify
     */
    @Transactional(readOnly = true)
    public void sendWeeklyDigest(User user) {
        String fcmToken = getFcmToken(user);
        if (fcmToken == null) return;

        // Count top matches
        List<?> topMatches = scholarshipMatchRepository.findByStudentOrderByMatchScoreDesc(user)
            .stream()
            .limit(3)
            .toList();

        // Count scholarships expiring within 30 days
        LocalDate cutoff = LocalDate.now().plusDays(30);
        long upcomingDeadlines = scholarshipRepository
            .findAllFiltered(null, null, null, cutoff, 
                org.springframework.data.domain.PageRequest.of(0, 100))
            .getTotalElements();

        String title = "📋 Your Weekly ScholarLink Digest";
        String body = String.format(
            "You have %d top scholarship matches and %d deadlines in the next 30 days.",
            topMatches.size(),
            upcomingDeadlines
        );

        sendFcmNotification(fcmToken, title, body, null, "WEEKLY_DIGEST");
        log.info("Weekly digest sent to user {}", user.getEmail());
    }

    // ── Generic notification helper ───────────────────────────────────────────

    /**
     * Sends a custom push notification to any student with a registered FCM token.
     *
     * @param user             the recipient
     * @param title            notification title
     * @param body             notification body text
     * @param notificationType a tag describing the notification type
     */
    public void sendCustomNotification(User user, String title, String body, String notificationType) {
        String fcmToken = getFcmToken(user);
        if (fcmToken == null) return;
        sendFcmNotification(fcmToken, title, body, null, notificationType);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Retrieves the FCM token for a user.
     * Returns null and logs a warning if the token is missing.
     */
    private String getFcmToken(User user) {
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null || profile.getFcmToken() == null || profile.getFcmToken().isBlank()) {
            log.debug("No FCM token for user {} — skipping notification", user.getEmail());
            return null;
        }
        return profile.getFcmToken();
    }

    /**
     * Dispatches the FCM message via the Firebase Admin SDK.
     * Errors are caught and logged; they must not crash the scheduler.
     */
    private void sendFcmNotification(
            String fcmToken, String title, String body,
            String entityId, String notificationType) {
        try {
            Message.Builder messageBuilder = Message.builder()
                .setToken(fcmToken)
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .putData("type", notificationType);

            if (entityId != null) {
                messageBuilder.putData("entity_id", entityId);
            }

            String messageId = FirebaseMessaging.getInstance().send(messageBuilder.build());
            log.debug("FCM message sent: {} | type={}", messageId, notificationType);

        } catch (Exception e) {
            // Never propagate FCM failures — notifications are best-effort
            log.warn("Failed to send FCM notification (type={}): {}", notificationType, e.getMessage());
        }
    }
}
