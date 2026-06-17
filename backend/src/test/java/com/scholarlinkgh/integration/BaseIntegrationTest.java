package com.scholarlinkgh.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scholarlinkgh.entity.Role;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.UserRepository;
import com.scholarlinkgh.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base class for all integration tests.
 *
 * Boots the full Spring context with an H2 in-memory database,
 * provides MockMvc for HTTP simulation, and pre-creates STUDENT
 * and ADMIN users with valid JWT tokens for authenticated requests.
 *
 * Every subclass inherits @Transactional, so the database is rolled
 * back after each test — tests are fully isolated.
 */
@SpringBootTest(classes = com.scholarlinkgh.backend.BackendApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles({"test", "dev"})
@Transactional
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected JwtService jwtService;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    // ── Pre-created users ─────────────────────────────────────────────────────

    protected User studentUser;
    protected User adminUser;

    // ── JWT tokens for authenticated requests ────────────────────────────────

    protected String studentToken;
    protected String adminToken;

    // ── Constants ─────────────────────────────────────────────────────────────

    protected static final String STUDENT_EMAIL = "student@test.com";
    protected static final String ADMIN_EMAIL = "admin@test.com";
    protected static final String TEST_PASSWORD = "Test@1234";

    @BeforeEach
    void setUpBaseTestData() {
        // Create student user
        studentUser = userRepository.findByEmail(STUDENT_EMAIL).orElseGet(() -> {
            User user = User.builder()
                .username("Test Student")
                .email(STUDENT_EMAIL)
                .phoneNumber("+233501234567")
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .role(Role.STUDENT)
                .enabled(true)
                .accountNonLocked(true)
                .failedLoginAttempts(0)
                .build();
            return userRepository.save(user);
        });

        // Create admin user
        adminUser = userRepository.findByEmail(ADMIN_EMAIL).orElseGet(() -> {
            User user = User.builder()
                .username("Test Admin")
                .email(ADMIN_EMAIL)
                .phoneNumber("+233509876543")
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .role(Role.ADMIN)
                .enabled(true)
                .accountNonLocked(true)
                .failedLoginAttempts(0)
                .build();
            return userRepository.save(user);
        });

        // Generate JWT access tokens
        studentToken = jwtService.generateAccessToken(studentUser);
        adminToken = jwtService.generateAccessToken(adminUser);
    }

    // ── Helper: Authorization header value ─────────────────────────────────────

    protected String bearer(String token) {
        return "Bearer " + token;
    }
}
