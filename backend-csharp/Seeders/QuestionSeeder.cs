using LmsApi.Data;
using LmsApi.Models;
using LmsApi.Utils;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Seeders;

public static class QuestionSeeder
{
    private static async Task<Course> UpsertCourseAsync(AppDbContext db, string title, string description)
    {
        var existing = await db.Courses.FirstOrDefaultAsync(c => c.Title == title);
        if (existing != null) return existing;

        var course = new Course { Title = title, Description = description, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        db.Courses.Add(course);
        await db.SaveChangesAsync();
        Console.WriteLine($"Created course: {course.Title}");
        return course;
    }

    private static async Task<Subject> UpsertSubjectAsync(AppDbContext db, Course course, string name, string description)
    {
        var existing = await db.Subjects.FirstOrDefaultAsync(s => s.Name == name);
        if (existing != null) return existing;

        var subject = new Subject
        {
            CourseId = course.Id,
            Name = name,
            Slug = Slugify.ToSlug(name),
            Description = description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Subjects.Add(subject);
        await db.SaveChangesAsync();
        Console.WriteLine($"Created subject: {subject.Name}");
        return subject;
    }

    private static async Task<Question> UpsertQuestionAsync(
        AppDbContext db, Subject subject, string text, string[] options, int correctOptionIndex, string difficulty)
    {
        var existing = await db.Questions.FirstOrDefaultAsync(q => q.SubjectId == subject.Id && q.Text == text);
        if (existing != null) return existing;

        var question = new Question
        {
            SubjectId = subject.Id,
            Text = text,
            Options = options.ToList(),
            CorrectOptionIndex = correctOptionIndex,
            Difficulty = difficulty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Questions.Add(question);
        await db.SaveChangesAsync();
        Console.WriteLine($"Created question: {question.Text}");
        return question;
    }

    public static async Task RunAsync(AppDbContext db)
    {
        var admin = await db.Users.FirstOrDefaultAsync(u => u.Email == "admin@admin.com");
        if (admin == null)
            throw new InvalidOperationException("Run the user seeder first: dotnet run -- seed:users");

        var jsCourse = await UpsertCourseAsync(db, "Web Development", "Front-end and back-end web fundamentals.");
        var mathCourse = await UpsertCourseAsync(db, "Mathematics", "Core math skills.");

        var javascript = await UpsertSubjectAsync(db, jsCourse, "JavaScript", "The language of the web.");
        var generalKnowledge = await UpsertSubjectAsync(db, mathCourse, "General Knowledge", "Everyday facts and trivia.");

        var javascriptQuestions = new List<Question>
        {
            await UpsertQuestionAsync(db, javascript, "Which keyword declares a block-scoped variable?", new[] { "var", "let", "function", "class" }, 1, "easy"),
            await UpsertQuestionAsync(db, javascript, "What does '===' check that '==' does not?", new[] { "Value only", "Type and value", "Nothing", "Reference only" }, 1, "medium"),
            await UpsertQuestionAsync(db, javascript, "Which method converts JSON text into an object?", new[] { "JSON.stringify", "JSON.parse", "JSON.object", "JSON.toObject" }, 1, "easy"),
            await UpsertQuestionAsync(db, javascript, "What is the output of typeof NaN?", new[] { "'nan'", "'undefined'", "'number'", "'object'" }, 2, "hard"),
        };

        var generalQuestions = new List<Question>
        {
            await UpsertQuestionAsync(db, generalKnowledge, "What is the capital of France?", new[] { "Berlin", "Madrid", "Paris", "Rome" }, 2, "easy"),
            await UpsertQuestionAsync(db, generalKnowledge, "How many continents are there on Earth?", new[] { "5", "6", "7", "8" }, 2, "easy"),
            await UpsertQuestionAsync(db, generalKnowledge, "What is the largest planet in our solar system?", new[] { "Earth", "Jupiter", "Saturn", "Mars" }, 1, "medium"),
            await UpsertQuestionAsync(db, generalKnowledge, "Which gas do plants primarily absorb from the atmosphere?", new[] { "Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen" }, 2, "medium"),
        };

        var quizzes = new[]
        {
            (title: "JavaScript Basics", subject: javascript, questions: javascriptQuestions),
            (title: "General Knowledge Quiz", subject: generalKnowledge, questions: generalQuestions),
        };

        foreach (var quizSpec in quizzes)
        {
            var existing = await db.Quizzes.FirstOrDefaultAsync(q => q.Title == quizSpec.title);
            if (existing != null) continue;

            var quiz = new Quiz
            {
                Title = quizSpec.title,
                CreatedById = admin.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                QuizSubjects = new List<QuizSubject> { new() { SubjectId = quizSpec.subject.Id } },
                QuizQuestions = quizSpec.questions.Select((q, index) => new QuizQuestion { QuestionId = q.Id, Order = index }).ToList(),
            };
            db.Quizzes.Add(quiz);
            await db.SaveChangesAsync();
            Console.WriteLine($"Created quiz: {quiz.Title}");
        }

        Console.WriteLine("\nSeed data ready: 2 courses, 2 subjects, 8 questions, 2 quizzes.");
    }
}
