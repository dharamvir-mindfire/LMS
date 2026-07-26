using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Users;
using LmsApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LmsApi.Controllers;

// Mirrors UserRoutes.ts's `router.use(protect, adminOnly)` — every action here requires an admin.
[ApiController]
[Authorize(Roles = "admin")]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> List() => this.ToActionResult(await _userService.ListAsync());

    [HttpPatch("{id:int}/role")]
    public async Task<IActionResult> UpdateRole(int id, UpdateRoleRequest request) =>
        this.ToActionResult(await _userService.UpdateRoleAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => this.ToActionResult(await _userService.DeleteAsync(id));
}
