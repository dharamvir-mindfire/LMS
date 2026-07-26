using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Questions;
using LmsApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/questions")]
public class QuestionsController : ControllerBase
{
    private readonly IQuestionService _questionService;

    public QuestionsController(IQuestionService questionService)
    {
        _questionService = questionService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? subject, [FromQuery] string? difficulty) =>
        this.ToActionResult(await _questionService.ListAsync(subject, difficulty));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => this.ToActionResult(await _questionService.GetAsync(id));

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> Create(QuestionRequest request) =>
        this.ToActionResult(await _questionService.CreateAsync(request), StatusCodes.Status201Created);

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, QuestionRequest request) =>
        this.ToActionResult(await _questionService.UpdateAsync(id, request));

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        this.ToActionResult(await _questionService.DeleteAsync(id));

    [HttpPost("{id:int}/answer")]
    public async Task<IActionResult> Answer(int id, AnswerRequest request) =>
        this.ToActionResult(await _questionService.AnswerAsync(id, User.GetUserId(), request));
}
