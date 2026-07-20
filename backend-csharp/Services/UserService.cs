using FluentResults;
using LmsApi.Contracts.IServices;
using LmsApi.Controllers.Dtos.Auth;
using LmsApi.Controllers.Dtos.Users;
using LmsApi.Data;
using LmsApi.Extensions;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Services;

public class UserService : IUserService
{
    private static readonly string[] ValidRoles = { "admin", "user" };

    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<object>> ListAsync()
    {
        var users = await _db.Users.ToListAsync();
        return Result.Ok<object>(new { users = users.Select(MeDto.From) });
    }

    public async Task<Result<object>> UpdateRoleAsync(int id, UpdateRoleRequest request)
    {
        if (request.Role == null || !ValidRoles.Contains(request.Role))
            return Result.Fail<object>(new HttpError(StatusCodes.Status400BadRequest, "a valid role is required"));

        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return Result.Fail<object>(new HttpError(StatusCodes.Status404NotFound, "User not found"));

        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Result.Ok<object>(new { user = UserRoleUpdateDto.From(user) });
    }

    public async Task<Result> DeleteAsync(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return Result.Fail(new HttpError(StatusCodes.Status404NotFound, "User not found"));

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return Result.Ok();
    }
}
