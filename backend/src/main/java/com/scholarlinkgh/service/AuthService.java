package com.scholarlinkgh.service;

import com.scholarlinkgh.dto.*;
import com.scholarlinkgh.entity.Role;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication Service — handles all auth business logic.
 *
 * OWASP A07 — Identification and Authentication Failures:
 *   - Passwords are BCrypt hashed before storage — never plain text.
 *   - Generic error messages on login failure — attacker learns nothing.
 *   - Disabled accounts (unverified) cannot log in.
 *   - Duplicate email registrations are rejected cleanly.
 *
 * OWASP A09 — Security Logging:
 *   - All auth events logged internally (success and failure).
 *   - Raw passwords and tokens NEVER logged.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Registers a new student account.
     *
     * Flow:
     *   1. Check email is not already taken
     *   2. Hash the password
     *   3. Save the user (enabled = true for now, OTP added later)
     *   4. Return success message
     *
     * FR-01: stores name, email, phone, education level, password.
     * OWASP A07: password hashed with BCrypt cost 12 before any DB write.
     * OWASP A03: input already validated by @Valid in the controller.
     */
    @Transactional
    public ApiResponse register(RegisterRequest request) {

        // Step 1: Check if email is already registered
        // OWASP A07: generic message — don't confirm whether email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration attempt with already registered email: {}",
                request.getEmail());
            return ApiResponse.builder()
                .success(false)
                .message("Registration failed. Please check your details and try again.")
                .build();
        }

        // Step 2: Build the user entity
        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail().toLowerCase().trim())  // normalise email
            .phoneNumber(request.getPhoneNumber())
            // OWASP A02: BCrypt hash — password never stored plain text
            .password(passwordEncoder.encode(request.getPassword()))
            .role(Role.STUDENT)
            // enabled = true for now — will be false when OTP is added
            .enabled(true)
            .accountNonLocked(true)
            .build();

        // Step 3: Save to database
        userRepository.save(user);

        log.info("New student registered successfully: {}", user.getEmail());

        // Step 4: Return success
        // OWASP A07: don't return the user object — no internal data exposure
        return ApiResponse.builder()
            .success(true)
            .message("Registration successful. You can now log in.")
            .build();
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    /**
     * Authenticates a student and returns JWT tokens.
     *
     * Flow:
     *   1. Spring Security verifies email + password via AuthenticationManager
     *   2. Load the user from database
     *   3. Generate access token + refresh token
     *   4. Return both tokens with minimal user info
     *
     * OWASP A07:
     *   - AuthenticationManager handles credential checking internally.
     *   - BadCredentialsException and DisabledException caught and returned
     *     as the same generic message — attacker cannot tell which failed.
     *   - Raw password never touched directly in this method.
     */
    public AuthResponse login(LoginRequest request) {
        try {
            // Step 1: Let Spring Security verify credentials
            // This calls UserDetailsService.loadUserByUsername() internally
            // and checks the BCrypt hash — throws if wrong
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail().toLowerCase().trim(),
                    request.getPassword()
                )
            );

        } catch (DisabledException ex) {
            // Account exists but is not verified
            // OWASP A07: same message as wrong password — no enumeration hint
            log.warn("Login attempt on disabled account: {}", request.getEmail());
            throw new RuntimeException("Invalid credentials");

        } catch (BadCredentialsException ex) {
            // Wrong email or wrong password
            log.warn("Failed login attempt for: {}", request.getEmail());
            throw new RuntimeException("Invalid credentials");
        }

        // Step 2: Load user from database
        User user = userRepository.findByEmail(
            request.getEmail().toLowerCase().trim()
        ).orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Step 3: Generate tokens
        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("Successful login for: {}", user.getEmail());

        // Step 4: Return tokens + minimal user info
        // OWASP A07: never return password, OTP, or internal IDs
        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .email(user.getEmail())
            .username(user.getUsername())
            .role(user.getRole().name())
            .build();
    }

    // ── Token Refresh ─────────────────────────────────────────────────────────

    /**
     * Accepts a valid refresh token and returns a new access token.
     *
     * Flow:
     *   1. Extract email from refresh token
     *   2. Load user from database
     *   3. Validate the refresh token belongs to this user and is not expired
     *   4. Issue a new access token
     *
     * OWASP A07:
     *   - Refresh token is fully validated before issuing new access token.
     *   - If token is invalid or expired, generic error returned.
     *   - Only the access token is rotated — refresh token stays the same
     *     until it expires naturally (7 days).
     */
    public AuthResponse refresh(RefreshTokenRequest request) {

        // Step 1: Extract email from the refresh token
        String email = jwtService.extractEmail(request.getRefreshToken());

        if (email == null) {
            log.warn("Token refresh failed: could not extract email from token");
            throw new RuntimeException("Invalid refresh token");
        }

        // Step 2: Load user from database
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> {
                log.warn("Token refresh failed: user not found for email {}", email);
                return new RuntimeException("Invalid refresh token");
            });

        // Step 3: Validate the refresh token
        if (!jwtService.isTokenValid(request.getRefreshToken(), user)) {
            log.warn("Token refresh failed: invalid or expired token for {}", email);
            throw new RuntimeException("Invalid or expired refresh token");
        }

        // Step 4: Issue a new access token only
        String newAccessToken = jwtService.generateAccessToken(user);

        log.info("Access token refreshed for: {}", email);

        return AuthResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(request.getRefreshToken()) // same refresh token
            .email(user.getEmail())
            .username(user.getUsername())
            .role(user.getRole().name())
            .build();
    }
}