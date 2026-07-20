using LmsApi.Data;
using LmsApi.Dtos.Courses;
using LmsApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/courses")]
public class CoursesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CoursesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var courses = await _db.Courses.OrderBy(c => c.Title).ToListAsync();
        return Ok(new { courses = courses.Select(CourseDto.From) });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var course = await _db.Courses.FindAsync(id);
        if (course == null)
            return NotFound(new { message = "Course not found" });
        return Ok(new { course = CourseDto.From(course) });
    }

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> Create(CourseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "title is required" });

        var course = new Course
        {
            Title = request.Title.Trim(),
            Description = request.Description ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Courses.Add(course);
        await _db.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created, new { course = CourseDto.From(course) });
    }

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CourseRequest request)
    {
        // Matches CourseRoutes.ts reusing the same validators for create+update:
        // `title` is required even on a partial update.
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "title is required" });

        var course = await _db.Courses.FindAsync(id);
        if (course == null)
            return NotFound(new { message = "Course not found" });

        course.Title = request.Title.Trim();
        if (request.Description != null) course.Description = request.Description;
        course.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { course = CourseDto.From(course) });
    }

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var course = await _db.Courses.FindAsync(id);
        if (course == null)
            return NotFound(new { message = "Course not found" });

        var hasSubjects = await _db.Subjects.AnyAsync(s => s.CourseId == id);
        if (hasSubjects)
            return Conflict(new { message = "Delete this course's subjects first" });

        _db.Courses.Remove(course);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
