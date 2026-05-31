# ScholarLink GH — Database Schema

> **Database:** PostgreSQL
> **ORM:** Hibernate (Spring Data JPA)
> **Schema management:** `spring.jpa.hibernate.ddl-auto=update`
> Hibernate automatically creates and updates tables based on entity classes.

---

## Table of Contents

1. [Entity Relationship Overview](#1-entity-relationship-overview)
2. [users](#2-users)
3. [student_profiles](#3-student_profiles)
4. [scholarships](#4-scholarships)
5. [saved_scholarships](#5-saved_scholarships)
6. [application_tracker](#6-application_tracker)
7. [ai_chat_history](#7-ai_chat_history)
8. [notifications](#8-notifications)
9. [jobs](#9-jobs)
10. [Relationships Summary](#10-relationships-summary)

---

## 1. Entity Relationship Overview

```
users (1) ──────────── (1) student_profiles
  │
  ├── (1) ──── (many) saved_scholarships ──── (many) scholarships
  │
  ├── (1) ──── (many) application_tracker ─── (many) scholarships
  │
  ├── (1) ──── (many) ai_chat_history
  │
  └── (1) ──── (many) notifications
```

---

## 2. users

The core user table. Every person who uses ScholarLink GH has a record here.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGINT (PK) | NO | Auto-generated primary key |
| username | VARCHAR(100) | NO | Display name — not used for login |
| email | VARCHAR(255) | NO | Login identifier — must be unique |
| phone_number | VARCHAR(20) | NO | Ghanaian phone number |
| password | VARCHAR(255) | NO | BCrypt hashed password — never plain text |
| role | VARCHAR(20) | NO | `STUDENT` or `ADMIN` |
| enabled | BOOLEAN | NO | `false` until email is verified via OTP |
| account_non_locked | BOOLEAN | NO | `false` if account is locked after brute force |
| otp_code | VARCHAR(6) | YES | 6-digit OTP sent during registration |
| otp_expires_at | TIMESTAMP | YES | When the OTP expires (10 minutes after sending) |

**Indexes:**
- `idx_users_email` — UNIQUE index on `email` (used on every login lookup)

**Notes:**
- `enabled = false` by default — user cannot log in until OTP is verified
- `otp_code` and `otp_expires_at` are cleared after successful verification
- Password is always stored as a BCrypt hash (cost factor 12)

---

## 3. student_profiles

Extended academic profile for each student. Created after first profile setup.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGINT (PK) | NO | Auto-generated primary key |
| user_id | BIGINT (FK) | NO | References `users.id` — one profile per user |
| field_of_study | VARCHAR(255) | YES | e.g. Computer Science, Medicine |
| gpa | DOUBLE | YES | GPA on a 4.0 scale |
| institution | VARCHAR(255) | YES | School or university name |
| graduation_year | INTEGER | YES | Year of graduation |
| country_preference | VARCHAR(255) | YES | Preferred destination country |
| language_proficiency | VARCHAR(255) | YES | e.g. English, French |
| financial_need | BOOLEAN | YES | Whether student has financial need |
| bio | TEXT | YES | Short personal statement / background |
| profile_strength_score | INTEGER | YES | AI-calculated score 0–100 |
| last_updated | TIMESTAMP | YES | Auto-updated on every save |

**Relationships:**
- `user_id` → `users.id` (ONE-TO-ONE, unique)

**Notes:**
- Profile is optional at registration — student fills it in after signing up
- `profile_strength_score` is recalculated by AI every time profile is updated
- `last_updated` is automatically set by `@PrePersist` and `@PreUpdate`

---

## 4. scholarships

All scholarship listings on the platform.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGINT (PK) | NO | Auto-generated primary key |
| name | VARCHAR(255) | NO | Scholarship name |
| provider | VARCHAR(255) | NO | Organisation offering the scholarship |
| category | VARCHAR(50) | NO | `UNDERGRADUATE_GHANA`, `UNDERGRADUATE_INTERNATIONAL`, `POSTGRADUATE_GHANA`, `POSTGRADUATE_INTERNATIONAL` |
| destination_country | VARCHAR(100) | YES | Country where studies take place |
| eligible_fields | TEXT | YES | Comma-separated list of eligible fields |
| gpa_requirement | DOUBLE | YES | Minimum GPA required |
| funding_coverage | VARCHAR(255) | YES | e.g. Full funding, Partial, Tuition only |
| deadline | DATE | NO | Application deadline |
| official_link | VARCHAR(500) | NO | Direct link to official application page |
| requirements | TEXT | YES | Full eligibility requirements |
| selection_criteria | TEXT | YES | How students are selected |
| is_verified | BOOLEAN | NO | `true` only after admin approval |
| is_active | BOOLEAN | NO | `false` = hidden from students |
| report_count | INTEGER | NO | Number of student reports (default 0) |
| source_url | VARCHAR(500) | YES | Where the listing was scraped from |
| created_at | TIMESTAMP | NO | When listing was added |
| updated_at | TIMESTAMP | NO | When listing was last updated |

**Notes:**
- New listings from the automated pipeline start with `is_verified = false` and `is_active = false`
- Admin must approve before students can see the listing
- 3 student reports (`report_count >= 3`) triggers automatic suspension (`is_active = false`)

---

## 5. saved_scholarships

Junction table — tracks which scholarships each student has saved to their shortlist.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGINT (PK) | NO | Auto-generated primary key |
| user_id | BIGINT (FK) | NO | References `users.id` |
| scholarship_id | BIGINT (FK) | NO | References `scholarships.id` |
| saved_at | TIMESTAMP | NO | When the student saved this scholarship |

**Relationships:**
- `user_id` → `users.id`
- `scholarship_id` → `scholarships.id`

**Constraints:**
- UNIQUE on `(user_id, scholarship_id)` — student can't save the same scholarship twice

---

## 6. application_tracker

Tracks a student's scholarship application journey.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGINT (PK) | NO | Auto-generated primary key |
| user_id | BIGINT (FK) | NO | References `users.id` |
| scholarship_id | BIGINT (FK) | NO | References `scholarships.id` |
| status | VARCHAR(20) | NO | Current application status |
| notes | TEXT | YES | Student's personal notes |
| created_at | TIMESTAMP | NO | When tracking started |
| last_updated | TIMESTAMP | NO | When status was last changed |

**Status values:**
| Value | Meaning |
|-------|---------|
| `RESEARCHING` | Student is gathering information |
| `IN_PROGRESS` | Application is being prepared |
| `SUBMITTED` | Application has been submitted |
| `INTERVIEW` | Student has been called for interview |
| `AWARDED` | Scholarship has been awarded |
| `REJECTED` | Application was unsuccessful |

**Relationships:**
- `user_id` → `users.id`
- `scholarship_id` → `scholarships.id`

---

## 7. ai_chat_history

Stores the last 30 days of AI assistant conversations per student.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGINT (PK) | NO | Auto-generated primary key |
| user_id | BIGINT (FK) | NO | References `users.id` |
| session_id | VARCHAR(100) | NO | Groups messages in the same conversation |
| role | VARCHAR(10) | NO | `USER` or `ASSISTANT` |
| message | TEXT | NO | The message content |
| created_at | TIMESTAMP | NO | When the message was sent |

**Relationships:**
- `user_id` → `users.id`

**Notes:**
- Messages older than 30 days are automatically deleted by a scheduled job
- `session_id` groups messages in the same chat session for context continuity

---

## 8. notifications

Push notification records for each student.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGINT (PK) | NO | Auto-generated primary key |
| user_id | BIGINT (FK) | NO | References `users.id` |
| type | VARCHAR(30) | NO | Notification type |
| title | VARCHAR(255) | NO | Short notification title |
| message | TEXT | NO | Full notification message |
| is_read | BOOLEAN | NO | `false` until student opens the app |
| scholarship_id | BIGINT (FK) | YES | Related scholarship (if applicable) |
| created_at | TIMESTAMP | NO | When notification was created |

**Notification types:**
| Type | Trigger |
|------|---------|
| `DEADLINE_ALERT` | 30, 14, 7, 1 days before a tracked scholarship deadline |
| `NEW_MATCH` | A new scholarship matching the student's profile is added |
| `WEEKLY_DIGEST` | Every Monday — summary of new matching scholarships |
| `APPLICATION_REMINDER` | Reminder to complete an in-progress application |

---

## 9. jobs

Job and internship listings for the career module.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGINT (PK) | NO | Auto-generated primary key |
| title | VARCHAR(255) | NO | Job or internship title |
| company | VARCHAR(255) | NO | Company or organisation name |
| type | VARCHAR(20) | NO | `JOB` or `INTERNSHIP` |
| field | VARCHAR(255) | YES | Relevant field of study |
| description | TEXT | YES | Full job description |
| requirements | TEXT | YES | Required qualifications |
| deadline | DATE | YES | Application deadline |
| application_link | VARCHAR(500) | YES | Link to apply |
| is_verified | BOOLEAN | NO | `true` after admin approval |
| is_active | BOOLEAN | NO | `false` = hidden from students |
| posted_by | BIGINT (FK) | YES | Admin or employer who posted it |
| created_at | TIMESTAMP | NO | When listing was added |

---

## 10. Relationships Summary

| Relationship | Type | Description |
|---|---|---|
| users → student_profiles | One-to-One | Each user has one profile |
| users → saved_scholarships | One-to-Many | A user can save many scholarships |
| users → application_tracker | One-to-Many | A user can track many applications |
| users → ai_chat_history | One-to-Many | A user has many chat messages |
| users → notifications | One-to-Many | A user receives many notifications |
| scholarships → saved_scholarships | One-to-Many | A scholarship can be saved by many users |
| scholarships → application_tracker | One-to-Many | A scholarship can be tracked by many users |

---

*ScholarLink GH — Database Schema v1.0 | CodeQuest 2026 | Group 37*
