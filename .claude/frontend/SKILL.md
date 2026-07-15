---
name: frontend
description: This skill should be used when creating or naming any frontend file in the LMS React/Vite app under frontend/src — pages, context providers, types/interfaces, styles, assets, or API service calls. Trigger phrases include "add a page", "create a context", "add a type", "add an api call", "scaffold frontend", or any request to add frontend/src files for an entity or feature (e.g. Course, User, Lesson).
---

# Frontend Conventions (LMS)

Apply these rules whenever adding a new page, context, type, style, asset, or API call to `frontend/src`. `<Pagename>` / `<ContextName>` are PascalCase names; `<Controller>` is the PascalCase name of the backend controller/entity a service wraps (e.g. `Course`, `Auth`).

## Pages

Name page components `<Pagename>.tsx` and place them in `frontend/src/pages/`.

- Example: a lessons listing page is `frontend/src/pages/Lessons.tsx`.
- Matches existing pages (`Home.tsx`, `Courses.tsx`, `CourseDetail.tsx`, `Dashboard.tsx`, `Login.tsx`, `Register.tsx`).

## Context

Name context providers `<ContextName>Context.tsx` and place them in `frontend/src/context/`.

- Example: a cart context is `frontend/src/context/CartContext.tsx`.
- Matches the existing `frontend/src/context/AuthContext.tsx`.

## Types / Interfaces

Add all TypeScript interfaces and types to the single `frontend/src/types.ts` file — do not create per-entity type files.

## Styles

Use Tailwind CSS utility classes for styling; do not introduce new per-component CSS files or CSS-in-JS.

## Assets

Place images and other static files in `frontend/src/assets/`.

## API Calls

Name API service files `<Controller>Service.ts` and place them in `frontend/src/api/`, mirroring the backend controller they call.

- Example: calls to the backend `CourseController` live in `frontend/src/api/CourseService.ts`.
- The shared `frontend/src/api/client.ts` (axios/fetch instance) stays as-is — it is not a per-controller service file.