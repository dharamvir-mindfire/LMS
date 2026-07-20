# LMS API (ASP.NET Core / EF Core)

A parallel implementation of `backend/` (Express + Mongoose + MongoDB) built on
ASP.NET Core 10 Web API with EF Core Code-First migrations against SQL Server.
Same 31 routes, same request/response JSON shapes, same auth model and
validation rules — see [Adaptations](#adaptations-from-the-mongo-original) for
the handful of places a relational database forced a deliberate difference.

## Run it

Requires the .NET 10 SDK and a reachable SQL Server instance (this was built
and tested against a local SQL Server Express instance).

```bash
# 1. point ConnectionStrings:Default (appsettings.json or an override) at your SQL Server
# 2. apply migrations
dotnet ef database update

# 3. seed reference data (matches `npm run seed` in backend/)
dotnet run -- seed          # both of the below
dotnet run -- seed:users    # Admin (admin@admin.com / Admin@123), Demo User (user@example.com / User@123)
dotnet run -- seed:questions

# 4. run the API
dotnet run
```

Default port is `http://localhost:5000` (matches `backend/`'s default `PORT`),
configurable via `Properties/launchSettings.json` or `--urls`.

Config lives in `appsettings.json` / `appsettings.Development.json`:
`ConnectionStrings:Default`, `Jwt:Secret`, `Jwt:ExpiresInDays`, `Cors:ClientUrl`.

## Adaptations from the Mongo original

MongoDB has no schema/referential enforcement; SQL Server does. A few
behaviors couldn't be replicated byte-for-byte as a result:

- **IDs are `int` IDENTITY, not ObjectId strings.** Still surfaced as
  `_id` in every JSON response for client compatibility.
- **"a valid course/subject is required" now means "exists", not just
  "well-formed."** The original's `express-validator` `isMongoId()` only
  checks string shape, so a well-formed-but-nonexistent id would silently
  create a dangling reference — a scenario a relational FK simply can't
  allow to succeed. This API checks existence up front and returns the same
  400 message instead of hitting a DB constraint error.
- **Deleting a user never fails**, even if they authored quizzes:
  `Quiz.CreatedById` is nullable with `ON DELETE SET NULL`, matching the
  original's behavior of leaving a dangling reference rather than blocking
  the delete (Mongo has no FK to violate here in the first place).
- **Course→Subject and Subject→Question deletes are `RESTRICT`** at the DB
  level, backstopping the same 409 checks the original controllers already
  perform in application code.
- **Quiz↔Subject and Quiz↔Question are real many-to-many join tables**
  (`QuizSubjects`, `QuizQuestions`) instead of Mongo arrays of ObjectIds;
  `QuizQuestions.Order` preserves the original array ordering.
- **`Question.Options`** (a native array in Mongo) is stored as a JSON
  string column via an EF Core value converter — SQL Server has no array
  column type.
