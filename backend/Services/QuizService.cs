using FluentResults;
using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Quizzes;
using LmsApi.Data;
using LmsApi.Extensions;
using LmsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Services;

public class QuizService : IQuizService
{
    private readonly AppDbContext _db;

    public QuizService(AppDbContext db)
    {
        _db = db;
    }

    private IQueryable<Quiz> QuizzesWithSubjects() =>
        _db.Quizzes.Include(q => q.QuizSubjects).ThenInclude(qs => qs.Subject);

    private IQueryable<Quiz> QuizzesWithSubjectsAndQuestions() =>
        QuizzesWithSubjects().Include(q => q.QuizQuestions).ThenInclude(qq => qq.Question);

    public async Task<Result<object>> ListAsync(int? subjectId)
    {
        IQueryable<Quiz> query = QuizzesWithSubjects().Include(q => q.QuizQuestions);
        if (subjectId.HasValue) query = query.Where(q => q.QuizSubjects.Any(qs => qs.SubjectId == subjectId.Value));

        var quizzes = await query.OrderByDescending(q => q.CreatedAt).ToListAsync();
        return Result.Ok<object>(new { quizzes = quizzes.Select(QuizListItemDto.From) });
    }

    public async Task<Result<object>> GetAsync(int id)
    {
        var quiz = await QuizzesWithSubjectsAndQuestions().FirstOrDefaultAsync(q => q.Id == id);
        if (quiz == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Quiz not found"));

        return Result.Ok<object>(new { quiz = QuizDetailDto.From(quiz) });
    }

    public async Task<Result<object>> CreateAsync(int userId, QuizRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "title is required"));
        if (request.Subjects == null || request.Subjects.Count < 1)
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "at least 1 subject is required"));
        var subjectIds = await _db.Subjects.Where(s => request.Subjects.Contains(s.Id)).Select(s => s.Id).ToListAsync();
        if (subjectIds.Count != request.Subjects.Distinct().Count())
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid subject is required"));
        if (request.Questions == null || request.Questions.Count < 1)
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "at least 1 question is required"));

        var questionIds = await _db.Questions.Where(q => request.Questions.Contains(q.Id)).Select(q => q.Id).ToListAsync();

        var quiz = new Quiz
        {
            Title = request.Title.Trim(),
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            QuizSubjects = subjectIds.Select(sid => new QuizSubject { SubjectId = sid }).ToList(),
            QuizQuestions = request.Questions
                .Where(questionIds.Contains)
                .Select((qid, index) => new QuizQuestion { QuestionId = qid, Order = index })
                .ToList(),
        };
        _db.Quizzes.Add(quiz);
        await _db.SaveChangesAsync();
        return Result.Ok<object>(new { quiz = QuizSavedDto.From(quiz) });
    }

    // Note: QuizRoutes.ts applies no validators to PUT /:id.
    public async Task<Result<object>> UpdateAsync(int id, QuizRequest request)
    {
        var quiz = await _db.Quizzes
            .Include(q => q.QuizSubjects)
            .Include(q => q.QuizQuestions)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (quiz == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Quiz not found"));

        if (request.Title != null) quiz.Title = request.Title;

        if (request.Subjects != null)
        {
            var subjectIds = await _db.Subjects.Where(s => request.Subjects.Contains(s.Id)).Select(s => s.Id).ToListAsync();
            quiz.QuizSubjects.Clear();
            foreach (var sid in subjectIds) quiz.QuizSubjects.Add(new QuizSubject { QuizId = quiz.Id, SubjectId = sid });
        }

        if (request.Questions != null)
        {
            var questionIds = await _db.Questions.Where(q => request.Questions.Contains(q.Id)).Select(q => q.Id).ToListAsync();
            quiz.QuizQuestions.Clear();
            var order = 0;
            foreach (var qid in request.Questions.Where(questionIds.Contains))
                quiz.QuizQuestions.Add(new QuizQuestion { QuizId = quiz.Id, QuestionId = qid, Order = order++ });
        }

        quiz.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result.Ok<object>(new { quiz = QuizSavedDto.From(quiz) });
    }

    public async Task<Result> DeleteAsync(int id)
    {
        var quiz = await _db.Quizzes.FindAsync(id);
        if (quiz == null)
            return Result.Fail(new HttpError(StatusCodes.Status404NotFound, "Quiz not found"));

        _db.Quizzes.Remove(quiz);
        await _db.SaveChangesAsync();
        return Result.Ok();
    }

    public async Task<Result<object>> StartAsync(int id)
    {
        var quiz = await _db.Quizzes
            .Include(q => q.QuizSubjects)
            .Include(q => q.QuizQuestions).ThenInclude(qq => qq.Question)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (quiz == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Quiz not found"));

        var dto = new StartQuizDto
        {
            Id = quiz.Id,
            Title = quiz.Title,
            Subjects = quiz.QuizSubjects.Select(qs => qs.SubjectId).ToList(),
            Questions = quiz.QuizQuestions.OrderBy(qq => qq.Order).Select(qq => new StartQuestionDto
            {
                Id = qq.Question.Id,
                Text = qq.Question.Text,
                Options = qq.Question.Options,
                Difficulty = qq.Question.Difficulty,
            }).ToList(),
        };
        return Result.Ok<object>(new { quiz = dto });
    }

    public async Task<Result<object>> SubmitAsync(int id, int userId, SubmitQuizRequest request)
    {
        if (request.Answers == null || request.Answers.Count < 1)
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "at least 1 answer is required"));

        var quiz = await _db.Quizzes.FindAsync(id);
        if (quiz == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "Quiz not found"));

        var questionIds = request.Answers.Where(a => a.Question.HasValue).Select(a => a.Question!.Value).ToList();
        var questions = await _db.Questions.Where(q => questionIds.Contains(q.Id)).ToDictionaryAsync(q => q.Id);

        var correctCount = 0;
        var results = new List<SubmitResultItemDto>();
        foreach (var answer in request.Answers)
        {
            questions.TryGetValue(answer.Question ?? -1, out var question);
            var isCorrect = question != null && question.CorrectOptionIndex == answer.SelectedOptionIndex;
            if (isCorrect) correctCount += 1;

            results.Add(new SubmitResultItemDto
            {
                Question = answer.Question ?? 0,
                Text = question?.Text ?? string.Empty,
                Options = question?.Options ?? new List<string>(),
                CorrectOptionIndex = question?.CorrectOptionIndex ?? -1,
                SelectedOptionIndex = answer.SelectedOptionIndex ?? 0,
                Explanation = question?.Explanation ?? string.Empty,
                IsCorrect = isCorrect,
            });
        }

        var user = await _db.Users.FindAsync(userId);
        if (user != null)
        {
            user.QuestionsAnswered += request.Answers.Count;
            await _db.SaveChangesAsync();
        }

        return Result.Ok<object>(new SubmitQuizResponse
        {
            Score = correctCount,
            Total = request.Answers.Count,
            CorrectCount = correctCount,
            Results = results,
        });
    }
}
