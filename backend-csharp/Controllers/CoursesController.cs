using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Courses;
using LmsApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/courses")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    [HttpGet]
    public async Task<IActionResult> List() => this.ToActionResult(await _courseService.ListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => this.ToActionResult(await _courseService.GetAsync(id));

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> Create(CourseRequest request) =>
        this.ToActionResult(await _courseService.CreateAsync(request), StatusCodes.Status201Created);

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CourseRequest request) =>
        this.ToActionResult(await _courseService.UpdateAsync(id, request));

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        this.ToActionResult(await _courseService.DeleteAsync(id));
}
