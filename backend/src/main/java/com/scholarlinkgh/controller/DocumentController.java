package com.scholarlinkgh.controller;

import com.scholarlinkgh.dto.ApiResponse;
import com.scholarlinkgh.entity.DocumentType;
import com.scholarlinkgh.entity.DocumentUpload;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.entity.VerificationStatus;
import com.scholarlinkgh.repository.DocumentUploadRepository;
import com.scholarlinkgh.repository.UserRepository;
import com.scholarlinkgh.service.DocumentVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DocumentController — REST endpoints for document upload and verification.
 *
 * POST   /api/v1/documents/upload                 — upload a document (FR-38, FR-41)
 * GET    /api/v1/documents                        — list student's documents
 * GET    /api/v1/documents/disclaimer-status      — check if disclaimer is current (FR-41)
 * POST   /api/v1/documents/accept-disclaimer      — accept document disclaimer (FR-41)
 * GET    /api/v1/documents/admin/suspicious       — admin view of flagged documents
 *
 * OWASP A04: file type validated server-side with Apache Tika.
 * OWASP A01: storage paths never returned to students.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentVerificationService verificationService;
    private final DocumentUploadRepository documentUploadRepository;
    private final UserRepository userRepository;

    // ── FR-41: Disclaimer ─────────────────────────────────────────────────────

    /**
     * GET /api/v1/documents/disclaimer-status
     *
     * Returns whether the student has a valid (non-expired) document disclaimer.
     * FR-41: disclaimer must be accepted within the last 90 days.
     */
    @GetMapping("/disclaimer-status")
    public ResponseEntity<Map<String, Object>> getDisclaimerStatus() {
        User user = getCurrentUser();
        boolean valid = verificationService.hasValidDisclaimer(user);
        Map<String, Object> response = new HashMap<>();
        response.put("disclaimer_accepted", valid);
        response.put("accepted_at", user.getDocumentDisclaimerAcceptedAt() != null
                ? user.getDocumentDisclaimerAcceptedAt().toString() : null);
        response.put("message", valid
                ? "Your document disclaimer is current."
                : "Please accept the document integrity disclaimer to upload documents.");
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/documents/accept-disclaimer
     *
     * Records that the student has accepted the document integrity disclaimer.
     * FR-41: updates documentDisclaimerAcceptedAt on the User entity.
     *
     * The exact disclaimer text must be displayed on the frontend modal before
     * this endpoint is called.
     */
    @PostMapping("/accept-disclaimer")
    public ResponseEntity<ApiResponse> acceptDisclaimer() {
        User user = getCurrentUser();
        user.setDocumentDisclaimerAcceptedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        log.info("Document disclaimer accepted by user {}", user.getEmail());

        return ResponseEntity.ok(ApiResponse.builder()
            .success(true)
            .message("Document disclaimer accepted. You may now upload documents.")
            .build());
    }

    // ── FR-38: Document Upload ────────────────────────────────────────────────

    /**
     * POST /api/v1/documents/upload
     *
     * Uploads a document, validates its MIME type with Apache Tika,
     * extracts text with PDFBox, and runs AI first-level verification.
     *
     * Request: multipart/form-data with fields:
     *   - file: the document file (PDF/JPEG/PNG/TIFF, max 10 MB)
     *   - type: DocumentType enum value (TRANSCRIPT, CV, STATEMENT, REFERENCE, etc.)
     *
     * Returns: DocumentUpload with verification_status and notes.
     *
     * FR-41: blocked if disclaimer not accepted within the last 90 days.
     * OWASP A04: file type validated server-side.
     */
    @PostMapping("/upload")
    public ResponseEntity<Object> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {
        User user = getCurrentUser();

        DocumentType documentType;
        try {
            documentType = DocumentType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.builder().success(false)
                    .message("Invalid document type. Use: TRANSCRIPT, CV, STATEMENT, REFERENCE, IDENTITY, FINANCIAL_PROOF, OTHER")
                    .build()
            );
        }

        try {
            DocumentUpload upload = verificationService.uploadAndVerify(user, file, documentType);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", upload.getId(),
                "filename", upload.getFilename(),
                "document_type", upload.getDocumentType(),
                "verification_status", upload.getVerificationStatus(),
                "verification_notes", upload.getVerificationNotes() != null
                    ? upload.getVerificationNotes() : "",
                "uploaded_at", upload.getUploadedAt().toString()
            ));
        } catch (IllegalStateException e) {
            // Disclaimer not accepted
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiResponse.builder().success(false).message(e.getMessage()).build());
        } catch (IllegalArgumentException e) {
            // Invalid file type or size
            return ResponseEntity.badRequest().body(
                ApiResponse.builder().success(false).message(e.getMessage()).build());
        } catch (Exception e) {
            log.error("Document upload failed for user {}: {}", user.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.builder().success(false)
                    .message("Upload failed. Please try again.").build());
        }
    }

    // ── Student Document List ─────────────────────────────────────────────────

    /**
     * GET /api/v1/documents
     *
     * Returns all documents uploaded by the authenticated student.
     * Storage paths are excluded (OWASP A01).
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyDocuments() {
        User user = getCurrentUser();
        List<DocumentUpload> docs = documentUploadRepository.findByStudentOrderByUploadedAtDesc(user);

        List<Map<String, Object>> response = docs.stream()
            .map(d -> Map.<String, Object>of(
                "id", d.getId(),
                "filename", d.getFilename(),
                "document_type", d.getDocumentType(),
                "verification_status", d.getVerificationStatus(),
                "verification_notes", d.getVerificationNotes() != null ? d.getVerificationNotes() : "",
                "uploaded_at", d.getUploadedAt().toString()
            ))
            .toList();

        return ResponseEntity.ok(response);
    }

    // ── Admin: Suspicious Document Queue ─────────────────────────────────────

    /**
     * GET /api/v1/documents/admin/suspicious
     *
     * Returns all documents flagged as SUSPICIOUS for admin review.
     * FR-38: admin can approve or reject flagged documents.
     *
     * Requires: ROLE_ADMIN
     */
    @GetMapping("/admin/suspicious")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getSuspiciousDocuments() {
        List<DocumentUpload> docs =
            documentUploadRepository.findByVerificationStatusOrderByUploadedAtAsc(VerificationStatus.SUSPICIOUS);

        List<Map<String, Object>> response = docs.stream()
            .map(d -> Map.<String, Object>of(
                "id", d.getId(),
                "student_email", d.getStudent().getEmail(),
                "filename", d.getFilename(),
                "document_type", d.getDocumentType(),
                "verification_notes", d.getVerificationNotes() != null ? d.getVerificationNotes() : "",
                "uploaded_at", d.getUploadedAt().toString()
            ))
            .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/v1/documents/admin/{id}/status
     *
     * Admin manually sets the verification status of a document.
     * Used to process the SUSPICIOUS document review queue.
     *
     * Requires: ROLE_ADMIN
     */
    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> updateDocumentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        DocumentUpload doc = documentUploadRepository.findById(id).orElse(null);
        if (doc == null) return ResponseEntity.notFound().build();

        String statusStr = body.getOrDefault("status", "");
        VerificationStatus newStatus;
        try {
            newStatus = VerificationStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.builder().success(false)
                    .message("Invalid status. Use: VERIFIED, SUSPICIOUS, REJECTED").build());
        }

        doc.setVerificationStatus(newStatus);
        doc.setVerificationNotes(body.getOrDefault("notes", doc.getVerificationNotes()));
        doc.setVerifiedAt(java.time.LocalDateTime.now());
        documentUploadRepository.save(doc);

        log.info("Admin updated document {} status to {}", id, newStatus);
        return ResponseEntity.ok(ApiResponse.builder().success(true)
            .message("Document status updated to " + newStatus).build());
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (User) auth.getPrincipal();
    }
}
