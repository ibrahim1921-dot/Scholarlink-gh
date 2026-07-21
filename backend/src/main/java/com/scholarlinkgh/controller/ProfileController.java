package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.entity.StudentProfile;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.StudentProfileRepository;
import com.scholarlinkgh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * ProfileController — REST endpoints for student profile management.
 *
 * GET  /api/v1/profile           — retrieve the authenticated student's profile
 * PUT  /api/v1/profile           — create or update the profile
 * POST /api/v1/profile/push-token — register Expo push token (FR-27-29)
 *
 * Profile data drives AI matching (FR-09), profile strength scoring (FR-10),
 * and personal statement generation (FR-19).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;

    /**
     * GET /api/v1/profile
     *
     * Returns the authenticated student's full profile.
     * Returns 404 if no profile has been created yet.
     */
    @GetMapping
    public ResponseEntity<Object> getProfile() {
        User user = getCurrentUser();
        return profileRepository.findByUser(user)
            .<ResponseEntity<Object>>map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/v1/profile
     *
     * Creates or updates the authenticated student's profile.
     * Profile strength score is recomputed by the AI on the next match call.
     *
     * Request body fields (all optional on update):
     *   education_level, gpa, field_of_study, institution, graduation_year,
     *   country_preference, language_proficiency, financial_need, bio, achievements
     */
    @PutMapping
    public ResponseEntity<ApiResponse> updateProfile(@RequestBody Map<String, Object> body) {
        User user = getCurrentUser();

        StudentProfile profile = profileRepository.findByUser(user)
            .orElse(StudentProfile.builder().user(user).build());

        // Map request body fields — all optional
        if (body.containsKey("education_level")) {
            profile.setEducationLevel((String) body.get("education_level"));
        }
        if (body.containsKey("gpa") && body.get("gpa") != null) {
            profile.setGpa(Double.parseDouble(body.get("gpa").toString()));
        }
        if (body.containsKey("field_of_study")) {
            profile.setFieldOfStudy((String) body.get("field_of_study"));
        }
        if (body.containsKey("institution")) {
            profile.setInstitution((String) body.get("institution"));
        }
        if (body.containsKey("graduation_year") && body.get("graduation_year") != null) {
            profile.setGraduationYear(Integer.parseInt(body.get("graduation_year").toString()));
        }
        if (body.containsKey("country_preference")) {
            profile.setCountryPreference((String) body.get("country_preference"));
        }
        if (body.containsKey("language_proficiency")) {
            profile.setLanguageProficiency((String) body.get("language_proficiency"));
        }
        if (body.containsKey("standardized_tests")) {
            profile.setStandardizedTests((String) body.get("standardized_tests"));
        }
        if (body.containsKey("intended_start_date")) {
            profile.setIntendedStartDate((String) body.get("intended_start_date"));
        }
        if (body.containsKey("financial_need")) {
            profile.setFinancialNeed((String) body.get("financial_need"));
        }
        if (body.containsKey("bio")) {
            profile.setBio((String) body.get("bio"));
        }
        if (body.containsKey("achievements")) {
            profile.setAchievements((String) body.get("achievements"));
        }

        // Reset profile strength score — will be recomputed on next AI match call
        profile.setProfileStrengthScore(null);
        profile.setProfileImprovementSuggestions(null);

        profileRepository.save(profile);
        log.info("Profile updated for user {}", user.getEmail());

        return ResponseEntity.ok(ApiResponse.builder()
            .success(true)
            .message("Profile updated successfully. Your AI match scores will be refreshed.")
            .build());
    }

    /**
     * POST /api/v1/profile/push-token
     *
     * Registers or updates the student's Expo push token.
     * Required for push notifications (FR-27-29).
     *
     * Request body: { "token": "ExponentPushToken[...]" }
     */
    @PostMapping("/push-token")
    public ResponseEntity<ApiResponse> registerPushToken(@RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        String token = body.getOrDefault("token", "");

        if (token.isBlank()) {
            return ResponseEntity.badRequest().body(
                ApiResponse.builder().success(false).message("Push token is required").build());
        }

        StudentProfile profile = profileRepository.findByUser(user)
            .orElse(StudentProfile.builder().user(user).build());

        profile.setExpoPushToken(token);
        profileRepository.save(profile);

        return ResponseEntity.ok(ApiResponse.builder()
            .success(true)
            .message("Push notification token registered.")
            .build());
    }

    /**
     * GET /api/v1/profile/completeness
     *
     * Calculates the profile completeness score (0-100) based on 10 core fields.
     */
    @GetMapping("/completeness")
    public ResponseEntity<Map<String, Object>> getProfileCompleteness() {
        User user = getCurrentUser();
        StudentProfile profile = profileRepository.findByUser(user).orElse(null);

        if (profile == null) {
            return ResponseEntity.ok(Map.of(
                "completeness", 0,
                "next_step", "/profile-setup"
            ));
        }

        int filledFields = 0;
        int totalFields = 10;
        String nextStep = "/profile-setup";

        boolean hasEducationLevel = profile.getEducationLevel() != null && !profile.getEducationLevel().isBlank();
        boolean hasInstitution = profile.getInstitution() != null && !profile.getInstitution().isBlank();
        boolean hasField = profile.getFieldOfStudy() != null && !profile.getFieldOfStudy().isBlank();
        boolean hasGpa = profile.getGpa() != null;
        boolean hasGradYear = profile.getGraduationYear() != null;
        
        if (hasEducationLevel && hasInstitution && hasField && hasGpa && hasGradYear) {
            nextStep = "/profile-setup-step-2";
        }

        boolean hasCountry = profile.getCountryPreference() != null && !profile.getCountryPreference().isBlank();
        boolean hasLanguage = profile.getLanguageProficiency() != null && !profile.getLanguageProficiency().isBlank();
        boolean hasFinancialNeed = profile.getFinancialNeed() != null && !profile.getFinancialNeed().isBlank();
        
        if (hasEducationLevel && hasInstitution && hasField && hasGpa && hasGradYear && hasCountry && hasLanguage) {
            nextStep = "/profile-setup-step-3";
        }

        boolean hasBio = profile.getBio() != null && !profile.getBio().isBlank();
        boolean hasAchievements = profile.getAchievements() != null && !profile.getAchievements().isBlank();

        if (hasEducationLevel) filledFields++;
        if (hasInstitution) filledFields++;
        if (hasField) filledFields++;
        if (hasGpa) filledFields++;
        if (hasGradYear) filledFields++;
        if (hasCountry) filledFields++;
        if (hasFinancialNeed) filledFields++;
        if (hasLanguage) filledFields++;
        if (hasBio) filledFields++;
        if (hasAchievements) filledFields++;

        if (filledFields == totalFields) {
            nextStep = "/profile-summary";
        }

        int percentage = (int) Math.round(((double) filledFields / totalFields) * 100);

        return ResponseEntity.ok(Map.of(
            "completeness", percentage,
            "next_step", nextStep
        ));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }
}
