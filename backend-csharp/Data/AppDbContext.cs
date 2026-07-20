using System.Text.Json;
using LmsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LmsApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizSubject> QuizSubjects => Set<QuizSubject>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasIndex(c => c.Title).IsUnique();
        });

        modelBuilder.Entity<Subject>(entity =>
        {
            entity.HasIndex(s => s.Name).IsUnique();
            entity.HasIndex(s => s.Slug).IsUnique();

            // A course cannot be deleted while it still has subjects — mirrors
            // the 409 guard in CourseController; Restrict enforces it at the DB too.
            entity.HasOne(s => s.Course)
                .WithMany(c => c.Subjects)
                .HasForeignKey(s => s.CourseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Question>(entity =>
        {
            // Mongoose stores `options` as a native array; SQL Server has no
            // array column type, so it's persisted as a JSON string here.
            entity.Property(q => q.Options)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
                .Metadata.SetValueComparer(new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<string>>(
                    (a, b) => (a ?? new()).SequenceEqual(b ?? new()),
                    v => v.Aggregate(0, (hash, s) => HashCode.Combine(hash, s.GetHashCode())),
                    v => v.ToList()));

            // A subject cannot be deleted while it still has questions —
            // mirrors the 409 guard in SubjectController.
            entity.HasOne(q => q.Subject)
                .WithMany(s => s.Questions)
                .HasForeignKey(q => q.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Quiz>(entity =>
        {
            // The original Mongo schema has no referential integrity: deleting
            // a user leaves any quizzes they authored untouched. SetNull is the
            // closest relational equivalent (deletion is never blocked here).
            entity.HasOne(q => q.CreatedBy)
                .WithMany()
                .HasForeignKey(q => q.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<QuizSubject>(entity =>
        {
            entity.HasKey(qs => new { qs.QuizId, qs.SubjectId });
            entity.HasOne(qs => qs.Quiz)
                .WithMany(q => q.QuizSubjects)
                .HasForeignKey(qs => qs.QuizId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(qs => qs.Subject)
                .WithMany(s => s.QuizSubjects)
                .HasForeignKey(qs => qs.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuizQuestion>(entity =>
        {
            entity.HasKey(qq => new { qq.QuizId, qq.QuestionId });
            entity.HasOne(qq => qq.Quiz)
                .WithMany(q => q.QuizQuestions)
                .HasForeignKey(qq => qq.QuizId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(qq => qq.Question)
                .WithMany(q => q.QuizQuestions)
                .HasForeignKey(qq => qq.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
