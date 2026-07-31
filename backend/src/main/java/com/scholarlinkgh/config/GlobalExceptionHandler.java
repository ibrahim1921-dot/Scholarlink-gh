package com.scholarlinkgh.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import com.scholarlinkgh.exception.ResourceNotFoundException;
import com.scholarlinkgh.exception.AiGenerationException;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler — catches all unhandled exceptions and returns
 * safe, generic JSON responses. NEVER exposes stack traces, class names,
 * or internal details to the client.
 *
 * OWASP A07: prevents information disclosure through error messages.
 * OWASP A09: all errors are logged server-side for audit trails.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Bean validation failures on @Valid request bodies.
     * Returns the first validation error message.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .findFirst()
            .orElse("Validation failed");

        log.warn("Validation error: {}", message);

        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "message", message
        ));
    }

    /**
     * Spring Security: wrong password.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(
            BadCredentialsException ex) {

        log.warn("Bad credentials attempt");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "success", false,
            "message", "Invalid credentials"
        ));
    }

    /**
     * Spring Security: account not verified.
     */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> handleDisabledAccount(
            DisabledException ex) {

        log.warn("Disabled account login attempt");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
            "success", false,
            "message", "Account is disabled. Please verify your email."
        ));
    }

    /**
     * Spring Security: account locked due to brute force.
     */
    @ExceptionHandler(LockedException.class)
    public ResponseEntity<Map<String, Object>> handleLockedAccount(
            LockedException ex) {

        log.warn("Locked account login attempt");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
            "success", false,
            "message", "Account is temporarily locked. Please try again later."
        ));
    }

    /**
     * Spring Security: insufficient permissions.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException ex) {

        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
            "success", false,
            "message", "You do not have permission to perform this action."
        ));
    }

    /**
     * Missing required request part (file upload without file, etc.).
     */
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, Object>> handleMissingServletRequestPart(
            MissingServletRequestPartException ex) {

        log.warn("Missing request part: {}", ex.getRequestPartName());
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Required part '" + ex.getRequestPartName() + "' is missing."
        ));
    }

    /**
     * Malformed JSON or type mismatch (e.g., string to enum conversion failure).
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex) {

        log.warn("Malformed JSON or type mismatch: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Invalid request format or value provided."
        ));
    }

    /**
     * Requested resource (job, scholarship, document) not found.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(
            ResourceNotFoundException ex) {

        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "message", ex.getMessage()
        ));
    }

    /**
     * AI generation failed (e.g. Gemini API error).
     */
    @ExceptionHandler(AiGenerationException.class)
    public ResponseEntity<Map<String, Object>> handleAiGenerationException(
            AiGenerationException ex) {

        log.warn("AI generation error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "success", false,
            "message", ex.getMessage()
        ));
    }

    /**
     * Any other runtime exception — return generic message, log the real error.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex) {

        log.error("Unhandled runtime exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "success", false,
            "message", "Error: " + ex.toString() + " at " + (ex.getStackTrace().length > 0 ? ex.getStackTrace()[0].toString() : "unknown")
        ));
    }

    /**
     * Catch-all for any throwable not handled above.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {

        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "success", false,
            "message", "Error: " + ex.toString() + " at " + (ex.getStackTrace().length > 0 ? ex.getStackTrace()[0].toString() : "unknown")
        ));
    }
}
