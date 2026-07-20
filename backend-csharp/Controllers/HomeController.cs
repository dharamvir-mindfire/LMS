using LmsApi.Contracts.IServices;
using LmsApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LmsApi.Controllers;

[ApiController]
[Authorize]
[Route("api/home")]
public class HomeController : ControllerBase
{
    private readonly IHomeService _homeService;

    public HomeController(IHomeService homeService)
    {
        _homeService = homeService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats() => this.ToActionResult(await _homeService.GetStatsAsync(User.GetUserId()));
}
