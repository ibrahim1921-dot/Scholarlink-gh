package com.scholarlinkgh.integration;

import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipCategory;
import com.scholarlinkgh.entity.ScholarshipMatch;
import com.scholarlinkgh.repository.ScholarshipMatchRepository;
import com.scholarlinkgh.repository.ScholarshipRepository;
import com.scholarlinkgh.service.GeminiAIService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the AI module — /api/v1/ai/*
 *
 * GeminiAIService is mocked to prevent real API calls during tests.
 * The rest of the stack (controller → service → repository → H2) is real.
 */
@DisplayName("AI Module Integration Tests")
class AIIntegrationTest extends BaseIntegrationTest {

    @MockitoBean
    private GeminiAIService geminiAIService;

    @Autowired
    private ScholarshipRepository scholarshipRepository;

    @Autowired
    private ScholarshipMatchRepository scholarshipMatchRepository;

    // ── GET /api/v1/ai/scholarships/matches ───────────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/ai/scholarships/matches")
    class GetScholarshipMatches {

        @Test
        @DisplayName("should return matches for authenticated student")
        void shouldReturnMatchesForAuthenticatedStudent() throws Exception {
            // Arrange — create a scholarship and a match record
            Scholarship scholarship = Scholarship.builder()
                .name("AI Matched Scholarship")
                .provider("AI Foundation")
                .category(ScholarshipCategory.UNDERGRADUATE_INTERNATIONAL)
                .deadline(LocalDate.now().plusMonths(3))
                .officialLink("https://example.com/ai-scholarship")
                .verified(true)
                .active(true)
                .reportCount(0)
                .createdBy(adminUser)
                .build();
            scholarship = scholarshipRepository.save(scholarship);

            ScholarshipMatch match = ScholarshipMatch.builder()
                .student(studentUser)
                .scholarship(scholarship)
                .matchScore(85)
                .matchExplanation("Strong profile match")
                .build();
            scholarshipMatchRepository.save(match);

            // Mock the AI service to return the pre-created match
            when(geminiAIService.matchStudentToScholarships(any()))
                .thenReturn(List.of(match));

            // Act & Assert
            mockMvc.perform(get("/api/v1/ai/scholarships/matches")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$[0].matchScore", is(85)))
                .andExpect(jsonPath("$[0].scholarshipName", is("AI Matched Scholarship")));
        }

        @Test
        @DisplayName("should return 403 if not authenticated")
        void shouldReturn401IfNotAuthenticated() throws Exception {
            // Act & Assert — no Authorization header
            mockMvc.perform(get("/api/v1/ai/scholarships/matches"))
                .andExpect(status().isForbidden());
        }
    }
}
