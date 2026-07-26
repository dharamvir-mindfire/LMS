namespace LmsApi.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool HasPassword { get; set; } = true;
    public string Role { get; set; } = "user";
    public int QuestionsAnswered { get; set; }
    public string? OtpCode { get; set; }
    public DateTime? OtpExpiresAt { get; set; }
    public int OtpAttempts { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
