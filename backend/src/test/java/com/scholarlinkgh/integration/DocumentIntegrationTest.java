package com.scholarlinkgh.integration;

import com.scholarlinkgh.service.GeminiAIService;
import com.scholarlinkgh.service.MailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the Document module — /api/v1/documents/*
 *
 * GeminiAIService is mocked so AI verification does not call external APIs.
 * MailService is mocked so no emails are sent.
 */
@DisplayName("Document Module Integration Tests")
class DocumentIntegrationTest extends BaseIntegrationTest {

    @MockitoBean
    private GeminiAIService geminiAIService;

    @MockitoBean
    private MailService mailService;

    // ── POST /api/v1/documents/accept-disclaimer ──────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/documents/accept-disclaimer")
    class AcceptDisclaimer {

        @Test
        @DisplayName("should accept disclaimer and return 200")
        void shouldAcceptDisclaimerAndReturn200() throws Exception {
            // Act & Assert
            mockMvc.perform(post("/api/v1/documents/accept-disclaimer")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", notNullValue()));
        }
    }

    // ── GET /api/v1/documents/disclaimer-status ───────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/documents/disclaimer-status")
    class DisclaimerStatus {

        @Test
        @DisplayName("should return disclaimer status as not accepted")
        void shouldReturnDisclaimerStatusNotAccepted() throws Exception {
            // Act & Assert — disclaimer not yet accepted
            mockMvc.perform(get("/api/v1/documents/disclaimer-status")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disclaimer_accepted", is(false)));
        }

        @Test
        @DisplayName("should return disclaimer status as accepted after accepting")
        void shouldReturnDisclaimerStatusAccepted() throws Exception {
            // Arrange — set disclaimer accepted
            studentUser.setDocumentDisclaimerAcceptedAt(LocalDateTime.now());
            userRepository.save(studentUser);

            // Act & Assert
            mockMvc.perform(get("/api/v1/documents/disclaimer-status")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disclaimer_accepted", is(true)));
        }
    }

    // ── POST /api/v1/documents/upload ──────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/documents/upload")
    class UploadDocument {

        @Test
        @DisplayName("should upload a PDF file and return 201")
        void shouldUploadPdfFileAndReturn201() throws Exception {
            // Arrange — accept disclaimer first
            studentUser.setDocumentDisclaimerAcceptedAt(LocalDateTime.now());
            userRepository.save(studentUser);

            // Create a minimal PDF byte array (PDF magic bytes)
            byte[] pdfContent = createMinimalPdf();

            MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-document.pdf",
                "application/pdf",
                pdfContent
            );

            // Act & Assert
            mockMvc.perform(multipart("/api/v1/documents/upload")
                    .file(file)
                    .param("type", "TRANSCRIPT")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filename", notNullValue()))
                .andExpect(jsonPath("$.document_type", is("TRANSCRIPT")));
        }

        @Test
        @DisplayName("should return 400 if file is missing")
        void shouldReturn400IfFileMissing() throws Exception {
            // Arrange — accept disclaimer first
            studentUser.setDocumentDisclaimerAcceptedAt(LocalDateTime.now());
            userRepository.save(studentUser);

            // Act & Assert — no file attached
            mockMvc.perform(multipart("/api/v1/documents/upload")
                    .param("type", "TRANSCRIPT")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 if file type is not PDF, JPEG, or PNG")
        void shouldReturn400IfFileTypeNotAllowed() throws Exception {
            // Arrange — accept disclaimer first
            studentUser.setDocumentDisclaimerAcceptedAt(LocalDateTime.now());
            userRepository.save(studentUser);

            // Create a text file (not allowed)
            MockMultipartFile textFile = new MockMultipartFile(
                "file",
                "test-document.txt",
                "text/plain",
                "This is a plain text file".getBytes()
            );

            // Act & Assert
            mockMvc.perform(multipart("/api/v1/documents/upload")
                    .file(textFile)
                    .param("type", "TRANSCRIPT")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
        }
    }

    // ── Helper — creates a minimal valid PDF ──────────────────────────────────

    private byte[] createMinimalPdf() {
        String pdf = "%PDF-1.4\n" +
            "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
            "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
            "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n" +
            "xref\n0 4\n" +
            "0000000000 65535 f \n" +
            "0000000009 00000 n \n" +
            "0000000058 00000 n \n" +
            "0000000115 00000 n \n" +
            "trailer<</Size 4/Root 1 0 R>>\n" +
            "startxref\n190\n%%EOF";
        return pdf.getBytes();
    }
}
