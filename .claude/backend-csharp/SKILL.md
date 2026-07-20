---
name: backend-csharp
description: Naming conventions, folder hierarchy, and code style for the LMS C# backend (ASP.NET Core 10 / EF Core / SQL Server) — a parallel implementation of backend-node. Use before creating or editing any file under backend-csharp/, so new controllers, models, DTOs, and services match existing house style.
---

# backend-csharp conventions (ASP.NET Core / EF Core / SQL Server)

`backend-csharp/` is a parallel implementation of `backend-node/` (Express + Mongoose + MongoDB): same 31 routes, same request/response JSON shapes, same auth model and validation rules, built on ASP.NET Core 10 Web API with EF Core Code-First migrations against SQL Server. When adding a feature, check how `backend-node/` does it first and mirror it — deviations should only happen where the relational model forces one (see [Adaptations](#adaptations-from-the-mongo-original)), and should be called out in a comment the way existing code does (`// Mirrors X.ts's ...`, `// Note: ...`, `// Matches ...`).

## Folder hierarchy

```
backend-csharp/
├── appsettings.json, appsettings.Development.json   # ConnectionStrings:Default, Jwt:Secret/ExpiresInDays, Cors:ClientUrl
├── LmsApi.csproj                     # net10.0, Nullable+ImplicitUsings enabled
├── Program.cs                        # top-level statements: seed-mode branch, DI wiring, JWT auth, CORS, middleware pipeline
├── Controllers/                      # <Resource>Controller.cs
├── Data/
│   └── AppDbContext.cs                # DbSets + all OnModelCreating relationship/index config in one place
├── Dtos/<Resource>/<Resource>Dtos.cs   # one file per resource holding every request/response shape for it
├── Models/                           # PascalCase singular EF entity classes
├── Services/                        # TokenService (+ITokenService), ClaimsPrincipalExtensions
├── Seeders/                          # <Resource>Seeder.cs, static class with a public RunAsync(AppDbContext)
├── Utils/                           # Slugify and other static helpers
├── Migrations/                       # EF Core Code-First migrations (generated — don't hand-edit)
└── Properties/launchSettings.json
```

There is no `services/` layer in the Node sense — `Services/` here only holds `TokenService` and the `ClaimsPrincipalExtensions` helper; controllers still talk to `AppDbContext` directly, same as `backend-node/` controllers talk to Mongoose models directly. There is no `tests/` directory (matches `backend-node/`, which also has none).

## File naming

- Controllers: `<Resource>Controller.cs` (PascalCase plural + suffix), e.g. `AuthController.cs`, `QuizzesController.cs`, `UsersController.cs`.
- Models: PascalCase singular EF entity, one file may hold a primary entity plus its join entities, e.g. `Quiz.cs` also defines `QuizSubject`/`QuizQuestion`.
- DTOs: grouped per resource under `Dtos/<Resource>/<Resource>Dtos.cs` — one file holds every request DTO (`XRequest`), response DTO (`XDto`), and mapper for that resource, not one file per class.
- Services: plain PascalCase + `Service` suffix, with an `I`-prefixed interface alongside it in the same file (`TokenService.cs` defines both `ITokenService` and `TokenService`).
- Seeders: `<Resource>Seeder.cs`, a `static class` with a single public `RunAsync(AppDbContext db)` entrypoint.
- Utils: plain PascalCase static helper class, no suffix (`Slugify.cs` exposes `Slugify.ToSlug(...)`).

## Code style

- **Namespaces**: file-scoped (`namespace LmsApi.Controllers;`), never block-scoped.
- **Controllers**: `[ApiController]` + `[Route("api/<resource>")]`; a class-level `[Authorize]` when every action needs *some* authenticated user, overridden per-action with `[Authorize(Roles = "admin")]` for admin-only endpoints, or `[Authorize(Roles = "admin")]` at the class level (`UsersController`) when the whole resource is admin-only — mirrors `protect`/`adminOnly` middleware chaining in `backend-node/`. Public endpoints (`register`, `login`, `send-otp`, `verify-otp`) omit `[Authorize]` entirely on a controller that otherwise defaults to authenticated.
- **DB access**: inject `AppDbContext` via constructor (`private readonly AppDbContext _db;`), query directly in the action — no repository/service indirection.
- **Error handling**: no try/catch for expected failures. Return `BadRequest`/`NotFound`/`Conflict`/`Unauthorized`/`StatusCode(429, ...)` with `new { message = "..." }` bodies directly, matching the exact message strings used in `backend-node/`'s controllers where behavior is mirrored. Unhandled exceptions are caught centrally by `Program.cs`'s `UseExceptionHandler` (mirrors `errorHandler.ts`); unmatched routes fall through to `MapFallback` (mirrors `notFound`).
- **Validation**: no `express-validator` equivalent/FluentValidation — each action hand-validates at the top (`if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(...)`) before touching the DB, then re-checks referenced-id existence with a query (see Adaptations below).
- **DTO mapping**: every DTO exposes a `public static XDto From(Model model) => new() { ... };` factory instead of a constructor or AutoMapper profile. Response DTOs needing Mongo-shaped JSON use `[JsonPropertyName("_id")]` on the `Id` property for client compatibility.
- **JSON casing**: global camelCase policy is set once in `Program.cs` (`JsonNamingPolicy.CamelCase`) — don't set per-DTO naming policies.
- **Auth helpers**: read the current user's id via the `User.GetUserId()` extension (`Services/ClaimsPrincipalExtensions.cs`), never by hand-parsing claims in a controller.
- **Timestamps**: `CreatedAt`/`UpdatedAt` are set/touched explicitly in controller code (`DateTime.UtcNow`), there are no EF `SaveChanges` interceptors for this.
- **Comments**: sparse, and used specifically to flag a deliberate divergence from or mirroring of the Node original — `// Mirrors X.ts's ...`, `// Note: ...` for a known asymmetry, `// Matches Y.ts reusing the same validators for ...`. Don't add comments that just restate the code.

## Database conventions (EF Core / SQL Server)

- All relationship config, indexes, and delete-behavior lives in `AppDbContext.OnModelCreating` — not via data annotations on the model classes, which stay plain POCOs.
- IDs are `int` IDENTITY (auto-increment), not ObjectId strings — but still serialized as `_id` in JSON via `[JsonPropertyName("_id")]` on DTOs, for client compatibility with `backend-node/`.
- Fields are PascalCase in C# (`CorrectOptionIndex`, `QuestionsAnswered`), camelCase over the wire (handled by the global JSON policy).
- Many-to-many relationships (`Quiz`↔`Subject`, `Quiz`↔`Question`) are real EF join entities with composite keys (`QuizSubject`, `QuizQuestion`), not Mongo-style arrays of ids; `QuizQuestion.Order` preserves original array ordering, so always sort by it (`.OrderBy(qq => qq.Order)`) when reading questions back out.
- A field that was a native array in Mongo but has no SQL Server array type (`Question.Options`) is stored via an EF `HasConversion` value converter (JSON-string column) plus an explicit `ValueComparer` — follow this pattern for any future array-typed field rather than introducing a separate child table unless relational querying into it is actually needed.
- Delete behavior is chosen to match the Mongo original's actual runtime behavior, not just "what's safe": `Restrict` where the controller already 409s on the same condition (Course→Subject, Subject→Question), `SetNull` where Mongo left a dangling reference and never blocked the delete (`Quiz.CreatedById`), `Cascade` on the two join tables.
- Schema changes go through `dotnet ef migrations add <Name>` — never hand-edit `Migrations/*.cs` or the `AppDbContextModelSnapshot.cs`.

## Route conventions

- Same paths as `backend-node/`: REST resource-plural under `/api/<resource>`, no version prefix — `/api/auth`, `/api/questions`, `/api/courses`, `/api/subjects`, `/api/quizzes`, `/api/users`, plus `/api/home/stats` and `/api/health`.
- Nested/non-CRUD actions are verb sub-paths: `/api/quizzes/:id/start`, `/api/quizzes/:id/submit`, `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/users/:id/role`.
- Route params use the `{id:int}` constraint, not bare `{id}`.
- `LowercaseUrls = true` is set globally in `Program.cs` — don't add per-route casing overrides.

## Auth model

Same JWT-bearer model as `backend-node/`: `email + password` (register/login) or `email + OTP` (send-otp/verify-otp, account auto-created on first OTP request — note this backend keys OTP by **email**, not phone, unlike the mobile-app-facing description in the root `backend-node`/Mongo plan). Claims are `id` (mapped to `NameClaimType`), `role` (mapped to `RoleClaimType`), `name` — set `options.MapInboundClaims = false` on the JWT bearer handler when touching auth config, otherwise ASP.NET remaps short claim names to long XML-namespace URIs and silently breaks role/id matching. 401/403 responses are forced into the same `{ message }` JSON shape as the Node API via `JwtBearerEvents.OnChallenge`/`OnForbidden` — don't let them fall back to ASP.NET's default empty-body responses.

## Env / config

No `.env` files — configuration lives in `appsettings.json` (base) and `appsettings.Development.json` (dev overrides), read via `builder.Configuration["Section:Key"]`. Keys: `ConnectionStrings:Default`, `Jwt:Secret`, `Jwt:ExpiresInDays`, `Cors:ClientUrl`, `Port`. Required keys that are missing should throw at startup (`?? throw new InvalidOperationException(...)`), matching how `backend-node/`'s `env.ts` fails fast on a missing required var.

## Running / seeding

`dotnet run -- seed`, `seed:users`, `seed:questions` mirror `npm run seed` / `seed:users` / `seed:questions` — passing one of these as the first CLI arg seeds and exits instead of starting the web server (handled by the branch at the very top of `Program.cs`, before `WebApplication.CreateBuilder`). Schema changes require `dotnet ef database update` after adding a migration.

## Adaptations from the Mongo original

MongoDB has no schema/referential enforcement; SQL Server does, so a few behaviors are deliberately different rather than byte-identical — see `backend-csharp/README.md` for the full rationale. In short: existence-checked foreign keys return the same 400 message the original's shape-only `isMongoId()` check would have missed; `Quiz.CreatedById` deletion is `SetNull` instead of blocked; join tables are real many-to-many tables instead of array-of-ObjectId fields; `Question.Options` is a JSON-string column via a value converter. When implementing a new feature here, prefer matching the Node behavior exactly, and only introduce a new adaptation — documented the same way — when the relational model genuinely can't do otherwise.
