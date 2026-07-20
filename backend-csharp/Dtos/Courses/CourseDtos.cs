using System.Text.Json.Serialization;
using LmsApi.Models;

namespace LmsApi.Dtos.Courses;

public class CourseDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static CourseDto From(Course course) => new()
    {
        Id = course.Id,
        Title = course.Title,
        Description = course.Description,
        CreatedAt = course.CreatedAt,
        UpdatedAt = course.UpdatedAt,
    };
}

public class CourseRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
}

// Mirrors `.populate("course", "title")` — Mongoose always keeps `_id` too.
public class CourseSummaryDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;

    public static CourseSummaryDto From(Course course) => new() { Id = course.Id, Title = course.Title };
}
