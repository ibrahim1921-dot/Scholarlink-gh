package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.*;
import com.scholarlinkgh.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller — exposes all auth endpoints.
 *
 * All endpoints here are PUBLIC — listed in SecurityConfig.permitAll().
 * No JWT token required to reach these endpoints.
 *
 * OWASP A04: @Valid triggers input validation on every request body.
 * If validation fails, Spring returns 400 Bad Request automatically
 * with field-level error messages — the service layer is never reached.
 *
 * OWASP A07: error responses use generic messages only.
 * Stack traces never reach the client.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/register
     *
     * Registers a new student account.
     * FR-01: accepts name, email, phone, education level, password.
     *
     * Returns 201 Created on success.
     * Returns 400 Bad Request if validation fails.
     * Returns 200 with success=false if email already exists.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        ApiResponse response = authService.register(request);

        // Return 201 if successful, 400 if email already taken
        if (response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * POST /api/v1/auth/login
     *
     * Authenticates a student and returns JWT tokens.
     * FR-02: email + password login with JWT response.
     *
     * Returns 200 OK with access + refresh tokens on success.
     * Returns 401 Unauthorized on invalid credentials.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);

        } catch (RuntimeException ex) {
            // OWASP A07: never reveal which field was wrong
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.builder()
                    .success(false)
                    .message("Invalid credentials")
                    .build());
        }
    }

    /**
     * POST /api/v1/auth/refresh
     *
     * Accepts a valid refresh token and returns a new access token.
     * Called automatically by the mobile app when the access token expires.
     *
     * Returns 200 OK with new access token on success.
     * Returns 401 Unauthorized if refresh token is invalid or expired.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {

        try {
            AuthResponse response = authService.refresh(request);
            return ResponseEntity.ok(response);

        } catch (RuntimeException ex) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.builder()
                    .success(false)
                    .message("Invalid or expired refresh token")
                    .build());
        }
    }
}