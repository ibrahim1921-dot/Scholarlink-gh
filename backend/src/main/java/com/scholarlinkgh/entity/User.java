package com.scholarlinkgh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * User entity — implements Spring Security's UserDetails.
 *
 * OWASP A02: password stored as BCrypt hash — never plain text.
 * OWASP A07: enabled flag blocks unverified accounts from logging in.
 *            accountNonLocked flag supports brute-force lockout policy.
 * OWASP A04: role field enforces role-based access control (FR-05).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users",
    indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true)
    }
)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Display name — not used for login.
     * FR-01: required at registration.
     */
    @Column(nullable = false, length = 100)
    private String username;

    /**
     * Email — the login identifier.
     * FR-01: required at registration.
     */
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /**
     * Phone number — required by FR-01.
     * Stored as string to support international formats.
     */
    @Column(nullable = false, length = 20)
    private String phoneNumber;

    /**
     * BCrypt-hashed password — NEVER plain text.
     */
    @Column(nullable = false)
    private String password;

    /**
     * Role — STUDENT or ADMIN.
     * FR-05: role-based access control.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /**
     * Whether the user has verified their email via OTP.
     * FR-03: unverified accounts cannot log in.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = false;

    /**
     * Account lock flag — supports brute-force lockout.
     * OWASP A07.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean accountNonLocked = true;

    /**
     * OTP code sent to the user's email during registration.
     * FR-03: 6-digit code, expires after 10 minutes.
     * Cleared after successful verification.
     */
    @Column(length = 64)
    private String otpCode;

    /**
     * When the OTP expires.
     * Any verification attempt after this time is rejected.
     */
    private LocalDateTime otpExpiresAt;

    /**
     * Education level — determines which scholarships are shown.
     * FR-08: SHS_GRADUATE or UNIVERSITY_GRADUATE.
     */
    @Column(length = 30)
    private String educationLevel;

    /**
     * Password reset token (SHA-256 hex). Null when no reset is pending.
     */
    @Column(length = 64)
    private String passwordResetToken;

    /**
     * When the password reset token expires (default 15 minutes).
     */
    private LocalDateTime passwordResetTokenExpiresAt;

    /**
     * Number of consecutive failed login attempts.
     * Used for account lockout policy.
     */
    @Column(nullable = false)
    @Builder.Default
    private int failedLoginAttempts = 0;

    /**
     * When the account lock expires (null = not locked).
     */
    private LocalDateTime lockedUntil;

    /**
     * Last time the user made an authenticated request.
     * Used to enforce 30-minute inactivity logout.
     */
    private LocalDateTime lastActivityAt;

    /**
     * When the user last accepted the document integrity disclaimer.
     * FR-41: document uploads are blocked if this is null or older than 90 days.
     * Users must re-accept annually.
     */
    private LocalDateTime documentDisclaimerAcceptedAt;

    // ── UserDetails contract ──────────────────────────────────────────────────

    @Override
    public String getUsername() {
        // Email is the principal identifier — not the display name
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Maps Role enum to Spring Security authority e.g. "ROLE_STUDENT"
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public boolean isAccountNonLocked() {
        if (!accountNonLocked) return false;
        // Timed lock: if lockedUntil is set and still in the future, account is locked
        if (lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil)) return false;
        return true;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}