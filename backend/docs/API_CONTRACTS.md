# ScholarLink GH — API Contracts

> **Base URL (Development):** `http://localhost:8081/api/v1`
> **Base URL (Production):** `https://api.scholarlink.gh/api/v1`
>
> All requests and responses use `Content-Type: application/json`
> Protected endpoints require: `Authorization: Bearer <access_token>`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Student Profile](#2-student-profile)
3. [Scholarships](#3-scholarships)
4. [AI Assistant](#4-ai-assistant)
5. [Application Tracker](#5-application-tracker)
6. [Notifications](#6-notifications)
7. [Jobs & Career](#7-jobs--career)
8. [Admin](#8-admin)
9. [Error Responses](#9-error-responses)

---

## 1. Authentication

All auth endpoints are **public** — no token required.

---

### POST `/auth/register`
Registers a new student account.

**Request Body:**
```json
{
  "username": "Kewa Emmanuel",
  "email": "kewa@gmail.com",
  "phoneNumber": "0241234567",
  "password": "Test@1234",
  "educationLevel": "SHS_GRADUATE"
}
```

**Field Rules:**
| Field | Type | Rules |
|-------|------|-------|
| username | String | 2–100 chars, letters/spaces/hyphens only |
| email | String | Valid email, max 255 chars |
| phoneNumber | String | Ghanaian format: 0XXXXXXXXX or +233XXXXXXXXX |
| password | String | 8–72 chars, must have upper, lower, number, special char |
| educationLevel | String | Must be `SHS_GRADUATE` or `UNIVERSITY_GRADUATE` |

**Success Response — 201 Created:**
```json
{
  "success": true,
  "message": "Registration successful. You can now log in."
}
```

**Failure Response — 400 Bad Request (email already exists):**
```json
{
  "success": false,
  "message": "Registration failed. Please check your details and try again."
}
```

**Failure Response — 400 Bad Request (validation error):**
```json
{
  "timestamp": "2026-05-31T01:00:00Z",
  "status": 400,
  "errors": {
    "password": "Password must contain at least one uppercase letter...",
    "phoneNumber": "Please provide a valid Ghanaian phone number"
  }
}
```

**Rate Limit:** 5 requests per 60 minutes per IP

---

### POST `/auth/login`
Authenticates a student and returns JWT tokens.

**Request Body:**
```json
{
  "email": "kewa@gmail.com",
  "password": "Test@1234"
}
```

**Success Response — 200 OK:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "kewa@gmail.com",
  "username": "Kewa Emmanuel",
  "role": "STUDENT"
}
```

**Failure Response — 401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Rate Limit:** 10 requests per 15 minutes per IP

> **Frontend note:** Store `accessToken` in memory (not localStorage).
> Store `refreshToken` in a secure HTTP-only cookie or secure storage.
> Access token expires in **30 minutes**.
> Refresh token expires in **7 days**.

---

### POST `/auth/refresh`
Gets a new access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response — 200 OK:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "kewa@gmail.com",
  "username": "Kewa Emmanuel",
  "role": "STUDENT"
}
```

**Failure Response — 401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

**Rate Limit:** 30 requests per 1 minute per IP

---

### POST `/auth/verify-otp` *(Coming Soon)*
Verifies a student's email using a 6-digit OTP.

**Request Body:**
```json
{
  "email": "kewa@gmail.com",
  "otpCode": "482910"
}
```

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

**Rate Limit:** 5 requests per 30 minutes per IP

---

### POST `/auth/forgot-password` *(Coming Soon)*
Sends a password reset email.

**Request Body:**
```json
{
  "email": "kewa@gmail.com"
}
```

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "If that email is registered, a reset link has been sent."
}
```

---

### POST `/auth/reset-password` *(Coming Soon)*
Resets a password using the token from the reset email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewPass@5678"
}
```

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in."
}
```

---

## 2. Student Profile

All endpoints require a valid `Authorization: Bearer <token>` header.

---

### GET `/profile`
Returns the authenticated student's full profile.

**Headers:** `Authorization: Bearer <access_token>`

**Success Response — 200 OK:**
```json
{
  "id": 1,
  "username": "Kewa Emmanuel",
  "email": "kewa@gmail.com",
  "phoneNumber": "0241234567",
  "educationLevel": "SHS_GRADUATE",
  "fieldOfStudy": "Computer Science",
  "gpa": 3.8,
  "institution": "KNUST",
  "graduationYear": 2024,
  "countryPreference": "UK",
  "languageProficiency": "English",
  "financialNeed": true,
  "bio": "Passionate about technology...",
  "profileStrengthScore": 75,
  "lastUpdated": "2026-05-31T01:00:00Z"
}
```

---

### PUT `/profile`
Updates the authenticated student's profile.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "fieldOfStudy": "Computer Science",
  "gpa": 3.8,
  "institution": "KNUST",
  "graduationYear": 2024,
  "countryPreference": "UK",
  "languageProficiency": "English",
  "financialNeed": true,
  "bio": "Passionate about technology and solving real problems."
}
```

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "profileStrengthScore": 75
}
```

---

## 3. Scholarships

---

### GET `/scholarships`
Returns a paginated list of all verified scholarships.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 0) |
| size | int | Items per page (default: 20) |
| category | String | `UNDERGRADUATE_GHANA`, `UNDERGRADUATE_INTERNATIONAL`, `POSTGRADUATE_GHANA`, `POSTGRADUATE_INTERNATIONAL` |
| country | String | Destination country e.g. `UK`, `USA`, `Ghana` |
| field | String | Field of study e.g. `Computer Science` |
| deadline | String | `URGENT` (≤7 days), `SOON` (≤30 days), `ALL` |

**Success Response — 200 OK:**
```json
{
  "content": [
    {
      "id": 1,
      "name": "Chevening Scholarship",
      "provider": "UK Government",
      "category": "POSTGRADUATE_INTERNATIONAL",
      "destinationCountry": "UK",
      "eligibleFields": ["All fields"],
      "gpaRequirement": 3.0,
      "fundingCoverage": "Full funding",
      "deadline": "2026-11-05",
      "daysUntilDeadline": 158,
      "officialLink": "https://www.chevening.org",
      "isVerified": true,
      "matchScore": null
    }
  ],
  "totalElements": 120,
  "totalPages": 6,
  "currentPage": 0
}
```

---

### GET `/scholarships/{id}`
Returns full details of a single scholarship.

**Success Response — 200 OK:**
```json
{
  "id": 1,
  "name": "Chevening Scholarship",
  "provider": "UK Government",
  "category": "POSTGRADUATE_INTERNATIONAL",
  "destinationCountry": "UK",
  "eligibleFields": ["All fields"],
  "gpaRequirement": 3.0,
  "fundingCoverage": "Full funding — tuition, living allowance, flights",
  "deadline": "2026-11-05",
  "daysUntilDeadline": 158,
  "officialLink": "https://www.chevening.org",
  "requirements": "2 years work experience, bachelor's degree",
  "selectionCriteria": "Leadership potential, academic excellence",
  "isVerified": true,
  "reportCount": 0
}
```

---

### POST `/scholarships/{id}/save`
Saves a scholarship to the student's shortlist.

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Scholarship saved to your shortlist."
}
```

---

### DELETE `/scholarships/{id}/save`
Removes a scholarship from the student's shortlist.

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Scholarship removed from your shortlist."
}
```

---

### GET `/scholarships/saved`
Returns all scholarships saved by the student.

**Success Response — 200 OK:**
```json
{
  "content": [ /* same as scholarships list */ ],
  "totalElements": 5
}
```

---

### POST `/scholarships/{id}/report`
Reports a suspicious scholarship listing.

**Request Body:**
```json
{
  "reason": "This scholarship is asking for payment"
}
```

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Thank you for your report. Our team will review this listing."
}
```

---

## 4. AI Assistant

---

### POST `/ai/match`
Runs AI scholarship matching for the authenticated student.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:** *(empty — uses student's saved profile)*
```json
{}
```

**Success Response — 200 OK:**
```json
{
  "matches": [
    {
      "scholarship": { /* full scholarship object */ },
      "matchScore": 92,
      "matchReason": "Your Computer Science background and 3.8 GPA strongly align with this scholarship's requirements.",
      "eligibilityStatus": "ELIGIBLE",
      "missingCriteria": []
    },
    {
      "scholarship": { /* full scholarship object */ },
      "matchScore": 78,
      "matchReason": "Good match but work experience requirement may be a gap.",
      "eligibilityStatus": "PARTIAL",
      "missingCriteria": ["2 years work experience"]
    }
  ],
  "profileStrengthScore": 75,
  "profileSuggestions": [
    "Add your GPA to improve match accuracy",
    "Specify your country preference to filter relevant scholarships"
  ]
}
```

---

### POST `/ai/essay/generate`
Generates a draft personal statement.

**Request Body:**
```json
{
  "scholarshipId": 1,
  "additionalContext": "I am passionate about using technology to solve problems in Ghana"
}
```

**Success Response — 200 OK:**
```json
{
  "draft": "Dear Scholarship Committee, I am writing to express...",
  "wordCount": 650,
  "suggestions": [
    "Consider adding a specific achievement to strengthen paragraph 2"
  ]
}
```

---

### POST `/ai/essay/review`
Reviews and scores an existing personal statement.

**Request Body:**
```json
{
  "essay": "Dear Scholarship Committee, I am writing...",
  "scholarshipId": 1
}
```

**Success Response — 200 OK:**
```json
{
  "score": 72,
  "feedback": {
    "strengths": ["Clear motivation", "Good structure"],
    "improvements": ["Add specific achievements", "Strengthen conclusion"],
    "plagiarismRisk": "LOW"
  }
}
```

---

### POST `/ai/chat`
Sends a message to the AI assistant.

**Request Body:**
```json
{
  "message": "What documents do I need for the Chevening scholarship?",
  "sessionId": "optional-session-id-for-context"
}
```

**Success Response — 200 OK:**
```json
{
  "reply": "For Chevening, you will need...",
  "sessionId": "session-abc123"
}
```

---

## 5. Application Tracker

---

### GET `/tracker`
Returns all scholarships the student is tracking.

**Success Response — 200 OK:**
```json
{
  "applications": [
    {
      "id": 1,
      "scholarship": { /* scholarship object */ },
      "status": "IN_PROGRESS",
      "daysUntilDeadline": 45,
      "lastUpdated": "2026-05-31T01:00:00Z"
    }
  ]
}
```

**Status values:** `RESEARCHING`, `IN_PROGRESS`, `SUBMITTED`, `INTERVIEW`, `AWARDED`, `REJECTED`

---

### POST `/tracker`
Adds a scholarship to the application tracker.

**Request Body:**
```json
{
  "scholarshipId": 1,
  "status": "RESEARCHING"
}
```

---

### PUT `/tracker/{id}`
Updates the status of a tracked application.

**Request Body:**
```json
{
  "status": "SUBMITTED"
}
```

---

### DELETE `/tracker/{id}`
Removes a scholarship from the tracker.

**Success Response — 200 OK:**
```json
{
  "success": true,
  "message": "Application removed from tracker."
}
```

---

## 6. Notifications

---

### GET `/notifications`
Returns all notifications for the authenticated student.

**Success Response — 200 OK:**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "DEADLINE_ALERT",
      "title": "Deadline in 7 days",
      "message": "Chevening Scholarship closes in 7 days. Don't miss it!",
      "isRead": false,
      "createdAt": "2026-05-31T08:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

**Notification types:** `DEADLINE_ALERT`, `NEW_MATCH`, `WEEKLY_DIGEST`, `APPLICATION_REMINDER`

---

### PUT `/notifications/{id}/read`
Marks a notification as read.

---

### PUT `/notifications/read-all`
Marks all notifications as read.

---

## 7. Jobs & Career

---

### GET `/jobs`
Returns a paginated list of job and internship listings.

**Query Parameters:** `page`, `size`, `type` (`JOB` or `INTERNSHIP`), `field`

**Success Response — 200 OK:**
```json
{
  "content": [
    {
      "id": 1,
      "title": "Software Engineer Intern",
      "company": "Hubtel Ghana",
      "type": "INTERNSHIP",
      "field": "Computer Science",
      "deadline": "2026-07-01",
      "isVerified": true
    }
  ]
}
```

---

### POST `/ai/cv/generate`
Generates a professional CV for the student.

**Request Body:** *(empty — uses student profile)*
```json
{}
```

**Success Response — 200 OK:**
```json
{
  "cvContent": "KEWA EMMANUEL\nComputer Science Graduate...",
  "downloadUrl": "/files/cv/kewa-emmanuel-cv.pdf"
}
```

---

## 8. Admin

All admin endpoints require `ROLE_ADMIN`.

---

### GET `/admin/scholarships/pending`
Returns all unverified scholarship listings awaiting review.

---

### PUT `/admin/scholarships/{id}/verify`
Approves a scholarship listing.

**Request Body:**
```json
{
  "approved": true,
  "notes": "Verified against official chevening.org website"
}
```

---

### DELETE `/admin/scholarships/{id}`
Removes a scholarship listing permanently.

---

## 9. Error Responses

All errors follow this consistent format:

**400 Bad Request — Validation failed:**
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": {
    "email": "Please provide a valid email address",
    "password": "Password must contain at least one uppercase letter"
  }
}
```

**401 Unauthorized — No or invalid token:**
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Authentication failed"
}
```

**403 Forbidden — Valid token but wrong role:**
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Scholarship not found"
}
```

**429 Too Many Requests — Rate limit exceeded:**
```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "You have exceeded the request limit. Please wait before trying again.",
  "retryAfter": "Please wait a few minutes before retrying."
}
```

**500 Internal Server Error:**
```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later."
}
```

---

*ScholarLink GH — API Contracts v1.0 | CodeQuest 2026 | Group 37*
