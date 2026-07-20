using LmsApi.Data;
using LmsApi.Dtos.Home;
using LmsApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/home")]
public class HomeController : ControllerBase
{
    private readonly AppDbContext _db;

    public HomeController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var courseCount = await _db.Courses.CountAsync();
        var subjectCount = await _db.Subjects.CountAsync();
        var quizCount = await _db.Quizzes.CountAsync();
        var user = await _db.Users.FindAsync(User.GetUserId());

        return Ok(new
        {
            stats = new HomeStatsDto
            {
                Courses = courseCount,
                Subjects = subjectCount,
                Quizzes = quizCount,
                QuestionsAnswered = user?.QuestionsAnswered ?? 0,
            },
        });
    }
}
