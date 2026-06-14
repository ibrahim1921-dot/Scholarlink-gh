package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.AuthResponse;
import com.scholarlinkgh.dto.ForgotPasswordRequest;
import com.scholarlinkgh.dto.LoginRequest;
import com.scholarlinkgh.dto.RefreshTokenRequest;
import com.scholarlinkgh.dto.RegisterRequest;
import com.scholarlinkgh.dto.ResetPasswordRequest;
import com.scholarlinkgh.dto.VerifyOtpRequest;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication Controller — all auth endpoints.
 *
 * PUBLIC (no JWT required):
 *   POST /register          — create account
 *   POST /verify-otp        — verify email
 *   POST /resend-otp        — resend verification code
 *   POST /login             — get tokens
 *   POST /refresh           — exchange refresh token for new access token
 *   POST /forgot-password   — request reset link
 *   POST /reset-password    — set new password with reset token
 *
 * AUTHENTICATED:
 *   POST /logout            — revoke refresh tokens
 *
 * OWASP A04: @Valid triggers validation on every request body.
 * OWASP A07: error responses use generic messages — no stack traces.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/register
     * FR-01: create student account with name, email, phone, education level, password.
     * Account starts disabled until email is verified via OTP.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        ApiResponse response = authService.register(request);
        return response.isSuccess()
            ? ResponseEntity.status(HttpStatus.CREATED).body(response)
            : ResponseEntity.badRequest().body(response);
    }

    /**
     * POST /api/v1/auth/verify-otp
     * FR-03: verifies the 6-digit OTP sent to email at registration.
     * Activates the account on success.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {

        ApiResponse response = authService.verifyOtp(request);
        return response.isSuccess()
            ? ResponseEntity.ok(response)
            : ResponseEntity.badRequest().body(response);
    }

    /**
     * POST /api/v1/auth/resend-otp
     * Resends the verification code for unverified accounts.
     * Rate limited by RateLimitFilter (/verify-otp category, 5 per 30 min).
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse> resendOtp(
            @Valid @RequestBody ForgotPasswordRequest request) {

        ApiResponse response = authService.resendOtp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/login
     * FR-02: email + password login. Returns access and refresh tokens.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
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
     * Exchanges a valid refresh token for a new access token.
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
                    .message(ex.getMessage().contains("inactivity")
                        ? ex.getMessage()
                        : "Invalid or expired refresh token")
                    .build());
        }
    }

    /**
     * POST /api/v1/auth/logout
     * Requires: valid JWT access token.
     * Revokes all server-side refresh tokens for the current user.
     * The short-lived access token self-expires within 30 minutes.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(
            @AuthenticationPrincipal User user) {

        ApiResponse response = authService.logout(user);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/forgot-password
     * FR-07: sends a password reset link to the email if it exists.
     * Always returns success to prevent account enumeration (OWASP A07).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        ApiResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/reset-password
     * FR-07: validates the reset token and sets the new password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        ApiResponse response = authService.resetPassword(request);
        return response.isSuccess()
            ? ResponseEntity.ok(response)
            : ResponseEntity.badRequest().body(response);
    }
}
