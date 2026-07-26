package com.scholarlinkgh.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Shared mail service for all outbound emails.
 * Extracted from OtpService to enable reuse (password reset, notifications, etc.).
 *
 * OWASP A09: all outbound email events are logged for audit trails.
 * Raw tokens and passwords are NEVER logged — only the recipient email.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${app.name:ScholarLink GH}")
    private String appName;

    /**
     * Sends a plain-text email asynchronously.
     * Fire-and-forget — failures are logged but do not propagate to the caller.
     */
    @Async
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to: {} subject: {}", to, subject);
        } catch (Exception ex) {
            log.error("Failed to send email to: {} subject: {} error: {}",
                to, subject, ex.getMessage());
        }
    }

    /**
     * Sends a password reset email with a deep-link token.
     * The token is embedded in a URL the mobile app can intercept.
     */
    public void sendPasswordResetEmail(String email, String rawToken) {
        String subject = appName + " — Password Reset Request";
        String body =
            "You requested a password reset for your " + appName + " account.\n\n"
            + "Your password reset link:\n"
            + "scholarlink://reset-password?token=" + rawToken + "\n\n"
            + "This link expires in 15 minutes.\n"
            + "If you did not request this, please ignore this email.\n";

        sendEmail(email, subject, body);
    }

    /**
     * Sends an OTP verification email.
     */
    public void sendOtpEmail(String email, String plainCode, int expiryMinutes) {
        String subject = appName + " — Verification Code";
        String body =
            "Your " + appName + " verification code is: " + plainCode + "\n\n"
            + "This code expires in " + expiryMinutes + " minutes.\n"
            + "If you did not request this, please ignore this email.\n";

        sendEmail(email, subject, body);
    }
}
