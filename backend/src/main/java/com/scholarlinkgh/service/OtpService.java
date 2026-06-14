package com.scholarlinkgh.service;

import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

/**
 * OTP service — generates, stores (hashed), and verifies one-time passwords.
 *
 * OWASP A02: OTP is SHA-256 hashed before storage. If the database is
 * breached, stored hashes cannot be reversed to the 6-digit value.
 *
 * OWASP A07: OTP expiry is checked before comparison — expired codes
 * are rejected regardless of whether the value matches.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final MailService mailService;
    private final UserRepository userRepository;

    @Value("${otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${otp.email-subject:ScholarLink GH Verification Code}")
    private String otpEmailSubject;

    @Transactional
    public void issueOtp(User user) {
        String plainCode = generateOtp();

        // Store SHA-256 hash — raw code is only ever sent to the user's email
        user.setOtpCode(hashOtp(plainCode));
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        userRepository.save(user);

        sendOtpEmail(user.getEmail(), plainCode);

        log.info("OTP issued for: {}", user.getEmail());
    }

    /**
     * Verifies a submitted OTP code against the stored hash.
     * Returns true only if: hash matches AND code is not expired.
     */
    public boolean verifyOtp(User user, String submittedCode) {
        if (user.getOtpCode() == null || user.getOtpExpiresAt() == null) {
            log.warn("OTP verification failed for {}: no active OTP", user.getEmail());
            return false;
        }
        if (LocalDateTime.now().isAfter(user.getOtpExpiresAt())) {
            log.warn("OTP verification failed for {}: code expired", user.getEmail());
            return false;
        }
        boolean matches = hashOtp(submittedCode).equals(user.getOtpCode());
        if (!matches) {
            log.warn("OTP verification failed for {}: incorrect code", user.getEmail());
        }
        return matches;
    }

    /**
     * Clears the OTP fields after successful verification.
     * Prevents the same code from being reused.
     */
    @Transactional
    public void clearOtp(User user) {
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);
    }

    private String generateOtp() {
        int otp = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(otp);
    }

    private String hashOtp(String plainCode) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(
                plainCode.getBytes(StandardCharsets.UTF_8)
            );
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private void sendOtpEmail(String email, String plainCode) {
        mailService.sendOtpEmail(email, plainCode, otpExpiryMinutes);
    }
}
