# LMS backend (ASP.NET Core / EF Core)

The API for the LMS platform, built on ASP.NET Core 10 Web API with EF Core Code-First migrations against SQL Server.

## Run it

Requires the .NET 10 SDK and a reachable SQL Server instance (this was built and tested against a local SQL Server Express instance).

```bash
# 1. point ConnectionStrings:Default (appsettings.json or an override) at your SQL Server
# 2. apply migrations
dotnet ef database update

# 3. seed reference data
dotnet run -- seed          # both of the below
dotnet run -- seed:users    # Admin (admin@admin.com / Admin@123), Demo User (user@example.com / User@123)
dotnet run -- seed:questions

# 4. run the API
dotnet run
```

Default port is `http://localhost:5000`, configurable via `Properties/launchSettings.json`, config (`Port`), or `--urls`.

Config lives in `appsettings.json` / `appsettings.Development.json`: `ConnectionStrings:Default`, `Jwt:Secret`, `Jwt:ExpiresInDays`, `Cors:ClientUrl`.

## Design notes

- **IDs are `int` IDENTITY, not GUIDs or ObjectId strings.** Still surfaced as `_id` in every JSON response, for client compatibility with `app/` and `frontend/`'s existing `_id`-shaped types.
- **Foreign keys are existence-checked**, not just shape-checked — a request referencing a nonexistent course/subject/question id fails with a 400 before it would ever hit a DB constraint error.
- **Deleting a user never fails**, even if they authored quizzes: `Quiz.CreatedById` is nullable with `ON DELETE SET NULL`.
- **Course→Subject and Subject→Question/Lesson deletes are `RESTRICT`** at the DB level, backstopping the same 409 checks the controllers already perform in application code.
- **Quiz↔Subject and Quiz↔Question are real many-to-many join tables** (`QuizSubjects`, `QuizQuestions`) instead of array-of-id fields; `QuizQuestions.Order` preserves question ordering.
- **`Question.Options` and `Lesson.Materials`** (native arrays/object-lists with no SQL Server column equivalent) are stored as JSON-string columns via EF Core value converters.
- **Lesson videos and materials are external URLs, not uploaded files** — no storage/blob layer exists; `videoUrl` and each `materials[].url` are just validated as well-formed URLs.

See `.claude/backend/SKILL.md` for the full set of naming/folder/code-style conventions this project follows.
