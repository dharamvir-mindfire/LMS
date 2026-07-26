using FluentResults;
using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Questions;
using LmsApi.Data;
using LmsApi.Extensions;
using LmsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Services;

public class QuestionService : IQuestionService
{
    private static readonly string[] ValidDifficulties = { "easy", "medium", "hard" };

    private readonly AppDbContext _db;

    public QuestionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<object>> ListAsync(int? subjectId, string? difficulty)
    {
        var query = _db.Questions.Include(q => q.Subject).AsQueryable();
        if (subjectId.HasValue) query = query.Where(q => q.SubjectId == subjectId.Value);
        if (!string.IsNullOrEmpty(difficulty)) query = query.Where(q => q.Difficulty == difficulty);

        var questions = await query.OrderByDescending(q => q.CreatedAt).ToListAsync();
        return Result.Ok<object>(new { questions = questions.Select(QuestionDto.From) });
    }

    public async Task<Result<object>> GetAsync(int id)
    {
        var question = await _db.Questions.Include(q => q.Subject).FirstOrDefaultAsync(q => q.Id == id);
        if (question == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Question not found"));

        return Result.Ok<object>(new { question = QuestionDto.From(question) });
    }

    public async Task<Result<object>> CreateAsync(QuestionRequest request)
    {
        if (request.Subject == null || !await _db.Subjects.AnyAsync(s => s.Id == request.Subject))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid subject is required"));
        if (string.IsNullOrWhiteSpace(request.Text))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "text is required"));
        if (request.Options == null || request.Options.Count < 2)
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "at least 2 options are required"));
        if (request.CorrectOptionIndex == null || request.CorrectOptionIndex < 0)
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "correctOptionIndex is required"));

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
        return Result.Ok<object>(new { question = QuestionDto.From(question) });
    }

    // Note: QuestionRoutes.ts applies no validators to PUT /:id.
    public async Task<Result<object>> UpdateAsync(int id, QuestionRequest request)
    {
        var question = await _db.Questions.Include(q => q.Subject).FirstOrDefaultAsync(q => q.Id == id);
        if (question == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Question not found"));

        if (request.Subject.HasValue) question.SubjectId = request.Subject.Value;
        if (request.Text != null) question.Text = request.Text;
        if (request.Options != null) question.Options = request.Options;
        if (request.CorrectOptionIndex.HasValue) question.CorrectOptionIndex = request.CorrectOptionIndex.Value;
        if (request.Difficulty != null) question.Difficulty = request.Difficulty;
        if (request.Explanation != null) question.Explanation = request.Explanation;
        question.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(question).Reference(q => q.Subject).LoadAsync();
        return Result.Ok<object>(new { question = QuestionDto.From(question) });
    }

    public async Task<Result> DeleteAsync(int id)
    {
        var question = await _db.Questions.FindAsync(id);
        if (question == null)
            return Result.Fail(new HttpError(StatusCodes.Status404NotFound, "Question not found"));

        // QuizQuestion rows cascade-delete via FK, mirroring the
        // `Quiz.updateMany($pull)` cleanup in QuestionController.ts.
        _db.Questions.Remove(question);
        await _db.SaveChangesAsync();
        return Result.Ok();
    }

    public async Task<Result<object>> AnswerAsync(int id, int userId, AnswerRequest request)
    {
        if (request.SelectedOptionIndex == null || request.SelectedOptionIndex < 0)
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "selectedOptionIndex is required"));

        var question = await _db.Questions.FindAsync(id);
        if (question == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Question not found"));

        var correct = request.SelectedOptionIndex == question.CorrectOptionIndex;

        var user = await _db.Users.FindAsync(userId);
        if (user != null)
        {
            user.QuestionsAnswered += 1;
            await _db.SaveChangesAsync();
        }

        return Result.Ok<object>(new { correct, correctOptionIndex = question.CorrectOptionIndex });
    }
}
