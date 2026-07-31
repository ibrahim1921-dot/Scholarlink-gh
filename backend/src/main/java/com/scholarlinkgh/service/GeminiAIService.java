package com.scholarlinkgh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.scholarlinkgh.entity.EligibilityCheck;
import com.scholarlinkgh.entity.JobListing;
import com.scholarlinkgh.entity.Scholarship;
import com.scholarlinkgh.entity.ScholarshipMatch;
import com.scholarlinkgh.entity.StudentProfile;
import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.EligibilityCheckRepository;
import com.scholarlinkgh.repository.ScholarshipMatchRepository;
import com.scholarlinkgh.repository.ScholarshipRepository;
import com.scholarlinkgh.repository.StudentProfileRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * GeminiAIService — integrates with the Google Gemini API to power:
 *
 *   FR-09: AI scholarship matching (ranked list with scores 0-100)
 *   FR-10: profile strength assessment and improvement suggestions
 *   FR-11: eligibility checking against specific scholarship requirements
 *   FR-19: personal statement generation
 *   FR-20: essay review and scoring
 *   FR-43: AI job matching
 *   FR-45: AI CV generation
 *   FR-46: AI cover letter generation
 *   FR-40: plagiarism / similarity detection for personal statements
 *
 * Match and eligibility results are cached for 24 hours in the database to avoid repeated
 * API calls for unchanged profiles. Both caches are explicitly invalidated via ProfileController
 * when the student updates their profile.
 *
 * OWASP A02: the API key is injected from application.properties and never
 * logged or returned in any API response.
 */
@Slf4j
@Service
public class GeminiAIService {

    // ── Injected from application.properties → sourced from .env ─────────────

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.api-url:https://generativelanguage.googleapis.com/v1/models}")
    private String geminiApiBaseUrl;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    @Value("${gemini.max-tokens:4096}")
    private int maxTokens;

    @Value("${gemini.temperature:0.7}")
    private double temperature;

    /** Hours to cache AI match results in the database before re-running. */
    @Value("${gemini.match-cache-hours:24}")
    private int matchCacheHours;

    /** Max scholarships sent to Gemini per matching call (prompt size limit). */
    @Value("${gemini.max-scholarships-in-prompt:50}")
    private int maxScholarshipsInPrompt;

    @Value("${gemini.connect-timeout-seconds:30}")
    private int connectTimeoutSeconds;

    @Value("${gemini.read-timeout-seconds:60}")
    private int readTimeoutSeconds;

    @Value("${gemini.write-timeout-seconds:30}")
    private int writeTimeoutSeconds;

    private final ScholarshipRepository scholarshipRepository;
    private final ScholarshipMatchRepository scholarshipMatchRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final EligibilityCheckRepository eligibilityCheckRepository;
    private final AiCreditService aiCreditService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Built in @PostConstruct after @Value fields are injected
    private OkHttpClient httpClient;

    public GeminiAIService(
            ScholarshipRepository scholarshipRepository,
            ScholarshipMatchRepository scholarshipMatchRepository,
            StudentProfileRepository studentProfileRepository,
            EligibilityCheckRepository eligibilityCheckRepository,
            AiCreditService aiCreditService) {
        this.scholarshipRepository = scholarshipRepository;
        this.scholarshipMatchRepository = scholarshipMatchRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.eligibilityCheckRepository = eligibilityCheckRepository;
        this.aiCreditService = aiCreditService;
    }

    @PostConstruct
    void buildHttpClient() {
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(connectTimeoutSeconds, TimeUnit.SECONDS)
            .readTimeout(readTimeoutSeconds, TimeUnit.SECONDS)
            .writeTimeout(writeTimeoutSeconds, TimeUnit.SECONDS)
            .build();
    }

    // ── FR-09 + FR-10: AI Scholarship Matching ────────────────────────────────

    /**
     * Matches a student to all active scholarships using Gemini AI.
     *
     * Results are cached in the database for 24 hours. If the student's
     * profile has not changed and cached results exist, they are returned
     * immediately without an API call.
     *
     * @param user   the authenticated student
     * @return ranked list of ScholarshipMatch objects (highest score first)
     */
    @Transactional
    public List<ScholarshipMatch> matchStudentToScholarships(User user) {
        // Check for fresh cached results
        LocalDateTime cacheThreshold = LocalDateTime.now().minusHours(matchCacheHours);
        List<ScholarshipMatch> cached =
            scholarshipMatchRepository.findFreshMatchesForStudent(user, cacheThreshold);

        if (!cached.isEmpty()) {
            log.info("Returning {} cached scholarship matches for user {}", cached.size(), user.getEmail());
            return cached;
        }

        // No valid cache — call Gemini API
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null) {
            log.warn("No student profile found for user {} — cannot generate matches", user.getEmail());
            return List.of();
        }

        // Load active scholarships (capped to avoid prompt size issues)
        List<Scholarship> scholarships = scholarshipRepository
            .findAllFiltered(null, null, null, null, null, null,
                PageRequest.of(0, maxScholarshipsInPrompt))
            .getContent();

        if (scholarships.isEmpty()) {
            return List.of();
        }

        String prompt = buildMatchingPrompt(profile, scholarships);
        String rawResponse = callGemini(prompt);
        aiCreditService.consumeCredit(user);

        List<ScholarshipMatch> matches = parseMatchingResponse(rawResponse, user, scholarships);

        // Persist new matches, clearing any stale records first
        scholarshipMatchRepository.deleteAllByStudent(user);
        scholarshipMatchRepository.saveAll(matches);

        // Update profile strength score if Gemini provided one
        updateProfileStrengthFromResponse(profile, rawResponse);

        log.info("Generated {} scholarship matches for user {}", matches.size(), user.getEmail());
        return matches;
    }

    // ── FR-11: Eligibility Checker ────────────────────────────────────────────

    /**
     * Checks a student's eligibility for a specific scholarship.
     *
     * Returns a structured result with met criteria, missing criteria,
     * and recommended actions.
     *
     * @param user         the authenticated student
     * @param scholarship  the scholarship to check against
     * @return JSON string with eligibility details (parsed by the controller)
     */
    @Transactional
    public String checkEligibility(User user, Scholarship scholarship) {
        // Check for fresh cached results
        LocalDateTime cacheThreshold = LocalDateTime.now().minusHours(matchCacheHours);
        Optional<EligibilityCheck> cached =
            eligibilityCheckRepository.findFreshEligibilityCheck(user, scholarship, cacheThreshold);

        if (cached.isPresent()) {
            log.info("Returning cached eligibility check for user={}, scholarship={}", user.getEmail(), scholarship.getId());
            return cached.get().getEligibilityDetails();
        }

        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null) {
            return buildErrorJson("Complete your profile first to check eligibility.");
        }

        String prompt = buildEligibilityPrompt(profile, scholarship);
        log.info("Calling Gemini for eligibility check: user={}, scholarship={}", user.getEmail(), scholarship.getId());
        log.info("ACTUAL PROMPT TEXT SENT TO GEMINI:\n{}", prompt);
        String rawResponse = callGemini(prompt);
        aiCreditService.consumeCredit(user);

        log.debug("Gemini eligibility raw response: {}", rawResponse);
        String jsonBlock = extractJsonBlock(rawResponse);

        // Parse the JSON block to extract the 'overallMeets' boolean for isEligible field
        boolean isEligible = false;
        try {
            JsonNode root = objectMapper.readTree(jsonBlock);
            isEligible = root.path("overallMeets").asBoolean(false);
        } catch (Exception e) {
            log.warn("Failed to parse 'meets' boolean from Gemini eligibility response: {}", e.getMessage());
        }

        // Persist new check, clearing any stale records first
        eligibilityCheckRepository.deleteByStudentAndScholarship(user, scholarship);
        
        EligibilityCheck check = EligibilityCheck.builder()
            .student(user)
            .scholarship(scholarship)
            .isEligible(isEligible)
            .eligibilityDetails(jsonBlock)
            .build();
        eligibilityCheckRepository.save(check);

        return jsonBlock;
    }

    // ── FR-19: Personal Statement Generator ───────────────────────────────────

    /**
     * Generates a personalised personal statement for a scholarship.
     *
     * @param user           the authenticated student
     * @param scholarship    the target scholarship
     * @param keyPoints      optional list of themes or achievements to include
     * @return generated personal statement text
     */
    public String generatePersonalStatement(User user, Scholarship scholarship, List<String> keyPoints) {
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null) {
            return "Please complete your student profile before generating a personal statement.";
        }

        String prompt = buildPersonalStatementPrompt(profile, scholarship, keyPoints);
        return callGemini(prompt);
    }

    // ── FR-20: Essay Review & Scoring ─────────────────────────────────────────

    /**
     * Reviews a student's essay and returns quality score, suggestions, and grammar issues.
     *
     * @param essayText    the essay to review
     * @param scholarship  the target scholarship (for context)
     * @return JSON string with quality_score, specific_suggestions, grammar_issues
     */
    public String reviewEssay(String essayText, Scholarship scholarship) {
        String prompt = buildEssayReviewPrompt(essayText, scholarship);
        String rawResponse = callGemini(prompt);
        return extractJsonBlock(rawResponse);
    }

    // ── FR-40: Plagiarism / Similarity Check ─────────────────────────────────

    /**
     * Checks a personal statement for similarity to known scholarship templates
     * using Gemini's language understanding.
     *
     * Returns true if the text is too similar to generic templates (> 70% similarity).
     *
     * @param statementText the personal statement to check
     * @return true if similarity exceeds threshold (should block submission)
     */
    public boolean isStatementTooGeneric(String statementText) {
        String prompt = String.format("""
            You are a plagiarism and originality checker for scholarship personal statements.

            Analyse the following personal statement and determine if it is:
            1. Too generic / template-like (looks like it was copied from a template)
            2. Likely to be AI-generated boilerplate
            3. Similar to commonly-used phrases in scholarship essays

            Personal Statement:
            \"\"\"%s\"\"\"

            Respond with a JSON object in this exact format (no markdown, no extra text):
            {
              "similarity_score": <number 0-100>,
              "is_too_generic": <true|false>,
              "reason": "<brief explanation>"
            }
            """, statementText);

        try {
            String rawResponse = callGemini(prompt);
            String jsonBlock = extractJsonBlock(rawResponse);
            JsonNode node = objectMapper.readTree(jsonBlock);
            return node.path("is_too_generic").asBoolean(false);
        } catch (Exception e) {
            log.warn("Failed to parse plagiarism check response: {}", e.getMessage());
            return false;
        }
    }

    // ── FR-43: AI Job Matching ────────────────────────────────────────────────

    /**
     * Generates an AI match score and explanation for a student against a list of jobs.
     *
     * @param user  the authenticated student
     * @param jobs  the job listings to evaluate
     * @return JSON string with ranked job match results
     */
    public String matchStudentToJobs(User user, List<?> jobs) {
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null) {
            return buildErrorJson("Complete your student profile to get job matches.");
        }

        String prompt = buildJobMatchingPrompt(profile, jobs);
        return callGemini(prompt);
    }

    // ── FR-45: AI CV Generator ────────────────────────────────────────────────

    /**
     * Generates a structured CV from the student's profile data.
     *
     * @param user the authenticated student
     * @return Markdown-formatted CV text ready for PDF rendering
     */
    public String generateCv(User user) {
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null) {
            return "Please complete your student profile before generating a CV.";
        }

        String prompt = String.format("""
            You are a professional CV writer specialising in graduate and student CVs.

            Generate a complete, well-structured Markdown CV for this student:

            Name: %s
            Email: %s
            Education Level: %s
            Institution: %s
            Field of Study: %s
            GPA: %s
            Graduation Year: %s
            Country Preference: %s
            Languages: %s
            Standardized Tests: %s
            Skills: %s
            Bio: %s
            Achievements: %s

            Format the CV with these sections:
            1. Personal Profile (3-4 sentences)
            2. Education
            3. Skills & Languages
            4. Achievements & Awards
            5. References (state "Available upon request")

            Use professional, concise language. Make it compelling for scholarship and job applications.

            CRITICAL: Respond in plain text only. Do NOT use markdown formatting, asterisks, hashes, or markdown list characters.
            """,
            user.getDisplayName(),
            user.getEmail(),
            orNA(profile.getEducationLevel()),
            orNA(profile.getInstitution()),
            orNA(profile.getFieldOfStudy()),
            profile.getGpa() != null ? profile.getGpa().toString() : "N/A",
            profile.getGraduationYear() != null ? profile.getGraduationYear().toString() : "N/A",
            orNA(profile.getCountryPreference()),
            orNA(profile.getLanguageProficiency()),
            orNA(profile.getStandardizedTests()),
            profile.getSkills() != null && !profile.getSkills().isEmpty() ? String.join(", ", profile.getSkills()) : "Not specified",
            orNA(profile.getBio()),
            orNA(profile.getAchievements())
        );

        return callGemini(prompt);
    }

    /**
     * Generates a tailored CV for a specific job application.
     */
    public String generateTailoredCv(User user, JobListing job) {
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null) {
            return "Please complete your student profile before generating a CV.";
        }

        String prompt = String.format("""
            You are a professional CV writer specialising in graduate and student CVs.

            Generate a complete, well-structured Markdown CV for this student tailored to the specific job listing below.

            JOB LISTING:
            Title: %s
            Company: %s
            Description: %s
            Requirements: %s

            STUDENT PROFILE:
            Name: %s
            Email: %s
            Education Level: %s
            Institution: %s
            Field of Study: %s
            GPA: %s
            Graduation Year: %s
            Country Preference: %s
            Languages: %s
            Standardized Tests: %s
            Skills: %s
            Bio: %s
            Achievements: %s

            Format the CV with these sections:
            1. Personal Profile (3-4 sentences, strongly connecting the student to the job requirements)
            2. Education
            3. Skills & Languages (highlight those relevant to the job)
            4. Achievements & Awards
            5. References (state "Available upon request")

            Use professional, concise language. Make it compelling for this specific job application.

            CRITICAL: Respond in plain text only. Do NOT use markdown formatting, asterisks, hashes, or markdown list characters.
            """,
            job.getTitle(),
            job.getCompany(),
            orNA(job.getDescription()),
            job.getRequirements() != null && !job.getRequirements().isEmpty() ? String.join(", ", job.getRequirements()) : "Not specified",
            user.getDisplayName(),
            user.getEmail(),
            orNA(profile.getEducationLevel()),
            orNA(profile.getInstitution()),
            orNA(profile.getFieldOfStudy()),
            profile.getGpa() != null ? profile.getGpa().toString() : "N/A",
            profile.getGraduationYear() != null ? profile.getGraduationYear().toString() : "N/A",
            orNA(profile.getCountryPreference()),
            orNA(profile.getLanguageProficiency()),
            orNA(profile.getStandardizedTests()),
            profile.getSkills() != null && !profile.getSkills().isEmpty() ? String.join(", ", profile.getSkills()) : "Not specified",
            orNA(profile.getBio()),
            orNA(profile.getAchievements())
        );

        return callGemini(prompt);
    }

    // ── FR-46: Cover Letter Generator ────────────────────────────────────────

    /**
     * Generates a tailored cover letter for a job application.
     *
     * @param user            the authenticated student
     * @param jobTitle        the job title
     * @param jobDescription  the full job description
     * @param company         the company name
     * @return cover letter text
     */
    public String generateCoverLetter(User user, String jobTitle, String jobDescription, String company) {
        StudentProfile profile = studentProfileRepository.findByUser(user).orElse(null);
        if (profile == null) {
            return "Please complete your student profile before generating a cover letter.";
        }

        String prompt = String.format("""
            You are an expert cover letter writer.

            Write a compelling, personalised cover letter for the following job application.

            Job Title: %s
            Company: %s
            Job Description: %s

            Applicant Profile:
            - Name: %s
            - Education: %s at %s, GPA: %s
            - Field: %s
            - Skills: %s
            - Bio: %s
            - Achievements: %s

            Requirements:
            - 3-4 paragraphs, professional but engaging tone
            - Address specific requirements from the job description
            - Highlight relevant achievements
            - Strong opening and closing
            - Do NOT use generic phrases like "I am writing to apply for..."

            CRITICAL: Respond in plain text only. Do NOT use markdown formatting, asterisks, hashes, or markdown list characters.
            """,
            jobTitle,
            company,
            jobDescription,
            user.getDisplayName(),
            orNA(profile.getEducationLevel()),
            orNA(profile.getInstitution()),
            profile.getGpa() != null ? profile.getGpa().toString() : "N/A",
            orNA(profile.getFieldOfStudy()),
            profile.getSkills() != null && !profile.getSkills().isEmpty() ? String.join(", ", profile.getSkills()) : "Not specified",
            orNA(profile.getBio()),
            orNA(profile.getAchievements())
        );

        return callGemini(prompt);
    }

    // ── FR-xx: General AI Assistant ───────────────────────────────────────────

    /**
     * Answers a free-form question from the student.
     * Optionally includes document text as context if provided.
     *
     * @param user         the authenticated student
     * @param message      the user's message
     * @param documentText optional document text
     * @return the AI's response
     */
    public String askAssistant(User user, String message, String documentText) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a helpful and expert scholarship and career assistant for Ghanaian students.\n");
        prompt.append("Answer the following question from the student.\n");
        prompt.append("CRITICAL: Respond in plain text only. Do NOT use markdown formatting, asterisks, hashes, or markdown list characters.\n\n");

        if (documentText != null && !documentText.isBlank()) {
            prompt.append("The student has attached a document for context. Document text:\n\"\"\"\n");
            prompt.append(documentText.substring(0, Math.min(documentText.length(), 10000)));
            prompt.append("\n\"\"\"\n\n");
        }

        prompt.append("Student's Message:\n");
        prompt.append(message);

        return callGemini(prompt.toString());
    }

    // ── Document Verification Support ─────────────────────────────────────────

    /**
     * Calls Gemini with a document verification prompt.
     * Exposed for use by DocumentVerificationService.
     *
     * @param prompt the verification prompt text
     * @return raw Gemini response text, or null on error
     */
    public String callVerificationPrompt(String prompt) {
        return callGemini(prompt);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Calls the Google Gemini API with the given prompt.
     * Returns the text content of the first response candidate, or null on error.
     */
    private String callGemini(String prompt) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.error("GEMINI_API_KEY is not configured. Set gemini.api-key in application.properties.");
            throw new com.scholarlinkgh.exception.AiGenerationException("AI service is currently unavailable. Please try again later.");
        }

        String url = geminiApiBaseUrl + "/" + geminiModel + ":generateContent?key=" + geminiApiKey;

        try {
            ObjectNode requestBody = objectMapper.createObjectNode();

            ArrayNode contents = requestBody.putArray("contents");
            ObjectNode content = contents.addObject();
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put("text", prompt);

            ObjectNode generationConfig = requestBody.putObject("generationConfig");
            generationConfig.put("maxOutputTokens", maxTokens);
            generationConfig.put("temperature", temperature);

            String requestJson = objectMapper.writeValueAsString(requestBody);

            Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(requestJson, MediaType.parse("application/json")))
                .header("content-type", "application/json")
                .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful() || response.body() == null) {
                    String errorBody = response.body() != null ? response.body().string() : "";
                    log.error("Gemini API error: HTTP {} — {} — {}",
                        response.code(), response.message(), errorBody);
                    throw new com.scholarlinkgh.exception.AiGenerationException("Unable to process your request at this time. Please try again.");
                }

                String responseBody = response.body().string();
                JsonNode responseNode = objectMapper.readTree(responseBody);
                // Navigate: candidates[0].content.parts[0].text
                JsonNode candidates = responseNode.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    return candidates.get(0)
                        .path("content")
                        .path("parts")
                        .path(0)
                        .path("text")
                        .asText(null);
                }

                log.warn("Gemini API returned no candidates in response");
                throw new com.scholarlinkgh.exception.AiGenerationException("Unable to process your request at this time. Please try again.");
            }

        } catch (IOException e) {
            log.error("Failed to call Gemini API: {}", e.getMessage());
            throw new com.scholarlinkgh.exception.AiGenerationException("Failed to connect to AI service. Please try again.");
        }
    }

    /**
     * Builds the prompt for FR-09 (scholarship matching) + FR-10 (profile strength).
     */
    private String buildMatchingPrompt(StudentProfile profile, List<Scholarship> scholarships) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
            You are an expert scholarship advisor for Ghanaian students.

            Analyse this student's profile and match them to the most suitable scholarships.
            Also assess their overall competitiveness (profile strength).

            STUDENT PROFILE:
            """);

        sb.append("Education Level: ").append(orNA(profile.getEducationLevel())).append("\n");
        sb.append("GPA: ").append(profile.getGpa() != null ? profile.getGpa() : "Not provided").append("\n");
        sb.append("Field of Study: ").append(orNA(profile.getFieldOfStudy())).append("\n");
        sb.append("Institution: ").append(orNA(profile.getInstitution())).append("\n");
        sb.append("Graduation Year: ").append(profile.getGraduationYear() != null ? profile.getGraduationYear() : "N/A").append("\n");
        sb.append("Country Preference: ").append(orNA(profile.getCountryPreference())).append("\n");
        sb.append("Languages: ").append(orNA(profile.getLanguageProficiency())).append("\n");
        sb.append("Standardized Tests: ").append(orNA(profile.getStandardizedTests())).append("\n");
        sb.append("Skills: ").append(profile.getSkills() != null && !profile.getSkills().isEmpty() ? String.join(", ", profile.getSkills()) : "Not specified").append("\n");
        sb.append("Financial Need: ").append(profile.getFinancialNeed() != null ? profile.getFinancialNeed() : "Not specified").append("\n");
        sb.append("Bio: ").append(orNA(profile.getBio())).append("\n");
        sb.append("Achievements: ").append(orNA(profile.getAchievements())).append("\n\n");

        sb.append("AVAILABLE SCHOLARSHIPS:\n");
        for (int i = 0; i < scholarships.size(); i++) {
            Scholarship s = scholarships.get(i);
            sb.append(i + 1).append(". ID:").append(s.getId()).append("\n");
            sb.append("   Name: ").append(s.getName()).append("\n");
            sb.append("   Provider: ").append(s.getProvider()).append("\n");
            sb.append("   Category: ").append(s.getCategory()).append("\n");
            sb.append("   Country: ").append(orNA(s.getDestinationCountry())).append("\n");
            sb.append("   Eligible Fields: ").append(orNA(s.getEligibleFields())).append("\n");
            sb.append("   GPA Requirement: ").append(s.getGpaRequirement() != null ? s.getGpaRequirement() : "None").append("\n");
            sb.append("   Requirements: ").append(orNA(s.getRequirements())).append("\n");
            sb.append("   Deadline: ").append(s.getDeadline()).append("\n\n");
        }

        sb.append("""
            INSTRUCTIONS:
            1. Score each scholarship from 0 to 100 based on how well the student matches.
            2. Only include scholarships with a score >= 20.
            3. Also provide a profile_strength_score (0-100) and 3 improvement suggestions.

            Respond with ONLY a valid JSON object (no markdown, no extra text) in this format:
            {
              "profile_strength_score": <number>,
              "improvement_suggestions": "<suggestion1>; <suggestion2>; <suggestion3>",
              "matches": [
                {
                  "scholarship_id": <id>,
                  "match_score": <0-100>,
                  "match_explanation": "<2-3 sentence explanation>"
                }
              ]
            }
            The matches array must be sorted by match_score descending.
            """);

        return sb.toString();
    }

    /**
     * Builds the prompt for FR-11 (eligibility checker).
     */
    private String buildEligibilityPrompt(StudentProfile profile, Scholarship scholarship) {
        return String.format("""
            You are an eligibility checker for scholarships.

            Determine if this student meets the requirements for the scholarship.

            STUDENT PROFILE:
            Education Level: %s
            GPA: %s
            Field of Study: %s
            Institution: %s
            Graduation Year: %s
            Intended Start Date: %s
            Country Preference: %s
            Financial Need: %s
            Languages: %s
            Standardized Tests: %s
            Skills: %s
            Bio: %s
            Achievements: %s

            SCHOLARSHIP REQUIREMENTS:
            Name: %s
            Category: %s
            Destination Country: %s
            Eligible Fields: %s
            GPA Requirement: %s
            Requirements: %s
            Selection Criteria: %s

            MATCHING RULES (CRITICAL):
            1. Destination Country: The requirement is MET if ANY country in the student's 'Country Preference' list matches the scholarship's 'Destination Country' (or if the scholarship says 'Various' or 'All Countries'). Do NOT require an exact match of the entire list.
            2. Eligible Fields: The requirement is MET if the student's 'Field of Study' matches ANY field in the scholarship's 'Eligible Fields' list (or if the scholarship says 'All Fields' or 'Any'). Do NOT require an exact match of the entire list.
            3. Independence: Each criterion's 'reason' must ONLY reference that criterion's own data. Do not mention or factor in any other criterion's status when evaluating a specific criterion.

            Respond with ONLY a JSON object (no markdown):
            {
              "criteria": [
                { "id": "<criterion_id>", "label": "<criterion_label>", "met": <true|false>, "reason": "<explanation>" }
              ],
              "overallMeets": <true|false>
            }
            """,
            orNA(profile.getEducationLevel()),
            profile.getGpa() != null ? profile.getGpa() : "Not provided",
            orNA(profile.getFieldOfStudy()),
            orNA(profile.getInstitution()),
            profile.getGraduationYear() != null ? profile.getGraduationYear().toString() : "Not provided",
            orNA(profile.getIntendedStartDate()),
            orNA(profile.getCountryPreference()),
            profile.getFinancialNeed() != null ? profile.getFinancialNeed() : "Not specified",
            orNA(profile.getLanguageProficiency()),
            orNA(profile.getStandardizedTests()),
            profile.getSkills() != null && !profile.getSkills().isEmpty() ? String.join(", ", profile.getSkills()) : "Not specified",
            orNA(profile.getBio()),
            orNA(profile.getAchievements()),
            scholarship.getName(),
            scholarship.getCategory(),
            orNA(scholarship.getDestinationCountry()),
            orNA(scholarship.getEligibleFields()),
            scholarship.getGpaRequirement() != null ? scholarship.getGpaRequirement() : "None",
            orNA(scholarship.getRequirements()),
            orNA(scholarship.getSelectionCriteria())
        );
    }

    /**
     * Builds the prompt for FR-19 (personal statement generation).
     */
    private String buildPersonalStatementPrompt(
            StudentProfile profile, Scholarship scholarship, List<String> keyPoints) {

        String keyPointsStr = (keyPoints != null && !keyPoints.isEmpty())
            ? String.join(", ", keyPoints)
            : "Not specified";

        // Allow null scholarship for generic statement generation
        String scholarshipName = scholarship != null ? scholarship.getName() : "scholarship applications in general";
        String scholarshipProvider = scholarship != null ? scholarship.getProvider() : "various providers";
        String scholarshipCountry = scholarship != null ? orNA(scholarship.getDestinationCountry()) : "Not specified";
        String scholarshipRequirements = scholarship != null ? orNA(scholarship.getRequirements()) : "Not specified";
        String scholarshipCriteria = scholarship != null ? orNA(scholarship.getSelectionCriteria()) : "Not specified";

        return String.format("""
            You are an expert scholarship personal statement writer.

            Write a compelling personal statement for this scholarship application.

            STUDENT PROFILE:
            Name: %s
            Education Level: %s
            Institution: %s
            Field of Study: %s
            GPA: %s
            Standardized Tests: %s
            Bio: %s
            Achievements: %s

            SCHOLARSHIP:
            Name: %s
            Provider: %s
            Country: %s
            Requirements: %s
            Selection Criteria: %s

            KEY POINTS TO INCLUDE:
            %s

            Write a 600-800 word personal statement that:
            1. Has a compelling opening that grabs attention
            2. Clearly connects the student's background to this specific scholarship
            3. Sounds authentic, professional, and confident
            4. Meets the specific requirements of the provider

            CRITICAL: Respond in plain text only. Do NOT use markdown formatting, asterisks, hashes, or markdown list characters.
            5. Has a strong, memorable conclusion

            Write the statement directly (no headers, just the prose).
            """,
            profile.getUser().getDisplayName(),
            orNA(profile.getEducationLevel()),
            orNA(profile.getInstitution()),
            orNA(profile.getFieldOfStudy()),
            profile.getGpa() != null ? profile.getGpa() : "N/A",
            orNA(profile.getStandardizedTests()),
            orNA(profile.getBio()),
            orNA(profile.getAchievements()),
            scholarshipName,
            scholarshipProvider,
            scholarshipCountry,
            scholarshipRequirements,
            scholarshipCriteria,
            keyPointsStr
        );
    }

    /**
     * Builds the prompt for FR-20 (essay review & scoring).
     */
    private String buildEssayReviewPrompt(String essayText, Scholarship scholarship) {
        return String.format("""
            You are an expert scholarship essay reviewer.

            Review the following essay written for this scholarship and provide detailed feedback.

            SCHOLARSHIP: %s
            SELECTION CRITERIA: %s

            ESSAY:
            \"\"\"%s\"\"\"

            Respond with ONLY a JSON object (no markdown):
            {
              "quality_score": <0-100>,
              "strengths": ["<strength1>", "<strength2>"],
              "specific_suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
              "grammar_issues": ["<issue1>", "<issue2>"],
              "overall_feedback": "<2-3 sentence overall assessment>"
            }
            """,
            scholarship.getName(),
            orNA(scholarship.getSelectionCriteria()),
            essayText
        );
    }

    /**
     * Builds the job matching prompt for FR-43.
     */
    private String buildJobMatchingPrompt(StudentProfile profile, List<?> jobs) {
        return String.format("""
            You are a job matching AI for Ghanaian students.

            Match this student profile to the available jobs and rank them.

            STUDENT PROFILE:
            Education: %s at %s, GPA: %s
            Field: %s
            Standardized Tests: %s
            Skills/Bio: %s
            Achievements: %s

            JOBS: %s

            Respond with ONLY a JSON array (no markdown) of matched jobs sorted by match_score:
            [{"job_id": <id>, "match_score": <0-100>, "match_explanation": "<explanation>"}]
            """,
            orNA(profile.getEducationLevel()),
            orNA(profile.getInstitution()),
            profile.getGpa() != null ? profile.getGpa() : "N/A",
            orNA(profile.getFieldOfStudy()),
            orNA(profile.getStandardizedTests()),
            orNA(profile.getBio()),
            orNA(profile.getAchievements()),
            jobs.toString()
        );
    }

    /**
     * Parses Gemini's JSON response for the matching prompt.
     * Creates ScholarshipMatch entities from the ranked list.
     */
    private List<ScholarshipMatch> parseMatchingResponse(
            String rawResponse, User user, List<Scholarship> scholarships) {

        List<ScholarshipMatch> matches = new ArrayList<>();
        try {
            String jsonBlock = extractJsonBlock(rawResponse);
            JsonNode root = objectMapper.readTree(jsonBlock);
            JsonNode matchesNode = root.path("matches");

            for (JsonNode m : matchesNode) {
                long scholarshipId = m.path("scholarship_id").asLong(-1);
                int score = m.path("match_score").asInt(0);
                String explanation = m.path("match_explanation").asText("");

                if (scholarshipId == -1 || score < 0 || score > 100) continue;

                // Resolve the scholarship entity from the list (avoids extra DB queries)
                Optional<Scholarship> schOpt = scholarships.stream()
                    .filter(s -> s.getId().equals(scholarshipId))
                    .findFirst();

                if (schOpt.isEmpty()) continue;

                matches.add(ScholarshipMatch.builder()
                    .student(user)
                    .scholarship(schOpt.get())
                    .matchScore(score)
                    .matchExplanation(explanation)
                    .build());
            }
        } catch (Exception e) {
            log.error("Failed to parse Gemini matching response: {}", e.getMessage());
        }
        return matches;
    }

    /**
     * Updates the student's profile strength score from the Gemini response.
     */
    private void updateProfileStrengthFromResponse(StudentProfile profile, String rawResponse) {
        try {
            String jsonBlock = extractJsonBlock(rawResponse);
            JsonNode root = objectMapper.readTree(jsonBlock);
            int strengthScore = root.path("profile_strength_score").asInt(-1);
            String suggestions = root.path("improvement_suggestions").asText(null);

            if (strengthScore >= 0 && strengthScore <= 100) {
                profile.setProfileStrengthScore(strengthScore);
            }
            if (suggestions != null && !suggestions.isBlank()) {
                profile.setProfileImprovementSuggestions(suggestions);
            }
        } catch (Exception e) {
            log.warn("Failed to parse profile strength from Gemini response: {}", e.getMessage());
        }
    }

    /**
     * Extracts a JSON block from Gemini's response text.
     * Gemini sometimes wraps JSON in markdown code fences — this strips them.
     */
    private String extractJsonBlock(String text) {
        if (text == null) return "{}";
        String stripped = text.trim();
        // Remove markdown code fences if present
        if (stripped.startsWith("```json")) {
            stripped = stripped.substring(7);
        } else if (stripped.startsWith("```")) {
            stripped = stripped.substring(3);
        }
        if (stripped.endsWith("```")) {
            stripped = stripped.substring(0, stripped.length() - 3);
        }
        return stripped.trim();
    }

    private String buildErrorJson(String message) {
        return String.format("{\"error\": \"%s\"}", message.replace("\"", "'"));
    }

    private String orNA(String value) {
        return (value == null || value.isBlank()) ? "Not provided" : value;
    }
}
