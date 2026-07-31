# ScholarLink GH - Project Documentation

## 1. Project Overview
ScholarLink GH is a comprehensive platform designed for students in Ghana seeking scholarships and job opportunities. It bridges the gap between educational funding, career opportunities, and prospective applicants. The system features a modern mobile application for students and an administrative backend for managing listings.

**High-Level Architecture Diagram Description**:
- **Mobile App (Frontend)**: Built with React Native and Expo, serving as the primary interface for students to browse jobs/scholarships, manage profiles, and submit applications.
- **Spring Boot Backend**: The core REST API handling business logic, authentication, and database operations.
- **Communication**: The mobile app communicates with the backend via secure HTTPS REST API calls, using JWT for authentication.
- **External Services**: Integrates with Cloudinary for document/image storage, a relational database (PostgreSQL/H2 depending on environment) for persistence, and Google Gemini AI for advanced features like scholarship matching, cover letter generation, and essay review.

## 2. Tech Stack

### Backend
- **Framework**: Spring Boot 3.4.5
- **Language**: Java 17
- **Database**: H2 (in-memory/testing) / PostgreSQL / MySQL (configurable via `application.properties` using `spring.datasource.url=${DB_URL}`)
- **Key Dependencies**:
  - Spring Security & JJWT (JWT generation/validation)
  - Spring Data JPA / Hibernate (Database ORM)
  - Cloudinary SDK (File and image storage)
  - OkHttp & Jackson (Communicating with Gemini AI REST API)
  - Bucket4j & Caffeine (IP-based rate limiting)
  - Apache PDFBox & Tika (Document parsing and type detection)

### Frontend (Mobile)
- **Framework**: Expo 54.0.36 & React Native 0.81.5
- **Navigation**: expo-router (File-based routing)
- **State Management**: Tanstack React Query (Server state management and caching)
- **Key Libraries**:
  - `axios` (HTTP client)
  - `expo-image-picker` & `expo-document-picker` (File selection)
  - `expo-secure-store` (Secure token storage)
  - `expo-notifications` (Push notifications)
  - `@react-navigation/bottom-tabs` (Tab-based UI)

## 3. Backend Documentation

### Entities (in `entity/`)
- **ApplicationMode**: Enum representing application modes (e.g., INTERNAL, EXTERNAL).
- **ApplicationStatus**: Enum representing the status of an application.
- **ApplicationTracker**: Tracks applications (id, student, scholarship, status, notes, deadlineRemindersSent, submittedAt, awardedAt, createdAt, updatedAt).
- **AuditLog**: Records admin actions (id, adminId, adminEmail, action, entityType, entityId, detail, timestamp).
- **DocumentType**: Enum representing document types.
- **DocumentUpload**: Manages user documents (id, student, filename, storagePath, cloudinaryPublicId, documentType, verificationNotes, fileSizeBytes, mimeType, uploadedAt, verifiedAt, reviewedBy).
- **EligibilityCheck**: Results of AI eligibility checks (id, student, scholarship, isEligible, eligibilityDetails, createdAt).
- **EmploymentType**: Enum representing employment types (e.g., FULL_TIME, PART_TIME).
- **ExperienceLevel**: Enum representing required experience.
- **JobApplication**: User job applications (id, student, job, coverLetter, notes, appliedAt, updatedAt).
- **JobListing**: Job postings (id, title, company, description, location, fieldOfStudy, requiredEducationLevel, minimumGpa, salaryRange, applicationUrl, imageUrl, applicationDeadline, employmentType, experienceLevel, workMode, createdBy, createdAt, updatedAt). *Note: `requirements` is an `@ElementCollection List<String>` backed by a separate `job_requirements` table.*
- **Notification**: User notifications (id, user, type, title, body, relatedScholarshipId).
- **RefreshToken**: JWT refresh tokens (id, user, tokenHash, expiresAt, revokedAt, createdAt).
- **Role**: Enum representing user roles (ADMIN, STUDENT).
- **SavedJob**: User bookmarked jobs (id, student, job, savedAt).
- **SavedScholarship**: User bookmarked scholarships (id, student, scholarship, savedAt).
- **Scholarship**: Scholarship listings (id, name, provider, category, destinationCountry, eligibleFields, gpaRequirement, fundingCoverage, deadline, officialLink, requirements, selectionCriteria, additionalNotes, imageUrl, status, assistedApplicationFee, createdAt, updatedAt, createdBy).
- **ScholarshipCategory**: Enum representing scholarship categories.
- **ScholarshipMatch**: AI-generated matches for students (id, student, scholarship, matchScore, matchExplanation, createdAt).
- **ScholarshipReport**: Reports submitted by users on scholarships (id, scholarship, reporter, reportedAt).
- **ScholarshipStatus**: Enum for scholarship status (e.g., ACTIVE, PENDING, INACTIVE).
- **StudentProfile**: Detailed user profile data (id, user, educationLevel, gpa, fieldOfStudy, institution, graduationYear, countryPreference, languageProficiency, standardizedTests, financialNeed, intendedStartDate, expoPushToken, profileStrengthScore, profileImprovementSuggestions, documentDisclaimerAcceptedAt, profilePictureUrl, bio, achievements, lastUpdated).
- **User**: Core user account (id, username, email, phoneNumber, password, role, otpCode, otpExpiresAt, passwordResetToken, passwordResetTokenExpiresAt, lockedUntil, lastActivityAt, documentDisclaimerAcceptedAt).
- **VerificationStatus**: Enum for document verification status.
- **WorkMode**: Enum for work environment (e.g., REMOTE, ONSITE, HYBRID).

### Controllers (in `controller/`)
- **AdminApplicationController**: Manages scholarship application statuses.
  - `PATCH /{id}/status`: Updates scholarship application status (Requires Admin).
- **AdminJobApplicationController**: Manages job application statuses.
  - `PATCH /{id}/status`: Updates job application status (Requires Admin).
- **AdminUserController**: Handles administrative user management tasks.
- **AIController**: Interfaces with Gemini AI services.
  - `POST /api/v1/ai/ask`: Chat assistant.
  - `GET /api/v1/ai/scholarships/matches`: AI scholarship matching.
  - `GET /api/v1/scholarships/{id}/eligibility`: AI eligibility checker.
  - `POST /api/v1/ai/personal-statement`: Generates personal statements.
  - `POST /api/v1/ai/review-essay`: Reviews applicant essays.
  - `POST /api/v1/ai/check-originality`: Checks text originality.
  - `POST /api/v1/ai/generate-cv`: Generates a CV.
  - `POST /api/v1/ai/cover-letter`: Generates a cover letter.
- **ApplicationTrackerController**: Tracks application progress.
  - `GET /{id}`: Gets tracker details.
  - `PUT /{id}`: Updates a tracker.
  - `DELETE /{id}`: Deletes a tracker.
- **AuditController**: Provides access to system audit logs.
- **AuthController**: Manages user authentication and onboarding.
  - `POST /register`: Registers new users.
  - `POST /login`: Authenticates users and returns JWT.
  - `POST /verify-otp`: Verifies One-Time Password.
  - `POST /logout-all-devices`: Revokes all sessions.
  - `POST /change-password`: Changes active user password.
  - `POST /forgot-password`: Initiates password reset.
  - `POST /reset-password`: Completes password reset.
  - `GET /me`: Gets current authenticated user details.
- **DocumentController**: Manages file uploads and disclaimers.
  - `GET /disclaimer-status`: Gets document disclaimer status.
  - `POST /upload`: Uploads a document to Cloudinary.
  - `GET /{id}`: Retrieves or deletes a document.
  - `GET /admin/suspicious`: Updates document verification status.
- **JobController**: Job listing management and interaction.
  - `GET /admin/all`: Gets jobs for admin (@PreAuthorize("hasRole('ADMIN')")).
  - `GET /{id}`: Gets job details.
  - `GET /matches`: Gets AI matched jobs.
  - `POST /{id}/apply`: Submits a job application.
  - `GET /my-applications`: Gets user's job applications. (Note: Returns raw entities which risks LazyInitializationException outside transaction).
  - `POST /{id}/save`: Bookmarks a job.
  - `POST /{id}/generate-cv`: Generates a tailored CV for a job.
  - `POST /{id}/cover-letter`: Generates a cover letter draft for a job.
- **NotificationController**: Push notification and alert management.
  - `GET /unread-count`: Gets unread notification count / mark read.
  - `PATCH /read-all`: Marks all notifications as read.
  - `DELETE /{id}`: Deletes a notification.
- **ProfileController**: User profile management.
  - `POST /picture`: Uploads profile picture.
  - `POST /push-token`: Registers Expo push token for notifications.
- **ScholarshipController**: Scholarship listing management.
  - `GET /countries`: Gets available destination countries.
  - `GET /fields`: Gets available fields of study.
  - `GET /saved`: Gets bookmarked scholarships.
  - `POST /{id}/report`: Reports a scholarship.
  - `PUT /{id}`: Updates a scholarship (@PreAuthorize("hasRole('ADMIN')")).
  - `PUT /{id}/verify`: Verifies a scholarship.
  - `PUT /{id}/deactivate`: Deactivates a scholarship.
  - `GET /admin/pending`: Gets pending scholarships.
  - `GET /admin/all`: Gets all admin scholarships.

### Services (in `service/`)
- **AdminUserService**: Manages admin user accounts, promotions, and access control.
- **ApplicationTrackerService**: Logic for tracking student application progression and reminders.
- **AuditService**: Logs and retrieves administrative actions for security audits.
- **AuthService**: Handles registration, login, OTP logic, and password management.
- **DocumentVerificationService**: Evaluates uploaded documents using Apache Tika/PDFBox and AI validation.
- **GeminiAIService**: Core service interacting with Google Gemini API for generation, matching, and reviews.
- **JobService**: Handles job listing CRUD, searching, filtering, and application submissions.
- **JwtService**: Generates, signs, and validates JWT access and refresh tokens.
- **MailService**: Manages outgoing SMTP emails (OTP, password resets, notifications).
- **NotificationService**: Dispatches in-app notifications and Firebase Push messages.
- **OtpService**: Generates and validates time-sensitive OTP codes.
- **RefreshTokenService**: Manages the lifecycle and rotation of JWT refresh tokens.
- **ScholarshipService**: Handles scholarship listing CRUD, matching logic, and verification.
- **UserActivityService**: Tracks user login activity and last active timestamps.

### Security Setup
- **JWT Flow**: Users authenticate via `/login` to receive an Access Token and Refresh Token. The Access Token is sent in the `Authorization: Bearer <token>` header. `JwtAuthFilter` intercepts requests to validate the token.
- **Roles**: System utilizes `ROLE_STUDENT` and `ROLE_ADMIN`. Specific endpoints are secured using `@PreAuthorize("hasRole('ADMIN')")`.
- **Rate Limiting**: Implemented via `RateLimitFilter` using Bucket4j and Caffeine Cache, with specific capacities and refill rates defined in `application.properties` (e.g., `rate-limit.login.capacity`, `rate-limit.otp.capacity`).

### Architectural Notes & Gotchas
- **JobListing.requirements**: This is an `@ElementCollection List<String>` which is backed by a separate `job_requirements` table in the database rather than a single column.
- **Raw Entity Returns**: Some endpoints (e.g., `getMyApplications` in JobController) return raw JPA entities instead of specialized DTOs. This risks `LazyInitializationException` if lazy-loaded fields (like collections) are accessed outside of the active Hibernate transaction context during serialization.
- **Cloudinary Config**: `CloudinaryConfig` strictly requires the `cloudinary.cloud-name`, `cloudinary.api-key`, and `cloudinary.api-secret` properties to be set. There are no defaults; the application context will fail to load if they are missing.

## 4. Mobile/Frontend Documentation

### App Structure (in `app/`)
- `(auth)`: Directory containing authentication flows (login, register, forgot password).
- `(tabs)`: Main tab navigation containing screens like Home, Scholarships, Applications, Assistant, Career.
- `_layout.tsx`: Root layout configuration for expo-router.
- `application`: Directory for application tracking screens.
- `documents.tsx`: Document upload and management screen.
- `job`: Directory for dynamic job detail routes (`/job/[id]`).
- `job-application`: Directory for job application submission flows.
- `notifications.tsx`: User notifications inbox.
- `onboarding.tsx`: Initial welcome and feature introduction screen.
- `profile-settings.tsx`: Settings and preferences management.
- `profile-setup.tsx`, `profile-setup-step-2.tsx`, `profile-setup-step-3.tsx`: Multi-step profile creation wizard.
- `profile-summary.tsx`: Overview of the user's current profile strength and details.
- `scholarship`: Directory for dynamic scholarship detail routes (`/scholarship/[id]`).
- `security.tsx`: Account security settings (change password, 2FA).

### Shared Components (in `components/`)
- **AppButton**: Standardized primary/secondary button component.
- **AppTextInput**: Standardized text input field with error handling and icons.
- **Badge**: Small status or tag indicator.
- **BaseScholarshipCard**: Reusable foundational card layout for listings.
- **CircularProgress**: Visual indicator for profile strength or loading states.
- **CountdownBadge**: Time-remaining indicator for deadlines.
- **DisclaimerModal**: Modal for accepting terms/document disclaimers.
- **FilterBottomSheet**: Slide-up sheet for selecting filtering criteria.
- **FiltersSheet**: Advanced filtering UI component.
- **JobApplyModals**: Modals handling the job application flow decisions.
- **ScholarshipApplyModals**: Modals handling the scholarship application flow decisions.
- **ScholarshipCard**: Specialized card displaying scholarship-specific details.
- **Screen**: Wrapper component ensuring safe area and standardized padding.
- **SectionHeader**: Consistent header layout for screen sections.
- **StateView**: Component for rendering loading, error, or empty states.
- **UserAvatar**: Renders the user's profile picture or initials fallback.
- **documents**: Directory containing document-specific UI components.

### Hooks (in `hooks/`)
- **useAuth**: Manages global authentication state, tokens, and user session.
- **useDisclaimer**: Manages the state of document disclaimers.
- **useJob**: Fetches and caches individual job data using React Query.
- **useJobApplyFlow**: State machine for the job application process.
- **useNotifications**: Fetches and manages user notifications.
- **useScholarship**: Fetches and caches individual scholarship data.
- **useScholarshipApplyFlow**: State machine for the scholarship application process.
- **useTracker**: Manages application tracking state.

### Services (in `services/`)
- **aiService**: Calls AI endpoints (ask, matches, eligibility, generation).
- **apiClient**: Configured Axios instance with interceptors for auth tokens.
- **authEvents**: Event emitter for handling cross-component auth triggers (e.g., token expiration).
- **authService**: Calls backend AuthController endpoints (login, register, OTP).
- **documentService**: Handles multipart file uploads to DocumentController.
- **jobService**: Calls JobController endpoints (fetch all, apply, save).
- **notificationService**: Calls NotificationController (fetch, mark read).
- **profileService**: Calls ProfileController (update profile, upload picture).
- **scholarshipService**: Calls ScholarshipController (fetch all, filter, save).
- **tokenRefresh**: Logic for automatically rotating JWTs using the refresh token.
- **tokenStore**: Wrapper around `expo-secure-store` for safe token persistence.
- **trackerService**: Calls ApplicationTrackerController endpoints.

### Apply Flow Pattern (Dual-Path)
The application utilizes a shared "Dual-Path" apply flow pattern for both Scholarships and Jobs (handled by `useJobApplyFlow` / `useScholarshipApplyFlow` and respective Modal components). 
When a user taps "Apply", they are presented with two choices:
1. **Internal Assisted Apply**: Submits the application directly through ScholarLink, tracking the status internally. Often involves AI features like tailored CV generation or cover letter drafting.
2. **External Direct Apply**: Redirects the user to the provider's external application URL (`applicationUrl` / `officialLink`), but registers an entry in the local `ApplicationTracker` so the user can manually track progress within the app.

### Navigation Structure
The app uses `expo-router` for file-based routing.
- **Tabs**: Driven by `app/(tabs)/_layout.tsx`.
- **Dynamic Routes**: Uses brackets for dynamic segments. `app/job/[id].tsx` handles viewing specific jobs, and `app/scholarship/[id].tsx` handles viewing specific scholarships. Parameters are passed automatically via the route.

## 5. Data Flow Examples

**Worked Example: Student Applies for a Job (Assisted)**
1. **User Action**: The student views a job and taps "Apply Now" on `app/job/[id].tsx`.
2. **Frontend UI**: The `JobApplyModals` component prompts the user to choose an application path. The user selects "Assisted Apply".
3. **Frontend Hook/Service**: The `useJobApplyFlow` hook processes the selection. It prompts the user for any required inputs (like a cover letter) and calls `jobService.applyToJob(id, payload)`.
4. **API Call**: The configured `apiClient` attaches the user's JWT to the `Authorization` header and makes a `POST /api/v1/jobs/{id}/apply` request.
5. **Backend Controller**: The `JobController` receives the request and routes it to `JobService`.
6. **Backend Service**: `JobService` verifies the user's eligibility, creates a new `JobApplication` entity linking the `User` and `JobListing`, and saves it to the database. It also creates an entry in `ApplicationTracker`.
7. **Response**: Backend returns a success response. `useJobApplyFlow` closes the modal, triggers a success toast, and optionally invalidates React Query caches to refresh the "My Applications" list.

## 6. Known Issues / Tech Debt
- **Missing Seed Data for Jobs**: While `DataInitializer.java` successfully bootstraps the initial Admin account, there is currently no seed data provided for Job Listings upon database initialization.
- **Pre-existing Test Failures**: There may be pre-existing failures in the testing suite (e.g., related to Mockito/ByteBuddy compatibility with Java 25 as noted in `pom.xml`, or logic bugs).
- **No TODO Comments**: No `TODO` comments are present in the main codebase, which may indicate that pending minor tasks are not being tracked in-code.
- **Merge Conflict State**: Note that `backend/target/` is currently NOT tracked by git, so there are no merge conflict states to flag in that directory.

## 7. Setup & Running Locally

### Backend Setup
1. Ensure Java 17 and Maven are installed.
2. Configure environment variables. A `.env` file must be created based on `.env.example`. Required keys include:
   - Database credentials (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`)
   - Cloudinary keys (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) - *Critical, app will fail to start without these.*
   - JWT secret (`JWT_SECRET`)
   - Gemini AI key (`GEMINI_API_KEY`)
3. Run the application from the `backend/` directory:
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend (Mobile) Setup
1. Ensure Node.js and npm are installed.
2. Navigate to `mobile/scholarlink-gh/` and install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables by creating a `.env` file containing the backend base URL:
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:8080
   ```
4. Start the Expo development server:
   ```bash
   npm run start
   # or
   npx expo start -c
   ```
5. Scan the QR code with the Expo Go app on your physical device, or press `a`/`i` to launch on a local emulator.
