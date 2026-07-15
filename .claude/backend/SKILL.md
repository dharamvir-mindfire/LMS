---
name: backend
description: This skill should be used when creating or naming any backend file in the LMS Express/TypeScript API under backend/src — controllers, Mongoose models, TypeScript interfaces, route registration, or database seeders. Trigger phrases include "add a controller", "create a model", "add an interface", "add a route", "register a route", "add a seeder", "seed data", "new entity", "scaffold backend", or any request to add backend/src files for an entity (e.g. Course, User, Enrollment, Lesson).
---

# Backend Naming Conventions (LMS)

Apply these naming rules whenever adding a new controller, model, interface, route, or seeder to `backend/src`. `<Entity>` is the PascalCase singular name of the domain object (e.g. `Course`, `User`, `Enrollment`, `Lesson`).

## Controllers

Name controller files `<Entity>Controller.ts` and place them in `backend/src/controllers/`.

- Example: a Lesson controller is `backend/src/controllers/LessonController.ts`.
- Matches the existing controllers (`AuthController.ts`, `CourseController.ts`).

## Models

Name Mongoose model files `<Entity>.ts` and place them in `backend/src/models/`.

- Example: `backend/src/models/Lesson.ts`.
- This already matches the existing models (`Course.ts`, `User.ts`, `Enrollment.ts`) — keep following it.

## Interfaces

Name TypeScript interfaces `I<Entity>` (PascalCase, `I` prefix, no separator).

- Example: `ICourse`, `IUser`, `IEnrollment`.
- Use `I<Entity>` for the interface describing that entity's shape (e.g. the Mongoose document interface backing `<Entity>.ts`), not for arbitrary helper types.

## Routes

Per-entity route files (e.g. `backend/src/routes/authRoutes.ts`, `courseRoutes.ts`) only define and export an Express `Router` — they must not be mounted onto the app themselves.

All route registration — mounting each entity router onto its `/api/...` path — happens in a single `backend/src/routes.ts`, which `app.ts` imports and mounts once (e.g. `app.use('/api', routes)`). `app.ts` must not import or mount individual entity route files directly; only `routes.ts` does that.

## Seeders

Name seeder files `<Action>Seeder.ts` and place them in `backend/src/seeders/`.

- Example: `backend/src/seeders/DataSeeder.ts` seeds baseline dev/demo data (admin user, sample instructor/student, sample courses) — connects via `connectDB()`, is idempotent (look up by unique field like email/title before creating), and disconnects + exits when done.
- Register each seeder as an npm script in `backend/package.json` (e.g. `"seed": "tsx src/seeders/DataSeeder.ts"`) rather than requiring it to be run with a raw `tsx` path.
- Hash passwords with `bcryptjs` before inserting users directly (`User.create` does not hash on its own — hashing happens in `AuthController`, so seeders must replicate that step).