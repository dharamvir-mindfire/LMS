using FluentResults;
using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Courses;
using LmsApi.Data;
using LmsApi.Extensions;
using LmsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Services;

public class CourseService : ICourseService
{
    private readonly AppDbContext _db;

    public CourseService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<object>> ListAsync()
    {
        var courses = await _db.Courses.OrderBy(c => c.Title).ToListAsync();
        return Result.Ok<object>(new { courses = courses.Select(CourseDto.From) });
    }

    public async Task<Result<object>> GetAsync(int id)
    {
        var course = await _db.Courses.FindAsync(id);
        if (course == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Course not found"));

        return Result.Ok<object>(new { course = CourseDto.From(course) });
    }

    public async Task<Result<object>> CreateAsync(CourseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "title is required"));

        var course = new Course
        {
            Title = request.Title.Trim(),
            Description = request.Description ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Courses.Add(course);
        await _db.SaveChangesAsync();
        return Result.Ok<object>(new { course = CourseDto.From(course) });
    }

    public async Task<Result<object>> UpdateAsync(int id, CourseRequest request)
    {
        // Matches CourseRoutes.ts reusing the same validators for create+update:
        // `title` is required even on a partial update.
        if (string.IsNullOrWhiteSpace(request.Title))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "title is required"));

        var course = await _db.Courses.FindAsync(id);
        if (course == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Course not found"));

        course.Title = request.Title.Trim();
        if (request.Description != null) course.Description = request.Description;
        course.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result.Ok<object>(new { course = CourseDto.From(course) });
    }

    public async Task<Result> DeleteAsync(int id)
    {
        var course = await _db.Courses.FindAsync(id);
        if (course == null)
            return Result.Fail(new HttpError(StatusCodes.Status404NotFound, "Course not found"));

        var hasSubjects = await _db.Subjects.AnyAsync(s => s.CourseId == id);
        if (hasSubjects)
            return Result.Fail(new HttpError(StatusCodes.Status409Conflict, "Delete this course's subjects first"));

        _db.Courses.Remove(course);
        await _db.SaveChangesAsync();
        return Result.Ok();
    }
}
