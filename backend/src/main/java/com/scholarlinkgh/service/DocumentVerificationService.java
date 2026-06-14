package com.scholarlinkgh.service;

import com.scholarlinkgh.entity.DocumentUpload;
import com.scholarlinkgh.entity.DocumentType;
import com.scholarlinkgh.entity.StudentProfile;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.entity.VerificationStatus;
import com.scholarlinkgh.repository.DocumentUploadRepository;
import com.scholarlinkgh.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DocumentVerificationService — handles document upload, storage,
 * text extraction, and AI-based first-level verification.
 *
 * FR-38: when a document is uploaded:
 *   1. Apache Tika detects the MIME type (rejects non-PDF/image files)
 *   2. Apache PDFBox extracts text from PDFs
 *   3. GeminiAIService analyses the text against the student's profile
 *   4. Suspicious documents are flagged for admin review
 *
 * FR-41: checks that the student has accepted the document disclaimer
 *        within the last 90 days before allowing any upload.
 *
 * OWASP A04: file type validated server-side with Tika, not by extension.
 * OWASP A01: storage path is never returned to the student directly.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentVerificationService {

    /** Maximum upload file size in MB — sourced from .env DOCUMENT_MAX_FILE_SIZE_MB. */
    @Value("${document.max-file-size-mb:10}")
    private int maxFileSizeMb;

    /** Days a document disclaimer acceptance remains valid — sourced from .env DOCUMENT_DISCLAIMER_VALIDITY_DAYS. */
    @Value("${document.disclaimer-validity-days:90}")
    private int disclaimerValidityDays;

    /** Computed from maxFileSizeMb after @Value injection. */
    private long maxFileSizeBytes;

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff"
    );

    @Value("${document.upload.directory:uploads}")
    private String uploadDirectory;

    @jakarta.annotation.PostConstruct
    void init() {
        this.maxFileSizeBytes = (long) maxFileSizeMb * 1024 * 1024;
    }

    private final DocumentUploadRepository documentUploadRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final GeminiAIService geminiAIService;
    private final AuditService auditService;
    private final Tika tika = new Tika();

    // ── FR-41: Disclaimer Check ───────────────────────────────────────────────

    /**
     * Returns true if the student has accepted the document disclaimer
     * within the last 90 days.
     *
     * FR-41: must re-accept every 90 days (annually per FR-41 spec).
     *
     * @param user the authenticated student
     */
    public boolean hasValidDisclaimer(User user) {
        if (user.getDocumentDisclaimerAcceptedAt() == null) return false;
        LocalDateTime cutoff = LocalDateTime.now().minusDays(disclaimerValidityDays);
        return user.getDocumentDisclaimerAcceptedAt().isAfter(cutoff);
    }

    // ── Upload & Verification Pipeline ───────────────────────────────────────

    /**
     * Uploads a document, extracts text, and runs AI first-level verification.
     *
     * @param user         the authenticated student
     * @param file         the uploaded file
     * @param documentType the type of document being uploaded
     * @return the persisted DocumentUpload entity with verification result
     * @throws IllegalArgumentException if file type or size is invalid
     * @throws IllegalStateException    if the disclaimer has not been accepted
     */
    @Transactional
    public DocumentUpload uploadAndVerify(User user, MultipartFile file, DocumentType documentType)
            throws IOException {

        // FR-41: block upload if disclaimer not accepted or expired
        if (!hasValidDisclaimer(user)) {
            throw new IllegalStateException(
                "Please accept the document integrity disclaimer before uploading documents.");
        }

        // Validate file size
        if (file.getSize() > maxFileSizeBytes) {
            throw new IllegalArgumentException("File size must not exceed " + maxFileSizeMb + " MB.");
        }

        // Validate MIME type with Apache Tika (not by extension)
        byte[] fileBytes = file.getBytes();
        String mimeType = tika.detect(fileBytes);
        if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException(
                "Only PDF, JPEG, PNG, and TIFF files are accepted. Detected type: " + mimeType);
        }

        // Save file to storage
        String storagePath = saveFileToStorage(file, fileBytes, user.getId());

        // Build the DocumentUpload entity with PENDING status
        DocumentUpload upload = DocumentUpload.builder()
            .student(user)
            .filename(sanitiseFilename(file.getOriginalFilename()))
            .storagePath(storagePath)
            .documentType(documentType)
            .verificationStatus(VerificationStatus.PENDING)
            .fileSizeBytes(file.getSize())
            .mimeType(mimeType)
            .build();

        upload = documentUploadRepository.save(upload);

        // Run AI verification asynchronously-styled (synchronous for MVP)
        performAiVerification(upload, fileBytes, user);

        auditService.log(user.getId(), user.getEmail(),
            "UPLOAD_DOCUMENT", "DocumentUpload", upload.getId(), documentType.name());

        log.info("Document uploaded and verified for user {}: {} → {}",
                 user.getEmail(), documentType, upload.getVerificationStatus());

        return upload;
    }

    // ── AI Verification ───────────────────────────────────────────────────────

    /**
     * Runs AI first-level verification on the uploaded document.
     * Updates the DocumentUpload entity with the result.
     *
     * FR-38: checks for official letterhead/keywords, profile name/GPA match,
     *        and absence of visible alterations.
     */
    @Transactional
    public void performAiVerification(DocumentUpload upload, byte[] fileBytes, User user) {
        String extractedText = extractText(fileBytes, upload.getMimeType());
        if (extractedText == null || extractedText.isBlank()) {
            upload.setVerificationStatus(VerificationStatus.SUSPICIOUS);
            upload.setVerificationNotes("Could not extract text from document for analysis.");
            upload.setVerifiedAt(LocalDateTime.now());
            documentUploadRepository.save(upload);
            return;
        }

        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        String verificationPrompt = buildVerificationPrompt(extractedText, upload.getDocumentType(), user, profile);

        String aiResponse = geminiAIService.callVerificationPrompt(verificationPrompt);
        VerificationResult result = parseVerificationResult(aiResponse);

        upload.setVerificationStatus(result.status());
        upload.setVerificationNotes(result.notes());
        upload.setVerifiedAt(LocalDateTime.now());
        documentUploadRepository.save(upload);

        if (result.status() == VerificationStatus.SUSPICIOUS) {
            log.warn("Document {} flagged as SUSPICIOUS for user {} — queued for admin review",
                     upload.getId(), user.getEmail());
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Extracts plain text from a PDF using Apache PDFBox.
     * For images, returns null (image OCR not in scope for MVP).
     */
    private String extractText(byte[] fileBytes, String mimeType) {
        if (!"application/pdf".equals(mimeType)) {
            return "[IMAGE_DOCUMENT - text extraction not available for image files]";
        }
        try (PDDocument document = Loader.loadPDF(fileBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (IOException e) {
            log.warn("Failed to extract text from PDF: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Builds the AI prompt for document verification.
     */
    private String buildVerificationPrompt(
            String documentText, DocumentType documentType,
            User user, StudentProfile profile) {

        String profileName = user.getUsername();
        String profileGpa = profile != null && profile.getGpa() != null
            ? profile.getGpa().toString() : "Not provided";
        String profileInstitution = profile != null ? orNA(profile.getInstitution()) : "Not provided";

        return String.format("""
            You are a document verification system for scholarship applications.

            Verify the following %s document.

            STUDENT PROFILE:
            Name: %s
            GPA: %s
            Institution: %s

            DOCUMENT TEXT (extracted):
            \"\"\"%s\"\"\"

            Check for:
            1. Official letterhead or authoritative keywords for a %s document
            2. Student name appears in document (should match: %s)
            3. For transcripts: GPA should match approximately %s
            4. Signs of alteration (unusual formatting, mixed fonts, inconsistencies)
            5. Document appears to be a legitimate official document

            Respond with ONLY a JSON object (no markdown):
            {
              "verification_status": "VERIFIED" | "SUSPICIOUS" | "REJECTED",
              "verification_notes": "<brief explanation of the decision>",
              "name_match": <true|false>,
              "has_official_markers": <true|false>,
              "signs_of_alteration": <true|false>
            }
            """,
            documentType.name(),
            profileName, profileGpa, profileInstitution,
            documentText.substring(0, Math.min(documentText.length(), 3000)),
            documentType.name(),
            profileName, profileGpa
        );
    }

    /**
     * Parses the AI verification response into a VerificationResult.
     */
    private VerificationResult parseVerificationResult(String aiResponse) {
        if (aiResponse == null || aiResponse.isBlank()) {
            return new VerificationResult(VerificationStatus.SUSPICIOUS,
                "AI verification unavailable — manual review required.");
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String cleaned = cleanJson(aiResponse);
            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(cleaned);

            String statusStr = node.path("verification_status").asText("SUSPICIOUS");
            VerificationStatus status;
            try {
                status = VerificationStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                status = VerificationStatus.SUSPICIOUS;
            }

            String notes = node.path("verification_notes").asText("No details provided.");
            return new VerificationResult(status, notes);

        } catch (Exception e) {
            log.warn("Failed to parse verification result: {}", e.getMessage());
            return new VerificationResult(VerificationStatus.SUSPICIOUS,
                "Verification parsing failed — manual review required.");
        }
    }

    private String cleanJson(String text) {
        String s = text.trim();
        if (s.startsWith("```json")) s = s.substring(7);
        else if (s.startsWith("```")) s = s.substring(3);
        if (s.endsWith("```")) s = s.substring(0, s.length() - 3);
        return s.trim();
    }

    /**
     * Saves the uploaded file to local storage (or an S3 bucket in production).
     * Returns the storage path for the database record.
     */
    private String saveFileToStorage(MultipartFile file, byte[] fileBytes, Long userId) throws IOException {
        Path uploadDir = Paths.get(uploadDirectory, "user_" + userId);
        Files.createDirectories(uploadDir);

        String extension = getExtension(file.getOriginalFilename());
        String uniqueFilename = UUID.randomUUID() + extension;
        Path destination = uploadDir.resolve(uniqueFilename);

        Files.write(destination, fileBytes);
        return destination.toString();
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return "." + filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private String sanitiseFilename(String filename) {
        if (filename == null) return "document";
        // Remove path traversal characters
        return filename.replaceAll("[^a-zA-Z0-9._\\- ]", "_");
    }

    private String orNA(String value) {
        return (value == null || value.isBlank()) ? "N/A" : value;
    }

    /** Internal result record for verification parsing. */
    private record VerificationResult(VerificationStatus status, String notes) {}
}
