---
name: backend
description: Naming conventions, folder hierarchy, and code style for the LMS backend (Node/Express/TypeScript/Mongoose). Use before creating or editing any file under backend/, so new controllers, routes, models, and utils match existing house style.
---

# backend conventions (Node/Express/TypeScript/Mongoose)

## Folder hierarchy

```
backend/
├── .env, .env.development, .env.production, .env.staging, .env.example
├── package.json, tsconfig.json
└── src/
    ├── app.ts          # express app wiring: middleware + route mounting
    ├── server.ts        # entrypoint: loads env, connects DB, starts listener
    ├── config/          # Env.ts (dotenv loading), Db.ts (mongoose connectDB)
    ├── controllers/      # <resource>Controller.ts
    ├── middleware/       # auth.ts (protect/adminOnly), ErrorHandler.ts
    ├── models/           # PascalCase singular Mongoose models
    ├── routes/           # <resource>Routes.ts
    └── utils/            # asyncHandler.ts, generateToken.ts, slugify.ts
```

There is no `services/` layer — controllers call Mongoose models directly. There is no `tests/` directory in `backend/` (tests only exist under `App/__tests__`). A leading-underscore file like `_seed-admin-temp.ts` signals a one-off/internal script, not part of the app's request flow.

## File naming

- Controllers: `<resource>Controller.ts` (PascalCase + suffix), e.g. `AuthController.ts`, `QuizController.ts`.
- Routes: `<resource>Routes.ts`, e.g. `QuizRoutes.ts`.
- Models: PascalCase singular, matching the Mongoose model name exactly, e.g. `User.ts`, `Question.ts`, `Quiz.ts`.
- Middleware/utils: plain PascalCase, no suffix, e.g. `ErrorHandler.ts`, `AsyncHandler.ts`, `GenerateToken.ts`, `Slugify.ts`.
- config: plain camelCase, no suffix, e.g. `env.ts`, `db.ts`.
- seeders: `<resource>Seeder.ts` (PascalCase + suffix), e.g. `UserSeeder.ts`, `QuestionSeeder.ts`.

## Code style

- **Exports**: named exports for controllers, middleware, and utils (`export async function register(...)`, `export function protect(...)`); default export for models, routers, and the app (`export default mongoose.model<IUser>(...)`, `export default router`, `export default app`).
- **Functions**: named function declarations, not arrows, for controllers/utils (`export async function login(...)`). Mongoose schema methods/hooks use named function expressions so `this` binds correctly (`function hashPassword(next) {...}`, `userSchema.methods.comparePassword = function comparePassword(...) {...}`).
- **Types**: Mongoose document interfaces are `I`-prefixed PascalCase (`IUser`, `IQuestion`); union/enum-like types are plain PascalCase (`UserRole`, `Difficulty`).
- **Error handling**: controllers do not use try/catch for expected failures — routes wrap the controller in `asyncHandler(...)` (`src/utils/asyncHandler.ts`) to forward thrown/rejected errors to Express's `next`, caught centrally by `notFound`/`errorHandler` in `src/middleware/errorHandler.ts`. Expected/validation failures return `res.status(x).json({ message })` directly rather than throwing.
- **Validation**: `express-validator` `body(...)` chains are defined in the route file (see `quizRoutes.ts`'s `quizValidators` array) and passed as route middleware; each controller function checks `validationResult(req)` first and returns 400 with the first error message if invalid.

## Database conventions

- `mongoose.model<IX>("X", xSchema)` — the string name is the singular capitalized resource name, matching the file name.
- Fields are camelCase (`correctOptionIndex`, `questionsAnswered`).
- References use the string model name (`ref: 'Subject'`, `ref: "Question"`), not the imported model.

## Route conventions

- REST resource-plural paths mounted under `/api/<resource>` in `src/app.ts`, no version prefix: `/api/auth`, `/api/questions`, `/api/courses`, `/api/subjects`, `/api/quizzes`, `/api/users`.
- Nested/non-CRUD actions are verb sub-paths on the resource: `/api/quizzes/:id/start`, `/api/quizzes/:id/submit`, `/api/questions/:id/answer`, `/api/auth/send-otp`.

## Env vars

SCREAMING_SNAKE_CASE (`NODE_ENV`, `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`), loaded per environment via `.env.development` / `.env.staging` / `.env.production` (falling back to a base `.env`), with required keys documented in `.env.example`.

## Formatting note

`backend/` has no ESLint/Prettier config (unlike `App/` and `Web/`), so quote style is inconsistent across older vs. newer files. Prefer **double quotes** to match the newer files (`AuthController.ts`, `User.ts`, `quizRoutes.ts`) rather than the older single-quote style (`errorHandler.ts`, `db.ts`, `Question.ts`).
