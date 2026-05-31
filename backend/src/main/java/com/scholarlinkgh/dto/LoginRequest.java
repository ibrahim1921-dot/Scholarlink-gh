package com.scholarlinkgh.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Request body for POST /api/v1/auth/login
 *
 * OWASP A07: minimal fields — email and password only.
 * No username hints, no "remember me" tokens in the body.
 */
@Data
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72)
    private String password;
}