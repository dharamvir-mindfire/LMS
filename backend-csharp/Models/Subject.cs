namespace LmsApi.Models;

public class Subject
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<Question> Questions { get; set; } = new();
    public List<QuizSubject> QuizSubjects { get; set; } = new();
}
