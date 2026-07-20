using System.Text.Json.Serialization;
using LmsApi.Models;

namespace LmsApi.Controllers.Dtos.Auth;

// Mirrors AuthController.ts's serializeUser().
public class UserDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int QuestionsAnswered { get; set; }
    public bool HasPassword { get; set; }

    public static UserDto From(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role,
        QuestionsAnswered = user.QuestionsAnswered,
        HasPassword = user.HasPassword,
    };
}

// Mirrors the shape returned by GET /auth/me (the full document minus password/otp fields).
public class MeDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int QuestionsAnswered { get; set; }
    public bool HasPassword { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static MeDto From(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role,
        QuestionsAnswered = user.QuestionsAnswered,
        HasPassword = user.HasPassword,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt,
    };
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class RegisterRequest
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
}

public class LoginRequest
{
    public string? Email { get; set; }
    public string? Password { get; set; }
}

public class SendOtpRequest
{
    public string? Email { get; set; }
}

public class VerifyOtpRequest
{
    public string? Email { get; set; }
    public string? Otp { get; set; }
}

public class UpdateProfileRequest
{
    public string? Name { get; set; }
}

public class UpdatePasswordRequest
{
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
}
