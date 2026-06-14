package com.scholarlinkgh.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Request body for POST /api/v1/auth/verify-otp
 * FR-03: verifies the 6-digit OTP sent to the user's email.
 *
 * OWASP A07: OTP is exactly 6 digits — reject anything else
 * before it reaches the service layer.
 */
@Data
public class VerifyOtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "OTP code is required")
    @Pattern(
        regexp = "^[0-9]{6}$",
        message = "OTP must be exactly 6 digits"
    )
    private String otpCode;
}