using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Lessons;
using LmsApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/lessons")]
public class LessonsController : ControllerBase
{
    private readonly ILessonService _lessonService;

    public LessonsController(ILessonService lessonService)
    {
        _lessonService = lessonService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? subject) =>
        this.ToActionResult(await _lessonService.ListAsync(subject));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => this.ToActionResult(await _lessonService.GetAsync(id));

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> Create(LessonRequest request) =>
        this.ToActionResult(await _lessonService.CreateAsync(request), StatusCodes.Status201Created);

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, LessonRequest request) =>
        this.ToActionResult(await _lessonService.UpdateAsync(id, request));

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        this.ToActionResult(await _lessonService.DeleteAsync(id));
}
