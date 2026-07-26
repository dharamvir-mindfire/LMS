# LMS

A course-based learning platform: an ASP.NET Core/EF Core API, a React (Vite) admin panel, and a React Native mobile app.

## Structure

- `backend/` — ASP.NET Core 10 Web API, JWT auth, EF Core Code-First against SQL Server (User, Course, Subject, Lesson, Question, Quiz) — see [backend/README.md](backend/README.md)
- `frontend/` — React admin panel (Vite): manage courses, subjects, lessons, questions (with bulk CSV upload), quizzes, and users
- `app/` — React Native mobile app (Expo CLI, managed workflow) — see [app/README.md](app/README.md)

Courses group subjects; each subject holds both lessons (written content, an optional video link, and material links) and a bank of questions that quizzes are built from. Users read lessons and answer questions either standalone (practice mode) or as part of a quiz; `questionsAnswered` tracks their progress.

## Prerequisites

- .NET 10 SDK
- SQL Server reachable locally (or a connection string to a hosted instance)
- Node.js 18+

## Quickstart (backend + frontend + app)

```
npm run install:all   # installs frontend/ and app/ dependencies
npm run dev           # runs the backend, frontend, and Expo dev server concurrently
```

Backend: `http://localhost:5000` (health check `GET /api/health`). Frontend: `http://localhost:5173`. App: Expo dev server — press `a`/`i` in the terminal or scan the QR code with Expo Go.

Before the first run, apply migrations and seed demo data — see [Backend setup](#backend-setup).

`npm run build` builds the backend and frontend only — `app/` is an Expo managed app and isn't built locally the same way (see its own README).

## Backend setup

```
cd backend
# point ConnectionStrings:Default (appsettings.json or an override) at your SQL Server instance
dotnet ef database update
dotnet run
```

API runs on `http://localhost:5000` by default. Health check: `GET /api/health`. See [backend/README.md](backend/README.md) for config keys and design notes.

Seed demo data:

```
dotnet run -- seed          # runs seed:users then seed:questions
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

`app/` is a React Native app (Expo CLI, managed workflow) that talks to the same API. It's wired into `npm run install:all` / `npm run dev` at the root, or run it standalone:

```
cd app
npm install
npx expo start
```

See [app/README.md](app/README.md) for API base URL notes (emulator vs. physical device).

## Roles

- **user** — reads lessons, answers questions, and takes quizzes (via the mobile app); `questionsAnswered` tracks progress
- **admin** — manages courses, subjects, lessons, questions, quizzes, and users via the `frontend/` admin panel
