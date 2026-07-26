---
name: backend
description: Naming conventions, folder hierarchy, and code style for the LMS backend (ASP.NET Core 10 / EF Core / SQL Server). Use before creating or editing any file under backend/, so new controllers, models, DTOs, and services match existing house style.
---

# backend conventions (ASP.NET Core / EF Core / SQL Server)

`backend/` is an ASP.NET Core 10 Web API with EF Core Code-First migrations against SQL Server, serving `app/` (mobile) and `frontend/` (admin panel) over the same REST/JSON contract both clients already expect (Mongo-shaped `_id` fields, camelCase JSON, etc. — see below).

## Folder hierarchy

```
backend/
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

Interfaces live under `Contracts/`; `Services/` and `Handlers/` hold implementations only. `Handlers/` sits *below* the service layer: `AuthService` depends on `ITokenHandler`/`IOTPHandler`, but controllers never reference a Handler directly.

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
- **Result pattern**: service methods return `FluentResults.Result<T>` (or non-generic `Result` for delete-style actions with no payload) instead of throwing for expected failures. A failure is `Result.Fail<T>(new HttpError(statusCode, "message"))` (`HttpError` and the `ToActionResult`/`ToActionResult<T>` extensions live in `Extensions/ResultExtensions.cs`); a success is `Result.Ok<T>(payload)` where `payload` is already the exact response shape (e.g. `new { course = CourseDto.From(course) }`). The controller maps it in one call: `this.ToActionResult(result)` (200 default) or `this.ToActionResult(result, StatusCodes.Status201Created)` for Create actions. Unhandled exceptions are caught centrally by `Program.cs`'s `UseExceptionHandler`; unmatched routes fall through to `MapFallback`.
- **Validation**: no FluentValidation — each service method hand-validates at the top (`if (string.IsNullOrWhiteSpace(request.Title)) return Result.Fail<object>(new HttpError(400, "title is required"));`) before touching the DB, then re-checks referenced-id existence with a query.
- **DTO mapping**: every DTO exposes a `public static XDto From(Model model) => new() { ... };` factory instead of a constructor or AutoMapper profile. Response DTOs use `[JsonPropertyName("_id")]` on the `Id` property for client compatibility (see Database conventions below).
- **JSON casing**: global camelCase policy is set once in `Program.cs` (`JsonNamingPolicy.CamelCase`) — don't set per-DTO naming policies.
- **Auth helpers**: read the current user's id via the `User.GetUserId()` extension (`Extensions/ClaimsPrincipalExtensions.cs`), never by hand-parsing claims in a controller or service.
- **Timestamps**: `CreatedAt`/`UpdatedAt` are set/touched explicitly in service code (`DateTime.UtcNow`), there are no EF `SaveChanges` interceptors for this.
- **Comments**: sparse, and used specifically to flag a non-obvious constraint or a deliberate adaptation forced by the relational model — `// Note: ...`. Don't add comments that just restate the code.

## Database conventions (EF Core / SQL Server)

- All relationship config, indexes, and delete-behavior lives in `AppDbContext.OnModelCreating` — not via data annotations on the model classes, which stay plain POCOs.
- IDs are `int` IDENTITY (auto-increment), not string ObjectIds — but still serialized as `_id` in JSON via `[JsonPropertyName("_id")]` on DTOs, for client compatibility with `app/`'s and `frontend/`'s existing `_id`-shaped types.
- Fields are PascalCase in C# (`CorrectOptionIndex`, `QuestionsAnswered`), camelCase over the wire (handled by the global JSON policy).
- Many-to-many relationships (`Quiz`↔`Subject`, `Quiz`↔`Question`) are real EF join entities with composite keys (`QuizSubject`, `QuizQuestion`), not array-of-id fields; `QuizQuestion.Order` preserves original ordering, so always sort by it (`.OrderBy(qq => qq.Order)`) when reading questions back out.
- A field with no natural SQL Server column type — a string array like `Question.Options` — is stored via an EF `HasConversion` value converter (JSON-string column) plus an explicit `ValueComparer`. Follow this pattern for any future array-typed field rather than introducing a separate child table unless relational querying into it is actually needed.
- Delete behavior: `Restrict` where the controller already 409s the same condition (Course→Subject, Subject→Question), `SetNull` where a dangling reference shouldn't block a delete (`Quiz.CreatedById`), `Cascade` on the two join tables.
- Schema changes go through `dotnet ef migrations add <Name>` — never hand-edit `Migrations/*.cs` or the `AppDbContextModelSnapshot.cs`.

## Route conventions

- REST resource-plural under `/api/<resource>`, no version prefix — `/api/auth`, `/api/questions`, `/api/courses`, `/api/subjects`, `/api/quizzes`, `/api/users`, plus `/api/home/stats` and `/api/health`.
- Nested/non-CRUD actions are verb sub-paths: `/api/quizzes/:id/start`, `/api/quizzes/:id/submit`, `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/users/:id/role`.
- Route params use the `{id:int}` constraint, not bare `{id}`.
- `LowercaseUrls = true` is set globally in `Program.cs` — don't add per-route casing overrides.

## Auth model

JWT-bearer: `email + password` (register/login) or `email + OTP` (send-otp/verify-otp, account auto-created on first OTP request — OTP is keyed by **email**, not phone). Claims are `id` (mapped to `NameClaimType`), `role` (mapped to `RoleClaimType`), `name` — set `options.MapInboundClaims = false` on the JWT bearer handler when touching auth config, otherwise ASP.NET remaps short claim names to long XML-namespace URIs and silently breaks role/id matching. 401/403 responses are forced into a `{ message }` JSON shape via `JwtBearerEvents.OnChallenge`/`OnForbidden` — don't let them fall back to ASP.NET's default empty-body responses.

## Env / config

No `.env` files — configuration lives in `appsettings.json` (base) and `appsettings.Development.json` (dev overrides), read via `builder.Configuration["Section:Key"]`. Keys: `ConnectionStrings:Default`, `Jwt:Secret`, `Jwt:ExpiresInDays`, `Cors:ClientUrl`, `Port`. Required keys that are missing should throw at startup (`?? throw new InvalidOperationException(...)`).

## Running / seeding

`dotnet run -- seed`, `seed:users`, `seed:questions` — passing one of these as the first CLI arg seeds and exits instead of starting the web server (handled by the branch at the very top of `Program.cs`, before `WebApplication.CreateBuilder`). Schema changes require `dotnet ef database update` after adding a migration.
