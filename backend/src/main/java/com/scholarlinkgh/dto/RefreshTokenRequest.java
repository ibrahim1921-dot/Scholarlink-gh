package com.scholarlinkgh.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for POST /api/v1/auth/refresh
 * Accepts a valid refresh token and returns a new access token.
 *
 * OWASP A07: refresh token is required — blank tokens rejected immediately.
 */
@Data
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}