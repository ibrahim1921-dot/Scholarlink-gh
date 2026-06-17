package com.scholarlinkgh.integration;

import com.scholarlinkgh.dto.JobApplicationRequest;
import com.scholarlinkgh.dto.JobListingRequest;
import com.scholarlinkgh.entity.JobListing;
import com.scholarlinkgh.repository.JobApplicationRepository;
import com.scholarlinkgh.repository.JobListingRepository;
import com.scholarlinkgh.service.GeminiAIService;
import com.scholarlinkgh.service.MailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the Job module — /api/v1/jobs/*
 *
 * GeminiAIService is mocked so AI matching does not call external APIs.
 * MailService is mocked so no emails are sent.
 */
@DisplayName("Job Module Integration Tests")
class JobIntegrationTest extends BaseIntegrationTest {

    @MockitoBean
    private GeminiAIService geminiAIService;

    @MockitoBean
    private MailService mailService;

    @Autowired
    private JobListingRepository jobListingRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    // ── GET /api/v1/jobs ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/jobs")
    class GetJobs {

        @Test
        @DisplayName("should return paginated list of active job listings")
        void shouldReturnPaginatedActiveJobListings() throws Exception {
            // Arrange
            JobListing job = JobListing.builder()
                .title("Software Engineer Intern")
                .company("Test Corp")
                .description("An internship for aspiring software engineers")
                .location("Accra, Ghana")
                .active(true)
                .createdBy(adminUser)
                .build();
            jobListingRepository.save(job);

            // Act & Assert
            mockMvc.perform(get("/api/v1/jobs")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].title", is("Software Engineer Intern")));
        }
    }

    // ── POST /api/v1/jobs ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/jobs")
    class CreateJob {

        @Test
        @DisplayName("should create job listing when called by ADMIN")
        void shouldCreateJobWhenAdmin() throws Exception {
            // Arrange
            JobListingRequest request = new JobListingRequest();
            request.setTitle("Data Analyst");
            request.setCompany("Analytics Inc");
            request.setDescription("A data analyst position");
            request.setLocation("Remote");

            // Act & Assert
            mockMvc.perform(post("/api/v1/jobs")
                    .header("Authorization", bearer(adminToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Data Analyst")))
                .andExpect(jsonPath("$.company", is("Analytics Inc")));
        }

        @Test
        @DisplayName("should return 403 when called by STUDENT")
        void shouldReturn403WhenStudent() throws Exception {
            // Arrange
            JobListingRequest request = new JobListingRequest();
            request.setTitle("Student Job Attempt");
            request.setCompany("Student Corp");

            // Act & Assert
            mockMvc.perform(post("/api/v1/jobs")
                    .header("Authorization", bearer(studentToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
        }
    }

    // ── POST /api/v1/jobs/{id}/apply ───────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/jobs/{id}/apply")
    class ApplyToJob {

        @Test
        @DisplayName("should submit job application and return 200")
        void shouldSubmitApplicationAndReturn200() throws Exception {
            // Arrange
            JobListing job = JobListing.builder()
                .title("Apply Test Job")
                .company("Apply Corp")
                .active(true)
                .createdBy(adminUser)
                .build();
            job = jobListingRepository.save(job);

            JobApplicationRequest request = new JobApplicationRequest();
            request.setCoverLetter("I am interested in this position.");

            // Act & Assert
            mockMvc.perform(post("/api/v1/jobs/" + job.getId() + "/apply")
                    .header("Authorization", bearer(studentToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", notNullValue()));
        }

        @Test
        @DisplayName("should return 404 if job does not exist")
        void shouldReturn404IfJobDoesNotExist() throws Exception {
            // Act & Assert
            mockMvc.perform(post("/api/v1/jobs/99999/apply")
                    .header("Authorization", bearer(studentToken))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isNotFound());
        }
    }

    // ── GET /api/v1/jobs/my-applications ───────────────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/jobs/my-applications")
    class GetMyApplications {

        @Test
        @DisplayName("should return student's own applications")
        void shouldReturnStudentOwnApplications() throws Exception {
            // Act & Assert
            mockMvc.perform(get("/api/v1/jobs/my-applications")
                    .header("Authorization", bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        }
    }
}
