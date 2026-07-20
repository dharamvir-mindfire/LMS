using LmsApi.Data;
using LmsApi.Controllers.Dtos.Subjects;
using LmsApi.Models;
using LmsApi.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/subjects")]
public class SubjectsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SubjectsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? course)
    {
        var query = _db.Subjects.Include(s => s.Course).AsQueryable();
        if (course.HasValue) query = query.Where(s => s.CourseId == course.Value);

        var subjects = await query.OrderBy(s => s.Name).ToListAsync();
        return Ok(new { subjects = subjects.Select(SubjectDto.From) });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var subject = await _db.Subjects.Include(s => s.Course).FirstOrDefaultAsync(s => s.Id == id);
        if (subject == null)
            return NotFound(new { message = "Subject not found" });
        return Ok(new { subject = SubjectDto.From(subject) });
    }

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> Create(SubjectRequest request)
    {
        if (request.Course == null || !await _db.Courses.AnyAsync(c => c.Id == request.Course))
            return BadRequest(new { message = "a valid course is required" });
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "name is required" });

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
        return StatusCode(StatusCodes.Status201Created, new { subject = SubjectDto.From(subject) });
    }

    // Note: SubjectRoutes.ts applies no validators to PUT /:id — any subset of
    // fields is accepted and applied as-is, unlike POST /.
    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, SubjectRequest request)
    {
        var subject = await _db.Subjects.Include(s => s.Course).FirstOrDefaultAsync(s => s.Id == id);
        if (subject == null)
            return NotFound(new { message = "Subject not found" });

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
        return Ok(new { subject = SubjectDto.From(subject) });
    }

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var subject = await _db.Subjects.FindAsync(id);
        if (subject == null)
            return NotFound(new { message = "Subject not found" });

        var hasQuestions = await _db.Questions.AnyAsync(q => q.SubjectId == id);
        if (hasQuestions)
            return Conflict(new { message = "Delete this subject's questions first" });

        _db.Subjects.Remove(subject);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
