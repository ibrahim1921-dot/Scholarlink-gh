package com.scholarlinkgh.integration;

import com.scholarlinkgh.dto.LoginRequest;
import com.scholarlinkgh.dto.RegisterRequest;
import com.scholarlinkgh.dto.VerifyOtpRequest;
import com.scholarlinkgh.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.scholarlinkgh.service.MailService;
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the Auth module — /api/v1/auth/*
 *
 * Tests the full HTTP → Controller → Service → Repository → H2 flow.
 * MailService is mocked to prevent actual email sending.
 */
@DisplayName("Auth Module Integration Tests")
class AuthIntegrationTest extends BaseIntegrationTest {

    @MockitoBean
    private MailService mailService;

    // ── POST /api/v1/auth/register ────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/auth/register")
    class Register {

        @Test
        @DisplayName("should create user and return 201")
        void shouldCreateUserAndReturn201() throws Exception {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setUsername("John Doe");
            request.setEmail("newuser@test.com");
            request.setPhoneNumber("+233501111111");
            request.setPassword("Test@1234");
            request.setEducationLevel("SHS_GRADUATE");

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", notNullValue()));
        }

        @Test
        @DisplayName("should return 400 if email already exists")
        void shouldReturn400IfEmailAlreadyExists() throws Exception {
            // Arrange — student@test.com already exists from BaseIntegrationTest
            RegisterRequest request = new RegisterRequest();
            request.setUsername("Duplicate User");
            request.setEmail(STUDENT_EMAIL);
            request.setPhoneNumber("+233502222222");
            request.setPassword("Test@1234");
            request.setEducationLevel("SHS_GRADUATE");

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
        }
    }

    // ── POST /api/v1/auth/login ────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/auth/login")
    class Login {

        @Test
        @DisplayName("should return 200 with accessToken and refreshToken")
        void shouldReturnTokensOnValidLogin() throws Exception {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setEmail(STUDENT_EMAIL);
            request.setPassword(TEST_PASSWORD);

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.email", is(STUDENT_EMAIL)))
                .andExpect(jsonPath("$.role", is("STUDENT")));
        }

        @Test
        @DisplayName("should return 401 if wrong password")
        void shouldReturn401IfWrongPassword() throws Exception {
            // Arrange
            LoginRequest request = new LoginRequest();
            request.setEmail(STUDENT_EMAIL);
            request.setPassword("WrongPass@123");

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
        }
    }

    // ── POST /api/v1/auth/verify-otp ──────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/auth/verify-otp")
    class VerifyOtp {

        @Test
        @DisplayName("should enable account and return 200 on valid OTP")
        void shouldEnableAccountOnValidOtp() throws Exception {
            // Arrange — create unverified user with a known OTP
            String plainOtp = "123456";
            String otpHash = hashSha256(plainOtp);

            User unverified = User.builder()
                .username("Unverified User")
                .email("unverified@test.com")
                .phoneNumber("+233503333333")
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .role(com.scholarlinkgh.entity.Role.STUDENT)
                .enabled(false)
                .accountNonLocked(true)
                .failedLoginAttempts(0)
                .otpCode(otpHash)
                .otpExpiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
            userRepository.save(unverified);

            VerifyOtpRequest request = new VerifyOtpRequest();
            request.setEmail("unverified@test.com");
            request.setOtpCode(plainOtp);

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/verify-otp")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("should return 400 if OTP is expired")
        void shouldReturn400IfOtpExpired() throws Exception {
            // Arrange — create user with an expired OTP
            String plainOtp = "654321";
            String otpHash = hashSha256(plainOtp);

            User expiredOtp = User.builder()
                .username("Expired OTP User")
                .email("expiredotp@test.com")
                .phoneNumber("+233504444444")
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .role(com.scholarlinkgh.entity.Role.STUDENT)
                .enabled(false)
                .accountNonLocked(true)
                .failedLoginAttempts(0)
                .otpCode(otpHash)
                .otpExpiresAt(LocalDateTime.now().minusMinutes(5)) // already expired
                .build();
            userRepository.save(expiredOtp);

            VerifyOtpRequest request = new VerifyOtpRequest();
            request.setEmail("expiredotp@test.com");
            request.setOtpCode(plainOtp);

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/verify-otp")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
        }

        @Test
        @DisplayName("should return 400 if OTP code is wrong")
        void shouldReturn400IfOtpWrong() throws Exception {
            // Arrange
            String correctOtp = "111111";
            String otpHash = hashSha256(correctOtp);

            User user = User.builder()
                .username("Wrong OTP User")
                .email("wrongotp@test.com")
                .phoneNumber("+233505555555")
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .role(com.scholarlinkgh.entity.Role.STUDENT)
                .enabled(false)
                .accountNonLocked(true)
                .failedLoginAttempts(0)
                .otpCode(otpHash)
                .otpExpiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
            userRepository.save(user);

            VerifyOtpRequest request = new VerifyOtpRequest();
            request.setEmail("wrongotp@test.com");
            request.setOtpCode("999999"); // wrong code

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/verify-otp")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private String hashSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
