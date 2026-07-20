using LmsApi.Data;
using LmsApi.Dtos.Auth;
using LmsApi.Dtos.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Controllers;

// Mirrors UserRoutes.ts's `router.use(protect, adminOnly)` — every action here requires an admin.
[ApiController]
[Authorize(Roles = "admin")]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private static readonly string[] ValidRoles = { "admin", "user" };

    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var users = await _db.Users.ToListAsync();
        return Ok(new { users = users.Select(MeDto.From) });
    }

    [HttpPatch("{id:int}/role")]
    public async Task<IActionResult> UpdateRole(int id, UpdateRoleRequest request)
    {
        if (request.Role == null || !ValidRoles.Contains(request.Role))
            return BadRequest(new { message = "a valid role is required" });

        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { user = UserRoleUpdateDto.From(user) });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
