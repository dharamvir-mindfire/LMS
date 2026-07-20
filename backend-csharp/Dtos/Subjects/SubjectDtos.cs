using System.Text.Json.Serialization;
using LmsApi.Dtos.Courses;
using LmsApi.Models;

namespace LmsApi.Dtos.Subjects;

public class SubjectDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public CourseSummaryDto Course { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static SubjectDto From(Subject subject) => new()
    {
        Id = subject.Id,
        Course = CourseSummaryDto.From(subject.Course),
        Name = subject.Name,
        Slug = subject.Slug,
        Description = subject.Description,
        CreatedAt = subject.CreatedAt,
        UpdatedAt = subject.UpdatedAt,
    };
}

public class SubjectRequest
{
    public int? Course { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
}

// Mirrors `.populate("subject", "name slug")` used by Questions/Quizzes.
public class SubjectSummaryDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    public static SubjectSummaryDto From(Subject subject) => new()
    {
        Id = subject.Id,
        Name = subject.Name,
        Slug = subject.Slug,
    };
}
