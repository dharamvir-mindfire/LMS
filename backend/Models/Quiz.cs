namespace LmsApi.Models;

public class Quiz
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<QuizSubject> QuizSubjects { get; set; } = new();
    public List<QuizQuestion> QuizQuestions { get; set; } = new();
}

// Join entity for Quiz <-> Subject (many-to-many).
public class QuizSubject
{
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
}

// Join entity for Quiz <-> Question (many-to-many), Order preserves the
// original array ordering from the source Mongo `questions` field.
public class QuizQuestion
{
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public int QuestionId { get; set; }
    public Question Question { get; set; } = null!;
    public int Order { get; set; }
}
