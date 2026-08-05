package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.UserResponse;
import com.scholarlinkgh.entity.Role;
import com.scholarlinkgh.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final com.scholarlinkgh.service.AiCreditService aiCreditService;
    private final com.scholarlinkgh.repository.UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminUserService.getUsers(search, page, size));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody com.scholarlinkgh.dto.UserUpdateRequest request,
            org.springframework.security.core.Authentication authentication) {
        try {
            return ResponseEntity.ok(adminUserService.updateUserDetails(id, request, authentication.getName()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> suspendUser(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        try {
            adminUserService.suspendUser(id, authentication.getName());
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "User suspended"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> activateUser(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        try {
            adminUserService.activateUser(id, authentication.getName());
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "User activated"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/{id}/promote")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> promoteToAdmin(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        try {
            com.scholarlinkgh.dto.UserResponse response = adminUserService.updateUserRole(id, Role.ADMIN, authentication.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/{id}/demote")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> demoteToStudent(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        try {
            com.scholarlinkgh.dto.UserResponse response = adminUserService.updateUserRole(id, Role.STUDENT, authentication.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean force,
            org.springframework.security.core.Authentication authentication) {
        try {
            String currentUserEmail = authentication.getName();
            return ResponseEntity.ok(adminUserService.deleteUser(id, currentUserEmail, force));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                .body(com.scholarlinkgh.dto.ApiResponse.builder()
                    .success(false)
                    .message(ex.getMessage())
                    .build());
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(com.scholarlinkgh.dto.ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .build());
        }
    }

    /**
     * POST /api/v1/admin/users/{id}/grant-credits
     *
     * Grants AI credits to a specific user.
     * Request body: { "amount": number }
     *
     * This is the temporary stand-in for "purchase credits" until Phase 3
     * wires real payment — an admin can manually top someone up for testing
     * or support purposes in the meantime.
     */
    @PostMapping("/{id}/grant-credits")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> grantCredits(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> body) {
        try {
            com.scholarlinkgh.entity.User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

            Object amountObj = body.get("amount");
            if (amountObj == null) {
                return ResponseEntity.badRequest().body(
                    com.scholarlinkgh.dto.ApiResponse.builder()
                        .success(false).message("Amount is required").build());
            }

            int amount;
            if (amountObj instanceof Number) {
                amount = ((Number) amountObj).intValue();
            } else {
                amount = Integer.parseInt(amountObj.toString());
            }

            int newBalance = aiCreditService.grantCredits(user, amount);
            return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "Granted " + amount + " AI credits to " + user.getEmail(),
                "aiCreditsRemaining", newBalance
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(
                com.scholarlinkgh.dto.ApiResponse.builder()
                    .success(false).message(ex.getMessage()).build());
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.scholarlinkgh.dto.AdminUserDetailsOverviewResponse> getUserDetailsOverview(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUserDetailsOverview(id));
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<com.scholarlinkgh.entity.DocumentUpload>> getUserDocuments(
            @PathVariable Long id, 
            @RequestParam(defaultValue = "0") int page, 
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminUserService.getUserDocuments(id, page, size));
    }

    @GetMapping("/{id}/payments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<com.scholarlinkgh.entity.PaymentTransaction>> getUserPayments(
            @PathVariable Long id, 
            @RequestParam(defaultValue = "0") int page, 
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminUserService.getUserPayments(id, page, size));
    }

    @GetMapping("/{id}/activity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<com.scholarlinkgh.entity.AuditLog>> getUserActivity(
            @PathVariable Long id, 
            @RequestParam(defaultValue = "0") int page, 
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminUserService.getUserActivity(id, page, size));
    }

    @GetMapping("/{id}/scholarships")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserScholarships(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ResponseEntity.ok(adminUserService.getUserScholarships(id, page, size));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/jobs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserJobs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ResponseEntity.ok(adminUserService.getUserJobs(id, page, size));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/notes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<com.scholarlinkgh.dto.AdminNoteResponse>> getAdminNotes(
            @PathVariable Long id, 
            @RequestParam(defaultValue = "0") int page, 
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminUserService.getAdminNotes(id, page, size));
    }

    @PostMapping("/{id}/notes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.scholarlinkgh.dto.AdminNoteResponse> addAdminNote(
            @PathVariable Long id, 
            @org.springframework.web.bind.annotation.RequestBody com.scholarlinkgh.dto.AdminNoteRequest request, 
            org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(adminUserService.addAdminNote(id, request, authentication.getName()));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/notes/{noteId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.scholarlinkgh.dto.AdminNoteResponse> updateAdminNote(
            @PathVariable Long id, 
            @PathVariable Long noteId, 
            @org.springframework.web.bind.annotation.RequestBody com.scholarlinkgh.dto.AdminNoteRequest request, 
            org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(adminUserService.updateAdminNote(noteId, request, authentication.getName()));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}/notes/{noteId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAdminNote(
            @PathVariable Long id, 
            @PathVariable Long noteId, 
            org.springframework.security.core.Authentication authentication) {
        adminUserService.deleteAdminNote(noteId, authentication.getName());
        return ResponseEntity.ok().build();
    }
}
