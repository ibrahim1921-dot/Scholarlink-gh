# Copilot instructions for ScholarLink GH

## Build, test, lint (backend)
- Build: `mvn -f backend\pom.xml clean package`
- Test: `mvn -f backend\pom.xml test`
- Single test: `mvn -f backend\pom.xml -Dtest=BackendApplicationTests test`
- Lint (Checkstyle): `mvn -f backend\pom.xml checkstyle:check`

## Architecture (high-level)
- Spring Boot backend lives in `backend/` with layered packages: `controller` → `service` → `repository` → `entity`, DTOs in `dto`, security/config in `security` and `config`.
- Stateless security: `SecurityConfig` wires JWT auth (`JwtAuthFilter`) and IP rate limiting (`RateLimitFilter`) before `UsernamePasswordAuthenticationFilter`. `/api/v1/auth/**` is public; all other endpoints require JWT; admin endpoints use `@PreAuthorize("hasRole('ADMIN')")`.
- Scholarship flow: `ScholarshipService` enforces verified+active listings for students; admin actions create/verify/deactivate listings; `ScholarshipResponse.from(...)` is the mapping boundary for API responses.
- `frontend/` is currently a placeholder (only `.gitkeep`).

## Key conventions
- Config: `application.properties` is gitignored. Copy `backend\src\main\resources\application.properties.example` and set DB/JWT/mail settings. Backend defaults to port 8081.
- Auth identity: `User` implements `UserDetails` and uses email as the principal (`getUsername()` returns email). Normalize emails to lower-case/trim before lookup or persistence.
- API responses: use DTOs for data payloads; use `ApiResponse` for message-only responses.
