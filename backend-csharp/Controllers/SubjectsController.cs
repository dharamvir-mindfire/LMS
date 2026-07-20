using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Subjects;
using LmsApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/subjects")]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectService _subjectService;

    public SubjectsController(ISubjectService subjectService)
    {
        _subjectService = subjectService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? course) =>
        this.ToActionResult(await _subjectService.ListAsync(course));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => this.ToActionResult(await _subjectService.GetAsync(id));

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> Create(SubjectRequest request) =>
        this.ToActionResult(await _subjectService.CreateAsync(request), StatusCodes.Status201Created);

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, SubjectRequest request) =>
        this.ToActionResult(await _subjectService.UpdateAsync(id, request));

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        this.ToActionResult(await _subjectService.DeleteAsync(id));
}
