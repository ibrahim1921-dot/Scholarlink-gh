# ScholarLink Monorepo

This repository combines:

- `backend/` → full contents of `ibrahim1921-dot/Scholarlink-gh`
- `mobile/` → full contents of `ibrahim1921-dot/ScholarLinkGH-Mobile`

## Repository Layout

- `backend/backend/` — Spring Boot backend application
- `backend/docs/` — backend documentation from the original backend repository root
- `mobile/scholarlink-gh/` — Expo React Native mobile application

## Run the Backend

```bash
cd backend/backend
./mvnw spring-boot:run
```

Run backend tests:

```bash
cd backend/backend
./mvnw test
```

## Run the Mobile App

```bash
cd mobile/scholarlink-gh
npm install
npm run start
```

Useful mobile commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
```
