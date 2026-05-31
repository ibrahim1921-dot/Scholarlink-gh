package com.scholarlinkgh.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Request body for POST /api/v1/auth/register
 * FR-01: name, email, phone, education level, password.
 *
 * OWASP A03: all fields validated before touching the database.
 * Unexpected fields are ignored by default (Jackson).
 */
@Data
public class RegisterRequest {

    /**
     * Display name — 2 to 100 characters.
     * Rejects blank, single-char, or suspiciously long names.
     */
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Pattern(
        regexp = "^[a-zA-Z\\s'-]+$",
        message = "Name can only contain letters, spaces, hyphens, and apostrophes"
    )
    private String username;

    /**
     * Email — must be a valid format, max 255 chars.
     * OWASP A03: reject clearly invalid emails before any DB lookup.
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    /**
     * Phone number — Ghanaian format supported.
     * e.g. 0241234567 or +233241234567
     */
    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^(\\+233|0)[0-9]{9}$",
        message = "Please provide a valid Ghanaian phone number"
    )
    private String phoneNumber;

    /**
     * Password — minimum 8 chars, must include upper, lower, digit, special char.
     * OWASP A07: enforce strong passwords at the API boundary.
     */
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    private String password;

    /**
     * Education level — must be either SHS_GRADUATE or UNIVERSITY_GRADUATE.
     * FR-08: determines which scholarships are shown to this user.
     */
    @NotBlank(message = "Education level is required")
    @Pattern(
        regexp = "^(SHS_GRADUATE|UNIVERSITY_GRADUATE)$",
        message = "Education level must be SHS_GRADUATE or UNIVERSITY_GRADUATE"
    )
    private String educationLevel;
}