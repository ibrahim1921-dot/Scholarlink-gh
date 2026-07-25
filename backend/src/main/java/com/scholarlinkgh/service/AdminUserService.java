package com.scholarlinkgh.service;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.dto.UserResponse;
import com.scholarlinkgh.entity.Role;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ApplicationTrackerRepository applicationTrackerRepository;
    private final DocumentUploadRepository documentUploadRepository;
    private final SavedJobRepository savedJobRepository;
    private final SavedScholarshipRepository savedScholarshipRepository;
    private final ScholarshipReportRepository scholarshipReportRepository;
    private final JobListingRepository jobListingRepository;
    private final ScholarshipRepository scholarshipRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final NotificationRepository notificationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EligibilityCheckRepository eligibilityCheckRepository;
    private final ScholarshipMatchRepository scholarshipMatchRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(String search, int page, int size) {
        String safeSearch = (search == null || search.trim().isEmpty()) ? "" : search.trim();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        return userRepository.searchUsers(safeSearch, pageable).map(UserResponse::from);
    }

    @Transactional
    public UserResponse updateUserRole(Long id, Role newRole) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() == newRole) {
            return UserResponse.from(user);
        }

        if (user.getRole() == Role.ADMIN && newRole == Role.STUDENT) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw new IllegalStateException("Cannot demote the last remaining admin");
            }
        }

        user.setRole(newRole);
        User updated = userRepository.save(user);
        log.info("User {} role updated to {}", updated.getEmail(), newRole);
        
        return UserResponse.from(updated);
    }

    @Transactional
    public ApiResponse deleteUser(Long id, String currentUserEmail) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getEmail().equals(currentUserEmail)) {
            throw new IllegalStateException("Cannot delete your own account through this endpoint.");
        }

        if (user.getRole() == Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw new IllegalStateException("Cannot delete the last remaining admin.");
            }
        }

        long applications = jobApplicationRepository.countByStudent(user) + applicationTrackerRepository.countByStudent(user);
        long documents = documentUploadRepository.countByStudent(user) + documentUploadRepository.countByReviewedBy(user);
        long saves = savedJobRepository.countByStudent(user) + savedScholarshipRepository.countByStudent(user);
        long listings = jobListingRepository.countByCreatedBy(user) + scholarshipRepository.countByCreatedBy(user);
        long reports = scholarshipReportRepository.countByReporter(user);
        long profile = studentProfileRepository.existsByUser(user) ? 1 : 0;

        if (applications > 0 || documents > 0 || saves > 0 || listings > 0 || reports > 0 || profile > 0) {
            StringBuilder error = new StringBuilder("Cannot delete: user has ");
            if (applications > 0) error.append(applications).append(" application(s), ");
            if (documents > 0) error.append(documents).append(" document(s), ");
            if (saves > 0) error.append(saves).append(" saved item(s), ");
            if (listings > 0) error.append(listings).append(" created listing(s), ");
            if (reports > 0) error.append(reports).append(" report(s), ");
            if (profile > 0) error.append("a student profile, ");
            
            error.setLength(error.length() - 2); // remove last comma
            error.append(". Disable the account instead.");
            throw new IllegalStateException(error.toString());
        }

        // Clean up transient non-blocking dependencies
        notificationRepository.deleteAllByUser(user);
        refreshTokenRepository.deleteAllByUser(user);
        eligibilityCheckRepository.deleteAllByStudent(user);
        scholarshipMatchRepository.deleteAllByStudent(user);

        userRepository.delete(user);
        log.info("Admin {} deleted user {}", currentUserEmail, user.getEmail());
        
        return ApiResponse.builder().success(true).message("User deleted successfully").build();
    }
}
