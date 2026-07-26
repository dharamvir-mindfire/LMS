using System.Text.Json.Serialization;
using LmsApi.Models;

namespace LmsApi.Controllers.Dtos.Users;

public class UpdateRoleRequest
{
    public string? Role { get; set; }
}

// Mirrors UserController.ts's updateUserRole response, which deliberately
// returns a smaller shape than the list endpoint (no questionsAnswered/hasPassword).
public class UserRoleUpdateDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;

    public static UserRoleUpdateDto From(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role,
    };
}
