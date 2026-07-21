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
import java.util.Map;
import java.util.UUID;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Async;

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
    private final Cloudinary cloudinary;
    private final ObjectProvider<DocumentVerificationService> selfProvider;
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

        // Upload to Cloudinary
        Map<String, Object> params = ObjectUtils.asMap(
            "resource_type", "application/pdf".equals(mimeType) ? "raw" : "image",
            "folder", "scholarlink/documents/user_" + user.getId()
        );
        Map<?, ?> uploadResult = cloudinary.uploader().upload(fileBytes, params);
        String secureUrl = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");

        // Build the DocumentUpload entity with PENDING status
        DocumentUpload upload = DocumentUpload.builder()
            .student(user)
            .filename(sanitiseFilename(file.getOriginalFilename()))
            .storagePath(secureUrl)
            .cloudinaryPublicId(publicId)
            .documentType(documentType)
            .verificationStatus(VerificationStatus.PENDING)
            .fileSizeBytes(file.getSize())
            .mimeType(mimeType)
            .build();

        upload = documentUploadRepository.save(upload);

        // Run AI verification asynchronously through proxy
        selfProvider.getObject().performAiVerification(upload, fileBytes, user);

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
    @Async
    @Transactional
    public void performAiVerification(DocumentUpload upload, byte[] fileBytes, User user) {
        log.info("Starting AI Verification asynchronously. Thread: {}", Thread.currentThread().getName());
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

    /**
     * Deletes a document from Cloudinary and the database.
     */
    @Transactional
    public void deleteDocument(Long id, User user) {
        DocumentUpload doc = documentUploadRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!doc.getStudent().getId().equals(user.getId())) {
            throw new IllegalStateException("You do not have permission to delete this document.");
        }

        if (doc.getCloudinaryPublicId() != null) {
            try {
                cloudinary.uploader().destroy(doc.getCloudinaryPublicId(), ObjectUtils.emptyMap());
            } catch (Exception e) {
                log.warn("Failed to delete Cloudinary asset {}: {}", doc.getCloudinaryPublicId(), e.getMessage());
                // Proceed to delete from DB anyway, or we could throw. Proceeding is safer for user experience.
            }
        }
        
        documentUploadRepository.delete(doc);
        log.info("Document {} deleted by user {}", id, user.getEmail());
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

        StringBuilder prompt = new StringBuilder();
        prompt.append(buildSystemRoleAndContext(documentType, user, profile));
        prompt.append(buildVerificationFramework());
        prompt.append(buildTypeSpecificRules(documentType));
        prompt.append(buildDecisionFramework());
        prompt.append(buildJsonResponseInstructions());
        prompt.append(buildExtractedTextSection(documentText));

        return prompt.toString();
    }

    private String buildSystemRoleAndContext(DocumentType documentType, User user, StudentProfile profile) {
        String profileName = user.getDisplayName();
        String profileGpa = profile != null && profile.getGpa() != null ? profile.getGpa().toString() : "Not provided";
        String profileInstitution = profile != null ? orNA(profile.getInstitution()) : "Not provided";
        String profileEducation = profile != null ? orNA(profile.getEducationLevel()) : "Not provided";
        String profileField = profile != null ? orNA(profile.getFieldOfStudy()) : "Not provided";
        String profileGradYear = profile != null && profile.getGraduationYear() != null ? profile.getGraduationYear().toString() : "Not provided";

        return String.format("""
            You are an expert document verification AI for a scholarship platform.
            
            Your task is to verify the following uploaded document which the user claims is a: %s
            
            STUDENT PROFILE:
            - Name: %s
            - GPA: %s
            - Institution: %s
            - Education Level: %s
            - Field of Study: %s
            - Graduation Year: %s
            
            """,
            documentType.name(), profileName, profileGpa, profileInstitution, profileEducation, profileField, profileGradYear);
    }

    private String buildVerificationFramework() {
        return """
            VERIFICATION FRAMEWORK:
            Evaluate the document using the following steps:
            1. Document Type: Determine what kind of document the extracted text actually represents.
            2. Evidence: Compare the detected document against the specific criteria for the claimed document type.
            3. Common Rules: Ensure the document is readable, meaningful, not blank, generally authentic, and internally consistent.
            4. Anti-Hallucination: Base conclusions ONLY on extracted text. Do NOT invent missing information or assume fraud solely because a piece of information is missing.
            5. Severity: Differentiate between minor issues (formatting differences, poor OCR, missing optional fields) and major issues (different name, completely unrelated document, obvious manipulation, impossible GPA).
            
            """;
    }

    private String buildTypeSpecificRules(DocumentType documentType) {
        String base = "TYPE-SPECIFIC CRITERIA for " + documentType.name() + ":\n";
        switch (documentType) {
            case TRANSCRIPT:
                return base + """
                    EVALUATE: Institution name, academic programme, student name, list of courses, grades, GPA, and general transcript structure. Look for academic authenticity indicators.
                    DO NOT REQUIRE: Signatures (unofficial transcripts are acceptable).
                    """;
            case CV:
                return base + """
                    EVALUATE: Professional resume structure, applicant name, education history, work experience, projects, skills, and logical formatting.
                    DO NOT EXPECT: GPA, official letterhead, or institutional formatting.
                    """;
            case STATEMENT:
                return base + """
                    EVALUATE: Coherent narrative, applicant motivation, writing quality, paragraph structure, logical flow, and applicant identity where referenced.
                    DO NOT EXPECT: GPA, official letterhead, or academic transcript formatting.
                    """;
            case REFERENCE:
                return base + """
                    EVALUATE: Recommendation language, referee information, professional tone, sign-off/signature (if text allows), and relationship between referee and applicant.
                    DO NOT EXPECT: Applicant's GPA or exhaustive academic records.
                    """;
            case IDENTITY:
                return base + """
                    EVALUATE: Identity-document structure (e.g., passport, national ID), name, identification number, dates (issue/expiry), and authenticity indicators.
                    DO NOT EXPECT: Institutional formatting, academic history, or GPA.
                    """;
            case FINANCIAL_PROOF:
                return base + """
                    EVALUATE: Sponsor or income information, financial figures, supporting explanation, and financial consistency (e.g., bank statements, tax returns).
                    DO NOT EXPECT: GPA or academic history.
                    """;
            case OTHER:
            default:
                return base + """
                    EVALUATE: Perform lightweight validation. Ensure the document is readable, genuine, relevant, and not obviously manipulated.
                    DO NOT EXPECT: Any fixed or specific structure.
                    """;
        }
    }

    private String buildDecisionFramework() {
        return """
            DECISION MATRIX (Select one status based on the framework above):
            
            VERIFIED: The document generally matches the selected type. No significant authenticity concerns or fraud evidence. Any inconsistencies are minor and explainable.
            SUSPICIOUS: Represents uncertainty. The detected type differs from the selected type (e.g. CV instead of STATEMENT), important information is missing, or OCR quality is too poor for confident verification.
            REJECTED: High confidence of invalidity. The document is completely unrelated, blank, severely manipulated, contains fabricated/impossible content, or has a clear identity mismatch.
            
            """;
    }

    private String buildJsonResponseInstructions() {
        return """
            JSON RESPONSE FORMAT:
            You MUST respond with ONLY a valid JSON object. No markdown, no prose, and no explanations before or after the JSON.
            
            BOOLEAN FIELD DEFINITIONS:
            - name_match: true if the applicant's name reasonably matches the supplied profile. false otherwise.
            - has_official_markers: true when official markers are expected for the selected document type AND are present. false when expected but absent, OR when not applicable (e.g., CVs, Personal Statements).
            - signs_of_alteration: true ONLY when there is evidence suggesting manipulation, tampering, or fabrication. false otherwise (do not infer alteration solely because information is missing).
            
            {
              "verification_status": "VERIFIED" | "SUSPICIOUS" | "REJECTED",
              "verification_notes": "<Concise, evidence-based explanation of the primary reasons for your decision. Max 2-3 sentences.>",
              "name_match": <true|false>,
              "has_official_markers": <true|false>,
              "signs_of_alteration": <true|false>
            }
            
            """;
    }

    private String buildExtractedTextSection(String documentText) {
        return String.format("""
            DOCUMENT TEXT (extracted):
            \"\"\"%s\"\"\"
            """,
            documentText.substring(0, Math.min(documentText.length(), 4000))
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
