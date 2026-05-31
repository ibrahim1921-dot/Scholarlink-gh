package com.scholarlinkgh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API response wrapper.
 * Used for success/error messages that don't return data
 * e.g. "OTP sent", "Account verified", "Password reset email sent"
 *
 * OWASP A07: message field uses generic text — never reveals
 * internal state (e.g. "email not found" vs "wrong password").
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {

    private boolean success;
    private String message;
}