using System.Text;
using System.Text.Json;
using LmsApi.Contracts.IHandlers;
using LmsApi.Contracts.IServices;
using LmsApi.Data;
using LmsApi.Handlers;
using LmsApi.Seeders;
using LmsApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

// Mirrors `npm run seed:users` / `seed:questions` / `seed` — running the app
// with one of these as the first argument seeds the database and exits
// instead of starting the web server.
if (args.Length > 0 && args[0] is "seed:users" or "seed:questions" or "seed")
{
    var seedBuilder = Host.CreateApplicationBuilder(args);
    seedBuilder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(
            seedBuilder.Configuration.GetConnectionString("Default"),
            sqlOptions => sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));
    using var seedHost = seedBuilder.Build();
    using var scope = seedHost.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (args[0] is "seed:users" or "seed")
        await UserSeeder.RunAsync(db);
    if (args[0] is "seed:questions" or "seed")
        await QuestionSeeder.RunAsync(db);

    return;
}

var builder = WebApplication.CreateBuilder(args);

// Bind to all network interfaces (not just localhost) so the API is reachable
// over the LAN — e.g. from a physical phone running the Expo app pointed at
// this machine's LAN IP. Takes precedence over launchSettings.json's
// applicationUrl; override with --urls or ASPNETCORE_URLS if needed.
var port = builder.Configuration["Port"] ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.Configure<Microsoft.AspNetCore.Routing.RouteOptions>(options =>
{
    options.LowercaseUrls = true;
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never;
});

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
    options.AddOperationTransformer<BearerSecuritySchemeTransformer>();
});

// EnableRetryOnFailure guards against transient connectivity failures — most
// notably an Azure SQL serverless database that's auto-paused and takes tens
// of seconds to resume, which would otherwise surface as a broken connection
// on the very first query after idling.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("Default"),
        sqlOptions => sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)));

builder.Services.AddScoped<ITokenHandler, LmsApi.Handlers.TokenHandler>();
builder.Services.AddScoped<IOTPHandler, OTPHandler>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<ISubjectService, SubjectService>();
builder.Services.AddScoped<IQuestionService, QuestionService>();
builder.Services.AddScoped<ILessonService, LessonService>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IHomeService, HomeService>();

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Without this, the handler remaps short claim names ("role", "id")
        // to long XML-namespace URIs on validation, silently breaking
        // RoleClaimType/NameClaimType matching below.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            RoleClaimType = "role",
            NameClaimType = "id",
        };

        // Mirrors middleware/auth.ts's `protect`: distinct messages for a
        // missing token vs. an invalid/expired one, both as 401 JSON bodies
        // instead of ASP.NET's default empty 401 response.
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                var hasToken = context.Request.Headers.Authorization.ToString().StartsWith("Bearer ");
                var message = hasToken ? "Invalid or expired token" : "Not authenticated";
                await context.Response.WriteAsJsonAsync(new { message });
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message = "Forbidden" });
            },
        };
    });

builder.Services.AddAuthorization();

var configuredOrigins = (builder.Configuration["Cors:ClientUrl"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

var allowedOrigins = configuredOrigins.Append("http://localhost:8081").ToArray();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// A failed migration attempt must not crash the whole host — on a paused
// Azure SQL serverless database (or any transient outage) this used to throw
// here, before the app ever started listening, which IIS/ANCM surfaces as a
// generic "HTTP 500.30 - ASP.NET Core app failed to start" with no server-side
// trace. Log and continue instead: the retry-enabled DbContext above still
// gets a chance to reach the database on the first real request.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        dbContext.Database.Migrate();
    }
    catch (Exception ex)
    {
        startupLogger.LogError(ex, "Database migration failed at startup; continuing without blocking app startup.");
    }
}
// Served under /api because Azure Static Web Apps' linked-backend proxy only
// ever forwards /api/* to this App Service — frontend/public/staticwebapp.config.json
// rewrites the friendly /swagger/* URLs down to these routes so the address
// bar can stay prefix-free.
app.MapOpenApi("/openapi/{documentName}.json");
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/openapi/v1.json", "LMS API v1");
});

// Mirrors middleware/ErrorHandler.ts's `errorHandler`: any unhandled
// exception becomes a generic 500 JSON body instead of leaking details. Also
// logs the actual exception server-side — previously this handler swallowed
// it entirely, so diagnosing a live incident meant live-tailing logs instead
// of reading what had already been recorded.
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>()?.Error;
        if (exception != null)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(exception, "Unhandled exception processing {Method} {Path}", context.Request.Method, context.Request.Path);
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "Internal server error" });
    });
});

app.UseCors();

// Actually checks DB connectivity rather than only confirming the process is
// up — a paused/unreachable database previously left every real endpoint
// broken while this kept returning a bare 200, giving no signal of the
// degraded state.
app.MapGet("/api/health", async (AppDbContext dbContext) =>
{
    var databaseConnected = await dbContext.Database.CanConnectAsync();
    return databaseConnected
        ? Results.Ok(new { status = "ok", database = "connected" })
        : Results.Json(new { status = "degraded", database = "unreachable" }, statusCode: StatusCodes.Status503ServiceUnavailable);
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Mirrors middleware/ErrorHandler.ts's `notFound`: any unmatched route.
app.MapFallback(context =>
{
    context.Response.StatusCode = StatusCodes.Status404NotFound;
    context.Response.ContentType = "application/json";
    return context.Response.WriteAsJsonAsync(new { message = "Not found" });
});

app.Run();

// Registers the "Bearer" scheme in the generated OpenAPI doc and marks only
// the operations backed by an [Authorize]'d action as requiring it, so
// Swagger UI's Authorize button and per-endpoint lock icons match the
// controllers' actual auth requirements instead of applying to every route.
internal sealed class BearerSecuritySchemeTransformer : IOpenApiDocumentTransformer, IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
        };

        return Task.CompletedTask;
    }

    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        var requiresAuth = context.Description.ActionDescriptor.EndpointMetadata.OfType<IAuthorizeData>().Any();
        if (requiresAuth)
        {
            operation.Security ??= [];
            operation.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", context.Document, null)] = [],
            });
        }

        return Task.CompletedTask;
    }
}
