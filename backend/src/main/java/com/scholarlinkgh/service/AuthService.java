package com.scholarlinkgh.service;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.AuthResponse;
import com.scholarlinkgh.dto.ForgotPasswordRequest;
import com.scholarlinkgh.dto.LoginRequest;
import com.scholarlinkgh.dto.RefreshTokenRequest;
import com.scholarlinkgh.dto.RegisterRequest;
import com.scholarlinkgh.dto.ResetPasswordRequest;
import com.scholarlinkgh.dto.VerifyOtpRequest;
import com.scholarlinkgh.entity.Role;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

/**
 * Authentication Service — registration, login, OTP verification,
 * token refresh, logout, forgot/reset password.
 *
 * OWASP A07: all auth failure messages are generic to prevent enumeration.
 * OWASP A02: passwords hashed with BCrypt cost 12; reset tokens with SHA-256.
 * OWASP A09: all auth events logged (success and failure); secrets never logged.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ── Auth policy — configurable via .env ──────────────────────────

    @Value("${auth.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${auth.lockout-minutes:15}")
    private int lockoutMinutes;

    @Value("${auth.reset-token-expiry-minutes:15}")
    private int resetTokenExpiryMinutes;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;
    private final UserActivityService userActivityService;
    private final AuthenticationManager authenticationManager;
    private final MailService mailService;

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Registers a new student account. Account starts disabled until OTP verified.
     *
     * FR-01: stores name, email, phone, education level, hashed password.
     * FR-03: account starts disabled; OTP sent to email for verification.
     */
    @Transactional
    public ApiResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            // OWASP A07: generic message — don't confirm whether email exists
            log.warn("Registration attempt with existing email: {}", request.getEmail());
            return ApiResponse.builder()
                .success(false)
                .message("Registration failed. Please check your details and try again.")
                .build();
        }

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail().toLowerCase().trim())
            .phoneNumber(request.getPhoneNumber())
            .password(passwordEncoder.encode(request.getPassword()))
            .educationLevel(request.getEducationLevel())
            .role(Role.STUDENT)
            // FR-03: disabled until email verified via OTP
            .enabled(false)
            .accountNonLocked(true)
            .failedLoginAttempts(0)
            .build();

        userRepository.save(user);

        // Send OTP email — user cannot log in until this is verified
        otpService.issueOtp(user);

        log.info("New student registered (pending OTP): {}", user.getEmail());

        return ApiResponse.builder()
            .success(true)
            .message("Registration successful. Please check your email for a 6-digit verification code.")
            .build();
    }

    // ── OTP Verification ──────────────────────────────────────────────────────

    /**
     * Verifies the OTP sent during registration. Enables the account on success.
     *
     * FR-03: account is activated only after correct OTP is submitted.
     */
    @Transactional
    public ApiResponse verifyOtp(VerifyOtpRequest request) {

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
            .orElse(null);

        // OWASP A07: same message whether email not found or OTP wrong
        if (user == null || !otpService.verifyOtp(user, request.getOtpCode())) {
            log.warn("OTP verification failed for: {}", request.getEmail());
            return ApiResponse.builder()
                .success(false)
                .message("Invalid or expired verification code.")
                .build();
        }

        if (user.isEnabled()) {
            return ApiResponse.builder()
                .success(false)
                .message("Account is already verified.")
                .build();
        }

        user.setEnabled(true);
        otpService.clearOtp(user);  // prevent OTP reuse

        log.info("Account verified via OTP: {}", user.getEmail());

        return ApiResponse.builder()
            .success(true)
            .message("Email verified successfully. You can now log in.")
            .build();
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    /**
     * Authenticates a student and returns JWT access + refresh tokens.
     * Tracks failed attempts and applies account lockout after 5 failures.
     *
     * FR-02: email + password login with JWT response.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {

        String email = request.getEmail().toLowerCase().trim();

        // Pre-check: if account is already locked, reject immediately
        userRepository.findByEmail(email).ifPresent(u -> {
            if (!u.isAccountNonLocked()) {
                log.warn("Login attempt on locked account: {}", email);
                throw new RuntimeException("Invalid credentials");
            }
        });

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );

        } catch (DisabledException ex) {
            log.warn("Login on unverified account: {}", email);
            throw new RuntimeException("Invalid credentials");

        } catch (LockedException ex) {
            log.warn("Login on locked account: {}", email);
            throw new RuntimeException("Invalid credentials");

        } catch (BadCredentialsException ex) {
            // Increment failed attempts; lock after threshold
            handleFailedLogin(email);
            throw new RuntimeException("Invalid credentials");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Reset failed attempts on successful login
        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
        }

        String rawRefreshToken = jwtService.generateRefreshToken(user);
        String accessToken = jwtService.generateAccessToken(user);

        // Persist refresh token hash for server-side revocation
        LocalDateTime refreshExpiry = LocalDateTime.now()
            .plusSeconds(jwtService.getRefreshTokenExpirySeconds());
        refreshTokenService.issue(user, rawRefreshToken, refreshExpiry);

        // Update last activity timestamp
        userActivityService.touch(user);

        log.info("Successful login: {}", user.getEmail());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(rawRefreshToken)
            .email(user.getEmail())
            .username(user.getUsername())
            .role(user.getRole().name())
            .build();
    }

    // ── Token Refresh ─────────────────────────────────────────────────────────

    /**
     * Issues a new access token given a valid, non-revoked refresh token.
     *
     * Security checks (ALL must pass):
     *   1. JWT signature valid
     *   2. Token type claim is "refresh" (not "access")
     *   3. Token not expired
     *   4. Token hash present and not revoked in database
     *   5. User not inactive for >30 minutes (force re-login)
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {

        String email = jwtService.extractEmail(request.getRefreshToken());

        if (email == null) {
            log.warn("Token refresh failed: could not extract email");
            throw new RuntimeException("Invalid refresh token");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> {
                log.warn("Token refresh failed: user not found for {}", email);
                return new RuntimeException("Invalid refresh token");
            });

        // Check 1 & 2 & 3: JWT signature, type=refresh, not expired
        if (!jwtService.isTokenValid(request.getRefreshToken(), user, "refresh")) {
            log.warn("Token refresh failed: JWT invalid/expired/wrong-type for {}", email);
            throw new RuntimeException("Invalid or expired refresh token");
        }

        // Check 4: server-side revocation
        if (!refreshTokenService.matchesActiveToken(user, request.getRefreshToken())) {
            log.warn("Token refresh failed: token revoked or not found in DB for {}", email);
            // Possible token theft — revoke all tokens for safety
            refreshTokenService.revokeAll(user);
            throw new RuntimeException("Invalid or expired refresh token");
        }

        // Check 5: inactivity timeout — force full re-login if inactive
        if (userActivityService.isInactive(user)) {
            log.warn("Token refresh rejected: inactivity timeout for {}", email);
            refreshTokenService.revokeAll(user);
            throw new RuntimeException("Session expired due to inactivity. Please log in again.");
        }

        String newAccessToken = jwtService.generateAccessToken(user);

        // Update last activity on each valid refresh
        userActivityService.touch(user);

        log.info("Access token refreshed for: {}", email);

        return AuthResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(request.getRefreshToken())
            .email(user.getEmail())
            .username(user.getUsername())
            .role(user.getRole().name())
            .build();
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    /**
     * Revokes all refresh tokens for the authenticated user.
     * The access token is short-lived (30 min) and self-expires.
     */
    @Transactional
    public ApiResponse logout(User user) {
        refreshTokenService.revokeAll(user);
        log.info("User logged out: {}", user.getEmail());
        return ApiResponse.builder()
            .success(true)
            .message("Logged out successfully.")
            .build();
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    /**
     * Sends a password reset link to the user's email if the account exists.
     *
     * OWASP A07: always returns the same success message whether or not
     * the email is registered — prevents account enumeration.
     */
    @Transactional
    public ApiResponse forgotPassword(ForgotPasswordRequest request) {

        // Always return success to prevent email enumeration
        String email = request.getEmail().toLowerCase().trim();
        String genericSuccess = "If an account with that email exists, a password reset link has been sent.";

        userRepository.findByEmail(email).ifPresent(user -> {
            String rawToken = generateSecureToken();

            user.setPasswordResetToken(hashToken(rawToken));
            user.setPasswordResetTokenExpiresAt(
                LocalDateTime.now().plusMinutes(resetTokenExpiryMinutes)
            );
            userRepository.save(user);

            sendPasswordResetEmail(user.getEmail(), rawToken);
            log.info("Password reset token issued for: {}", email);
        });

        return ApiResponse.builder()
            .success(true)
            .message(genericSuccess)
            .build();
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    /**
     * Validates the reset token and sets a new hashed password.
     */
    @Transactional
    public ApiResponse resetPassword(ResetPasswordRequest request) {

        String tokenHash = hashToken(request.getToken());

        User user = userRepository.findByPasswordResetToken(tokenHash)
            .orElse(null);

        if (user == null || user.getPasswordResetTokenExpiresAt() == null
                || LocalDateTime.now().isAfter(user.getPasswordResetTokenExpiresAt())) {
            log.warn("Password reset failed: invalid or expired token");
            return ApiResponse.builder()
                .success(false)
                .message("Invalid or expired password reset link.")
                .build();
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // Revoke all existing refresh tokens — force fresh login
        refreshTokenService.revokeAll(user);

        log.info("Password reset successful for: {}", user.getEmail());

        return ApiResponse.builder()
            .success(true)
            .message("Password reset successfully. Please log in with your new password.")
            .build();
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────

    /**
     * Resends OTP for unverified accounts. Rate limiting on /verify-otp
     * path in RateLimitFilter applies here.
     *
     * OWASP A07: same message whether account exists or not.
     */
    @Transactional
    public ApiResponse resendOtp(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        userRepository.findByEmail(email).ifPresent(user -> {
            if (!user.isEnabled()) {
                otpService.issueOtp(user);
                log.info("OTP resent for: {}", email);
            }
        });

        return ApiResponse.builder()
            .success(true)
            .message("If your account is pending verification, a new code has been sent.")
            .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void handleFailedLogin(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= maxFailedAttempts) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
                log.warn("Account locked after {} failed attempts: {}", attempts, email);
            }

            userRepository.save(user);
        });
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private void sendPasswordResetEmail(String email, String rawToken) {
        mailService.sendPasswordResetEmail(email, rawToken);
    }
}
