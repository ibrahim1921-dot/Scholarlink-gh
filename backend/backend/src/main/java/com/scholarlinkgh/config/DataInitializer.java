package com.scholarlinkgh.config;

import com.scholarlinkgh.entity.Role;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the initial admin account on first startup if none exists.
 *
 * Credentials are loaded from environment variables (NEVER hardcoded).
 * If ADMIN_EMAIL or ADMIN_PASSWORD are not set, seeding is skipped and
 * a warning is logged.
 *
 * This runs once at startup and is a no-op if an admin already exists.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.bootstrap.email:}")
    private String adminEmail;

    @Value("${admin.bootstrap.password:}")
    private String adminPassword;

    @Value("${admin.bootstrap.username:ScholarLink Admin}")
    private String adminUsername;

    @Override
    public void run(String... args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            log.warn("Admin bootstrap skipped: ADMIN_BOOTSTRAP_EMAIL or "
                   + "ADMIN_BOOTSTRAP_PASSWORD not configured. "
                   + "Set these in application.properties to create the initial admin.");
            return;
        }

        boolean adminExists = userRepository.findByEmail(adminEmail.toLowerCase()).isPresent();
        if (adminExists) {
            log.info("Admin account already exists — skipping bootstrap.");
            return;
        }

        User admin = User.builder()
            .username(adminUsername)
            .email(adminEmail.toLowerCase().trim())
            .phoneNumber("N/A")
            .password(passwordEncoder.encode(adminPassword))
            .role(Role.ADMIN)
            .enabled(true)
            .accountNonLocked(true)
            .failedLoginAttempts(0)
            .build();

        userRepository.save(admin);
        log.info("Initial admin account created: {}", admin.getEmail());
    }
}
