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
│   └── Dtos/<Resource>/<Resource>Dtos.cs   # one file per resource holding every request/response shape for it
├── Data/
│   └── AppDbContext.cs                # DbSets + all OnModelCreating relationship/index config in one place
├── Models/                           # PascalCase singular EF entity classes
├── Contracts/                        # interfaces only — no implementations
│   ├── IServices/                    # I<Resource>Service.cs, e.g. IAuthService.cs, ICourseService.cs
│   └── IHandlers/                    # I<Name>Handler.cs, e.g. ITokenHandler.cs, IOTPHandler.cs
│   └── Enums/                    # enum types, e.g. OtpVerifyResult.cs
├── Services/                        # <Resource>Service.cs — business logic per resource, e.g. AuthService.cs, CourseService.cs, QuizService.cs, UserService.cs
├── Handlers/                        # <Name>Handler.cs — TokenHandler (JWT), OTPHandler (OTP issue/verify); consumed by Services, not Controllers
├── Extensions/                        # ClaimsPrincipalExtensions, ResultExtensions (HttpError + ToActionResult)
├── Seeders/                          # <Resource>Seeder.cs, static class with a public RunAsync(AppDbContext)
├── Utils/                           # Slugify and other static helpers
├── Migrations/                       # EF Core Code-First migrations (generated — don't hand-edit)
└── Properties/launchSettings.json
```

There is no `Services/ClaimsPrincipalExtensions.cs` or inline-interface `TokenService.cs` anymore — those were the old shape. Interfaces live under `Contracts/`; `Services/` and `Handlers/` hold implementations only. `Handlers/` sits *below* the service layer: `AuthService` depends on `ITokenHandler`/`IOTPHandler`, but controllers never reference a Handler directly.

## File naming

- Controllers: `<Resource>Controller.cs` (PascalCase plural + suffix), e.g. `AuthController.cs`, `QuizzesController.cs`, `UsersController.cs`.
- Models: PascalCase singular EF entity, one file may hold a primary entity plus its join entities, e.g. `Quiz.cs` also defines `QuizSubject`/`QuizQuestion`.
- DTOs: grouped per resource under `Controllers/Dtos/<Resource>/<Resource>Dtos.cs` — one file holds every request DTO (`XRequest`), response DTO (`XDto`), and mapper for that resource, not one file per class.
- Services: `<Resource>Service.cs` under `Services/` (e.g. `AuthService.cs`, `CourseService.cs`), implementing an `I<Resource>Service` declared separately under `Contracts/IServices/I<Resource>Service.cs` — interface and implementation are never in the same file.
- Handlers: `<Name>Handler.cs` under `Handlers/` (e.g. `TokenHandler.cs`, `OTPHandler.cs`), implementing an `I<Name>Handler` declared separately under `Contracts/IHandlers/I<Name>Handler.cs` — same interface/implementation split as Services.
- Contracts: singular PascalCase interface file matching the type it declares (`ITokenHandler.cs` declares `ITokenHandler`), grouped under `IServices/` or `IHandlers/` by which layer implements it.
- Enums: singular PascalCase file matching the enum it declares, under `Contracts/Enums/<Name>.cs` (e.g. `OtpVerifyResult.cs` declares `enum OtpVerifyResult`) — enums are contracts too (a Handler/Service return shape a caller switches on), so they live alongside the interfaces, not next to the implementation that produces them.
- Seeders: `<Resource>Seeder.cs`, a `static class` with a single public `RunAsync(AppDbContext db)` entrypoint.
- Utils: plain PascalCase static helper class, no suffix (`Slugify.cs` exposes `Slugify.ToSlug(...)`).

## Code style

- **Namespaces**: file-scoped (`namespace LmsApi.Controllers;`), never block-scoped.
- **Controllers**: `[ApiController]` + `[Route("api/<resource>")]`; a class-level `[Authorize]` when every action needs *some* authenticated user, overridden per-action with `[Authorize(Roles = "admin")]` for admin-only endpoints, or `[Authorize(Roles = "admin")]` at the class level (`UsersController`) when the whole resource is admin-only. Public endpoints (`register`, `login`, `send-otp`, `verify-otp`) omit `[Authorize]` entirely on a controller that otherwise defaults to authenticated.
- **Controllers are thin**: a controller injects only its `I<Resource>Service` (never `AppDbContext` directly) and each action is a one-liner delegating to the service, e.g. `public async Task<IActionResult> Get(int id) => this.ToActionResult(await _courseService.GetAsync(id));`. If an action needs the current user's id, the controller reads it via `User.GetUserId()` and passes it into the service call as a plain `int` parameter — services don't take an `IHttpContextAccessor` dependency.
- **DB access**: services inject `AppDbContext` via constructor (`private readonly AppDbContext _db;`) and query directly in each method — no repository layer underneath the service either.
- **Result pattern**: service methods return `FluentResults.Result<T>` (or non-generic `Result` for delete-style actions with no payload) instead of throwing for expected failures. A failure is `Result.Fail<T>(new HttpError(statusCode, "message"))` (`HttpError` and the `ToActionResult`/`ToActionResult<T>` extensions live in `Extensions/ResultExtensions.cs`); a success is `Result.Ok<T>(payload)` where `payload` is already the exact response shape (e.g. `new { course = CourseDto.From(course) }`). The controller maps it in one call: `this.ToActionResult(result)` (200 default) or `this.ToActionResult(result, StatusCodes.Status201Created)` for Create actions — this is what replaces `BadRequest`/`NotFound`/`Conflict`/`Unauthorized`/`StatusCode(429, ...)` calls that used to live in the controller. Message strings and status codes passed to `HttpError` must still match `backend-node/`'s controllers exactly where behavior is mirrored. Unhandled exceptions are caught centrally by `Program.cs`'s `UseExceptionHandler` (mirrors `errorHandler.ts`); unmatched routes fall through to `MapFallback` (mirrors `notFound`).
- **Validation**: no `express-validator` equivalent/FluentValidation — each service method hand-validates at the top (`if (string.IsNullOrWhiteSpace(request.Title)) return Result.Fail<object>(new HttpError(400, "title is required"));`) before touching the DB, then re-checks referenced-id existence with a query (see Adaptations below).
- **DTO mapping**: every DTO exposes a `public static XDto From(Model model) => new() { ... };` factory instead of a constructor or AutoMapper profile. Response DTOs needing Mongo-shaped JSON use `[JsonPropertyName("_id")]` on the `Id` property for client compatibility.
- **JSON casing**: global camelCase policy is set once in `Program.cs` (`JsonNamingPolicy.CamelCase`) — don't set per-DTO naming policies.
- **Auth helpers**: read the current user's id via the `User.GetUserId()` extension (`Extensions/ClaimsPrincipalExtensions.cs`), never by hand-parsing claims in a controller or service.
- **Timestamps**: `CreatedAt`/`UpdatedAt` are set/touched explicitly in service code (`DateTime.UtcNow`), there are no EF `SaveChanges` interceptors for this.
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
