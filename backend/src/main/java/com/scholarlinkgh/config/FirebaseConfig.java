package com.scholarlinkgh.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * FirebaseConfig — initialises the Firebase Admin SDK on application startup.
 *
 * FR-27-29: the SDK is required for FCM push notifications.
 *
 * Configuration:
 *   firebase.service-account-key-path = path to the service account JSON file
 *   firebase.project-id               = your Firebase project ID
 *
 * If the service account key file is not found (e.g. in dev/test),
 * Firebase is not initialised and a warning is logged.
 * Notification sends will silently fail without crashing the application.
 *
 * OWASP A02: the service account key file must NOT be committed to version control.
 *            Use environment variables or a secrets manager in production.
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account-key-path:}")
    private String serviceAccountKeyPath;

    @Value("${firebase.project-id:}")
    private String projectId;

    /**
     * Initialises the Firebase Admin SDK.
     * Safe to call multiple times — checks FirebaseApp.getApps() first.
     */
    @PostConstruct
    public void initializeFirebase() {
        if (serviceAccountKeyPath == null || serviceAccountKeyPath.isBlank()) {
            log.warn("Firebase not initialised: firebase.service-account-key-path is not set. " +
                     "Push notifications will be disabled.");
            return;
        }

        // Skip if already initialised (e.g. during test context restarts)
        if (!FirebaseApp.getApps().isEmpty()) {
            log.debug("Firebase already initialised — skipping.");
            return;
        }

        try (InputStream serviceAccount = new FileInputStream(serviceAccountKeyPath)) {
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setProjectId(projectId.isBlank() ? null : projectId)
                .build();

            FirebaseApp.initializeApp(options);
            log.info("Firebase Admin SDK initialised successfully for project: {}", projectId);

        } catch (IOException e) {
            log.error("Failed to initialise Firebase Admin SDK: {}. " +
                      "Verify the service account key file path is correct.", e.getMessage());
        }
    }
}
