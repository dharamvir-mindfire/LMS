using FluentResults;
using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Lessons;
using LmsApi.Data;
using LmsApi.Extensions;
using LmsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Services;

public class LessonService : ILessonService
{
    private readonly AppDbContext _db;

    public LessonService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<object>> ListAsync(int? subjectId)
    {
        var query = _db.Lessons.Include(l => l.Subject).AsQueryable();
        if (subjectId.HasValue) query = query.Where(l => l.SubjectId == subjectId.Value);

        var lessons = await query.OrderBy(l => l.Order).ThenBy(l => l.CreatedAt).ToListAsync();
        return Result.Ok<object>(new { lessons = lessons.Select(LessonDto.From) });
    }

    public async Task<Result<object>> GetAsync(int id)
    {
        var lesson = await _db.Lessons.Include(l => l.Subject).FirstOrDefaultAsync(l => l.Id == id);
        if (lesson == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Lesson not found"));

        return Result.Ok<object>(new { lesson = LessonDto.From(lesson) });
    }

    public async Task<Result<object>> CreateAsync(LessonRequest request)
    {
        if (request.Subject == null || !await _db.Subjects.AnyAsync(s => s.Id == request.Subject))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid subject is required"));
        if (string.IsNullOrWhiteSpace(request.Title))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "title is required"));
        if (!string.IsNullOrWhiteSpace(request.VideoUrl) && !IsValidUrl(request.VideoUrl))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "videoUrl must be a valid URL"));

        var materialsResult = ToMaterials(request.Materials);
        if (materialsResult.IsFailed)
            return Result.Fail<object>(materialsResult.Errors);

        var lesson = new Lesson
        {
            SubjectId = request.Subject.Value,
            Title = request.Title.Trim(),
            Content = request.Content ?? string.Empty,
            VideoUrl = request.VideoUrl ?? string.Empty,
            Materials = materialsResult.Value,
            Order = request.Order ?? 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Lessons.Add(lesson);
        await _db.SaveChangesAsync();
        await _db.Entry(lesson).Reference(l => l.Subject).LoadAsync();
        return Result.Ok<object>(new { lesson = LessonDto.From(lesson) });
    }

    // Note: LessonsController applies no extra validation to PUT /:id beyond
    // what's below — any subset of fields is accepted and applied as-is,
    // unlike POST / which requires Subject + Title.
    public async Task<Result<object>> UpdateAsync(int id, LessonRequest request)
    {
        var lesson = await _db.Lessons.Include(l => l.Subject).FirstOrDefaultAsync(l => l.Id == id);
        if (lesson == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Lesson not found"));

        if (request.Materials != null)
        {
            var materialsResult = ToMaterials(request.Materials);
            if (materialsResult.IsFailed)
                return Result.Fail<object>(materialsResult.Errors);
            lesson.Materials = materialsResult.Value;
        }

        if (request.Subject.HasValue)
        {
            if (!await _db.Subjects.AnyAsync(s => s.Id == request.Subject))
                return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid subject is required"));
            lesson.SubjectId = request.Subject.Value;
        }
        if (request.Title != null) lesson.Title = request.Title;
        if (request.Content != null) lesson.Content = request.Content;
        if (request.VideoUrl != null)
        {
            if (!string.IsNullOrWhiteSpace(request.VideoUrl) && !IsValidUrl(request.VideoUrl))
                return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "videoUrl must be a valid URL"));
            lesson.VideoUrl = request.VideoUrl;
        }
        if (request.Order.HasValue) lesson.Order = request.Order.Value;
        lesson.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(lesson).Reference(l => l.Subject).LoadAsync();
        return Result.Ok<object>(new { lesson = LessonDto.From(lesson) });
    }

    public async Task<Result> DeleteAsync(int id)
    {
        var lesson = await _db.Lessons.FindAsync(id);
        if (lesson == null)
            return Result.Fail(new HttpError(StatusCodes.Status404NotFound, "Lesson not found"));

        _db.Lessons.Remove(lesson);
        await _db.SaveChangesAsync();
        return Result.Ok();
    }

    private static Result<List<LessonMaterial>> ToMaterials(List<LessonMaterialRequest>? materials)
    {
        if (materials == null) return Result.Ok(new List<LessonMaterial>());

        var result = new List<LessonMaterial>();
        foreach (var material in materials)
        {
            if (string.IsNullOrWhiteSpace(material.Title) || string.IsNullOrWhiteSpace(material.Url))
                return Result.Fail<List<LessonMaterial>>(new HttpError(StatusCodes.Status400BadRequest, "each material needs a title and url"));
            if (!IsValidUrl(material.Url))
                return Result.Fail<List<LessonMaterial>>(new HttpError(StatusCodes.Status400BadRequest, "each material url must be a valid URL"));
            result.Add(new LessonMaterial(material.Title.Trim(), material.Url.Trim()));
        }
        return Result.Ok(result);
    }

    private static bool IsValidUrl(string value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
