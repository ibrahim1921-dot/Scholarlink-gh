package com.scholarlinkgh.dto;

import com.scholarlinkgh.entity.Role;
import com.scholarlinkgh.entity.StudentProfile;
import com.scholarlinkgh.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserDetailsOverviewResponse {
    
    // User info & Account Status
    private Long id;
    private String email;
    private String username;
    private String phoneNumber;
    private Role role;
    private boolean enabled;
    private boolean accountNonLocked;
    private int failedLoginAttempts;
    private LocalDateTime lockedUntil;
    private LocalDateTime lastActivityAt;
    
    // Profile info
    private boolean hasProfile;
    private String educationLevel;
    private Double gpa;
    private String institution;
    private Integer graduationYear;
    private String fieldOfStudy;
    
    // Additional Preferences & Info
    private String originalLocation;
    private String countryPreference;
    private String languageProficiency;
    private String standardizedTests;
    private String financialNeed;
    private String intendedStartDate;
    private String bio;
    private String achievements;
    private String profilePictureUrl;
    
    private int profileCompletionPercentage;
    
    // AI Credits
    private Integer aiCreditsRemaining;
    private Integer aiCreditsUsedTotal;
    
    // Summaries
    private long totalDocuments;
    private long verifiedDocuments;
    private long rejectedDocuments;
    private long pendingDocuments;
    
    private long totalPayments;
    private double lifetimeSpending;
    
    private long savedScholarships;
    private long appliedScholarships;
    private long appliedJobs;
    private long totalVerificationRequests;

    public static AdminUserDetailsOverviewResponse build(
            User user, 
            StudentProfile profile,
            long totalDocs, long verifiedDocs, long rejectedDocs, long pendingDocs,
            long totalPayments, double lifetimeSpending,
            long savedScholars, long appliedScholars, long verificationRequests
    ) {
        AdminUserDetailsOverviewResponseBuilder builder = AdminUserDetailsOverviewResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getDisplayName())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole())
            .enabled(user.isEnabled())
            .accountNonLocked(user.isAccountNonLocked())
            .failedLoginAttempts(user.getFailedLoginAttempts())
            .lockedUntil(user.getLockedUntil())
            .lastActivityAt(user.getLastActivityAt())
            .totalDocuments(totalDocs)
            .verifiedDocuments(verifiedDocs)
            .rejectedDocuments(rejectedDocs)
            .pendingDocuments(pendingDocs)
            .totalPayments(totalPayments)
            .lifetimeSpending(lifetimeSpending)
            .savedScholarships(savedScholars)
            .appliedScholarships(appliedScholars)
            .totalVerificationRequests(verificationRequests);

        if (profile != null) {
            builder.hasProfile(true)
                .educationLevel(profile.getEducationLevel())
                .gpa(profile.getGpa())
                .institution(profile.getInstitution())
                .graduationYear(profile.getGraduationYear())
                .fieldOfStudy(profile.getFieldOfStudy())
                .originalLocation(profile.getOriginalLocation())
                .countryPreference(profile.getCountryPreference())
                .languageProficiency(profile.getLanguageProficiency())
                .standardizedTests(profile.getStandardizedTests())
                .financialNeed(profile.getFinancialNeed())
                .intendedStartDate(profile.getIntendedStartDate())
                .bio(profile.getBio())
                .achievements(profile.getAchievements())
                .profilePictureUrl(profile.getProfilePictureUrl())
                .profileCompletionPercentage(profile.calculateCompletenessPercentage())
                .aiCreditsRemaining(profile.getAiCreditsRemaining())
                .aiCreditsUsedTotal(profile.getAiCreditsUsedTotal());
        } else {
            builder.hasProfile(false)
                .profileCompletionPercentage(0)
                .aiCreditsRemaining(0)
                .aiCreditsUsedTotal(0);
        }

        return builder.build();
    }
}
