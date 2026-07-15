# LMS

A Learning Management System with an Express/MongoDB API and a React (Vite) frontend.

## Structure

- `backend/` — Express API, JWT auth, Mongoose models (User, Course, Enrollment)
- `frontend/` — React app (Vite), routes for auth, course browsing/enrollment, dashboard

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a connection string to a hosted instance)

## Quickstart (both apps)

```
npm run install:all   # installs backend/ and frontend/ dependencies
npm run dev           # runs both dev servers concurrently
```

Backend: `http://localhost:5000` (health check `GET /api/health`). Frontend: `http://localhost:5173`.

Remember to still create `backend/.env` from `backend/.env.example` before running — see [Backend setup](#backend-setup).

`npm run build` builds both apps.

## Backend setup

```
cd backend
cp .env.example .env   # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run dev
```

API runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

## Frontend setup

```
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173` by default and talks to the API via `VITE_API_URL` (see `frontend/.env`).

## Roles

- **student** — browse and enroll in published courses
- **instructor** — create/edit/publish courses and lessons
- **admin** — manage all users (view, change role, delete) and all courses (view, delete), via `/api/admin/*` on the backend and the `/admin` panel on the frontend
