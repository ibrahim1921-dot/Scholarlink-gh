# ScholarLink GH — Project Structure

> **Stack:** Java Spring Boot (Backend) + React Native + Expo + TypeScript (Frontend)
> **Architecture:** Monorepo — backend and frontend in the same GitHub repository
> **Group:** CodeQuest 2026 | Group 37

---

## Table of Contents

1. [Root Structure](#1-root-structure)
2. [Backend Structure](#2-backend-structure)
3. [Frontend Structure (Planned)](#3-frontend-structure-planned)
4. [File Responsibilities](#4-file-responsibilities)
5. [How to Run](#5-how-to-run)
6. [Environment Variables](#6-environment-variables)
7. [Git Workflow](#7-git-workflow)

---

## 1. Root Structure

```
Scholarlink/
├── .github/                        # GitHub Actions CI/CD workflows
├── backend/                        # Spring Boot backend
├── frontend/                       # React Native + Expo app (to be created)
├── docs/                           # Project documentation
│   ├── API_CONTRACTS.md            # All API endpoints and request/response shapes
│   ├── DATABASE_SCHEMA.md          # All database tables and relationships
│   └── PROJECT_STRUCTURE.md        # This file
└── .gitignore                      # Files excluded from Git
```

---

## 2. Backend Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/scholarlinkgh/
│   │   │   ├── backend/
│   │   │   │   └── BackendApplication.java         # App entry point — starts Spring Boot
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java             # Spring Security rules, CORS, filters
│   │   │   │   └── JwtConfig.java                  # JWT secret and expiry settings
│   │   │   │
│   │   │   ├── controller/
│   │   │   │   └── AuthController.java             # REST endpoints: /auth/register, /login, /refresh
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── RegisterRequest.java            # Shape of registration request body
│   │   │   │   ├── LoginRequest.java               # Shape of login request body
│   │   │   │   ├── VerifyOtpRequest.java           # Shape of OTP verification request
│   │   │   │   ├── RefreshTokenRequest.java        # Shape of token refresh request
│   │   │   │   ├── AuthResponse.java               # Shape of login/refresh response (tokens)
│   │   │   │   └── ApiResponse.java                # Generic success/error response wrapper
│   │   │   │
│   │   │   ├── entity/
│   │   │   │   ├── User.java                       # User database entity + Spring Security UserDetails
│   │   │   │   ├── Role.java                       # Enum: STUDENT, ADMIN
│   │   │   │   └── StudentProfile.java             # Student academic profile entity
│   │   │   │
│   │   │   ├── repository/
│   │   │   │   └── UserRepository.java             # Database queries for User (findByEmail, existsByEmail)
│   │   │   │
│   │   │   ├── security/
│   │   │   │   ├── JwtAuthFilter.java              # Intercepts every request, validates JWT token
│   │   │   │   └── RateLimitFilter.java            # Limits requests per IP per endpoint
│   │   │   │
│   │   │   └── service/
│   │   │       ├── AuthService.java                # Registration, login, token refresh logic
│   │   │       └── JwtService.java                 # JWT generation, validation, claims extraction
│   │   │
│   │   └── resources/
│   │       ├── application.properties              # App config (NOT committed — contains secrets)
│   │       └── application.properties.example     # Template for teammates to copy
│   │
│   └── test/
│       └── java/com/scholarlinkgh/
│           └── BackendApplicationTests.java        # Spring Boot test runner
│
├── .env                                            # Secret environment variables (NOT committed)
├── .gitignore                                      # Excludes .env and application.properties
├── pom.xml                                         # Maven dependencies and build config
├── mvnw                                            # Maven wrapper (run Maven without installing it)
└── HELP.md                                         # Spring Boot generated help file
```

---

## 3. Frontend Structure (Planned)

> To be created by the frontend team using `npx create-expo-app frontend --template`

```
frontend/
├── app/                            # Expo Router screens (file-based routing)
│   ├── (auth)/                     # Auth screens — no tab bar
│   │   ├── splash.tsx              # Splash / onboarding screen
│   │   ├── register.tsx            # Registration screen
│   │   ├── verify-otp.tsx          # OTP verification screen
│   │   ├── login.tsx               # Login screen
│   │   └── forgot-password.tsx     # Forgot password screen
│   │
│   ├── (tabs)/                     # Main app screens — with tab bar
│   │   ├── home.tsx                # Dashboard — AI matches feed
│   │   ├── scholarships.tsx        # Browse all scholarships
│   │   ├── tracker.tsx             # Application tracker
│   │   ├── assistant.tsx           # AI chat assistant
│   │   └── profile.tsx             # Student profile
│   │
│   ├── scholarship/
│   │   └── [id].tsx                # Scholarship detail screen
│   │
│   ├── jobs/
│   │   ├── index.tsx               # Jobs listing
│   │   └── [id].tsx                # Job detail screen
│   │
│   └── _layout.tsx                 # Root layout — navigation setup
│
├── components/                     # Reusable UI components
│   ├── ScholarshipCard.tsx         # Scholarship list item card
│   ├── MatchBadge.tsx              # AI match score badge
│   ├── DeadlineCountdown.tsx       # Live deadline countdown
│   └── ProfileStrengthBar.tsx      # Profile completion progress bar
│
├── services/                       # API call functions
│   ├── api.ts                      # Axios instance with base URL and interceptors
│   ├── auth.service.ts             # register(), login(), refresh(), logout()
│   ├── scholarship.service.ts      # getScholarships(), getById(), save(), report()
│   ├── profile.service.ts          # getProfile(), updateProfile()
│   ├── ai.service.ts               # match(), generateEssay(), reviewEssay(), chat()
│   └── tracker.service.ts          # getTracked(), addToTracker(), updateStatus()
│
├── store/                          # Global state management (Zustand or Context)
│   ├── auth.store.ts               # Stores tokens and current user
│   └── scholarship.store.ts        # Stores matched scholarships and filters
│
├── constants/
│   ├── colors.ts                   # ScholarLink brand colors
│   └── api.ts                      # Base URL and endpoint paths
│
├── hooks/
│   ├── useAuth.ts                  # Auth state and login/logout actions
│   └── useScholarships.ts          # Scholarship fetching and filtering
│
├── .env                            # API base URL (not committed)
├── .env.example                    # Template for teammates
├── app.json                        # Expo app configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies
```

---

## 4. File Responsibilities

### Backend — Who owns what

| File | Responsibility | Status |
|------|---------------|--------|
| `BackendApplication.java` | Starts the app, configures component scanning | ✅ Done |
| `SecurityConfig.java` | Security rules, CORS, filter chain | ✅ Done |
| `JwtConfig.java` | Reads JWT settings from environment | ✅ Done |
| `JwtService.java` | Creates and validates JWT tokens | ✅ Done |
| `JwtAuthFilter.java` | Checks token on every request | ✅ Done |
| `RateLimitFilter.java` | Blocks excessive requests per IP | ✅ Done |
| `User.java` | User database model | ✅ Done |
| `Role.java` | STUDENT / ADMIN enum | ✅ Done |
| `StudentProfile.java` | Academic profile model | ✅ Done |
| `UserRepository.java` | Database access for users | ✅ Done |
| `AuthService.java` | Register, login, refresh logic | ✅ Done |
| `AuthController.java` | /auth/* REST endpoints | ✅ Done |
| All DTOs | Request/response data shapes | ✅ Done |
| `ScholarshipController.java` | /scholarships/* endpoints | 🔲 Next |
| `ScholarshipService.java` | Scholarship business logic | 🔲 Next |
| `Scholarship.java` | Scholarship database model | 🔲 Next |
| `AiService.java` | Claude API integration | 🔲 Planned |
| `NotificationService.java` | Push notifications via FCM | 🔲 Planned |

---

## 5. How to Run

### Backend

**Prerequisites:**
- Java 17+
- Maven
- PostgreSQL running locally
- `application.properties` file created from `application.properties.example`

**Steps:**
```bash
# 1. Clone the repo
git clone https://github.com/your-repo/Scholarlink.git
cd Scholarlink/backend

# 2. Copy the example config
cp src/main/resources/application.properties.example src/main/resources/application.properties

# 3. Fill in your own values in application.properties
# (DB password, email credentials, JWT secret)

# 4. Create the PostgreSQL database
# Open pgAdmin and create a database called: scholarlinkghdb

# 5. Run the app
mvn spring-boot:run
```

The API will be available at: `http://localhost:8081/api/v1`

### Frontend *(Coming Soon)*

```bash
cd Scholarlink/frontend
npm install
npx expo start
```

---

## 6. Environment Variables

### Backend (`application.properties`)

| Variable | Description | Example |
|----------|-------------|---------|
| `spring.datasource.password` | PostgreSQL password | `yourpassword` |
| `jwt.secret` | 64-char hex string for JWT signing | Generate with PowerShell command below |
| `spring.mail.username` | Gmail address for sending OTPs | `yourapp@gmail.com` |
| `spring.mail.password` | Gmail app password (not your main password) | 16-char app password |

**Generate JWT secret (PowerShell):**
```powershell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

### Frontend (`.env`) *(Coming Soon)*

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend base URL | `http://localhost:8081/api/v1` |

---

## 7. Git Workflow

**Branch strategy:**
```
main          ← stable, working code only
dev           ← team integration branch
feature/xxx   ← individual feature branches
```

**How to contribute:**
```bash
# 1. Always pull latest before starting work
git checkout dev
git pull

# 2. Create your feature branch
git checkout -b feature/scholarship-listings

# 3. Make your changes, then commit
git add .
git commit -m "feat: add scholarship listings endpoint"

# 4. Push and create a pull request to dev
git push origin feature/scholarship-listings
```

**Commit message format:**
```
feat: add new feature
fix: fix a bug
docs: update documentation
refactor: restructure code without changing behaviour
test: add or update tests
```

---

*ScholarLink GH — Project Structure v1.0 | CodeQuest 2026 | Group 37*
