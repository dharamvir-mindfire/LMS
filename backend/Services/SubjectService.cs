using FluentResults;
using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Subjects;
using LmsApi.Data;
using LmsApi.Extensions;
using LmsApi.Models;
using LmsApi.Utils;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Services;

public class SubjectService : ISubjectService
{
    private readonly AppDbContext _db;

    public SubjectService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<object>> ListAsync(int? courseId)
    {
        var query = _db.Subjects.Include(s => s.Course).AsQueryable();
        if (courseId.HasValue) query = query.Where(s => s.CourseId == courseId.Value);

        var subjects = await query.OrderBy(s => s.Name).ToListAsync();
        return Result.Ok<object>(new { subjects = subjects.Select(SubjectDto.From) });
    }

    public async Task<Result<object>> GetAsync(int id)
    {
        var subject = await _db.Subjects.Include(s => s.Course).FirstOrDefaultAsync(s => s.Id == id);
        if (subject == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Subject not found"));

        return Result.Ok<object>(new { subject = SubjectDto.From(subject) });
    }

    public async Task<Result<object>> CreateAsync(SubjectRequest request)
    {
        if (request.Course == null || !await _db.Courses.AnyAsync(c => c.Id == request.Course))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid course is required"));
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "name is required"));

        var subject = new Subject
        {
            CourseId = request.Course.Value,
            Name = request.Name.Trim(),
            Slug = Slugify.ToSlug(request.Name.Trim()),
            Description = request.Description ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Subjects.Add(subject);
        await _db.SaveChangesAsync();
        await _db.Entry(subject).Reference(s => s.Course).LoadAsync();
        return Result.Ok<object>(new { subject = SubjectDto.From(subject) });
    }

    // Note: SubjectRoutes.ts applies no validators to PUT /:id — any subset of
    // fields is accepted and applied as-is, unlike POST /.
    public async Task<Result<object>> UpdateAsync(int id, SubjectRequest request)
    {
        var subject = await _db.Subjects.Include(s => s.Course).FirstOrDefaultAsync(s => s.Id == id);
        if (subject == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Subject not found"));

        if (request.Course.HasValue) subject.CourseId = request.Course.Value;
        if (request.Name != null)
        {
            subject.Name = request.Name;
            subject.Slug = Slugify.ToSlug(request.Name);
        }
        if (request.Description != null) subject.Description = request.Description;
        subject.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(subject).Reference(s => s.Course).LoadAsync();
        return Result.Ok<object>(new { subject = SubjectDto.From(subject) });
    }

    public async Task<Result> DeleteAsync(int id)
    {
        var subject = await _db.Subjects.FindAsync(id);
        if (subject == null)
            return Result.Fail(new HttpError(StatusCodes.Status404NotFound, "Subject not found"));

        var hasQuestions = await _db.Questions.AnyAsync(q => q.SubjectId == id);
        if (hasQuestions)
            return Result.Fail(new HttpError(StatusCodes.Status409Conflict, "Delete this subject's questions first"));

        var hasLessons = await _db.Lessons.AnyAsync(l => l.SubjectId == id);
        if (hasLessons)
            return Result.Fail(new HttpError(StatusCodes.Status409Conflict, "Delete this subject's lessons first"));

        _db.Subjects.Remove(subject);
        await _db.SaveChangesAsync();
        return Result.Ok();
    }
}
