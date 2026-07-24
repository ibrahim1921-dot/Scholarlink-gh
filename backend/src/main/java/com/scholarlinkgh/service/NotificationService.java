package com.scholarlinkgh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.StudentProfile;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.ScholarshipMatchRepository;
import com.scholarlinkgh.repository.ScholarshipRepository;
import com.scholarlinkgh.repository.StudentProfileRepository;
import com.scholarlinkgh.repository.NotificationRepository;
import com.scholarlinkgh.entity.Notification;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * NotificationService — sends push notifications via the Expo Push API.
 *
 * FR-27: deadline alerts at 30, 14, 7, and 1 days before scholarship deadline.
 * FR-28: immediate notification when a new scholarship matches the student's profile.
 * FR-29: weekly digest every Monday at 8am Ghana time.
 *
 * The student must have a valid Expo push token stored in their StudentProfile.
 * If the token is missing, the notification is silently skipped and logged.
 *
 * OWASP A02: push tokens are stored per-profile and never logged in full.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private static final MediaType JSON_MEDIA_TYPE = MediaType.parse("application/json; charset=utf-8");

    private final StudentProfileRepository studentProfileRepository;
    private final ScholarshipRepository scholarshipRepository;
    private final ScholarshipMatchRepository scholarshipMatchRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private OkHttpClient httpClient;

    @PostConstruct
    void buildHttpClient() {
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build();
    }

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
    @Transactional
    public void sendDeadlineAlert(User user, Long scholarshipId, int daysRemaining) {
        Scholarship scholarship = scholarshipRepository.findById(scholarshipId).orElse(null);
        if (scholarship == null) return;

        // Deduplicate
        java.time.LocalDateTime threshold = java.time.LocalDateTime.now().minusHours(24);
        if (notificationRepository.existsByUserAndTypeAndRelatedScholarshipIdAndCreatedAtAfter(user, "DEADLINE_ALERT", scholarshipId, threshold)) {
            return;
        }

        String title = "⏰ Scholarship Deadline Approaching";
        String body = String.format(
            "%s closes in %d %s. Don't miss your chance!",
            scholarship.getName(),
            daysRemaining,
            daysRemaining == 1 ? "day" : "days"
        );

        Notification notification = Notification.builder()
            .user(user)
            .type("DEADLINE_ALERT")
            .title(title)
            .body(body)
            .relatedScholarshipId(scholarshipId)
            .build();
        notificationRepository.save(notification);

        String pushToken = getPushToken(user);
        if (pushToken != null) {
            sendExpoPushNotification(pushToken, title, body, scholarshipId.toString(), "DEADLINE_ALERT");
        }
        
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
    @Transactional
    public void sendNewMatchAlert(User user, Long scholarshipId) {
        Scholarship scholarship = scholarshipRepository.findById(scholarshipId).orElse(null);
        if (scholarship == null) return;

        // Deduplicate
        java.time.LocalDateTime threshold = java.time.LocalDateTime.now().minusHours(24);
        if (notificationRepository.existsByUserAndTypeAndRelatedScholarshipIdAndCreatedAtAfter(user, "NEW_MATCH", scholarshipId, threshold)) {
            return;
        }

        String title = "🎓 New Scholarship Match!";
        String body = String.format(
            "You're a great match for %s by %s. Check it out!",
            scholarship.getName(),
            scholarship.getProvider()
        );

        Notification notification = Notification.builder()
            .user(user)
            .type("NEW_MATCH")
            .title(title)
            .body(body)
            .relatedScholarshipId(scholarshipId)
            .build();
        notificationRepository.save(notification);

        String pushToken = getPushToken(user);
        if (pushToken != null) {
            sendExpoPushNotification(pushToken, title, body, scholarshipId.toString(), "NEW_MATCH");
        }

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
    @Transactional
    public void sendWeeklyDigest(User user) {
        // Deduplicate
        java.time.LocalDateTime threshold = java.time.LocalDateTime.now().minusDays(6);
        if (notificationRepository.existsByUserAndTypeAndCreatedAtAfter(user, "WEEKLY_DIGEST", threshold)) {
            return;
        }

        // Count top matches
        List<?> topMatches = scholarshipMatchRepository.findByStudentOrderByMatchScoreDesc(user)
            .stream()
            .limit(3)
            .toList();

        // Count scholarships expiring within 30 days
        LocalDate cutoff = LocalDate.now().plusDays(30);
        long upcomingDeadlines = scholarshipRepository
            .findAllFiltered(null, null, null, cutoff, null, null,
                org.springframework.data.domain.PageRequest.of(0, 100))
            .getTotalElements();

        String title = "📋 Your Weekly ScholarLink Digest";
        String body = String.format(
            "You have %d top scholarship matches and %d deadlines in the next 30 days.",
            topMatches.size(),
            upcomingDeadlines
        );

        Notification notification = Notification.builder()
            .user(user)
            .type("WEEKLY_DIGEST")
            .title(title)
            .body(body)
            .build();
        notificationRepository.save(notification);

        String pushToken = getPushToken(user);
        if (pushToken != null) {
            sendExpoPushNotification(pushToken, title, body, null, "WEEKLY_DIGEST");
        }
        
        log.info("Weekly digest sent to user {}", user.getEmail());
    }

    // ── Generic notification helper ───────────────────────────────────────────

    /**
     * Sends a custom push notification to any student with a registered push token.
     *
     * @param user             the recipient
     * @param title            notification title
     * @param body             notification body text
     * @param notificationType a tag describing the notification type
     */
    @Transactional
    public void sendCustomNotification(User user, String title, String body, String notificationType) {
        Notification notification = Notification.builder()
            .user(user)
            .type(notificationType)
            .title(title)
            .body(body)
            .build();
        notificationRepository.save(notification);

        String pushToken = getPushToken(user);
        if (pushToken != null) {
            sendExpoPushNotification(pushToken, title, body, null, notificationType);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Retrieves the Expo push token for a user.
     * Returns null and logs a warning if the token is missing.
     */
    private String getPushToken(User user) {
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null || profile.getExpoPushToken() == null || profile.getExpoPushToken().isBlank()) {
            log.debug("No push token for user {} — skipping notification", user.getEmail());
            return null;
        }
        return profile.getExpoPushToken();
    }

    /**
     * Dispatches a push notification via the Expo Push API.
     *
     * POST https://exp.host/--/api/v2/push/send
     *
     * Errors are caught and logged; they must not crash the scheduler.
     * Per-token errors (e.g. DeviceNotRegistered) are logged for cleanup.
     */
    private void sendExpoPushNotification(
            String pushToken, String title, String body,
            String entityId, String notificationType) {
        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("to", pushToken);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");

            ObjectNode data = payload.putObject("data");
            data.put("type", notificationType);
            if (entityId != null) {
                data.put("scholarshipId", entityId);
            }

            String jsonBody = objectMapper.writeValueAsString(payload);

            Request request = new Request.Builder()
                .url(EXPO_PUSH_URL)
                .post(RequestBody.create(jsonBody, JSON_MEDIA_TYPE))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "";
                    log.warn("Expo Push API error: HTTP {} — {} — {}",
                        response.code(), response.message(), errorBody);
                    return;
                }

                // Parse the response to check for per-token errors
                if (response.body() != null) {
                    String responseBody = response.body().string();
                    handleExpoResponse(responseBody, notificationType);
                }
            }

        } catch (IOException e) {
            // Never propagate push failures — notifications are best-effort
            log.warn("Failed to send Expo push notification (type={}): {}", notificationType, e.getMessage());
        }
    }

    /**
     * Parses the Expo Push API response and logs any per-ticket errors.
     *
     * Response format:
     * { "data": [{ "status": "ok", "id": "..." }] }
     * or
     * { "data": [{ "status": "error", "message": "...", "details": { "error": "DeviceNotRegistered" } }] }
     */
    private void handleExpoResponse(String responseBody, String notificationType) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode dataArray = root.path("data");

            if (dataArray.isArray()) {
                for (JsonNode ticket : dataArray) {
                    String status = ticket.path("status").asText("");
                    if ("error".equals(status)) {
                        String message = ticket.path("message").asText("Unknown error");
                        String errorType = ticket.path("details").path("error").asText("");
                        log.warn("Expo push ticket error (type={}): {} — {}",
                            notificationType, errorType, message);

                        if ("DeviceNotRegistered".equals(errorType)) {
                            log.info("Device token is no longer valid — "
                                + "consider removing it from the database");
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Could not parse Expo push response: {}", e.getMessage());
        }
    }
}
