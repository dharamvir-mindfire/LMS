using System.Text.Json.Serialization;
using LmsApi.Controllers.Dtos.Subjects;
using LmsApi.Models;

namespace LmsApi.Controllers.Dtos.Lessons;

public class LessonMaterialDto
{
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;

    public static LessonMaterialDto From(LessonMaterial material) => new()
    {
        Title = material.Title,
        Url = material.Url,
    };
}

public class LessonDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public SubjectSummaryDto Subject { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public List<LessonMaterialDto> Materials { get; set; } = new();
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static LessonDto From(Lesson lesson) => new()
    {
        Id = lesson.Id,
        Subject = SubjectSummaryDto.From(lesson.Subject),
        Title = lesson.Title,
        Content = lesson.Content,
        VideoUrl = lesson.VideoUrl,
        Materials = lesson.Materials.Select(LessonMaterialDto.From).ToList(),
        Order = lesson.Order,
        CreatedAt = lesson.CreatedAt,
        UpdatedAt = lesson.UpdatedAt,
    };
}

public class LessonMaterialRequest
{
    public string? Title { get; set; }
    public string? Url { get; set; }
}

public class LessonRequest
{
    public int? Subject { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? VideoUrl { get; set; }
    public List<LessonMaterialRequest>? Materials { get; set; }
    public int? Order { get; set; }
}
