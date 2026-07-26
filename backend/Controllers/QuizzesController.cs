using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Quizzes;
using LmsApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/quizzes")]
public class QuizzesController : ControllerBase
{
    private readonly IQuizService _quizService;

    public QuizzesController(IQuizService quizService)
    {
        _quizService = quizService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? subject) =>
        this.ToActionResult(await _quizService.ListAsync(subject));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => this.ToActionResult(await _quizService.GetAsync(id));

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> Create(QuizRequest request) =>
        this.ToActionResult(await _quizService.CreateAsync(User.GetUserId(), request), StatusCodes.Status201Created);

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, QuizRequest request) =>
        this.ToActionResult(await _quizService.UpdateAsync(id, request));

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        this.ToActionResult(await _quizService.DeleteAsync(id));

    [HttpPost("{id:int}/start")]
    public async Task<IActionResult> Start(int id) => this.ToActionResult(await _quizService.StartAsync(id));

    [HttpPost("{id:int}/submit")]
    public async Task<IActionResult> Submit(int id, SubmitQuizRequest request) =>
        this.ToActionResult(await _quizService.SubmitAsync(id, User.GetUserId(), request));
}
