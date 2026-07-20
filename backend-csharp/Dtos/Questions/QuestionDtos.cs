using System.Text.Json.Serialization;
using LmsApi.Dtos.Subjects;
using LmsApi.Models;

namespace LmsApi.Dtos.Questions;

public class QuestionDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public SubjectSummaryDto Subject { get; set; } = null!;
    public string Text { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int CorrectOptionIndex { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static QuestionDto From(Question question) => new()
    {
        Id = question.Id,
        Subject = SubjectSummaryDto.From(question.Subject),
        Text = question.Text,
        Options = question.Options,
        CorrectOptionIndex = question.CorrectOptionIndex,
        Difficulty = question.Difficulty,
        Explanation = question.Explanation,
        CreatedAt = question.CreatedAt,
        UpdatedAt = question.UpdatedAt,
    };
}

public class QuestionRequest
{
    public int? Subject { get; set; }
    public string? Text { get; set; }
    public List<string>? Options { get; set; }
    public int? CorrectOptionIndex { get; set; }
    public string? Difficulty { get; set; }
    public string? Explanation { get; set; }
}

public class AnswerRequest
{
    public int? SelectedOptionIndex { get; set; }
}
