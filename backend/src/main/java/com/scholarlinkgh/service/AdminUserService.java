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
    private final UserActivityService userActivityService;
    private final RefreshTokenService refreshTokenService;
    private final MailService mailService;
    private final AuditService auditService;
    private final AdminNoteRepository adminNoteRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(String search, int page, int size) {
        String safeSearch = (search == null || search.trim().isEmpty()) ? "" : search.trim();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        return userRepository.searchUsers(safeSearch, pageable).map(UserResponse::from);
    }

    @Transactional
    public UserResponse updateUserRole(Long id, Role newRole, String adminEmail) {
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
        
        userRepository.findByEmail(adminEmail).ifPresent(admin -> 
            auditService.log(admin.getId(), admin.getEmail(), "UPDATE_ROLE", "User", updated.getId(), "Changed role to " + newRole.name())
        );
        
        return UserResponse.from(updated);
    }

    @Transactional
    public ApiResponse deleteUser(Long id, String currentUserEmail, boolean force) {
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

        if (force) {
            // Nullify createdBy on JobListing
            java.util.List<com.scholarlinkgh.entity.JobListing> jobListings = jobListingRepository.findByCreatedBy(user);
            jobListings.forEach(l -> l.setCreatedBy(null));
            jobListingRepository.saveAll(jobListings);

            // Nullify createdBy on Scholarship
            java.util.List<com.scholarlinkgh.entity.Scholarship> scholarships = scholarshipRepository.findByCreatedBy(user);
            scholarships.forEach(s -> s.setCreatedBy(null));
            scholarshipRepository.saveAll(scholarships);

            // Nullify reviewedBy on DocumentUpload
            java.util.List<com.scholarlinkgh.entity.DocumentUpload> reviewedDocs = documentUploadRepository.findByReviewedBy(user);
            reviewedDocs.forEach(d -> d.setReviewedBy(null));
            documentUploadRepository.saveAll(reviewedDocs);

            // Cascade delete entities
            jobApplicationRepository.deleteAll(jobApplicationRepository.findByStudentOrderByAppliedAtDesc(user));
            applicationTrackerRepository.deleteAll(applicationTrackerRepository.findByStudentOrderByCreatedAtDesc(user));
            documentUploadRepository.deleteAll(documentUploadRepository.findByStudentOrderByUploadedAtDesc(user));
            savedJobRepository.deleteAll(savedJobRepository.findByStudentOrderBySavedAtDesc(user));
            savedScholarshipRepository.deleteAll(savedScholarshipRepository.findAllByStudentOrderBySavedAtDesc(user));
            scholarshipReportRepository.deleteAll(scholarshipReportRepository.findByReporter(user));
            
            // Delete AdminNotes involving the user
            adminNoteRepository.deleteAll(adminNoteRepository.findByUser(user));
            adminNoteRepository.deleteAll(adminNoteRepository.findByAdmin(user));
            
            // Delete StudentProfile
            studentProfileRepository.findByUser(user).ifPresent(studentProfileRepository::delete);

            // Anonymize PaymentTransaction
            java.util.List<com.scholarlinkgh.entity.PaymentTransaction> transactions = paymentTransactionRepository.findByUser(user);
            transactions.forEach(t -> {
                t.setUser(null);
                t.setAnonymizedUserEmail(user.getEmail());
            });
            paymentTransactionRepository.saveAll(transactions);
        } else {
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
        }

        // Clean up transient non-blocking dependencies
        notificationRepository.deleteAllByUser(user);
        refreshTokenRepository.deleteAllByUser(user);
        eligibilityCheckRepository.deleteAllByStudent(user);
        scholarshipMatchRepository.deleteAllByStudent(user);

        userRepository.delete(user);
        log.info("Admin {} deleted user {}", currentUserEmail, user.getEmail());
        
        String logMessage = "Deleted user " + user.getEmail();
        if (force) {
            logMessage += " (Force Deleted, Payments Anonymized)";
        }
        
        final String finalLogMessage = logMessage;
        userRepository.findByEmail(currentUserEmail).ifPresent(admin -> 
            auditService.log(admin.getId(), admin.getEmail(), "DELETE_USER", "User", id, finalLogMessage)
        );
        
        return ApiResponse.builder().success(true).message("User deleted successfully").build();
    }

    @Transactional(readOnly = true)
    public com.scholarlinkgh.dto.AdminUserDetailsOverviewResponse getUserDetailsOverview(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        com.scholarlinkgh.entity.StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        
        long totalDocs = documentUploadRepository.countByStudent(user);
        long verifiedDocs = documentUploadRepository.countByStudentAndVerificationStatus(user, com.scholarlinkgh.entity.VerificationStatus.VERIFIED);
        long rejectedDocs = documentUploadRepository.countByStudentAndVerificationStatus(user, com.scholarlinkgh.entity.VerificationStatus.REJECTED);
        long pendingDocs = documentUploadRepository.countPendingByStudent(user);
        
        long totalPayments = paymentTransactionRepository.countByUser(user);
        Long lifetimePesewas = paymentTransactionRepository.sumAmountByUser(user);
        double lifetimeSpending = lifetimePesewas / 100.0;
        
        long savedScholars = savedScholarshipRepository.countByStudent(user);
        long appliedScholars = applicationTrackerRepository.countByStudent(user);
        long verificationReqs = totalDocs; // Or a specific query if it means something else.
        long appliedJobs = jobApplicationRepository.countByStudent(user);

        com.scholarlinkgh.dto.AdminUserDetailsOverviewResponse response = com.scholarlinkgh.dto.AdminUserDetailsOverviewResponse.build(
            user, profile,
            totalDocs, verifiedDocs, rejectedDocs, pendingDocs,
            totalPayments, lifetimeSpending,
            savedScholars, appliedScholars, verificationReqs
        );
        response.setAppliedJobs(appliedJobs);
        return response;
    }

    @Transactional(readOnly = true)
    public Page<com.scholarlinkgh.entity.DocumentUpload> getUserDocuments(Long id, int page, int size) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return documentUploadRepository.findByStudentOrderByUploadedAtDesc(user, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Page<com.scholarlinkgh.entity.PaymentTransaction> getUserPayments(Long id, int page, int size) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return paymentTransactionRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Page<com.scholarlinkgh.entity.AuditLog> getUserActivity(Long id, int page, int size) {
        // Logs actions taken by this user or actions where this user is the entity
        // We'll fetch where entityType = 'User' and entityId = user.getId()
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("User", id, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<java.util.Map<String, Object>> getUserScholarships(Long id, int page, int size) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return applicationTrackerRepository.findByStudentOrderByCreatedAtDesc(user, org.springframework.data.domain.PageRequest.of(page, size))
            .map(tracker -> java.util.Map.of(
                "id", tracker.getId(),
                "status", tracker.getStatus().name(),
                "applicationMode", tracker.getApplicationMode() != null ? tracker.getApplicationMode().name() : "DIRECT",
                "createdAt", tracker.getCreatedAt(),
                "scholarship", java.util.Map.of(
                    "id", tracker.getScholarship().getId(),
                    "title", tracker.getScholarship().getName(),
                    "provider", tracker.getScholarship().getProvider() != null ? tracker.getScholarship().getProvider() : "N/A"
                )
            ));
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<java.util.Map<String, Object>> getUserJobs(Long id, int page, int size) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return jobApplicationRepository.findByStudentOrderByAppliedAtDesc(user, org.springframework.data.domain.PageRequest.of(page, size))
            .map(application -> java.util.Map.of(
                "id", application.getId(),
                "status", application.getStatus().name(),
                "createdAt", application.getAppliedAt(),
                "job", java.util.Map.of(
                    "id", application.getJob().getId(),
                    "title", application.getJob().getTitle(),
                    "company", application.getJob().getCompany() != null ? application.getJob().getCompany() : "N/A"
                )
            ));
    }

    @Transactional(readOnly = true)
    public Page<com.scholarlinkgh.dto.AdminNoteResponse> getAdminNotes(Long id, int page, int size) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return adminNoteRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(page, size))
                .map(com.scholarlinkgh.dto.AdminNoteResponse::from);
    }

    @Transactional
    public com.scholarlinkgh.dto.AdminNoteResponse addAdminNote(Long id, com.scholarlinkgh.dto.AdminNoteRequest request, String adminEmail) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        User admin = userRepository.findByEmail(adminEmail).orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        
        com.scholarlinkgh.entity.AdminNote note = com.scholarlinkgh.entity.AdminNote.builder()
            .user(user)
            .admin(admin)
            .note(request.getNote())
            .build();
            
        return com.scholarlinkgh.dto.AdminNoteResponse.from(adminNoteRepository.save(note));
    }

    @Transactional
    public com.scholarlinkgh.dto.AdminNoteResponse updateAdminNote(Long noteId, com.scholarlinkgh.dto.AdminNoteRequest request, String adminEmail) {
        com.scholarlinkgh.entity.AdminNote note = adminNoteRepository.findById(noteId)
            .orElseThrow(() -> new IllegalArgumentException("Note not found"));
            
        // Optional: Ensure only the creator or any admin can update? Any admin is fine.
        note.setNote(request.getNote());
        return com.scholarlinkgh.dto.AdminNoteResponse.from(adminNoteRepository.save(note));
    }

    @Transactional
    public void deleteAdminNote(Long noteId, String adminEmail) {
        adminNoteRepository.deleteById(noteId);
    }

    @Transactional
    public com.scholarlinkgh.dto.UserResponse updateUserDetails(Long id, com.scholarlinkgh.dto.UserUpdateRequest request, String adminEmail) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            user.setUsername(request.getUsername().trim());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }
        
        userRepository.save(user);
        
        userRepository.findByEmail(adminEmail).ifPresent(admin -> 
            auditService.log(admin.getId(), admin.getEmail(), "UPDATE_USER", "User", user.getId(), "Updated details for " + user.getEmail())
        );
        
        return com.scholarlinkgh.dto.UserResponse.from(user);
    }

    @Transactional
    public void suspendUser(Long id, String adminEmail) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setEnabled(false);
        userRepository.save(user);
        
        // Revoke all active sessions instantly
        refreshTokenService.revokeAll(user);
        
        // Send notification email
        mailService.sendEmail(
            user.getEmail(),
            "Your ScholarLink GH Account has been Suspended",
            "Dear " + user.getDisplayName() + ",\n\n" +
            "Your account has been suspended by an administrator. You will no longer be able to log in or access your account.\n\n" +
            "If you believe this is a mistake, please contact support.\n\n" +
            "Regards,\nThe ScholarLink GH Team"
        );
        
        userRepository.findByEmail(adminEmail).ifPresent(admin -> 
            auditService.log(admin.getId(), admin.getEmail(), "SUSPEND_USER", "User", user.getId(), "Suspended user " + user.getEmail())
        );
    }

    @Transactional
    public void activateUser(Long id, String adminEmail) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setEnabled(true);
        userRepository.save(user);
        
        userRepository.findByEmail(adminEmail).ifPresent(admin -> 
            auditService.log(admin.getId(), admin.getEmail(), "ACTIVATE_USER", "User", user.getId(), "Activated user " + user.getEmail())
        );
    }
}
