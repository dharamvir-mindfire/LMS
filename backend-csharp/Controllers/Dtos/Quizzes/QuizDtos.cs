using System.Text.Json.Serialization;
using LmsApi.Controllers.Dtos.Subjects;
using LmsApi.Models;

namespace LmsApi.Controllers.Dtos.Quizzes;

// Mirrors listQuizzes: subjects populated ("name slug"), questions left as raw ids.
public class QuizListItemDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<SubjectSummaryDto> Subjects { get; set; } = new();
    public List<int> Questions { get; set; } = new();
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static QuizListItemDto From(Quiz quiz) => new()
    {
        Id = quiz.Id,
        Title = quiz.Title,
        Subjects = quiz.QuizSubjects.Select(qs => SubjectSummaryDto.From(qs.Subject)).ToList(),
        Questions = quiz.QuizQuestions.OrderBy(qq => qq.Order).Select(qq => qq.QuestionId).ToList(),
        CreatedBy = quiz.CreatedById,
        CreatedAt = quiz.CreatedAt,
        UpdatedAt = quiz.UpdatedAt,
    };
}

// A question as it appears nested inside getQuiz's populated `questions` —
// its own `subject` stays a raw id, since the original only calls
// `.populate("questions")`, not a nested populate of each question's subject.
public class NestedQuestionDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public int Subject { get; set; }
    public string Text { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int CorrectOptionIndex { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static NestedQuestionDto From(Question question) => new()
    {
        Id = question.Id,
        Subject = question.SubjectId,
        Text = question.Text,
        Options = question.Options,
        CorrectOptionIndex = question.CorrectOptionIndex,
        Difficulty = question.Difficulty,
        Explanation = question.Explanation,
        CreatedAt = question.CreatedAt,
        UpdatedAt = question.UpdatedAt,
    };
}

// Mirrors getQuiz: subjects populated, questions fully populated.
public class QuizDetailDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<SubjectSummaryDto> Subjects { get; set; } = new();
    public List<NestedQuestionDto> Questions { get; set; } = new();
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static QuizDetailDto From(Quiz quiz) => new()
    {
        Id = quiz.Id,
        Title = quiz.Title,
        Subjects = quiz.QuizSubjects.Select(qs => SubjectSummaryDto.From(qs.Subject)).ToList(),
        Questions = quiz.QuizQuestions.OrderBy(qq => qq.Order).Select(qq => NestedQuestionDto.From(qq.Question)).ToList(),
        CreatedBy = quiz.CreatedById,
        CreatedAt = quiz.CreatedAt,
        UpdatedAt = quiz.UpdatedAt,
    };
}

// Mirrors createQuiz/updateQuiz: returns the raw saved document, with
// `subjects`/`questions` as plain id arrays (no .populate() is called there).
public class QuizSavedDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<int> Subjects { get; set; } = new();
    public List<int> Questions { get; set; } = new();
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static QuizSavedDto From(Quiz quiz) => new()
    {
        Id = quiz.Id,
        Title = quiz.Title,
        Subjects = quiz.QuizSubjects.Select(qs => qs.SubjectId).ToList(),
        Questions = quiz.QuizQuestions.OrderBy(qq => qq.Order).Select(qq => qq.QuestionId).ToList(),
        CreatedBy = quiz.CreatedById,
        CreatedAt = quiz.CreatedAt,
        UpdatedAt = quiz.UpdatedAt,
    };
}

public class QuizRequest
{
    public string? Title { get; set; }
    public List<int>? Subjects { get; set; }
    public List<int>? Questions { get; set; }
}

// Mirrors startQuiz's hand-built response — deliberately omits
// correctOptionIndex/explanation so the client can't see answers up front,
// and `subjects` stays raw ids since only "questions" is populated there.
public class StartQuestionDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public string Difficulty { get; set; } = string.Empty;
}

public class StartQuizDto
{
    [JsonPropertyName("_id")]
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<int> Subjects { get; set; } = new();
    public List<StartQuestionDto> Questions { get; set; } = new();
}

public class SubmitAnswerRequest
{
    public int? Question { get; set; }
    public int? SelectedOptionIndex { get; set; }
}

public class SubmitQuizRequest
{
    public List<SubmitAnswerRequest>? Answers { get; set; }
}

public class SubmitResultItemDto
{
    public int Question { get; set; }
    public string Text { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int CorrectOptionIndex { get; set; }
    public int SelectedOptionIndex { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class SubmitQuizResponse
{
    public int Score { get; set; }
    public int Total { get; set; }
    public int CorrectCount { get; set; }
    public List<SubmitResultItemDto> Results { get; set; } = new();
}
