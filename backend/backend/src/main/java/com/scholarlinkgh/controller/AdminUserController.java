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

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminUserService.getUsers(search, page, size));
    }

    @PostMapping("/{id}/promote")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> promoteToAdmin(@PathVariable Long id) {
        try {
            UserResponse response = adminUserService.updateUserRole(id, Role.ADMIN);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/{id}/demote")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> demoteToStudent(@PathVariable Long id) {
        try {
            UserResponse response = adminUserService.updateUserRole(id, Role.STUDENT);
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
            org.springframework.security.core.Authentication authentication) {
        try {
            String currentUserEmail = authentication.getName();
            return ResponseEntity.ok(adminUserService.deleteUser(id, currentUserEmail));
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
}
