# LMS

A quiz platform: an Express/MongoDB API, a React (Vite) admin panel, and a React Native mobile app.

## Structure

- `backend/` — Express API, JWT auth, Mongoose models (User, Course, Subject, Question, Quiz)
- `frontend/` — React admin panel (Vite): manage courses, subjects, questions (with bulk CSV upload), quizzes, and users
- `App/` — React Native mobile app (Expo CLI, managed workflow) — see [App/README.md](App/README.md)

Courses group subjects, subjects group questions, and quizzes are built from a subject's questions. Users answer questions either standalone (practice mode) or as part of a quiz; `questionsAnswered` tracks their progress.

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a connection string to a hosted instance)

## Quickstart (backend + frontend + app)

```
npm run install:all   # installs backend/, frontend/, and App/ dependencies
npm run dev           # runs backend, frontend, and the Expo dev server concurrently
```

Backend: `http://localhost:5000` (health check `GET /api/health`). Frontend: `http://localhost:5173`. App: Expo dev server — press `a`/`i` in the terminal or scan the QR code with Expo Go.

Remember to still create `backend/.env` from `backend/.env.example` before running — see [Backend setup](#backend-setup).

`npm run build` builds the backend and frontend only — `App/` is an Expo managed app and isn't built locally the same way (see its own README).

## Backend setup

```
cd backend
cp .env.example .env   # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run dev
```

API runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

Seed demo data:

```
npm run seed          # runs seed:users then seed:questions
```

This creates an admin (`admin@admin.com` / `Admin@123`) and a demo user (`user@example.com` / `User@123`), plus sample courses, subjects, questions, and quizzes.

## Frontend setup

```
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173` by default and talks to the API via `VITE_API_URL` (see `frontend/.env`). Log in with the seeded admin account — this app is an admin-only panel, not a public site.

## Mobile app

`App/` is a React Native app (Expo CLI, managed workflow) that talks to the same API. It's wired into `npm run install:all` / `npm run dev` at the root, or run it standalone:

```
cd App
npm install
npx expo start
```

See [App/README.md](App/README.md) for API base URL notes (emulator vs. physical device).

## Roles

- **user** — answers questions and takes quizzes (via the mobile app); `questionsAnswered` tracks progress
- **admin** — manages courses, subjects, questions, quizzes, and users via the `frontend/` admin panel
