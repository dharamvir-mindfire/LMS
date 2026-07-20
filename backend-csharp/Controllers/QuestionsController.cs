using LmsApi.Data;
using LmsApi.Dtos.Questions;
using LmsApi.Models;
using LmsApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/questions")]
public class QuestionsController : ControllerBase
{
    private static readonly string[] ValidDifficulties = { "easy", "medium", "hard" };

    private readonly AppDbContext _db;

    public QuestionsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? subject, [FromQuery] string? difficulty)
    {
        var query = _db.Questions.Include(q => q.Subject).AsQueryable();
        if (subject.HasValue) query = query.Where(q => q.SubjectId == subject.Value);
        if (!string.IsNullOrEmpty(difficulty)) query = query.Where(q => q.Difficulty == difficulty);

        var questions = await query.OrderByDescending(q => q.CreatedAt).ToListAsync();
        return Ok(new { questions = questions.Select(QuestionDto.From) });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var question = await _db.Questions.Include(q => q.Subject).FirstOrDefaultAsync(q => q.Id == id);
        if (question == null)
            return NotFound(new { message = "Question not found" });
        return Ok(new { question = QuestionDto.From(question) });
    }

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> Create(QuestionRequest request)
    {
        if (request.Subject == null || !await _db.Subjects.AnyAsync(s => s.Id == request.Subject))
            return BadRequest(new { message = "a valid subject is required" });
        if (string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new { message = "text is required" });
        if (request.Options == null || request.Options.Count < 2)
            return BadRequest(new { message = "at least 2 options are required" });
        if (request.CorrectOptionIndex == null || request.CorrectOptionIndex < 0)
            return BadRequest(new { message = "correctOptionIndex is required" });

        var question = new Question
        {
            SubjectId = request.Subject.Value,
            Text = request.Text,
            Options = request.Options,
            CorrectOptionIndex = request.CorrectOptionIndex.Value,
            Difficulty = ValidDifficulties.Contains(request.Difficulty) ? request.Difficulty! : "medium",
            Explanation = request.Explanation ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.Questions.Add(question);
        await _db.SaveChangesAsync();
        await _db.Entry(question).Reference(q => q.Subject).LoadAsync();
        return StatusCode(StatusCodes.Status201Created, new { question = QuestionDto.From(question) });
    }

    // Note: QuestionRoutes.ts applies no validators to PUT /:id.
    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, QuestionRequest request)
    {
        var question = await _db.Questions.Include(q => q.Subject).FirstOrDefaultAsync(q => q.Id == id);
        if (question == null)
            return NotFound(new { message = "Question not found" });

        if (request.Subject.HasValue) question.SubjectId = request.Subject.Value;
        if (request.Text != null) question.Text = request.Text;
        if (request.Options != null) question.Options = request.Options;
        if (request.CorrectOptionIndex.HasValue) question.CorrectOptionIndex = request.CorrectOptionIndex.Value;
        if (request.Difficulty != null) question.Difficulty = request.Difficulty;
        if (request.Explanation != null) question.Explanation = request.Explanation;
        question.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(question).Reference(q => q.Subject).LoadAsync();
        return Ok(new { question = QuestionDto.From(question) });
    }

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var question = await _db.Questions.FindAsync(id);
        if (question == null)
            return NotFound(new { message = "Question not found" });

        // QuizQuestion rows cascade-delete via FK, mirroring the
        // `Quiz.updateMany($pull)` cleanup in QuestionController.ts.
        _db.Questions.Remove(question);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/answer")]
    public async Task<IActionResult> Answer(int id, AnswerRequest request)
    {
        if (request.SelectedOptionIndex == null || request.SelectedOptionIndex < 0)
            return BadRequest(new { message = "selectedOptionIndex is required" });

        var question = await _db.Questions.FindAsync(id);
        if (question == null)
            return NotFound(new { message = "Question not found" });

        var correct = request.SelectedOptionIndex == question.CorrectOptionIndex;

        var user = await _db.Users.FindAsync(User.GetUserId());
        if (user != null)
        {
            user.QuestionsAnswered += 1;
            await _db.SaveChangesAsync();
        }

        return Ok(new { correct, correctOptionIndex = question.CorrectOptionIndex });
    }
}
