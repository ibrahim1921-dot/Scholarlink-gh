---
name: test-api
description: Test the ScholarLink GH API endpoints locally using curl. Covers auth (register, login) and scholarship endpoints with pre-built commands and explanations.
disable-model-invocation: false
---

Help the user test the ScholarLink GH API. The backend runs on `http://localhost:8081`.

Before running any commands, confirm the app is running (see `/run-backend` if not).

## Auth Endpoints

### Register a new student account
```powershell
curl -X POST http://localhost:8081/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "firstName": "Kwame",
    "lastName": "Mensah",
    "email": "kwame@example.com",
    "password": "SecurePass123!",
    "role": "STUDENT"
  }'
```
Expected: `201 Created` with user details. Error `409` means email already exists.

### Register an admin account
```powershell
curl -X POST http://localhost:8081/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@scholarlink.gh",
    "password": "AdminPass123!",
    "role": "ADMIN"
  }'
```

### Login and get a JWT token
```powershell
curl -X POST http://localhost:8081/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "kwame@example.com",
    "password": "SecurePass123!"
  }'
```
Expected: `200 OK` with `accessToken` and `refreshToken`. **Copy the `accessToken`** — you'll need it for authenticated requests.

> **Why tokens?** The API uses JWT (JSON Web Token) for authentication. You include the token in the `Authorization` header of every protected request so the server knows who you are without storing session state.

### Refresh an expired access token
```powershell
curl -X POST http://localhost:8081/api/auth/refresh `
  -H "Content-Type: application/json" `
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN_HERE"}'
```

---

## Scholarship Endpoints

Replace `YOUR_TOKEN_HERE` with the `accessToken` from login.

### List all approved scholarships (public)
```powershell
curl http://localhost:8081/api/scholarships
```

### Create a scholarship (ADMIN only)
```powershell
curl -X POST http://localhost:8081/api/scholarships `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -d '{
    "title": "KNUST Engineering Scholarship 2024",
    "description": "Merit-based scholarship for engineering students at KNUST.",
    "provider": "KNUST Alumni Association",
    "amount": 5000.00,
    "currency": "GHS",
    "deadline": "2024-12-31",
    "eligibilityCriteria": "Must be enrolled in an engineering program with GPA >= 3.0",
    "applicationUrl": "https://knust.edu.gh/scholarships/apply"
  }'
```
Expected: `201 Created`. Error `403` means you're not logged in as ADMIN.

### Get a specific scholarship
```powershell
curl http://localhost:8081/api/scholarships/1
```

### Approve a scholarship (ADMIN only)
```powershell
curl -X PATCH http://localhost:8081/api/scholarships/1/approve `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Delete a scholarship (ADMIN only)
```powershell
curl -X DELETE http://localhost:8081/api/scholarships/1 `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Common Errors and What They Mean

| Status | Meaning |
|--------|---------|
| `400 Bad Request` | Missing or invalid fields — check the request body |
| `401 Unauthorized` | No token or expired token — log in again |
| `403 Forbidden` | You don't have permission (e.g., STUDENT trying ADMIN action) |
| `404 Not Found` | Resource doesn't exist |
| `409 Conflict` | Duplicate — e.g., email already registered |
| `429 Too Many Requests` | Rate limit hit — wait and try again |

---

## Tips

- If you get `Connection refused`, the backend isn't running — use `/run-backend`.
- If you get `401` on every request, your token has expired (30 min TTL) — log in again to get a fresh one.
- Rate limits reset when you restart the app, so if you hit `429` during testing just restart.
