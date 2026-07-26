using FluentResults;
using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Home;
using LmsApi.Data;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Services;

public class HomeService : IHomeService
{
    private readonly AppDbContext _db;

    public HomeService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<object>> GetStatsAsync(int userId)
    {
        var courseCount = await _db.Courses.CountAsync();
        var subjectCount = await _db.Subjects.CountAsync();
        var lessonCount = await _db.Lessons.CountAsync();
        var quizCount = await _db.Quizzes.CountAsync();
        var user = await _db.Users.FindAsync(userId);

        return Result.Ok<object>(new
        {
            stats = new HomeStatsDto
            {
                Courses = courseCount,
                Subjects = subjectCount,
                Lessons = lessonCount,
                Quizzes = quizCount,
                QuestionsAnswered = user?.QuestionsAnswered ?? 0,
            },
        });
    }
}
