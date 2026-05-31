package com.scholarlinkgh.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response body returned after successful login or token refresh.
 *
 * OWASP A07: only tokens and minimal user info returned.
 * Password, OTP, and internal IDs are NEVER included in responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;

    // Minimal user info — enough for the app to personalise the UI
    private String email;
    private String username;
    private String role;
}