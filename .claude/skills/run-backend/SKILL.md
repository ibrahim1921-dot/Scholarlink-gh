---
name: run-backend
description: Start the ScholarLink GH Spring Boot backend locally. Checks for application.properties, explains any missing config, then runs the app.
---

Help the user start the Spring Boot backend. Follow these steps in order:

## Step 1 — Check application.properties

Check if `backend/src/main/resources/application.properties` exists (NOT the `.example` file — the actual file).

- If it **does not exist**: tell the user they need to create it first. Say: "You need to create `backend/src/main/resources/application.properties` by copying the example file and filling in your values. Here's how:"
  1. Copy: `copy backend\src\main\resources\application.properties.example backend\src\main\resources\application.properties`
  2. Open the file and fill in:
     - `spring.datasource.password` — your PostgreSQL password
     - `jwt.secret` — generate with: `-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })`
     - `spring.mail.username` — your Gmail address
     - `spring.mail.password` — your Gmail **app password** (Settings → Google Account → Security → 2-Step Verification → App passwords)
  3. Leave all other values as-is for local development.
  Then stop and tell the user to re-run `/run-backend` after filling in their config.

- If it **does exist**: proceed to Step 2.

## Step 2 — Check PostgreSQL

Remind the user: "Make sure PostgreSQL is running and the database `scholarlinkghdb` exists. If it doesn't, create it with: `createdb -U postgres scholarlinkghdb` (or use pgAdmin)."

## Step 3 — Start the app

Tell the user to run this command from the `backend/` directory:

```powershell
cd backend; .\mvnw spring-boot:run
```

Or from the project root:

```powershell
.\backend\mvnw -f backend\pom.xml spring-boot:run
```

The first run will download Maven dependencies (~2–3 min on a fresh setup). After that it starts in ~10–15 seconds.

## Step 4 — Verify it started

Tell the user to look for this line in the console:
```
Started BackendApplication in X.XXX seconds
```

Then test it with:
```powershell
curl http://localhost:8081/api/auth/register
```
(Expect a 400 error — that means the server is up and validation is working.)

## Notes to explain to the user

- Hibernate `ddl-auto=update` means the database schema is created/updated automatically on startup — no manual SQL needed during development.
- The app runs on **port 8081** (not the default 8080) — keep this in mind when testing.
- Rate limiting resets when you restart the app (it's stored in memory, not the database).
