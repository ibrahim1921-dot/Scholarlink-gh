package com.scholarlinkgh.integration;

import com.scholarlinkgh.dto.ScholarshipRequest;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipCategory;
import com.scholarlinkgh.repository.ScholarshipRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDate;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the Scholarship module — /api/v1/scholarships/*
 */
@DisplayName("Scholarship Module Integration Tests")
class ScholarshipIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ScholarshipRepository scholarshipRepository;

    // ── GET /api/v1/scholarships ───────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/scholarships")
    class GetScholarships {

        @Test
        @DisplayName("should return paginated list of active verified scholarships")
        void shouldReturnPaginatedActiveVerifiedScholarships() throws Exception {
            // Arrange — create a verified and active scholarship
            Scholarship scholarship = Scholarship.builder()
                .name("Test Scholarship")
                .provider("Test Foundation")
                .category(ScholarshipCategory.UNDERGRADUATE_INTERNATIONAL)
                .destinationCountry("USA")
                .deadline(LocalDate.now().plusMonths(3))
                .officialLink("https://example.com/scholarship")
                .verified(true)
                .active(true)
                .reportCount(0)
                .createdBy(adminUser)
                .build();
            scholarshipRepository.save(scholarship);

            // Act & Assert
            mockMvc.perform(get("/api/v1/scholarships")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].name", is("Test Scholarship")));
        }

        @Test
        @DisplayName("should return 403 if not authenticated")
        void shouldReturn401IfNotAuthenticated() throws Exception {
            // Act & Assert — no Authorization header
            mockMvc.perform(get("/api/v1/scholarships"))
                .andExpect(status().isForbidden());
        }
    }

    // ── POST /api/v1/scholarships ──────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/scholarships")
    class CreateScholarship {

        @Test
        @DisplayName("should create scholarship when called by ADMIN")
        void shouldCreateScholarshipWhenAdmin() throws Exception {
            // Arrange
            ScholarshipRequest request = new ScholarshipRequest();
            request.setName("Admin Created Scholarship");
            request.setProvider("Admin Foundation");
            request.setCategory(ScholarshipCategory.POSTGRADUATE_INTERNATIONAL);
            request.setDeadline(LocalDate.now().plusMonths(6));
            request.setOfficialLink("https://example.com/admin-scholarship");

            // Act & Assert
            mockMvc.perform(post("/api/v1/scholarships")
                    .header("Authorization", bearer(adminToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Admin Created Scholarship")))
                .andExpect(jsonPath("$.provider", is("Admin Foundation")));
        }

        @Test
        @DisplayName("should return 403 when called by STUDENT")
        void shouldReturn403WhenStudent() throws Exception {
            // Arrange
            ScholarshipRequest request = new ScholarshipRequest();
            request.setName("Student Attempt Scholarship");
            request.setProvider("Student Foundation");
            request.setCategory(ScholarshipCategory.UNDERGRADUATE_GHANA);
            request.setDeadline(LocalDate.now().plusMonths(6));
            request.setOfficialLink("https://example.com/student-scholarship");

            // Act & Assert
            mockMvc.perform(post("/api/v1/scholarships")
                    .header("Authorization", bearer(studentToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
        }
    }

    // ── GET /api/v1/scholarships/{id} ──────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/scholarships/{id}")
    class GetScholarshipById {

        @Test
        @DisplayName("should return scholarship by ID")
        void shouldReturnScholarshipById() throws Exception {
            // Arrange
            Scholarship scholarship = Scholarship.builder()
                .name("Specific Scholarship")
                .provider("Specific Foundation")
                .category(ScholarshipCategory.POSTGRADUATE_GHANA)
                .deadline(LocalDate.now().plusMonths(2))
                .officialLink("https://example.com/specific")
                .verified(true)
                .active(true)
                .reportCount(0)
                .createdBy(adminUser)
                .build();
            scholarship = scholarshipRepository.save(scholarship);

            // Act & Assert
            mockMvc.perform(get("/api/v1/scholarships/" + scholarship.getId())
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(scholarship.getId().intValue())))
                .andExpect(jsonPath("$.name", is("Specific Scholarship")));
        }

        @Test
        @DisplayName("should return 404 if scholarship does not exist")
        void shouldReturn404IfNotFound() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/v1/scholarships/99999")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isNotFound());
        }
    }
}
